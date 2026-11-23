import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";
import Axios from "../../axios/axios.config.js";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  FolderTree,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  Store,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { toggleDarkMode } from "../../utility/themeManager.js";
import AdminAiChatWidget from "../../components/AdminAiChatWidget.jsx";

function DashBoardLayOut() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    window.addEventListener("dsstyle_theme_changed", checkDark);
    return () => window.removeEventListener("dsstyle_theme_changed", checkDark);
  }, []);

  const handleToggleTheme = () => {
    const newMode = toggleDarkMode();
    setIsDark(newMode === "dark");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", aliases: ["/"], icon: LayoutDashboard },
    { name: "Products", path: "/products", aliases: ["/product-list", "/upload"], icon: Package },
    { name: "Categories", path: "/categories", aliases: [], icon: FolderTree },
    { name: "Orders", path: "/orders", aliases: ["/order-list"], icon: ShoppingCart },
    { name: "Sales", path: "/sales", aliases: [], icon: Receipt },
    { name: "Customers", path: "/customers", aliases: [], icon: Users },
    { name: "Reports", path: "/reports", aliases: [], icon: BarChart3 },
    { name: "AI Advisor", path: "/ai-advisor", aliases: [], icon: Sparkles, badge: "AI" },
    { name: "Settings", path: "/settings", aliases: [], icon: Settings },
  ];

  const isCurrentActive = (item) => {
    if (location.pathname === item.path) return true;
    if (item.aliases.includes(location.pathname)) return true;
    if (item.path !== "/" && location.pathname.startsWith(item.path)) return true;
    return false;
  };

  const storeUrl =
    import.meta.env.VITE_STORE_URL ||
    import.meta.env.VITE_FRONTEND_URL ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:5173"
      : "http://localhost:5173");

  return (
    <div className="flex h-dvh bg-[#f4f3f0] dark:bg-[#0c0b0a] text-gray-900 dark:text-gray-100 font-sans antialiased overflow-hidden transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[var(--em-overlay)] backdrop-blur-[2px] z-40 md:hidden animate-em-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-gray-200/70 dark:border-white/[0.06] transition-all duration-300 ease-[var(--ease-calm)] shadow-xl md:shadow-none h-dvh overflow-hidden ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } ${
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top: Logo & Scrollable Nav */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className={`flex items-center justify-between h-[72px] border-b border-gray-100 dark:border-white/[0.06] shrink-0 ${isCollapsed ? "px-5 md:justify-center" : "px-5"}`}>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 overflow-hidden select-none"
              onClick={() => setMobileOpen(false)}
            >
              {/* Official DS Style Neon Logo */}
              <img
                src={logo}
                alt="DS Style"
                className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-pink-600/20 shadow-[0_6px_16px_-8px_rgba(var(--brand-primary-rgb),0.6)]"
              />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold tracking-tight text-[17px] text-gray-900 dark:text-white leading-none">
                    DS Style <span className="text-pink-600 dark:text-pink-400 font-bold">Admin</span>
                  </span>
                  <span className="text-[10px] tracking-[0.16em] uppercase font-semibold text-gray-400 mt-1.5">
                    Inventory & Store
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="em-icon-btn !w-9 !h-9 md:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 overscroll-contain">
            {!isCollapsed && (
              <p className="em-eyebrow px-3.5 pb-2">Menu</p>
            )}
            {navItems.map((item) => {
              const active = isCurrentActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 px-3.5 h-11 rounded-xl text-sm transition-all duration-200 ${
                    active
                      ? "bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/[0.05] font-medium"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                >
                  {/* Active indicator bar */}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-pink-600 transition-all duration-300 ${
                      active ? "h-5 opacity-100" : "h-0 opacity-0"
                    }`}
                  />
                  <Icon
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                      active ? "text-pink-600 dark:text-pink-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-pink-700 text-white">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions - Always Pinned and Highly Visible */}
        <div className="shrink-0 p-3 pb-[max(0.75rem,var(--em-safe-bottom))] border-t border-gray-100 dark:border-white/[0.06] space-y-1.5 bg-white dark:bg-slate-900 z-10">
          {/* Back to Store - Premium Highlighted Button */}
          <a
            href={storeUrl}
            className={`group flex items-center gap-2.5 w-full px-3.5 h-10 rounded-xl text-[13px] font-semibold transition-all cursor-pointer border bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-100 dark:border-pink-500/20 hover:bg-pink-100 dark:hover:bg-pink-500/15 ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title="Back to DS Style Storefront"
          >
            <Store className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
            {!isCollapsed && (
              <span className="flex-1 flex items-center justify-between">
                <span>Back to Store</span>
                <ArrowUpRight className="w-4 h-4 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </span>
            )}
          </a>

          {/* Quick Light / Dark Mode Toggle */}
          <button
            onClick={handleToggleTheme}
            className={`flex items-center gap-2.5 w-full px-3.5 h-10 rounded-xl text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/[0.05] transition-colors cursor-pointer ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300 shrink-0" />
            )}
            {!isCollapsed && (
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            )}
          </button>

          {/* Collapse Toggle (Desktop only) - Ultra Clean and Visible */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex items-center gap-2.5 w-full px-3.5 h-10 rounded-xl text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/[0.05] transition-all cursor-pointer ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="em-glass md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-gray-200/70 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="em-icon-btn !w-10 !h-10 -ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="DS Style"
                className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-pink-600/20"
              />
              <span className="font-bold tracking-tight text-base text-gray-900 dark:text-white">
                DS Style <span className="text-pink-600 dark:text-pink-400 font-bold">Admin</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleTheme}
              className="em-icon-btn !w-10 !h-10"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <a
              href={storeUrl}
              className="flex items-center gap-1.5 h-10 text-xs font-semibold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 px-3.5 rounded-full hover:bg-pink-100 dark:hover:bg-pink-500/15 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store</span>
            </a>
          </div>
        </header>

        {/* Scrollable View Content - Optimized mobile padding */}
        <main className="em-page flex-1 overflow-y-auto px-3.5 py-4 sm:px-8 sm:py-8 lg:px-10 pb-[calc(1rem+var(--em-safe-bottom))]">
          <Outlet />
        </main>

        {/* 🤖 Floating AI Business Partner Chat Widget on Every Page */}
        <AdminAiChatWidget />
      </div>
    </div>
  );
}

export default DashBoardLayOut;
