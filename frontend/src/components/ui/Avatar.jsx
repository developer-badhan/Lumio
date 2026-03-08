import React from "react";

const Avatar = ({
  src,
  name = "User",
  alt,
  size = "md",
  fallback,
  status = null,     // online | away | dnd | offline
  online = null,     // boolean override
  className = "",
}) => {

  // Size mapping
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-lg",
  };

  // Status colors
  const statusColors = {
    online: "bg-emerald-400",
    away: "bg-amber-400",
    dnd: "bg-rose-500",
    offline: "bg-gray-500",
  };

  // Generate initials from name
  const initials =
    fallback ||
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // Determine indicator color
  const indicatorColor =
    online !== null
      ? online
        ? "bg-emerald-400"
        : "bg-gray-600"
      : status
      ? statusColors[status]
      : null;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {/* Avatar */}
      <div
        className={`
        ${sizes[size] || size}
        rounded-full overflow-hidden
        flex items-center justify-center
        font-semibold tracking-tight
        bg-gradient-to-br from-purple-500 to-purple-700
        text-white
        border border-purple-900/50
      `}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Status Indicator */}
      {indicatorColor && (
        <span
          className={`
            absolute -bottom-0.5 -right-0.5
            w-3 h-3 rounded-full
            border-2 border-black
            ${indicatorColor}
          `}
        />
      )}
    </div>
  );
};

export default Avatar;