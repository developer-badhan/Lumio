import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none rounded-xl";
  
  const variants = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 border border-blue-400/20",
    secondary: "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10",
    outline: "bg-transparent border border-slate-200 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5",
    danger: "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 border border-rose-400/20",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
    icon: "p-2.5",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 18} className="shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;