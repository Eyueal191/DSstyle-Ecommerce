import React, { useEffect, useState } from "react";
import Axios from "../axios/axios.config.js";
import logo from "../assets/logo.png";
import { Sparkles, ShieldCheck } from "lucide-react";
import { initTelegramWebApp } from "../utility/telegram.js";

const TelegramWelcomeSplash = () => {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [tgUser, setTgUser] = useState(null);

  useEffect(() => {
    try {
      // 1. Initialize Telegram WebApp fullscreen & viewport
      const tgWebApp = initTelegramWebApp() || window.Telegram?.WebApp;

      // 2. Extract user info from Telegram WebApp SDK or URL search parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlUser = urlParams.get("user");
      const urlTgId = urlParams.get("tgId");
      const urlRole = urlParams.get("role") || "Admin";

      const sdkUser = tgWebApp?.initDataUnsafe?.user;

      let extractedId = sdkUser?.id ? String(sdkUser.id) : urlTgId;
      let extractedName =
        (sdkUser ? [sdkUser.first_name, sdkUser.last_name].filter(Boolean).join(" ") : null) ||
        sdkUser?.username ||
        urlUser;
      let extractedUsername = sdkUser?.username || "";

      if (extractedName || extractedId) {
        const userInfo = {
          name: extractedName || "Store Administrator",
          telegramId: extractedId || "",
          telegramUsername: extractedUsername,
          role: urlRole || "Admin",
        };

        setTgUser(userInfo);
        localStorage.setItem("dsstyle_admin_tg_user", JSON.stringify(userInfo));
        localStorage.setItem("userId", extractedId ? `tg_${extractedId}` : "admin-tg");
        localStorage.setItem("email", `${userInfo.name.replace(/\s+/g, "").toLowerCase()}@dsstyle.local`);
        localStorage.setItem("loggedIn", "true");

        // Check if we already showed welcome splash this session
        const hasWelcomed = sessionStorage.getItem("dsstyle_admin_welcomed");
        if (!hasWelcomed) {
          setVisible(true);
          sessionStorage.setItem("dsstyle_admin_welcomed", "true");

          // Auto fade-out after 1.8 seconds
          const fadeTimer = setTimeout(() => {
            setFading(true);
          }, 1800);

          const closeTimer = setTimeout(() => {
            setVisible(false);
          }, 2300);

          return () => {
            clearTimeout(fadeTimer);
            clearTimeout(closeTimer);
          };
        }
      }
    } catch (e) {
      console.warn("Telegram Admin init warning:", e);
    }
  }, []);

  if (!visible || !tgUser) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#100f0d] text-white transition-opacity duration-500 select-none ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "#100f0d" }}
    >
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm mx-auto">
        {/* DS Style Brand Logo with Accent Color Ring */}
        <div
          className="flex items-center justify-center p-1 rounded-2xl ring-2 transition-all duration-300 bg-[#100f0d] mb-5"
          style={{
            "--tw-ring-color": "var(--brand-primary, #c9a043)",
            boxShadow: "0 0 16px rgba(var(--brand-primary-rgb, 201, 160, 67), 0.4)",
          }}
        >
          <img
            src={logo}
            alt="DS Style Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain"
          />
        </div>

        {/* Clean, Simple Bold Greeting */}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
          <span style={{ color: "var(--brand-primary, #c9a043)" }}>
            {tgUser.name}
          </span>
          <br />
          Welcome to DS Style
        </h1>

        {/* Clean Minimal Progress Bar */}
        <div className="mt-5 w-36 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full w-full rounded-full animate-pulse"
            style={{
              backgroundColor: "var(--brand-primary, #c9a043)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TelegramWelcomeSplash;

