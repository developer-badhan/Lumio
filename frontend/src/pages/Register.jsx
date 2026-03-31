import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx"; 
import api from "../services/axios.js";


/** * Register component provides a user interface for new users to create an account. It includes form fields for name, email, password, confirm password, and an optional profile picture upload. The component features validation to ensure that passwords match and meet minimum requirements. It integrates with the backend API to submit registration data and handles responses, including error messages and navigation to the OTP verification page upon successful registration.
 * @returns Register component JSX
 * The component features:
 * - A form with fields for name, email, password, confirm password, and profile picture upload.
 * - Validation to ensure passwords match and meet minimum length requirements.
 * - API integration to submit registration data and handle responses.
 * - Loading state management and user feedback for success or error scenarios.
 * Provides a visually appealing and user-friendly interface for new users to create an account.
 * Note: Ensure that the backend API endpoint `/auth/register` is properly secured and validates all input data to prevent security vulnerabilities. Additionally, consider implementing email verification and rate limiting to protect against abuse of the registration endpoint. The use of FormData allows for seamless handling of file uploads, but ensure that the backend properly validates and sanitizes uploaded files to prevent security risks.
 * The design focuses on a modern and visually appealing layout using Tailwind CSS, ensuring a smooth user experience. The integration with AuthContext allows for managing authentication state effectively across the application, providing a seamless experience for users as they register and proceed to verify their accounts. Overall, the Register component serves as a critical entry point for new users to join the platform securely while providing a polished and user-friendly interface. It emphasizes both functionality and aesthetics, making it an essential part of the application's authentication flow.
 * The component also includes a profile picture upload feature, allowing users to personalize their accounts from the moment they register. The use of Tailwind CSS ensures that the form is responsive and visually appealing, with clear feedback for users during the registration process. The integration with the backend API allows for seamless communication and handling of registration data, ensuring a smooth user experience from start to finish.
 * Overall, the Register component is designed to provide a secure and user-friendly interface for new users to create accounts, with a focus on both functionality and aesthetics. It serves as a critical part of the application's authentication flow, ensuring that users can easily join the platform while maintaining security best practices.
 * Note: Ensure that the backend API endpoint `/auth/register` is properly secured and validates all input data to prevent security vulnerabilities. Additionally, consider implementing email verification and rate limiting to protect against abuse of the registration endpoint. The use of FormData allows for seamless handling of file uploads, but ensure that the backend properly validates and sanitizes uploaded files to prevent security risks.
 * The component also includes a profile picture upload feature, allowing users to personalize their accounts from the moment they register. The use of Tailwind CSS ensures that the form is responsive and visually appealing, with clear feedback for users during the registration process. The integration with the backend API allows for seamless communication and handling of registration data, ensuring a smooth user experience from start to finish.
 * Overall, the Register component is designed to provide a secure and user-friendly interface for new users to create accounts, with a focus on both functionality and aesthetics. It serves as a critical part of the application's authentication flow, ensuring that users can easily join the platform while maintaining security best practices.
 */


const Register = () => {
  const navigate = useNavigate();
  const { setPreVerifyToken } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePic: null,
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "profilePic") {
      const file = files[0];
      if (file) {
        setForm({ ...form, profilePic: file });
        setPreview(URL.createObjectURL(file));
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("password", form.password);
      data.append("confirmPassword", form.confirmPassword);

      if (form.profilePic) {
        data.append("profilePic", form.profilePic);
      }

      const res = await api.post("/auth/register", data);

      if (res.data?.verifyToken) {
        setPreVerifyToken(res.data.verifyToken);
      }

      navigate("/verify-otp");

    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0b1f] flex items-center justify-center relative overflow-hidden">

      {/* Background Glow (OLD UI PRESERVED) */}
      <div className="absolute w-150 h-150 bg-purple-600/20 rounded-full blur-[140px] -top-50 -left-37.5" />
      <div className="absolute w-125 h-125 bg-purple-500/10 rounded-full blur-[140px] -bottom-37.5 -right-25" />

      <div className="w-full max-w-md bg-[#151129] border border-purple-500/10 shadow-2xl shadow-purple-900/30 rounded-3xl p-10 relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6 relative">

            {/* Profile Preview Circle */}
            <label className="relative cursor-pointer group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-purple-600 shadow-lg shadow-purple-900/40">

                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-700 flex items-center justify-center">
                    <User size={40} className="text-white" />
                  </div>
                )}
              </div>

              {/* Camera Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Camera className="text-white" size={22} />
              </div>

              <input
                type="file"
                name="profilePic"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Join Lumio
          </h1>
          <p className="text-purple-300/70 mt-2 text-sm">
            Create your account to start chatting
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-purple-400" size={18} />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full bg-[#1d1736] text-white placeholder-purple-300/50 border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition-all rounded-xl py-3 pl-10 pr-4 outline-none"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-purple-400" size={18} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-[#1d1736] text-white placeholder-purple-300/50 border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition-all rounded-xl py-3 pl-10 pr-4 outline-none"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-purple-400" size={18} />
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full bg-[#1d1736] text-white placeholder-purple-300/50 border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition-all rounded-xl py-3 pl-10 pr-4 outline-none"
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-purple-400" size={18} />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full bg-[#1d1736] text-white placeholder-purple-300/50 border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition-all rounded-xl py-3 pl-10 pr-4 outline-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98] transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40"
          >
            {loading ? "Creating Account..." : "Create Account"}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer (OLD UI PRESERVED) */}
        <div className="mt-6 text-center text-sm text-purple-300/60">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Login
          </a>
        </div>

      </div>
    </div>
  );
};

export default Register;