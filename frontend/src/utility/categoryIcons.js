// Category Icons & Helpers for the DS Style storefront (fashion categories)
const ICONS = [
  [["outfit", "complete", "set"], "🔥"],
  [["sneaker", "jordan", "shoe", "trainer", "kick"], "👟"],
  [["boot", "timberland"], "🥾"],
  [["slide", "croc", "sandal", "slipper"], "🩴"],
  [["hoodie", "track", "fleece", "sweat", "jacket"], "🧥"],
  [["shirt", "tee", "top", "polo", "sleeve"], "👕"],
  [["jean", "pant", "trouser", "denim"], "👖"],
  [["short", "jort"], "🩳"],
  [["bag", "backpack"], "🎒"],
  [["belt"], "🪢"],
  [["cap", "hat", "beanie"], "🧢"],
  [["jewel", "grill", "chain", "ring", "necklace"], "💎"],
  [["glass", "eyewear", "watch", "bandana", "access"], "🕶️"],
];

export const getCategoryIcon = (categoryName) => {
  if (!categoryName) return "✨";
  const name = categoryName.toLowerCase().trim();
  if (name === "all") return "✨";
  for (const [words, icon] of ICONS) {
    if (words.some((w) => name.includes(w))) return icon;
  }
  return "🛍️";
};
