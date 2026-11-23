import React, { useState, useEffect } from "react";
import Axios from "../axios/axios.config.js";
import { Link } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { getCategoryTheme, getCategoryIcon } from "../utility/categoryIcons.js";

// Intricate vibrant multi-color palette for categories
const INTRICATE_COLORS = [
  "#f43f5e", // Rose (Skincare)
  "#8b5cf6", // Royal Violet (Fragrance)
  "#f59e0b", // Warm Amber (Makeup)
  "#10b981", // Emerald Green (Haircare)
  "#06b6d4", // Oceanic Cyan (Body & Bath)
  "#6366f1", // Royal Indigo (Beauty Tools)
  "#f97316", // Warm Orange (Kids & Baby)
  "#14b8a6", // Teal (Pantry & Snacks)
  "#ec4899", // Radiant Fuchsia
  "#3b82f6", // Sapphire Blue
];

const getIntricateCategoryColor = (catName, idx = 0) => {
  if (!catName) return INTRICATE_COLORS[idx % INTRICATE_COLORS.length];
  const lower = catName.toLowerCase();
  if (lower.includes("skin")) return "#f43f5e";
  if (lower.includes("fragrance") || lower.includes("perfume")) return "#8b5cf6";
  if (lower.includes("makeup") || lower.includes("lip")) return "#f59e0b";
  if (lower.includes("hair")) return "#10b981";
  if (lower.includes("bath") || lower.includes("body")) return "#06b6d4";
  if (lower.includes("tool")) return "#6366f1";
  if (lower.includes("kid") || lower.includes("baby")) return "#f97316";
  if (lower.includes("pantry") || lower.includes("snack") || lower.includes("coffee")) return "#14b8a6";
  return INTRICATE_COLORS[idx % INTRICATE_COLORS.length];
};

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [productsCount, setProductsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyPoints, setDailyPoints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [waveFilter, setWaveFilter] = useState("all"); // 'all', 'weekdays', 'weekend'

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await Axios.get("/api/analytics/dashboard");
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setProductsCount(d.productsCount || 0);
          setOrdersCount(d.totalOrders || 0);
          setCustomersCount(d.customersCount || 0);
          setTotalRevenue(d.totalRevenue || 0);
          setMonthlyData(d.monthlyRevenue || []);
          setDailyPoints(d.dailyPoints || []);
          setCategories(d.categories || []);
          setBestSellers(d.bestSellers || []);
          setLowStockProducts(d.lowStockProducts || []);
        }
      } catch (err) {
        console.warn("Analytics fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatETB = (amount) => {
    return "ETB " + Number(amount || 0).toLocaleString();
  };

  // Generate smooth cubic bezier SVG path from dailyPoints
  const generateWavePaths = () => {
    if (!dailyPoints || dailyPoints.length < 2) {
      return { strokePath: "", fillPath: "" };
    }

    let strokePath = `M ${dailyPoints[0].x} ${dailyPoints[0].y}`;
    for (let i = 0; i < dailyPoints.length - 1; i++) {
      const p0 = dailyPoints[i];
      const p1 = dailyPoints[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      strokePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }

    const last = dailyPoints[dailyPoints.length - 1];
    const first = dailyPoints[0];
    const fillPath = `${strokePath} L ${last.x} 160 L ${first.x} 160 Z`;

    return { strokePath, fillPath };
  };

  const { strokePath, fillPath } = generateWavePaths();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-50 dark:bg-rose-950/40 text-pink-600 dark:text-rose-300 border border-pink-50 dark:border-rose-900/40">
            <Sparkles className="w-3 h-3" /> Live Store Health
          </span>
        </div>
      </div>

      {/* Row 1: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 dark:text-white tracking-tight mt-1">
              {formatETB(totalRevenue)}
            </h3>
            <p className="text-xs font-semibold text-pink-600 dark:text-rose-400 flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.5% vs baseline</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-pink-50 dark:bg-rose-950/40 text-pink-600 dark:text-rose-400 font-bold text-lg flex items-center justify-center shrink-0">
            $
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 dark:text-white tracking-tight mt-1">
              {ordersCount}
            </h3>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8.2% pacing</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Catalog Products</p>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 dark:text-white tracking-tight mt-1">
              {productsCount}
            </h3>
            <p className="text-xs font-medium text-gray-400 flex items-center gap-1 mt-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>Active in MongoDB</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-pink-50 dark:bg-rose-950/40 text-pink-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Registered Customers</p>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 dark:text-white tracking-tight mt-1">
              {customersCount}
            </h3>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+15.3% growth</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Monthly Revenue & Daily Orders) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200/70 dark:border-slate-800 shadow-2xs">
          <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white mb-6">
            Monthly Revenue
          </h2>
          <div className="h-64 flex flex-col justify-between">
            <div className="relative flex-1 flex">
              <div className="flex flex-col justify-between text-[11px] text-gray-400 dark:text-gray-500 font-mono pr-3 select-none pb-5">
                <span>120k</span>
                <span>90k</span>
                <span>60k</span>
                <span>30k</span>
                <span>0k</span>
              </div>

              <div className="relative flex-1 flex flex-col justify-between border-l border-b border-gray-200 dark:border-slate-800 pb-1">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                  <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                  <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                  <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                  <div className="w-full border-t border-gray-200 dark:border-slate-800" />
                </div>

                <div className="relative z-10 h-full flex items-end justify-around px-2 pt-2">
                  {monthlyData.map((d) => (
                    <div
                      key={d.month}
                      className="group relative flex flex-col items-center flex-1 h-full justify-end max-w-[44px] px-1 cursor-pointer"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 dark:bg-slate-800 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                        {formatETB(d.value)}
                      </div>
                      <div
                        style={{ height: `${d.heightPct}%` }}
                        className="w-full bg-pink-600 hover:bg-[#b58d33] dark:bg-rose-600 dark:hover:bg-rose-500 transition-all rounded-t-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex pl-10 pr-2 pt-2 justify-around text-xs text-gray-500 dark:text-gray-400 font-medium">
              {monthlyData.map((d) => (
                <span key={d.month} className="flex-1 text-center">
                  {d.month}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Orders Wave Line Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
                  Daily Orders Wave
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-rose-950/40 text-pink-600 dark:text-rose-300 border border-pink-50 dark:border-rose-900/40">
                  Mon — Sun
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Hover or click any day to inspect order volume and pacing
              </p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-100/70 dark:bg-slate-800 p-0.5 rounded-xl self-start sm:self-auto">
              {[
                { id: "all", label: "All 7 Days" },
                { id: "weekdays", label: "Mon–Fri" },
                { id: "weekend", label: "Sat–Sun" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setWaveFilter(tab.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    waveFilter === tab.id
                      ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-2xs"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Interactive Canvas */}
          {(() => {
            const totalWeeklyOrders = dailyPoints.reduce((sum, p) => sum + (p.orders || 0), 0);
            const peakPoint = dailyPoints.length > 0 ? [...dailyPoints].sort((a, b) => (b.orders || 0) - (a.orders || 0))[0] : null;
            const avgDailyOrders = dailyPoints.length > 0 ? (totalWeeklyOrders / dailyPoints.length).toFixed(1) : 0;
            const activePt = hoveredPoint || selectedPoint || peakPoint || dailyPoints[0];

            return (
              <div className="flex-1 flex flex-col justify-between">
                <div className="relative flex-1 flex min-h-[175px]">
                  {/* Y-Axis Scale */}
                  <div className="flex flex-col justify-between text-[11px] text-gray-400 dark:text-gray-500 font-mono pr-3 select-none pb-4">
                    <span>20</span>
                    <span>15</span>
                    <span>10</span>
                    <span>5</span>
                    <span>0</span>
                  </div>

                  <div className="relative flex-1">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
                      <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                      <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                      <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                      <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                      <div className="w-full border-t border-gray-200 dark:border-slate-800" />
                    </div>

                    {/* SVG Graphic */}
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox="0 0 460 170"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="dbInteractiveWaveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c9a043" stopOpacity="0.32" />
                          <stop offset="50%" stopColor="#c9a043" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#c9a043" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>

                      {/* Filled Curve */}
                      {fillPath && (
                        <path
                          d={fillPath}
                          fill="url(#dbInteractiveWaveGrad)"
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Stroke Line */}
                      {strokePath && (
                        <path
                          d={strokePath}
                          fill="none"
                          stroke="#c9a043"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Active Day Vertical Guideline */}
                      {activePt && (
                        <line
                          x1={activePt.x}
                          y1="10"
                          x2={activePt.x}
                          y2="160"
                          stroke="#c9a043"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          strokeOpacity="0.5"
                          className="pointer-events-none transition-all duration-150"
                        />
                      )}

                      {/* Interactive Nodes for each day */}
                      {dailyPoints.map((pt) => {
                        const isWeekend = pt.day === "Sat" || pt.day === "Sun";
                        const isDimmed =
                          (waveFilter === "weekdays" && isWeekend) ||
                          (waveFilter === "weekend" && !isWeekend);
                        const isActive = activePt?.day === pt.day;

                        return (
                          <g
                            key={pt.day}
                            className={`cursor-pointer transition-all ${
                              isDimmed ? "opacity-30" : "opacity-100"
                            }`}
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            onClick={() =>
                              setSelectedPoint(selectedPoint?.day === pt.day ? null : pt)
                            }
                          >
                            {/* Outer Glow Halo on Active */}
                            {isActive && (
                              <>
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="13"
                                  fill="#c9a043"
                                  fillOpacity="0.18"
                                  className="animate-pulse"
                                />
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="9"
                                  fill="transparent"
                                  stroke="#c9a043"
                                  strokeWidth="1.5"
                                  strokeDasharray="2 2"
                                />
                              </>
                            )}

                            {/* Node Core */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isActive ? "5.5" : "4"}
                              fill="#ffffff"
                              stroke="#c9a043"
                              strokeWidth={isActive ? "3.5" : "2.5"}
                              className="transition-all duration-200"
                            />

                            {/* Invisible Wide Hitbox for Touch/Mouse */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="22"
                              fill="transparent"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Floating Active Tooltip */}
                    {activePt && (
                      <div
                        className="absolute pointer-events-none transition-all duration-150 -translate-x-1/2 -translate-y-full z-10"
                        style={{
                          left: `${(activePt.x / 460) * 100}%`,
                          top: `${(activePt.y / 170) * 100 - 8}%`,
                        }}
                      >
                        <div className="bg-gray-900/95 text-white dark:bg-slate-800 dark:border dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-lg text-center backdrop-blur-xs whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-300 font-medium">
                            <span>{activePt.fullName || activePt.day}</span>
                            {activePt.day === peakPoint?.day && (
                              <span className="text-[9px] px-1 py-0.2 bg-amber-400 text-gray-950 font-bold rounded">
                                PEAK
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-white font-mono mt-0.5">
                            {activePt.orders} orders • {formatETB(activePt.orders * 1350)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Day Labels Row */}
                <div className="flex pl-8 pr-2 pt-2 justify-around text-xs font-medium border-t border-gray-100 dark:border-slate-800/60 mt-1">
                  {dailyPoints.map((pt) => {
                    const isWeekend = pt.day === "Sat" || pt.day === "Sun";
                    const isDimmed =
                      (waveFilter === "weekdays" && isWeekend) ||
                      (waveFilter === "weekend" && !isWeekend);
                    const isActive = activePt?.day === pt.day;

                    return (
                      <button
                        key={pt.day}
                        type="button"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() =>
                          setSelectedPoint(selectedPoint?.day === pt.day ? null : pt)
                        }
                        className={`flex-1 py-1 px-0.5 text-center rounded-lg transition-all cursor-pointer ${
                          isDimmed ? "opacity-35" : "opacity-100"
                        } ${
                          isActive
                            ? "bg-pink-50 dark:bg-rose-950/40 text-pink-600 dark:text-rose-300 font-bold shadow-2xs"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="text-[11px] leading-none">{pt.day}</div>
                        <div className="text-[9px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                          {pt.orders}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Interactive Summary Strip */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Weekly Total:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">
                      {totalWeeklyOrders} Orders
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Daily Avg:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {avgDailyOrders} / day
                    </span>
                  </div>

                  {peakPoint && (
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>
                        Peak Day:{" "}
                        <strong className="text-gray-900 dark:text-white font-mono">
                          {peakPoint.day} ({peakPoint.orders})
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Row 3: Sales by Category & Best Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales by Category (Normal Clean Multi-Color Donut Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
                Sales by Category
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Department sales distribution across catalog products
              </p>
            </div>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[10px] font-semibold text-pink-600 bg-pink-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full hover:bg-[#f4e8c8] cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {(() => {
            const enhancedCategories = categories.map((c, idx) => ({
              ...c,
              color: getIntricateCategoryColor(c.name, idx),
            }));

            const activeCat =
              hoveredCategory ||
              selectedCategory ||
              (enhancedCategories.length > 0 ? enhancedCategories[0] : null);

            return (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4 my-auto">
                {/* Standard Normal SVG Donut */}
                <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      let accumulatedOffset = 0;
                      const DONUT_R = 38;
                      const CIRC = 2 * Math.PI * DONUT_R;

                      return enhancedCategories.map((c, i) => {
                        const strokeDash = (c.pct / 100) * CIRC;
                        const dashoffset = -accumulatedOffset;
                        accumulatedOffset += strokeDash;
                        const isHighlighted = activeCat?.name === c.name;

                        return (
                          <circle
                            key={c.name + i}
                            cx="50"
                            cy="50"
                            r={DONUT_R}
                            fill="transparent"
                            stroke={c.color}
                            strokeWidth={isHighlighted ? "14.5" : "12"}
                            strokeDasharray={`${strokeDash} ${CIRC}`}
                            strokeDashoffset={dashoffset}
                            strokeLinecap="butt"
                            onMouseEnter={() => setHoveredCategory(c)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            onClick={() =>
                              setSelectedCategory(
                                selectedCategory?.name === c.name ? null : c
                              )
                            }
                            className="cursor-pointer transition-all duration-200"
                            style={{
                              opacity:
                                activeCat && activeCat.name !== c.name ? 0.45 : 1,
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Center Donut Info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3">
                    {activeCat && (
                      <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
                            style={{ backgroundColor: activeCat.color }}
                          />
                          <span className="text-xs">
                            {getCategoryIcon(activeCat.name)}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate max-w-[110px]">
                          {activeCat.name}
                        </div>
                        <div
                          className="text-2xl sm:text-3xl font-black font-serif leading-none mt-1"
                          style={{ color: activeCat.color }}
                        >
                          {activeCat.pct}%
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium mt-1">
                          {activeCat.count || 6} products
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clean Category Legend Pills */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs w-full max-w-xs">
                  {enhancedCategories.map((c) => {
                    const isSelected = activeCat?.name === c.name;
                    const icon = getCategoryIcon(c.name);

                    return (
                      <button
                        key={c.name}
                        type="button"
                        onMouseEnter={() => setHoveredCategory(c)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory?.name === c.name ? null : c
                          )
                        }
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-gray-50 dark:bg-slate-800 font-bold text-gray-900 dark:text-white shadow-xs"
                            : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-slate-800/60"
                        }`}
                        style={{
                          borderColor: isSelected ? c.color : "transparent",
                        }}
                      >
                        {/* Color Dot */}
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-xs shrink-0">{icon}</span>
                        <span className="truncate flex-1 font-medium" title={c.name}>
                          {c.name}
                        </span>
                        <span
                          className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${c.color}18`,
                            color: c.color,
                          }}
                        >
                          {c.pct}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Best Selling Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
              Best Sellers
            </h2>
            <Link
              to="/reports"
              className="text-xs font-semibold text-pink-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {bestSellers.slice(0, 4).map((p, idx) => (
              <div
                key={p.name + idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <img
                    src={p.image}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover bg-gray-100 dark:bg-slate-800 shrink-0 border border-gray-100 dark:border-slate-800"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={p.name}>
                      {p.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {p.amount ? `${p.amount} • ` : ""}{p.category || "General"}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="font-serif font-bold text-xs text-gray-900 dark:text-white block">
                    {formatETB(p.revenue)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {p.sold || p.units} sold
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Low Stock Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
              Inventory Monitoring
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Items with low inventory stock requiring procurement
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-pink-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            <span>Manage Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3.5">Product</th>
                <th scope="col" className="px-6 py-3.5">Department</th>
                <th scope="col" className="px-6 py-3.5">Stock Level</th>
                <th scope="col" className="px-6 py-3.5">Price</th>
                <th scope="col" className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {lowStockProducts.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover bg-gray-100 dark:bg-slate-800 shrink-0 border border-gray-100 dark:border-slate-800"
                      />
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block text-xs" title={p.name}>
                          {p.name}
                        </span>
                        {p.amount && (
                          <span className="text-[10px] text-gray-400">
                            {p.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                    {p.category}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        p.quantity <= 5
                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 dark:border-red-500/25"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/25"
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>{p.quantity} units left</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-serif font-bold text-gray-900 dark:text-white whitespace-nowrap text-xs">
                    {formatETB(p.price)}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <Link
                      to={`/product-update/${p._id}`}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-pink-600 dark:text-rose-400 hover:bg-pink-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Restock
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
