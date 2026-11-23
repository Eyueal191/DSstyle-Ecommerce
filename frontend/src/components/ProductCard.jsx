import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Plus, Minus, X, Check, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Axios from "../axios/axios.config.js";
import { setUserBag } from "../redux/bagSlice.js";
import Loading from "./Loading";
import { optimizeImageUrl } from "../utility/imageOptimizer.js";
import QuickOrderModal from "./QuickOrderModal.jsx";

function ProductCard({ product, className = "" }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  if (!product) {
    return (
      <div
        className={`w-full aspect-[3/4.2] sm:aspect-[2/3] rounded-2xl em-skeleton ${className}`}
      />
    );
  }

  const {
    _id: id,
    name,
    brand,
    price,
    category,
    amount,
    volume,
    images,
    isCrueltyFree,
    visibleStock,
    actualStock,
    quantity = 10,
    inStock = true,
  } = product;

  // Client storefront strictly respects visibleStock for customer display & purchase limits
  const clientAvailableStock =
    visibleStock !== undefined && visibleStock !== null
      ? Number(visibleStock)
      : (actualStock !== undefined && actualStock !== null
          ? Number(actualStock)
          : Number(quantity) || 0);

  const displayAmount = amount || volume || "";

  const handleNavigation = () => {
    if (id) navigate(`/product-detail/${id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && id) navigate(`/product-detail/${id}`);
  };

  const handleOpenQuantityModal = (e) => {
    e.stopPropagation(); // Prevent opening product detail
    if (!inStock || clientAvailableStock <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }
    setSelectedQuantity(1);
    setIsModalOpen(true);
  };

  const handleConfirmAddToBag = async (e) => {
    e.stopPropagation();
    if (isAdding) return;

    if (!inStock || clientAvailableStock <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }

    if (selectedQuantity > clientAvailableStock) {
      toast.error("Sorry, that quantity isn't available right now. Please choose fewer.");
      return;
    }

    let currentUserId = localStorage.getItem("userId");
    if (!currentUserId) {
      currentUserId =
        "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("userId", currentUserId);
    }

    setIsAdding(true);
    try {
      const response = await Axios.post("/api/bag/", {
        newItem: {
          product: id,
          quantity: selectedQuantity,
        },
        userId: currentUserId,
      });

      if (response.data.success && (response.data.userBag || response.data.userCart)) {
        const bag = response.data.userBag || response.data.userCart;
        dispatch(setUserBag(bag));
        setJustAdded(true);
        toast.success(`${selectedQuantity}x ${name || "Item"} added to bag!`, { duration: 1800 });
        setIsModalOpen(false);
        setTimeout(() => setJustAdded(false), 1600);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add item to bag");
    } finally {
      setIsAdding(false);
    }
  };

  const isOutOfStock = !inStock || clientAvailableStock <= 0;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={`group w-full bg-white dark:bg-[#161411] border border-gray-200/70 dark:border-white/[0.07] rounded-2xl shadow-xs dark:shadow-[0_6px_20px_-8px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden cursor-pointer
                   hover:shadow-lg hover:border-pink-200 dark:hover:border-pink-500/40 hover:-translate-y-0.5 transition-all duration-300 ease-[var(--ease-calm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0b0a] ${className}`}
        onClick={handleNavigation}
        onKeyDown={handleKeyDown}
      >
        {/* Product Image Section */}
        <div className="w-full aspect-square relative rounded-t-2xl overflow-hidden bg-gray-50 dark:bg-slate-800/70 flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 em-skeleton rounded-t-2xl" />
          )}
          {images?.[0] ? (
            <img
              src={optimizeImageUrl(images[0], 400)}
              alt={name || "Product"}
              className={`w-full h-full object-cover transition-[transform,opacity] duration-500 ease-[var(--ease-calm)] group-hover:scale-[1.04] ${
                imageLoaded ? "opacity-100" : "opacity-90"
              }`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                setImageLoaded(true);
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-xs">
              No Image
            </div>
          )}

          {/* Badges */}
          {isOutOfStock ? (
            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-gray-900/75 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full">
              Sold Out
            </span>
          ) : isCrueltyFree ? (
            <span className="hidden sm:inline-block absolute top-2 right-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm text-pink-700 dark:text-pink-300 border border-pink-200/70 dark:border-pink-500/25 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Cruelty-Free
            </span>
          ) : null}
        </div>

        {/* Product Info Section */}
        <div className="p-2.5 sm:p-3.5 flex flex-col justify-between flex-1">
          <div>
            {/* Brand */}
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] uppercase text-pink-600 dark:text-pink-400 block mb-1 truncate">
              {brand || "DS Style"}
            </span>

            {/* Product Name */}
            <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-[12px] sm:text-[13px] md:text-sm leading-snug line-clamp-2 min-h-[32px] sm:min-h-[36px]">
              {name || "Unnamed Product"}
            </h3>
          </div>

          <div>
            {/* Amount / Category info */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 my-1">
              <span className="truncate max-w-[60%]">
                {typeof category === "object" ? category?.name : category || "Mart"}
              </span>
              {displayAmount && (
                <span className="truncate max-w-[40%] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md text-[10px]">
                  {displayAmount}
                </span>
              )}
            </div>

            {/* Price & Plus Icon Button */}
            <div className="flex items-center justify-between gap-1 mt-1.5 sm:mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-baseline">
                <span className="text-gray-900 dark:text-white font-bold text-[13px] sm:text-sm md:text-base leading-tight tabular-nums tracking-tight">
                  {Number(price ?? 0).toLocaleString()}{" "}
                  <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400">ETB</span>
                </span>
              </div>

              {/* Plus / Cross Icon Button (Opens Quantity Modal) */}
              <button
                onClick={handleOpenQuantityModal}
                disabled={isOutOfStock}
                title="Add to bag"
                aria-label={`Select quantity for ${name || "item"}`}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#161411] ${
                  justAdded
                    ? "bg-emerald-500 text-white scale-105 shadow-[0_6px_14px_-6px_rgba(16,185,129,0.7)]"
                    : isOutOfStock
                    ? "bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-pink-600 hover:bg-pink-700 active:scale-90 text-white shadow-[0_6px_14px_-6px_rgba(var(--brand-primary-rgb),0.7)]"
                }`}
              >
                {justAdded ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enlarging Quantity & Add to Bag Modal */}
      <QuickOrderModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default ProductCard;
