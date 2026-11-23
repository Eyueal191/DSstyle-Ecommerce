import React, { useState, useEffect, useRef } from "react";
import Axios from "../axios/axios.config.js";
import { Link } from "react-router-dom";
import {
  Star,
  TrendingUp,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Search,
  Package,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";
import { getCategoryTheme, getCategoryIcon } from "../utility/categoryIcons.js";
import {
  exportInventoryToExcel,
  exportInventoryToCsv,
  exportInventoryToPdf,
} from "../utility/exportInventory.js";

function Reports() {
  const [loading, setLoading] = useState(true);

  // Core metrics
  const [bestSellerName, setBestSellerName] = useState("Nescafé Gold Blend Rich & Smooth Instant Coffee");
  const [highestMonthText, setHighestMonthText] = useState("May — ETB 108,000");
  const [lowStockCount, setLowStockCount] = useState(1);
  const [avgOrderValue, setAvgOrderValue] = useState(3250);

  // Data arrays
  const [monthlyBars, setMonthlyBars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // Interactive states
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportInventory = async (format) => {
    try {
      setExporting(true);
      const res = await Axios.get("/api/product");
      const list = res.data?.products || [];
      if (list.length === 0) {
        toast.warning("No inventory products available to export.");
        return;
      }
      const dateStr = new Date().toISOString().split("T")[0];
      if (format === "excel") {
        exportInventoryToExcel(list, { filename: `DSStyle_Inventory_Audit_${dateStr}.xlsx` });
        toast.success(`Downloaded ${list.length} products to Excel (.xlsx)`);
      } else if (format === "csv") {
        exportInventoryToCsv(list, { filename: `DSStyle_Inventory_Audit_${dateStr}.csv` });
        toast.success(`Downloaded ${list.length} products to CSV`);
      } else if (format === "pdf") {
        exportInventoryToPdf(list, {
          title: "Executive Inventory Valuation & Stock Audit Report",
          filterSubtitle: "Full Store Catalog Audit",
          filename: `DSStyle_Inventory_Audit_${dateStr}.pdf`,
        });
        toast.success(`Downloaded ${list.length} products PDF Report (.pdf)`);
      }
      setShowExportMenu(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export inventory.");
    } finally {
      setExporting(false);
    }
  };

  const formatETB = (val) => "ETB " + Number(val || 0).toLocaleString();

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await Axios.get("/api/analytics/dashboard");
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (d.bestSellers && d.bestSellers.length > 0) {
          setBestSellerName(d.bestSellers[0].name);
          setTopProducts(d.bestSellers);
        }

        if (d.monthlyRevenue && d.monthlyRevenue.length > 0) {
          setMonthlyBars(d.monthlyRevenue);
          const highest = [...d.monthlyRevenue].sort((a, b) => b.value - a.value)[0];
          if (highest) {
            setHighestMonthText(`${highest.month} — ${formatETB(highest.value)}`);
          }
        }

        if (d.categories && d.categories.length > 0) {
          setCategories(d.categories);
        }

        if (d.lowStockCount !== undefined) {
          setLowStockCount(d.lowStockCount);
        }

        if (d.avgOrderValue) {
          setAvgOrderValue(d.avgOrderValue);
        }
      }
    } catch (err) {
      console.warn("Failed to load reports from database:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Active category in donut chart (hovered takes priority, then selected, then top category)
  const activeCategory =
    hoveredCategory ||
    selectedCategory ||
    (categories.length > 0 ? categories[0] : null);

  // Circumference for r=32 is 2 * PI * 32 = 201.06
  const DONUT_RADIUS = 32;
  const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

  const donutSlices = (() => {
    let accumulatedOffset = 0;
    return categories.map((cat, idx) => {
      const strokeDash = (cat.pct / 100) * CIRCUMFERENCE;
      const dashoffset = -accumulatedOffset;
      accumulatedOffset += strokeDash;
      const isHovered = activeCategory?.name === cat.name;

      return {
        ...cat,
        strokeDash,
        dashoffset,
        isHovered,
        index: idx,
      };
    });
  })();

  // Filter & sort Top Products
  const filteredProducts = topProducts.filter((p) =>
    (p.name || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleMonthClick = (monthName) => {
    if (selectedMonth === monthName) {
      setSelectedMonth(null);
    } else {
      setSelectedMonth(monthName);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-0">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">
              Reports & Insights
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-50 dark:bg-rose-950/40 text-pink-600 dark:text-rose-300 border border-pink-50 dark:border-rose-900/40">
              <Sparkles className="w-3 h-3" /> Live Analytics
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Interactive sales analytics, pacing breakdown, and inventory telemetry across billing cycles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Direct 1-Click PDF Download Button */}
          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExportInventory("pdf")}
            title="Direct Download PDF Audit Report (.pdf)"
            className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 dark:bg-rose-950/40 hover:bg-pink-100 dark:hover:bg-rose-900/60 border border-pink-200/90 dark:border-rose-900/50 rounded-xl text-xs font-bold text-pink-600 dark:text-pink-300 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-pink-600 dark:text-pink-300" />
            <span>Download PDF</span>
          </button>

          {/* Direct 1-Click Excel Download Button */}
          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExportInventory("excel")}
            title="Direct Download Excel Spreadsheet (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/90 dark:border-emerald-900/50 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download Excel</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              disabled={exporting}
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl border border-gray-200/90 dark:border-slate-800 transition-all cursor-pointer shadow-2xs hover:border-pink-600/50 active:scale-98"
            >
              <Download className={`w-3.5 h-3.5 text-pink-600 ${exporting ? "animate-bounce" : ""}`} />
              <span>{exporting ? "Generating..." : "More"}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu - High-Contrast Luxury Glassmorphism */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl border border-gray-200/90 dark:border-slate-700/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700/60 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Inventory Audit Export
                </div>

                <button
                  type="button"
                  onClick={() => handleExportInventory("pdf")}
                  className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-pink-50 dark:hover:bg-rose-950/40 text-gray-800 dark:text-gray-100 group flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-rose-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300">Executive PDF (.pdf)</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Direct download branded report</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleExportInventory("excel")}
                  className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-800 dark:text-gray-100 group flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Native Excel (.xlsx)</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Warning-free SheetJS spreadsheet</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportInventory("csv")}
                  className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-800 dark:text-gray-100 group flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Universal CSV (.csv)</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Raw UTF-8 data for spreadsheets</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-slate-900 rounded-xl border border-gray-200/80 dark:border-slate-800 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="Refresh reports from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-pink-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Premium Metric Capsules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Best Seller */}
        <div
          onClick={() => {
            setHighlightedRow("rank-1");
            setTimeout(() => setHighlightedRow(null), 3000);
          }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 hover:border-pink-600 dark:hover:border-rose-500/60 transition-all cursor-pointer group"
          title="Click to view in Top Products table"
        >
          <div className="w-11 h-11 rounded-2xl bg-pink-50 dark:bg-rose-950/40 text-pink-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Star className="w-5 h-5 fill-pink-600/20" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              Best Seller
            </span>
            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5" title={bestSellerName}>
              {bestSellerName}
            </p>
          </div>
        </div>

        {/* 2. Highest Revenue Month */}
        <div
          onClick={() => handleMonthClick("May")}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 hover:border-pink-600 dark:hover:border-rose-500/60 transition-all cursor-pointer group"
          title="Click to highlight in monthly chart"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              Peak Revenue Month
            </span>
            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
              {highestMonthText}
            </p>
          </div>
        </div>

        {/* 3. Low Stock Alert */}
        <Link
          to="/products"
          className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
          title={`${lowStockCount} product(s) low in inventory. Click to view products.`}
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              Inventory Alert
            </span>
            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5 flex items-center gap-1.5">
              <span>{lowStockCount} product(s) low</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
            </p>
          </div>
        </Link>

        {/* 4. Avg Order Value */}
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 cursor-default group"
          title="Average spend per confirmed checkout"
        >
          <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              Avg Order Value
            </span>
            <p className="text-xs sm:text-sm font-serif font-bold text-gray-900 dark:text-white truncate mt-0.5">
              {formatETB(avgOrderValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Interactive Monthly Revenue Bar Chart & Interactive Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Interactive Revenue by Month Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
                Revenue by Month
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Click any bar to filter and highlight monthly performance
              </p>
            </div>
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-[10px] font-semibold text-pink-600 dark:text-rose-400 bg-pink-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full hover:bg-[#f4e8c8] cursor-pointer"
              >
                Clear Filter ({selectedMonth})
              </button>
            )}
          </div>

          <div className="h-64 flex flex-col justify-between">
            <div className="relative flex-1 flex">
              {/* Y Axis Labels */}
              <div className="flex flex-col justify-between text-[11px] text-gray-400 dark:text-gray-500 font-mono pr-3 select-none pb-5">
                <span>120k</span>
                <span>90k</span>
                <span>60k</span>
                <span>30k</span>
                <span>0k</span>
              </div>

              {/* Grid Lines and Interactive Bars */}
              <div className="relative flex-1 flex flex-col justify-between border-l border-b border-gray-200 dark:border-slate-800 pb-1">
                {/* Horizontal Guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                  <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                  <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                  <div className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/80" />
                  <div className="w-full border-t border-gray-200 dark:border-slate-800" />
                </div>

                {/* Bars Container */}
                <div className="relative z-10 h-full flex items-end justify-around px-2 pt-2">
                  {monthlyBars.map((d) => {
                    const isSelected = selectedMonth === d.month;
                    const isHovered = hoveredMonth === d.month;

                    return (
                      <div
                        key={d.month}
                        onClick={() => handleMonthClick(d.month)}
                        onMouseEnter={() => setHoveredMonth(d.month)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="group relative flex flex-col items-center flex-1 h-full justify-end max-w-[46px] px-1 cursor-pointer"
                      >
                        {/* Hover/Selection Floating Tooltip */}
                        <div
                          className={`transition-all duration-200 absolute -top-12 bg-gray-900 dark:bg-slate-800 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-30 border border-gray-800 dark:border-slate-700 ${isHovered || isSelected
                            ? "opacity-100 scale-100 -translate-y-1"
                            : "opacity-0 scale-95"
                            }`}
                        >
                          <div className="font-bold text-[#f7c2d4]">{d.month} 2026</div>
                          <div>{formatETB(d.value)} • {d.orders || 12} orders</div>
                        </div>

                        {/* Bar Segment */}
                        <div
                          style={{ height: `${d.heightPct}%` }}
                          className={`w-full rounded-t-lg transition-all duration-200 ${isSelected
                            ? "bg-gray-900 dark:bg-white scale-105 shadow-md ring-2 ring-pink-600"
                            : isHovered
                              ? "bg-[#b58d33] dark:bg-rose-500 scale-102"
                              : "bg-pink-600 dark:bg-rose-600"
                            }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X Axis Labels */}
            <div className="flex pl-10 pr-2 pt-2 justify-around text-xs text-gray-500 dark:text-gray-400 font-medium">
              {monthlyBars.map((d) => (
                <button
                  key={d.month}
                  onClick={() => handleMonthClick(d.month)}
                  className={`flex-1 text-center transition-colors cursor-pointer ${selectedMonth === d.month
                    ? "text-pink-600 dark:text-rose-400 font-bold"
                    : "hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  {d.month}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Modern Interactive Donut Chart for Category Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
                Category Sales Distribution
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Hover or click segments to inspect department breakdown
              </p>
            </div>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[10px] font-semibold text-pink-600 dark:text-rose-400 bg-pink-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full hover:bg-[#f4e8c8] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Interactive Donut Graphic & Center Display */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4 my-auto">
            {/* SVG Donut */}
            <div className="relative w-52 h-52 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {donutSlices.map((slice) => {
                  const isHighlighted = activeCategory?.name === slice.name;
                  return (
                    <circle
                      key={slice.name}
                      cx="50"
                      cy="50"
                      r={DONUT_RADIUS}
                      fill="transparent"
                      stroke={slice.color || "#c9a043"}
                      strokeWidth={isHighlighted ? "34" : "28"}
                      strokeDasharray={`${slice.strokeDash} ${CIRCUMFERENCE}`}
                      strokeDashoffset={slice.dashoffset}
                      onMouseEnter={() => setHoveredCategory(slice)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory?.name === slice.name ? null : slice
                        )
                      }
                      className="cursor-pointer transition-all duration-300 hover:opacity-100"
                      style={{
                        opacity:
                          activeCategory && activeCategory.name !== slice.name
                            ? 0.4
                            : 1,
                      }}
                    />
                  );
                })}
              </svg>

              {/* Dynamic Center Cutout Info */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4"
                style={{ borderRadius: "50%" }}
              >
                {activeCategory ? (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block mb-1 shadow-xs"
                      style={{ backgroundColor: activeCategory.color || "#c9a043" }}
                    />
                    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate max-w-[100px]">
                      {activeCategory.name}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-serif leading-none mt-0.5">
                      {activeCategory.pct}%
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {activeCategory.count || 6} products
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Categories</div>
                    <div className="text-lg font-black text-gray-800 dark:text-gray-200 font-serif">
                      {categories.length} Total
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Category Legend Pills with Emojis */}
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-2 text-xs w-full max-w-xs">
              {categories.map((c) => {
                const isSelected = activeCategory?.name === c.name;
                const icon = getCategoryIcon(c.name);

                return (
                  <button
                    key={c.name}
                    type="button"
                    onMouseEnter={() => setHoveredCategory(c)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() =>
                      setSelectedCategory(selectedCategory?.name === c.name ? null : c)
                    }
                    className={`flex items-center gap-2 p-1.5 rounded-xl text-left transition-all cursor-pointer ${isSelected
                      ? "bg-pink-50 dark:bg-rose-950/40 ring-1 ring-pink-600/50 shadow-2xs font-semibold"
                      : "hover:bg-gray-100/70 dark:hover:bg-slate-800/70 text-gray-600 dark:text-gray-400"
                      }`}
                  >
                    <span className="text-sm shrink-0">{icon}</span>
                    <span className="truncate flex-1 max-w-[80px]" title={c.name}>
                      {c.name}
                    </span>
                    <span className="text-gray-900 dark:text-white font-mono text-[11px] font-bold ml-auto">
                      {c.pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Interactive Monthly Performance Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
              Monthly Performance
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Historical performance data breakdown across billing cycles
            </p>
          </div>
          {selectedMonth && (
            <div className="text-xs text-pink-600 dark:text-rose-400 font-medium bg-pink-50 dark:bg-rose-950/40 px-3 py-1 rounded-full flex items-center gap-1.5 self-start">
              <span>Filtered: {selectedMonth} 2026</span>
              <button
                onClick={() => setSelectedMonth(null)}
                className="hover:underline font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Mobile View: Clean Touch Cards */}
        <div className="block sm:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {monthlyBars.map((row, i) => {
            const isSelected = selectedMonth === row.month;
            const estOrders = row.orders || 12;
            const aov = row.aov || Math.round(row.value / estOrders);

            return (
              <div
                key={i}
                onClick={() => handleMonthClick(row.month)}
                className={`p-4 transition-colors cursor-pointer space-y-2 ${
                  isSelected ? "bg-pink-50/90 dark:bg-rose-950/40" : "hover:bg-gray-50/60 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected && <span className="w-2 h-2 rounded-full bg-pink-600" />}
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {row.month} 2026
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                    {estOrders} orders
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Revenue</span>
                    <span className="font-bold text-gray-900 dark:text-white font-serif text-sm">
                      {formatETB(row.value)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Avg Order Value</span>
                    <span className="font-medium text-gray-600 dark:text-gray-400 font-serif">
                      {formatETB(aov)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3.5">Month</th>
                <th scope="col" className="px-6 py-3.5">Estimated Orders</th>
                <th scope="col" className="px-6 py-3.5">Revenue</th>
                <th scope="col" className="px-6 py-3.5">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {monthlyBars.map((row, i) => {
                const isSelected = selectedMonth === row.month;
                const estOrders = row.orders || 12;
                const aov = row.aov || Math.round(row.value / estOrders);

                return (
                  <tr
                    key={i}
                    onClick={() => handleMonthClick(row.month)}
                    className={`transition-colors cursor-pointer ${isSelected
                      ? "bg-pink-50/80 dark:bg-rose-950/30 font-semibold"
                      : "hover:bg-gray-50/70 dark:hover:bg-slate-800/50"
                      }`}
                  >
                    <td className="px-6 py-3.5 whitespace-nowrap flex items-center gap-2">
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-pink-600" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {row.month} 2026
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-700 dark:text-gray-300">
                      {estOrders}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-white font-serif whitespace-nowrap">
                      {formatETB(row.value)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 dark:text-gray-400 font-serif whitespace-nowrap">
                      {formatETB(aov)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Interactive Top Products Card with Live Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-white">
              Top Products
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Ranked product revenue performance and volume sold
            </p>
          </div>

          {/* Search Top Products Input with icon to the RIGHT - Diminished width on mobile */}
          <div className="relative w-full max-w-[240px] sm:max-w-none sm:w-64">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search top products..."
              className="w-full pl-3.5 pr-8 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs placeholder-gray-400 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-600 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Mobile View: Top Products Card Stream */}
        <div className="block sm:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {filteredProducts.map((p, idx) => {
            const rankNum = p.rank || idx + 1;
            const isSpecial = highlightedRow === `rank-${rankNum}`;

            return (
              <div
                key={rankNum}
                className={`p-4 space-y-3 transition-colors ${
                  isSpecial ? "bg-pink-50 dark:bg-rose-950/40 ring-1 ring-pink-600" : "hover:bg-gray-50/60 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                      rankNum === 1
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-300/60"
                        : rankNum === 2
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                        : rankNum === 3
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border border-orange-300/60"
                        : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"
                    }`}
                  >
                    #{rankNum}
                  </span>

                  <img
                    src={
                      p.image ||
                      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&auto=format&fit=crop&q=80"
                    }
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-gray-900 dark:text-white block text-sm leading-tight line-clamp-2">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 block">
                      {p.amount ? `${p.amount} • ` : ""}{p.category || "General"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-slate-800/80 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                    {p.sold || p.units} unit(s) sold
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white font-serif text-sm">
                    {formatETB(p.revenue)}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-xs">
              No products found matching "{productSearch}"
            </div>
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3.5"># Rank</th>
                <th scope="col" className="px-6 py-3.5">Product</th>
                <th scope="col" className="px-6 py-3.5">Units Sold</th>
                <th scope="col" className="px-6 py-3.5">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredProducts.map((p, idx) => {
                const rankNum = p.rank || idx + 1;
                const isSpecial = highlightedRow === `rank-${rankNum}`;

                return (
                  <tr
                    key={rankNum}
                    className={`transition-colors ${isSpecial
                      ? "bg-pink-50 dark:bg-rose-950/40 ring-2 ring-pink-600"
                      : "hover:bg-gray-50/60 dark:hover:bg-slate-800/50"
                      }`}
                  >
                    <td className="px-6 py-3.5">
                      <span
                        className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${rankNum === 1
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-300/60"
                          : rankNum === 2
                            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                            : rankNum === 3
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border border-orange-300/60"
                              : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"
                          }`}
                      >
                        {rankNum}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            p.image ||
                            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&auto=format&fit=crop&q=80"
                          }
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 shrink-0"
                        />
                        <div>
                          <span
                            className="font-bold text-gray-900 dark:text-white block text-xs sm:text-sm"
                            title={p.name}
                          >
                            {p.name}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {p.amount ? `${p.amount} • ` : ""}{p.category || "General"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-800 dark:text-gray-200 font-semibold">
                      {p.sold || p.units} unit(s)
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-white font-serif whitespace-nowrap">
                      {formatETB(p.revenue)}
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-400 dark:text-gray-500 text-xs"
                  >
                    No products found matching "{productSearch}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Reports;
