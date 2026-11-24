import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import Axios from "../axios/axios.config.js";
import Title from "../components/Title.jsx";
import { setUserBag } from "../redux/bagSlice.js";
import { useNavigate } from "react-router-dom";
import orderSuccessImg from "../assets/order-success.jpg";
import {
  User,
  Phone,
  MapPin,
  ShoppingBag,
  Bike,
  CheckCircle2,
  Package,
  ArrowRight,
  Sparkles,
  Clock,
  MessageCircle,
  X,
} from "lucide-react";

function PlaceOrder() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("userId", userId);
  }

  const rawBagItems =
    useSelector(
      (state) =>
        state.userBag?.userBag?.items ||
        state.userCart?.userCart?.items ||
        []
    ) || [];

  const userBagItems = rawBagItems.filter(
    (item) => item && (item.product?._id || (typeof item.product === "string" && item.product) || item.product?.name)
  );

  const [hasBeenPlaced, setHasBeenPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

  // Exactly three fields: Name, Phone Number, and Address
  const [customerName, setCustomerName] = useState(
    localStorage.getItem("customerName") || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    localStorage.getItem("customerPhone") || localStorage.getItem("phone") || ""
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    localStorage.getItem("deliveryAddress") || ""
  );

  const clearUserBag = async () => {
    try {
      const { data } = await Axios.delete(`/api/bag/${userId}/clear`);
      if (data.success) {
        dispatch(setUserBag({ user: userId, items: [] }));
      }
      return data;
    } catch {
      return null;
    }
  };

  const confirmOrder = async (e) => {
    if (e) e.preventDefault();

    if (placing) {
      return toast.error("Your order is being processed. Please wait...");
    }

    if (hasBeenPlaced && !showSuccessModal) {
      return toast.error("This order has already been confirmed.");
    }

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress = deliveryAddress.trim();

    if (!cleanName) {
      return toast.error("Please enter your name");
    }

    if (!cleanPhone) {
      return toast.error("Please enter your phone number");
    }

    if (!cleanAddress) {
      return toast.error("Please enter your delivery address in Addis Ababa");
    }

    if (!userBagItems || !userBagItems.length) {
      setHasBeenPlaced(true);
      return toast.error("Your shopping bag is empty.");
    }

    // Persist details for future orders
    localStorage.setItem("customerName", cleanName);
    localStorage.setItem("customerPhone", cleanPhone);
    localStorage.setItem("phone", cleanPhone);
    localStorage.setItem("deliveryAddress", cleanAddress);

    try {
      setPlacing(true);

      const preparedOrderItems = userBagItems
        .filter((item) => item && item.product)
        .map((item) => ({
          product: item.product,
          quantity: Math.max(1, Number(item.quantity) || 1),
          priceAtPurchase: Number(item.product?.price || item.priceAtPurchase || 0),
          paymentMethod: "cod",
          address: cleanAddress,
          status: "processing",
          paymentStatus: "pending",
        }));

      const payload = {
        userId,
        customerName: cleanName,
        customerPhone: cleanPhone,
        deliveryAddress: cleanAddress,
        orderItems: preparedOrderItems,
      };

      const res = await Axios.post(`/api/order/user/${userId}`, payload);
      const data = res.data;

      if (data.success) {
        setHasBeenPlaced(true);

        const shortId = data.orderId
          ? String(data.orderId).slice(-8).toUpperCase()
          : `EM-${Math.floor(100000 + Math.random() * 900000)}`;

        const orderSummary = {
          orderId: shortId,
          rawId: data.orderId,
          customerName: cleanName,
          customerPhone: cleanPhone,
          deliveryAddress: cleanAddress,
          itemsCount: preparedOrderItems.reduce((acc, it) => acc + it.quantity, 0),
          totalPrice: totalPrice,
          items: preparedOrderItems.map((it) => ({
            name: it.product?.name || "DS Style Item",
            quantity: it.quantity,
            price: it.priceAtPurchase,
            image:
              it.product?.images?.[0] ||
              it.product?.imageUrl ||
              "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=80",
          })),
        };

        setPlacedOrderDetails(orderSummary);
        setShowSuccessModal(true);

        // Clear bag in background
        await clearUserBag();
      } else {
        toast.error(data.message || "Failed to confirm order");
      }
    } catch (error) {
      console.error("Order error:", error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || "Failed to confirm order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const totalPrice = (userBagItems || []).reduce(
    (acc, item) => acc + (item.product?.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="min-h-screen bg-[#f4f3f0] dark:bg-[#0c0b0a] py-5 sm:py-12 px-3 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="mb-4 sm:mb-6">
          <Title text1="Order" text2="Form" addSolidLineAfter />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Order Form: 3 Input Fields */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl shadow-xs border border-gray-200/80 dark:border-slate-800">
            <div className="mb-5 pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Delivery Details
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Enter your name, phone number, and delivery address.
              </p>
            </div>

            <form onSubmit={confirmOrder} className="space-y-4">
              {/* Field 1: Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  1. Your Name <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={17} />
                  </div>
                  <input
                    type="text"
                    name="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Abebe Kebede"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-white dark:bg-slate-800 text-gray-800 dark:text-white placeholder:text-gray-400 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Field 2: Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  2. Phone Number <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone size={17} />
                  </div>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0918 10 10 22"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-white dark:bg-slate-800 text-gray-800 dark:text-white placeholder:text-gray-400 text-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  We will call or message you on Telegram to confirm delivery.
                </p>
              </div>

              {/* Field 3: Address Text */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  3. Delivery Address <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 left-3.5 pointer-events-none text-gray-400">
                    <MapPin size={17} />
                  </div>
                  <textarea
                    name="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    placeholder="House/Office number, building name, street, area in Addis Ababa..."
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition bg-white dark:bg-slate-800 text-gray-800 dark:text-white placeholder:text-gray-400 text-sm font-medium resize-none"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Or write "Shop Pickup" if you prefer collecting at our store.
                </p>
              </div>

              {/* Confirm Order Button: on mobile it stays pinned just above the bottom nav while the form is on screen */}
              <div className="sticky lg:static bottom-[var(--em-mobile-nav-h)] z-20 -mx-2 px-2 pt-4 pb-3 lg:mx-0 lg:px-0 lg:pt-3 lg:pb-0 bg-gradient-to-t from-white via-white/95 to-white/0 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/0 lg:bg-none">
                <button
                  type="submit"
                  disabled={placing || userBagItems.length === 0}
                  className="w-full py-4 px-6 rounded-xl font-black text-white bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  {placing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Order...</span>
                    </div>
                  ) : hasBeenPlaced ? (
                    <span>Order Placed!</span>
                  ) : (
                    <span>Confirm Order</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 sm:p-7 rounded-3xl shadow-xs border border-gray-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-pink-600" />
                <span>Your Bag</span>
              </h2>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {userBagItems.length} {userBagItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Bag Item Previews */}
            <div className="divide-y divide-gray-100 dark:divide-slate-800 lg:max-h-56 lg:overflow-y-auto my-3 lg:pr-1">
              {userBagItems.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
                  Your shopping bag is empty.
                </p>
              ) : (
                userBagItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center gap-3">
                    <img
                      src={item.product?.images?.[0] || "/placeholder.png"}
                      alt={item.product?.name || "Product"}
                      className="w-11 h-11 object-cover rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {item.product?.name || "Product"}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Qty: {item.quantity || 1}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {((item.product?.price || 0) * (item.quantity || 1)).toLocaleString()} ETB
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Fee Breakdown: Subtotal + Delivery 50 to 150 birr */}
            <div className="space-y-2 py-3 border-t border-gray-100 dark:border-slate-800 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {totalPrice.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  <Bike size={14} className="text-pink-600" />
                  <span>Delivery Fee</span>
                </span>
                <span className="text-pink-600 font-bold">50 – 150 ETB</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-slate-800 items-baseline">
                <span>Total Fee</span>
                <div className="text-right">
                  <span className="text-pink-600 text-lg">
                    {totalPrice > 0
                      ? `${(totalPrice + 50).toLocaleString()} – ${(totalPrice + 150).toLocaleString()} ETB`
                      : "0 ETB"}
                  </span>
                  <span className="text-[10px] text-gray-400 block font-normal">
                    Paid upon delivery / Telegram confirmation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Luxury Order Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative text-center text-gray-900 dark:text-white animate-in zoom-in-95 duration-200 my-auto max-h-[94vh] flex flex-col overflow-hidden">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/orders");
              }}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-md"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Body */}
            <div className="overflow-y-auto pr-1 space-y-4">
              {/* Order Success Graphic Banner */}
              <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-slate-800 bg-slate-950">
                <img
                  src={orderSuccessImg}
                  alt="DS Style Order Confirmed"
                  width={1254}
                  height={1254}
                  className="block w-full max-h-80 sm:max-h-96 object-contain"
                />
              </div>

              {/* Status Pill & Order Ref */}
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Order Confirmed & Received</span>
                </span>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                  Ref: #{placedOrderDetails?.orderId}
                </span>
              </div>

              {/* Order Highlights Details Card */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Recipient:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {placedOrderDetails?.customerName}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Contact Phone:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {placedOrderDetails?.customerPhone}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Drop-off:</span>
                  <span
                    className="font-medium text-gray-800 dark:text-gray-200 text-right truncate max-w-[240px]"
                    title={placedOrderDetails?.deliveryAddress}
                  >
                    {placedOrderDetails?.deliveryAddress}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Payment Terms:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Cash on Delivery / Telebirr
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200/60 dark:border-slate-700 text-sm">
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    Total Valuation:
                  </span>
                  <span className="font-serif font-black text-pink-600 dark:text-pink-400">
                    {placedOrderDetails?.totalPrice?.toLocaleString()} ETB{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({placedOrderDetails?.itemsCount} items)
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate("/orders");
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Track My Order & Delivery Status</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate("/shop");
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaceOrder;
