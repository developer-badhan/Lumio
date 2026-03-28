import React, { useEffect, useRef, useContext, useState } from 'react';
import {
  Phone, Video, MoreVertical, Shield, Info,
  Eraser, Ban, ShieldCheck, AlertTriangle, Loader2
} from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { useCall } from '../../hooks/useCall';    
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Avatar from '../ui/Avatar';
import AnimatedChatBackground from '../ui/AnimatedChatBackground';


const ChatWindow = () => {

  const {
    activeConversation,
    messages,
    messagesLoading,
    typingUsers,
    clearChat,
    blockUser,
    unblockUser,
  } = useChat();

  const { user: currentUser } = useAuth();
  const { onlineUsers }       = useContext(SocketContext);

  // ── Call integration ───────────────────────────────────────────────────────
  // initiateCall: starts an outgoing call for this conversation
  // callStatus:   'idle' | 'calling' | 'incoming' | 'active'
  //   When not idle, the call buttons are disabled so the user can't accidentally
  //   start a second call while one is already in progress.
  const { initiateCall, callStatus } = useCall();
  const isInCall = callStatus !== 'idle';

  // ── Scroll ────────────────────────────────────────────────────────────────
  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // ── MoreVertical menu state ───────────────────────────────────────────────
  const [showMenu,     setShowMenu]     = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // FIX: loading state
  const [actionError,   setActionError]   = useState(null);  // FIX: error state
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setClearConfirm(false);
        setBlockConfirm(false);
        setActionError(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // ── Conversation metadata ─────────────────────────────────────────────────
  const isGroup = activeConversation?.isGroup || activeConversation?.type === 'group';

  const other = isGroup
    ? null
    : activeConversation?.participants?.find(p => p._id !== currentUser?._id);

  const displayName = isGroup
    ? activeConversation?.groupName
    : (other?.name || 'Unknown');

  const avatarSrc = isGroup ? null : (other?.profilePic || other?.avatar || null);

  const isOtherOnline = !isGroup && other?._id
    ? onlineUsers.includes(other._id)
    : false;

  const isTyping = typingUsers[activeConversation?._id]?.size > 0;

  // Block status derived from currentUser.blockedUsers
  const isBlocked = !isGroup && other?._id
    ? (currentUser?.blockedUsers ?? []).some(id =>
        (typeof id === 'string' ? id : id?.toString?.()) === other._id
      )
    : false;

  // ── FIX: Menu action handlers with try/catch ──────────────────────────────
  // Was: no try/catch → when backend route doesn't exist (404), unhandled
  // rejection caused UI to freeze with confirm dialogs stuck open.
  const handleClearChat = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await clearChat(activeConversation._id);
      setClearConfirm(false);
      setShowMenu(false);
    } catch (err) {
      // Keep confirm dialog open, show error inline
      setActionError('Failed to clear chat. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      if (isBlocked) await unblockUser(other._id);
      else           await blockUser(other._id);
      setBlockConfirm(false);
      setShowMenu(false);
    } catch (err) {
      setActionError(isBlocked ? 'Failed to unblock user.' : 'Failed to block user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">

      <AnimatedChatBackground />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-purple-900/40 flex items-center
        justify-between px-6 backdrop-blur-xl bg-black/50 z-10 shrink-0">

        {/* Left */}
        <div className="flex items-center gap-3">
          <Avatar
            src={avatarSrc}
            name={displayName}
            alt={displayName}
            size="md"
            online={!isGroup ? isOtherOnline : null}
          />
          <div className="flex flex-col leading-tight">
            <h2 className="text-white font-semibold text-sm tracking-wide">
              {displayName}
            </h2>
            <p className="text-[11px] text-purple-400 flex items-center gap-1">
              {isBlocked
                ? <span className="text-red-400/70 flex items-center gap-1">
                    <Ban size={10} /> Blocked
                  </span>
                : isTyping
                  ? 'typing…'
                  : isOtherOnline && !isGroup
                    ? <span className="text-emerald-400">Online</span>
                    : <><Shield size={10} /> Offline</>
              }
            </p>
          </div>
        </div>

        {/* Right — action buttons */}
        <div className="flex items-center gap-2">

          {/* ── Audio call button ──────────────────────────────────────── */}
          {/*
            Calls initiateCall with type 'audio'.
            Disabled when already in a call (isInCall) or when the other user
            is blocked (blocked users can't receive calls from us).
            For group conversations, audio calls are also supported.
          */}
          <button
            className="action-btn disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={isInCall || isBlocked}
            title={isInCall ? 'Already in a call' : 'Start audio call'}
            onClick={() =>
              activeConversation?._id &&
              initiateCall(activeConversation._id, 'audio')
            }
          >
            <Phone size={20} />
          </button>

          {/* ── Video call button ──────────────────────────────────────── */}
          {/*
            Calls initiateCall with type 'video'.
            Same disabled conditions as audio call.
          */}
          <button
            className="action-btn disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={isInCall || isBlocked}
            title={isInCall ? 'Already in a call' : 'Start video call'}
            onClick={() =>
              activeConversation?._id &&
              initiateCall(activeConversation._id, 'video')
            }
          >
            <Video size={20} />
          </button>

          <button className="action-btn"><Info size={20} /></button>

          {/* MoreVertical with dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="action-btn"
              onClick={() => {
                setShowMenu(p => !p);
                setClearConfirm(false);
                setBlockConfirm(false);
                setActionError(null);
              }}
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-58 z-50
                bg-[#1c1830] border border-purple-500/20 rounded-2xl
                shadow-2xl shadow-black/60 overflow-hidden min-w-[220px]">

                {/* Error banner */}
                {actionError && (
                  <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                    <p className="text-xs text-red-400">{actionError}</p>
                  </div>
                )}

                {/* ── F1: Clear Chat ──────────────────────────────────── */}
                {!clearConfirm ? (
                  <button
                    onClick={() => { setClearConfirm(true); setBlockConfirm(false); setActionError(null); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm
                      font-medium text-orange-300 hover:bg-white/5 transition-colors"
                  >
                    <Eraser size={15} />
                    Clear Chat
                  </button>
                ) : (
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs text-orange-300 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle size={12} />
                      Clear your chat history?
                    </p>
                    <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                      Only cleared for you. Others still see all messages.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearChat}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 text-xs font-bold text-white
                          bg-orange-500/30 hover:bg-orange-500/50 rounded-lg
                          transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {actionLoading
                          ? <><Loader2 size={11} className="animate-spin" /> Clearing…</>
                          : 'Clear'
                        }
                      </button>
                      <button
                        onClick={() => { setClearConfirm(false); setActionError(null); }}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 text-xs text-gray-400 hover:text-white
                          border border-white/10 hover:border-white/20 rounded-lg
                          transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ── F3: Block / Unblock — private chats only ────────── */}
                {!isGroup && other?._id && (
                  !blockConfirm ? (
                    <button
                      onClick={() => { setBlockConfirm(true); setClearConfirm(false); setActionError(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm
                        font-medium transition-colors hover:bg-white/5 ${
                        isBlocked ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isBlocked ? <ShieldCheck size={15} /> : <Ban size={15} />}
                      {isBlocked ? `Unblock ${other.name}` : `Block ${other.name}`}
                    </button>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-xs text-red-300 mb-1.5 flex items-center gap-1.5">
                        {isBlocked
                          ? <><ShieldCheck size={12} /> Unblock this user?</>
                          : <><Ban size={12} /> Block {other.name}?</>
                        }
                      </p>
                      {!isBlocked && (
                        <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                          They won't be able to send you messages.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleBlockToggle}
                          disabled={actionLoading}
                          className={`flex-1 py-1.5 text-xs font-bold text-white
                            rounded-lg transition-colors disabled:opacity-50
                            flex items-center justify-center gap-1 ${
                            isBlocked
                              ? 'bg-emerald-500/30 hover:bg-emerald-500/50'
                              : 'bg-red-500/30 hover:bg-red-500/50'
                          }`}
                        >
                          {actionLoading
                            ? <><Loader2 size={11} className="animate-spin" /> {isBlocked ? 'Unblocking…' : 'Blocking…'}</>
                            : isBlocked ? 'Unblock' : 'Block'
                          }
                        </button>
                        <button
                          onClick={() => { setBlockConfirm(false); setActionError(null); }}
                          disabled={actionLoading}
                          className="flex-1 py-1.5 text-xs text-gray-400 hover:text-white
                            border border-white/10 hover:border-white/20 rounded-lg
                            transition-colors disabled:opacity-50"
                        >
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

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar relative z-10">

        {messagesLoading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Loading history…
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = msg.sender?._id ?? msg.sender;
            const isOwn    = senderId === currentUser?._id || senderId === 'me';
            return (
              <ChatBubble key={msg._id} message={msg} isOwn={isOwn} />
            );
          })
        )}

        <TypingIndicator isActive={isTyping} />
        <div ref={scrollRef} />
      </div>

      <MessageInput />

    </div>
  );
};

export default ChatWindow;