import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Mic } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import AttachmentPreview from "./AttachmentPreview.jsx";
import VoiceRecorder from "./VoiceRecorder.jsx";

const MessageInput = ({ onSendMessage }) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  // Close emoji picker when recording starts
  useEffect(() => {
    if (isRecording) {
      setShowEmojiPicker(false);
    }
  }, [isRecording]);

  const handleSend = () => {
    if (!text.trim() && files.length === 0) return;

    onSendMessage({ text, files });
    setText("");
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
      text.substring(0, start) +
      emoji +
      text.substring(end);

    setText(newText);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd =
        start + emoji.length;
      textarea.focus();
    }, 0);

    setShowEmojiPicker(false);
  };

  // 🔥 Voice recorder integration improvement
  const handleVoiceSend = (audioBlob) => {
    const audioFile = new File([audioBlob], "voice-message.webm", {
      type: audioBlob.type || "audio/webm",
    });

    onSendMessage({
      text: "",
      files: [audioFile],
    });

    setIsRecording(false);
  };

  const handleStartRecording = () => {
    setText("");
    setFiles([]);
    setIsRecording(true);
  };

  if (isRecording) {
    return (
      <VoiceRecorder
        onCancel={() => setIsRecording(false)}
        onSend={handleVoiceSend}
      />
    );
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-2 relative">

      {/* Attachment Preview */}
      {files.length > 0 && (
        <AttachmentPreview
          files={files}
          onRemove={(index) =>
            setFiles((prev) => prev.filter((_, i) => i !== index))
          }
        />
      )}

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-600/20 border-2 border-dashed border-purple-500 rounded-2xl flex items-center justify-center text-purple-200 backdrop-blur-sm z-10">
          Drop files here 📂
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex items-end gap-3 bg-[#1d1736] px-4 py-3 rounded-2xl border border-purple-500/20 focus-within:ring-2 focus-within:ring-purple-600/30 transition"
      >
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-purple-300/70 hover:text-purple-400 transition"
        >
          <Paperclip size={18} />
        </button>

        <input
          type="file"
          multiple
          hidden
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows="1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder-purple-300/50 max-h-40 overflow-y-auto"
        />

        {/* Emoji Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-purple-300/70 hover:text-purple-400 transition"
          >
            <Smile size={18} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 z-20 shadow-xl">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        {/* Mic or Send */}
        {!text.trim() && files.length === 0 ? (
          <button
            onClick={handleStartRecording}
            className="text-purple-300/70 hover:text-purple-400 transition"
          >
            <Mic size={18} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 transition active:scale-95"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;