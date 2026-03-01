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
        return <Clock size={12} className="text-slate-400 animate-pulse" />;
      case "sent":
        return <Check size={12} className="text-slate-400" />;
      case "delivered":
        return <CheckCheck size={12} className="text-slate-400" />;
      case "read":
        return <CheckCheck size={12} className="text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex w-full mb-3 items-end ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar for other user */}
      {!isMe && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-semibold text-white">
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
        {/* Username (for group chats future-ready) */}
        {!isMe && username && (
          <span className="text-xs text-slate-400 mb-1 ml-1">
            {username}
          </span>
        )}

        {/* Message */}
        <div
          className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed wrap-break-word
            transition-all duration-200 animate-fadeIn
            ${
              isMe
                ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20"
                : "bg-white dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-white/5"
            }
          `}
        >
          {message}
        </div>

        {/* Metadata */}
        <div
          className={`flex items-center mt-1 gap-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
        >
          <span className="text-[10px] font-medium text-slate-400">
            {timestamp}
          </span>

          {renderStatusIcon()}
        </div>

        {/* Reaction Micro Interaction */}
        <div
          className={`
            absolute -bottom-2 opacity-0 group-hover:opacity-100 
            transition-all duration-200 scale-90 group-hover:scale-100
            ${isMe ? "-left-10" : "-right-10"}
            flex gap-1
          `}
        >
          <button className="hover:scale-125 transition-transform">👍</button>
          <button className="hover:scale-125 transition-transform">❤️</button>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;