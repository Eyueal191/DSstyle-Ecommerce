import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import MobileBottomNav from "../../components/MobileBottomNav.jsx";
import TelegramChatWidget from "../../components/TelegramChatWidget.jsx";
import TelegramWelcomeSplash from "../../components/TelegramWelcomeSplash.jsx";
import { Toaster } from "react-hot-toast";

const RootLayout = () => {
  const location = useLocation();

  // Scroll window to top on every route transition
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [location.pathname]);
  return (
    <div className="w-full min-h-screen flex flex-col overflow-x-clip bg-[#f4f3f0] dark:bg-[#0c0b0a] text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Telegram Welcome Loading Screen for Mini App Users */}
      <TelegramWelcomeSplash />

      {/* Header (Clean, mobile-optimized without clunky hamburger) */}
      <Header />

      {/* Main Content */}
      <main className="em-page flex-1 w-full">
        <Outlet />
      </main>

      {/* Standard Desktop / Tablet Footer */}
      <Footer />

      {/* App-like Fixed Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Floating Telegram Chat Seller Widget & Panel */}
      <TelegramChatWidget />

      <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{ top: "calc(16px + env(safe-area-inset-top, 0px))" }}
        toastOptions={{
          className: "em-toast",
          success: { iconTheme: { primary: "#10b981", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#e11d48", secondary: "#ffffff" } },
        }}
      />
    </div>
  );
};

export default RootLayout;
