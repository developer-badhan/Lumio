import React from 'react';

const Input = ({ label, error, ...props }) => {
  return (
    <div className="space-y-1.5 w-full text-left">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
      <input 
        className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder:text-gray-400`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 ml-1 font-medium">{error}</p>}
    </div>
  );
};

export default Input;