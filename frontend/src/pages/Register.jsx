import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";

const Register = () => {
  const navigate = useNavigate();

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
        sessionStorage.setItem("verifyToken", res.data.verifyToken);
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