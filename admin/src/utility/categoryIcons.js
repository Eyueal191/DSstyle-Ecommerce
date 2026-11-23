// Shared Category Icon & Visual Theming Helper for DS Style (fashion categories)
const theme = (icon, color) => ({
  icon,
  bg: `bg-${color}-50 dark:bg-${color}-500/10`,
  text: `text-${color}-600`,
  border: `border-${color}-200/80 dark:border-${color}-500/25`,
  pill: `bg-${color}-50 text-${color}-700 border-${color}-200/80 dark:bg-${color}-500/10 dark:text-${color}-300 dark:border-${color}-500/25`,
});

// Tailwind needs full class names in source to generate them, so they are listed here:
// bg-pink-50 bg-amber-50 bg-sky-50 bg-indigo-50 bg-emerald-50 bg-orange-50 bg-purple-50
// dark:bg-pink-500/10 dark:bg-amber-500/10 dark:bg-sky-500/10 dark:bg-indigo-500/10 dark:bg-emerald-500/10 dark:bg-orange-500/10 dark:bg-purple-500/10
// text-pink-600 text-amber-600 text-sky-600 text-indigo-600 text-emerald-600 text-orange-600 text-purple-600
// text-pink-700 text-amber-700 text-sky-700 text-indigo-700 text-emerald-700 text-orange-700 text-purple-700
// dark:text-pink-300 dark:text-amber-300 dark:text-sky-300 dark:text-indigo-300 dark:text-emerald-300 dark:text-orange-300 dark:text-purple-300
// border-pink-200/80 border-amber-200/80 border-sky-200/80 border-indigo-200/80 border-emerald-200/80 border-orange-200/80 border-purple-200/80
// dark:border-pink-500/25 dark:border-amber-500/25 dark:border-sky-500/25 dark:border-indigo-500/25 dark:border-emerald-500/25 dark:border-orange-500/25 dark:border-purple-500/25

export const CATEGORY_COLOR_STYLES = {
  sneakers: theme("👟", "pink"),
  boots: theme("🥾", "orange"),
  "slides & crocs": theme("🩴", "sky"),
  "t-shirts & shirts": theme("👕", "indigo"),
  "hoodies & tracksuits": theme("🧥", "purple"),
  "jeans & pants": theme("👖", "sky"),
  "shorts & jorts": theme("🩳", "indigo"),
  "complete outfits": theme("🔥", "pink"),
  "bags & backpacks": theme("🎒", "emerald"),
  belts: theme("🪢", "amber"),
  "caps & beanies": theme("🧢", "orange"),
  "jewelry & grillz": theme("💎", "amber"),
  "eyewear & accessories": theme("🕶️", "emerald"),
};

export const PRESET_ICONS = [
  { label: "Sneakers", icon: "👟", theme: "pink" },
  { label: "Boots", icon: "🥾", theme: "orange" },
  { label: "Slides & Crocs", icon: "🩴", theme: "sky" },
  { label: "T-Shirts & Shirts", icon: "👕", theme: "indigo" },
  { label: "Hoodies & Tracksuits", icon: "🧥", theme: "purple" },
  { label: "Jeans & Pants", icon: "👖", theme: "sky" },
  { label: "Shorts & Jorts", icon: "🩳", theme: "indigo" },
  { label: "Complete Outfits", icon: "🔥", theme: "pink" },
  { label: "Bags & Backpacks", icon: "🎒", theme: "emerald" },
  { label: "Belts", icon: "🪢", theme: "amber" },
  { label: "Caps & Beanies", icon: "🧢", theme: "orange" },
  { label: "Jewelry & Grillz", icon: "💎", theme: "amber" },
  { label: "Eyewear & Accessories", icon: "🕶️", theme: "emerald" },
  { label: "New Drops", icon: "✨", theme: "pink" },
  { label: "Special Offers", icon: "🏷️", theme: "amber" },
];

// Keyword fallbacks so admin-created categories still get a sensible icon
const KEYWORDS = [
  [["sneaker", "jordan", "shoe", "trainer", "kick"], "sneakers"],
  [["boot", "timberland"], "boots"],
  [["slide", "croc", "sandal", "slipper"], "slides & crocs"],
  [["shirt", "tee", "top", "polo", "sleeve"], "t-shirts & shirts"],
  [["hoodie", "track", "fleece", "sweat", "jacket"], "hoodies & tracksuits"],
  [["jean", "pant", "trouser", "denim"], "jeans & pants"],
  [["short", "jort"], "shorts & jorts"],
  [["outfit", "complete", "set", "fit"], "complete outfits"],
  [["bag", "backpack", "pack"], "bags & backpacks"],
  [["belt"], "belts"],
  [["cap", "hat", "beanie"], "caps & beanies"],
  [["jewel", "grill", "chain", "ring", "earring", "necklace"], "jewelry & grillz"],
  [["glass", "eyewear", "watch", "bandana", "sock", "access"], "eyewear & accessories"],
];

export const getCategoryTheme = (category) => {
  const name = (typeof category === "object" ? category?.name : String(category || "")).toLowerCase().trim();

  if (CATEGORY_COLOR_STYLES[name]) return CATEGORY_COLOR_STYLES[name];
  for (const [words, key] of KEYWORDS) {
    if (words.some((w) => name.includes(w))) return CATEGORY_COLOR_STYLES[key];
  }
  return theme("🛍️", "pink");
};

export const getCategoryIcon = (category) => {
  return getCategoryTheme(category).icon;
};

export const getCategoryName = (cat) => {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (typeof cat === "object" && cat.name) return cat.name;
  return "General";
};
