import Product from "../models/product.js";
import Order from "../models/order.js";
import Category from "../models/category.js";
import User from "../models/user.js";
import Setting from "../models/setting.js";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// -------------------------------------------------------------
// 1. Data Analytics Core Engines (Real-Time Database Calculators)
// -------------------------------------------------------------

export async function getStoreOverviewData() {
  const [products, orders, categories] = await Promise.all([
    Product.find().lean(),
    Order.find().lean(),
    Category.find().lean(),
  ]);

  let totalActualStock = 0;
  let totalVisibleStock = 0;
  let totalRetailValue = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;
  const categoryMap = {};
  const brandMap = {};

  products.forEach((p) => {
    const actStock = Number(p.actualStock ?? p.quantity ?? 0);
    const visStock = Number(p.visibleStock ?? actStock);
    const price = Number(p.price) || 0;

    totalActualStock += actStock;
    totalVisibleStock += visStock;
    totalRetailValue += actStock * price;

    if (actStock <= 0) outOfStockCount++;
    else if (actStock < 5) lowStockCount++;

    const cat = p.category || "General";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;

    const brand = p.brand || "Unbranded";
    brandMap[brand] = (brandMap[brand] || 0) + 1;
  });

  let totalRevenue = 0;
  let directSalesRevenue = 0;
  let onlineOrdersRevenue = 0;
  let directCount = 0;
  let onlineCount = 0;

  orders.forEach((o) => {
    const orderTotal =
      Number(o.totalPrice) ||
      (o.items || []).reduce(
        (sum, it) =>
          sum + Number(it.priceAtPurchase || 0) * Number(it.quantity || 1),
        0
      );

    totalRevenue += orderTotal;
    if (o.saleType === "direct") {
      directCount++;
      directSalesRevenue += orderTotal;
    } else {
      onlineCount++;
      onlineOrdersRevenue += orderTotal;
    }
  });

  const aov = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  return {
    totalProducts: products.length,
    totalCategories: categories.length,
    totalOrders: orders.length,
    directSalesCount: directCount,
    onlineOrdersCount: onlineCount,
    totalRevenueETB: totalRevenue,
    directSalesRevenueETB: directSalesRevenue,
    onlineOrdersRevenueETB: onlineOrdersRevenue,
    averageOrderValueETB: aov,
    totalActualStockUnits: totalActualStock,
    totalVisibleStockUnits: totalVisibleStock,
    totalInventoryValuationETB: Math.round(totalRetailValue),
    outOfStockCount,
    lowStockCount,
    categoriesSummary: categoryMap,
    brandsSummary: brandMap,
  };
}

export async function getRestockPredictionsData(daysLookback = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysLookback);

  const [products, orders] = await Promise.all([
    Product.find().lean(),
    Order.find({ createdAt: { $gte: cutoffDate } }).lean(),
  ]);

  // Map product sales quantity & revenue in lookback window
  const salesMap = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const pid = String(item.product?._id || item.product || item.productId || "");
      if (!pid) return;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.priceAtPurchase || item.price || 0);

      if (!salesMap[pid]) {
        salesMap[pid] = { unitsSold: 0, revenue: 0 };
      }
      salesMap[pid].unitsSold += qty;
      salesMap[pid].revenue += qty * price;
    });
  });

  const items = products.map((p) => {
    const pid = String(p._id);
    const sold = salesMap[pid]?.unitsSold || 0;
    const rev = salesMap[pid]?.revenue || 0;
    const currentStock = Number(p.actualStock ?? p.quantity ?? 0);
    const price = Number(p.price) || 0;

    // Daily run rate
    const dailyVelocity = sold > 0 ? Number((sold / daysLookback).toFixed(2)) : 0;
    
    // Days until stockout
    let daysUntilStockout = null;
    let urgency = "HEALTHY";

    if (currentStock <= 0) {
      daysUntilStockout = 0;
      urgency = "CRITICAL_OUT_OF_STOCK";
    } else if (dailyVelocity > 0) {
      daysUntilStockout = Math.round(currentStock / dailyVelocity);
      if (daysUntilStockout <= 3) urgency = "CRITICAL";
      else if (daysUntilStockout <= 7) urgency = "URGENT";
      else if (daysUntilStockout <= 14) urgency = "MODERATE";
      else urgency = "HEALTHY";
    } else if (currentStock < 5) {
      urgency = "LOW_STOCK_NO_RECENT_SALES";
    }

    // Suggested reorder quantity for a 30-day buffer
    const suggestedReorderQty =
      dailyVelocity > 0
        ? Math.max(10, Math.ceil(dailyVelocity * 30 - currentStock))
        : currentStock < 5
        ? 15
        : 0;

    return {
      productId: pid,
      name: p.name,
      brand: p.brand || "General",
      category: p.category || "General",
      price,
      currentStock,
      unitsSoldPast30Days: sold,
      revenuePast30Days: rev,
      dailySalesVelocity: dailyVelocity,
      daysUntilStockout,
      urgency,
      suggestedReorderQty,
      imageUrl: p.images?.[0] || null,
    };
  });

  // Sort: Critical stockouts first, then lowest days until stockout
  const urgencyWeight = {
    CRITICAL_OUT_OF_STOCK: 1,
    CRITICAL: 2,
    URGENT: 3,
    MODERATE: 4,
    LOW_STOCK_NO_RECENT_SALES: 5,
    HEALTHY: 6,
  };

  items.sort((a, b) => {
    const wA = urgencyWeight[a.urgency] || 99;
    const wB = urgencyWeight[b.urgency] || 99;
    if (wA !== wB) return wA - wB;
    return (a.daysUntilStockout ?? 999) - (b.daysUntilStockout ?? 999);
  });

  const criticalCount = items.filter((i) => i.urgency.startsWith("CRITICAL")).length;
  const urgentCount = items.filter((i) => i.urgency === "URGENT").length;

  return {
    analysisWindowDays: daysLookback,
    criticalCount,
    urgentCount,
    predictions: items,
  };
}

export async function getDeadStockData(daysLookback = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysLookback);

  const [products, recentOrders] = await Promise.all([
    Product.find().lean(),
    Order.find({ createdAt: { $gte: cutoffDate } }).lean(),
  ]);

  const activeSoldProductIds = new Set();
  recentOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const pid = String(item.product?._id || item.product || item.productId || "");
      if (pid) activeSoldProductIds.add(pid);
    });
  });

  // Filter products with stock >= 5 and 0 sales in the lookback window
  const deadStock = [];
  let totalTiedUpCapital = 0;

  products.forEach((p) => {
    const pid = String(p._id);
    const stock = Number(p.actualStock ?? p.quantity ?? 0);
    const price = Number(p.price) || 0;

    if (!activeSoldProductIds.has(pid) && stock >= 3) {
      const capital = stock * price;
      totalTiedUpCapital += capital;

      let strategy = "Promote with 15% discount banner";
      if (capital > 5000) strategy = "Bundle with top-selling bestseller + 20% off";
      else if (stock > 20) strategy = "Clearance flash sale to recover cash flow";

      deadStock.push({
        productId: pid,
        name: p.name,
        category: p.category || "General",
        brand: p.brand || "General",
        price,
        currentStock: stock,
        tiedUpCapitalETB: capital,
        recommendedLiquidationStrategy: strategy,
        imageUrl: p.images?.[0] || null,
      });
    }
  });

  deadStock.sort((a, b) => b.tiedUpCapitalETB - a.tiedUpCapitalETB);

  return {
    daysLookback,
    deadStockItemsCount: deadStock.length,
    totalTiedUpCapitalETB: totalTiedUpCapital,
    items: deadStock,
  };
}

export async function getSalesVelocityAndRevenueData() {
  const [products, orders] = await Promise.all([
    Product.find().lean(),
    Order.find().lean(),
  ]);

  const productMap = {};
  products.forEach((p) => {
    productMap[String(p._id)] = p;
  });

  const performanceMap = {};
  let totalRevenue = 0;
  let counterRevenue = 0;
  let onlineRevenue = 0;

  orders.forEach((o) => {
    const isDirect = o.saleType === "direct";
    (o.items || []).forEach((it) => {
      const pid = String(it.product?._id || it.product || it.productId || "");
      const prod = productMap[pid] || it.product || {};
      const name = prod.name || it.name || "Product";
      const brand = prod.brand || "General";
      const category = prod.category || "General";
      const qty = Number(it.quantity) || 1;
      const price = Number(it.priceAtPurchase || it.price || prod.price || 0);
      const subtotal = qty * price;

      totalRevenue += subtotal;
      if (isDirect) counterRevenue += subtotal;
      else onlineRevenue += subtotal;

      if (!performanceMap[name]) {
        performanceMap[name] = {
          name,
          brand,
          category,
          unitsSold: 0,
          revenue: 0,
          ordersCount: 0,
        };
      }
      performanceMap[name].unitsSold += qty;
      performanceMap[name].revenue += subtotal;
      performanceMap[name].ordersCount += 1;
    });
  });

  const topSellersByRevenue = Object.values(performanceMap).sort(
    (a, b) => b.revenue - a.revenue
  );

  const topSellersByVolume = Object.values(performanceMap).sort(
    (a, b) => b.unitsSold - a.unitsSold
  );

  return {
    totalRevenueETB: totalRevenue,
    counterSalesRevenueETB: counterRevenue,
    onlineDeliveryRevenueETB: onlineRevenue,
    counterSharePercent: totalRevenue > 0 ? Math.round((counterRevenue / totalRevenue) * 100) : 0,
    onlineSharePercent: totalRevenue > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 0,
    topSellersByRevenue: topSellersByRevenue.slice(0, 10),
    topSellersByVolume: topSellersByVolume.slice(0, 10),
  };
}

// -------------------------------------------------------------
// 2. Multi-Domain Autonomous Retail AI Engine (Universal NLP Parser)
// -------------------------------------------------------------
function generateAutonomousReport(prompt, overview, restock, deadStock, sales, allProducts = []) {
  const pLower = (prompt || "").trim().toLowerCase();

  // 1. SPECIFIC PRODUCT DEEP-DIVE QUERY
  // Check if the user is asking about a specific product in the store
  const matchedProduct = allProducts.find((p) => {
    const pName = (p.name || "").toLowerCase();
    const pBrand = (p.brand || "").toLowerCase();
    // Match product name if user prompt includes key parts (length > 3)
    const keywords = pName.split(/[\s,/-]+/).filter((w) => w.length > 3);
    return (
      (pBrand && pLower.includes(pBrand)) ||
      keywords.some((k) => pLower.includes(k)) ||
      pLower.includes(pName)
    );
  });

  if (matchedProduct && (pLower.includes("about") || pLower.includes("product") || pLower.includes("stock") || pLower.includes("how is") || pLower.includes("tell me") || pLower.includes("status") || pLower.includes("price"))) {
    const actStock = Number(matchedProduct.actualStock ?? matchedProduct.quantity ?? 0);
    const visStock = Number(matchedProduct.visibleStock ?? actStock);
    const price = Number(matchedProduct.price || 0);
    const pred = restock.predictions.find(
      (p) => String(p.productId) === String(matchedProduct._id)
    );
    const velocity = pred?.dailySalesVelocity || 0;
    const daysLeft = pred?.daysUntilStockout !== null && pred?.daysUntilStockout !== undefined
      ? `${pred.daysUntilStockout} days`
      : "Adequate buffer";

    return `### 🔍 Product Intelligence: **${matchedProduct.name}**

#### 📊 Live Status & Inventory:
- **Brand:** \`${matchedProduct.brand || "DS Style"}\`
- **Category:** \`${matchedProduct.category || "Cosmetics"}\`
- **Retail Price:** **${price.toLocaleString()} ETB**
- **Actual Physical Stock:** \`${actStock} units\`
- **Visible Online Stock:** \`${visStock} units\`
- **Sales Velocity:** \`${velocity} units/day\` (Past 30 days)
- **Estimated Runway:** **${daysLeft}**
- **Inventory Valuation:** **${(actStock * price).toLocaleString()} ETB**

#### 💡 Retail Advisor Diagnosis:
${
  actStock <= 0
    ? `🚨 **Urgent Stockout:** This item is currently out of stock. Reorder immediately to avoid lost revenue and customer bounce.`
    : actStock < 5
    ? `⚠️ **Low Stock Warning:** Stock is under 5 units. Recommended reorder batch: **${pred?.suggestedReorderQty || 15} units**.`
    : `✅ **Healthy Inventory:** Stock level is well-balanced with current customer demand.`
}

> **Tactical Action:** ${
  velocity > 0
    ? `Feature this product in your next Telegram channel routine showcase to accelerate sell-through.`
    : `Pair with a complementary bestselling skincare item to stimulate initial sales momentum.`
}`;
  }

  // 2. GREETINGS & CASUAL INTERACTION / HELP
  if (
    /^(hi|hey|hello|sup|yo|good\s*(morning|afternoon|evening)|howdy|greetings)(\s|$|[?!.,])/i.test(pLower) ||
    pLower.includes("who are you") ||
    pLower.includes("what can you do") ||
    pLower.includes("help") ||
    pLower.includes("commands") ||
    pLower === "hey there"
  ) {
    return `### 👋 Welcome to DS Style AI Business Advisor!
I am your Chief Business Intelligence Officer and predictive retail strategist, deeply connected to your live MongoDB store data.

#### ⚡ Live Executive Pulse Right Now:
- 💰 **Total Revenue to Date:** **${overview.totalRevenueETB.toLocaleString()} ETB** (${overview.totalOrders} transactions)
- 📦 **Active Catalog:** **${overview.totalProducts} products** across **${overview.totalCategories} categories**
- 🏷️ **Total Inventory Valuation:** **${overview.totalInventoryValuationETB.toLocaleString()} ETB**
- 🚨 **Urgent Restocks Needed:** **${restock.criticalCount} products**
- 🛑 **Capital Locked in Dead Stock:** **${deadStock.totalTiedUpCapitalETB.toLocaleString()} ETB**

---

#### 💡 What You Can Ask Me Anytime:
You can speak to me in plain English or Amharic! Try typing any of these:
1. 🔮 **"What products should I restock first?"** *(Velocity forecasting & reorder amounts)*
2. 🏆 **"Show me our best sellers and top brands."** *(Revenue leaders & volume drivers)*
3. 🛍️ **"Compare counter sales vs online delivery orders."** *(Channel breakdown & conversion)*
4. 🚨 **"How much capital is trapped in dead stock?"** *(Stagnant items & liquidation tactics)*
5. 💄 **"Break down our categories and inventory spread."** *(Skincare vs Makeup vs Fragrance)*
6. 💰 **"What is our Average Order Value and pricing strategy?"** *(Basket size expansion)*
7. 📢 **"Give me high-converting Telegram marketing campaigns."** *(Cosmetics promos & flash drops)*
8. 🔍 **"Tell me about [Product Name]"** *(Instant live diagnostic on any product)*

*Click any prompt above or type your question below!*`;
  }

  // 3. BEST SELLERS, POPULAR PRODUCTS & TOP BRANDS
  if (
    pLower.includes("best seller") ||
    pLower.includes("bestseller") ||
    pLower.includes("top seller") ||
    pLower.includes("popular") ||
    pLower.includes("top product") ||
    pLower.includes("highest revenue") ||
    pLower.includes("fastest moving") ||
    (pLower.includes("brand") && !pLower.includes("reorder"))
  ) {
    const topRevenue = sales.topSellersByRevenue.slice(0, 5);
    const topVolume = sales.topSellersByVolume.slice(0, 5);

    let revList = "";
    topRevenue.forEach((t, i) => {
      revList += `${i + 1}. **${t.name}**\n   • **Revenue:** \`${t.revenue.toLocaleString()} ETB\` | **Units Sold:** \`${t.unitsSold} units\`\n`;
    });

    let volList = "";
    topVolume.forEach((t, i) => {
      volList += `${i + 1}. **${t.name}**\n   • **Units Sold:** \`${t.unitsSold} units\` | **Revenue:** \`${t.revenue.toLocaleString()} ETB\`\n`;
    });

    // Top brands calculation
    const brandEntries = Object.entries(overview.brandsSummary || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return `### 🏆 DS Style Bestseller & Brand Performance Analysis

#### 💰 Top 5 Revenue Drivers:
${revList || "No sales history recorded yet."}

#### 📦 Top 5 Volume Leaders (Units Sold):
${volList || "No sales history recorded yet."}

#### 🏷️ Leading Brands in Catalog:
${brandEntries.map(([b, count]) => `• **${b}:** \`${count} products\``).join("\n") || "No brands registered."}

> **Strategic Insight:** Your top-selling items generate the majority of your cash flow. Maintain at least a **2-week buffer stock** on these high-velocity items at all times, as cosmetics shoppers rarely wait for out-of-stock items and will purchase from competitors in Bole.`;
  }

  // 4. COUNTER SALES VS ONLINE DELIVERY ORDERS (CHANNELS)
  if (
    pLower.includes("counter") ||
    pLower.includes("walk in") ||
    pLower.includes("walk-in") ||
    pLower.includes("pos") ||
    pLower.includes("direct") ||
    pLower.includes("online") ||
    pLower.includes("delivery") ||
    pLower.includes("channel")
  ) {
    return `### 🛍️ Sales Channels: Physical Counter vs Online Storefront

#### 📊 Revenue & Order Split:
- **🏬 Counter Sales (Walk-in at Golagole 22):**
  • **Revenue:** **${overview.directSalesRevenueETB.toLocaleString()} ETB** (${sales.counterSharePercent}% of total)
  • **Transactions:** \`${overview.directSalesCount} walk-in orders\`
- **🛵 Online Storefront (Telegram Mini App & Delivery):**
  • **Revenue:** **${overview.onlineOrdersRevenueETB.toLocaleString()} ETB** (${sales.onlineSharePercent}% of total)
  • **Transactions:** \`${overview.onlineOrdersCount} online orders\`
- **📈 Average Order Value (AOV):** **${overview.averageOrderValueETB.toLocaleString()} ETB**

#### 💡 Channel Growth Strategies:
1. **In-Store to Telegram Conversion:** Place a prominent counter QR code: *"Scan to join @ENDcosmo VIP Channel for 5% off next delivery"*. This turns one-time walk-ins into lifetime digital repeat buyers.
2. **Speed & Delivery Reliability:** Online beauty shoppers value authenticity and same-day delivery across Addis Ababa. Promote *"Guaranteed 2-Hour Delivery in Bole & Olympia"* during peak afternoon hours.`;
  }

  // 5. CATEGORIES & CATALOG SPREAD
  if (
    pLower.includes("categor") ||
    pLower.includes("skincare") ||
    pLower.includes("makeup") ||
    pLower.includes("haircare") ||
    pLower.includes("fragrance") ||
    pLower.includes("perfume") ||
    pLower.includes("assortment")
  ) {
    const catList = Object.entries(overview.categoriesSummary || {})
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count], i) => `${i + 1}. **Category ID \`${cat}\`:** \`${count} active products\``)
      .join("\n");

    return `### 💄 DS Style Category Breakdown & Catalog Spread

#### 📦 Catalog Distribution:
- **Total Categories:** **${overview.totalCategories} active categories**
- **Total Catalog Products:** **${overview.totalProducts} items**
- **Total Stock Units:** **${overview.totalActualStockUnits} physical units**

#### 📋 Category Volume:
${catList || "No categories registered yet."}

#### 💡 Merchandising Advice:
- **Core Hero Category:** Skincare (Cleansers, Serums, Sunscreens) has the highest repeat purchase frequency (every 45-60 days). Keep skincare inventory healthy.
- **High-Margin Impulse Category:** Lip balms, lip oils, and travel-size perfumes are excellent register add-ons for both walk-in and online checkout baskets.`;
  }

  // 6. PRICING, MARGINS & AVERAGE ORDER VALUE (AOV)
  if (
    pLower.includes("price") ||
    pLower.includes("pricing") ||
    pLower.includes("discount") ||
    pLower.includes("margin") ||
    pLower.includes("profit") ||
    pLower.includes("basket") ||
    pLower.includes("aov") ||
    pLower.includes("cost")
  ) {
    return `### 💰 DS Style Pricing, Margins & Basket Size Strategy

#### 📊 Current Metrics:
- **Average Order Value (AOV):** **${overview.averageOrderValueETB.toLocaleString()} ETB**
- **Catalog Retail Valuation:** **${overview.totalInventoryValuationETB.toLocaleString()} ETB**
- **Total Revenue:** **${overview.totalRevenueETB.toLocaleString()} ETB**

#### 🎯 Strategic Pricing Guidelines for Ethiopian Beauty Market:
1. **Avoid Blanket Discounting:** Authentic imported cosmetics (CeraVe, La Roche-Posay, The Ordinary) are trust-based purchases. Heavy discounting can trigger counterfeit suspicions. Maintain premium pricing and compete on **100% Authenticity Guarantee**.
2. **Gift-With-Purchase (GWP):** Instead of offering 10% off, offer a free travel-size beauty blender or mini hydrating toner on orders over **3,000 ETB**. This expands basket sizes without hurting gross margin.
3. **Routine Bundling:** Package 3 complementary items together:
   - *Morning Glow Routine:* Gentle Cleanser + Vitamin C Serum + SPF 50
   - Price the bundle at a slight 5% advantage to boost your single-transaction revenue.`;
  }

  // 7. MARKETING, TELEGRAM & PROMOTION IDEAS
  if (
    pLower.includes("market") ||
    pLower.includes("promote") ||
    pLower.includes("telegram") ||
    pLower.includes("growth") ||
    pLower.includes("campaign") ||
    pLower.includes("ad") ||
    pLower.includes("instagram") ||
    pLower.includes("tiktok") ||
    pLower.includes("sell more")
  ) {
    return `### 📢 High-Converting Marketing Blueprints for DS Style

#### 🚀 3 High-Impact Promotional Campaigns:

1. **🌟 The "Payday Glow-Up" Drop (Last Thursday of the Month):**
   - **Format:** Telegram post with high-resolution video showing product texture and swatch.
   - **Offer:** Free delivery across Addis Ababa for orders placed within 3 hours.
   - **Target Audience:** Working professionals seeking authentic skincare replenishment.

2. **⚡ "Telegram VIP 2-Hour Flash Sale" (Tuesdays at 12:30 PM):**
   - **Objective:** Liquidate slow-moving inventory (${deadStock.deadStockItemsCount} dead-stock items).
   - **Hook:** *"Secret Channel-Only Drop: 5 units of [Product] at 25% off until 2:30 PM!"*
   - **Psychology:** Scarcity + urgency drives immediate instant buy actions.

3. **💄 Skin-Concern Educational Content:**
   - Instead of just showing price tags, post routine guides:
     • *"Best Serums for Post-Acne Hyperpigmentation"*
     • *"Sunscreen Mistakes You're Making in Addis Ababa Sunshine"*
   - Link the exact DS Style products at the bottom of the Telegram post.`;
  }

  // 8. RESTOCKING, VELOCITY & FORECASTING
  if (
    pLower.includes("restock") ||
    pLower.includes("predict") ||
    pLower.includes("stockout") ||
    pLower.includes("reorder") ||
    pLower.includes("inventory") ||
    pLower.includes("run out") ||
    pLower.includes("low stock") ||
    pLower.includes("out of stock") ||
    pLower.includes("urgent")
  ) {
    const criticalList = restock.predictions
      .filter((p) => p.urgency.startsWith("CRITICAL") || p.urgency === "URGENT")
      .slice(0, 8);

    let listText = "";
    criticalList.forEach((it, idx) => {
      const days = it.daysUntilStockout === 0 ? "⚠️ OUT OF STOCK" : `⏳ ~${it.daysUntilStockout} days remaining`;
      listText += `${idx + 1}. **${it.name}** (${it.category})
   • **Current Stock:** \`${it.currentStock} units\` | ${days}
   • **Sales Run-Rate:** \`${it.dailySalesVelocity} units/day\`
   • **Recommended Reorder:** 🛒 **${it.suggestedReorderQty} units** (covers 30-day demand)

`;
    });

    return `### 🔮 DS Style AI Predictive Restock Analysis
Based on real-time sales velocities across your product catalog:

**Key Takeaways:**
- 🚨 **Critical Attention:** **${restock.criticalCount} products** are out of stock or will run out in $\\le 3$ days.
- ⚠️ **Urgent Action:** **${restock.urgentCount} products** will stock out within 7 days.
- 📦 **Low Stock Overall (< 5 units):** **${overview.lowStockCount} items**

#### 🛒 High-Priority Restock Recommendations:
${listText || "All inventory items currently maintain safe velocity buffers (> 14 days of stock)."}

> **Advisor Strategy:** Prioritize restocking the top 3 items first to prevent lost revenue. Cosmetics customers rarely wait for backorders and will seek alternatives if out of stock.`;
  }

  // 9. DEAD STOCK & CAPITAL LIQUIDATION
  if (
    pLower.includes("dead") ||
    pLower.includes("slow") ||
    pLower.includes("capital") ||
    pLower.includes("tied") ||
    pLower.includes("stagnant") ||
    pLower.includes("unsold") ||
    pLower.includes("liquidat")
  ) {
    const topDead = deadStock.items.slice(0, 6);
    let listText = "";
    topDead.forEach((it, idx) => {
      listText += `${idx + 1}. **${it.name}**
   • **Stock:** \`${it.currentStock} units\` | **Capital Tied Up:** \`${it.tiedUpCapitalETB.toLocaleString()} ETB\`
   • **Action:** 💡 *${it.recommendedLiquidationStrategy}*

`;
    });

    return `### 🚨 Dead Stock & Capital Liquidation Report
Our scan analyzed products with zero sales in the last 30 days:

**Summary Metrics:**
- **Stagnant Products:** **${deadStock.deadStockItemsCount} items**
- **Trapped Working Capital:** **${deadStock.totalTiedUpCapitalETB.toLocaleString()} ETB**

#### 📦 Top Tied-Up Inventory:
${listText || "No stagnant inventory detected. Product turnover is healthy across the board."}

> **Tactical Advice:** Run a "Weekend Beauty Bundle" pairing one stagnant item at 30% off with your top-selling skincare banger to immediately recover cash flow.`;
  }

  // 10. STORE VALUATION & ASSET HEALTH
  if (
    pLower.includes("worth") ||
    pLower.includes("valuation") ||
    pLower.includes("asset") ||
    pLower.includes("total value") ||
    pLower.includes("how much money")
  ) {
    return `### 💎 DS Style Inventory Valuation & Financial Assets

#### 📊 Financial Summary:
- **Total Retail Inventory Value:** **${overview.totalInventoryValuationETB.toLocaleString()} ETB**
- **Total Physical Stock Units:** \`${overview.totalActualStockUnits} units in stock\`
- **Active Products:** \`${overview.totalProducts} items\` across \`${overview.totalCategories} categories\`
- **Working Capital Trapped in Dead Stock:** **${deadStock.totalTiedUpCapitalETB.toLocaleString()} ETB**
- **Net Liquid Working Capital Ratio:** **${Math.round(((overview.totalInventoryValuationETB - deadStock.totalTiedUpCapitalETB) / (overview.totalInventoryValuationETB || 1)) * 100)}% active**

> **Strategic Outlook:** Your inventory health is strong. Liquidating trapped capital will release additional cash reserves to expand high-demand lines.`;
  }

  // 11. TRENDING COSMETICS SOURCING ADVICE
  if (
    pLower.includes("trend") ||
    pLower.includes("what to sell") ||
    pLower.includes("new product") ||
    pLower.includes("what to buy") ||
    pLower.includes("sourcing") ||
    pLower.includes("recommend")
  ) {
    return `### ✨ 2026 Beauty Trend Forecast for Addis Ababa

#### 🔥 Top In-Demand Skincare & Makeup Formats:
1. **Korean "Glass Skin" Essentials:** High demand for Heartleaf toners (Anua), Snail Mucin essences (COSRX), and Centella Asiatica barrier serums.
2. **Hydrating Mineral & Fluid Sunscreens:** High SPF invisible fluids (La Roche-Posay Anthelios, Beauty of Joseon) are staple daily essentials with recurring 30-45 day repurchases.
3. **Plumping Lip Treatments & Lip Oils:** Peptide lip masks (Laneige) and viral hydrating glosses (Fenty, Dior lip oils) have viral appeal on TikTok and Telegram.
4. **Ceramide Barrier Creams:** Everyday soothing moisturizers (CeraVe, Aveeno) carry high basket conversion for all skin types.

> **Sourcing Priority:** When planning your next overseas container or Dubai shipment, allocate **45% to Skincare, 30% to Haircare/Body, and 25% to Viral Makeup items**.`;
  }

  // 12. DEFAULT: COMPREHENSIVE EXECUTIVE BUSINESS HEALTH SCAN
  const top3 = sales.topSellersByRevenue.slice(0, 3);
  let topList = "";
  top3.forEach((t, i) => {
    topList += `• **#${i + 1} ${t.name}:** \`${t.revenue.toLocaleString()} ETB\` (${t.unitsSold} units)\n`;
  });

  return `### 📊 DS Style Executive Business Intelligence Report
Here is your live, end-to-end store performance overview:

#### 💰 Revenue & Sales Channels
- **Total Revenue:** **${overview.totalRevenueETB.toLocaleString()} ETB** across **${overview.totalOrders} transactions**
- **Counter Sales (Walk-in):** \`${overview.directSalesRevenueETB.toLocaleString()} ETB\` (${sales.counterSharePercent}%)
- **Online Storefront Delivery:** \`${overview.onlineOrdersRevenueETB.toLocaleString()} ETB\` (${sales.onlineSharePercent}%)
- **Average Order Value (AOV):** **${overview.averageOrderValueETB.toLocaleString()} ETB**

#### 📦 Inventory Health & Valuation
- **Catalog Size:** **${overview.totalProducts} products** across **${overview.totalCategories} categories**
- **Total Retail Inventory Value:** **${overview.totalInventoryValuationETB.toLocaleString()} ETB**
- **Out of Stock:** 🚨 **${overview.outOfStockCount} items**
- **Low Stock (< 5 units):** ⚠️ **${overview.lowStockCount} items**
- **Trapped in Dead Stock:** **${deadStock.totalTiedUpCapitalETB.toLocaleString()} ETB**

#### 🏆 Top Revenue Drivers:
${topList || "No order history recorded yet."}

> **💡 Action Plan for Today:**
> 1. Restock the **${restock.criticalCount} critical items** before weekend traffic peaks.
> 2. Run a Telegram channel flash sale featuring dead stock to recover **${deadStock.totalTiedUpCapitalETB.toLocaleString()} ETB** in liquid capital.`;
}

// -------------------------------------------------------------
// 3. Main AI Controller Handlers
// -------------------------------------------------------------

// Quick-Scan Endpoint: Returns instant structured data for dashboard power cards
export async function handleQuickScan(req, res) {
  try {
    const { type } = req.params;

    if (type === "overview") {
      const data = await getStoreOverviewData();
      return res.status(200).json({ success: true, data });
    }

    if (type === "restock") {
      const data = await getRestockPredictionsData(30);
      return res.status(200).json({ success: true, data });
    }

    if (type === "deadstock") {
      const data = await getDeadStockData(30);
      return res.status(200).json({ success: true, data });
    }

    if (type === "velocity") {
      const data = await getSalesVelocityAndRevenueData();
      return res.status(200).json({ success: true, data });
    }

    return res.status(400).json({ success: false, message: `Unknown scan type: ${type}` });
  } catch (error) {
    console.error("Quick Scan error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to run scan" });
  }
}

// Conversational AI Advisor: Vercel AI SDK + Google Gemini Tool Calling + Multi-Domain Engine
export async function handleAiChat(req, res) {
  try {
    const { messages, prompt } = req.body;
    const userPrompt =
      prompt ||
      (Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1].content
        : "Give me an executive business analysis of DS Style and restock recommendations.");

    // Retrieve setting from MongoDB for user-configured Gemini API Key
    const setting = await Setting.findOne().lean();

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      setting?.geminiApiKey;

    // Fetch live DB snapshots
    const [overview, restock, deadStock, sales, allProducts] = await Promise.all([
      getStoreOverviewData(),
      getRestockPredictionsData(30),
      getDeadStockData(30),
      getSalesVelocityAndRevenueData(),
      Product.find().lean(),
    ]);

    // If Gemini API Key is available, leverage Vercel AI SDK with Google Gemini
    if (apiKey && apiKey.trim() !== "") {
      try {
        const google = createGoogleGenerativeAI({ apiKey: apiKey.trim() });

        const systemPrompt = `You are the AI Business Partner & Advisor for DS Style, a streetwear and fashion store (sneakers, outfits, jeans, accessories and grillz) with a physical shop at Golagole 22, Addis Ababa, Ethiopia.

You converse naturally, intelligently, and warmly with the store admin in plain English or Amharic, just like standard Gemini AI. You have full access to the store's live database context below, and can discuss:
- Business strategy, inventory, restocking, profits, and pricing
- Marketing campaigns, Telegram posts, TikTok/Instagram ideas
- Customer requests, skincare routines, product recommendations
- Supplier talks, brand analysis, logistics, or general retail chat
- Anything else the admin wants to brainstorm, draft, or discuss!

Live Store Database Snapshot:
- Total Products in Catalog: ${overview.totalProducts} (${overview.totalCategories} categories)
- Total Retail Inventory Valuation: ${overview.totalInventoryValuationETB.toLocaleString()} ETB
- Total Revenue to Date: ${overview.totalRevenueETB.toLocaleString()} ETB (${sales.counterSharePercent}% Counter Sales, ${sales.onlineSharePercent}% Online Storefront)
- Total Out-of-Stock: ${overview.outOfStockCount} items | Low Stock (<5 units): ${overview.lowStockCount} items
- Critical Restock Needs: ${restock.criticalCount} products
- Trapped in Stagnant Dead Stock: ${deadStock.totalTiedUpCapitalETB.toLocaleString()} ETB (${deadStock.deadStockItemsCount} items)

Top Sellers by Volume:
${sales.topSellersByVolume.slice(0, 5).map((s) => `- ${s.name}: ${s.unitsSold} units (${s.revenue.toLocaleString()} ETB)`).join("\n")}

Urgent Restock Items:
${restock.predictions.filter((p) => p.urgency.startsWith("CRITICAL") || p.urgency === "URGENT").slice(0, 5).map((p) => `- ${p.name}: ${p.currentStock} units left (~${p.daysUntilStockout} days runway, velocity: ${p.dailySalesVelocity} units/day)`).join("\n")}

Respond conversationally, thoughtfully, and helpfully using clean markdown formatting. Be a real partner the admin can talk to about anything!`;

        // Build multi-turn conversational history for true continuous reasoning
        const conversationHistory = Array.isArray(messages) && messages.length > 0
          ? messages.slice(-10).map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content || ""),
            }))
          : [{ role: "user", content: userPrompt }];

        const { text } = await generateText({
          model: google("gemini-3.5-flash"),
          system: systemPrompt,
          messages: conversationHistory,
        });

        return res.status(200).json({
          success: true,
          provider: "gemini-3.5-flash",
          response: text,
          hasGeminiKey: true,
          metadata: {
            criticalRestocks: restock.criticalCount,
            deadStockCapital: deadStock.totalTiedUpCapitalETB,
            totalValuation: overview.totalInventoryValuationETB,
          },
        });
      } catch (geminiError) {
        console.warn("Gemini SDK call notice, falling back to autonomous engine:", geminiError.message);
        // Fallback to internal autonomous engine seamlessly
      }
    }

    // High-Performance Multi-Domain Autonomous Engine fallback
    const autonomousText = generateAutonomousReport(userPrompt, overview, restock, deadStock, sales, allProducts);

    return res.status(200).json({
      success: true,
      provider: "dsstyle-ai-engine",
      response: autonomousText,
      hasGeminiKey: Boolean(apiKey && apiKey.trim() !== ""),
      metadata: {
        criticalRestocks: restock.criticalCount,
        deadStockCapital: deadStock.totalTiedUpCapitalETB,
        totalValuation: overview.totalInventoryValuationETB,
      },
    });
  } catch (error) {
    console.error("AI Chat Handler Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process AI analysis request",
    });
  }
}

