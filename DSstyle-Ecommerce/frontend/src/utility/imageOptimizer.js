// Ultra-fast Image Optimization Utility for DS Style Storefront & Admin
// Automatically injects Cloudinary / Unsplash optimizations (WebP/AVIF, auto quality, optimal width)
// Prevents slow image loads and invisible images

export const optimizeImageUrl = (url, width = 500) => {
  if (!url || typeof url !== "string") return url || "";

  // Cloudinary: Convert to auto WebP/AVIF + auto quality + responsive max width
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    if (url.includes("/upload/f_auto")) {
      return url.replace(/\/upload\/[^/]+\//, `/upload/f_auto,q_auto:good,w_${width},c_limit/`);
    }
    return url.replace(
      "/upload/",
      `/upload/f_auto,q_auto:good,w_${width},c_limit/`
    );
  }

  // Unsplash CDN: Force lightweight, ultra-fast WebP format with exact width
  if (url.includes("images.unsplash.com")) {
    const cleanUrl = url.split("?")[0];
    return `${cleanUrl}?auto=format&fit=crop&w=${width}&q=70&fm=webp`;
  }

  return url;
};

export default optimizeImageUrl;
