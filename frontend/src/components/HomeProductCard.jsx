import React, { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { optimizeImageUrl } from "../utility/imageOptimizer.js";

function HomeProductCard({
  product,
  badge = "NEW IN",
  currency = "ETB",
  className = "",
  style = {},
  onCardClick,
}) {
  const navigate = useNavigate();

  // Reactive brand color state synchronized with global theme engine
  const [brandColor, setBrandColor] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("dsstyle_theme_v6");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.primaryColor) return parsed.primaryColor;
        } catch {}
      }
      const rootColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--brand-primary")
        .trim();
      if (rootColor) return rootColor;
    }
    return "#c9a043";
  });

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e?.detail?.primaryColor) {
        setBrandColor(e.detail.primaryColor);
      } else if (typeof window !== "undefined") {
        const rootColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--brand-primary")
          .trim();
        if (rootColor) setBrandColor(rootColor);
      }
    };

    window.addEventListener("dsstyle_theme_changed", handleThemeChange);
    return () => window.removeEventListener("dsstyle_theme_changed", handleThemeChange);
  }, []);

  if (!product) return null;

  const {
    _id: id,
    name = "Ethiopian Wildflower Honey",
    price = 650,
    category,
    images = [],
    amount,
    volume,
    itemCount,
    subtitle,
  } = product;

  const productAmount = amount || volume || "";

  const categoryName =
    typeof category === "object" ? category?.name : category || "Pantry";

  const rawImageUrl =
    (Array.isArray(images) && images[0]) ||
    (typeof images === "string" && images) ||
    (Array.isArray(product.image) && product.image[0]) ||
    (typeof product.image === "string" && product.image) ||
    "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80";

  const imageUrl = optimizeImageUrl(rawImageUrl, 600);

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(product);
    } else if (id) {
      navigate(`/product-detail/${id}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      className={`group relative w-full h-full overflow-hidden rounded-[26px] sm:rounded-[34px] text-white transition-all duration-300 cursor-pointer flex flex-row items-stretch select-none ${className}`}
      style={{
        backgroundColor: brandColor || "var(--brand-primary, #c9a043)",
        background: `linear-gradient(135deg, var(--brand-primary, ${brandColor || "#c9a043"}) 0%, var(--brand-primary-hover, #b58d33) 100%)`,
        boxShadow: "0 10px 25px -5px rgba(var(--brand-primary-rgb, 201, 160, 67), 0.35)",
        ...style,
      }}
    >
      {/* Subtle Ambient Radial Highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.22),transparent_70%)] pointer-events-none" />

      {/* Left: Editorial Content Area (Exact layout from design mockup) */}
      <div className="w-[52%] flex flex-col justify-between p-4 sm:p-5 md:p-6 z-10">
        <div>
          {/* Badge (FEATURED, NEW IN, BESTSELLER) */}
          {badge && (
            <div className="mb-1.5 sm:mb-2">
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase bg-white/25 backdrop-blur-md text-white border border-white/20 shadow-xs">
                {badge}
              </span>
            </div>
          )}

          {/* Big Bold Title */}
          <h3 className="font-sans text-base sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-[1.2] line-clamp-2 drop-shadow-xs">
            {name || categoryName}
          </h3>

          {/* Items count / Subtitle */}
          <p className="text-xs sm:text-sm font-medium text-white/90 tracking-wide mt-1 truncate">
            {itemCount || subtitle || (
              <>
                {productAmount ? `${productAmount} • ` : ""}
                {typeof price === "number" ? `${currency} ${price.toLocaleString()}` : "In Stock"}
              </>
            )}
          </p>
        </div>

        {/* Circular Action Button with Arrow at bottom-left driven by Brand Color */}
        <div className="pt-2">
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white em-keep-light flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-45 transition-all duration-300"
            style={{ color: brandColor || "var(--brand-primary, #c9a043)" }}
          >
            <ArrowUpRight
              className="w-4 h-4 sm:w-5 sm:h-5 transition-colors"
              style={{ stroke: brandColor || "var(--brand-primary, #c9a043)" }}
              strokeWidth={3}
            />
          </div>
        </div>
      </div>

      {/* Right: Clean Product Photography Area */}
      <div className="w-[48%] relative flex items-center justify-center p-2 sm:p-3 overflow-hidden">
        <div className="relative w-full h-full rounded-[20px] sm:rounded-[26px] overflow-hidden flex items-center justify-center">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-contain sm:object-cover object-center transform group-hover:scale-108 transition-transform duration-500 ease-out drop-shadow-md"
            loading="eager"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80";
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default HomeProductCard;
