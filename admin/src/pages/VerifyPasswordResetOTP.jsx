import React, { useState, useEffect, useContext, useRef } from "react";
import { useSearchParams, Form, useNavigate } from "react-router-dom";
import Axios from "../axios/axios.config.js";
import { toast } from "react-toastify";

function VerifyPasswordResetOTP() {
  const email = localStorage.getItem("email")
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef();
  const navigate = useNavigate();

  // Pre-fill OTP if code is present in query
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) setOtp(code);
  }, [searchParams]);

  const changeHandler = (e) => setOtp(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      const payload = { email, otp };
      const { data } = await Axios.post("/api/user/verify-password-otp", payload);
      if (data.success) {
        formRef.current.reset();
        setOtp("");
        toast.success(data.message);
        setTimeout(() => navigate("/password-reset"), 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendHandler = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const { data } = await Axios.post("/api/user/resend-password-otp", { email });
      if (data.success) {
        formRef.current.reset();
        setOtp("");
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Resend OTP failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="em-brand-glow min-h-dvh flex items-center justify-center bg-[#f4f3f0] dark:bg-[#0c0b0a] px-4 py-10 sm:px-6">
      <Form
        ref={formRef}
        onSubmit={handleSubmit}
        method="post"
        className="em-card w-full max-w-md p-7 sm:p-10 shadow-xl space-y-6 animate-em-rise"
      >
        {/* Brand */}
        <div className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="DS Style"
            className="h-14 w-14 rounded-2xl object-contain em-keep-light bg-white p-1 ring-1 ring-pink-600/25 shadow-[0_10px_24px_-10px_rgba(var(--brand-primary-rgb),0.55)]"
          />
          <span className="em-eyebrow mt-4">DS Style Admin</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-gray-900 dark:text-gray-100">
          Verify Your OTP
        </h2>
        <p className="text-sm sm:text-[15px] text-gray-500 text-center dark:text-gray-400">
          Enter the OTP sent to <span className="font-semibold text-gray-800 dark:text-gray-100">{email}</span>
        </p>

        <input
          type="text"
          name="otp"
          value={otp}
          onChange={changeHandler}
          placeholder="Enter OTP"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="em-input h-14 text-center text-xl font-semibold tracking-[0.4em] tabular-nums placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
        />

        <input type="hidden" name="email" value={email} />

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="em-btn em-btn-primary w-full h-12 text-[15px]"
          >
            Submit OTP
          </button>

          <button
            type="button"
            onClick={resendHandler}
            disabled={loading}
            className="em-btn em-btn-soft w-full h-12 text-[15px]"
          >
            Resend OTP
          </button>
        </div>

        <p className="text-xs sm:text-sm text-gray-400 text-center">
          Didn't receive the OTP? Click resend to get a new one.
        </p>
      </Form>
    </div>
  );
}
export default VerifyPasswordResetOTP;
