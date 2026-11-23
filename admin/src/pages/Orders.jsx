import React, { useState, useEffect } from "react";
import Axios from "../axios/axios.config.js";
import { Search, Package, Phone, MapPin, CheckCircle2, Clock, Truck, XCircle, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await Axios.get("/api/order");
      if (res?.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch (e) {
      console.warn("Could not fetch orders from DB:", e.message);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await Axios.put(`/api/order/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => {
          if (o._id === orderId) {
            return {
              ...o,
              status: newStatus,
              items: o.items ? o.items.map((it) => ({ ...it, status: newStatus.toLowerCase() })) : [],
            };
          }
          return o;
        })
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order status");
    }
  };

  const getItemProductName = (item) => {
    if (!item) return "Product";
    if (typeof item.product === "string") return item.product;
    if (typeof item.product === "object" && item.product) {
      return item.product.name || item.product.title || "Product";
    }
    return "Product";
  };

  const getOrderStatus = (order) => {
    if (order.status) return order.status;
    if (order.items && order.items.length > 0 && order.items[0].status) {
      return order.items[0].status;
    }
    return "Pending";
  };

  const calculateOrderTotal = (order) => {
    if (order.totalPrice) return Number(order.totalPrice);
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => {
        const q = Number(item.quantity) || 1;
        const p = Number(item.priceAtPurchase || item.product?.price) || 0;
        return sum + q * p;
      }, 0);
    }
    return 0;
  };

  const getStatusBadge = (rawStatus) => {
    const status = String(rawStatus || "pending").toLowerCase();
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            <span>Shipped</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-[#f5dbe5]">
            <Clock className="w-3.5 h-3.5 text-pink-600" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const filtered = orders.filter((o) => {
    const custName = (o.customerName || o.user?.name || "").toLowerCase();
    const custPhone = (o.customerPhone || o.user?.phone || "");
    const address = (o.deliveryAddress || "").toLowerCase();
    const orderId = String(o._id || "").toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch =
      custName.includes(searchLower) ||
      custPhone.includes(searchLower) ||
      address.includes(searchLower) ||
      orderId.includes(searchLower);

    const currentStatus = getOrderStatus(o).toLowerCase();
    const matchesStatus =
      statusFilter === "All" ||
      currentStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-0">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight dark:text-gray-100">
            Orders
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
            Manage incoming orders and delivery status
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 text-gray-500 hover:text-pink-600 hover:bg-white rounded-xl border border-gray-200/80 transition-all cursor-pointer shadow-2xs dark:text-gray-400 dark:border-slate-800"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-[260px] sm:max-w-none sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, phone..."
            className="w-full pl-3.5 pr-9 py-2 sm:py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-50 focus:border-pink-600 transition-all shadow-2xs dark:bg-slate-900 dark:border-slate-800"
          />
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
          {["All", "Pending", "Shipped", "Delivered", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${statusFilter === st
                ? "bg-pink-600 text-white shadow-2xs"
                : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50 dark:bg-slate-900 dark:text-gray-400 dark:border-slate-800 dark:hover:bg-slate-800"
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE ORDERS VIEW: Touch-Friendly Responsive Cards */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-pink-600 rounded-full animate-spin mb-2" />
            <div>Loading orders...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100 dark:bg-slate-900 dark:border-slate-800">
            {search ? `No orders match "${search}"` : "No orders found"}
          </div>
        ) : (
          filtered.map((order) => {
            const name = order.customerName || order.user?.name || "Guest";
            const phone = order.customerPhone || order.user?.phone || "N/A";
            const address = order.deliveryAddress || "Addis Ababa";
            const itemsCount = order.items?.length || 1;
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent";
            const total = calculateOrderTotal(order);
            const status = getOrderStatus(order);

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-4 border border-gray-200/70 shadow-2xs space-y-3 hover:border-pink-200 transition-colors dark:bg-slate-900 dark:border-slate-800"
              >
                {/* Header: Order ID, Date & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-900 block dark:text-gray-100">
                      #{String(order._id).slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-gray-400">{dateStr}</span>
                  </div>
                  <div>{getStatusBadge(status)}</div>
                </div>

                {/* Customer Details */}
                <div className="pt-2 border-t border-gray-100 space-y-1 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm dark:text-gray-100">{name}</span>
                    {phone && phone !== "N/A" && (
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-1 text-xs font-mono text-pink-600 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{phone}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{address}</span>
                  </div>
                </div>

                {/* Items & Total */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs dark:border-slate-800">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {itemsCount} item{itemsCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-[11px] text-gray-400 block truncate max-w-[150px]">
                      {order.items?.map((it) => getItemProductName(it)).join(", ") || "Standard order"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total</span>
                    <span className="font-bold text-gray-900 font-serif text-sm dark:text-gray-100">
                      ETB {Number(total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Update Status Dropdown for Mobile */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 dark:border-slate-800">
                  <span className="text-xs text-gray-500 font-medium dark:text-gray-400">Update Status:</span>
                  <select
                    value={status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:border-pink-600 cursor-pointer dark:bg-slate-800/50 dark:border-slate-800 dark:text-gray-300"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-transparent border-b border-gray-100 text-xs font-semibold text-gray-600 dark:border-slate-800 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-4">Order ID & Date</th>
                <th scope="col" className="px-6 py-4">Customer</th>
                <th scope="col" className="px-6 py-4">Items</th>
                <th scope="col" className="px-6 py-4">Total</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">
                    <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-pink-600 rounded-full animate-spin mb-2" />
                    <div>Loading orders...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">
                    {search ? `No orders found matching "${search}"` : "No orders found"}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const name = order.customerName || order.user?.name || "Guest";
                  const phone = order.customerPhone || order.user?.phone || "N/A";
                  const address = order.deliveryAddress || "Addis Ababa";
                  const itemsCount = order.items?.length || 1;
                  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent";
                  const total = calculateOrderTotal(order);
                  const status = getOrderStatus(order);

                  return (
                    <tr key={order._id} className="hover:bg-gray-50/60 transition-colors dark:hover:bg-slate-800">
                      {/* Order ID & Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                          #{String(order._id).slice(-6).toUpperCase()}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {dateStr}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 whitespace-nowrap dark:text-gray-100">
                          {name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 whitespace-nowrap font-mono dark:text-gray-400">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5 max-w-[200px] truncate">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{address}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-800 font-medium dark:text-gray-100">
                          {itemsCount} {itemsCount === 1 ? "product" : "products"}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                          {order.items?.map((it) => getItemProductName(it)).join(", ") || "Standard order"}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 font-semibold text-gray-900 font-serif whitespace-nowrap dark:text-gray-100">
                        ETB {Number(total || 0).toLocaleString()}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(status)}
                      </td>

                      {/* Update Status Dropdown */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <select
                          value={status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:border-pink-600 cursor-pointer dark:bg-slate-800/50 dark:border-slate-800 dark:text-gray-300"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Orders;
