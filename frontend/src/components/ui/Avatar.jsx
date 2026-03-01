import React from 'react';

const Avatar = ({ src, name = "User", size = "md", status = "online", className = "" }) => {
  // Size Mapping
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-lg",
  };

  // Status Colors
  const statusColors = {
    online: "bg-emerald-500",
    away: "bg-amber-400",
    dnd: "bg-rose-500",
    offline: "bg-slate-400",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div className={`
        ${sizes[size]} 
        rounded-2xl overflow-hidden flex items-center justify-center font-bold tracking-tighter
        bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/10 dark:to-white/5
        text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/10
      `}>
        {src ? (
          <img 
            src={src} 
            alt={name} 
            className="h-full w-full object-cover transition-opacity duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      
      {/* Status Dot */}
      {status && (
        <span className={`
          absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0a0a0a]
          ${statusColors[status]}
        `} />
      )}
    </div>
  );
};

export default Avatar;