import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import Title from "../components/Title.jsx";
import { IoMdSearch } from "react-icons/io";
import { debounce } from "lodash";
import Axios from "../axios/axios.config.js";
import { useVirtualizer } from "@tanstack/react-virtual";
import ProductCard from "../components/ProductCard.jsx";
import { useSelector, useDispatch } from "react-redux";
import { setProducts } from "../redux/productSlice.js";
import Loading from "../components/Loading.jsx";
import { ChevronLeft, ChevronRight, SlidersHorizontal, RotateCcw, Check, Sparkles, X } from "lucide-react";
import { getCategoryIcon } from "../utility/categoryIcons.js";
import { updateSEO } from "../utility/seo.js";

const DEFAULT_CATEGORIES = [
  "Sneakers",
  "Complete Outfits",
  "Jeans & Pants",
  "Hoodies & Tracksuits",
  "T-Shirts & Shirts",
  "Slides & Crocs",
  "Boots",
  "Jewelry & Grillz",
];

function Shop() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const categoryParam = searchParams.get("category");

  const [search, setSearch] = useState("");
  const [storeCategories, setStoreCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState(
    categoryParam ? [categoryParam] : []
  );
  const [priceMax, setPriceMax] = useState("");
  const [priceMin, setPriceMin] = useState(0);
  const [columns, setColumns] = useState(2);
  const [loading, setLoading] = useState(false);
  const [showMobilePriceFilter, setShowMobilePriceFilter] = useState(false);

  const parentRef = useRef();
  const searchInputRef = useRef(null);
  const categoryScrollRef = useRef(null);

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -180 : 180,
        behavior: "smooth",
      });
    }
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setPriceMin(0);
    setPriceMax("");
    setShowMobilePriceFilter(false);
  };

  const handlePricePreset = (min, max) => {
    setPriceMin(min);
    setPriceMax(max === null ? "" : max);
  };

  const isPriceActive = priceMin > 0 || Boolean(priceMax);
  const activeFiltersCount = selectedCategories.length + (isPriceActive ? 1 : 0);
  const products = useSelector((state) => state.product.products) || [];
  const dispatch = useDispatch();

  // Auto-focus search input without pushing page down (always keep search bar at the top)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    if (location.state?.focusSearch && searchInputRef.current) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        searchInputRef.current.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Load database-driven categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await Axios.get("/api/category");
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const names = res.data.data.map((c) => c.name);
          setStoreCategories(names);
        }
      } catch (err) {
        console.warn("Could not load categories from DB, using defaults:", err.message);
      }
    };
    fetchCategories();
  }, []);

  const categoryPills = ["All", ...storeCategories];

  useEffect(() => {
    const activeCat = selectedCategories.length === 1 ? selectedCategories[0] : null;
    const pageTitle = activeCat
      ? `${activeCat} Products | DS Style`
      : search
      ? `Search: "${search}" | DS Style`
      : "Shop Sneakers, Outfits & Accessories | DS Style";
    const pageDesc = activeCat
      ? `Shop ${activeCat} at DS Style, Golagole 22. Delivery across Addis Ababa.`
      : "Browse sneakers, complete outfits, jeans, belts, caps, grillz and accessories from DS Style, Golagole 22, Addis Ababa.";
    updateSEO({
      title: pageTitle,
      description: pageDesc,
    });
  }, [selectedCategories, search]);

  // Sync if URL query param changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
  }, [categoryParam]);

  const debouncedSetSearch = useCallback(
    debounce((value) => setSearch(value), 400),
    []
  );

  const handleSearchChange = (e) => debouncedSetSearch(e.target.value);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const fetchProductsList = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search,
        selectedCategories: JSON.stringify(selectedCategories),
        priceMax: priceMax || undefined,
        priceMin,
      };
      const response = await Axios.get("/api/product", { params });
      dispatch(setProducts(response.data.products || []));
    } catch (error) {
      console.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategories, priceMax, priceMin, dispatch]);

  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  // Viewport columns: 2 on mobile (< 768px), 2 on tablet, 3 on desktop, 4 on xl
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumns(2);
      } else if (width < 1024) {
        setColumns(2);
      } else if (width < 1280) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const rowCount = Math.ceil(products.length / columns);
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        return 295; // 2-column mobile card height + vertical gap
      }
      return 400;
    },
    overscan: 3,
  });

  return (
    <div className="w-full pt-2 sm:pt-4 md:pt-8 pb-6 bg-[#f4f3f0] dark:bg-[#0c0b0a] min-h-screen px-2.5 sm:px-4 md:px-6 lg:px-8">
      {/* Search Bar - Larger and comfortable on mobile */}
      <div className="w-full max-w-md sm:max-w-lg mx-auto flex justify-center mb-3 sm:mb-4 md:mb-6">
        <div className="relative w-full">
          <input
            ref={searchInputRef}
            type="text"
            onChange={handleSearchChange}
            placeholder="Search products, brands..."
            className="bg-white dark:bg-[#161411] w-full border border-gray-200/90 dark:border-slate-700 rounded-full px-4 py-2.5 sm:py-3 pr-11 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-600 shadow-xs transition-all"
          />
          <IoMdSearch
            size={21}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none"
          />
        </div>
      </div>

      {/* Mobile-Only Filter Section (< 768px) - High-Contrast Luxury Dark & Light Mode */}
      <div className="md:hidden w-full mb-3.5 space-y-2">
        <div className="bg-white dark:bg-[#161411] rounded-2xl border border-gray-200/90 dark:border-slate-700/80 p-2.5 sm:p-3 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-2.5">
          {/* Header Row: Category Badge + Counter + Price Toggle + Reset Button */}
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-600 shadow-[0_0_8px_#c9a043] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                Categories
              </span>
              <span className="text-[10px] font-semibold text-gray-600 dark:text-pink-300 bg-gray-100 dark:bg-[#1f293d] border border-gray-200/70 dark:border-slate-600 px-2.5 py-0.5 rounded-full font-mono">
                {products.length} items
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Price Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMobilePriceFilter((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  isPriceActive || showMobilePriceFilter
                    ? "bg-pink-50 dark:bg-rose-950/70 text-pink-600 dark:text-pink-300 border-pink-600/40 ring-1 ring-pink-600/30"
                    : "bg-white dark:bg-[#1a233a] text-gray-700 dark:text-gray-200 border-gray-200/90 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                }`}
              >
                <SlidersHorizontal size={11} className={isPriceActive ? "text-pink-600 dark:text-pink-400" : ""} />
                <span>Price</span>
                {isPriceActive && <span className="w-1.5 h-1.5 rounded-full bg-pink-600" />}
              </button>

              {/* Reset All */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="flex items-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-300 hover:text-[#b50054] px-2.5 py-1 rounded-full bg-pink-50 dark:bg-rose-950/70 border border-pink-600/30 active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw size={10} />
                  <span>Clear ({activeFiltersCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Horizontally Scrollable Category Pills with High-Contrast Styling */}
          <div className="w-full relative flex items-center">
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              aria-label="Scroll categories left"
              className="shrink-0 p-1.5 mr-1 rounded-full bg-white dark:bg-[#211e1a] border border-gray-200/90 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
            >
              <ChevronLeft size={14} />
            </button>

            <div
              ref={categoryScrollRef}
              onWheel={(e) => {
                if (e.deltaY !== 0 && categoryScrollRef.current) {
                  categoryScrollRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scroll-smooth touch-pan-x cursor-grab active:cursor-grabbing no-scrollbar"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {categoryPills.map((cat) => {
                const isAll = cat === "All";
                const isSelected = isAll
                  ? selectedCategories.length === 0
                  : selectedCategories.includes(cat);
                const icon = getCategoryIcon(cat);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (isAll) {
                        setSelectedCategories([]);
                      } else {
                        toggleCategory(cat);
                      }
                    }}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 border cursor-pointer active:scale-95 flex items-center gap-1.5 select-none ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-600 to-[#d4ae55] text-white border-transparent shadow-[0_2px_14px_rgba(201, 160, 67,0.55)] ring-2 ring-pink-400/60 dark:ring-pink-400/80 font-bold scale-102"
                        : "bg-white dark:bg-[#1b253b] text-gray-800 dark:text-gray-100 border border-gray-200/90 dark:border-slate-600/90 hover:border-pink-600/50 dark:hover:border-pink-400/70 hover:bg-gray-50 dark:hover:bg-[#24314e] shadow-2xs font-semibold"
                    }`}
                  >
                    <span className="text-xs leading-none">{icon}</span>
                    <span>{cat}</span>
                    {isSelected && !isAll && (
                      <span className="w-3.5 h-3.5 rounded-full bg-black/25 dark:bg-white/25 flex items-center justify-center text-[9px] ml-0.5 font-bold">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => scrollCategories("right")}
              aria-label="Scroll categories right"
              className="shrink-0 p-1.5 ml-1 rounded-full bg-white dark:bg-[#211e1a] border border-gray-200/90 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Collapsible Mobile Price Filter Panel */}
          {showMobilePriceFilter && (
            <div className="pt-2.5 mt-2 border-t border-gray-100 dark:border-slate-700/80 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                <span>Filter by Price (ETB)</span>
                {isPriceActive && (
                  <button
                    onClick={() => {
                      setPriceMin(0);
                      setPriceMax("");
                    }}
                    className="text-pink-600 dark:text-pink-400 font-semibold hover:underline cursor-pointer"
                  >
                    reset price
                  </button>
                )}
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: "All", min: 0, max: null },
                  { label: "< 1,000", min: 0, max: 1000 },
                  { label: "1k – 3k", min: 1000, max: 3000 },
                  { label: "3k – 5k", min: 3000, max: 5000 },
                  { label: "5,000+", min: 5000, max: null },
                ].map((preset) => {
                  const isActive =
                    preset.max === null
                      ? preset.min === 0
                        ? priceMin === 0 && !priceMax
                        : priceMin === preset.min && !priceMax
                      : priceMin === preset.min && priceMax === preset.max;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePricePreset(preset.min, preset.max)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                        isActive
                          ? "bg-pink-600 text-white border-pink-600 shadow-sm shadow-pink-500/30 font-bold"
                          : "bg-gray-100 dark:bg-[#1a243a] text-gray-800 dark:text-gray-200 border-gray-200/80 dark:border-slate-600/80 hover:bg-gray-200 dark:hover:bg-[#24314e]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Min - Max Inputs */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 dark:text-pink-400">ETB</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin || ""}
                    onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-2 py-1.5 text-xs bg-white dark:bg-[#171512] border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-600 dark:focus:border-pink-500"
                  />
                </div>
                <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 dark:text-pink-400">ETB</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax || ""}
                    onChange={(e) => setPriceMax(Number(e.target.value) || "")}
                    className="w-full pl-9 pr-2 py-1.5 text-xs bg-white dark:bg-[#171512] border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-600 dark:focus:border-pink-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Removable Tags */}
          {selectedCategories.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-100 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-400 tracking-wider">Active:</span>
              {selectedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-50 dark:bg-rose-950/70 text-pink-600 dark:text-pink-200 border border-pink-600/40 hover:bg-pink-100 dark:hover:bg-rose-900/80 cursor-pointer transition-colors shadow-2xs"
                >
                  <span>{cat}</span>
                  <span className="text-[9px]">✕</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Tablet & Desktop Sidebar Filters */}
        <aside className="hidden md:flex md:w-[250px] lg:w-[280px] bg-white dark:bg-[#161411] p-5 rounded-2xl border border-gray-200/90 dark:border-slate-700/80 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex-col gap-5 self-start shrink-0">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-600 shadow-[0_0_8px_#c9a043]"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Filter Products
              </h2>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={11} />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Department
              </h3>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-[11px] text-pink-600 dark:text-pink-400 hover:underline font-semibold cursor-pointer"
                >
                  Clear ({selectedCategories.length})
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {storeCategories.map((cat) => {
                const isChecked = selectedCategories.includes(cat);
                const icon = getCategoryIcon(cat);

                return (
                  <label
                    key={cat}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer border ${
                      isChecked
                        ? "bg-pink-50 dark:bg-rose-950/60 text-pink-600 dark:text-pink-300 font-bold border-pink-600/40 ring-1 ring-pink-600/30 shadow-2xs"
                        : "bg-transparent text-gray-800 dark:text-gray-200 border-transparent hover:bg-gray-100/80 dark:hover:bg-[#211e1a] hover:border-gray-200/80 dark:hover:border-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat)}
                        className="accent-pink-600 w-3.5 h-3.5 rounded cursor-pointer"
                      />
                      <span className="text-xs leading-none shrink-0">{icon}</span>
                      <span className="truncate">{cat}</span>
                    </div>
                    {isChecked && <Check size={13} className="text-pink-600 dark:text-pink-400 shrink-0" />}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div className="pt-3 border-t border-gray-100 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Price (ETB)
              </h3>
              {isPriceActive && (
                <button
                  onClick={() => {
                    setPriceMin(0);
                    setPriceMax("");
                  }}
                  className="text-[11px] text-pink-600 dark:text-pink-400 hover:underline font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Quick Price Chips */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { label: "All Prices", min: 0, max: null },
                { label: "Under 1,000", min: 0, max: 1000 },
                { label: "1k – 3,000", min: 1000, max: 3000 },
                { label: "3k – 5,000", min: 3000, max: 5000 },
                { label: "5,000+", min: 5000, max: null },
              ].map((preset) => {
                const isActive =
                  preset.max === null
                    ? preset.min === 0
                      ? priceMin === 0 && !priceMax
                      : priceMin === preset.min && !priceMax
                    : priceMin === preset.min && priceMax === preset.max;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePricePreset(preset.min, preset.max)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer border ${
                      isActive
                        ? "bg-pink-600 text-white border-pink-600 shadow-xs font-bold"
                        : "bg-gray-100 dark:bg-[#1a243a] text-gray-800 dark:text-gray-200 border-gray-200/80 dark:border-slate-600/80 hover:bg-gray-200 dark:hover:bg-[#25304a]"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Inputs */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 dark:text-pink-400">ETB</span>
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full pl-9 pr-2 py-1.5 text-xs bg-white dark:bg-[#171512] border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-600 dark:focus:border-pink-500"
                  value={priceMin || ""}
                  onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                />
              </div>
              <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 dark:text-pink-400">ETB</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full pl-9 pr-2 py-1.5 text-xs bg-white dark:bg-[#171512] border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-600 dark:focus:border-pink-500"
                  value={priceMax || ""}
                  onChange={(e) => setPriceMax(Number(e.target.value) || "")}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Products Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loading />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No products found.</p>
              <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                Try selecting different categories or adjusting search filters.
              </p>
            </div>
          ) : (
            <div
              ref={parentRef}
              className="relative w-full overflow-y-auto h-[calc(100vh-140px)] md:h-[calc(100vh-180px)]"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIndex = virtualRow.index * columns;
                  const rowProducts = products.slice(startIndex, startIndex + columns);

                  return (
                    <div
                      key={virtualRow.key || virtualRow.index}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="pb-2.5 sm:pb-3.5 md:pb-5"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-5 w-full justify-items-stretch">
                        {rowProducts.map((prod) => (
                          <ProductCard key={prod._id} product={prod} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Shop;
