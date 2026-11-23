import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Sparkles,
  Save,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import Axios from "../axios/axios.config.js";
import {
  applyTheme,
  saveThemeToDatabase,
} from "../utility/themeManager.js";

function Settings() {
  const [themeMode, setThemeMode] = useState("dark");
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("dsstyle_theme_v6");
    if (cached) {
      try {
        const s = JSON.parse(cached);
        if (s.themeMode) setThemeMode(s.themeMode);
      } catch {}
    }
    setLoading(false);
  }, []);

  const handleThemeModeChange = (mode) => {
    setThemeMode(mode);
    applyTheme({
      themeMode: mode,
      primaryColor: "#c9a043",
      accentPalette: "gold",
    });
  };

  const handleSaveTheme = async () => {
    try {
      setSavingTheme(true);
      await saveThemeToDatabase({ themeMode, primaryColor: "#c9a043", accentPalette: "gold" }, Axios);
      setSavedSuccess(true);
      toast.success("Theme preference saved!");
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      toast.error("Failed to save theme preference");
    } finally {
      setSavingTheme(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f3f0] dark:bg-[#0c0b0a] transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">
              Storefront Appearance & Theme
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose your preferred display mode across DS Style.
            </p>
          </div>
          {loading && (
            <span className="text-xs text-gray-400 animate-pulse">Loading...</span>
          )}
        </div>

        {/* Main Appearance Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: "var(--brand-primary, #c9a043)" }}
              >
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
                  Display Mode (Bright & Dark)
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Switch between Bright Light mode and Sleek Dark mode.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border hidden sm:inline-flex items-center gap-1 bg-pink-50 text-pink-600 border-pink-200"
              >
                <Sparkles className="w-3 h-3 text-pink-600" /> Signature Brand Pink
              </span>

              {/* Quick Top Save Button */}
              <button
                type="button"
                onClick={handleSaveTheme}
                disabled={savingTheme}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingTheme ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Theme</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Display Mode Selector (White and Dark Theme Toggler Only) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
              Display Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "light", label: "White Theme", icon: Sun, desc: "Crisp white background & clear contrast" },
                { id: "dark", label: "Dark Theme", icon: Moon, desc: "Sleek dark background & pure white text" },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleThemeModeChange(opt.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-pink-600 bg-pink-50/50 dark:bg-rose-950/20 ring-2 ring-pink-600/30 shadow-xs"
                        : "border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 hover:bg-gray-100/50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? "text-pink-600" : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-pink-600" />
                      )}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Sample */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Theme Preview:</span>
              <span
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: "var(--brand-primary, #c9a043)" }}
              >
                Primary Button
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                Accent Badge
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveTheme}
              disabled={savingTheme}
              className="w-full sm:w-auto px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingTheme ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Theme Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Theme Preference</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
