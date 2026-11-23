import React, { useRef, useState } from "react";
import { Form, useNavigate } from "react-router-dom";
import Axios from "../axios/axios.config";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";

function ForgotPassword() {
  const navigate = useNavigate();
  const formRef = useRef();
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email");

    if (loading) return;
    try {
      setLoading(true);
      const response = await Axios.post("/api/user/forgot-password", { email });
      const data = response.data;

      if (data.success) {
        toast.success(data.message);
        localStorage.setItem("email", email)
        formRef.current.reset();
        setTimeout(() => {
          navigate(`/verify-password-otp?code=${data.code}`);
        }, 2000);
      } else {
        throw new Error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed");
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-gray-900 mb-2 leading-tight dark:text-gray-100">
          Reset Your Password
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-sm sm:text-[15px] text-center mb-8 leading-relaxed dark:text-gray-400">
          Enter your registered email address and we’ll send you a link to reset your password.
        </p>

        {/* Form */}
        <Form
          ref={formRef}
          onSubmit={submitHandler}
          className="space-y-5"
          method="post"
        >
          <div>
            <label
              htmlFor="email"
              className="em-label"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="em-input pl-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`em-btn em-btn-primary w-full h-12 text-[15px] ${loading ? "opacity-70" : ""}`}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </Form>
      </div>
    </div>
  );
}

export default ForgotPassword;
