import React, { useState, useEffect } from "react";
import Axios from "../axios/axios.config.js";
import { toast } from "react-toastify";
import {
  Store,
  Share2,
  Bell,
  Palette,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Sparkles,
  Send,
  Facebook,
  Instagram,
  RefreshCw,
  Save,
  Check,
} from "lucide-react";
import {
  THEME_PALETTES,
  applyTheme,
  getDynamicPalette,
} from "../utility/themeManager.js";

function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store details
  const [storeName, setStoreName] = useState("DS Style");
  const [phone, setPhone] = useState("+251 911 234 567");
  const [address, setAddress] = useState("Golagole 22, Addis Ababa, Ethiopia");

  // Social media & Telegram details
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("https://www.tiktok.com/@dsstyle__");
  const [telegramSupport, setTelegramSupport] = useState("https://t.me/Dsstyle1");
  const [telegramChannel, setTelegramChannel] = useState("https://t.me/DSstyles");

  // Notification switches
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Appearance & Theme settings (Strictly Client-Side Context - Defaults to Light)
  const [themeMode, setThemeMode] = useState("light");
  const [primaryColor, setPrimaryColor] = useState("#c9a043");
  const [accentPalette, setAccentPalette] = useState("rose");

  // Fetch settings from MongoDB
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await Axios.get("/api/setting");
        if (res.data?.success && res.data?.data) {
          const s = res.data.data;
          if (s.storeName) setStoreName(s.storeName);
          if (s.phoneNumber) setPhone(s.phoneNumber);
          if (s.address) setAddress(s.address);

          if (s.facebook) setFacebook(s.facebook);
          if (s.instagram) setInstagram(s.instagram);
          if (s.tiktok) setTiktok(s.tiktok);
          if (s.telegramSupport) setTelegramSupport(s.telegramSupport);
          if (s.telegramChannel) setTelegramChannel(s.telegramChannel);

          if (s.newOrderAlerts !== undefined) setNewOrderAlerts(s.newOrderAlerts);
          if (s.lowStockAlerts !== undefined) setLowStockAlerts(s.lowStockAlerts);
          if (s.weeklyReports !== undefined) setWeeklyReports(s.weeklyReports);
        }
      } catch (err) {
        console.warn("Could not fetch settings from backend:", err.message);
      } finally {
        setLoading(false);
      }
    };

    // Load user theme preference strictly from local storage
    const cachedTheme = localStorage.getItem("dsstyle_admin_theme_v6") || localStorage.getItem("dsstyle_theme_v6");
    if (cachedTheme) {
      try {
        const parsed = JSON.parse(cachedTheme);
        if (parsed.themeMode) setThemeMode(parsed.themeMode);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.accentPalette) setAccentPalette(parsed.accentPalette);
      } catch { }
    }

    fetchSettings();
  }, []);

  // Handle color change in real time (client-side context)
  const handleColorSelect = (palette) => {
    setPrimaryColor(palette.primary);
    setAccentPalette(palette.id);
    applyTheme({
      themeMode,
      primaryColor: palette.primary,
      accentPalette: palette.id,
    });
  };

  const handleCustomColor = (hex) => {
    setPrimaryColor(hex);
    setAccentPalette("custom");
    applyTheme({
      themeMode,
      primaryColor: hex,
      accentPalette: "custom",
    });
  };

  // Handle theme mode change in real time (pure client context)
  const handleThemeModeChange = (mode) => {
    setThemeMode(mode);
    applyTheme({
      themeMode: mode,
      primaryColor,
      accentPalette,
    });
    toast.success(`Switched to ${mode === "dark" ? "Dark Theme" : "White Theme"}`);
  };

  // Immediate toggle for notification switches to backend mechanism
  const handleToggleNotification = async (key, currentValue, setter, label) => {
    const newValue = !currentValue;
    setter(newValue);
    try {
      await Axios.put("/api/setting", { [key]: newValue });
      toast.success(`${label} ${newValue ? "enabled" : "disabled"}`);
    } catch {
      setter(currentValue);
      toast.error(`Failed to update ${label}`);
    }
  };

  // Save store details & notification settings to MongoDB
  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const payload = {
        storeName,
        phoneNumber: phone,
        address,
        facebook,
        instagram,
        tiktok,
        telegramSupport,
        telegramChannel,
        newOrderAlerts,
        lowStockAlerts,
        weeklyReports,
      };

      const res = await Axios.put("/api/setting", payload);
      if (res.data?.success) {
        toast.success("Store settings updated successfully!");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const currentDynamicPalette = getDynamicPalette(primaryColor);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">
            Settings & Appearance
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your store profile, social channels, and global brand theme across Admin & Storefront.
          </p>
        </div>
        {loading && (
          <span className="text-xs text-gray-400 animate-pulse">
            Loading settings...
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Brand Theme & Appearance Mode (Applies to Admin & Client) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-gray-200/70 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs"
                style={{ backgroundColor: primaryColor }}
              >
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
                  Theme & Appearance Preferences
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select your personal theme mode and accent color (saved locally on this device as your user preference).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border hidden sm:inline-flex items-center gap-1 dark:!bg-pink-500/10 dark:!border-pink-500/25"
                style={{
                  backgroundColor: currentDynamicPalette.light,
                  borderColor: currentDynamicPalette.border,
                  color: primaryColor,
                }}
              >
                <Sparkles className="w-3 h-3" /> Live Theme Engine
              </span>
            </div>
          </div>

          {/* Theme Mode Selector (White and Dark Theme Toggler Only) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Display Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "light", label: "White Theme", icon: Sun, desc: "Crisp white background" },
                { id: "dark", label: "Dark Theme", icon: Moon, desc: "Sleek dark background & pure white text" },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleThemeModeChange(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${isSelected
                      ? "border-pink-600 bg-pink-50/40 dark:bg-rose-950/20 ring-2 ring-pink-600/30 shadow-xs"
                      : "border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 hover:bg-gray-100/50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon
                        className={`w-5 h-5 ${isSelected ? "text-pink-600" : "text-gray-500 dark:text-gray-400"
                          }`}
                      />
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-pink-600" />
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-gray-900 dark:text-white">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Store Information */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-gray-200/70 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-pink-600" />
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
              Store Information
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            Manage your public store profile, contact information, and business hours.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/70 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone Number (Store Hotline)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 9xx xxx xxx"
                className="w-full px-3.5 py-2.5 bg-gray-50/70 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/70 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Social & Telegram Integration */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-gray-200/70 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="w-4 h-4 text-pink-600" />
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
              Social & Community Channels
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            Connect your Telegram support chat, Telegram channel, and social accounts.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  <span>Telegram Support Bot/User</span>
                </label>
                <input
                  type="text"
                  value={telegramSupport}
                  onChange={(e) => setTelegramSupport(e.target.value)}
                  placeholder="https://t.me/Dsstyle1"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  <span>Telegram Official Channel</span>
                </label>
                <input
                  type="text"
                  value={telegramChannel}
                  onChange={(e) => setTelegramChannel(e.target.value)}
                  placeholder="https://t.me/DSstyles"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                  <span>Facebook</span>
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Instagram</span>
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  TikTok
                </label>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Notifications */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-gray-200/70 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-pink-600" />
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
              Notifications & Alerts
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            Configure automated system alerts for incoming orders and low inventory.
          </p>

          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {/* New Order Alerts */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">New Order Alerts</p>
                <p className="text-xs text-gray-400 mt-0.5">Instant notification for each customer order</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotification("newOrderAlerts", newOrderAlerts, setNewOrderAlerts, "New Order Alerts")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${newOrderAlerts ? "bg-pink-600" : "bg-gray-200 dark:bg-slate-700"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block em-keep-light h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${newOrderAlerts ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                />
              </button>
            </div>

            {/* Low Stock Alerts */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Low Stock Alerts</p>
                <p className="text-xs text-gray-400 mt-0.5">Alert when products fall below 15 units</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotification("lowStockAlerts", lowStockAlerts, setLowStockAlerts, "Low Stock Alerts")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${lowStockAlerts ? "bg-pink-600" : "bg-gray-200 dark:bg-slate-700"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block em-keep-light h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${lowStockAlerts ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                />
              </button>
            </div>

            {/* Weekly Reports */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Weekly Reports</p>
                <p className="text-xs text-gray-400 mt-0.5">Receive weekly sales & revenue summary</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotification("weeklyReports", weeklyReports, setWeeklyReports, "Weekly Reports")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${weeklyReports ? "bg-pink-600" : "bg-gray-200 dark:bg-slate-700"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block em-keep-light h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${weeklyReports ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving All Changes...</span>
              </>
            ) : (
              <span>Save All Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
