import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useStoreContact } from "../config/contactConfig.js";

export default function HowToOrderSection() {
  const [isOpen, setIsOpen] = useState(false);
  const { fullAddress } = useStoreContact();

  return (
    <section className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden transition-all duration-300 dark:bg-slate-900 dark:border-slate-800">
        {/* Clickable Header Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-600" />
            <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight dark:text-gray-100">
              How to order
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>{isOpen ? "Close" : "View simple steps"}</span>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform duration-300 ${
                isOpen ? "rotate-180 text-pink-600" : ""
              }`}
            />
          </div>
        </button>

        {/* Calm, Simple Non-Overstyled Article */}
        {isOpen && (
          <div className="px-5 sm:px-8 pb-6 pt-3 border-t border-gray-100 space-y-5 text-gray-700 leading-relaxed dark:border-slate-800 dark:text-gray-300">
            {/* Simple Numbered List */}
            <ol className="space-y-3 text-sm sm:text-base pt-1">
              <li className="flex items-start gap-3">
                <span className="font-bold text-pink-600 shrink-0 select-none">1.</span>
                <span>
                  Tap <strong>“Add to bag”</strong> on a product. It is held for you for 15 minutes.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="font-bold text-pink-600 shrink-0 select-none">2.</span>
                <span>
                  Open the bag, choose pickup or delivery and proceed to order.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="font-bold text-pink-600 shrink-0 select-none">3.</span>
                <span>
                  We confirm on Telegram and send payment details (telebirr, bank transfer, or cash on delivery).
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="font-bold text-pink-600 shrink-0 select-none">4.</span>
                <span>
                  Pick it up at the shop ({fullAddress}) or get it delivered in Addis Ababa.
                </span>
              </li>
            </ol>

            {/* Simple Delivery & Payment Article Note */}
            <div className="pt-4 border-t border-gray-100 text-xs sm:text-sm text-gray-600 space-y-1.5 dark:border-slate-800 dark:text-gray-400">
              <h4 className="font-bold text-gray-900 text-sm dark:text-gray-100">
                Delivery and payment
              </h4>
              <p>
                • <strong>Delivery:</strong> 50 – 150 birr across Addis Ababa (or free shop pickup).
              </p>
              <p>
                • <strong>Payment:</strong> telebirr, bank transfer, or cash on delivery.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
