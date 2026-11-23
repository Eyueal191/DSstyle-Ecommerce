import React, { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { ShoppingBag, Package, Sun, Moon, Search } from "lucide-react";
import { useSelector } from "react-redux";
import Axios from "../axios/axios.config.js";
import { toggleDarkMode } from "../utility/themeManager.js";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnShopPage = location.pathname === "/shop";
  const [focusIndex, setFocusIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    window.addEventListener("dsstyle_theme_changed", checkDark);
    return () => window.removeEventListener("dsstyle_theme_changed", checkDark);
  }, []);

  const bagItems =
    useSelector(
      (state) =>
        state.userBag?.userBag?.items ||
        state.userCart?.userCart?.items ||
        []
    ) || [];

  const navRef = useRef({
    Home: null,
    Shop: null,
    About: null,
    Contact: null,
    Orders: null,
    Bag: null,
  });

  const navItems = ["Home", "Shop", "About", "Contact", "Orders", "Bag"];

  const keyDownHandler = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      setFocusIndex(focusIndex === 0 ? navItems.length - 1 : focusIndex - 1);
    }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      setFocusIndex(focusIndex === navItems.length - 1 ? 0 : focusIndex + 1);
    }
  };

  // Desktop navigation links: calm pill tabs with a soft brand-tinted active state
  const navLinkClass = ({ isActive }) =>
    isActive
      ? "py-2 px-4 text-sm font-semibold rounded-full transition-all duration-200 text-pink-700 dark:text-pink-300 bg-white dark:bg-pink-500/10 shadow-xs dark:shadow-none focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-white/20"
      : "py-2 px-4 text-sm font-medium rounded-full transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-white/20";

  // Orders link: same language as the nav pills
  const ordersLinkClass = ({ isActive }) =>
    `hidden md:flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 ${
      isActive
        ? "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10"
        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/[0.06]"
    }`;

  useEffect(() => {
    const element = navRef.current[navItems[focusIndex]];
    if (element) element.focus();
  }, [focusIndex]);

  return (
    <header className="em-glass w-full text-gray-900 dark:text-white border-b border-gray-200/70 dark:border-white/[0.06] sticky top-0 z-40 transition-colors duration-200">
      {/* ── Mobile Viewport Header: Brand Logo + Theme Toggle + Search ── */}
      <div className="md:hidden flex items-center justify-between px-4 h-14">
        <figure
          className="cursor-pointer flex items-center gap-2.5 select-none group"
          onClick={() => navigate("/")}
        >
          <div className="flex items-center justify-center p-0.5 rounded-xl ring-1 ring-pink-600/25 bg-white dark:bg-white/5 shadow-xs transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
            <img
              src={logo}
              alt="DS Style Logo"
              className="h-8 w-8 rounded-[10px] object-contain"
            />
          </div>
          <span className="font-extrabold text-lg tracking-tight flex items-center select-none">
            <span className="text-gray-900 dark:text-white">DS</span>
            <span
              className="transition-colors duration-200"
              style={{ color: "var(--brand-primary, #c9a043)" }}
            >
              &nbsp;Style
            </span>
          </span>
        </figure>

        {/* Right side: White / Dark Theme Toggler, Circular Search Button */}
        <div className="flex items-center gap-2">
          {/* White / Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const newMode = toggleDarkMode(Axios);
              setIsDark(newMode === "dark");
            }}
            title={isDark ? "Switch to White Theme" : "Switch to Dark Theme"}
            aria-label="Toggle White/Dark Theme"
            className="em-icon-btn"
          >
            {isDark ? (
              <Sun size={18} strokeWidth={1.9} className="text-amber-400" />
            ) : (
              <Moon size={18} strokeWidth={1.9} />
            )}
          </button>

          {/* Search Button as Link to Shop — hidden when already on /shop */}
          {!isOnShopPage && (
            <button
              type="button"
              onClick={() => navigate("/shop", { state: { focusSearch: true } })}
              title="Search Shop"
              aria-label="Search Shop"
              className="em-icon-btn"
            >
              <Search size={18} strokeWidth={1.9} />
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop & Tablet Header (md+) ── */}
      <div className="hidden md:flex max-w-7xl mx-auto justify-between items-center gap-6 px-4 sm:px-6 lg:px-12 h-16">
        {/* Brand & Logo with a soft accent halo */}
        <div className="flex items-center">
          <figure
            className="cursor-pointer flex items-center gap-2.5 group"
            onClick={() => navigate("/")}
          >
            <div
              className="flex items-center justify-center p-0.5 rounded-xl ring-1 ring-pink-600/25 bg-white dark:bg-white/5 transition-transform duration-300 group-hover:scale-105"
              style={{
                boxShadow: "0 6px 16px -6px rgba(var(--brand-primary-rgb, 201, 160, 67), 0.4)",
              }}
            >
              <img
                src={logo}
                alt="DS Style Logo"
                className="h-10 w-10 rounded-[10px] object-contain"
              />
            </div>
            {/* Logo Text: DS in base neutral and Style in dynamic Brand Accent */}
            <span className="font-extrabold text-xl tracking-tight flex items-center select-none">
              <span className="header-brand-base text-gray-900 dark:text-white">DS&nbsp;</span>
              <span
                className="header-brand-accent transition-colors duration-200"
                style={{ color: "var(--brand-primary, #c9a043)" }}
              >
                Style
              </span>
            </span>
          </figure>
        </div>

        {/* Desktop & Tablet Navigation Links: segmented pill group */}
        <nav className="hidden lg:flex justify-center items-center gap-1 p-1 rounded-full bg-gray-100/80 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06]">
          <NavLink
            to="/"
            className={navLinkClass}
            ref={(el) => (navRef.current["Home"] = el)}
            onKeyDown={keyDownHandler}
          >
            Home
          </NavLink>
          <NavLink
            to="/shop"
            className={navLinkClass}
            ref={(el) => (navRef.current["Shop"] = el)}
            onKeyDown={keyDownHandler}
          >
            Shop
          </NavLink>
          <NavLink
            to="/about"
            className={navLinkClass}
            ref={(el) => (navRef.current["About"] = el)}
            onKeyDown={keyDownHandler}
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={navLinkClass}
            ref={(el) => (navRef.current["Contact"] = el)}
            onKeyDown={keyDownHandler}
          >
            Contact
          </NavLink>
        </nav>

        {/* Right Navigation: Theme Toggle, Orders & Bag */}
        <div className="flex items-center gap-2">
          {/* Quick Light / Dark Mode Toggle */}
          <button
            onClick={() => {
              const newMode = toggleDarkMode();
              setIsDark(newMode === "dark");
            }}
            className="em-icon-btn"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle light or dark theme"
          >
            {isDark ? (
              <Sun size={18} strokeWidth={1.9} className="text-amber-400" />
            ) : (
              <Moon size={18} strokeWidth={1.9} />
            )}
          </button>

          {/* Orders Link (Desktop) */}
          <NavLink
            to="/orders"
            className={ordersLinkClass}
            ref={(el) => (navRef.current["Orders"] = el)}
            onKeyDown={keyDownHandler}
          >
            <Package size={17} strokeWidth={1.9} /> Orders
          </NavLink>

          {/* Bag Link: the primary action in the header */}
          <NavLink
            to="/bag"
            className="em-btn em-btn-primary relative h-10 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            ref={(el) => (navRef.current["Bag"] = el)}
            onKeyDown={keyDownHandler}
          >
            <ShoppingBag size={17} strokeWidth={2} className="text-white" />
            <span className="hidden sm:inline text-white">Bag</span>
            {bagItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 text-[10px] min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-white text-pink-700 font-bold shadow-sm ring-2 ring-pink-600 tabular-nums em-keep-light">
                {bagItems.length > 99 ? "99+" : bagItems.length}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  );
}

export default Header;
