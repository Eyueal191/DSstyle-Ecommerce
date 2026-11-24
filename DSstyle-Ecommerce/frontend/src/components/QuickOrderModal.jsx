import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { Plus, Minus, X, Check, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Axios from "../axios/axios.config.js";
import { setUserBag } from "../redux/bagSlice.js";
import { optimizeImageUrl } from "../utility/imageOptimizer.js";

function QuickOrderModal({ product, isOpen, onClose }) {
  const dispatch = useDispatch();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedQuantity(1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product || typeof document === "undefined") {
    return null;
  }

  const {
    _id: id,
    name,
    brand,
    price,
    amount,
    volume,
    images,
    image,
    visibleStock,
    actualStock,
    quantity = 10,
    inStock = true,
  } = product;

  const clientAvailableStock =
    visibleStock !== undefined && visibleStock !== null
      ? Number(visibleStock)
      : actualStock !== undefined && actualStock !== null
      ? Number(actualStock)
      : Number(quantity) || 0;

  const displayAmount = amount || volume || "";

  const prodImg =
    (Array.isArray(images) && images[0]) ||
    (Array.isArray(image) && image[0]) ||
    images ||
    image ||
    null;

  const isOutOfStock = !inStock || clientAvailableStock <= 0;

  const handleConfirmAddToBag = async (e) => {
    e.stopPropagation();
    if (isAdding) return;

    if (isOutOfStock) {
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
        toast.success(`${selectedQuantity}x ${name || "Item"} added to bag!`, { duration: 2000 });
        onClose();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add item to bag");
    } finally {
      setIsAdding(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative border border-gray-100 dark:border-slate-800 transition-transform duration-200 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-300 flex items-center justify-center transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Preview */}
        <div className="flex items-center gap-3.5 pr-8">
          <figure className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex items-center justify-center p-1.5">
            <img
              src={prodImg ? optimizeImageUrl(prodImg, 300) : "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=300&q=80"}
              alt={name || "Product"}
              className="w-full h-full object-contain"
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=300&q=80";
              }}
            />
          </figure>
          <div className="min-w-0 flex-1">
            <span
              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider block truncate"
              style={{ color: "var(--brand-primary, #c9a043)" }}
            >
              {brand || "DS Style"}
            </span>
            <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
              {name || "Product"}
            </h4>
            <p className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{Number(price ?? 0).toLocaleString()} ETB</span>
              {displayAmount && (
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-gray-200/50 dark:border-slate-700">
                  {displayAmount}
                </span>
              )}
              {(product.formattedDate || product.createdAt) && (
                <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-full border border-pink-200/50 dark:border-pink-800/40">
                  🗓️ {product.formattedDate || new Date(product.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="my-4 border-t border-gray-100 dark:border-slate-800" />

        {/* Quantity Stepper */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 block">
              Quantity
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-400">
              {isOutOfStock ? "Out of stock" : "In stock"}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setSelectedQuantity((prev) => Math.max(1, prev - 1))}
              disabled={selectedQuantity <= 1 || isAdding}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-black text-base sm:text-lg text-gray-900 dark:text-white select-none">
              {selectedQuantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setSelectedQuantity((prev) => Math.min(clientAvailableStock || 99, prev + 1))
              }
              disabled={selectedQuantity >= (clientAvailableStock || 99) || isAdding}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtotal preview */}
        <div className="flex items-center justify-between bg-pink-50/70 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/50 rounded-xl px-3.5 py-2.5 mb-4">
          <span className="text-xs font-semibold text-pink-900 dark:text-pink-200">
            Total Price:
          </span>
          <span
            className="text-sm sm:text-base font-black"
            style={{ color: "var(--brand-primary, #c9a043)" }}
          >
            {(Number(price ?? 0) * selectedQuantity).toLocaleString()} ETB
          </span>
        </div>

        {/* Add To Bag Submit Button */}
        <button
          type="button"
          onClick={handleConfirmAddToBag}
          disabled={isAdding || isOutOfStock}
          className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: "var(--brand-primary, #c9a043)" }}
        >
          {isAdding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Adding to Bag...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add to Bag</span>
            </>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
}

export default QuickOrderModal;

