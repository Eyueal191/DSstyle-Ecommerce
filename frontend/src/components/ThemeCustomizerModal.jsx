import React, { useState, useEffect } from "react";
import {
  Palette,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Sparkles,
  Save,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Axios from "../axios/axios.config.js";
import {
  THEME_PALETTES,
  applyTheme,
  saveThemeToDatabase,
  getDynamicPalette,
} from "../utility/themeManager.js";

function ThemeCustomizerModal({ isOpen, onClose }) {
  const [themeMode, setThemeMode] = useState("dark");
  const [primaryColor, setPrimaryColor] = useState("#c9a043");
  const [accentPalette, setAccentPalette] = useState("gold");
  const [savingTheme, setSavingTheme] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync current settings when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const cached = localStorage.getItem("dsstyle_theme_v6");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.themeMode) setThemeMode(parsed.themeMode);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.accentPalette) setAccentPalette(parsed.accentPalette);
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle color select (live preview)
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

  const handleThemeModeChange = (mode) => {
    setThemeMode(mode);
    applyTheme({
      themeMode: mode,
      primaryColor,
      accentPalette,
    });
  };

  // Save user theme preference locally and sync to User model
  const handleSaveTheme = async () => {
    try {
      setSavingTheme(true);
      await saveThemeToDatabase({ themeMode, primaryColor, accentPalette }, Axios);
      setSavedSuccess(true);
      toast.success("Theme preference saved!");
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    } catch {
      toast.error("Failed to save theme preference");
    } finally {
      setSavingTheme(false);
    }
  };

  const currentDynamicPalette = getDynamicPalette(primaryColor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 dark:text-white">
                  Brand Theme & Appearance
                </h2>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1"
                  style={{
                    backgroundColor: currentDynamicPalette.light,
                    borderColor: currentDynamicPalette.border,
                    color: primaryColor,
                  }}
                >
                  <Sparkles className="w-3 h-3" /> Live
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose your theme mode and brand accent color
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Display Mode */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
              Display Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "light", label: "Light", icon: Sun, desc: "Crisp & clear" },
                { id: "dark", label: "Dark", icon: Moon, desc: "Sleek dark" },
                { id: "system", label: "System", icon: Laptop, desc: "OS default" },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleThemeModeChange(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-pink-600 bg-pink-50/40 dark:bg-rose-950/20 ring-2 ring-pink-600/30 shadow-xs"
                        : "border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 hover:bg-gray-100/50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? "text-pink-600" : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-600" />
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

          {/* Brand Accent Palette Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Brand Accent Palette
              </label>
              <span className="text-[11px] text-gray-400">
                Options: Calm & Blue
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {THEME_PALETTES.map((pal) => {
                const isSelected =
                  accentPalette === pal.id ||
                  primaryColor.toLowerCase() === pal.primary.toLowerCase();

                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => handleColorSelect(pal)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 text-left relative ${
                      isSelected
                        ? "border-gray-900 dark:border-white shadow-xs ring-2 ring-gray-900/10 dark:ring-white/20 bg-gray-50 dark:bg-slate-800"
                        : "border-gray-200 dark:border-slate-800 hover:border-gray-300 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-xl shrink-0 shadow-2xs border border-white/40 flex items-center justify-center text-white"
                      style={{ backgroundColor: pal.primary }}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="block text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {pal.name}
                        </span>
                        {pal.id === "gold" && (
                          <span className="text-[9px] px-1.5 py-px bg-[#faf3e3] text-[#c9a043] dark:bg-[#d9b44a]/15 dark:text-[#d9b44a] rounded font-medium">
                            Default
                          </span>
                        )}
                        {pal.id === "blue" && (
                          <span className="text-[9px] px-1.5 py-px bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 rounded font-medium">
                            Blue
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {pal.primary}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="mt-3.5 pt-3.5 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Custom Hex:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handleCustomColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 dark:border-slate-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => handleCustomColor(e.target.value)}
                    placeholder="#c9a043"
                    className="w-24 px-2 py-1 text-xs font-mono border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white uppercase"
                  />
                </div>
              </div>

              {/* Live Preview Sample */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Preview:</span>
                <span
                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-white shadow-xs transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  Action
                </span>
                <span
                  className="px-2 py-1 rounded-xl text-xs font-semibold border transition-colors"
                  style={{
                    backgroundColor: currentDynamicPalette.light,
                    borderColor: currentDynamicPalette.border,
                    color: primaryColor,
                  }}
                >
                  Accent
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Dedicated Save Button */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Saved changes apply across Admin & Storefront.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTheme}
              disabled={savingTheme}
              className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {savingTheme ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Theme & Brand Color</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeCustomizerModal;

