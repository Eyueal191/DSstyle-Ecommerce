import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "DS Style",
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: "0918 10 10 22",
      trim: true,
    },
    address: {
      type: String,
      default: "Golagole 22, Addis Ababa, Ethiopia",
      trim: true,
    },
    // Social Media & Telegram details
    facebook: {
      type: String,
      default: "",
      trim: true,
    },
    instagram: {
      type: String,
      default: "",
      trim: true,
    },
    tiktok: {
      type: String,
      default: "https://www.tiktok.com/@dsstyle__",
      trim: true,
    },
    telegramSupport: {
      type: String,
      default: "https://t.me/Dsstyle1",
      trim: true,
    },
    telegramChannel: {
      type: String,
      default: "https://t.me/DSstyles",
      trim: true,
    },
    // Global Default Theme & Brand Color (Configured by Admin, used as default for all visitors)
    themeMode: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    primaryColor: {
      type: String,
      default: "#c9a043",
      trim: true,
    },
    accentPalette: {
      type: String,
      default: "gold",
      trim: true,
    },
    // Notification preferences
    newOrderAlerts: {
      type: Boolean,
      default: true,
    },
    lowStockAlerts: {
      type: Boolean,
      default: true,
    },
    weeklyReports: {
      type: Boolean,
      default: false,
    },
    // AI Advisor Configuration
    geminiApiKey: {
      type: String,
      default: "",
      trim: true,
    },
    // Payment Gateway
    chapaApiKey: {
      type: String,
      default: "CHASECK_TEST-xxxxxxxx",
      trim: true,
    },
    chapaWebhookSecret: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;

