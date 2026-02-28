import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const variants = {
    success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500' },
    error: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500' },
  };

  const { icon: Icon, color, bg } = variants[type];

  return (
    <div className="group relative flex items-center gap-4 min-w-[320px] p-4 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-right-full duration-300">
      <div className={`p-2 rounded-xl ${bg} bg-opacity-10 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
        <X size={16} className="text-slate-400" />
      </button>
      {/* Progress Bar Timer */}
      <div className={`absolute bottom-0 left-0 h-1 ${bg} animate-progress-shrink rounded-b-2xl`} style={{ width: '100%' }}></div>
    </div>
  );
};

export default Toast;