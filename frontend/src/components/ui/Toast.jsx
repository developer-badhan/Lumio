import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => onClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-[#1a1a1a] border border-purple-500/40 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-75">
        <div className="w-2 h-2 rounded-full bg-linear-to-r from-purple-500 to-purple-700" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;