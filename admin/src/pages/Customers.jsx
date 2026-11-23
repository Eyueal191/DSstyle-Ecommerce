import React, { useState, useEffect } from "react";
import Axios from "../axios/axios.config.js";
import { Search, Phone, Users, RefreshCw, ShoppingBag, DollarSign, Calendar, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await Axios.get("/api/analytics/customers");
      if (res.data?.success && res.data?.customers) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.warn("Could not fetch customers from DB:", err.message);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search)
  );

  const totalOrdersCount = customers.reduce((acc, c) => acc + (Number(c.orders) || 0), 0);
  const totalSpentVolume = customers.reduce((acc, c) => acc + (Number(c.totalSpent) || 0), 0);
  const avgSpentPerCustomer = customers.length > 0 ? Math.round(totalSpentVolume / customers.length) : 0;

  const getInitials = (name) => {
    if (!name) return "CU";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-14 px-2 sm:px-0">
      {/* Page Title & Refresh */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight dark:text-gray-100">
            Customers
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
            Directory of all registered and checkout shoppers
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-pink-600 hover:bg-white rounded-xl border border-gray-200/80 transition-all cursor-pointer shadow-2xs dark:text-gray-400 dark:border-slate-800"
          title="Refresh customers"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-pink-600" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards for Mobile & Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/70 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Customers
              </span>
              <p className="text-base sm:text-xl font-bold text-gray-900 font-serif leading-none mt-0.5 dark:text-gray-100">
                {customers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/70 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 dark:bg-purple-500/10">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Orders
              </span>
              <p className="text-base sm:text-xl font-bold text-gray-900 font-serif leading-none mt-0.5 dark:text-gray-100">
                {totalOrdersCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/70 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 dark:bg-emerald-500/10">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Revenue
              </span>
              <p className="text-sm sm:text-lg font-bold text-gray-900 font-serif leading-none mt-0.5 truncate dark:text-gray-100">
                ETB {totalSpentVolume.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/70 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 dark:bg-sky-500/10">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Avg Value / Cust
              </span>
              <p className="text-sm sm:text-lg font-bold text-gray-900 font-serif leading-none mt-0.5 truncate dark:text-gray-100">
                ETB {avgSpentPerCustomer.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Bar - Diminished width on mobile */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-[260px] sm:max-w-none sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, phone..."
            className="w-full pl-3.5 pr-9 py-2 sm:py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-50 focus:border-pink-600 transition-all shadow-2xs dark:bg-slate-900 dark:border-slate-800"
          />
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap font-medium">
          Showing {filtered.length} of {customers.length}
        </span>
      </div>

      {/* MOBILE CARDS VIEW (Clean, touch-friendly, cards layout on mobile screens) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-pink-600 rounded-full animate-spin mb-2" />
            <div>Loading customers...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100 dark:bg-slate-900 dark:border-slate-800">
            {search ? `No customers match "${search}"` : "No customers found"}
          </div>
        ) : (
          filtered.map((cust) => (
            <div
              key={cust.id || cust.phone}
              className="bg-white rounded-2xl p-4 border border-gray-200/70 shadow-2xs space-y-3 hover:border-pink-200 transition-colors dark:bg-slate-900 dark:border-slate-800"
            >
              {/* Header: Avatar, Name & Joined Date */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 font-bold text-xs flex items-center justify-center shrink-0 border border-pink-100 font-mono">
                    {getInitials(cust.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight dark:text-gray-100">
                      {cust.name}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-mono">
                      Joined {cust.joined}
                    </span>
                  </div>
                </div>

                {/* 1-Tap Call Link */}
                {cust.phone && cust.phone !== "N/A" && (
                  <a
                    href={`tel:${cust.phone}`}
                    className="p-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white transition-colors"
                    title={`Call ${cust.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Stats Footer Pills */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-gray-600 font-mono text-xs dark:text-gray-400">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{cust.phone || "No phone"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300">
                    {cust.orders} order{cust.orders === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-pink-700 font-serif">
                    ETB {Number(cust.totalSpent || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Full data density on tablet and desktop screens) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200/70 shadow-2xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-transparent border-b border-gray-100 text-xs font-semibold text-gray-600 dark:border-slate-800 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-4">Customer</th>
                <th scope="col" className="px-6 py-4">Phone</th>
                <th scope="col" className="px-6 py-4">Orders</th>
                <th scope="col" className="px-6 py-4">Total Spent</th>
                <th scope="col" className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">
                    <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-pink-600 rounded-full animate-spin mb-2" />
                    <div>Loading customers...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">
                    {search ? `No customers found matching "${search}"` : "No customers found"}
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr
                    key={cust.id || cust.phone}
                    className="hover:bg-gray-50/60 transition-colors dark:hover:bg-slate-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 font-bold text-xs flex items-center justify-center shrink-0 border border-pink-100 font-mono">
                          {getInitials(cust.name)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{cust.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs whitespace-nowrap dark:text-gray-400">
                      {cust.phone}
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium dark:text-gray-100">
                      {cust.orders}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 font-serif whitespace-nowrap dark:text-gray-100">
                      ETB {Number(cust.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap font-mono dark:text-gray-400">
                      {cust.joined}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Customers;
