import React, { useRef, useState, useEffect } from "react";
import Title from "../components/Title.jsx";
import Axios from "../axios/axios.config.js";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setUserBag } from "../redux/bagSlice.js";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import BagItemCard from "../components/BagItemCard.jsx";
import { ShoppingBag } from "lucide-react";

function Bag() {
  const rawBagItems =
    useSelector(
      (state) =>
        state.userBag?.userBag?.items ||
        state.userCart?.userCart?.items ||
        []
    ) || [];
  const bagItems = rawBagItems.filter(
    (item) => item && (item.product?._id || (typeof item.product === "string" && item.product) || item.product?.name)
  );
  const dispatch = useDispatch();
  const [refetchBag, setRefetchBag] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clearingBag, setClearingBag] = useState(false);
  const navigate = useNavigate();
  const parentRef = useRef(null);
  const userId = localStorage.getItem("userId");

  const getUserBag = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`/api/bag/${userId}`);
      const data = response.data;
      if (data.success) {
        dispatch(setUserBag(data.userBag || data.userCart || { user: userId, items: [] }));
      }
    } catch (error) {
      console.warn("Failed to fetch bag:", error?.message);
    } finally {
      setLoading(false);
    }
  };

  const clearUserBag = async () => {
    try {
      setClearingBag(true);
      const response = await Axios.delete(`/api/bag/${userId}/clear`);
      const data = response.data;
      if (data.success) {
        toast.success(data.message || "Shopping bag cleared");
        getUserBag();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear bag");
    } finally {
      setClearingBag(false);
    }
  };

  const navigateToCheckout = () => {
    if (!bagItems.length) {
      return toast.error("Your shopping bag is empty");
    }
    navigate("/place-order", { state: { totalPrice: total } });
  };

  useEffect(() => {
    if (userId) getUserBag();
  }, [refetchBag, userId]);

  const subtotal = bagItems.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * (item.quantity || 1);
  }, 0);
  const deliveryFee = subtotal > 0 ? 10 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen w-full bg-[#f4f3f0] dark:bg-[#0c0b0a] p-2 sm:p-4 md:p-8 flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 py-4 sm:py-8 md:py-12 max-w-7xl mx-auto">
      {/* Bag Items Container:
          - Mobile: items flow with the page (no nested scroll box), so a swipe anywhere scrolls the page
            and the summary + checkout bar are always reachable.
          - md+: the list scrolls on its own beside the sticky summary.
          - Empty/loading: viewport-based height to center the empty state.
      */}
      <div
        ref={parentRef}
        className={`px-3 sm:px-6 w-full md:w-2/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 py-3 sm:py-6 transition-all ${
          bagItems.length > 0
            ? "h-auto md:max-h-[78vh] md:overflow-y-auto"
            : "h-[50vh] sm:h-[60vh] flex flex-col justify-between overflow-hidden"
        }`}
      >
        <div className="mb-3 sm:mb-5 flex justify-between items-center border-b dark:border-slate-800 pb-3 sm:pb-4">
          <Title
            text1="Shopping"
            text2="Bag"
            text1Color="text-gray-900 dark:text-white"
            text2Color="text-pink-600"
            addSolidLineAfter={true}
            lineColor="bg-pink-600"
          />
          {bagItems.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                {bagItems.length} {bagItems.length === 1 ? "item" : "items"}
              </span>
              <button
                onClick={clearUserBag}
                disabled={clearingBag}
                className="text-xs text-red-500 hover:text-red-700 font-semibold transition cursor-pointer"
              >
                Clear Bag
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center h-48 sm:h-64">
            <Loading />
          </div>
        ) : bagItems.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center py-10 sm:py-16 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-3xl flex items-center justify-center bg-pink-50 dark:bg-pink-500/10 ring-1 ring-pink-600/10 shadow-[0_12px_30px_-12px_rgba(var(--brand-primary-rgb),0.45)]">
              <ShoppingBag className="w-7 h-7 sm:w-9 sm:h-9 text-pink-600 dark:text-pink-400" strokeWidth={1.7} />
            </div>
            <p className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-200">Your shopping bag is empty</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Discover authentic beauty and daily essentials.</p>
            <button
              onClick={() => navigate("/shop")}
              className="em-btn em-btn-primary mt-5 px-6"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 sm:gap-3.5 pb-2">
            {bagItems.map((item, index) => {
              if (!item || !item.product) return null;
              return (
                <BagItemCard
                  key={item.product._id || item._id || index}
                  item={item}
                  setRefetchBag={setRefetchBag}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Bag Summary */}
      <div className="w-full md:w-1/3 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-slate-800 h-fit md:sticky md:top-24">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 pb-2 border-b dark:border-slate-800">
          Order Summary
        </h2>
        <div className="space-y-3 sm:space-y-3.5 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="font-bold text-gray-900 dark:text-white">{subtotal.toLocaleString()} ETB</span>
          </div>
          <div className="flex flex-col gap-1 py-1">
            <div className="flex justify-between items-center">
              <span>Delivery Fee</span>
              <span className="font-bold text-pink-600">50 – 150 ETB</span>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              ⚡ Bike delivery across Addis Ababa calculated by location
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between items-baseline font-bold text-base text-gray-900 dark:text-gray-100">
            <span>Total Fee</span>
            <div className="text-right">
              <span className="text-pink-600 text-base sm:text-lg">
                {subtotal > 0
                  ? `${(subtotal + 50).toLocaleString()} – ${(subtotal + 150).toLocaleString()} ETB`
                  : "0 ETB"}
              </span>
              <span className="text-[10px] text-gray-400 block font-normal">
                Subtotal ({subtotal.toLocaleString()} ETB) + Delivery
              </span>
            </div>
          </div>
        </div>

        {/* Desktop / tablet button (mobile uses the pinned checkout bar below) */}
        <button
          onClick={navigateToCheckout}
          disabled={bagItems.length === 0}
          className="hidden md:block w-full mt-6 py-3.5 bg-pink-600 text-white font-extrabold rounded-xl hover:bg-pink-700 disabled:opacity-50 transition shadow-sm active:scale-95 text-base cursor-pointer"
        >
          Proceed to Order
        </button>
      </div>

      {/* Mobile checkout bar: pinned just above the bottom nav so "Proceed to Order" is always visible */}
      {!loading && bagItems.length > 0 && (
        <div className="md:hidden sticky bottom-[calc(var(--em-mobile-nav-h)+0.5rem)] z-30">
          <div className="flex items-center gap-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.25)] p-2.5 pl-4">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                {bagItems.length} {bagItems.length === 1 ? "item" : "items"} · Subtotal
              </p>
              <p className="text-base font-extrabold text-gray-900 dark:text-white truncate">
                {subtotal.toLocaleString()} ETB
              </p>
            </div>
            <button
              onClick={navigateToCheckout}
              className="shrink-0 px-5 py-3 bg-pink-600 text-white font-extrabold rounded-xl hover:bg-pink-700 active:scale-95 transition shadow-sm text-sm cursor-pointer"
            >
              Proceed to Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bag;
