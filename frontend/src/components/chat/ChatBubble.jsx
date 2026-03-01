import React from "react";
import { Check, CheckCheck, Clock } from "lucide-react";

const ChatBubble = ({
  message,
  isMe,
  timestamp,
  status = "sent",
  avatar,
  username,
}) => {
  const renderStatusIcon = () => {
    if (!isMe) return null;

    switch (status) {
      case "sending":
        return <Clock size={12} className="text-purple-300 animate-pulse" />;
      case "sent":
        return <Check size={12} className="text-purple-300" />;
      case "delivered":
        return <CheckCheck size={12} className="text-purple-300" />;
      case "read":
        // keep blue only for read tick (as requested)
        return <CheckCheck size={12} className="text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex w-full mb-4 items-end ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar (other user) */}
      {!isMe && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-3 shrink-0 border border-purple-500/20">
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-purple-600 flex items-center justify-center text-xs font-semibold text-white">
              {username?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}

      <div
        className={`group relative max-w-[75%] sm:max-w-[65%] flex flex-col ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* Username */}
        {!isMe && username && (
          <span className="text-xs text-purple-300/60 mb-1 ml-1">
            {username}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`
            relative px-4 py-3 rounded-2xl text-sm leading-relaxed wrap-break-word
            transition-all duration-300 transform
            animate-[fadeIn_0.25s_ease-out]
            ${
              isMe
                ? "bg-linear-to-br from-purple-600 to-purple-700 text-white rounded-br-none shadow-lg shadow-purple-900/40"
                : "bg-[#1d1736] text-white border border-purple-500/10 rounded-bl-none"
            }
          `}
        >
          {/* Subtle animated glow layer */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 bg-purple-500/5 blur-xl pointer-events-none" />

          <span className="relative z-10">{message}</span>
        </div>

        {/* Metadata */}
        <div
          className={`
            flex items-center mt-1 gap-1.5 px-1 
            opacity-0 group-hover:opacity-100 
            transition-all duration-200
          `}
        >
          <span className="text-[10px] font-medium text-purple-300/50">
            {timestamp}
          </span>

          {renderStatusIcon()}
        </div>

        {/* Reaction Micro Interaction */}
        <div
          className={`
            absolute -bottom-2 opacity-0 group-hover:opacity-100 
            transition-all duration-200 scale-90 group-hover:scale-100
            ${isMe ? "-left-14" : "-right-14"}
            flex gap-1
          `}
        >
          <button className="text-xs bg-[#151129] border border-purple-500/20 px-2 py-0.5 rounded-full hover:bg-purple-600 transition">
            👍
          </button>
          <button className="text-xs bg-[#151129] border border-purple-500/20 px-2 py-0.5 rounded-full hover:bg-purple-600 transition">
            ❤️
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;