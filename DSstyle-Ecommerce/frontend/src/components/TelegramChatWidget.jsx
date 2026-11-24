import React from "react";
import { useLocation } from "react-router-dom";
import { FaTelegramPlane } from "react-icons/fa";
import { useStoreContact, CONTACT_CONFIG } from "../config/contactConfig.js";

function TelegramChatWidget() {
  const { supportLink } = useStoreContact();
  const telegramUrl = supportLink || CONTACT_CONFIG.supportLink;
  const { pathname } = useLocation();
  // Keep checkout actions unobstructed on mobile: hide the bubble on bag / order pages below lg
  const isCheckoutPage = /^\/(bag|place-order)\/?$/.test(pathname);

  return (
    <aside
      aria-label="Telegram Support"
      className={`fixed z-40 bottom-18 sm:bottom-20 lg:bottom-6 right-3 sm:right-6 select-none ${isCheckoutPage ? "hidden lg:block" : ""}`}
    >
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with DS Style support on Telegram"
        title={`Chat with customer support on Telegram (${CONTACT_CONFIG.supportHandle})`}
        className="group flex items-center gap-2 transition-all duration-300"
      >
        {/* Chat Us Text Pill - Crisp dark on light, crisp white on dark */}
        <span className="inline-flex items-center gap-1.5 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-md border border-gray-200/90 dark:border-slate-800 group-hover:border-sky-300 group-hover:text-[#229ED9] dark:group-hover:text-[#229ED9] group-hover:shadow-lg transition-all duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-gray-900 dark:text-white font-semibold">Chat Us</span>
        </span>

        {/* Telegram Floating Icon Button */}
        <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#229ED9] group-hover:bg-[#1b8fc6] text-white flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 active:scale-95 transition-all duration-300 shrink-0">
          <FaTelegramPlane size={20} className="-translate-x-0.5" />
          {/* Active Online Indicator */}
          <span className="absolute top-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-2xs" />
        </div>
      </a>
    </aside>
  );
};

export default TelegramChatWidget;
