import React from "react";
import { useLocation, Link } from "react-router-dom";
import { FaInstagram, FaTiktok, FaTelegramPlane, FaFacebookF } from "react-icons/fa";
import { Palette } from "lucide-react";
import { CONTACT_CONFIG } from "../config/contactConfig.js";

function Footer() {
  const { telegramLink, tiktokLink, instagramLink, facebookLink } = CONTACT_CONFIG;
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Completely hide footer on all pages except the Home page
  if (!isHomePage) {
    return null;
  }

  return (
    <footer className="w-full bg-[#fafaf8] dark:bg-slate-950 border-t border-gray-200/80 dark:border-white/[0.06] pt-8 pb-[calc(6rem+var(--em-safe-bottom))] lg:pb-10 px-4">
      <div className="max-w-md mx-auto flex flex-col items-center">
        {/* Follow Us & Community Header */}
        <div className="flex items-center gap-3 w-full justify-center mb-3.5">
          <span className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-gray-300 dark:to-white/15" />
          <span className="em-eyebrow text-gray-500 dark:text-gray-400">
            Follow Us & Community
          </span>
          <span className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-gray-300 dark:to-white/15" />
        </div>

        {/* Social Icons (Telegram, Instagram, TikTok, Facebook) */}
        <div className="flex items-center justify-center gap-3.5 sm:gap-4 my-1.5">
          {/* Telegram */}
          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="w-11 h-11 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <FaTelegramPlane size={20} className="-translate-x-0.5" />
          </a>

          {/* Instagram (hidden until a link is set) */}
          {instagramLink && (
          <a
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <FaInstagram size={20} />
          </a>
          )}

          {/* TikTok */}
          <a
            href={tiktokLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <FaTiktok size={18} />
          </a>

          {/* Facebook (hidden until a link is set) */}
          {facebookLink && (
          <a
            href={facebookLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="w-11 h-11 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <FaFacebookF size={18} />
          </a>
          )}
        </div>

        {/* Theme & Settings Link */}
        <div className="flex items-center gap-3 mt-5 text-xs text-gray-500 dark:text-gray-400">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 hover:text-pink-600 dark:hover:text-pink-300 hover:border-pink-200 dark:hover:border-pink-500/30 transition-colors"
          >
            <Palette size={13} />
            <span>Theme & Appearance</span>
          </Link>
        </div>

        {/* Minimal Copyright */}
        <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 text-center mt-4 tracking-wide">
          © {new Date().getFullYear()} <span className="font-bold text-gray-700 dark:text-gray-300">DS Style</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
