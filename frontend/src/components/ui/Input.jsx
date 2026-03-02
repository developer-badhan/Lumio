import React from 'react';

const Input = ({ 
  label, 
  error, 
  icon: Icon, 
  className = "", 
  wrapperClassName = "", 
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
      {label && (
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
            <Icon size={18} strokeWidth={2.2} />
          </div>
        )}
        
        <input
          className={`
            w-full px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-transparent
            text-sm text-slate-900 dark:text-slate-100 rounded-xl
            placeholder:text-slate-400 dark:placeholder:text-slate-600
            focus:bg-white dark:focus:bg-black/20 focus:border-blue-500/50 
            focus:ring-4 focus:ring-blue-500/10 outline-none 
            transition-all duration-200
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;