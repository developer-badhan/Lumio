import React from 'react';

const Avatar = ({ src, name, size = 'md', isOnline }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  };

  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="relative shrink-0">
      <div className={`${sizes[size]} rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold overflow-hidden border border-purple-200/50 dark:border-purple-700/50`}>
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
      </div>
      {isOnline !== undefined && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-950 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
      )}
    </div>
  );
};

export default Avatar;