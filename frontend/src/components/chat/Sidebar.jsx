import React, { useState, useContext } from 'react';
import { Search, Plus, MessageSquare, Users } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import Avatar from '../ui/Avatar';
import UserList from './UserList';

const TABS = [
  { key: 'chats',  label: 'Chats',  Icon: MessageSquare },
  { key: 'people', label: 'People', Icon: Users },
];

const Sidebar = () => {
  const { conversations, selectConversation, activeConversation, conversationsLoading } = useChat();
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useContext(SocketContext);

  const [activeTab, setActiveTab] = useState('chats');
  const [search, setSearch]       = useState('');

  // Called by UserList after a conversation is opened — auto-switch to Chats tab
  const handleUserSelect = () => setActiveTab('chats');

  const filteredConversations = conversations.filter(c =>
    c.groupName?.toLowerCase().includes(search.toLowerCase()) ||
    c.participants?.some(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-80 h-full bg-black border-r border-gray-800 flex flex-col">

      {/* Header */}
      <div className="p-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-white">
          {activeTab === 'chats' ? 'Chats' : 'People'}
        </h1>
        {activeTab === 'chats' && (
          <button className="p-2 bg-purple-500/10 text-purple-500 rounded-full hover:bg-purple-500/20 transition-colors">
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex bg-[#111] rounded-xl p-1 gap-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${activeTab === key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon size={15} />
              {label}

              {/* Unread count badge on Chats tab */}
              {key === 'chats' && (() => {
                const totalUnread = conversations.reduce((sum, c) => {
                  const val = c.unreadCounts instanceof Map
                    ? c.unreadCounts.get(currentUser?._id) || 0
                    : c.unreadCounts?.[currentUser?._id] || 0;
                  return sum + val;
                }, 0);
                return totalUnread > 0 ? (
                  <span className="bg-purple-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                ) : null;
              })()}

              {/* Online count badge on People tab */}
              {key === 'people' && onlineUsers.length > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                  {onlineUsers.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/*  CHATS TAB */}
      {activeTab === 'chats' && (
        <>
          {/* Search */}
          <div className="px-4 pb-4 shrink-0">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#111] border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversationsLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-6">
                <MessageSquare size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No conversations yet</p>
                <p className="text-gray-700 text-xs mt-1">
                  Go to <span className="text-purple-500">People</span> to start chatting
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isGroup = conv.isGroup || conv.type === 'group';
                const other = isGroup
                  ? null
                  : conv.participants?.find(p => p._id !== currentUser?._id);

                const displayName   = isGroup ? conv.groupName : (other?.name || 'Unknown');
                const isActive      = activeConversation?._id === conv._id;
                const isOtherOnline = !isGroup && other?._id
                  ? onlineUsers.includes(other._id)
                  : false;
                const unread = conv.unreadCounts instanceof Map
                  ? conv.unreadCounts.get(currentUser?._id) || 0
                  : conv.unreadCounts?.[currentUser?._id] || 0;

                return (
                  <div
                    key={conv._id}
                    onClick={() => selectConversation(conv)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative
                      ${isActive ? 'bg-purple-500/10' : 'hover:bg-[#111]'}`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-r" />
                    )}

                    {/* Avatar */}
                    <Avatar
                      src={!isGroup ? other?.profilePic || other?.avatar || null : null}                  
                      name={displayName}               
                      alt={displayName}                
                      size="md"                        
                      online={!isGroup ? isOtherOnline : null}  
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-semibold text-white truncate">{displayName}</h3>
                        <span className="text-[10px] text-gray-500 shrink-0 ml-1">
                          {conv.lastMessage
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>

                    {unread > 0 && (
                      <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center shrink-0">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/*  PEOPLE TAB */}
      {activeTab === 'people' && (
        <UserList onUserSelect={handleUserSelect} />
      )}

    </div>
  );
};

export default Sidebar;