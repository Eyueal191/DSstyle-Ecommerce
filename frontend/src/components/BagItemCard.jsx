import React, { useState } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import Axios from "../axios/axios.config.js";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUserBag } from "../redux/bagSlice.js";

function BagItemCard({ item, setRefetchBag }) {
  const dispatch = useDispatch();
  const userId = localStorage.getItem("userId");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item || !item.product) return null;

  const removeHandler = async () => {
    try {
      setIsDeleting(true);
      const response = await Axios.delete(`/api/bag/${userId}/item`, {
        data: item,
      });
      const data = response.data;

      if (data.success && (data.userBag || data.userCart)) {
        const updatedBag = data.userBag || data.userCart;
        if (setRefetchBag) setRefetchBag((prev) => !prev);
        dispatch(setUserBag(updatedBag));
        toast.success("Item removed from bag");
      } else {
        toast.error("Failed to update bag");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`w-full flex flex-row items-center gap-2.5 sm:gap-5 p-2.5 sm:p-4 md:p-5 border border-gray-200/90 rounded-xl sm:rounded-2xl shadow-2xs bg-white
        hover:bg-gray-50/70 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 ${
          isDeleting ? "opacity-50 pointer-events-none" : ""
        }`}
    >
      {/* Product Image - Diminished compact on mobile (60px), spacious on tablet/desktop */}
      <figure className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 shrink-0 relative rounded-lg sm:rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center dark:border-slate-800 dark:bg-slate-800/50">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg sm:rounded-xl dark:bg-slate-700" />
        )}
        <img
          src={item.product.images?.[0] || "/placeholder.png"}
          alt={item.product.name || "Beauty Product"}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover rounded-lg sm:rounded-xl transition-opacity duration-300 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </figure>

      {/* Product Details - Compact typography on mobile */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {item.product.brand && (
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-pink-600 truncate block">
            {item.product.brand}
          </span>
        )}
        <h3 className="text-xs sm:text-base font-bold text-gray-900 truncate leading-snug dark:text-gray-100">
          {item.product.name || "Unknown Product"}
        </h3>
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-gray-700 mt-0.5 dark:text-gray-300">
          <span className="text-gray-900 font-extrabold text-xs sm:text-sm dark:text-gray-100">
            {(item.product.price || 0).toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">ETB</span>
          </span>
          <span className="text-gray-300 text-xs">•</span>
          <span className="text-[11px] sm:text-xs text-gray-500 font-medium dark:text-gray-400">
            Qty: <strong className="text-gray-900 font-bold dark:text-gray-100">{item.quantity || 1}</strong>
          </span>
        </div>
      </div>

      {/* Compact Remove Button */}
      <button
        className="p-2 sm:px-3 sm:py-2 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg sm:rounded-xl hover:bg-red-50 text-xs sm:text-sm font-semibold transition shrink-0 ml-auto flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs dark:border-red-500/25"
        onClick={removeHandler}
        disabled={isDeleting}
        title="Remove item from bag"
        aria-label="Remove item"
      >
        <RiDeleteBin6Line className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        <span className="hidden sm:inline">Remove</span>
      </button>
    </div>
  );
}

export default BagItemCard;
