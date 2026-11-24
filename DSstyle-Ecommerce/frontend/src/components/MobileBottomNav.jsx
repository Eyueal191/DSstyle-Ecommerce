import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Home, Store, ShoppingBag, Package, Phone } from "lucide-react";
import { useSelector } from "react-redux";

function MobileBottomNav() {
  const bagItems =
    useSelector(
      (state) =>
        state.userBag?.userBag?.items ||
        state.userCart?.userCart?.items ||
        []
    ) || [];

  // Reactive brand accent color state synchronized with global theme engine
  const [brandColor, setBrandColor] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("dsstyle_theme_v6");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.primaryColor) return parsed.primaryColor;
        } catch { }
      }
      const rootColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--brand-primary")
        .trim();
      if (rootColor) return rootColor;
    }
    return "#c9a043";
  });

  // Publish the nav's real height (incl. safe area) as --em-mobile-nav-h so
  // pinned checkout bars can sit exactly on top of it. 0px when hidden (lg+).
  const navRef = useRef(null);
  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--em-mobile-nav-h", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener("resize", publish);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publish);
      root.style.removeProperty("--em-mobile-nav-h");
    };
  }, []);

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

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Shop", path: "/shop", icon: Store },
    { name: "Bag", path: "/bag", icon: ShoppingBag, isCenterBag: true, badge: bagItems.length },
    { name: "Orders", path: "/orders", icon: Package },
    { name: "Contact", path: "/contact", icon: Phone },
  ];

  return (
    <nav
      ref={navRef}
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#100f0d]/95 border-t border-white/[0.08] shadow-[0_-8px_30px_rgba(0,0,0,0.45)] px-2 pt-1.5 pb-[max(0.375rem,var(--em-safe-bottom))] backdrop-blur-xl select-none"
    >
      <div className="max-w-md mx-auto relative">
        {/* Subtle, Low Convex Crest on the Top Border for the Bag */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[9px] w-[76px] h-[8px] pointer-events-none z-0">
          <svg
            viewBox="0 0 76 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Seamless dark fill */}
            <path
              d="M 0 8 C 16 8, 23 1, 38 1 C 53 1, 60 8, 76 8 L 76 9 L 0 9 Z"
              fill="#100f0d"
              fillOpacity="0.95"
            />
            {/* Subtle convex border line */}
            <path
              d="M 0 8 C 16 8, 23 1, 38 1 C 53 1, 60 8, 76 8"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 5-Column Symmetrical Grid for Precise Geometric Centering on all Screen Sizes */}
        <div className="grid grid-cols-5 items-end relative z-10">
          {navItems.map((item) => {
            const IconComponent = item.icon;

            if (item.isCenterBag) {
              return (
                <div key={item.path} className="flex justify-center">
                  <NavLink
                    to={item.path}
                    aria-label={item.badge > 0 ? `Bag, ${item.badge} items` : "Bag"}
                    className="relative -top-2.5 flex flex-col items-center justify-center group focus:outline-none"
                  >
                    {/* Compact Floating Bag Button */}
                    <div
                      className="relative w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform duration-200 ease-[var(--ease-spring)] ring-4 ring-[#100f0d] group-focus-visible:ring-pink-400/70"
                      style={{
                        backgroundColor: brandColor || "var(--brand-primary, #c9a043)",
                        background: `linear-gradient(140deg, var(--brand-primary, ${brandColor || "#c9a043"}) 0%, var(--brand-primary-hover, #b58d33) 100%)`,
                        boxShadow: `0 8px 20px -6px rgba(var(--brand-primary-rgb, 201, 160, 67), 0.6)`,
                      }}
                    >
                      <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2.1} />
                      {item.badge > 0 && (
                        <span
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-white em-keep-light text-[10px] font-bold rounded-full flex items-center justify-center shadow-md tabular-nums"
                          style={{
                            color: brandColor || "var(--brand-primary, #c9a043)",
                          }}
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </div>
                    {/* Center Bag Label */}
                    <span className="text-[10px] font-semibold text-gray-300 group-hover:text-white mt-1 tracking-tight transition-colors">
                      Bag
                    </span>
                  </NavLink>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 min-h-[48px] rounded-xl transition-colors duration-200 focus:outline-none focus-visible:bg-white/[0.06] active:bg-white/[0.04] ${isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <IconComponent
                      size={20}
                      strokeWidth={isActive ? 2.3 : 1.8}
                      className={`transition-colors ${isActive ? "text-white" : "text-gray-400"}`}
                    />
                    <span
                      className={`text-[10px] leading-none tracking-tight ${isActive ? "text-white font-semibold" : "text-gray-400 font-medium"
                        }`}
                    >
                      {item.name}
                    </span>
                    {/* Active indicator: a quiet brand dot */}
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 h-[3px] rounded-full transition-all duration-300 ${isActive ? "w-5 opacity-100" : "w-0 opacity-0"}`}
                      style={{ backgroundColor: brandColor || "var(--brand-primary, #c9a043)" }}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
export default MobileBottomNav;
