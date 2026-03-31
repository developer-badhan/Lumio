import React, { useEffect, useRef, useContext, useState } from 'react';
import {
  Phone, Video, MoreVertical, Shield, Info,
  Eraser, Ban, ShieldCheck, AlertTriangle, Loader2,
  UsersRound, LogOut, Settings, Lock, Sparkles,
} from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { useCall } from '../../hooks/useCall';
import { useGroup } from '../../hooks/useGroup';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Avatar from '../ui/Avatar';
import AnimatedChatBackground from '../ui/AnimatedChatBackground';
import GroupInfoPanel from '../group/GroupInfoPanel';
import GroupSettingsModal from '../group/GroupSettingsModal';
import AddMembersModal from '../group/AddMembersModal';
import GroupInviteModal from '../group/GroupInviteModal';

/** *
 * ChatWindow is the main component for displaying the active conversation.
 * It shows the header with conversation info and actions, the message list,
 * and the message input. It also handles the "More" menu actions like clearing
 *  chat, blocking/unblocking users, and leaving groups. It integrates with
 * the SocketContext to show real-time typing indicators for both human and AI participants.
 * AI conversations are identified by the presence of the AI system user's _id in the participants,
 * 
 * Bug Fixes:
 * - Fixed an issue where the typing indicator would not show for AI responses by adding aiTyping state from SocketContext.
 * - Resolved a bug where the wrong user's online status was displayed in group chats by ensuring we check the correct participant's ID against onlineUsers.
 * - Addressed a problem with the MoreVertical menu not closing properly after an action by adding a closeMenu function that resets all confirmation states and errors.
 * - Fixed an edge case where blocking/unblocking a user would not update the menu state correctly by ensuring we reset confirms and errors when toggling block state.
*/


const ChatWindow = () => {
  const {
    activeConversation, messages, messagesLoading,
    typingUsers, clearChat, blockUser, unblockUser,
    selectConversation,
    // ── AI additions ──────────────────────────────────────────────────────────
    isAIConversation, // true when the active private conv is with Lumio AI
    aiUserId,         // _id of the AI system user — used to flag AI messages
  } = useChat();

  const { user: currentUser } = useAuth();

  // aiTyping: null | conversationId — set by SocketContext from 'ai-typing' event
  const { onlineUsers, aiTyping } = useContext(SocketContext);

  const { initiateCall, callStatus } = useCall();
  const isInCall = callStatus !== 'idle';

  // ── Group context ──────────────────────────────────────────────────────────
  const {
    isGroup, isAdmin, isSuperAdmin, canSend, isRestricted,
    myRole, groupDetails, members,
    showInfoPanel, setShowInfoPanel,
    showSettings,  setShowSettings,
    showAddMembers, setShowAddMembers,
    showInvite,    setShowInvite,
    handleLeaveGroup,
  } = useGroup();

  // ── Scroll ─────────────────────────────────────────────────────────────────
  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers, aiTyping]);

  // ── MoreVertical menu ──────────────────────────────────────────────────────
  const [showMenu,      setShowMenu]      = useState(false);
  const [clearConfirm,  setClearConfirm]  = useState(false);
  const [blockConfirm,  setBlockConfirm]  = useState(false);
  const [leaveConfirm,  setLeaveConfirm]  = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        resetConfirms();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const resetConfirms = () => {
    setClearConfirm(false);
    setBlockConfirm(false);
    setLeaveConfirm(false);
    setActionError(null);
  };

  const closeMenu = () => { setShowMenu(false); resetConfirms(); };

  // ── Conversation metadata ──────────────────────────────────────────────────
  const other = isGroup
    ? null
    : activeConversation?.participants?.find(p => p._id !== currentUser?._id);

  const displayName = isGroup
    ? (groupDetails?.groupName ?? activeConversation?.groupName)
    : (other?.name || 'Unknown');

  const avatarSrc = isGroup
    ? (groupDetails?.groupIcon ?? activeConversation?.groupIcon ?? null)
    : (other?.profilePic || other?.avatar || null);

  // AI is always "available" — never offline
  const isOtherOnline = isAIConversation
    ? true
    : (!isGroup && other?._id ? onlineUsers.includes(other._id) : false);

  const isTyping   = typingUsers[activeConversation?._id]?.size > 0;
  // True when the AI is generating a response in this conversation
  const isAITyping = aiTyping === activeConversation?._id;

  const participantCount = groupDetails?.participantCount
    ?? activeConversation?.participants?.length
    ?? 0;

  // Don't allow blocking the AI system user
  const isBlocked = !isGroup && !isAIConversation && other?._id
    ? (currentUser?.blockedUsers ?? []).some(id =>
        (typeof id === 'string' ? id : id?.toString?.()) === other._id
      )
    : false;

  // ── Menu action handlers ───────────────────────────────────────────────────
  const handleClearChat = async () => {
    setActionLoading(true); setActionError(null);
    try {
      await clearChat(activeConversation._id);
      closeMenu();
    } catch { setActionError('Failed to clear chat. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const handleBlockToggle = async () => {
    setActionLoading(true); setActionError(null);
    try {
      if (isBlocked) await unblockUser(other._id);
      else           await blockUser(other._id);
      closeMenu();
    } catch { setActionError(isBlocked ? 'Failed to unblock user.' : 'Failed to block user.'); }
    finally { setActionLoading(false); }
  };

  const handleLeave = async () => {
    setActionLoading(true); setActionError(null);
    try {
      await handleLeaveGroup();
      selectConversation(null);
      closeMenu();
    } catch { setActionError('Failed to leave group.'); }
    finally { setActionLoading(false); }
  };

  // ── Subtitle text ──────────────────────────────────────────────────────────
  const renderSubtitle = () => {
    // AI conversation always shows "AI Assistant"
    if (isAIConversation) return (
      <span className="text-teal-400 flex items-center gap-1">
        <Sparkles size={10} />
        AI Assistant
      </span>
    );
    if (isGroup) {
      const restrictedLabel = isRestricted
        ? <span className="flex items-center gap-1"><Lock size={9} className="text-amber-400" /><span className="text-amber-400">Restricted</span></span>
        : null;
      return (
        <span className="flex items-center gap-1.5">
          <span className="text-gray-500">{participantCount} members</span>
          {restrictedLabel}
        </span>
      );
    }
    if (isBlocked)     return <span className="text-red-400/70 flex items-center gap-1"><Ban size={10} /> Blocked</span>;
    if (isTyping)      return 'typing…';
    if (isOtherOnline) return <span className="text-emerald-400">Online</span>;
    return <><Shield size={10} /> Offline</>;
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">

        <AnimatedChatBackground />

        {/* ── Header ── */}
        <header className="h-16 border-b border-purple-900/40 flex items-center
          justify-between px-6 backdrop-blur-xl bg-black/50 z-10 shrink-0">

          {/* Left — avatar + name + subtitle */}
          <div className="flex items-center gap-3">
            {isGroup
              // Group avatar
              ? avatarSrc
                ? <img src={avatarSrc} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                : <div className="w-9 h-9 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                    <UsersRound size={16} className="text-purple-400/70" />
                  </div>
              // Private: AI gets teal sparkle avatar, humans get Avatar component
              : isAIConversation
                ? <div className="w-9 h-9 rounded-full bg-teal-600/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-teal-400" />
                  </div>
                : <Avatar src={avatarSrc} name={displayName} alt={displayName} size="md" online={isOtherOnline} />
            }

            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <h2 className="text-white font-semibold text-sm tracking-wide">{displayName}</h2>
                {isAIConversation && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    bg-teal-500/15 text-teal-400 border border-teal-500/20 shrink-0">
                    AI
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-400 flex items-center gap-1">
                {renderSubtitle()}
              </p>
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-2">

            {/* Call buttons — hidden for AI conversations */}
            {!isAIConversation && (
              <>
                <button
                  className="action-btn disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isInCall || isBlocked}
                  title={isInCall ? 'Already in a call' : 'Start audio call'}
                  onClick={() => activeConversation?._id && initiateCall(activeConversation._id, 'audio')}
                >
                  <Phone size={20} />
                </button>
                <button
                  className="action-btn disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isInCall || isBlocked}
                  title={isInCall ? 'Already in a call' : 'Start video call'}
                  onClick={() => activeConversation?._id && initiateCall(activeConversation._id, 'video')}
                >
                  <Video size={20} />
                </button>
              </>
            )}

            {/* Info panel — only for groups */}
            {isGroup && (
              <button
                className={`action-btn ${showInfoPanel ? 'text-purple-400' : ''}`}
                onClick={() => setShowInfoPanel(p => !p)}
                title="Group info"
              >
                <Info size={20} />
              </button>
            )}

            {/* MoreVertical */}
            <div className="relative" ref={menuRef}>
              <button
                className="action-btn"
                onClick={() => { setShowMenu(p => !p); resetConfirms(); }}
              >
                <MoreVertical size={20} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 z-50
                  bg-[#1c1830] border border-purple-500/20 rounded-2xl
                  shadow-2xl shadow-black/60 overflow-hidden min-w-[220px]">

                  {actionError && (
                    <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                      <p className="text-xs text-red-400">{actionError}</p>
                    </div>
                  )}

                  {/* Clear Chat */}
                  {!clearConfirm ? (
                    <button
                      onClick={() => { setClearConfirm(true); setBlockConfirm(false); setLeaveConfirm(false); setActionError(null); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-orange-300 hover:bg-white/5 transition-colors"
                    >
                      <Eraser size={15} /> Clear Chat
                    </button>
                  ) : (
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs text-orange-300 mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Clear your chat history?
                      </p>
                      <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                        Only cleared for you. Others still see all messages.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={handleClearChat} disabled={actionLoading}
                          className="flex-1 py-1.5 text-xs font-bold text-white bg-orange-500/30 hover:bg-orange-500/50
                            rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                          {actionLoading ? <><Loader2 size={11} className="animate-spin" /> Clearing…</> : 'Clear'}
                        </button>
                        <button onClick={() => { setClearConfirm(false); setActionError(null); }} disabled={actionLoading}
                          className="flex-1 py-1.5 text-xs text-gray-400 hover:text-white border border-white/10
                            hover:border-white/20 rounded-lg transition-colors disabled:opacity-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Group-specific items */}
                  {isGroup && (
                    <>
                      {isAdmin && (
                        <button
                          onClick={() => { setShowSettings(true); closeMenu(); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          <Settings size={15} /> Group Settings
                        </button>
                      )}

                      {!leaveConfirm ? (
                        <button
                          onClick={() => { setLeaveConfirm(true); setClearConfirm(false); setBlockConfirm(false); setActionError(null); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-orange-400 hover:bg-white/5 transition-colors"
                        >
                          <LogOut size={15} /> Leave Group
                        </button>
                      ) : (
                        <div className="px-4 py-3 border-t border-white/5">
                          <p className="text-xs text-orange-300 mb-2 flex items-center gap-1.5">
                            <AlertTriangle size={12} /> Leave this group?
                          </p>
                          {isSuperAdmin && (
                            <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                              As owner, leaving transfers ownership to another admin.
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button onClick={handleLeave} disabled={actionLoading}
                              className="flex-1 py-1.5 text-xs font-bold text-white bg-orange-500/30 hover:bg-orange-500/50
                                rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                              {actionLoading ? <><Loader2 size={11} className="animate-spin" /> Leaving…</> : 'Leave'}
                            </button>
                            <button onClick={() => { setLeaveConfirm(false); setActionError(null); }} disabled={actionLoading}
                              className="flex-1 py-1.5 text-xs text-gray-400 hover:text-white border border-white/10
                                hover:border-white/20 rounded-lg transition-colors disabled:opacity-50">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Block/Unblock — hidden for AI conversations */}
                  {!isGroup && !isAIConversation && other?._id && (
                    !blockConfirm ? (
                      <button
                        onClick={() => { setBlockConfirm(true); setClearConfirm(false); setActionError(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 ${isBlocked ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {isBlocked ? <ShieldCheck size={15} /> : <Ban size={15} />}
                        {isBlocked ? `Unblock ${other.name}` : `Block ${other.name}`}
                      </button>
                    ) : (
                      <div className="px-4 py-3">
                        <p className="text-xs text-red-300 mb-1.5 flex items-center gap-1.5">
                          {isBlocked ? <><ShieldCheck size={12} /> Unblock this user?</> : <><Ban size={12} /> Block {other.name}?</>}
                        </p>
                        {!isBlocked && (
                          <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                            They won't be able to send you messages.
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={handleBlockToggle} disabled={actionLoading}
                            className={`flex-1 py-1.5 text-xs font-bold text-white rounded-lg transition-colors disabled:opacity-50
                              flex items-center justify-center gap-1
                              ${isBlocked ? 'bg-emerald-500/30 hover:bg-emerald-500/50' : 'bg-red-500/30 hover:bg-red-500/50'}`}>
                            {actionLoading
                              ? <><Loader2 size={11} className="animate-spin" /> {isBlocked ? 'Unblocking…' : 'Blocking…'}</>
                              : isBlocked ? 'Unblock' : 'Block'
                            }
                          </button>
                          <button onClick={() => { setBlockConfirm(false); setActionError(null); }} disabled={actionLoading}
                            className="flex-1 py-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors disabled:opacity-50">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar relative z-10">
          {messagesLoading && messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Loading history…
            </div>
          ) : (
            messages.map(msg => {
              const senderId = msg.sender?._id ?? msg.sender;
              const isOwn    = senderId === currentUser?._id || senderId === 'me';
              // Flag message as AI if sender matches the AI system user's _id
              const isAIMsg  = !!aiUserId && senderId === aiUserId;
              return (
                <ChatBubble
                  key={msg._id}
                  message={msg}
                  isOwn={isOwn}
                  isGroup={isGroup}
                  isAIMessage={isAIMsg}
                />
              );
            })
          )}

          {/* Human typing indicator */}
          <TypingIndicator isActive={isTyping} />

          {/* AI thinking indicator — driven by 'ai-typing' socket event */}
          <TypingIndicator isActive={isAITyping} isAI={true} />

          <div ref={scrollRef} />
        </div>

        <MessageInput />

      </div>

      {/* Group panels / modals */}
      {isGroup && (
        <>
          <GroupInfoPanel />
          {showSettings   && <GroupSettingsModal onClose={() => setShowSettings(false)} />}
          {showAddMembers && <AddMembersModal    onClose={() => setShowAddMembers(false)} />}
          {showInvite     && <GroupInviteModal   onClose={() => setShowInvite(false)} />}
        </>
      )}
    </>
  );
};

export default ChatWindow;