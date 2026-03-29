import React, { useEffect, useRef, useContext, useState } from 'react';
import {
  Phone, Video, MoreVertical, Shield, Info,
  Eraser, Ban, ShieldCheck, AlertTriangle, Loader2,
  UsersRound, LogOut, Settings, Lock
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

const ChatWindow = () => {
  const {
    activeConversation, messages, messagesLoading,
    typingUsers, clearChat, blockUser, unblockUser,
    selectConversation,
  } = useChat();

  const { user: currentUser } = useAuth();
  const { onlineUsers }       = useContext(SocketContext);
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
  }, [messages, typingUsers]);

  // ── MoreVertical menu ──────────────────────────────────────────────────────
  const [showMenu,      setShowMenu]      = useState(false);
  const [clearConfirm,  setClearConfirm]  = useState(false);
  const [blockConfirm,  setBlockConfirm]  = useState(false);
  const [leaveConfirm,  setLeaveConfirm]  = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState(null);
  const menuRef = useRef(null);

  // Close menu on outside click
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

  const avatarSrc   = isGroup
    ? (groupDetails?.groupIcon ?? activeConversation?.groupIcon ?? null)
    : (other?.profilePic || other?.avatar || null);

  const isOtherOnline = !isGroup && other?._id ? onlineUsers.includes(other._id) : false;
  const isTyping      = typingUsers[activeConversation?._id]?.size > 0;

  const participantCount = groupDetails?.participantCount
    ?? activeConversation?.participants?.length
    ?? 0;

  const isBlocked = !isGroup && other?._id
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
    if (isBlocked) return <span className="text-red-400/70 flex items-center gap-1"><Ban size={10} /> Blocked</span>;
    if (isTyping)  return 'typing…';
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

          {/* Left */}
          <div className="flex items-center gap-3">
            {isGroup
              ? avatarSrc
                ? <img src={avatarSrc} alt={displayName}
                    className="w-9 h-9 rounded-full object-cover shrink-0" />
                : <div className="w-9 h-9 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                    <UsersRound size={16} className="text-purple-400/70" />
                  </div>
              : <Avatar src={avatarSrc} name={displayName} alt={displayName} size="md"
                  online={!isGroup ? isOtherOnline : null} />
            }
            <div className="flex flex-col leading-tight">
              <h2 className="text-white font-semibold text-sm tracking-wide">{displayName}</h2>
              <p className="text-[11px] text-purple-400 flex items-center gap-1">
                {renderSubtitle()}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
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

            {/* Info — only meaningful for groups */}
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

                  {/* Error banner */}
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

                  {/* ── GROUP-SPECIFIC MENU ITEMS ── */}
                  {isGroup && (
                    <>
                      {/* Group Settings (admin only) */}
                      {isAdmin && (
                        <button
                          onClick={() => { setShowSettings(true); closeMenu(); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          <Settings size={15} /> Group Settings
                        </button>
                      )}

                      {/* Leave Group */}
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

                  {/* ── PRIVATE CHAT ITEMS ── */}
                  {!isGroup && other?._id && (
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
              return <ChatBubble key={msg._id} message={msg} isOwn={isOwn} isGroup={isGroup} />;
            })
          )}
          <TypingIndicator isActive={typingUsers[activeConversation?._id]?.size > 0} />
          <div ref={scrollRef} />
        </div>

        <MessageInput />

      </div>

      {/* ── Group panels / modals (rendered outside the flex column to avoid overflow clip) ── */}
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