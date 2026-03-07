import React, { useState } from 'react';
import { Search, Plus, MessageSquare, Users, Bot } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import Avatar from '../ui/Avatar';

const Sidebar = () => {
  const { conversations, selectConversation, activeConversation, conversationsLoading } = useChat();
  const [search, setSearch] = useState("");

  const filteredConversations = conversations.filter(c => 
    c.groupName?.toLowerCase().includes(search.toLowerCase()) || 
    c.participants?.some(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-80 h-full bg-black border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Chats</h1>
        <button className="p-2 bg-purple-500/10 text-purple-500 rounded-full hover:bg-purple-500/20 transition-colors">
          <Plus size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversationsLoading ? (
          <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = conv.isGroup;
            const displayName = isGroup ? conv.groupName : conv.participants[0]?.name;
            const isActive = activeConversation?._id === conv._id;
            const unread = conv.unreadCounts?.[conv._id] || 0;

            return (
              <div 
                key={conv._id}
                onClick={() => selectConversation(conv)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative ${isActive ? 'bg-purple-500/10' : 'hover:bg-[#111]'}`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />}
                <Avatar 
                  fallback={displayName?.charAt(0)} 
                  src={!isGroup ? conv.participants[0]?.avatar : null} 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold text-white truncate">{displayName}</h3>
                    <span className="text-[10px] text-gray-500">
                      {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {conv.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                    {unread}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
