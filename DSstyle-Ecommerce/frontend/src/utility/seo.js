/**
 * DS Style Dynamic SEO Manager
 * Updates document.title, meta description, and OpenGraph tags dynamically per route
 * for optimum Google Search visibility and rich social media previews (Telegram, WhatsApp, etc.).
 */

const DEFAULT_TITLE = "DS Style | Streetwear, Sneakers & Accessories in Addis Ababa";
const DEFAULT_DESCRIPTION = "Shop sneakers, complete outfits, jeans, belts, caps, grillz and accessories from DS Style, Golagole 22, Addis Ababa. New drops every week, delivery across Addis.";
// Canonical URLs and share images follow whatever domain the site is served from.
const DEFAULT_CANONICAL = typeof window !== "undefined" ? window.location.origin : "";
const DEFAULT_IMAGE = `${DEFAULT_CANONICAL}/logo.jpg`;

export function updateSEO({
  title,
  description,
  canonical,
  image,
  keywords,
} = {}) {
  if (typeof document === "undefined") return;

  // 1. Title
  const finalTitle = title
    ? (title.includes("DS Style") ? title : `${title} | DS Style`)
    : DEFAULT_TITLE;
  document.title = finalTitle;

  // 2. Meta Description
  const finalDesc = description || DEFAULT_DESCRIPTION;
  setMetaTag('name', 'description', finalDesc);
  setMetaTag('property', 'og:description', finalDesc);
  setMetaTag('name', 'twitter:description', finalDesc);

  // 3. OpenGraph Title
  setMetaTag('property', 'og:title', finalTitle);
  setMetaTag('name', 'twitter:title', finalTitle);

  // 4. Canonical URL
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement("link");
    linkCanonical.setAttribute("rel", "canonical");
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute("href", canonical || (DEFAULT_CANONICAL + window.location.pathname));

  // 5. OpenGraph URL
  setMetaTag('property', 'og:url', canonical || (DEFAULT_CANONICAL + window.location.pathname));

  // 6. Image
  const finalImage = image || DEFAULT_IMAGE;
  setMetaTag('property', 'og:image', finalImage);
  setMetaTag('name', 'twitter:image', finalImage);

  // 7. Keywords
  if (keywords) {
    setMetaTag('name', 'keywords', keywords);
  }
}

function setMetaTag(attrName, attrValue, content) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}
