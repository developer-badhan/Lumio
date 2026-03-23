import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Mic, Smile, X, Reply } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useChat } from '../../hooks/useChat';
import AttachmentPreview from './AttachmentPreview';
import VoiceRecorder from './VoiceRecorder';

/**
 * MessageInput
 * ────────────
 * New features:
 *   • Reads `replyingTo` + `setReplyingTo` from ChatContext.
 *   • Shows a reply bar above the textarea when replyingTo is set.
 *   • Passes replyingTo._id to sendMessage as the third argument (replyToId).
 *   • Reply bar is dismissed by the X button or after a successful send.
 */

const MessageInput = () => {
  const {
    sendMessage, activeConversation,
    emitTyping, emitStopTyping,
    replyingTo, setReplyingTo,
  } = useChat();

  const [text,            setText]            = useState('');
  const [file,            setFile]            = useState(null);
  const [isRecording,     setIsRecording]     = useState(false);
  const [isSending,       setIsSending]       = useState(false);
  const [voiceError,      setVoiceError]      = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef     = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef   = useRef(null);
  const textareaRef      = useRef(null);

  // Focus textarea when reply bar appears
  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

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

  // ── Text / file send ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() && !file) return;
    const replyToId = replyingTo?._id ?? null;
    try {
      await sendMessage(text, file, replyToId);
      setText('');
      setFile(null);
      // replyingTo is cleared inside sendMessage on success
      if (activeConversation?._id) emitStopTyping(activeConversation._id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // ── Voice send ────────────────────────────────────────────────────────────
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

  // ── Typing ────────────────────────────────────────────────────────────────
  const onTyping = (e) => {
    setText(e.target.value);
    if (activeConversation?._id) {
      emitTyping(activeConversation._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(activeConversation._id);
      }, 2000);
    }
  };

  // ── Emoji ─────────────────────────────────────────────────────────────────
  const onEmojiClick = (emojiData) => {
    const emoji    = emojiData.emoji;
    const textarea = textareaRef.current;
    if (textarea) {
      const start    = textarea.selectionStart;
      const end      = textarea.selectionEnd;
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

  // ── Reply preview content ─────────────────────────────────────────────────
  const replyPreview = replyingTo
    ? replyingTo.isDeleted
      ? 'Message was deleted'
      : replyingTo.messageType !== 'text'
      ? `📎 ${replyingTo.messageType}`
      : replyingTo.content
    : null;

  // ── Recording mode ────────────────────────────────────────────────────────
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

  return (
    <div className="bg-black border-t border-gray-800 relative">

      {/* ── Reply bar ──────────────────────────────────────────────────────── */}
      {replyingTo && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800/60
          bg-[#0d0a1c]">
          <Reply size={14} className="text-purple-400 shrink-0" />
          <div className="flex-1 border-l-2 border-purple-500 pl-3 min-w-0">
            <p className="text-xs font-semibold text-purple-400 truncate">
              {replyingTo.sender?.name ?? 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 truncate">{replyPreview}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full text-gray-600 hover:text-gray-300
              hover:bg-white/5 transition-colors shrink-0"
            title="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Attachment preview ────────────────────────────────────────────── */}
      <div className="relative">
        <AttachmentPreview file={file} onClear={() => setFile(null)} />
      </div>

      {/* ── Input row ─────────────────────────────────────────────────────── */}
      <div className="p-4">
        <div className="flex items-end gap-3 max-w-6xl mx-auto">

          {/* Paperclip */}
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

          {/* Textarea + emoji */}
          <div className="flex-1 bg-[#111] border border-gray-800 rounded-2xl
            flex items-end px-3 py-2 focus-within:border-purple-500/50
            transition-colors relative">
            <textarea
              ref={textareaRef}
              rows="1"
              placeholder={replyingTo ? `Replying to ${replyingTo.sender?.name ?? 'message'}…` : 'Type a message…'}
              value={text}
              onChange={onTyping}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white
                text-sm py-1 max-h-32 resize-none outline-none placeholder-gray-600"
            />
            <div ref={emojiPickerRef} className="relative">
              <button
                onClick={() => setShowEmojiPicker(p => !p)}
                className={`p-1 transition-colors ${
                  showEmojiPicker ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-500'
                }`}
                title="Emoji"
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

          {/* Send / Mic */}
          <button
            onClick={text.trim() || file ? handleSend : () => setIsRecording(true)}
            className="p-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white
              rounded-xl hover:opacity-90 transition-opacity shrink-0"
            title={text.trim() || file ? 'Send' : 'Record voice message'}
          >
            {text.trim() || file ? <Send size={20} /> : <Mic size={20} />}
          </button>

        </div>
      </div>
    </div>
  );
};

export default MessageInput;