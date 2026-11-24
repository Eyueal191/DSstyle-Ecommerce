import Product from "../models/product.js";
import Order from "../models/order.js";

// In-memory "Record a sale" state: telegram userId -> { step, productId, qty }
export const saleSessions = new Map();

const CANCEL_ROW = [{ text: "Cancel", callback_data: "sale_cancel" }];
const MENU_ROW = [{ text: "Back to menu", callback_data: "btn_main_menu" }];

const clean = (s) => String(s ?? "").replace(/([_*`\[\]\\])/g, "").trim();
const stockOf = (p) => Number(p.actualStock ?? p.quantity ?? 0);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function startSale(ctx) {
  saleSessions.set(ctx.from.id, { step: "search" });
  await ctx.reply("🧾 *Record a sale*\n\nType part of the product name.\n_Example: cerave_", {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: [CANCEL_ROW] },
  });
}

async function askQuantity(ctx, product) {
  const stock = stockOf(product);
  const options = [1, 2, 3, 5].filter((n) => n <= stock);
  await ctx.reply(
    `*${clean(product.name)}*\n${Number(product.price).toLocaleString()} ETB · ${stock} in stock\n\nHow many were sold? Tap or type a number.`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [options.map((n) => ({ text: String(n), callback_data: `sale_qty_${n}` })), CANCEL_ROW].filter((r) => r.length),
      },
    }
  );
}

async function askConfirm(ctx, product, qty) {
  const total = qty * Number(product.price || 0);
  await ctx.reply(
    `Confirm sale\n\n*${clean(product.name)}* × ${qty}\n*Total: ${total.toLocaleString()} ETB*`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Record sale", callback_data: "sale_confirm" }], CANCEL_ROW],
      },
    }
  );
}

async function setQuantity(ctx, s, qty) {
  const product = await Product.findById(s.productId).lean();
  if (!product) {
    saleSessions.delete(ctx.from.id);
    await ctx.reply("That product no longer exists.", { reply_markup: { inline_keyboard: [MENU_ROW] } });
    return;
  }
  const stock = stockOf(product);
  if (!qty || qty < 1) {
    await ctx.reply("Please type a number, like 1.");
    return;
  }
  if (qty > stock) {
    await ctx.reply(`Only ${stock} in stock. Please enter ${stock} or less.`);
    return;
  }
  s.qty = qty;
  s.step = "confirm";
  await askConfirm(ctx, product, qty);
}

/** Typed text while a sale is in progress */
export async function handleSaleText(ctx) {
  const s = saleSessions.get(ctx.from.id);
  if (!s) return false;
  const text = (ctx.message?.text || "").trim();

  if (s.step === "search") {
    if (text.length < 2) {
      await ctx.reply("Please type at least 2 letters of the product name.");
      return true;
    }
    const matches = await Product.find({ name: { $regex: escapeRegex(text), $options: "i" } })
      .sort({ name: 1 })
      .limit(8)
      .lean();
    if (!matches.length) {
      await ctx.reply(`No product matches "${clean(text)}". Try another word.`, {
        reply_markup: { inline_keyboard: [CANCEL_ROW] },
      });
      return true;
    }
    await ctx.reply("Which product?", {
      reply_markup: {
        inline_keyboard: [
          ...matches.map((p) => [{ text: `${p.name} · ${stockOf(p)} left`.slice(0, 60), callback_data: `sale_pick_${p._id}` }]),
          CANCEL_ROW,
        ],
      },
    });
    return true;
  }

  if (s.step === "qty") {
    await setQuantity(ctx, s, parseInt(text.replace(/[^0-9]/g, ""), 10));
    return true;
  }

  if (s.step === "confirm") {
    await ctx.reply("Tap *Record sale* to save it, or *Cancel*.", { parse_mode: "Markdown" });
    return true;
  }
  return false;
}

/** Buttons that belong to the sale flow (callback data starting with "sale_") */
export async function handleSaleCallback(ctx, user) {
  const data = ctx.callbackQuery?.data || "";
  if (!data.startsWith("sale_")) return false;
  const s = saleSessions.get(ctx.from.id);

  if (data === "sale_cancel") {
    saleSessions.delete(ctx.from.id);
    await ctx.answerCbQuery();
    await ctx.reply("Sale cancelled. Nothing was saved.", { reply_markup: { inline_keyboard: [MENU_ROW] } });
    return true;
  }

  if (!s) {
    await ctx.answerCbQuery("This sale has ended. Start a new one from the menu.", { show_alert: true });
    return true;
  }

  try {
    if (data.startsWith("sale_pick_") && s.step === "search") {
      const product = await Product.findById(data.replace("sale_pick_", "")).lean();
      await ctx.answerCbQuery();
      if (!product) return true;
      if (stockOf(product) < 1) {
        await ctx.reply(`*${clean(product.name)}* is out of stock. Choose another product or type a new name.`, {
          parse_mode: "Markdown",
        });
        return true;
      }
      s.productId = String(product._id);
      s.step = "qty";
      await askQuantity(ctx, product);
      return true;
    }

    if (data.startsWith("sale_qty_") && s.step === "qty") {
      await ctx.answerCbQuery();
      await setQuantity(ctx, s, parseInt(data.replace("sale_qty_", ""), 10));
      return true;
    }

    if (data === "sale_confirm" && s.step === "confirm") {
      await ctx.answerCbQuery("Saving…");
      // Deduct stock only if enough is still available (guards against two sales at once)
      const updated = await Product.findOneAndUpdate(
        { _id: s.productId, actualStock: { $gte: s.qty } },
        { $inc: { actualStock: -s.qty, quantity: -s.qty } },
        { new: true }
      );
      if (!updated) {
        saleSessions.delete(ctx.from.id);
        await ctx.reply("Not enough stock any more. The sale was not recorded.", {
          reply_markup: { inline_keyboard: [MENU_ROW] },
        });
        return true;
      }
      const left = stockOf(updated);
      if (left <= 0) await Product.updateOne({ _id: updated._id }, { $set: { inStock: false } });

      const price = Number(updated.price || 0);
      await Order.create({
        saleType: "direct",
        sellerName: user?.name || "Seller",
        customerName: "Walk-in Customer",
        customerPhone: "",
        deliveryAddress: "In-Store Counter",
        totalPrice: price * s.qty,
        items: [
          {
            product: updated.toObject(),
            quantity: s.qty,
            priceAtPurchase: price,
            status: "delivered",
            paymentStatus: "succeeded",
            paymentMethod: "counter_sale",
            address: "In-Store",
          },
        ],
      });
      saleSessions.delete(ctx.from.id);
      console.log(`✅ [Record Sale] ${user?.name}: ${updated.name} x${s.qty}`);

      await ctx.reply(
        `✅ Sale recorded\n\n*${clean(updated.name)}* × ${s.qty} · ${(price * s.qty).toLocaleString()} ETB\n${left} left in stock`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[{ text: "🧾 Record another sale", callback_data: "btn_record_sale" }], MENU_ROW],
          },
        }
      );
      return true;
    }

    await ctx.answerCbQuery("Please use the latest message.");
    return true;
  } catch (err) {
    console.error("[Record Sale] error:", err);
    await ctx.answerCbQuery("Something went wrong. Please try again.", { show_alert: true });
    return true;
  }
}
