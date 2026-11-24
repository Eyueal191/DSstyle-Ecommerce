import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Axios from "../axios/axios.config.js";
import { Search, Plus, Edit2, Trash2, Star, Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import {
  exportInventoryToExcel,
  exportInventoryToCsv,
  exportInventoryToPdf,
} from "../utility/exportInventory.js";

// Safe category name extractor
const getCategoryName = (cat) => {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (Array.isArray(cat)) {
    if (cat.length === 0) return "General";
    return getCategoryName(cat[0]);
  }
  if (typeof cat === "object") {
    return cat.name || cat.title || cat.category || "General";
  }
  return String(cat);
};

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "featured"
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await Axios.get("/api/product");
      if (res?.data?.products && res.data.products.length > 0) {
        const mapped = res.data.products.map((p) => {
          const catName = getCategoryName(p.category);
          const firstImage = Array.isArray(p.images) && p.images.length > 0
            ? p.images[0]
            : (Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : (p.image || p.imageUrl || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=80"));

          const actStock =
            p.actualStock !== undefined
              ? p.actualStock
              : p.quantity !== undefined
              ? p.quantity
              : 50;
          const visStock =
            p.visibleStock !== undefined
              ? p.visibleStock
              : actStock;

          return {
            _id: p._id,
            name: p.name || p.title || "Untitled Product",
            category: catName,
            price: p.price || 0,
            amount: p.amount || p.volume || "",
            stock: actStock,
            actualStock: actStock,
            visibleStock: visStock,
            image: firstImage,
            isFeatured: Boolean(p.isFeatured || p.isFeaturedFlag),
          };
        });
        setProducts(mapped);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn("Backend products fetch error:", err.message);
      toast.error("Could not load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleFeatured = async (id, currentVal, e) => {
    e.stopPropagation();
    try {
      setTogglingId(id);
      const res = await Axios.patch(`/api/product/toggle-featured/${id}`);
      const nextVal = res.data?.isFeatured !== undefined ? res.data.isFeatured : !currentVal;
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isFeatured: nextVal } : p))
      );
      toast.success(
        nextVal
          ? "Product pinned to Home Marquee flow!"
          : "Product unpinned from Home Marquee flow"
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle featured status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await Axios.delete(`/api/product/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  const featuredCount = products.filter((p) => p.isFeatured).length;

  const filtered = products.filter((p) => {
    if (filterMode === "featured" && !p.isFeatured) return false;
    const nameStr = (p.name || "").toLowerCase();
    const catStr = getCategoryName(p.category).toLowerCase();
    const searchLower = search.toLowerCase();
    return nameStr.includes(searchLower) || catStr.includes(searchLower);
  });

  const handleExport = (format) => {
    const listToExport = filtered.length > 0 ? filtered : products;
    if (listToExport.length === 0) {
      toast.warning("No products available to export");
      return;
    }

    const filterNote = search || filterMode === "featured"
      ? `Active Filter: ${search ? `Search "${search}"` : ""} ${filterMode === "featured" ? "[Marquee Featured]" : ""}`
      : "Full Catalog";

    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "excel") {
      exportInventoryToExcel(listToExport, {
        filename: `DSStyle_Inventory_${dateStr}.xlsx`,
      });
      toast.success(`Downloaded ${listToExport.length} products to Excel (.xlsx)`);
    } else if (format === "csv") {
      exportInventoryToCsv(listToExport, {
        filename: `DSStyle_Inventory_${dateStr}.csv`,
      });
      toast.success(`Downloaded ${listToExport.length} products to CSV`);
    } else if (format === "pdf") {
      exportInventoryToPdf(listToExport, {
        title: "Inventory Valuation & Stock Audit Report",
        filterSubtitle: filterNote,
        filename: `DSStyle_Inventory_Audit_${dateStr}.pdf`,
      });
      toast.success(`Downloaded ${listToExport.length} products PDF Report (.pdf)`);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-0">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">
            Products
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your store inventory, pricing, and marquee spotlights
          </p>
        </div>

        {/* Quick Export Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct 1-Click PDF Download Button */}
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            title="Direct Download PDF Report (.pdf)"
            className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 dark:bg-rose-950/40 hover:bg-pink-100 dark:hover:bg-rose-900/60 border border-pink-200/90 dark:border-rose-900/50 rounded-xl text-xs font-bold text-pink-600 dark:text-pink-300 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-pink-600 dark:text-pink-300" />
            <span>Download PDF</span>
          </button>

          {/* Direct 1-Click Excel Download Button */}
          <button
            type="button"
            onClick={() => handleExport("excel")}
            title="Direct Download Excel Spreadsheet (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/90 dark:border-emerald-900/50 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download Excel</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200/90 dark:border-slate-800 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 shadow-2xs hover:border-pink-600/50 transition-all cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4 text-pink-600" />
              <span>More ({filtered.length})</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu - High-Contrast Luxury Glassmorphism */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl border border-gray-200/90 dark:border-slate-700/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700/60 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Export Options ({filtered.length} items)
                </div>
                
                <button
                  type="button"
                  onClick={() => handleExport("pdf")}
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
                  onClick={() => handleExport("excel")}
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
                  onClick={() => handleExport("csv")}
                  className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-800 dark:text-gray-100 group flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Universal CSV (.csv)</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Raw UTF-8 data for all spreadsheets</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Direct 1-Click PDF Button */}
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            title="Instant Printable PDF Report"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200/90 dark:border-slate-800 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-600 transition-all cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-pink-600" />
            <span>PDF</span>
          </button>

          {/* Direct 1-Click Excel Button */}
          <button
            type="button"
            onClick={() => handleExport("excel")}
            title="Instant Excel Spreadsheet (.xls)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200/90 dark:border-slate-800 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          {/* Add Product Button in calm rose */}
          <Link
            to="/upload"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 hover:bg-[#b58d33] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Top Bar: Search + Filter Tabs + Add Product Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input with Search Icon to the RIGHT - Diminished width on mobile */}
        <div className="relative w-full max-w-[260px] sm:max-w-none sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-3.5 pr-9 py-2 sm:py-2.5 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-50 dark:focus:ring-rose-950/60 focus:border-pink-600 transition-all shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter Chips & Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Filter Tabs */}
          <div className="flex items-center p-1 bg-gray-100/90 dark:bg-slate-900 rounded-xl border border-gray-200/60 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filterMode === "all"
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("featured")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === "featured"
                  ? "bg-pink-600 text-white shadow-2xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-300"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Marquee ({featuredCount})</span>
            </button>
          </div>

          {/* Add Product Button in calm rose */}
          <Link
            to="/upload"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 hover:bg-[#b58d33] text-white text-sm font-medium rounded-xl shadow-2xs transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* MOBILE PRODUCTS VIEW: Touch-friendly cards for mobile viewports */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-pink-600 rounded-full animate-spin mb-2" />
            <div>Loading products...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
            {search
              ? `No products found matching "${search}"`
              : filterMode === "featured"
              ? "No featured products yet. Click 'Standard' on any product to pin it to the Marquee flow!"
              : "No products found"}
          </div>
        ) : (
          filtered.map((item) => {
            const isOutOfStock = Number(item.stock) === 0;
            const categoryName = getCategoryName(item.category);
            const isFeaturedItem = Boolean(item.isFeatured);

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/70 dark:border-slate-800 shadow-2xs space-y-3 hover:border-pink-200 dark:hover:border-pink-900/50 transition-colors"
              >
                {/* Product Header: Thumbnail + Name + Category */}
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=80";
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 dark:bg-rose-950/50 text-pink-700 dark:text-pink-300">
                        {categoryName}
                      </span>
                      {item.amount && (
                        <span className="text-[11px] text-gray-400 font-mono">
                          {item.amount}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mt-1 line-clamp-2">
                      {item.name}
                    </h3>
                  </div>
                </div>

                {/* Price and Stock row */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Price</span>
                    <span className="font-bold text-gray-900 dark:text-white font-serif text-sm">
                      ETB {Number(item.price).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Actual: {item.actualStock ?? item.stock}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-semibold text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                      Visible: {item.visibleStock ?? item.stock}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800 gap-2">
                  {/* Featured Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFeatured(item._id, isFeaturedItem, e)}
                    disabled={togglingId === item._id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                      isFeaturedItem
                        ? "bg-pink-600 text-white hover:bg-[#b58d33] ring-2 ring-pink-50 dark:ring-rose-950/60"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFeaturedItem ? "fill-white text-white" : "text-gray-400"
                      }`}
                    />
                    <span>{isFeaturedItem ? "Featured in Marquee" : "Pin to Marquee"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/product-update/${item._id}`)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item._id, e)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP PRODUCTS TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-transparent border-b border-gray-100 dark:border-slate-800 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-4">Image</th>
                <th scope="col" className="px-6 py-4">Name</th>
                <th scope="col" className="px-6 py-4">Category</th>
                <th scope="col" className="px-6 py-4">Price</th>
                <th scope="col" className="px-6 py-4">Stock (Actual / Visible)</th>
                <th scope="col" className="px-6 py-4 text-center">Featured (Marquee)</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                    <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-pink-600 rounded-full animate-spin mb-2" />
                    <div>Loading products...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                    {search
                      ? `No products found matching "${search}"`
                      : filterMode === "featured"
                      ? "No featured products yet. Click 'Standard' on any product to pin it to the Marquee flow!"
                      : "No products found"}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isOutOfStock = Number(item.stock) === 0;
                  const categoryName = getCategoryName(item.category);
                  const isFeaturedItem = Boolean(item.isFeatured);
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Thumbnail */}
                      <td className="px-6 py-3.5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>
                      </td>

                      {/* Name & Amount */}
                      <td className="px-6 py-3.5 max-w-xs">
                        <div className="font-medium text-gray-800 dark:text-white truncate" title={item.name}>
                          {item.name}
                        </div>
                        {item.amount && (
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {item.amount}
                          </div>
                        )}
                      </td>

                      {/* Category Calm Rose Pill */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-pink-50 dark:bg-rose-950/50 text-pink-700 dark:text-pink-300">
                          {categoryName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-white font-serif whitespace-nowrap">
                        ETB {Number(item.price).toLocaleString()}
                      </td>

                      {/* Stock Pill (Actual vs Visible) */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Actual: {item.actualStock ?? item.stock}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-pink-600 dark:text-pink-300 font-medium bg-pink-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full w-fit">
                            Visible to Users: {item.visibleStock ?? item.stock}
                          </span>
                        </div>
                      </td>

                      {/* Featured (Marquee) 1-Click Toggle */}
                      <td className="px-6 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFeatured(item._id, isFeaturedItem, e)}
                          disabled={togglingId === item._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                            isFeaturedItem
                              ? "bg-pink-600 text-white hover:bg-[#b58d33] ring-2 ring-pink-50 dark:ring-rose-950/60"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                          }`}
                          title={
                            isFeaturedItem
                              ? "Pinned to Marquee! Click to remove"
                              : "Click to feature this product on the Home marquee flow"
                          }
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              isFeaturedItem ? "fill-white text-white" : "text-gray-400"
                            }`}
                          />
                          <span>{isFeaturedItem ? "Featured" : "Standard"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => navigate(`/product-update/${item._id}`)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item._id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Products;
