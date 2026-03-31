import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../services/axios";
import { useAuth } from "../context/AuthContext";


/**
 * VerifyOTP component provides a user interface for users to verify their accounts using a One-Time Password (OTP) sent to their email. It includes form fields for entering the OTP, validation, error handling, and integration with the backend API to perform the verification process. The component also features a countdown timer for resending the OTP and manages authentication state using AuthContext. The design focuses on a modern and visually appealing layout using Tailwind CSS, ensuring a smooth user experience.
 * @returns VerifyOTP component JSX
 * The component features:
 * - A form with fields for entering the 6-digit OTP, including input validation and user feedback.
 * - Integration with the backend API to submit the OTP for verification and handle responses.
 * - A countdown timer for resending the OTP, with appropriate handling for expired tokens and error scenarios.
 * - Navigation to the login page upon successful verification and to the registration page if the verification token is invalid or expired.
 * - A visually appealing design with a focus on user experience and accessibility, utilizing Tailwind CSS for styling.
 * Note: Ensure that the backend API endpoints `/auth/verify-otp` and `/auth/otp-resend` are properly secured and implement necessary security measures such as rate limiting and token expiration to protect against brute-force attacks. Additionally, consider implementing multi-factor authentication for enhanced security. The component also includes error handling for scenarios where the OTP is incorrect or the verification token has expired, providing clear feedback to the user and guiding them through the appropriate next steps.
 * Overall, the VerifyOTP component serves as a critical part of the account verification process, providing users with a secure and user-friendly interface to confirm their email addresses and access their accounts. It emphasizes both functionality and aesthetics, making it an essential component in the application's authentication flow.
 * Notes:
 * - The OTP is expected to be a 6-digit numeric code.
 * - The component relies on a `verifyToken` stored in localStorage, which should be set during the registration or login process when an unverified account is detected. This token is used to authenticate the OTP verification request and should have a limited lifespan (e.g., 10 minutes).
 * - The resend functionality allows users to request a new OTP if they did not receive the original one, but it also requires a valid `verifyToken` to prevent abuse. If the token has expired, users are prompted to start the registration process again.
 * - The component includes user feedback for various states, such as loading, success, and error messages, to enhance the user experience and provide clear guidance throughout the verification process.
 */


// OTP length
const OTP_LENGTH = 6;

const VerifyOTP = () => {
  const navigate = useNavigate();
  const { setPreVerifyToken } = useAuth();

  // verifyToken kept as state so handleVerify always reads the latest value
  const [verifyToken, setVerifyToken] = useState(
    () => localStorage.getItem("verifyToken")
  );

  const [otp, setOtp]             = useState(new Array(OTP_LENGTH).fill(""));
  const inputRefs                  = useRef([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [info, setInfo]           = useState("");
  const [countdown, setCountdown] = useState(30);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (e, idx) => {
    const val = e.target.value.trim();
    if (!/^\d?$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);

    if (val && inputRefs.current[idx + 1]) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && inputRefs.current[idx - 1]) {
      inputRefs.current[idx - 1].focus();
    }
    if (e.key === "ArrowLeft"  && inputRefs.current[idx - 1]) inputRefs.current[idx - 1].focus();
    if (e.key === "ArrowRight" && inputRefs.current[idx + 1]) inputRefs.current[idx + 1].focus();
  };

  // Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const enteredOtp = otp.join("");
    if (enteredOtp.length !== OTP_LENGTH) {
      return setError("Please enter the 6-digit code.");
    }

    try {
      setLoading(true);

      // axios interceptor auto-attaches verifyToken from localStorage as Bearer header
      const res = await api.post("/auth/verify-otp", { otp: enteredOtp });

      setInfo(res.data?.message || "Account verified successfully!");

      // Consume the verifyToken — it's single-use
      localStorage.removeItem("verifyToken");

      setTimeout(() => navigate("/login"), 1400);

    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");

      if (err.response?.status === 401) {
        localStorage.removeItem("verifyToken");
        setTimeout(() => navigate("/register"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError("");
    setInfo("");

    try {
      setLoading(true);

      // axios interceptor auto-attaches current verifyToken from localStorage
      const res = await api.post("/auth/otp-resend", {});

      if (res.data?.verifyToken) {
        // Backend issued a fresh verifyToken (new 10m window)
        setPreVerifyToken(res.data.verifyToken); // → localStorage
        setVerifyToken(res.data.verifyToken);    // → React state
      }

      setInfo(res.data?.message || "OTP resent successfully.");
      setCountdown(30);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");

      if (err.response?.status === 401) {
        // verifyToken expired — can't resend without a valid session
        localStorage.removeItem("verifyToken");
        setTimeout(() => navigate("/register"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0b1f] flex items-center justify-center relative overflow-hidden p-4">

      {/* Background Glow (UI PRESERVED) */}
      <div className="absolute w-150 h-150 bg-purple-600/20 rounded-full blur-[140px] -top-50 -left-37.5" />
      <div className="absolute w-125 h-125 bg-purple-500/10 rounded-full blur-[140px] -bottom-37.5 -right-25" />

      <div className="w-full max-w-md bg-[#151129] border border-purple-500/8 shadow-2xl shadow-purple-900/30 rounded-3xl p-8 relative z-10">

        <div className="text-center mb-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-900/40">
              <svg viewBox="0 0 24 24" className="w-11 h-11" fill="white">
                <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z"/>
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">Verify your account</h2>
          <p className="text-purple-300/70 mt-2 text-sm">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3 mb-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-semibold bg-[#1d1736] border border-purple-500/20 rounded-xl text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {info  && <p className="text-green-400 text-sm text-center">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 active:scale-[0.98] transition-all"
          >
            {loading ? "Verifying..." : "Verify Account"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-purple-300/70">
          Didn't receive the code?{" "}
          {countdown > 0 ? (
            <span className="font-medium text-purple-400/60">
              Resend in {countdown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="font-semibold text-purple-300 hover:text-purple-200"
            >
              Click to resend
            </button>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-purple-300/60">
          <button
            onClick={() => {
              localStorage.removeItem("verifyToken");
              navigate("/register");
            }}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Start over / Register again
          </button>
        </div>

      </div>
    </div>
  );
};

export default VerifyOTP;