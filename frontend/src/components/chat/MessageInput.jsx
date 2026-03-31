import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Send, Mic, Smile, X, Reply, Lock } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useChat } from '../../hooks/useChat';
import { useGroup } from '../../hooks/useGroup';
import AttachmentPreview from './AttachmentPreview';
import VoiceRecorder from './VoiceRecorder';
import MentionSuggestions from '../group/MentionSuggestions';


/**
 * MessageInput
 * ────────────
 * New features:
 *   • Reads `replyingTo` + `setReplyingTo` from ChatContext.
 *   • Shows a reply bar above the textarea when replyingTo is set.
 *   • Passes replyingTo._id to sendMessage as the third argument (replyToId).
 *   • Reply bar is dismissed by the X button or after a successful send.
 *
 * AI integration additions:
 *   • Reads `isAIConversation` from ChatContext (via useChat).
 *   • When talking to the AI:
 *       - Placeholder becomes "Ask Lumio AI anything…"
 *       - Paperclip (file attach) button is hidden — AI responds to text only
 *       - Mic / voice recorder button is hidden — AI responds to text only
 *       - Send button is always shown (never switches to mic icon)
 *   • All group @mention logic unchanged — @Lumio works via existing MentionSuggestions.
 *   • File state is cleared when switching conversations (prevents stale file in AI chat).
 *
 * All original behaviour preserved for human private chats and group chats.
 */


// ── Mention detection helpers ──────────────────────────────────────────────────
const detectMentionTrigger = (value, cursorPos) => {
  const before = value.slice(0, cursorPos);
  const match  = before.match(/@([\w.]*)$/);
  if (!match) return null;
  return {
    query:      match[1],
    startIndex: before.length - match[0].length,
  };
};


const MessageInput = () => {
  const {
    sendMessage, activeConversation,
    emitTyping, emitStopTyping,
    replyingTo, setReplyingTo,
    isAIConversation, // ← AI addition
  } = useChat();

  const { isGroup, canSend, isRestricted, isAdmin } = useGroup();

  const [text,            setText]            = useState('');
  const [file,            setFile]            = useState(null);
  const [isRecording,     setIsRecording]     = useState(false);
  const [isSending,       setIsSending]       = useState(false);
  const [voiceError,      setVoiceError]      = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionTrigger,  setMentionTrigger]  = useState(null);

  const fileInputRef     = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef   = useRef(null);
  const textareaRef      = useRef(null);

  // Focus textarea when reply bar appears
  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

  // Clear text, file, and mention state when switching conversations
  useEffect(() => {
    setMentionTrigger(null);
    setText('');
    setFile(null); // important: prevents a stale file persisting into AI chat
  }, [activeConversation?._id]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiPicker]);

  // ── Text / file send ───────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() && !file) return;
    const replyToId = replyingTo?._id ?? null;
    try {
      await sendMessage(text, file, replyToId);
      setText('');
      setFile(null);
      setMentionTrigger(null);
      if (activeConversation?._id) emitStopTyping(activeConversation._id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // ── Voice send ─────────────────────────────────────────────────────────────
  const handleVoiceSend = async (audioFile) => {
    if (!audioFile) return;
    if (!activeConversation) {
      setVoiceError('No active conversation. Please select a chat first.');
      return;
    }
    setVoiceError(null);
    setIsSending(true);
    try {
      const replyToId = replyingTo?._id ?? null;
      await sendMessage('', audioFile, replyToId);
      setIsRecording(false);
    } catch (err) {
      console.error('Voice send failed:', err);
      setVoiceError('Failed to send. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Typing + @mention detection ────────────────────────────────────────────
  const onTyping = (e) => {
    const val       = e.target.value;
    const cursorPos = e.target.selectionStart ?? val.length;
    setText(val);

    if (isGroup) {
      const trigger = detectMentionTrigger(val, cursorPos);
      setMentionTrigger(trigger);
    }

    if (activeConversation?._id) {
      emitTyping(activeConversation._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(activeConversation._id);
      }, 2000);
    }
  };

  const onCursorChange = () => {
    if (!isGroup || !textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart ?? 0;
    const trigger   = detectMentionTrigger(text, cursorPos);
    setMentionTrigger(trigger);
  };

  // ── Mention selected ───────────────────────────────────────────────────────
  const handleMentionSelect = useCallback((member) => {
    if (!mentionTrigger) return;
    const { startIndex } = mentionTrigger;
    const cursorPos      = textareaRef.current?.selectionStart ?? text.length;
    const handle         = member.name.trim().replace(/\s+/g, '.');
    const before         = text.slice(0, startIndex);
    const after          = text.slice(cursorPos);
    const newText        = `${before}@${handle} ${after}`;

    setText(newText);
    setMentionTrigger(null);

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursor = startIndex + handle.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  }, [mentionTrigger, text]);

  // ── Emoji ──────────────────────────────────────────────────────────────────
  const onEmojiClick = (emojiData) => {
    const emoji    = emojiData.emoji;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end   = textarea.selectionEnd;
      setText(text.slice(0, start) + emoji + text.slice(end));
      setTimeout(() => {
        textarea.selectionStart = start + emoji.length;
        textarea.selectionEnd   = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setText(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  // ── Reply preview ──────────────────────────────────────────────────────────
  const replyPreview = replyingTo
    ? replyingTo.isDeleted
      ? 'Message was deleted'
      : replyingTo.messageType !== 'text'
      ? `📎 ${replyingTo.messageType}`
      : replyingTo.content
    : null;

  // ── Recording mode (only available in non-AI conversations) ───────────────
  if (isRecording) {
    return (
      <div className="bg-black border-t border-gray-800 w-full">
        {voiceError && (
          <p className="text-red-400 text-xs text-center pt-2 px-4 select-none">{voiceError}</p>
        )}
        <div className="p-4">
          <VoiceRecorder
            onCancel={() => { setIsRecording(false); setVoiceError(null); }}
            onSend={handleVoiceSend}
            isSending={isSending}
          />
        </div>
      </div>
    );
  }

  // ── Restricted group lock banner ───────────────────────────────────────────
  if (isGroup && isRestricted && !canSend) {
    return (
      <div className="bg-black border-t border-gray-800 px-6 py-4 flex items-center justify-center gap-2.5">
        <Lock size={15} className="text-amber-400/70 shrink-0" />
        <p className="text-sm text-gray-600">
          Only admins can send messages in this group.
        </p>
      </div>
    );
  }

  // ── Dynamic placeholder ────────────────────────────────────────────────────
  const placeholder = isAIConversation
    ? 'Ask Lumio AI anything…'
    : replyingTo
      ? `Replying to ${replyingTo.sender?.name ?? 'message'}…`
      : isGroup
        ? 'Type a message… (@ to mention)'
        : 'Type a message…';

  return (
    <div className="bg-black border-t border-gray-800 relative">

      {/* ── Reply bar ── */}
      {replyingTo && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800/60 bg-[#0d0a1c]">
          <Reply size={14} className="text-purple-400 shrink-0" />
          <div className="flex-1 border-l-2 border-purple-500 pl-3 min-w-0">
            <p className="text-xs font-semibold text-purple-400 truncate">
              {replyingTo.sender?.name ?? 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 truncate">{replyPreview}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Attachment preview ── */}
      {!isAIConversation && (
        <div className="relative">
          <AttachmentPreview file={file} onClear={() => setFile(null)} />
        </div>
      )}

      {/* ── Input row ── */}
      <div className="p-4">
        <div className="flex items-end gap-3 max-w-6xl mx-auto relative">

          {/* Paperclip — hidden in AI conversations */}
          {!isAIConversation && (
            <div className="flex gap-2 pb-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-purple-500 transition-colors"
                title="Attach file"
              >
                <Paperclip size={22} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,audio/*,video/*"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) setFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {/* Textarea + emoji + @mention panel */}
          <div className="flex-1 relative">
            {/* @mention suggestions */}
            {isGroup && mentionTrigger && activeConversation?._id && (
              <MentionSuggestions
                query={mentionTrigger.query}
                groupId={activeConversation._id}
                onSelect={handleMentionSelect}
                onClose={() => setMentionTrigger(null)}
              />
            )}

            <div className="bg-[#111] border border-gray-800 rounded-2xl flex items-end
              px-3 py-2 focus-within:border-purple-500/50 transition-colors">
              <textarea
                ref={textareaRef}
                rows="1"
                placeholder={placeholder}
                value={text}
                onChange={onTyping}
                onClick={onCursorChange}
                onKeyUp={onCursorChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !mentionTrigger) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white
                  text-sm py-1 max-h-32 resize-none outline-none placeholder-gray-600 w-full"
              />
              <div ref={emojiPickerRef} className="relative shrink-0">
                <button
                  onClick={() => setShowEmojiPicker(p => !p)}
                  className={`p-1 transition-colors ${showEmojiPicker ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-500'}`}
                >
                  <Smile size={20} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-10 right-0 z-50 shadow-2xl rounded-xl overflow-hidden">
                    <EmojiPicker
                      theme="dark"
                      onEmojiClick={onEmojiClick}
                      skinTonesDisabled
                      height={380}
                      width={320}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send / Mic
              In AI conversations: always show Send (mic makes no sense for AI).
              In human chats: switches to Mic when input is empty (original behaviour).
          */}
          <button
            onClick={
              isAIConversation
                ? handleSend                                              // AI: always send
                : (text.trim() || file ? handleSend : () => setIsRecording(true)) // Human: send or mic
            }
            disabled={isAIConversation && !text.trim()} // AI: disable send when empty
            className={`p-3 text-white rounded-xl shrink-0 pb-[14px] transition-opacity
              ${isAIConversation && !text.trim()
                ? 'bg-purple-500/30 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-purple-500 to-purple-700 hover:opacity-90'
              }`}
            title={
              isAIConversation
                ? 'Send to Lumio AI'
                : (text.trim() || file ? 'Send' : 'Record voice message')
            }
          >
            {(text.trim() || file || isAIConversation) ? <Send size={20} /> : <Mic size={20} />}
          </button>

        </div>
      </div>
    </div>
  );
};

export default MessageInput;