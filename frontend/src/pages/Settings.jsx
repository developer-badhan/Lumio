import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  User,
  Bell,
  Lock,
  Shield,
  LogOut,
  Save,
} from "lucide-react";

import Avatar from "../components/ui/Avatar.jsx";

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm] = useState({
    name: "Alex Rivera",
    email: "alex@email.com",
    bio: "Frontend Developer • AI Enthusiast 🚀",
    notifications: true,
    sounds: true,
    twoFactor: false,
  });

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    setSidebarOpen(!mql.matches);
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "account", label: "Account", icon: Lock },
  ];

  return (
    <div className="h-screen w-screen flex bg-[#0f0b1f] text-white relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-900/10 via-black to-purple-800/10 animate-pulse opacity-40" />

      {/* Sidebar */}
      <aside
        className={`bg-[#151129] border-r border-purple-500/10 transition-all duration-300 z-30
        ${sidebarOpen ? "w-80" : "w-0 lg:w-80 overflow-hidden"}`}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="px-5 py-5 border-b border-purple-500/10 flex items-center justify-between">

            {/* Left Side: Icon + Title */}
            <div className="flex items-center gap-3">

              {/* Logo Circle */}
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
                  <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
                </svg>
              </div>

              <h2 className="font-bold text-xl tracking-wide">
                Settings
              </h2>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-purple-700/10 rounded-lg transition"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex-1 p-3 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition
                  ${
                    activeTab === tab.id
                      ? "bg-purple-700/20 border border-purple-500/20"
                      : "hover:bg-purple-700/10"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Back Button */}
          <div className="p-4 border-t border-purple-500/10">
            <Link
              to="/"
              className="flex items-center justify-center w-full bg-purple-600 hover:bg-purple-500 transition rounded-xl py-2 font-medium shadow-lg shadow-purple-900/30"
            >
              Back to Chat
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-6 py-10 space-y-8">

          {/* Profile */}
          {activeTab === "profile" && (
            <section className="bg-[#151129] border border-purple-500/10 rounded-3xl p-8 shadow-xl shadow-purple-900/20">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <Avatar name={form.name} size="lg" />
                <div className="flex-1 space-y-4 w-full">

                  <div>
                    <label className="text-xs text-purple-300/60">Full Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="w-full mt-1 bg-[#1d1736] border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition rounded-xl px-4 py-2 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-purple-300/60">Email</label>
                    <input
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full mt-1 bg-[#1d1736] border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition rounded-xl px-4 py-2 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-purple-300/60">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      rows={3}
                      className="w-full mt-1 bg-[#1d1736] border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition rounded-xl px-4 py-2 outline-none resize-none"
                    />
                  </div>

                  <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 transition rounded-xl px-6 py-2 font-medium shadow-lg shadow-purple-900/30">
                    <Save size={16} />
                    Save Changes
                  </button>

                </div>
              </div>
            </section>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <section className="bg-[#151129] border border-purple-500/10 rounded-3xl p-8 shadow-xl shadow-purple-900/20 space-y-6">
              <Toggle
                label="Enable Notifications"
                value={form.notifications}
                onChange={() =>
                  handleChange("notifications", !form.notifications)
                }
              />
              <Toggle
                label="Message Sounds"
                value={form.sounds}
                onChange={() => handleChange("sounds", !form.sounds)}
              />
            </section>
          )}

          {/* Privacy */}
          {activeTab === "privacy" && (
            <section className="bg-[#151129] border border-purple-500/10 rounded-3xl p-8 shadow-xl shadow-purple-900/20 space-y-6">
              <Toggle
                label="Two-Factor Authentication"
                value={form.twoFactor}
                onChange={() =>
                  handleChange("twoFactor", !form.twoFactor)
                }
              />
              <div className="text-sm text-purple-300/60">
                Your messages are end-to-end encrypted and securely stored.
              </div>
            </section>
          )}

          {/* Account */}
          {activeTab === "account" && (
            <section className="bg-[#151129] border border-purple-500/10 rounded-3xl p-8 shadow-xl shadow-purple-900/20 space-y-6">
              <button className="flex items-center gap-2 text-red-400 hover:text-red-300 transition">
                <LogOut size={18} />
                Logout
              </button>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between bg-[#1d1736] border border-purple-500/20 rounded-2xl px-4 py-3">
    <span className="text-sm">{label}</span>
    <button
      onClick={onChange}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
        value ? "bg-purple-600" : "bg-gray-600"
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${
          value ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export default Settings;