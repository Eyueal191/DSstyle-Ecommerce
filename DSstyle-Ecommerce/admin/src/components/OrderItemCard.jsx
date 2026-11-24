import React, { useState } from "react";
import Axios from "../axios/axios.config.js";
import { toast } from "react-toastify";

function OrderItemCard({ item, user, orderId, setUpdate }) {
  const [itemUpdate, setItemUpdate] = useState({
    paymentStatus: item.paymentStatus,
    status: item.status,
  });
  const [updating, setUpdating] = useState(false);

  const handleUpdate = (e) => {
    const { name, value } = e.target;
    setItemUpdate((prev) => ({ ...prev, [name]: value }));
  };

  const submitUpdate = async () => {
    try {
      if (updating) return;
      setUpdating(true);

      const response = await Axios.put(`/api/order/${item._id}`, {
        itemUpdate,
        userId: user?._id,
        orderId,
      });

      const data = response.data;
      if (data.success) {
        toast.success(data.message || "Order updated");
        if (setUpdate) setUpdate((prev) => !prev);
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating order item:", error);
      toast.error("Something went wrong while updating");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 sm:p-5 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-800/50">
      {/* Product Image */}
      <figure className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200 bg-white flex-shrink-0 dark:border-slate-800 dark:bg-slate-900">
        <img
          src={item?.product?.images?.[0] || "/placeholder.png"}
          alt={item?.product?.name || "Product"}
          className="object-cover w-full h-full"
        />
      </figure>

      {/* Product Details */}
      <div className="flex-1 space-y-1">
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight dark:text-gray-100">
          {item?.product?.name || "DS Style Item"}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Price: <strong className="text-pink-600">${item?.priceAtPurchase ?? item?.product?.price ?? "0.00"}</strong>
          </span>
          <span>•</span>
          <span>
            Qty: <strong className="text-gray-900 dark:text-gray-100">{item.quantity || 1}</strong>
          </span>
          <span>•</span>
          <span>
            Method: <span className="uppercase font-semibold text-xs bg-gray-200 px-2 py-0.5 rounded dark:bg-slate-700">{item.paymentMethod || "cod"}</span>
          </span>
        </div>
        {item.address && (
          <p className="text-xs text-gray-500 pt-1 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Delivery Address:</span> {item.address}
          </p>
        )}
      </div>

      {/* Status Controls */}
      <div className="flex flex-row items-end md:items-center gap-4 flex-wrap md:flex-nowrap w-full md:w-auto">
        {/* Payment Status */}
        <div className="flex flex-col min-w-[130px] flex-1 md:flex-none">
          <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide dark:text-gray-400">
            Payment
          </label>
          <select
            name="paymentStatus"
            value={itemUpdate.paymentStatus}
            onChange={handleUpdate}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 dark:border-slate-700 dark:bg-slate-900"
          >
            {["pending", "succeeded", "failed"].map((ps) => (
              <option value={ps} key={ps}>
                {ps}
              </option>
            ))}
          </select>
        </div>

        {/* Order Status */}
        <div className="flex flex-col min-w-[130px] flex-1 md:flex-none">
          <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide dark:text-gray-400">
            Status
          </label>
          <select
            name="status"
            value={itemUpdate.status}
            onChange={handleUpdate}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 dark:border-slate-700 dark:bg-slate-900"
          >
            {["processing", "shipped", "delivered", "cancelled"].map((s) => (
              <option value={s} key={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Update Button */}
        <div className="flex-shrink-0">
          <button
            onClick={submitUpdate}
            className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-md px-5 py-2 shadow transition active:scale-95 disabled:opacity-50"
            disabled={updating}
          >
            {updating ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderItemCard;
