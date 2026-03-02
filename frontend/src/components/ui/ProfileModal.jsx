import React from 'react';
import { X, Camera, LogOut, Bell, Shield, User } from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f0f0f] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header/Banner */}
        <div className="h-24 bg-linear-to-r from-blue-600 to-indigo-600 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-6">
            <div className="inline-block relative">
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} 
                className="w-24 h-24 rounded-3xl border-4 border-white dark:border-[#0f0f0f] shadow-lg object-cover"
                alt="Profile"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-md hover:scale-110 transition-transform">
                <Camera size={14} className="text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold">{user?.name || "Guest User"}</h2>
            <p className="text-slate-500 text-sm">{user?.email || "guest@lumio.app"}</p>
          </div>

          {/* Settings List */}
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                  <User size={18} />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Edit Profile</span>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                  <Bell size={18} />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Notifications</span>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                  <Shield size={18} />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Privacy & Security</span>
              </div>
            </button>
          </div>

          <hr className="my-6 border-slate-100 dark:border-white/5" />

          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all font-semibold"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;