import React, { useState } from 'react';
import { 
  User, Lock, Bell, MessageSquare, ShieldCheck, 
  Trash2, ChevronRight, Camera, ArrowLeft, Bot, KeyRound
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // States for Toggles
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: <User size={20} />, desc: 'Name, bio, and profile picture' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, desc: 'Message and group alerts' },
    { id: 'account', label: 'Account', icon: <ShieldCheck size={20} />, desc: 'Password and 2FA security' },
    { id: 'privacy', label: 'Privacy', icon: <Lock size={20} />, desc: 'Last seen and blocked list' },
    { id: 'chats', label: 'Chats', icon: <MessageSquare size={20} />, desc: 'History and AI preferences' },
  ];

  const goBack = () => {
    window.location.href = "/";
  };

  // Reusable Toggle Component to match Lumio theme
  const Toggle = ({ enabled, setEnabled }) => (
    <button 
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-purple-600' : 'bg-gray-700'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">
      
      {/* 1. Mini Navigation Rail */}
      <div className="w-16 h-full bg-[#0a0a0a] border-r border-gray-800 flex flex-col items-center py-6">
        <div 
          onClick={goBack}
          className="p-2 rounded-xl bg-linear-to-br from-purple-500 to-purple-700 shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer mb-8"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
            <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
          </svg>
        </div>
        <button onClick={goBack} className="p-3 text-gray-500 hover:text-purple-400 transition-all">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* 2. Settings Sidebar */}
      <div className="w-80 h-full bg-black border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all ${
                activeTab === item.id ? 'bg-purple-500/10 border-r-2 border-purple-500' : 'hover:bg-[#111]'
              }`}
            >
              <div className={`${activeTab === item.id ? 'text-purple-500' : 'text-gray-500'}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${activeTab === item.id ? 'text-purple-400' : 'text-white'}`}>
                  {item.label}
                </h3>
                <p className="text-[11px] text-gray-500 truncate">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Settings Content Area (Lumio Theme / EmptyState Style) */}
      <div className="flex-1 min-h-full bg-[#0f0b1f] relative overflow-hidden flex flex-col items-center justify-start py-12 px-8">
        
        {/* Background Glows */}
        <div className="absolute w-150 h-150 bg-purple-600/15 rounded-full blur-[140px] -top-50 -left-37.5 pointer-events-none" />
        <div className="absolute w-125 h-125 bg-purple-500/10 rounded-full blur-[140px] -bottom-37.5 -right-25 pointer-events-none" />

        <div className="relative z-10 w-full max-w-2xl">
          <div className="bg-[#151129] border border-purple-500/10 shadow-2xl shadow-purple-900/30 rounded-3xl p-8 backdrop-blur-md">
            
            {/* PROFILE SECTION */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group cursor-pointer">
                    <Avatar size="w-24 h-24 text-2xl" fallback="JD" />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Profile Photo</h4>
                    <p className="text-xs text-purple-300/60 mt-1">Recommended size: 400x400px</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-purple-300/70 ml-1">Display Name</label>
                    <input type="text" defaultValue="John Doe" className="w-full bg-[#0f0b1f] border border-purple-500/20 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all text-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-purple-300/70 ml-1">Bio</label>
                    <textarea rows="2" defaultValue="Hello! I'm using Lumio." className="w-full bg-[#0f0b1f] border border-purple-500/20 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all text-white resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeTab === 'notifications' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-xl font-bold text-white mb-2">Notifications</h2>
                <p className="text-sm text-purple-300/60 mb-8">Configure how you receive alerts.</p>
                
                <div className="flex justify-between items-center p-5 bg-[#1d1736] border border-purple-500/10 rounded-2xl">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white">Enable Notifications</span>
                    <span className="text-xs text-purple-300/50">Receive desktop push notifications</span>
                  </div>
                  <Toggle enabled={notifsEnabled} setEnabled={setNotifsEnabled} />
                </div>
              </div>
            )}

            {/* ACCOUNT SECTION */}
            {activeTab === 'account' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-xl font-bold text-white mb-6">Account & Security</h2>
                
                <div className="space-y-4">
                  {/* Two Step Auth */}
                  <div className="flex justify-between items-center p-5 bg-[#1d1736] border border-purple-500/10 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-purple-500/20 rounded-lg text-purple-400">
                        <Lock size={18} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-white">Two-Step Authentication</span>
                        <span className="text-xs text-purple-300/50">Add an extra layer of security</span>
                      </div>
                    </div>
                    <Toggle enabled={twoFactorEnabled} setEnabled={setTwoFactorEnabled} />
                  </div>

                  {/* Change Password Link */}
                  <div 
                    onClick={() => window.location.href = "/change-password"}
                    className="flex justify-between items-center p-5 bg-[#1d1736] border border-purple-500/10 rounded-2xl hover:border-purple-500/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400">
                        <KeyRound size={18} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-white">Change Password</span>
                        <span className="text-xs text-purple-300/50">Update your account credentials</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-purple-500/40 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-purple-500/10">
                   <button className="flex items-center gap-2 text-red-400 hover:text-red-500 transition-colors text-sm font-medium">
                      <Trash2 size={16} /> Delete Account
                   </button>
                </div>
              </div>
            )}

            {/* Save Button (Optional Global) */}
            {(activeTab === 'profile') && (
              <button className="w-full mt-8 py-3.5 bg-linear-to-r from-purple-500 to-purple-700 rounded-xl font-bold text-sm shadow-xl shadow-purple-900/40 hover:opacity-90 transition-opacity">
                Save Settings
              </button>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-6">Privacy Settings</h2>
                <div className="flex justify-between p-5 bg-[#1d1736] border border-purple-500/10 rounded-2xl">
                  <span className="text-white">Last Seen</span>
                  <span className="text-purple-400">Everyone</span>
                </div>
                <div className="flex justify-between p-5 bg-[#1d1736] border border-purple-500/10 rounded-2xl">
                  <span className="text-white">Profile Photo</span>
                  <span className="text-purple-400">My Contacts</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-[#1d1736] border border-purple-500/10 rounded-2xl">
                  <span className="text-white">Read Receipts</span>
                  <Toggle enabled={readReceipts} setEnabled={setReadReceipts} />
                </div>
              </div>
            )}

            {activeTab === 'chats' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Chat Preferences</h2>
                <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex gap-4 mb-6">
                  <Bot className="text-purple-500" />
                  <div>
                    <p className="font-semibold text-white">AI Assistant</p>
                    <p className="text-xs text-purple-300/60">AI suggestions and summaries</p>
                    <button className="mt-3 px-3 py-1 bg-purple-500 rounded-lg text-xs text-white">
                      ENABLE AI
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <button className="w-full flex justify-between p-5 bg-[#1d1736] border border-purple-500/10 rounded-2xl text-white">
                    Chat Wallpaper
                    <ChevronRight size={16} />
                  </button>
                  <button className="w-full flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                    <Trash2 size={18} />
                    Clear All Conversations
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Badge like EmptyState */}
          <div className="mt-8 flex justify-center">
            <div className="px-4 py-2 bg-[#1d1736] border border-purple-500/20 rounded-full text-[10px] text-purple-300/50 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Lumio Settings v1.0.4 - Secure Connection
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;