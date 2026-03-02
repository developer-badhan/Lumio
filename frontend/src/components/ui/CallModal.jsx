import React from 'react';
import { PhoneOff, MicOff, Volume2 } from 'lucide-react';

const CallModal = ({ isOpen, user, onEnd }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-80 flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
          <img src={user.avatar} className="w-32 h-32 rounded-full border-4 border-white/10 relative z-10" alt="" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
        <p className="text-blue-400 text-sm font-medium animate-pulse">Calling...</p>
        
        <div className="mt-12 flex gap-6">
          <button className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <MicOff size={24} />
          </button>
          <button onClick={onEnd} className="p-4 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl shadow-red-500/40 transition-all hover:rotate-12">
            <PhoneOff size={24} />
          </button>
          <button className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <Volume2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};