import React from "react";

const EmptyState = () => {
  return (
    <div className="flex-1 min-h-full bg-[#0f0b1f] flex items-center justify-center relative overflow-hidden border-l border-purple-500/10">

      {/* Background Glow (same as Login) */}
      <div className="absolute w-150 h-150 bg-purple-600/20 rounded-full blur-[140px] -top-50 -left-37.5" />
      <div className="absolute w-125 h-125 bg-purple-500/10 rounded-full blur-[140px] -bottom-37.5 -right-25" />

      <div className="relative z-10 flex flex-col items-center text-center bg-[#151129] border border-purple-500/10 shadow-2xl shadow-purple-900/30 rounded-3xl px-10 py-12">

        {/* Icon */}
        <div className="w-20 h-20 mb-6 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-900/40">
          <svg viewBox="0 0 24 24" className="w-11 h-11" fill="white">
            <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Lumio Web
        </h2>

        {/* Subtitle */}
        <p className="text-purple-300/70 mt-3 max-w-sm text-sm">
          Send and receive messages seamlessly. Select a conversation from the
          sidebar or start a new AI/Private chat.
        </p>

        {/* Encryption Status */}
        <div className="mt-8 px-4 py-2 bg-[#1d1736] border border-purple-500/20 rounded-full text-xs text-purple-300/70 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          End-to-end encrypted connection
        </div>

      </div>
    </div>
  );
};

export default EmptyState;