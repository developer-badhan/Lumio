import React, { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";

const ChangePassword = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmNewPassword) {
      return setError("New passwords do not match");
    }

    try {
      setLoading(true);

      const res = await api.patch("/auth/change-password", form);

      setSuccess(res.data?.message);

      setTimeout(() => navigate("/"), 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0b1f] flex items-center justify-center">
      <div className="w-full max-w-md bg-[#151129] rounded-3xl p-10">

        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Change Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="password"
            name="currentPassword"
            placeholder="Current Password"
            value={form.currentPassword}
            onChange={handleChange}
            required
            className="w-full bg-[#1d1736] text-white rounded-xl py-3 px-4"
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={form.newPassword}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full bg-[#1d1736] text-white rounded-xl py-3 px-4"
          />

          <input
            type="password"
            name="confirmNewPassword"
            placeholder="Confirm New Password"
            value={form.confirmNewPassword}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full bg-[#1d1736] text-white rounded-xl py-3 px-4"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-xl"
          >
            {loading ? "Updating..." : "Update Password"}
            <ArrowRight size={18} />
          </button>

        </form>
      </div>
    </div>
  );
};

export default ChangePassword;