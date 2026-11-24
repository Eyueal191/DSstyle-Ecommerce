import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Axios from "../axios/axios.config.js";
import hero from "../assets/Hero-image.jpg";
import logo from "../assets/logo.png";
import Title from "../components/Title.jsx";
import ProductCard from "../components/ProductCard.jsx";
import HomeProductCard from "../components/HomeProductCard.jsx";
import HowToOrderSection from "../components/HowToOrderSection.jsx";
import { CONTACT_CONFIG, useStoreContact } from "../config/contactConfig.js";
import { ChevronLeft, ChevronRight, Bike, ShoppingBag, ShieldCheck, ArrowRight, ArrowUpRight, Sparkles, MapPin, Phone, CheckCircle2, Search, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { optimizeImageUrl } from "../utility/imageOptimizer.js";
import QuickOrderModal from "../components/QuickOrderModal.jsx";
import { updateSEO } from "../utility/seo.js";
import { getCategoryIcon } from "../utility/categoryIcons.js";


function Home() {
  const navigate = useNavigate();
  const storeContact = useStoreContact();
  const [loading, setLoading] = useState(false);
  const [aisles, setAisles] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProductsList, setAllProductsList] = useState([]);
  const [pageMap, setPageMap] = useState({});
  const [columns, setColumns] = useState(3);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  const [mobileSlide, setMobileSlide] = useState(0);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [selectedFlowProduct, setSelectedFlowProduct] = useState(null);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);

  // Smooth horizontal scroll refs for New In flow
  const flowScrollRef = useRef(null);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const mouseStartXRef = useRef(0);
  const scrollStartXRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const handleOpenFlowProductModal = (product) => {
    setSelectedFlowProduct(product);
    setIsFlowModalOpen(true);
  };

  const fetchProductsList = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        Axios.get("/api/product"),
        Axios.get("/api/category").catch(() => ({ data: { data: [] } })),
      ]);

      const allProducts = prodRes.data?.products || [];
      setAllProductsList(allProducts);
      const dbCategories = catRes.data?.data || [];

      // Extract products marked with isFeatured / isFeaturedFlag by admin
      const featured = allProducts.filter((p) => p.isFeatured || p.isFeaturedFlag);
      setFeaturedProducts(featured);

      const sections = [];

      // 1. Match database categories first
      dbCategories.forEach((cat) => {
        const prods = allProducts.filter((p) => {
          const cName = typeof p.category === "object" ? p.category?.name : p.category;
          return cName && cName.toLowerCase() === cat.name.toLowerCase();
        });
        if (prods.length > 0) {
          sections.push({
            id: cat._id || cat.name,
            name: cat.name,
            emoji: getCategoryIcon(cat.name),
            products: prods,
          });
        }
      });

      // 2. Discover any uncategorized or custom-named product categories
      allProducts.forEach((p) => {
        const cName = typeof p.category === "object" ? p.category?.name : p.category;
        if (cName && !sections.some((s) => s.name.toLowerCase() === cName.toLowerCase())) {
          const prods = allProducts.filter((item) => {
            const itemCat = typeof item.category === "object" ? item.category?.name : item.category;
            return itemCat && itemCat.toLowerCase() === cName.toLowerCase();
          });
          sections.push({
            id: cName,
            name: cName,
            emoji: getCategoryIcon(cName),
            products: prods,
          });
        }
      });

      setAisles(sections);
    } catch (error) {
      console.warn("Home products fetch error:", error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getColumns = useCallback(() => {
    // 2 cards on mobile, 3 on md+ for the curated collection
    setColumns(window.innerWidth >= 768 ? 3 : 2);
  }, []);

  useEffect(() => {
    updateSEO({
      title: "DS Style | Streetwear, Sneakers & Accessories in Addis Ababa",
      description: "Shop sneakers, complete outfits, jeans, belts, caps, grillz and accessories from DS Style, Golagole 22, Addis Ababa. New drops every week.",
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", getColumns);
    getColumns();
    return () => window.removeEventListener("resize", getColumns);
  }, [getColumns]);

  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  const scrollToCategory = (id, categoryKey) => {
    setActiveCategoryFilter(categoryKey);
    if (categoryKey === "all") {
      const section = document.getElementById("collection-section");
      if (section) section.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const elem = document.getElementById(id);
    if (elem) {
      const offset = 80; // offset for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = elem.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const renderCategory = (products, page, setPage, title, sectionId, emoji = "✨") => {
    if (!loading && products.length === 0) return null;

    const pageSize = columns;

    return (
      <div id={sectionId} className="flex flex-col w-full max-w-6xl mx-auto px-2 sm:px-4 scroll-mt-24">
        {/* Category Header Row: Title & Badge on Left, See All & Chevrons on Right */}
        <div className="flex items-center justify-between w-full mb-2.5 sm:mb-4 px-1">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span className="text-base sm:text-xl">{emoji}</span>
            <h3 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight dark:text-gray-100">
              {title}
            </h3>
            <span className="text-[9px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-100">
              {products.length} items
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(`/shop?category=${encodeURIComponent(title)}`)}
              className="text-[10px] sm:text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-0.5 group"
            >
              <span>See all</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((prev) => Math.max(prev - pageSize, 0))}
                disabled={page <= 0 || loading}
                aria-label={`Previous ${title} items`}
                className="w-6 h-6 sm:w-8 sm:h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-pink-50 hover:border-pink-300 disabled:opacity-25 disabled:cursor-not-allowed shadow-2xs transition shrink-0 dark:bg-slate-900 dark:border-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + pageSize, Math.max(0, products.length - pageSize)))
                }
                disabled={page >= products.length - pageSize || loading}
                aria-label={`Next ${title} items`}
                className="w-6 h-6 sm:w-8 sm:h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-pink-50 hover:border-pink-300 disabled:opacity-25 disabled:cursor-not-allowed shadow-2xs transition shrink-0 dark:bg-slate-900 dark:border-slate-800"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Cards Grid: 2 cards on mobile, 3 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 w-full">
          {loading ? (
            Array.from({ length: pageSize }).map((_, idx) => (
              <div
                key={idx}
                className="w-full aspect-[3/4] sm:aspect-[2/3] bg-gray-200 animate-pulse rounded-xl sm:rounded-2xl dark:bg-slate-700"
              />
            ))
          ) : (
            Array.from({ length: pageSize }).map((_, idx) => {
              const product = products[page + idx];
              return product ? (
                <ProductCard key={product._id} product={product} />
              ) : null;
            })
          )}
        </div>
      </div>
    );
  };

  // Flow of New In products with consistent images, strictly sorted from latest uploaded to last (oldest)
  const newInFlowList = useMemo(() => {
    const getProductImg = (p) => {
      if (Array.isArray(p.images) && p.images[0]) return p.images[0];
      if (Array.isArray(p.image) && p.image[0]) return p.image[0];
      if (typeof p.images === "string" && p.images) return p.images;
      if (typeof p.image === "string" && p.image) return p.image;
      return null;
    };

    // Extract reliable Unix timestamp (ms) from product
    const getProductTimestamp = (p) => {
      if (!p) return 0;
      if (p.createdAt) {
        const t = new Date(p.createdAt).getTime();
        if (Number.isFinite(t) && t > 0) return t;
      }
      if (p.updatedAt) {
        const t = new Date(p.updatedAt).getTime();
        if (Number.isFinite(t) && t > 0) return t;
      }
      // Fallback: extract timestamp from 24-hex MongoDB _id
      if (p._id && typeof p._id === "string" && p._id.length >= 8) {
        try {
          const sec = parseInt(p._id.substring(0, 8), 16);
          if (Number.isFinite(sec) && sec > 0) return sec * 1000;
        } catch (e) {}
      }
      return 0;
    };

    // Deduplicate products by _id first
    const seen = new Set();
    const unique = [];
    for (const p of allProductsList) {
      const id = String(p._id || p.id || "");
      if (id && !seen.has(id)) {
        seen.add(id);
        unique.push(p);
      } else if (!id) {
        unique.push(p);
      }
    }

    const valid = unique
      .filter((p) => Boolean(getProductImg(p)))
      .sort((a, b) => {
        // Strictly descending: latest uploaded product first, down to last/oldest
        const timeA = getProductTimestamp(a);
        const timeB = getProductTimestamp(b);
        if (timeA !== timeB) return timeB - timeA;
        return String(b._id || "").localeCompare(String(a._id || ""));
      })
      .map((p) => ({
        ...p,
        flowImg: optimizeImageUrl(getProductImg(p), 200),
      }));

    if (valid.length === 0) return [];
    let items = valid;
    while (items.length < 12) {
      items = [...items, ...valid];
    }
    return items;
  }, [allProductsList]);

  // Triple the list for smooth infinite scrolling and seamless wrap
  const infiniteFlowItems = useMemo(() => {
    if (newInFlowList.length === 0) return [];
    return [...newInFlowList, ...newInFlowList, ...newInFlowList];
  }, [newInFlowList]);

  // Auto-drift with seamless loop wrapping, pausing whenever the customer scrolls or touches
  useEffect(() => {
    const el = flowScrollRef.current;
    if (!el || infiniteFlowItems.length === 0) return;

    let animId;
    const speed = 0.38; // Calm, gentle, slow marquee drift for optimal user experience

    const step = () => {
      if (!isInteractingRef.current && el) {
        el.scrollLeft += speed;
        const singleSetWidth = el.scrollWidth / 3;
        if (singleSetWidth > 0 && el.scrollLeft >= singleSetWidth * 2) {
          el.scrollLeft -= singleSetWidth;
        } else if (singleSetWidth > 0 && el.scrollLeft <= 5) {
          el.scrollLeft += singleSetWidth;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [infiniteFlowItems.length]);

  const handleFlowInteractionStart = () => {
    isInteractingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleFlowInteractionEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2400);
  };

  const scrollNewIn = (direction) => {
    handleFlowInteractionStart();
    if (flowScrollRef.current) {
      const scrollAmount = direction === "left" ? -220 : 220;
      flowScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
    handleFlowInteractionEnd();
  };

  const handleMouseDown = (e) => {
    if (!flowScrollRef.current) return;
    handleFlowInteractionStart();
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    mouseStartXRef.current = e.pageX - flowScrollRef.current.offsetLeft;
    scrollStartXRef.current = flowScrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current || !flowScrollRef.current) return;
    const x = e.pageX - flowScrollRef.current.offsetLeft;
    const walk = x - mouseStartXRef.current;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    flowScrollRef.current.scrollLeft = scrollStartXRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      handleFlowInteractionEnd();
    }
  };

  // Featured hero slides matching design mockup (Category spotlight banners / top featured products)
  const heroCardSlides = useMemo(() => {
    // 1. If aisles exist, create category banner slides (like "Baby & kids", 47 items)
    if (aisles && aisles.length > 0) {
      return aisles.map((aisle) => {
        const topProduct = aisle.products[0] || {};
        const img =
          (Array.isArray(topProduct.images) && topProduct.images[0]) ||
          (Array.isArray(topProduct.image) && topProduct.image[0]) ||
          topProduct.image ||
          topProduct.images ||
          null;
        return {
          _id: topProduct._id || aisle.id,
          name: aisle.name,
          itemCount: `${aisle.products.length} items`,
          badge: "FEATURED",
          category: aisle.name,
          images: img ? [optimizeImageUrl(img, 600)] : [],
          targetUrl: `/shop?category=${encodeURIComponent(aisle.name)}`,
          product: topProduct,
        };
      });
    }

    // 2. Fallback to featuredProducts or allProductsList
    const list = featuredProducts.length > 0 ? featuredProducts : allProductsList.slice(0, 5);
    return list.map((p) => {
      const topImg =
        (Array.isArray(p.images) && p.images[0]) ||
        (Array.isArray(p.image) && p.image[0]) ||
        p.image ||
        p.images ||
        null;
      return {
        _id: p._id,
        name: p.name,
        itemCount: typeof p.price === "number" ? `ETB ${p.price.toLocaleString()}` : "In Stock",
        badge: "FEATURED",
        category: typeof p.category === "object" ? p.category?.name : p.category,
        images: topImg ? [optimizeImageUrl(topImg, 600)] : [],
        targetUrl: `/product-detail/${p._id}`,
        product: p,
      };
    });
  }, [aisles, featuredProducts, allProductsList]);

  // Auto-play the HomeProductCard carousel smoothly
  useEffect(() => {
    if (heroCardSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroCardSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroCardSlides.length]);

  const handleHeroTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleHeroTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left
        setActiveHeroSlide((prev) => (prev + 1) % heroCardSlides.length);
      } else {
        // Swiped right
        setActiveHeroSlide((prev) => (prev === 0 ? heroCardSlides.length - 1 : prev - 1));
      }
    }
    setTouchStartX(null);
  };

  return (
    <div className="w-full h-auto bg-[#f4f3f0] dark:bg-[#0c0b0a] pb-0">

      {/* ── Flow of New In Products (Horizontally Scrollable + Auto-Flowing) ── */}
      {newInFlowList.length > 0 && (
        <section className="bg-transparent pt-2.5 pb-1 px-2 sm:px-4 max-w-6xl mx-auto overflow-hidden">
          {/* Clean Header Bar: "New In" + Next/Back Navigation Controls */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-600 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 tracking-wide uppercase">
                New In
              </span>
            </div>

            {/* Next and Back Scroll Icons for horizontal manual navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollNewIn("left")}
                aria-label="Scroll New In left"
                title="Scroll back"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-[#151c28] border border-gray-200/80 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-600 hover:border-pink-600/40 shadow-2xs active:scale-90 transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => scrollNewIn("right")}
                aria-label="Scroll New In right"
                title="Scroll next"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-[#151c28] border border-gray-200/80 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-600 hover:border-pink-600/40 shadow-2xs active:scale-90 transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="relative py-1">
            {/* Horizontally scrollable product flow with calm, slow marquee */}
            <div
              ref={flowScrollRef}
              onScroll={() => {
                handleFlowInteractionStart();
                handleFlowInteractionEnd();
              }}
              onMouseEnter={handleFlowInteractionStart}
              onTouchStart={handleFlowInteractionStart}
              onTouchEnd={handleFlowInteractionEnd}
              onTouchCancel={handleFlowInteractionEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none no-scrollbar touch-pan-x cursor-grab active:cursor-grabbing select-none py-1 overscroll-x-contain"
              style={{
                WebkitOverflowScrolling: "touch",
              }}
            >
              {infiniteFlowItems.map((prod, idx) => (
                <button
                  key={`${prod._id || idx}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (hasDraggedRef.current) {
                      hasDraggedRef.current = false;
                      return;
                    }
                    handleOpenFlowProductModal(prod);
                  }}
                  title={prod.name || "Product"}
                  aria-label={`Open order modal for ${prod.name || "item"}`}
                  className="w-[66px] h-[66px] min-w-[66px] min-h-[66px] sm:w-[74px] sm:h-[74px] sm:min-w-[74px] sm:min-h-[74px] aspect-square rounded-[22px] bg-gradient-to-b from-white to-gray-50 dark:from-[#22242e] dark:to-[#17181f] border border-gray-200/90 dark:border-[#333744] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_3px_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.35)] flex items-center justify-center p-1.5 shrink-0 group hover:scale-105 hover:border-pink-400 dark:hover:border-pink-500/60 hover:shadow-[0_0_14px_rgba(201, 160, 67,0.2)] active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden select-none"
                >
                  <div className="w-full h-full flex items-center justify-center pointer-events-none">
                    <img
                      src={prod.flowImg}
                      alt={prod.name || "Product"}
                      className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-200 ease-out drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_5px_9px_rgba(0,0,0,0.55)]"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=200&q=80";
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE LAYOUT (md:hidden) — Slow product images marquee + Card
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden">

        {/* ── HomeProductCard Flow: Featured Category & Product Carousel with Dot Indicators ── */}
        {heroCardSlides.length > 0 && (
          <section className="px-3 pt-1 pb-2">
            <div
              className="relative overflow-hidden rounded-[26px] h-[195px] sm:h-[220px]"
              onTouchStart={handleHeroTouchStart}
              onTouchEnd={handleHeroTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${activeHeroSlide * 100}%)` }}
              >
                {heroCardSlides.map((slide, index) => (
                  <div key={slide._id || index} className="w-full h-full shrink-0">
                    <HomeProductCard
                      product={slide}
                      badge={slide.badge || "FEATURED"}
                      onCardClick={() => {
                        if (slide.targetUrl) navigate(slide.targetUrl);
                        else if (slide.product?._id) navigate(`/product-detail/${slide.product._id}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Dot Pagination Indicators matching design mockup */}
            {heroCardSlides.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2.5">
                {heroCardSlides.slice(0, Math.min(heroCardSlides.length, 6)).map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setActiveHeroSlide(dotIdx)}
                    aria-label={`Slide ${dotIdx + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${activeHeroSlide === dotIdx
                        ? "w-6 h-1.5"
                        : "w-1.5 h-1.5 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400"
                      }`}
                    style={
                      activeHeroSlide === dotIdx
                        ? { backgroundColor: "var(--brand-primary, #c9a043)" }
                        : {}
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Mobile Order In Seconds, Arrive In Minutes, Open Map & Phone Card ── */}
        <section className="px-3 py-2">
          <div className="relative overflow-hidden bg-white dark:bg-[#12110f] rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200/80 dark:border-slate-800 space-y-3.5">
            {/* Ambient luxury light in top corner */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 bg-pink-500/10 dark:bg-pink-500/15 rounded-full blur-2xl" />

            {/* Pill Tags */}
            <div className="flex flex-wrap items-center gap-2 relative z-10">
              <span className="bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-800/60 font-bold text-[10.5px] tracking-wider uppercase px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                <Bike className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 shrink-0" strokeWidth={2.2} />
                <span>Fast Delivery Across Town</span>
              </span>
              <span className="bg-gray-100 dark:bg-[#1c1a16] text-gray-700 dark:text-gray-300 font-semibold text-[10px] px-2 py-0.5 rounded-full border border-gray-200/60 dark:border-slate-700">
                Our Shop, In Your Home
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tight relative z-10">
              Fresh Fits Every Week, <br />
              <span style={{ color: "var(--brand-primary, #c9a043)" }}>Delivered to Your Door!</span>
            </h1>

            {/* Open Map Store Location Link - 100% High-Contrast in Bright & Dark Mode */}
            <a
              href={CONTACT_CONFIG.googleMapLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Open DS Style in Google Maps"
              className="relative z-10 w-full flex items-center justify-between p-2.5 px-3 rounded-xl bg-gray-100 dark:bg-[#1c1a16] hover:bg-gray-200 dark:hover:bg-slate-700/80 border border-gray-300 dark:border-slate-700 transition-all duration-200 group active:scale-[0.99] cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-black text-gray-900 dark:text-white truncate leading-tight">
                    Golagole 22
                  </p>
                  <p className="text-[10.5px] font-semibold text-gray-600 dark:text-gray-300 truncate">
                    Addis Ababa, Ethiopia
                  </p>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-pink-600 hover:bg-pink-700 px-3 py-1.5 rounded-lg shadow-sm transition-all">
                <span>Open Map</span>
                <ExternalLink size={12} className="text-white" />
              </span>
            </a>

            {/* Action Buttons: 2-Column Balanced Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-0.5 relative z-10">
              <button
                onClick={() => navigate("/shop")}
                className="w-full h-11 font-extrabold text-white text-xs px-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 group cursor-pointer"
                style={{ backgroundColor: "var(--brand-primary, #c9a043)" }}
              >
                <span>EXPLORE SHOP</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href={`tel:${storeContact.phoneCall || "+251918101022"}`}
                className="w-full h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-gray-50 dark:bg-[#1c1a16] border border-gray-200/80 dark:border-slate-700 hover:border-pink-300 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all shadow-2xs group active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{storeContact.phone || "0918 10 10 22"}</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT (hidden on mobile, shown md+) — Original hero design
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="hidden md:block max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6 pb-2">
        {/* Main Hero Card */}
        <div className="flex flex-col md:flex-row bg-white dark:bg-[#12110f] rounded-2xl sm:rounded-3xl shadow-md border border-gray-100 dark:border-slate-800 overflow-hidden">
          {/* Visual Store Banner */}
          {/* Square container matches the 1:1 hero artwork so its headline and category strip are never cropped */}
          <div className="md:w-1/2 aspect-square overflow-hidden bg-gray-900 relative">
            <img
              src={hero}
              alt="DS Style - sneakers, outfits and accessories at Golagole 22"
              width={1254}
              height={1254}
              fetchpriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-gray-950/50 to-transparent pointer-events-none" />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap items-center gap-2 max-w-[60%]">
              <span className="bg-gray-950/85 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>{storeContact.fullAddress || CONTACT_CONFIG.fullAddress}</span>
              </span>
              <a
                href={`tel:${storeContact.phoneCall || "+251918101022"}`}
                className="bg-gray-950/85 backdrop-blur-md text-white hover:text-pink-300 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{storeContact.phone || "0918 10 10 22"}</span>
              </a>
            </div>
          </div>

          {/* Hero Content Area */}
          <div className="md:w-1/2 flex flex-col justify-center p-5 sm:p-7 md:p-8 lg:p-10 space-y-4 sm:space-y-5 lg:space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5 sm:mb-3">
                <span className="bg-pink-50 text-pink-700 border border-pink-200/80 font-bold text-[10.5px] sm:text-xs tracking-wider uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                  <Bike className="w-4 h-4 text-pink-600 shrink-0" strokeWidth={2.2} />
                  <span>Fast Delivery Across Town</span>
                </span>
                <span className="bg-gray-100 dark:bg-[#1a1c23] text-gray-700 dark:text-white font-semibold text-[10px] sm:text-xs px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-slate-800">
                  Our Shop, In Your Home
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-gray-900 dark:text-white leading-[1.15] tracking-tight">
                Fresh Fits Every Week, <br className="hidden sm:inline" />
                <span className="text-pink-600">Delivered to Your Door!</span>
              </h1>
            </div>

            {/* Open Map Store Location Link - 100% High-Contrast in Bright & Dark Mode */}
            <div className="pt-0.5">
              <a
                href={CONTACT_CONFIG.googleMapLink}
                target="_blank"
                rel="noopener noreferrer"
                title="Open DS Style in Google Maps"
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1c1a16] hover:bg-gray-200 dark:hover:bg-slate-700/80 border border-gray-300 dark:border-slate-700 transition-all shadow-xs group active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-left">
                  <span className="text-gray-900 dark:text-white font-black text-xs sm:text-sm block leading-tight">
                    Golagole 22
                  </span>
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block">
                    Addis Ababa, Ethiopia
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold shadow-sm ml-2 transition-colors shrink-0">
                  <span>Open Map</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                </span>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => navigate("/shop")}
                className="bg-pink-600 font-extrabold text-white text-xs sm:text-sm md:text-base px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-pink-700 active:scale-95 transition-all duration-300 shadow-md flex items-center gap-2 group cursor-pointer"
              >
                <span>EXPLORE SHOP</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href={`tel:${storeContact.phoneCall || "+251918101022"}`}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 transition-all shadow-2xs group"
              >
                <Phone className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
                <span>Call Store: 0918 10 10 22</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Category Navigation Strip (Mobile UX) */}
      <section id="collection-section" className="mt-8 max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-3">
          <Title
            text1="Our"
            text2="Curated Collections"
            text1Color="text-gray-900 dark:text-gray-100"
            text2Color="text-pink-600"
          />
          <button
            onClick={() => navigate("/shop")}
            className="text-xs sm:text-sm font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1 group"
          >
            <span>All Products</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Horizontal Database-Driven Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          <button
            onClick={() => scrollToCategory("collection-section", "all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border ${activeCategoryFilter === "all"
                ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                : "bg-white text-gray-700 border-gray-200 hover:border-pink-300 hover:text-pink-600 dark:bg-slate-900 dark:text-gray-300 dark:border-slate-800"
              }`}
          >
            🌟 All Collections
          </button>
          {aisles.map((cat) => {
            const secId = `category-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
            const isSelected = activeCategoryFilter === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                onClick={() => scrollToCategory(secId, cat.name.toLowerCase())}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border ${isSelected
                    ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-pink-300 hover:text-pink-600 dark:bg-slate-900 dark:text-gray-300 dark:border-slate-800"
                  }`}
              >
                {cat.emoji} {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Dynamic Products by Category Sections from Database */}
      <section className="mt-6 max-w-6xl mx-auto space-y-6 sm:space-y-10 pb-0 sm:pb-0 mb-0">
        {aisles.map((cat) => {
          const secId = `category-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
          const curPage = pageMap[cat.name] || 0;
          return renderCategory(
            cat.products,
            curPage,
            (updater) => {
              setPageMap((prev) => ({
                ...prev,
                [cat.name]:
                  typeof updater === "function" ? updater(prev[cat.name] || 0) : updater,
              }));
            },
            cat.name,
            secId,
            cat.emoji
          );
        })}
      </section>

      {/* Step by Step How to Order + Delivery and Payment Guidance */}
      <HowToOrderSection />

      {/* Quick Order Modal on Flow Product Click */}
      <QuickOrderModal
        product={selectedFlowProduct}
        isOpen={isFlowModalOpen}
        onClose={() => {
          setIsFlowModalOpen(false);
          setSelectedFlowProduct(null);
        }}
      />
    </div>
  );
}

export default Home;
