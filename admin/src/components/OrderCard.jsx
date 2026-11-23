import React from "react";
import OrderItemCard from "./OrderItemCard.jsx";

function OrderCard({ order, setUpdate }) {
  const { user, items, customerName, customerPhone, deliveryAddress } = order;

  // If items are missing, render nothing
  if (!items?.length) return null;

  const displayName = customerName || user?.name || "Guest Customer";
  const displayPhone = customerPhone || user?.phone || "Not provided";
  const displayAddress = deliveryAddress || items[0]?.address || "Not provided";

  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-800 dark:bg-slate-900 dark:border-slate-800 dark:text-gray-100">
      {/* Order Header with Customer Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-base dark:text-gray-100">{displayName}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium dark:bg-slate-800 dark:text-gray-400">
              {displayPhone}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Delivery Address:</span> {displayAddress}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-gray-400">
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
          </span>
          <div className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
            {items.length} {items.length === 1 ? "item" : "items"}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <OrderItemCard
            key={item._id}
            item={item}
            orderId={order._id}
            user={{
              _id: user?._id || order.guestId || order.customerPhone,
              name: displayName,
              phone: displayPhone,
              address: displayAddress,
            }}
            setUpdate={setUpdate}
          />
        ))}
      </div>
    </div>
  );
}

export default OrderCard;
