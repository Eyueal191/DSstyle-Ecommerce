import React, { useState, useRef } from "react";
import { Form, Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Axios from "../axios/axios.config.js";
import { toast } from "react-toastify";

function LogIn() {
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const email = formData.get("email")?.trim();
    const password = formData.get("password")?.trim();

    if (!email || !password) {
      toast.error("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);
      const payload = { email, password };
      const { data } = await Axios.post("/api/user/login", payload);

      if (data.success) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("email", data.userEmail);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("loggedIn", true);

        toast.success(data.message || "Logged in successfully!");
        formRef.current.reset();
        navigate("/");
      } else {
        toast.error(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="em-brand-glow min-h-dvh flex items-center justify-center bg-[#f4f3f0] dark:bg-[#0c0b0a] px-4 py-10 sm:px-6">
      <div className="em-card w-full max-w-md p-7 sm:p-10 shadow-xl animate-em-rise">
        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <img
            src="/logo.png"
            alt="DS Style"
            className="h-14 w-14 rounded-2xl object-contain em-keep-light bg-white p-1 ring-1 ring-pink-600/25 shadow-[0_10px_24px_-10px_rgba(var(--brand-primary-rgb),0.55)]"
          />
          <span className="em-eyebrow mt-4">DS Style Admin</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 text-center leading-tight mb-2 dark:text-gray-100">
          Admin Login
        </h1>
        <p className="text-gray-500 text-sm sm:text-[15px] text-center mb-8 leading-relaxed dark:text-gray-400">
          Enter your credentials to access your dashboard.
        </p>

        {/* Form */}
        <Form
          ref={formRef}
          onSubmit={submitHandler}
          className="flex flex-col gap-5"
          method="post"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="em-label"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={import.meta.env.DEV ? import.meta.env.VITE_DEV_LOGIN_EMAIL || "" : ""}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="em-input"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label
              htmlFor="password"
              className="em-label"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type={isPasswordShown ? "text" : "password"}
              defaultValue={import.meta.env.DEV ? import.meta.env.VITE_DEV_LOGIN_PASSWORD || "" : ""}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="em-input pr-12"
            />
            <button
              type="button"
              onClick={() => setIsPasswordShown((prev) => !prev)}
              className="absolute right-1.5 top-[27px] w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:hover:bg-slate-800"
              aria-label={isPasswordShown ? "Hide password" : "Show password"}
            >
              {isPasswordShown ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`em-btn em-btn-primary w-full h-12 mt-1 text-[15px] ${loading ? "opacity-70" : ""}`}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          {/* Forgot Password */}
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default LogIn;
