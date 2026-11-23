import React, { useState, useEffect, useCallback } from "react";
import Axios from "../axios/axios.config.js";
import OrderCard from "../components/OrderCard.jsx";
import { debounce } from "lodash";
import Title from "../components/Title.jsx";

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get("/api/order");
      const data = response.data.orders || [];
      setOrders(data);
      setFilteredOrders(data); // initially show all
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounced search input
  const debouncedSetSearch = useCallback(
    debounce((value) => setSearch(value), 400),
    []
  );

  useEffect(() => {
    return () => debouncedSetSearch.cancel(); // cleanup
  }, [debouncedSetSearch]);

  const handleSearchChange = (e) => debouncedSetSearch(e.target.value);

  // Filter function triggered by button
  const applyFilter = () => {
    let filtered = [...orders];

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.user?.name?.toLowerCase().includes(lowerSearch) ||
          order.customerName?.toLowerCase().includes(lowerSearch) ||
          order.customerPhone?.toLowerCase().includes(lowerSearch) ||
          order.deliveryAddress?.toLowerCase().includes(lowerSearch) ||
          order.items?.some((item) =>
            item.product?.name?.toLowerCase().includes(lowerSearch)
          )
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((order) => {
        if (!order.createdAt) return false;
        return new Date(order.createdAt).toISOString().startsWith(dateFilter);
      });
    }

    setFilteredOrders(filtered);
  };

  return (
    <div className="w-full min-h-screen px-4 md:px-6 lg:px-8 py-8 flex flex-col gap-6 bg-gray-50 dark:bg-slate-800/50">
      {/* Title */}
      <Title text1="Orders" addSolidLineAfter={true} />

      {/* Filter Header */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white rounded-xl shadow-md h-auto md:h-20 dark:bg-slate-900">
        <input
          type="text"
          placeholder="Search by user or product..."
          onChange={handleSearchChange}
          className="w-full max-w-[260px] md:max-w-none md:w-1/2 border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 dark:border-slate-700"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full md:w-1/4 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500/40 dark:border-slate-700"
        />
        <div className="flex flex-row gap-2 w-full md:w-auto">
          <button
            className="bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700 transition flex-1 md:flex-none"
            onClick={applyFilter}
          >
            Apply Filter
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition flex-1 md:flex-none"
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setFilteredOrders(orders);
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <p className="text-center text-gray-500 mt-4 dark:text-gray-400">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500 mt-4 dark:text-gray-400">No orders found.</p>
      ) : (
        <div className="flex flex-col gap-6 mt-2">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={{
                ...order,
                user: order.user || { name: "Unknown User" },
                items: order.items || [],
              }}
              setUpdate={fetchOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default OrderList;
