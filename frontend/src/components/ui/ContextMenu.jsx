import React from 'react';
import { Copy, Reply, Trash2, Forward } from 'lucide-react';

const ContextMenu = ({ x, y, onClose }) => {
  return (
    <>
      <div className="fixed inset-0 z-190" onClick={onClose} />
      <div 
        className="fixed z-200 w-48 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in zoom-in-95 duration-100"
        style={{ top: y, left: x }}
      >
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
          <Reply size={16} className="text-slate-400" /> Reply
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
          <Copy size={16} className="text-slate-400" /> Copy Text
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
          <Forward size={16} className="text-slate-400" /> Forward
        </button>
        <div className="my-1 border-t border-slate-100 dark:border-white/5" />
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
          <Trash2 size={16} /> Delete Message
        </button>
      </div>
    </>
  );
};

export default ContextMenu;