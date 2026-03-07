import React, { useState } from 'react';
import { 
  User, Lock, Bell, MessageSquare, ShieldCheck, 
  Trash2, ChevronRight, Camera, ArrowLeft, Bot, KeyRound
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';

const Settings = () => {

  const [activeTab, setActiveTab] = useState('profile');

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

  const Toggle = ({ enabled, setEnabled }) => (
    <button 
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-purple-600' : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">

      {/* MINI NAV */}
      <div className="w-16 h-full bg-[#0a0a0a] border-r border-gray-800 flex flex-col items-center py-6">

        <div
          onClick={goBack}
          className="p-2 rounded-xl bg-linear-to-br from-purple-500 to-purple-700 shadow-lg cursor-pointer mb-8"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
            <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z"/>
          </svg>
        </div>

        <button onClick={goBack} className="p-3 text-gray-500 hover:text-purple-400">
          <ArrowLeft size={24}/>
        </button>

      </div>

      {/* SIDEBAR */}
      <div className="w-80 h-full bg-black border-r border-gray-800 flex flex-col">

        <div className="p-6">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {menuItems.map(item => (

            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-6 py-4 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-purple-500/10 border-r-2 border-purple-500'
                  : 'hover:bg-[#111]'
              }`}
            >

              <div className={`${activeTab === item.id ? 'text-purple-500' : 'text-gray-500'}`}>
                {item.icon}
              </div>

              <div className="flex-1">
                <h3 className={`${activeTab === item.id ? 'text-purple-400' : 'text-white'} text-sm font-semibold`}>
                  {item.label}
                </h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>

            </div>

          ))}
        </div>

      </div>

      {/* MAIN PANEL */}
      <div className="flex-1 bg-[#0f0b1f] flex justify-center pt-12 px-8 overflow-y-auto">

        <div className="w-full max-w-2xl">

          <div className="bg-[#151129] border border-purple-500/10 rounded-3xl p-8 shadow-2xl">

            {/* PROFILE */}
            {activeTab === 'profile' && (

              <div>

                <h2 className="text-xl font-bold mb-6">Profile Settings</h2>

                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group cursor-pointer">
                    <Avatar size="w-24 h-24 text-2xl" fallback="JD"/>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Camera size={20}/>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium">Profile Photo</h4>
                    <p className="text-xs text-purple-300/60">Recommended size 400x400px</p>
                  </div>
                </div>

                <div className="space-y-4">

                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full bg-[#0f0b1f] border border-purple-500/20 rounded-xl px-4 py-3 text-sm"
                  />

                  <textarea
                    rows="2"
                    defaultValue="Hello! I'm using Lumio."
                    className="w-full bg-[#0f0b1f] border border-purple-500/20 rounded-xl px-4 py-3 text-sm resize-none"
                  />

                </div>

                <button className="w-full mt-8 py-3 bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl font-semibold">
                  Save Settings
                </button>

              </div>

            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (

              <div>

                <h2 className="text-xl font-bold mb-6">Notifications</h2>

                <div className="flex justify-between items-center p-5 bg-[#1d1736] rounded-2xl">

                  <div>
                    <p className="font-semibold">Enable Notifications</p>
                    <p className="text-xs text-purple-300/50">Receive desktop alerts</p>
                  </div>

                  <Toggle enabled={notifsEnabled} setEnabled={setNotifsEnabled}/>

                </div>

              </div>

            )}

            {/* ACCOUNT */}
            {activeTab === 'account' && (

              <div>

                <h2 className="text-xl font-bold mb-6">Account & Security</h2>

                <div className="space-y-4">

                  <div className="flex justify-between items-center p-5 bg-[#1d1736] rounded-2xl">

                    <div className="flex gap-4 items-center">
                      <Lock size={18}/>
                      <div>
                        <p className="font-semibold">Two Step Authentication</p>
                        <p className="text-xs text-purple-300/50">Extra security</p>
                      </div>
                    </div>

                    <Toggle enabled={twoFactorEnabled} setEnabled={setTwoFactorEnabled}/>

                  </div>

                  <div
                    onClick={() => window.location.href = "/change-password"}
                    className="flex justify-between items-center p-5 bg-[#1d1736] rounded-2xl cursor-pointer"
                  >

                    <div className="flex gap-4 items-center">
                      <KeyRound size={18}/>
                      <p>Change Password</p>
                    </div>

                    <ChevronRight size={18}/>

                  </div>

                </div>

              </div>

            )}

            {/* PRIVACY */}
            {activeTab === 'privacy' && (

              <div>

                <h2 className="text-xl font-bold mb-6">Privacy Settings</h2>

                <div className="space-y-4">

                  <div className="flex justify-between p-5 bg-[#1d1736] rounded-2xl">
                    <span>Last Seen</span>
                    <span className="text-purple-400">Everyone</span>
                  </div>

                  <div className="flex justify-between p-5 bg-[#1d1736] rounded-2xl">
                    <span>Profile Photo</span>
                    <span className="text-purple-400">My Contacts</span>
                  </div>

                  <div className="flex justify-between items-center p-5 bg-[#1d1736] rounded-2xl">
                    <span>Read Receipts</span>
                    <Toggle enabled={readReceipts} setEnabled={setReadReceipts}/>
                  </div>

                </div>

              </div>

            )}

            {/* CHATS */}
            {activeTab === 'chats' && (

              <div>

                <h2 className="text-xl font-bold mb-6">Chat Preferences</h2>

                <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex gap-4 mb-6">

                  <Bot className="text-purple-500"/>

                  <div>
                    <p className="font-semibold">AI Assistant</p>
                    <p className="text-xs text-gray-400">
                      AI suggestions and summaries
                    </p>

                    <button className="mt-3 px-3 py-1 bg-purple-500 rounded-lg text-xs">
                      ENABLE AI
                    </button>
                  </div>

                </div>

                <div className="space-y-4">

                  <button className="w-full flex justify-between p-5 bg-[#1d1736] rounded-2xl">
                    Chat Wallpaper
                    <ChevronRight size={16}/>
                  </button>

                  <button className="w-full flex items-center gap-3 p-5 bg-red-500/10 rounded-2xl text-red-400">
                    <Trash2 size={18}/>
                    Clear All Conversations
                  </button>

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;