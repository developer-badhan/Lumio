import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { useChat } from '../hooks/useChat';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import EmptyState from '../components/ui/EmptyState';
import CallModal from '../components/ui/CallModal';
import Toast from '../components/ui/Toast';
import { Bot, Settings, LogOut } from 'lucide-react';

/**
 * Dashboard
 * -------
 *   • Removed unused `useEffect` import (was imported but never used).
 *   • Group creation is now handled inside Sidebar → NewConversationModal,
 *     so no Dashboard-level changes are required for that feature.
 *   • startAIChat, CallModal, Toast, handleLogout — all preserved as-is.
 */

const Dashboard = () => {
  const { activeConversation, openPrivateConversation } = useChat();

  const [callConfig, setCallConfig] = useState({
    isOpen:     false,
    callerName: '',
    type:       'audio',
    isIncoming: false,
  });

  const [toast, setToast] = useState(null);

  const startAIChat = async () => {
    try {
      await openPrivateConversation('ai-bot-id');
      setToast("AI Assistant joined the chat");
    } catch (err) {
      setToast("Failed to connect to AI service");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">

      {/* Mini Navigation Rail */}
      <div className="w-16 h-full bg-[#0a0a0a] border-r border-gray-800 flex flex-col items-center py-6 gap-8">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
            <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
          </svg>
        </div>

        <div className="flex flex-col gap-6 flex-1">
          <button
            onClick={startAIChat}
            className="p-3 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all group relative"
          >
            <Bot size={24} />
            <span className="absolute left-16 bg-purple-600 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
              AI Assistant
            </span>
          </button>

          <Link to="/settings">
            <button className="p-3 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all">
              <Settings size={24} />
            </button>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 h-full">
        {/* Sidebar now owns the NewConversationModal internally */}
        <Sidebar />

        <main className="flex-1 h-full flex flex-col">
          {activeConversation ? <ChatWindow /> : <EmptyState />}
        </main>
      </div>

      {/* Global UI Overlays */}
      <CallModal
        isOpen={callConfig.isOpen}
        callerName={callConfig.callerName}
        callType={callConfig.type}
        isIncoming={callConfig.isIncoming}
        onReject={() => setCallConfig({ ...callConfig, isOpen: false })}
        onAccept={() => {
          setCallConfig({ ...callConfig, isOpen: false });
          setToast("Connecting call...");
        }}
      />

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default Dashboard;