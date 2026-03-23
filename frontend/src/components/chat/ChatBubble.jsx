import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Check, CheckCheck, Loader2, Reply, Copy, Pencil,
  Trash2, MoreHorizontal, SmilePlus, X,
  Check as CheckIcon
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';

/**
 * ChatBubble
 * ──────────
 * BUG 7 FIXED — Optimistic media messages showed "unavailable" immediately
 *   Was: voice/audio/video/image optimistic messages have no media.url yet,
 *        so every media check fell through to "unavailable" text — this showed
 *        for 1-2 seconds until the real socket message arrived, looking like an error.
 *   Fix: Optimistic media messages now render a compact loading skeleton with a
 *        spinner and "Sending..." label. The real message (with media.url) arrives
 *        via socket and replaces it. Non-optimistic messages with missing URLs
 *        still show the "unavailable" fallback.
 *
 * All other fixes from previous version preserved:
 *   - message.media?.url (not message.fileUrl)
 *   - voice + video types handled
 *   - isDeleted check
 *   - isEdited label
 *   - bg-gradient-to-r (not bg-linear-to-r)
 */

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const toId = (u) =>
  typeof u === 'string' ? u : u?._id?.toString?.() ?? String(u ?? '');

// ─── Reply preview strip ───────────────────────────────────────────────────────
const ReplyPreview = ({ replyTo, isOwn }) => {
  const preview = replyTo.isDeleted
    ? 'Message was deleted'
    : replyTo.messageType !== 'text'
    ? `📎 ${replyTo.messageType}`
    : replyTo.content;

  return (
    <div className={`mb-2 px-3 py-1.5 rounded-xl text-xs select-none border-l-[3px] ${
      isOwn ? 'bg-white/10 border-white/30' : 'bg-purple-500/10 border-purple-500'
    }`}>
      <p className="font-semibold text-purple-300 truncate mb-0.5">
        {replyTo.sender?.name ?? 'Unknown'}
      </p>
      <p className="text-white/55 truncate">{preview}</p>
    </div>
  );
};

// ─── Reactions row ─────────────────────────────────────────────────────────────
const ReactionsRow = ({ reactions, currentUserId, onReact }) => {
  if (!reactions?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => {
        const reacted = r.users?.some(u => toId(u) === currentUserId);
        return (
          <button
            key={r.emoji}
            onClick={() => onReact(r.emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
              border transition-all duration-150 hover:scale-110 active:scale-95 ${
              reacted
                ? 'bg-purple-500/25 border-purple-500/50 text-white'
                : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10'
            }`}
          >
            <span className="text-sm leading-none">{r.emoji}</span>
            {r.users?.length > 1 && (
              <span className="tabular-nums font-medium">{r.users.length}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── Quick react picker ────────────────────────────────────────────────────────
const QuickReactPicker = ({ onReact, onClose, alignRight }) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute bottom-full mb-2 z-[60]
        flex items-center gap-0.5 px-3 py-2
        bg-[#1c1830] border border-purple-500/20 rounded-full shadow-2xl
        ${alignRight ? 'right-0' : 'left-0'}`}
    >
      {QUICK_REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="text-xl leading-none hover:scale-125 active:scale-90
            transition-transform duration-100 p-0.5"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

// ─── Dropdown menu ─────────────────────────────────────────────────────────────
// NOTE: "Clear my messages" item REMOVED — it now lives in ChatWindow MoreVertical
const DropdownMenu = ({
  isOwn, messageType, isDeleted,
  onCopy, onReply, onEdit, onDelete,
  onClose, alignRight,
}) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, [onClose]);

  const items = [
    !isDeleted                                     && { icon: Reply,  label: 'Reply',   action: onReply,  cls: 'text-gray-200' },
    !isDeleted && messageType === 'text'           && { icon: Copy,   label: 'Copy',    action: onCopy,   cls: 'text-gray-200' },
    isOwn && !isDeleted && messageType === 'text' && { icon: Pencil, label: 'Edit',    action: onEdit,   cls: 'text-blue-300' },
    isOwn && !isDeleted                           && { icon: Trash2, label: 'Delete',  action: onDelete, cls: 'text-red-400'  },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div
      ref={ref}
      className={`absolute bottom-full mb-2 z-[60] w-44
        bg-[#1c1830] border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden
        ${alignRight ? 'right-0' : 'left-0'}`}
    >
      {items.map(({ icon: Icon, label, action, cls }) => (
        <button
          key={label}
          onClick={() => { action(); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm
            font-medium hover:bg-white/5 active:bg-white/10 transition-colors ${cls}`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
};

// ─── Inline edit textarea ──────────────────────────────────────────────────────
const InlineEdit = ({ initialText, onSave, onCancel }) => {
  const [text,   setText]   = useState(initialText);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    const len = ref.current?.value.length ?? 0;
    ref.current?.setSelectionRange(len, len);
  }, []);

  const handleSave = async () => {
    if (!text.trim() || text.trim() === initialText) { onCancel(); return; }
    setSaving(true);
    try { await onSave(text.trim()); } finally { setSaving(false); }
  };

  return (
    <div>
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
          if (e.key === 'Escape') onCancel();
        }}
        rows={Math.max(1, (text.match(/\n/g) || []).length + 1)}
        className="w-full bg-transparent text-white text-[15px] leading-relaxed
          resize-none outline-none border-none focus:ring-0 min-w-[180px]"
      />
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] text-white/30 flex-1">Enter · Esc</span>
        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-white/10 text-white/40 transition-colors"
        >
          <X size={11} />
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="p-1 rounded-full bg-purple-500/30 hover:bg-purple-500/50
            text-purple-300 disabled:opacity-40 transition-colors"
        >
          {saving
            ? <Loader2 size={11} className="animate-spin" />
            : <CheckIcon size={11} />
          }
        </button>
      </div>
    </div>
  );
};

// ─── Media sending skeleton ────────────────────────────────────────────────────
const MediaSending = ({ type, isOwn }) => (
  <div className={`flex items-center gap-2 py-1 px-1 rounded-lg
    ${type === 'image' ? 'w-40 h-24' : 'w-52 h-10'}
    ${isOwn ? 'bg-white/10' : 'bg-white/5'}`}>
    <Loader2 size={14} className="text-white/50 animate-spin shrink-0 ml-2" />
    <span className="text-white/40 text-xs">Sending…</span>
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// MAIN CHATBUBBLE
// ══════════════════════════════════════════════════════════════════════════════

const ChatBubble = ({ message, isOwn }) => {
  const {
    updateMessage,
    removeMessage,
    reactMessage,
    setReplyingTo,
    activeConversation,
    // NOTE: clearMyMessages removed — clear chat is now in ChatWindow MoreVertical
  } = useChat();
  const { user } = useAuth();

  const [isHovered,       setIsHovered]      = useState(false);
  const [showDropdown,    setShowDropdown]    = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [isEditing,       setIsEditing]       = useState(false);
  // NOTE: clearConfirm state removed — no longer needed in bubble

  const showActions = isHovered || showDropdown || showReactPicker;

  const time   = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isRead = message.readBy && message.readBy.length > 1;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content ?? '').catch(() => {});
  }, [message.content]);

  const handleReply = useCallback(() => {
    setReplyingTo(message);
  }, [message, setReplyingTo]);

  const handleDelete = useCallback(() => {
    removeMessage(message._id);
  }, [message._id, removeMessage]);

  const handleReact = useCallback(async (emoji) => {
    if (message.isOptimistic) return;
    await reactMessage(message._id, emoji);
    setShowReactPicker(false);
  }, [message._id, message.isOptimistic, reactMessage]);

  const handleEditSave = useCallback(async (newContent) => {
    await updateMessage(message._id, newContent);
    setIsEditing(false);
  }, [message._id, updateMessage]);

  // ── Deleted bubble ────────────────────────────────────────────────────────────
  if (message.isDeleted) {
    return (
      <div className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`px-4 py-2 rounded-2xl max-w-[72%] ${
          isOwn
            ? 'bg-purple-700/30 rounded-br-sm'
            : 'bg-[#1a1a1a]/80 border border-gray-800/60 rounded-bl-sm'
        }`}>
          <p className="text-[13px] italic text-white/30 select-none">
            🚫 This message was deleted
          </p>
          <p className={`text-[10px] mt-0.5 select-none ${
            isOwn ? 'text-right text-purple-200/30' : 'text-gray-700'
          }`}>
            {time}
          </p>
        </div>
      </div>
    );
  }

  // ── Media resolver ────────────────────────────────────────────────────────────
  const renderMedia = () => {
    const { messageType, media, isOptimistic } = message;
    if (messageType === 'text') return null;
    if (isOptimistic)           return <MediaSending type={messageType} isOwn={isOwn} />;

    switch (messageType) {
      case 'image':
        return media?.url
          ? <img
              src={media.url}
              alt="Attachment"
              className="max-w-[250px] rounded-xl mb-2 object-cover border border-black/20 block"
            />
          : <p className="text-xs text-white/40 italic mb-1">Image unavailable</p>;

      case 'audio':
      case 'voice':
        return media?.url
          ? <AudioPlayer src={media.url} duration={media?.duration} isOwn={isOwn} />
          : <p className="text-xs text-white/40 italic mb-1">Audio unavailable</p>;

      case 'video':
        return media?.url
          ? <video
              src={media.url}
              controls
              className="max-w-[280px] rounded-xl mb-2 border border-black/20 block"
              style={{ maxHeight: 200 }}
            />
          : <p className="text-xs text-white/40 italic mb-1">Video unavailable</p>;

      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-end gap-1.5 mb-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* ── Bubble ─────────────────────────────────────────────────────────── */}
      <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>

        <div className={`px-4 py-2.5 rounded-2xl ${
          isOwn
            ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-br-sm'
            : 'bg-[#1e1b2e] border border-purple-500/10 text-gray-100 rounded-bl-sm'
        } ${message.isOptimistic ? 'opacity-70' : ''}`}>

          {/* Reply preview */}
          {message.replyTo && (
            <ReplyPreview replyTo={message.replyTo} isOwn={isOwn} />
          )}

          {/* Media */}
          {renderMedia()}

          {/* Text / inline edit */}
          {!isEditing && message.content && (
            <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          )}
          {isEditing && (
            <InlineEdit
              initialText={message.content ?? ''}
              onSave={handleEditSave}
              onCancel={() => setIsEditing(false)}
            />
          )}

          {/* Timestamp row */}
          {!isEditing && (
            <div className={`flex items-center gap-1 mt-1 select-none ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}>
              {message.isEdited && (
                <span className="text-[10px] italic opacity-40">edited</span>
              )}
              <span className={`text-[10px] ${
                isOwn ? 'text-purple-200/50' : 'text-gray-600'
              }`}>
                {time}
              </span>
              {isOwn && (
                message.isOptimistic
                  ? <Loader2 size={11} className="animate-spin opacity-50" />
                  : isRead
                    ? <CheckCheck size={12} className="text-blue-400" />
                    : <Check size={12} className="text-purple-200/50" />
              )}
            </div>
          )}
        </div>

        {/* Reactions row — below bubble */}
        {message.reactions?.length > 0 && (
          <ReactionsRow
            reactions={message.reactions}
            currentUserId={user?._id}
            onReact={handleReact}
          />
        )}

        {/* NOTE: clearConfirm banner removed — clear chat is in ChatWindow */}

      </div>

      {/* ── Floating action bar ─────────────────────────────────────────────── */}
      {!message.isOptimistic && (
        <div className={`flex items-center gap-1 pb-7 shrink-0
          transition-all duration-150 ${
          showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>

          {/* React */}
          <div className="relative">
            <button
              onClick={() => { setShowReactPicker(p => !p); setShowDropdown(false); }}
              className="p-1.5 rounded-full bg-[#1c1830] border border-purple-500/15
                text-gray-500 hover:text-purple-300 hover:border-purple-500/40
                transition-all hover:scale-110 active:scale-90"
              title="React"
            >
              <SmilePlus size={14} />
            </button>
            {showReactPicker && (
              <QuickReactPicker
                onReact={handleReact}
                onClose={() => setShowReactPicker(false)}
                alignRight={isOwn}
              />
            )}
          </div>

          {/* Reply */}
          {!message.isDeleted && (
            <button
              onClick={handleReply}
              className="p-1.5 rounded-full bg-[#1c1830] border border-purple-500/15
                text-gray-500 hover:text-purple-300 hover:border-purple-500/40
                transition-all hover:scale-110 active:scale-90"
              title="Reply"
            >
              <Reply size={14} />
            </button>
          )}

          {/* More options — Reply, Copy, Edit, Delete (no Clear Chat here) */}
          <div className="relative">
            <button
              onClick={() => { setShowDropdown(p => !p); setShowReactPicker(false); }}
              className="p-1.5 rounded-full bg-[#1c1830] border border-purple-500/15
                text-gray-500 hover:text-purple-300 hover:border-purple-500/40
                transition-all hover:scale-110 active:scale-90"
              title="More"
            >
              <MoreHorizontal size={14} />
            </button>
            {showDropdown && (
              <DropdownMenu
                isOwn={isOwn}
                messageType={message.messageType}
                isDeleted={message.isDeleted}
                onCopy={handleCopy}
                onReply={handleReply}
                onEdit={() => setIsEditing(true)}
                onDelete={handleDelete}
                onClose={() => setShowDropdown(false)}
                alignRight={isOwn}
                // onClearChat prop removed — moved to ChatWindow
              />
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default ChatBubble;