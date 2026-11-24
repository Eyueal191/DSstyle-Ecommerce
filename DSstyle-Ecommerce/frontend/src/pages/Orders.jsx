import React, { useEffect, useRef, useState, useCallback } from "react";
import { Package } from "lucide-react";
import Axios from "../axios/axios.config.js";
import { useVirtualizer } from "@tanstack/react-virtual";
import OrderCard from "../components/OrderCard.jsx";
import Title from "../components/Title.jsx";
import Loading from "../components/Loading.jsx";
import { Link } from "react-router-dom";

function Orders() {
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const parentRef = useRef();

  const fetchOrders = useCallback(async () => {
    const phone = localStorage.getItem("phone");
    const userId = localStorage.getItem("userId");
    const target = (phone || userId || "").trim();

    if (!target) return;

    try {
      setLoading(true);
      let response;
      if (phone) {
        try {
          response = await Axios.get(`/api/order/phone/${encodeURIComponent(phone)}`);
        } catch {
          response = await Axios.get(`/api/order/user/${encodeURIComponent(target)}`);
        }
      } else {
        response = await Axios.get(`/api/order/user/${encodeURIComponent(target)}`);
      }

      const data = response.data;
      if (data.success) {
        setUserOrders(data.orders?.items || []);
      } else {
        setUserOrders([]);
      }
    } catch {
      setUserOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refresh]);

  // Virtualizer setup with compact mobile row sizing
  const rowVirtualizer = useVirtualizer({
    count: userOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (typeof window !== "undefined" && window.innerWidth < 640 ? 88 : 140),
    overscan: 3,
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-4 sm:py-8 md:py-12 px-2 sm:px-4 md:px-8 bg-[#f4f3f0] dark:bg-[#0c0b0a]">
      {/* Title */}
      <div className="w-full max-w-5xl mx-auto mb-3 sm:mb-6 px-1 flex items-center justify-between">
        <Title
          text1="My"
          text2="Orders"
          text1Color="text-gray-900 dark:text-gray-100"
          text2Color="text-pink-600"
          addSolidLineAfter={true}
          lineColor="bg-pink-600"
        />
        {userOrders.length > 0 && (
          <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
            {userOrders.length} {userOrders.length === 1 ? "order" : "orders"}
          </span>
        )}
      </div>

      {/* Orders Container */}
      <div
        ref={parentRef}
        className="relative overflow-auto h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xs border border-gray-200/90 dark:border-slate-800 p-2.5 sm:p-5"
      >
        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <Loading />
          </div>
        ) : userOrders.length === 0 ? (
          <div className="text-center py-16 px-4 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-3xl flex items-center justify-center bg-pink-50 dark:bg-pink-500/10 ring-1 ring-pink-600/10 shadow-[0_12px_30px_-12px_rgba(var(--brand-primary-rgb),0.45)]">
              <Package className="w-7 h-7 sm:w-9 sm:h-9 text-pink-600 dark:text-pink-400" strokeWidth={1.7} />
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">No orders placed yet</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs dark:text-gray-400">
              When you order products from DS Style, they will appear right here.
            </p>
            <Link
              to="/shop"
              className="em-btn em-btn-primary mt-5 px-6"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = userOrders[virtualRow.index];
              return (
                <div
                  key={item?._id || virtualRow.index}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-2.5 sm:pb-3.5"
                >
                  <OrderCard item={item} setRefresh={setRefresh} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
