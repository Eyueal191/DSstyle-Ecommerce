import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import User from "../models/user.js";
import Setting from "../models/setting.js";
import { saleSessions, startSale, handleSaleText, handleSaleCallback } from "./saleFlow.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOGO_PATH = join(__dirname, "logo.png");

// ------------------------------------
// Environment-driven URL Helpers
// ------------------------------------
export const getFrontendUrl = () => {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
};

export const getAdminFrontendUrl = () => {
  return (process.env.ADMIN_FRONTEND_URL || "http://localhost:5174").replace(/\/+$/, "");
};

export const getSupportUrl = () => {
  return (process.env.SUPPORT_TELEGRAM_URL || process.env.SUPPORT_URL || "https://t.me/Dsstyle1").trim();
};

export function getShopMiniAppUrl(user) {
  const base = getFrontendUrl();
  if (!user) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}user=${encodeURIComponent(user.name || "")}&tgId=${user.telegramId || ""}&role=${user.role || "User"}`;
}

export function getAdminMiniAppUrl(user) {
  const base = getAdminFrontendUrl();
  if (!user) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}user=${encodeURIComponent(user.name || "")}&tgId=${user.telegramId || ""}&role=${user.role || "Admin"}`;
}

const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.Bot_Token;

if (!botToken) {
  console.warn("⚠️ Telegram Bot Token not set. Bot will not start.");
}

export const bot = botToken ? new Telegraf(botToken) : null;

// Roles: Admin, Seller (staff) and User (customer)
export const isAdmin = (user) => user?.role === "Admin";
export const isSeller = (user) => user?.role === "Seller";
export const isStaff = (user) => isAdmin(user) || isSeller(user);

// Command list shown under the chat's Menu button
const START_COMMAND = [{ command: "start", description: "🏠 Menu" }];
const ADMIN_COMMANDS = [
  { command: "start", description: "🏠 Menu" },
  { command: "admin", description: "⚙️ Open admin panel" },
  { command: "shop", description: "🛍️ Open shop" },
];

/**
 * Find or register user in MongoDB by Telegram ID
 */
export async function getOrRegisterUser(from) {
  if (!from || !from.id) return null;

  const telegramId = String(from.id);
  const telegramUsername = from.username || "";
  const fullName = [from.first_name, from.last_name].filter(Boolean).join(" ") ||
    telegramUsername ||
    `Customer #${telegramId}`;

  let user = await User.findOne({ telegramId });

  if (!user) {
    // Check if user is configured as Admin in environment
    const adminList = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin =
      adminList.includes(telegramId.toLowerCase()) ||
      (telegramUsername && adminList.includes(telegramUsername.toLowerCase().replace(/^@/, "")));

    user = await User.create({
      name: fullName,
      telegramId,
      telegramUsername,
      role: isAdmin ? "Admin" : "User",
      verified: true,
    });
    console.log(`✅ [Telegram Bot] Registered new user: ${fullName} (${telegramId}) - Role: ${user.role}`);
  } else if (telegramUsername && user.telegramUsername !== telegramUsername) {
    user.telegramUsername = telegramUsername;
    await user.save();
  }

  return user;
}

/**
 * Main menu buttons by role
 */
export function buildMainMenuKeyboard(user) {
  const shop = { text: "🛍️ Open Shop", web_app: { url: getShopMiniAppUrl(user) } };
  const admin = { text: "⚙️ Open Admin", web_app: { url: getAdminMiniAppUrl(user) } };

  if (isAdmin(user)) return [[shop], [admin]];
  if (isSeller(user)) return [[admin], [shop], [{ text: "🧾 Record a Sale", callback_data: "btn_record_sale" }]];
  return [[shop], [{ text: "💬 Contact Seller", url: getSupportUrl() }]];
}

function buildMainMenuText(user) {
  const name = escapeMarkdown(user?.name || "");
  if (isStaff(user)) {
    const roleLabel = isAdmin(user) ? "Admin" : "Seller";
    return (
      `*END MART · ${roleLabel}*\n\n` +
      `Hi ${name || roleLabel} 👋\n` +
      `New orders arrive in this chat automatically.`
    );
  }
  return (
    `*DS STYLE · Streetwear & Sneakers*\n\n` +
    `Welcome${name ? `, ${name}` : ""}! 🔥\n` +
    `Sneakers, full fits, jeans and accessories, delivered across Addis Ababa.\n\n` +
    `📍 Golagole 22, Addis Ababa\n` +
    `💬 Orders: @DSstyle2 · Support: @Dsstyle1\n` +
    `📞 0918 10 10 22 · 0707 18 10 22 · 0998 77 73 33`
  );
}

/**
 * Send the role-based main menu (logo + text + buttons)
 */
export async function sendMainMenu(ctx, user) {
  const text = buildMainMenuText(user);
  const replyMarkup = { inline_keyboard: buildMainMenuKeyboard(user) };

  // Per-chat Menu button = command list (Admin gets extra commands)
  if (ctx.chat?.id) {
    const scope = { type: "chat", chat_id: ctx.chat.id };
    ctx.telegram
      .callApi("setChatMenuButton", { chat_id: ctx.chat.id, menu_button: { type: "commands" } })
      .catch(() => {});
    ctx.telegram.setMyCommands(isAdmin(user) ? ADMIN_COMMANDS : START_COMMAND, { scope }).catch(() => {});
  }

  try {
    await ctx.replyWithPhoto({ source: LOGO_PATH }, { caption: text, parse_mode: "Markdown", reply_markup: replyMarkup });
  } catch (logoErr) {
    console.warn("[Telegram Bot] Failed to send logo, falling back to text:", logoErr.message);
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: replyMarkup });
  }
}

// Helper to sanitize text so Telegram Markdown parser never errors on unescaped brackets/symbols
export function escapeMarkdown(str) {
  if (!str) return "";
  return String(str).replace(/([_*`\[\]\\])/g, "").trim();
}

// ----------------------
// Order Notification (the only message the bot sends on its own)
// ----------------------
export async function sendOrderNotificationToAdmins(order) {
  if (!bot) return;

  try {
    // Check if new order alerts are enabled in Admin Settings
    const setting = await Setting.findOne().lean();
    if (setting && setting.newOrderAlerts === false) {
      console.log("ℹ️ [Telegram Bot] Order alert skipped (newOrderAlerts disabled in Settings).");
      return;
    }

    // 1. Gather all staff (Admin & Seller) Telegram IDs
    const dbAdmins = await User.find({
      role: { $in: ["Admin", "admin", "Seller", "seller"] },
      telegramId: { $exists: true, $ne: "" },
    }).select("telegramId name role");

    const dbAdminIds = dbAdmins.map((u) => String(u.telegramId).trim()).filter(Boolean);

    // Also include any fallback IDs from environment
    const envAdminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s));

    const allAdminIds = [...new Set([...dbAdminIds, ...envAdminIds])];

    if (!allAdminIds.length) {
      console.warn("⚠️ No staff Telegram IDs found in database to send order notification.");
      return;
    }

    // 2. Format customer and order details
    const customerName = escapeMarkdown(order.customerName || "Customer");
    const rawPhone = (order.customerPhone || "").trim();
    const customerPhone = escapeMarkdown(rawPhone || "Not provided");
    const address = escapeMarkdown(order.deliveryAddress || order.address || "Addis Ababa");
    const orderId = order._id ? String(order._id).slice(-6).toUpperCase() : "N/A";
    const channel = order.saleType === "direct" ? "🏪 In-store sale" : "🛵 Online order (delivery)";

    // Lookup customer telegram account if available
    let customerTelegram = "";
    if (order.user) {
      try {
        const userDoc =
          typeof order.user === "object" && order.user.telegramUsername !== undefined
            ? order.user
            : await User.findById(order.user).select("telegramUsername telegramId").lean();
        if (userDoc?.telegramUsername) {
          customerTelegram = userDoc.telegramUsername.replace(/^@/, "").trim();
        }
      } catch (_) {}
    }

    // Normalize phone numbers for clickable links
    const digitsOnly = rawPhone.replace(/\D/g, "");
    let intlPhone = "";
    if (digitsOnly.startsWith("0") && digitsOnly.length === 10) {
      intlPhone = "251" + digitsOnly.slice(1);
    } else if (digitsOnly.startsWith("251")) {
      intlPhone = digitsOnly;
    } else if (digitsOnly.length >= 9) {
      intlPhone = digitsOnly;
    }

    // 3. Format items list
    let itemsList = "";
    let grandTotal = 0;
    let totalItemsCount = 0;

    const items = order.items || [];
    items.forEach((item, idx) => {
      const prod = item.product || {};
      const prodName = escapeMarkdown(prod.name || item.name || "Product");
      const qty = Number(item.quantity) || 1;
      const price = Number(item.priceAtPurchase || item.price || prod.price || 0);
      const subtotal = qty * price;
      grandTotal += subtotal;
      totalItemsCount += qty;
      itemsList += `${idx + 1}. ${prodName}\n    ${qty} × ${price.toLocaleString()} = *${subtotal.toLocaleString()} ETB*\n`;
    });

    const totalDisplay = order.totalPrice ? Number(order.totalPrice).toLocaleString() : grandTotal.toLocaleString();

    const orderTime = (order.createdAt ? new Date(order.createdAt) : new Date()).toLocaleString("en-US", {
      timeZone: "Africa/Addis_Ababa",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const notificationText =
      `🛍️ *New order #${orderId}*\n` +
      `${channel} · ${orderTime}\n\n` +
      `👤 *${customerName}*\n` +
      `📞 \`${customerPhone}\`\n` +
      `📍 ${address}\n` +
      (customerTelegram ? `💬 @${customerTelegram}\n` : "") +
      `\n📦 *Items (${totalItemsCount}):*\n` +
      (itemsList || "(no items)\n") +
      `\n💰 *Total: ${totalDisplay} ETB*`;

    const inlineButtons = [];

    // Row 1: Contact the customer
    const contactRow = [];
    if (customerTelegram) {
      contactRow.push({ text: `💬 Chat @${customerTelegram}`, url: `https://t.me/${customerTelegram}` });
    } else if (intlPhone) {
      contactRow.push({ text: `✈️ Telegram`, url: `https://t.me/+${intlPhone}` });
    }
    if (intlPhone) {
      contactRow.push({ text: `🟢 WhatsApp`, url: `https://wa.me/${intlPhone}` });
    }
    if (contactRow.length) {
      inlineButtons.push(contactRow);
    }

    // Row 2: Manage the order
    inlineButtons.push([{ text: "📋 Manage Order", web_app: { url: getAdminFrontendUrl() } }]);

    // 4. Send to each staff member
    for (const adminId of allAdminIds) {
      try {
        await bot.telegram.sendMessage(adminId, notificationText, {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: inlineButtons },
        });
        console.log(`✅ Order notification sent to staff Telegram ID: ${adminId}`);
      } catch (sendErr) {
        console.error(`❌ Failed to send order notification to ${adminId}:`, sendErr.message);
      }
    }
  } catch (err) {
    console.error("❌ Error in sendOrderNotificationToAdmins:", err);
  }
}

// ----------------------
// Order Confirmation to the customer (only for orders placed from Telegram)
// ----------------------
export async function sendOrderConfirmationToCustomer(order) {
  if (!bot) return;
  const match = String(order.guestId || "").match(/^tg_(\d+)$/);
  if (!match) return;

  try {
    const orderId = order._id ? String(order._id).slice(-6).toUpperCase() : "";
    const items = order.items || [];
    let total = 0;
    const lines = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.priceAtPurchase || item.product?.price || 0);
      total += qty * price;
      return `• ${escapeMarkdown(item.product?.name || "Product")} × ${qty}`;
    });
    const totalDisplay = Number(order.totalPrice || total).toLocaleString();
    const name = escapeMarkdown((order.customerName || "").split(" ")[0]);
    const phone = escapeMarkdown(order.customerPhone || "");

    const text =
      `✅ *Order received${orderId ? ` · #${orderId}` : ""}*\n\n` +
      `Thank you${name ? `, ${name}` : ""}! We've got your order.\n\n` +
      `${lines.join("\n")}\n\n` +
      `*Total: ${totalDisplay} ETB* (+ delivery 50–150 ETB)\n\n` +
      (phone ? `We'll call you on \`${phone}\` shortly to confirm delivery.` : `We'll contact you shortly to confirm delivery.`);

    await bot.telegram.sendMessage(match[1], text, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[{ text: "💬 Message Seller", url: getSupportUrl() }]] },
    });
  } catch (err) {
    console.warn("⚠️ Could not send order confirmation to customer:", err.message);
  }
}

// ----------------------
// Bot Event Listeners
// ----------------------
if (bot) {
  const showMenu = async (ctx) => {
    try {
      const user = await getOrRegisterUser(ctx.from);
      await sendMainMenu(ctx, user);
    } catch (err) {
      console.error("[Telegram Bot] menu error:", err);
      await ctx.reply("Welcome to DS Style! Tap below to open the shop:", {
        reply_markup: { inline_keyboard: [[{ text: "🛍️ Open Shop", web_app: { url: getFrontendUrl() } }]] },
      });
    }
  };

  // /start — role-based menu (also ends any half-finished sale)
  bot.command("start", async (ctx) => {
    if (ctx.from?.id) saleSessions.delete(ctx.from.id);
    await showMenu(ctx);
  });

  // /admin — Admin only: one button to the admin panel
  bot.command("admin", async (ctx) => {
    const user = await getOrRegisterUser(ctx.from);
    if (!isAdmin(user)) return showMenu(ctx);
    await ctx.reply("⚙️ Admin panel", {
      reply_markup: { inline_keyboard: [[{ text: "⚙️ Open Admin", web_app: { url: getAdminMiniAppUrl(user) } }]] },
    });
  });

  // /shop — one button to the shop
  bot.command("shop", async (ctx) => {
    const user = await getOrRegisterUser(ctx.from);
    await ctx.reply("🛍️ DS Style shop", {
      reply_markup: { inline_keyboard: [[{ text: "🛍️ Open Shop", web_app: { url: getShopMiniAppUrl(user) } }]] },
    });
  });

  // Older commands still in some users' menus just show the main menu
  bot.command(["search", "upload", "cancel"], async (ctx) => {
    if (ctx.from?.id) saleSessions.delete(ctx.from.id);
    await showMenu(ctx);
  });

  bot.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery?.data || "";

    if (data === "btn_record_sale") {
      const user = await getOrRegisterUser(ctx.from);
      if (!isSeller(user)) {
        await ctx.answerCbQuery("Only sellers can record sales here.", { show_alert: true });
        return;
      }
      await ctx.answerCbQuery();
      await startSale(ctx);
      return;
    }

    if (data.startsWith("sale_")) {
      const user = await getOrRegisterUser(ctx.from);
      if (!isSeller(user)) {
        saleSessions.delete(ctx.from.id);
        await ctx.answerCbQuery("Only sellers can record sales here.", { show_alert: true });
        return;
      }
      await handleSaleCallback(ctx, user);
      return;
    }

    if (data === "btn_main_menu") {
      saleSessions.delete(ctx.from.id);
    }
    // Menu button, or a button from an old menu that no longer exists
    await ctx.answerCbQuery();
    await showMenu(ctx);
  });

  // Text: feed the sale flow if one is active, otherwise show the menu
  bot.on("text", async (ctx) => {
    if (saleSessions.has(ctx.from.id) && (await handleSaleText(ctx))) return;
    await showMenu(ctx);
  });

  bot.catch((err, ctx) => {
    console.error(`[Telegram Bot] Error in update ${ctx?.update?.update_id}:`, err);
  });
}

/**
 * Initialize and launch bot
 */
export async function launchBot() {
  if (!bot) {
    console.warn("⚠️ Telegram Bot not initialized (missing token).");
    return;
  }

  try {
    // 1. Drop pending updates so it doesn't process stale commands on startup
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });

    // 2. Default Menu button shows the command list
    try {
      await bot.telegram.callApi("setChatMenuButton", { menu_button: { type: "commands" } });
    } catch (btnErr) {
      console.warn("⚠️ Could not set Chat Menu Button:", btnErr.message);
    }

    // 3. Default command list is /start; Admins get theirs per chat in sendMainMenu
    try {
      await bot.telegram.setMyCommands(START_COMMAND);
    } catch (_) { }

    // Refresh per-chat Menu button and commands for users who already chatted with the bot
    try {
      const known = await User.find({ telegramId: { $exists: true, $ne: "" } }).select("telegramId role").lean();
      for (const u of known) {
        const chatId = Number(u.telegramId);
        if (!chatId) continue;
        await bot.telegram.callApi("setChatMenuButton", { chat_id: chatId, menu_button: { type: "commands" } }).catch(() => {});
        await bot.telegram
          .setMyCommands(isAdmin(u) ? ADMIN_COMMANDS : START_COMMAND, { scope: { type: "chat", chat_id: chatId } })
          .catch(() => {});
      }
      console.log(`📋 Menu refreshed for ${known.length} Telegram users.`);
    } catch (refreshErr) {
      console.warn("⚠️ Could not refresh per-user menus:", refreshErr.message);
    }

    // 4. Launch polling
    console.log(`🤖 Telegram Bot @${process.env.TELEGRAM_BOT_USERNAME || "DS_Style_bot"} launching polling...`);
    // NOTE: in Telegraf 4 the launch() promise only settles when polling STOPS.
    // If another instance steals getUpdates (409 Conflict) or the network drops,
    // polling dies silently — so we retry instead of giving up forever.
    let stopping = false;
    const startPolling = (attempt = 0) => {
      bot.launch({
        dropPendingUpdates: attempt === 0,
        allowedUpdates: ["message", "callback_query"],
      }).then(() => {
        console.log(`🛑 Telegram Bot @${process.env.TELEGRAM_BOT_USERNAME || "DS_Style_bot"} polling stopped.`);
      }).catch((botErr) => {
        if (stopping) return;
        const delay = Math.min(60000, 5000 * (attempt + 1));
        console.error(`⚠️ Telegram Bot polling error: ${botErr.message} — retrying in ${delay / 1000}s`);
        setTimeout(() => startPolling(attempt + 1), delay);
      });
    };
    startPolling();

    // Graceful stop
    process.once("SIGINT", () => {
      stopping = true;
      bot.stop("SIGINT");
    });
    process.once("SIGTERM", () => {
      stopping = true;
      bot.stop("SIGTERM");
    });
  } catch (err) {
    console.error("❌ Failed to launch Telegram Bot:", err.message);
  }
}

export default bot;
