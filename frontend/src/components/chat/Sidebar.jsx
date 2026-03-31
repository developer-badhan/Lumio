import React, { useState, useContext, useRef, useEffect } from 'react';
import { Search, Plus, MessageSquare, Users, UsersRound, Sparkles } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import Avatar from '../ui/Avatar';
import UserList from './UserList';
import NewConversationModal from './NewConversationModal';
import CreateGroupModal from '../group/CreateGroupModal';


/**
 * Sidebar
 * ───────
 * Fix applied vs original:
 *   • The <Plus> button existed in the header but had NO onClick handler — 
 *     clicking it did nothing. 
 *   • Added `showNewConvModal` state.
 *   • <Plus> button now toggles the modal open.
 *   • <NewConversationModal> is rendered when showNewConvModal is true.
 *   • All existing logic (tabs, search, unread badges, online badges) is unchanged.
 * AI integration additions:
 *   • Helper `isAIConv()` detects the Lumio AI private conversation by
 *     checking if any non-self participant is named "Lumio AI".
 *   • AI conversation is always sorted to the top of the list.
 *   • AI conversation item gets:
 *       - Teal sparkle avatar (replaces the user Avatar component)
 *       - Always-online green dot
 *       - "AI" pill badge next to the name
 *       - "AI Assistant" preview label when no messages exist yet
 *
 * All original behaviour (tabs, search, unread badges, online counts) preserved.
 */


const TABS = [
  { key: 'chats',  label: 'Chats',  Icon: MessageSquare },
  { key: 'people', label: 'People', Icon: Users },
];

// Detects whether a conversation is the Lumio AI private chat.
// Checks that the conversation is private and has a participant named "Lumio AI"
// who is not the current user.
const isAIConv = (conv, currentUserId) =>
  conv.type !== 'group' &&
  conv.participants?.some(p => p._id !== currentUserId && p.name === 'Lumio AI');


const Sidebar = () => {
  const { conversations, selectConversation, activeConversation, conversationsLoading } = useChat();
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useContext(SocketContext);

  const [activeTab,            setActiveTab]            = useState('chats');
  const [search,               setSearch]               = useState('');
  const [showNewConvModal,     setShowNewConvModal]     = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showPlusMenu,         setShowPlusMenu]         = useState(false);

  const plusMenuRef = useRef(null);

  useEffect(() => {
    if (!showPlusMenu) return;
    const handler = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPlusMenu]);

  const handleUserSelect = () => setActiveTab('chats');

  // ── Filtering + sort (AI always first) ────────────────────────────────────
  const filteredConversations = conversations.filter(c => {
    const isGroup = c.type === 'group';
    if (isGroup) return c.groupName?.toLowerCase().includes(search.toLowerCase());
    return c.participants?.some(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  });

  // Pin AI conversation to the top of the list
  const sortedConversations = (() => {
    const ai   = filteredConversations.find(c => isAIConv(c, currentUser?._id));
    const rest = filteredConversations.filter(c => !isAIConv(c, currentUser?._id));
    return ai ? [ai, ...rest] : rest;
  })();

  return (
    <>
      <div className="w-80 h-full bg-black border-r border-gray-800 flex flex-col">

        {/* ── Header ── */}
        <div className="p-4 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-white">
            {activeTab === 'chats' ? 'Chats' : 'People'}
          </h1>

          {activeTab === 'chats' && (
            <div className="relative" ref={plusMenuRef}>
              <button
                onClick={() => setShowPlusMenu(p => !p)}
                className="p-2 bg-purple-500/10 text-purple-500 rounded-full hover:bg-purple-500/20 transition-colors"
                title="New conversation"
              >
                <Plus size={20} />
              </button>

              {showPlusMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 w-44
                  bg-[#1c1830] border border-purple-500/20 rounded-xl shadow-xl overflow-hidden">
                  <button
                    onClick={() => { setShowNewConvModal(true); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                      text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <MessageSquare size={15} className="text-purple-400" />
                    New Chat
                  </button>
                  <button
                    onClick={() => { setShowCreateGroupModal(true); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                      text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <UsersRound size={15} className="text-purple-400" />
                    New Group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Tab Switcher ── */}
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

                {key === 'people' && onlineUsers.length > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                    {onlineUsers.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── CHATS TAB ── */}
        {activeTab === 'chats' && (
          <>
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

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {conversationsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sortedConversations.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <MessageSquare size={32} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No conversations yet</p>
                  <p className="text-gray-700 text-xs mt-1">
                    Press <span className="text-purple-500">+</span> to start chatting
                  </p>
                </div>
              ) : (
                sortedConversations.map(conv => {
                  const isGroup = conv.type === 'group';
                  const other   = isGroup
                    ? null
                    : conv.participants?.find(p => p._id !== currentUser?._id);

                  const isAI        = isAIConv(conv, currentUser?._id);
                  const displayName = isGroup ? conv.groupName : (other?.name || 'Unknown');
                  const isActive    = activeConversation?._id === conv._id;

                  // AI is always shown as online
                  const isOtherOnline = isAI
                    ? true
                    : (!isGroup && other?._id ? onlineUsers.includes(other._id) : false);

                  const unread = conv.unreadCounts instanceof Map
                    ? conv.unreadCounts.get(currentUser?._id) || 0
                    : conv.unreadCounts?.[currentUser?._id] || 0;

                  // Last message preview
                  const lastMsgPreview = conv.lastMessage?.isDeleted
                    ? '🗑 Message deleted'
                    : conv.lastMessage?.messageType !== 'text'
                      ? `📎 ${conv.lastMessage?.messageType}`
                      : isGroup && conv.lastMessage?.sender?.name
                        ? `${conv.lastMessage.sender.name}: ${conv.lastMessage.content}`
                        : conv.lastMessage?.content
                        ?? (isAI ? 'AI Assistant — ask me anything' : 'No messages yet');

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

                      {/* ── Avatar ── */}
                      {isGroup
                        // Group icon
                        ? conv.groupIcon
                          ? <div className="relative shrink-0">
                              <img src={conv.groupIcon} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                            </div>
                          : <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                              <UsersRound size={18} className="text-purple-400/70" />
                            </div>

                        // Private: AI gets teal sparkle avatar, humans get Avatar component
                        : isAI
                          ? <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-full bg-teal-600/20 border border-teal-500/30 flex items-center justify-center">
                                <Sparkles size={18} className="text-teal-400" />
                              </div>
                              {/* Always-online indicator */}
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                            </div>
                          : <Avatar
                              src={other?.profilePic || other?.avatar || null}
                              name={displayName}
                              alt={displayName}
                              size="md"
                              online={isOtherOnline}
                            />
                      }

                      {/* ── Name + preview ── */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">{displayName}</h3>
                            {/* AI badge */}
                            {isAI && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                bg-teal-500/15 text-teal-400 border border-teal-500/20 shrink-0">
                                AI
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 shrink-0 ml-1">
                            {conv.lastMessage
                              ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isAI && !conv.lastMessage ? 'text-teal-400/50 italic' : 'text-gray-500'}`}>
                          {lastMsgPreview}
                        </p>
                      </div>

                      {/* Unread badge */}
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

        {/* ── PEOPLE TAB ── */}
        {activeTab === 'people' && (
          <UserList onUserSelect={handleUserSelect} />
        )}

      </div>

      {/* Modals */}
      {showNewConvModal     && <NewConversationModal onClose={() => setShowNewConvModal(false)} />}
      {showCreateGroupModal && <CreateGroupModal     onClose={() => setShowCreateGroupModal(false)} />}
    </>
  );
};

export default Sidebar;