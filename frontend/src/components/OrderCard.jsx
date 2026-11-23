import React, { useState } from "react";
import Axios from "../axios/axios.config.js";
import toast from "react-hot-toast";

function OrderCard({ item, setRefresh }) {
  const [cancelling, setCancelling] = useState(false);

  if (!item?.product) return null;

  const { product, quantity, createdAt, paymentStatus, status, address, paymentMethod } = item;
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent";

  const cancelHandler = async () => {
    if (cancelling) return;
    setCancelling(true);

    try {
      const userId = localStorage.getItem("userId");
      if (!item._id) throw new Error("Item ID not found");

      const res = await Axios.delete(`/api/order/user/${userId}`, {
        data: { cancelItem: { _id: item._id } },
      });

      if (res.data.success) {
        toast.success(res.data.message || "Order cancelled successfully");
        setRefresh((prev) => !prev);
      } else {
        toast.error(res.data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling item:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to cancel item");
    } finally {
      setCancelling(false);
    }
  };

  const paymentBadgeClasses =
    paymentStatus === "succeeded"
      ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/25"
      : paymentStatus === "failed"
      ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25"
      : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25";

  const paymentText =
    paymentStatus === "succeeded"
      ? "Paid"
      : paymentStatus === "failed"
      ? "Failed"
      : "Cash on Delivery";

  const statusBadgeClasses =
    status === "delivered"
      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
      : status === "shipped"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300"
      : status === "cancelled"
      ? "bg-gray-100 text-gray-500 line-through dark:bg-slate-800 dark:text-gray-400"
      : "bg-pink-100 text-pink-700";

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-row items-center gap-2.5 sm:gap-5 p-2.5 sm:p-4 md:p-5 border border-gray-200/90 rounded-xl sm:rounded-2xl shadow-2xs bg-white hover:bg-gray-50/70 transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
      {/* Product Image - Diminished compact (64px) on mobile */}
      <figure className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 shrink-0 rounded-lg sm:rounded-xl overflow-hidden relative shadow-2xs border border-gray-100 bg-gray-50 flex items-center justify-center dark:border-slate-800 dark:bg-slate-800/50">
        <img
          src={product.images?.[0] || "/placeholder.png"}
          alt={product.name || "Product"}
          loading="lazy"
          className="w-full h-full object-cover rounded-lg sm:rounded-xl transition-transform duration-300 hover:scale-105"
        />
      </figure>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <h3 className="text-xs sm:text-base font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none dark:text-gray-100">
            {product.name || "Product"}
          </h3>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider ${statusBadgeClasses}`}
          >
            {status || "Processing"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs text-gray-700 mt-1 dark:text-gray-300">
          <span className="font-extrabold text-gray-900 text-xs sm:text-sm dark:text-gray-100">
            {(product.price || 0).toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">ETB</span>
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-[11px] sm:text-xs text-gray-500 font-medium dark:text-gray-400">
            Qty: <strong className="text-gray-900 font-bold dark:text-gray-100">{quantity || 1}</strong>
          </span>
        </div>

        {address && (
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate max-w-sm dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span> {address}
          </p>
        )}

        <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
          Ordered on: {formattedDate}
        </p>
      </div>

      {/* Payment Status & Actions - Compact on mobile */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${paymentBadgeClasses}`}>
          {paymentText}
        </span>

        {/* Cancel Button */}
        {status !== "delivered" && status !== "cancelled" && (
          <button
            onClick={cancelHandler}
            disabled={cancelling}
            className={`text-[10px] sm:text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer dark:border-red-500/25 ${
              cancelling
                ? "text-red-400 opacity-50 cursor-not-allowed"
                : "text-red-600 hover:bg-red-50 hover:border-red-300"
            }`}
          >
            {cancelling ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderCard;
