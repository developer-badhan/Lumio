import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import api from "../services/axios";

const OTP_LENGTH = 6;

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(""); // success/info messages
  const [countdown, setCountdown] = useState(30); // resend cooldown (seconds)

  // Read token from sessionStorage
  const verifyToken = typeof window !== "undefined" ? sessionStorage.getItem("verifyToken") : null;

  useEffect(() => {
    // If no token available, send user back to register
    if (!verifyToken) {
      setError("Verification session missing. Please register or login again.");
      // Optional: navigate("/register")
    }
  }, [verifyToken]);

  // countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (e, idx) => {
    const val = e.target.value.trim();
    if (!/^\d?$/.test(val)) return; // only allow single digit numeric

    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);

    // move forward
    if (val && inputRefs.current[idx + 1]) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && inputRefs.current[idx - 1]) {
      inputRefs.current[idx - 1].focus();
    }
    if (e.key === "ArrowLeft" && inputRefs.current[idx - 1]) {
      inputRefs.current[idx - 1].focus();
    }
    if (e.key === "ArrowRight" && inputRefs.current[idx + 1]) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!verifyToken) {
      setError("Verification session missing. Please register again.");
      return;
    }

    const enteredOtp = otp.join("");
    if (enteredOtp.length !== OTP_LENGTH) {
      setError("Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/auth/verify-otp",
        { otp: enteredOtp },
        {
          headers: {
            Authorization: `Bearer ${verifyToken}`,
          },
        }
      );

      setInfo(res.data?.message || "Account verified successfully!");
      // Clear verify token (no longer needed)
      sessionStorage.removeItem("verifyToken");

      // After small delay navigate to login
      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      const message = err.response?.data?.message || "Verification failed";
      setError(message);

      // If token expired or invalid, suggest register
      if (err.response?.status === 401) {
        // expired/invalid token
        setTimeout(() => {
          sessionStorage.removeItem("verifyToken");
          navigate("/register");
        }, 1600);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");

    if (!verifyToken) {
      setError("Verification session missing. Please register again.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/auth/otp-resend",
        {}, // no body
        {
          headers: {
            Authorization: `Bearer ${verifyToken}`,
          },
        }
      );

      // Update token if backend returned new token
      if (res.data?.verifyToken) {
        sessionStorage.setItem("verifyToken", res.data.verifyToken);
      }

      setInfo(res.data?.message || "OTP resent to your email.");
      setCountdown(30); // reset cooldown
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
      if (err.response?.status === 401) {
        sessionStorage.removeItem("verifyToken");
        setTimeout(() => navigate("/register"), 1400);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0b1f] flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Glow */}
      <div className="absolute w-150 h-150 bg-purple-600/20 rounded-full blur-[140px] -top-50 -left-37.5" />
      <div className="absolute w-125 h-125 bg-purple-500/10 rounded-full blur-[140px] -bottom-37.5 -right-25" />

      <div className="w-full max-w-md bg-[#151129] border border-purple-500/8 shadow-2xl shadow-purple-900/30 rounded-3xl p-8 relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-900/40">
              <svg
                viewBox="0 0 24 24"
                className="w-11 h-11"
                fill="white"
              >
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
          {info && <p className="text-green-400 text-sm text-center">{info}</p>}

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
            <span className="font-medium text-purple-400/60">Resend in {countdown}s</span>
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
              sessionStorage.removeItem("verifyToken");
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