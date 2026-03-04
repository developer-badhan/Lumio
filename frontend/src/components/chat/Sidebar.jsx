import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../services/axios';
import { Search, UserPlus, Settings, ChevronLeft } from 'lucide-react';
import Avatar from './ui/Avatar'; // Assuming this exists based on your Dashboard code

const Sidebar = () => {
  const { conversations, activeChat, setActiveChat, fetchConversations } = useChat();
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useSocket();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Global Search Logic
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await api.get(`/auth/users?search=${searchTerm}`);
        setSearchResults(data.users.filter(u => u._id !== currentUser._id));
      } catch (err) {
        console.error("Search failed", err);
      }
    };
    const delayDebounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, currentUser._id]);

  const startConversation = async (receiverId) => {
    try {
      const { data } = await api.post('/conversations/private', { receiverId });
      setActiveChat(data.conversation);
      setSearchTerm('');
      fetchConversations();
    } catch (err) {
      console.error("Could not start conversation", err);
    }
  };

  return (
    <aside className={`bg-[#151129] border-r border-purple-500/10 transition-all duration-300 z-30 flex flex-col h-full ${sidebarOpen ? "w-80" : "w-0 lg:w-80 overflow-hidden"}`}>
      
      {/* Sidebar Header */}
      <div className="px-5 py-5 border-b border-purple-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
              <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
            </svg>
          </div>
          <h2 className="font-bold text-xl tracking-wide text-white">Lumio</h2>
        </div>
        <button className="p-2 hover:bg-purple-700/10 rounded-lg text-purple-300 transition lg:hidden">
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-purple-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search people or messages"
            className="w-full bg-[#1d1736] text-white placeholder-purple-300/50 border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition rounded-xl py-2 pl-10 pr-4 outline-none text-sm"
          />
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2">
        {searchTerm.trim() !== '' ? (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold px-2">Global Search</p>
            {searchResults.map(user => (
              <button key={user._id} onClick={() => startConversation(user._id)} className="w-full flex gap-3 items-center p-3 rounded-2xl hover:bg-purple-700/10 transition text-left group">
                <Avatar name={user.name} src={user.profilePic} size="sm" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white">{user.name}</h4>
                  <p className="text-xs text-purple-300/50">Start new chat</p>
                </div>
                <UserPlus size={16} className="text-purple-500 opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        ) : (
          conversations.map(conv => {
            const otherUser = conv.type === 'private' ? conv.participants.find(p => p._id !== currentUser._id) : null;
            const isOnline = otherUser && onlineUsers.includes(otherUser._id);
            const unreadCount = conv.unreadCounts?.[currentUser._id] || 0;
            const isActive = activeChat?._id === conv._id;

            return (
              <button key={conv._id} onClick={() => setActiveChat(conv)} className={`w-full flex gap-3 items-center p-3 rounded-2xl transition text-left ${isActive ? "bg-purple-700/20 border border-purple-500/20" : "hover:bg-purple-700/10"}`}>
                <Avatar 
                  name={conv.type === 'group' ? conv.groupName : otherUser?.name} 
                  src={conv.type === 'private' ? otherUser?.profilePic : null}
                  status={isOnline ? "online" : "offline"} 
                  size="sm" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm truncate text-white">
                      {conv.type === 'group' ? conv.groupName : otherUser?.name}
                    </p>
                    <span className="text-[10px] text-purple-400">
                      {conv.lastMessage ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-xs truncate flex-1 ${unreadCount > 0 ? "text-white font-medium" : "text-purple-300/60"}`}>
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2 shadow-lg shadow-purple-900/50">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default Sidebar;