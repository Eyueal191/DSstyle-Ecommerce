import React, { useState, useEffect } from "react";
import Title from "../components/Title.jsx";
import { CONTACT_CONFIG, useStoreContact, formatPhoneForCall } from "../config/contactConfig.js";
import { MapPin, Phone, Check, Copy, ExternalLink, Navigation } from "lucide-react";
import toast from "react-hot-toast";
import { updateSEO } from "../utility/seo.js";

function Contact() {
  useEffect(() => {
    updateSEO({
      title: "Contact & Shop Location | DS Style Addis Ababa",
      description: "Visit DS Style at Golagole 22, Addis Ababa, call 0918 10 10 22 or message @DSstyle2 on Telegram to order sneakers, outfits and accessories with delivery across Addis.",
    });
  }, []);
  const [copiedKey, setCopiedKey] = useState(null);
  const storeContact = useStoreContact();
  const phone = storeContact.phone;
  const phoneCall = storeContact.phoneCall;
  const building = storeContact.building;
  const cityArea = storeContact.cityArea;
  const googleMapEmbedUrl = storeContact.googleMapEmbedUrl;
  const googleMapLink =
    storeContact.googleMapLink || CONTACT_CONFIG.googleMapLink;

  const handleCopy = (text, key, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`, {
      id: "contact-copy-toast",
      duration: 1800,
      icon: "📋",
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#f4f3f0] dark:bg-[#0c0b0a] py-4 sm:py-8 md:py-12 px-2.5 sm:px-4 md:px-6 flex flex-col items-center">
      {/* Editorial Header */}
      <section className="w-full max-w-5xl mx-auto mb-4 sm:mb-6 md:mb-8 text-left">
        <Title
          text1="Contact"
          text2="Us"
          text1Color="text-gray-900 dark:text-white"
          text2Color="text-pink-600"
          addSolidLineAfter={true}
          lineColor="bg-pink-600"
        />
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
          Drop by our shop at {building}, call us, or message {CONTACT_CONFIG.telegramOrderHandle} on Telegram. We deliver across Addis Ababa.
        </p>
      </section>

      {/* Main Luxury Architectural Card */}
      <section className="w-full max-w-5xl bg-white dark:bg-[#12110f] rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-slate-800 shadow-sm dark:shadow-black/30 overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        {/* Store Info: Order 1 on mobile, Order 2 on desktop */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 lg:p-10 order-1 md:order-2 flex flex-col justify-center space-y-4 bg-white dark:bg-[#12110f]">
          {/* Store Heading */}
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {CONTACT_CONFIG.sectionTitle1} {CONTACT_CONFIG.sectionTitle2}
          </h2>

          {/* Responsive Info List (Location & Phone Hotline only) */}
          <div className="space-y-3.5 pt-1">
            {/* Location Row */}
            <div className="group p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-50/90 dark:bg-[#1c1a16] hover:bg-pink-50/30 dark:hover:bg-pink-950/20 border border-gray-200/70 dark:border-slate-700/60 hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-200 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-pink-100/70 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 block mb-0.5">
                      Physical Store Address
                    </span>
                    <p className="text-xs sm:text-sm md:text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                      {building}
                    </p>
                    <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                      {CONTACT_CONFIG.amharicAddress}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      {cityArea}, Addis Ababa, Ethiopia
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(storeContact.fullAddress, "address", "Address")
                  }
                  title="Copy address"
                  className="p-1.5 sm:p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all shadow-2xs shrink-0 cursor-pointer"
                >
                  {copiedKey === "address" ? (
                    <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>

              {/* Direct Open in Google Maps Link Button */}
              <div className="pt-2 border-t border-gray-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <a
                  href={googleMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Navigation size={13} className="shrink-0" />
                  <span>Open in Google Maps</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>

                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  Addis Ababa
                </span>
              </div>
            </div>

            {/* Phone Hotline Row */}
            <div className="group p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-50/90 dark:bg-[#1c1a16] hover:bg-pink-50/30 dark:hover:bg-pink-950/20 border border-gray-200/70 dark:border-slate-700/60 hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-200 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 block mb-0.5">
                    Call Us / Hotline
                  </span>
                  <a
                    href={`tel:${phoneCall}`}
                    className="text-xs sm:text-sm md:text-base font-extrabold text-gray-900 dark:text-white hover:text-pink-600 transition block leading-tight font-mono"
                  >
                    {phone}
                  </a>
                  <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium block">
                    Also:{" "}
                    {CONTACT_CONFIG.otherPhones.map((p, i) => (
                      <a
                        key={p}
                        href={`tel:${formatPhoneForCall(p)}`}
                        className="font-semibold text-gray-700 dark:text-gray-200 hover:text-pink-600"
                      >
                        {i > 0 ? " · " : ""}
                        {p}
                      </a>
                    ))}
                  </span>
                  <a
                    href={`https://t.me/${CONTACT_CONFIG.telegramOrderHandle.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] sm:text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    Order on Telegram: {CONTACT_CONFIG.telegramOrderHandle}
                  </a>
                  <a
                    href={storeContact.supportLink || CONTACT_CONFIG.supportLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] sm:text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    Customer support: {CONTACT_CONFIG.supportHandle}
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(phone, "phone", "Phone number")
                }
                title="Copy phone"
                className="p-1.5 sm:p-2 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                {copiedKey === "phone" ? (
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Architecturally Framed Map: Order 2 on mobile, Order 1 on desktop */}
        <div className="w-full md:w-1/2 p-2.5 sm:p-4 lg:p-5 order-2 md:order-1 flex flex-col justify-center bg-gray-50/70 dark:bg-[#100f0d] border-t md:border-t-0 md:border-r border-gray-100 dark:border-slate-800">
          <div
            className="relative w-full h-[280px] sm:h-[340px] md:h-full md:min-h-[380px] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200/90 dark:border-slate-700 shadow-2xs bg-gray-100 dark:bg-slate-800"
            style={{ isolation: "isolate" }}
          >
            {/* Top Overlay Bar: Location Beacon + Direct "Open Map" Button (High-Z-Index) */}
            <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between gap-2 pointer-events-none">
              <a
                href={googleMapLink}
                target="_blank"
                rel="noopener noreferrer"
                title="View location on Google Maps"
                className="pointer-events-auto bg-black/85 dark:bg-[#0c0b0a]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105 group"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                </span>
                <span className="text-[11px] font-bold text-white group-hover:text-pink-400 transition-colors">
                  {building}
                </span>
              </a>

              <a
                href={googleMapLink}
                target="_blank"
                rel="noopener noreferrer"
                title="Open directly in Google Maps"
                className="pointer-events-auto inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95 cursor-pointer border border-pink-400/40"
              >
                <Navigation size={13} className="shrink-0" />
                <span>Open Map</span>
                <ExternalLink size={12} className="shrink-0" />
              </a>
            </div>

            <iframe
              title={`DS Style Location - ${building}`}
              src={googleMapEmbedUrl}
              className="w-full h-full border-0 relative z-10"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Dedicated High-Contrast Action Bar under Map (100% visible in dark & bright mode) */}
          <div className="mt-3 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-300">
              <MapPin size={14} className="text-pink-600 dark:text-pink-400 shrink-0" />
              <span className="font-semibold truncate text-[11px] sm:text-xs">
                {storeContact.fullAddress}
              </span>
            </div>
            <a
              href={googleMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <span>Open in Google Maps</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
