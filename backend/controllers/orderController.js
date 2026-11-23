import Order from "../models/order.js";
import Product from "../models/product.js";
import _ from "lodash";
import mongoose from "mongoose";
import { sendOrderNotificationToAdmins, sendOrderConfirmationToCustomer } from "../bot/bot.js";

const cleanPhone = (raw) => {
  if (!raw) return "";
  return raw.toString().replace(/[^\d+]/g, "").trim();
};

const buildUserQuery = (userId, phone) => {
  const conditions = [];
  const normalizedPhone = cleanPhone(phone);
  if (phone) {
    conditions.push({ customerPhone: phone.toString().trim() });
    if (normalizedPhone && normalizedPhone !== phone.toString().trim()) {
      conditions.push({ customerPhone: normalizedPhone });
    }
  }
  if (userId) {
    const rawUserId = userId.toString().trim();
    conditions.push({ customerPhone: rawUserId });
    const normalizedUserId = cleanPhone(rawUserId);
    if (normalizedUserId && normalizedUserId !== rawUserId) {
      conditions.push({ customerPhone: normalizedUserId });
    }
    conditions.push({ guestId: rawUserId });
    if (mongoose.isValidObjectId(rawUserId)) {
      conditions.push({ user: rawUserId });
    }
  }
  return conditions.length > 0 ? { $or: conditions } : {};
};

// 1. placeOrder (Simple Name, Phone, and Address)
const placeOrderByUserId = async (req, res) => {
  try {
    const userId = req.params?.userId || req.body?.userId;
    const { orderItems, customerName, customerPhone, deliveryAddress, address } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || !orderItems.length) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }

    const phone = (customerPhone || req.body?.phone || userId || "").toString().trim();
    const name = (customerName || req.body?.name || "").toString().trim();
    const singleAddress = (deliveryAddress || address || "").toString().trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, message: "Customer name is required (minimum 2 characters)" });
    }
    if (!phone || phone.length < 6) {
      return res.status(400).json({ success: false, message: "A valid contact phone number is required" });
    }
    if (!singleAddress || singleAddress.length < 3) {
      return res.status(400).json({ success: false, message: "A specific delivery address is required" });
    }

    // Filter out invalid items where product is completely missing/null
    const cleanOrderItems = (orderItems || []).filter((item) => {
      if (!item) return false;
      const p = item.product;
      if (!p) return false;
      if (typeof p === "string" && !p.trim()) return false;
      if (typeof p === "object" && !p._id && !p.name) return false;
      return true;
    });

    if (!cleanOrderItems.length) {
      return res.status(400).json({ success: false, message: "No valid product items in order" });
    }

    // Normalize and attach address + priceAtPurchase to each item
    const normalizedItems = await Promise.all(
      cleanOrderItems.map(async (item) => {
        const prodId =
          item.product?._id ||
          (typeof item.product === "string" ? item.product : null) ||
          item.productId;

        let productSnapshot =
          typeof item.product === "object" && item.product !== null
            ? { ...item.product }
            : null;

        if (prodId && mongoose.isValidObjectId(prodId)) {
          try {
            const dbProd = await Product.findById(prodId).lean();
            if (dbProd) {
              productSnapshot = dbProd;
            }
          } catch {
            // Keep fallback snapshot
          }
        }

        if (!productSnapshot) {
          productSnapshot = {
            _id: prodId || new mongoose.Types.ObjectId(),
            name: item.name || "Product",
            price: Number(item.priceAtPurchase || item.price || 0),
          };
        }

        let price = Number(
          item.priceAtPurchase ?? item.price ?? productSnapshot.price ?? 0
        );

        return {
          product: productSnapshot,
          priceAtPurchase: Number(price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),
          address: singleAddress,
          status: item.status || "processing",
          paymentStatus: item.paymentStatus || "pending",
          paymentMethod: item.paymentMethod || "cod",
        };
      })
    );

    const calculatedTotal = normalizedItems.reduce(
      (acc, it) => acc + (it.priceAtPurchase || 0) * (it.quantity || 1),
      0
    );

    const query = buildUserQuery(userId, phone);
    let userOrder = await Order.findOne(query);

    if (!userOrder) {
      // Create new order
      userOrder = new Order({
        saleType: "online",
        customerName: name,
        customerPhone: phone,
        deliveryAddress: singleAddress,
        guestId: userId || null,
        user: mongoose.isValidObjectId(userId) ? userId : undefined,
        totalPrice: calculatedTotal,
        items: normalizedItems,
      });
    } else {
      // Update details and append items
      userOrder.customerName = name;
      userOrder.customerPhone = phone;
      userOrder.deliveryAddress = singleAddress;
      userOrder.items = [...(userOrder.items || []), ...normalizedItems];
      userOrder.totalPrice = (userOrder.items || []).reduce(
        (acc, it) => acc + (it.priceAtPurchase || 0) * (it.quantity || 1),
        0
      );
    }

    await userOrder.save();

    // Telegram: alert staff and confirm to the customer.
    // Repeat customers' items are appended to one order document, so only report the items just placed.
    try {
      const populatedOrder = (await Order.findById(userOrder._id).populate("items.product").lean()) || userOrder.toObject();
      const thisOrder = {
        ...populatedOrder,
        items: (populatedOrder.items || []).slice(-normalizedItems.length),
        totalPrice: calculatedTotal,
      };
      sendOrderNotificationToAdmins(thisOrder).catch((err) =>
        console.error("Async telegram notification error:", err)
      );
      sendOrderConfirmationToCustomer(thisOrder).catch((err) =>
        console.error("Async customer confirmation error:", err)
      );
    } catch (notifErr) {
      console.warn("Failed to trigger order notification:", notifErr);
    }

    return res.status(201).json({
      message: "Order placed successfully!",
      success: true,
      error: false,
      orderId: userOrder._id,
    });
  } catch (error) {
    console.error("Place order error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

// 2. Get all orders for a user / guest / phone
const getUserOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const query = buildUserQuery(userId);

    let userOrders = await Order.findOne(query)
      .populate("items.product")
      .lean();

    if (!userOrders || !userOrders.items?.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      orders: userOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// 2b. Get all orders by phone number
const getOrdersByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const cleanPhone = phone.trim();
    const orders = await Order.find({ customerPhone: cleanPhone })
      .populate("items.product")
      .lean();

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this phone number",
      });
    }

    const allItems = orders.flatMap((o) => o.items || []);
    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      orders: { items: allItems },
      allOrders: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// 3. Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user")
      .populate("items.product")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      error: false,
      message: "Orders retrieved successfully",
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};

// 4. Delete OrderItem from a user’s order
const deleteOrderItemByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cancelItem } = req.body;
    if (!cancelItem?._id) {
      return res.status(400).json({ success: false, message: "cancelItem._id is required" });
    }

    const query = buildUserQuery(userId);
    const userOrder = await Order.findOne(query);

    if (!userOrder) {
      return res.status(404).json({ success: false, message: "User order not found" });
    }

    const itemsCount = userOrder.items.length;
    userOrder.items = userOrder.items.filter(
      (item) => item._id.toString() !== cancelItem._id
    );

    if (itemsCount === userOrder.items.length) {
      return res.status(400).json({
        success: false,
        message: "Order could not be cancelled",
      });
    }

    await userOrder.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from order",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 5. Update order by ID (admin)
const updateOrderItemById = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId, itemUpdate } = req.body;

    let order = null;
    if (itemId) {
      order = await Order.findOne({ "items._id": itemId });
    }
    if (!order && userId) {
      const query = buildUserQuery(userId);
      order = await Order.findOne(query);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    Object.assign(item, itemUpdate);
    await order.save();

    return res.status(200).json({
      message: "Order updated successfully",
      success: true,
      error: false,
      updatedItem: item,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 6. Update user order items
const updateUserOrderByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { paymentUpdatedItems, oldItems } = req.body;

    const query = buildUserQuery(userId);
    let userOrder = await Order.findOne(query);

    if (!userOrder) {
      return res.status(404).json({ message: "Order not found", success: false, error: true });
    }

    userOrder.items = userOrder.items.filter(
      (item) => !oldItems.some((oldItem) => oldItem._id.toString() === item._id.toString())
    );

    userOrder.items = [...userOrder.items, ...paymentUpdatedItems];

    await userOrder.save();

    return res.status(200).json({
      message: "Order updated",
      success: true,
      error: false,
      order: userOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// 7. Update entire order status (admin) with smart inventory and sales recording
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "orderId and status are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const previousStatus = order.items?.[0]?.status || "processing";
    const normalizedStatus = status.toLowerCase();

    // 1. Order succeeded/delivered -> deduct stock for the sold items (if not already deducted)
    if (normalizedStatus === "delivered" && previousStatus !== "delivered") {
      for (const item of order.items) {
        const prodId = item.product?._id || item.product;
        const qty = Number(item.quantity) || 1;
        if (prodId) {
          await Product.findByIdAndUpdate(prodId, { $inc: { quantity: -qty, actualStock: -qty } });
        }
      }
    }

    // 2. Order cancelled:
    // If it was previously delivered, restore the deducted stock!
    // If it was in pending/processing stage, stock was not deducted, so NO stock changes!
    if (normalizedStatus === "cancelled" && previousStatus === "delivered") {
      for (const item of order.items) {
        const prodId = item.product?._id || item.product;
        const qty = Number(item.quantity) || 1;
        if (prodId) {
          await Product.findByIdAndUpdate(prodId, { $inc: { quantity: qty } });
        }
      }
    }

    // Update status on all items and order
    order.items.forEach((item) => {
      item.status = normalizedStatus;
      if (normalizedStatus === "delivered") {
        item.paymentStatus = "succeeded";
      } else if (normalizedStatus === "cancelled") {
        item.paymentStatus = "failed";
      }
    });

    await order.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: `Order status updated to ${status}. ${normalizedStatus === "delivered"
        ? "Recorded as completed sale with stock deducted."
        : normalizedStatus === "cancelled"
          ? "Excluded from sales records with product stock preserved."
          : ""
        }`,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
};

// 8. Direct Sale (Counter / Walk-in: only sold products, total amount, date, seller name)
const createDirectSale = async (req, res) => {
  try {
    const { items, sellerName, totalAmount } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "At least one product item is required" });
    }

    const seller = (sellerName || "Store Seller").trim();
    const orderItems = [];
    let calculatedTotal = 0;

    // Deduct stock for each sold item and record line details
    for (const item of items) {
      const prod = await Product.findById(item.productId);
      if (!prod) continue;

      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.price || prod.price) || 0;
      const lineTotal = qty * unitPrice;
      calculatedTotal += lineTotal;

      // Decrement product stock directly in database
      await Product.findByIdAndUpdate(prod._id, {
        $inc: { quantity: -qty, actualStock: -qty },
      });

      orderItems.push({
        product: prod.toObject ? prod.toObject() : prod,
        quantity: qty,
        priceAtPurchase: unitPrice,
        status: "delivered", // Automatically recorded as completed sale
        paymentStatus: "succeeded",
        paymentMethod: "counter_sale",
        address: "In-Store",
      });
    }

    const finalAmount = Number(totalAmount || calculatedTotal);

    const newSale = new Order({
      saleType: "direct",
      sellerName: seller,
      customerName: "Walk-in Customer",
      customerPhone: "",
      deliveryAddress: "In-Store Counter",
      totalPrice: finalAmount,
      items: orderItems,
    });

    await newSale.save();

    return res.status(201).json({
      success: true,
      error: false,
      message: "Direct sale recorded successfully and inventory stock updated!",
      sale: newSale,
    });
  } catch (error) {
    console.error("Direct sale creation error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to record sale",
    });
  }
};

// 9. Delete Order / Sale by ID (admin)
const deleteOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    await Order.findByIdAndDelete(orderId);
    return res.status(200).json({
      success: true,
      error: false,
      message: "Sale record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to delete record",
    });
  }
};

export {
  updateUserOrderByUserId,
  placeOrderByUserId,
  getUserOrdersByUserId,
  getOrdersByPhone,
  getAllOrders,
  deleteOrderItemByUserId,
  updateOrderItemById,
  updateOrderStatus,
  createDirectSale,
  deleteOrderById,
};
