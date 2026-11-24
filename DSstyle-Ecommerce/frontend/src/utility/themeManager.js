// Global Database-Driven Theme & Color Engine for DS Style (Admin & Client Storefront)
// Synchronizes brand accent colors and dark/light mode across Admin & Storefront via MongoDB

export const THEME_PALETTES = [
  { id: "gold", name: "DS Gold", primary: "#c9a043", hover: "#b58d33", light: "#faf3e3", border: "#ecd9a8", on: "#0c0b0a", text: "#8a6516", dark: "#d9b44a", darkHover: "#c49f35", darkOn: "#0c0b0a", darkText: "#e2c478", desc: "Signature gold" },
  { id: "signature", name: "DS Signature", primary: "#2a2420", hover: "#3d352f", light: "#f3efe8", border: "#ddd5c8", dark: "#d6bd84", darkHover: "#c9ad6e", darkOn: "#0c0b0a", desc: "Espresso & champagne" },
  { id: "teal", name: "Deep Teal", primary: "#0f5e63", hover: "#0b4a4e", light: "#e8f3f3", border: "#c2dfe0", dark: "#7cc8c0", darkHover: "#66b8af", darkOn: "#0c0b0a", desc: "Calm teal & gold" },
  { id: "steel", name: "Steel", primary: "#34495e", hover: "#283a4b", light: "#eef2f6", border: "#cfd9e3", dark: "#a9bfd6", darkHover: "#93abc4", darkOn: "#0c0b0a", desc: "Quiet blue-grey" },
  { id: "forest", name: "Forest", primary: "#1f5c45", hover: "#184a37", light: "#eaf3ee", border: "#c6e0d2", dark: "#8fcfb0", darkHover: "#78bf9d", darkOn: "#0c0b0a", desc: "Black, gold & green" },
  { id: "emerald", name: "Emerald", primary: "#0f6b4f", hover: "#0b5640", light: "#e8f4ef", border: "#c3e2d5", desc: "Black, gold & green" },
  { id: "crimson", name: "Crimson", primary: "#b3122e", hover: "#940f26", light: "#fbe9ec", border: "#f2c6ce", desc: "Street heat" },
  { id: "graphite", name: "Graphite", primary: "#2b2a2e", hover: "#1c1b1f", light: "#f1f0f2", border: "#d6d4d9", dark: "#e9e6df", darkHover: "#d8d4ca", darkOn: "#0c0b0a", desc: "Monochrome" },
  { id: "sapphire", name: "Royal Sapphire", primary: "#2149c6", hover: "#1a3aa3", light: "#edf2fd", border: "#c9d6f6", desc: "Deep blue" },
  { id: "plum", name: "Velvet Plum", primary: "#9b2c6e", hover: "#7e2159", light: "#f7ecf2", border: "#e8c9da", desc: "Evening edit" },
  { id: "terracotta", name: "Terracotta", primary: "#b4532a", hover: "#964421", light: "#fbefe9", border: "#f1d2c3", desc: "Sunbaked clay" },
  { id: "ocean", name: "Ocean Teal", primary: "#0f6e85", hover: "#0c5a6d", light: "#e9f5f8", border: "#c3e2ea", desc: "Coastal calm" },
];

// Helper: Convert Hex to RGB
export const hexToRgb = (hex) => {
  let c = (hex || "#c9a043").replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

// Helper: Adjust color brightness for hover & pastel tint
export const adjustBrightness = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (val) => Math.max(0, Math.min(255, val));
  const newR = clamp(Math.round(r + (r * percent) / 100));
  const newG = clamp(Math.round(g + (g * percent) / 100));
  const newB = clamp(Math.round(b + (b * percent) / 100));
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
};

// Compute dynamic palette from any hex
export const getDynamicPalette = (primaryHex) => {
  const hex = primaryHex || "#c9a043";
  const matched = THEME_PALETTES.find(
    (p) => p.primary.toLowerCase() === hex.toLowerCase()
  );
  if (matched) return matched;

  const { r, g, b } = hexToRgb(hex);
  return {
    id: "custom",
    name: "Custom Brand",
    primary: hex,
    hover: adjustBrightness(hex, -15),
    light: `rgba(${r}, ${g}, ${b}, 0.12)`,
    border: `rgba(${r}, ${g}, ${b}, 0.28)`,
  };
};

// Inject dynamic CSS rules into document.head for brand accent variables
const injectDynamicStyles = (palette, isDark) => {
  if (typeof document === "undefined") return;

  let styleTag = document.getElementById("dsstyle-dynamic-theme-engine");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "dsstyle-dynamic-theme-engine";
    document.head.appendChild(styleTag);
  }

  const { primary, hover, light, border } = palette;
  const { r, g, b } = hexToRgb(primary);
  // Optional dark-mode variant (e.g. bright gold with black text on warm black)
  const darkPrimary = palette.dark || primary;
  const darkHover = palette.darkHover || hover;
  const darkOn = palette.darkOn || "#ffffff";
  const d = hexToRgb(darkPrimary);

  styleTag.textContent = `
    :root {
      --brand-primary: ${primary};
      --brand-primary-hover: ${hover};
      --brand-primary-light: ${light};
      --brand-primary-border: ${border};
      --brand-primary-rgb: ${r}, ${g}, ${b};
      --brand-on: ${palette.on || "#ffffff"};
      --brand-text: ${palette.text || primary};
    }
    html.dark {
      --brand-primary: ${darkPrimary};
      --brand-primary-hover: ${darkHover};
      --brand-primary-rgb: ${d.r}, ${d.g}, ${d.b};
      --brand-on: ${darkOn};
      --brand-text: ${palette.darkText || darkPrimary};
    }

    .bg-brand {
      background-color: var(--brand-primary) !important;
    }
    .hover\\:bg-brand:hover {
      background-color: var(--brand-primary-hover) !important;
    }
    .text-brand {
      color: var(--brand-primary) !important;
    }
    .border-brand {
      border-color: var(--brand-primary) !important;
    }
    .bg-brand-light {
      background-color: var(--brand-primary-light) !important;
    }
    .border-brand-light {
      border-color: var(--brand-primary-border) !important;
    }
  `;
};

// Apply Theme to DOM (:root CSS variables, <style> overrides, and .dark class on <html>)
export const applyTheme = (settings = {}) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Default brand color is fixed to signature DS Style gold #c9a043
  const primary = settings.primaryColor || "#c9a043";
  const mode = settings.themeMode || "light";
  const palette = getDynamicPalette(primary);

  const root = document.documentElement;

  // 1. Determine if Dark Mode is active (Strictly White Theme vs Dark Theme)
  const isDark = mode === "dark";

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // 2. Inject Dynamic CSS Overrides
  injectDynamicStyles(palette, isDark);

  // 3. Cache locally for zero-flicker loading across all pages and tabs
  const themeState = {
    primaryColor: palette.primary,
    themeMode: isDark ? "dark" : "light",
    accentPalette: settings.accentPalette || palette.id,
    isDark,
    updatedAt: Date.now(),
  };
  localStorage.setItem("dsstyle_theme_v6", JSON.stringify(themeState));

  // 4. Dispatch custom event for in-page reactive components
  window.dispatchEvent(
    new CustomEvent("dsstyle_theme_changed", { detail: themeState })
  );
};

// Save user theme preference locally in localStorage
export const saveUserThemePreference = (settings) => {
  return applyTheme(settings);
};

// Backward-compatible alias
export const saveAdminDefaultTheme = (settings) => {
  return applyTheme(settings);
};

export const saveThemeToDatabase = saveAdminDefaultTheme;

// Initialize Theme as pure client-side user preference from localStorage
export const initTheme = () => {
  if (typeof window === "undefined") return;

  const defaultTheme = { primaryColor: "#c9a043", themeMode: "light", accentPalette: "gold" };

  const cached = localStorage.getItem("dsstyle_theme_v6");
  if (cached) {
    try {
      applyTheme(JSON.parse(cached));
    } catch {
      applyTheme(defaultTheme);
    }
  } else {
    applyTheme(defaultTheme);
  }

  // Listen to cross-tab storage changes to keep user preference in sync across tabs
  window.addEventListener("storage", (e) => {
    if (e.key === "dsstyle_theme_v6" && e.newValue) {
      try {
        applyTheme(JSON.parse(e.newValue));
      } catch {}
    }
  });
};

// Quick Toggle: Flip between Light and Dark as pure user preference
export const toggleDarkMode = () => {
  const root = document.documentElement;
  const isCurrentlyDark = root.classList.contains("dark");
  const newMode = isCurrentlyDark ? "light" : "dark";

  let currentSettings = { primaryColor: "#c9a043", themeMode: "light", accentPalette: "gold" };
  const cached = localStorage.getItem("dsstyle_theme_v6");
  if (cached) {
    try {
      currentSettings = JSON.parse(cached);
    } catch {}
  }

  currentSettings.primaryColor = currentSettings.primaryColor || "#c9a043";
  currentSettings.themeMode = newMode;
  applyTheme(currentSettings);
  return newMode;
};
