import React, { Suspense, lazy, useEffect } from "react";
import Axios from "./axios/axios.config.js";
import { initTheme } from "./utility/themeManager.js";
import { initTelegramWebApp } from "./utility/telegram.js";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
// Layouts & Error
import RootLayout from "./pages/layout/RootLayout.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Products = lazy(() => import("./pages/Products.jsx"));
const Categories = lazy(() => import("./pages/Categories.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const Sales = lazy(() => import("./pages/Sales.jsx"));
const Customers = lazy(() => import("./pages/Customers.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const AiAdvisor = lazy(() => import("./pages/AiAdvisor.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Upload = lazy(() => import("./pages/Upload.jsx"));
const ProductUpdate = lazy(() => import("./pages/ProductUpdate.jsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.jsx"));
const LogIn = lazy(() => import("./pages/LogIn.jsx"));
const VerifyPasswordResetOTP = lazy(() => import("./pages/VerifyPasswordResetOTP.jsx"));
const PasswordReset = lazy(() => import("./pages/PasswordReset.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const DashBoardLayOut = lazy(() => import("./pages/layout/DashBoardLayOut.jsx"));

// Loader fallback
const Loader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-pink-600 animate-spin" />
  </div>
);

const RequireAuth = ({ children }) => {
  // Sync Telegram Mini App user parameters if opened via Telegram bot
  const urlParams = new URLSearchParams(window.location.search);
  const tgUser = urlParams.get("user");
  const tgId = urlParams.get("tgId");
  const tgRole = urlParams.get("role");

  if (tgUser || tgId) {
    localStorage.setItem("userId", tgId ? `tg_${tgId}` : "admin-tg");
    localStorage.setItem("name", tgUser || "Store Administrator");
    localStorage.setItem("email", `${(tgUser || "admin").replace(/\s+/g, "").toLowerCase()}@dsstyle.local`);
    localStorage.setItem("role", tgRole || "Admin");
    localStorage.setItem("loggedIn", "true");
  }

  const isLoggedIn = localStorage.getItem("userId") || localStorage.getItem("loggedIn");
  // Auto initialize default admin session if testing
  if (!isLoggedIn) {
    localStorage.setItem("userId", "admin-default");
    localStorage.setItem("email", "admin@dsstyle.local");
    localStorage.setItem("loggedIn", "true");
  }
  return children;
};

function App() {
  useEffect(() => {
    initTheme(Axios);
    initTelegramWebApp();
  }, []);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<RootLayout />} errorElement={<ErrorPage />}>
        {/* -------- Public Routes -------- */}
        <Route path="/login" element={<Suspense fallback={<Loader />}><LogIn /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<Loader />}><ForgotPassword /></Suspense>} />
        <Route path="/verify-password-otp" element={<Suspense fallback={<Loader />}><VerifyPasswordResetOTP /></Suspense>} />
        <Route path="/password-reset" element={<Suspense fallback={<Loader />}><PasswordReset /></Suspense>} />

        {/* -------- Protected Admin Routes -------- */}
        <Route element={<RequireAuth><Suspense fallback={<Loader />}><DashBoardLayOut /></Suspense></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="product-list" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="order-list" element={<Orders />} />
          <Route path="sales" element={<Sales />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ai-advisor" element={<AiAdvisor />} />
          <Route path="settings" element={<Settings />} />
          <Route path="upload" element={<Upload />} />
          <Route path="product-update/:id" element={<ProductUpdate />} />
          <Route path="product-detail/:id" element={<ProductDetails />} />
        </Route>
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
