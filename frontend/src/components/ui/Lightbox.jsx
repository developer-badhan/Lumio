import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

const Lightbox = ({ src, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-300 bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
      <div className="flex justify-between items-center p-6 text-white">
        <span className="text-sm font-medium opacity-50">Preview Mode</span>
        <div className="flex gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Download size={20} /></button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <img 
          src={src} 
          className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
          alt="Full size" 
        />
      </div>
    </div>
  );
};

export default Lightbox;