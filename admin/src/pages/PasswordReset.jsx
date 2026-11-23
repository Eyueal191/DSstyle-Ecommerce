import React, { useState, useRef } from "react";
import { Form, Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Axios from "../axios/axios.config";
import { toast } from "react-toastify";

function PasswordReset() {
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isCPasswordShown, setIsCPasswordShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      const formData = new FormData(e.target);
      const email = formData.get("email");
      const password = formData.get("password");
      const cpassword = formData.get("cpassword");

      if (password.toLowerCase() !== cpassword.toLowerCase()) {
        toast.error("Password and confirm password must match");
        return;
      }

      const payLoad = { email, password };
      const response = await Axios.post("/api/user/reset-password", payLoad);

      if (response.data.success) {
        formRef.current.reset();
        toast.success(response.data.message);
        setTimeout(() => navigate("/login"), 1000);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="em-brand-glow min-h-dvh flex items-center justify-center bg-[#f4f3f0] dark:bg-[#0c0b0a] px-4 py-10 sm:px-6">
      <div className="em-card w-full max-w-md p-7 sm:p-10 shadow-xl space-y-6 animate-em-rise">
        {/* Brand */}
        <div className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="DS Style"
            className="h-14 w-14 rounded-2xl object-contain em-keep-light bg-white p-1 ring-1 ring-pink-600/25 shadow-[0_10px_24px_-10px_rgba(var(--brand-primary-rgb),0.55)]"
          />
          <span className="em-eyebrow mt-4">DS Style Admin</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 text-center dark:text-gray-100">
          Reset Your Password
        </h2>

        {/* Form */}
        <Form method="post" ref={formRef} className="flex flex-col gap-5" onSubmit={submitHandler}>
          <label className="em-label !mb-0 flex flex-col">
            Email
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              autoComplete="email"
              className="em-input mt-1.5 font-normal"
              required
            />
          </label>

          <label className="em-label !mb-0 flex flex-col relative">
            New Password
            <input
              type={isPasswordShown ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              autoComplete="new-password"
              className="em-input mt-1.5 pr-12 font-normal"
              required
            />
            <button
              type="button"
              aria-label={isPasswordShown ? "Hide password" : "Show password"}
              className="absolute bottom-0.5 right-1.5 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:hover:bg-slate-800"
              onClick={() => setIsPasswordShown((prev) => !prev)}
            >
              {isPasswordShown ? <FaEyeSlash /> : <FaEye />}
            </button>
          </label>

          <label className="em-label !mb-0 flex flex-col relative">
            Confirm Password
            <input
              type={isCPasswordShown ? "text" : "password"}
              name="cpassword"
              placeholder="Confirm your password"
              autoComplete="new-password"
              className="em-input mt-1.5 pr-12 font-normal"
              required
            />
            <button
              type="button"
              aria-label={isCPasswordShown ? "Hide password" : "Show password"}
              className="absolute bottom-0.5 right-1.5 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:hover:bg-slate-800"
              onClick={() => setIsCPasswordShown((prev) => !prev)}
            >
              {isCPasswordShown ? <FaEyeSlash /> : <FaEye />}
            </button>
          </label>

          <button
            type="submit"
            className="em-btn em-btn-primary w-full h-12 mt-1 text-[15px]"
          >
            Reset
          </button>

          <p className="text-gray-500 text-sm text-center dark:text-gray-400">
            Remember your password?{" "}
            <Link to="/login" className="text-pink-600 hover:text-pink-700 dark:text-pink-400 font-semibold underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
}
export default PasswordReset;
