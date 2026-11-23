import React, { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import Axios from "./axios/axios.config.js";
import { setUserBag } from "./redux/bagSlice.js";
import { initTheme } from "./utility/themeManager.js";
import { initTelegramWebApp } from "./utility/telegram.js";

// Pages
import Home from "./pages/Home.jsx";
import Contact from "./pages/Contact.jsx";
import About from "./pages/About.jsx";
import Shop from "./pages/Shop.jsx";
import Orders from "./pages/Orders.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Bag from "./pages/Bag.jsx";
import PlaceOrder from "./pages/PlaceOrder.jsx";
import Settings from "./pages/Settings.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import RootLayout from "./pages/layouts/RootLayOut.jsx";

function App() {
  const dispatch = useDispatch();

  // Initialize guest ID, theme, Telegram WebApp fullscreen, and fetch shopping bag on mount
  useEffect(() => {
    initTheme(Axios);
    initTelegramWebApp();

    let guestId = localStorage.getItem("userId");
    if (!guestId) {
      guestId = "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("userId", guestId);
    }

    const fetchUserBag = async () => {
      try {
        const response = await Axios.get(`/api/bag/${guestId}`);
        const data = response.data;
        if (data.success) {
          dispatch(setUserBag(data.userBag || data.userCart || { user: guestId, items: [] }));
        }
      } catch {
        // Silent catch for initial empty state
      }
    };

    fetchUserBag();
  }, [dispatch]);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<RootLayout />} errorElement={<ErrorPage />}>
        {/* Open Guest Routes */}
        <Route index element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/products" element={<Navigate to="/shop" replace />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/product-detail/:id" element={<ProductDetail />} />
        <Route path="/bag" element={<Bag />} />
        <Route path="/cart" element={<Navigate to="/bag" replace />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/settings" element={<Settings />} />

        {/* Legacy redirects */}
        <Route path="/login" element={<Navigate to="/shop" replace />} />
        <Route path="/signup" element={<Navigate to="/shop" replace />} />
        <Route path="/account/*" element={<Navigate to="/orders" replace />} />
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
