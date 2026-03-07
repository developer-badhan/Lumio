// import React, { useState, useRef, useEffect } from "react";
// import { Send, Paperclip, Smile, Mic } from "lucide-react";
// import EmojiPicker from "emoji-picker-react";
// import AttachmentPreview from "./AttachmentPreview.jsx";
// import VoiceRecorder from "./VoiceRecorder.jsx";

// const MessageInput = ({ onSendMessage }) => {
//   const [text, setText] = useState("");
//   const [files, setFiles] = useState([]);
//   const [isRecording, setIsRecording] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);

//   const fileInputRef = useRef(null);
//   const textareaRef = useRef(null);

//   // Auto resize textarea
//   useEffect(() => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//       textareaRef.current.style.height =
//         textareaRef.current.scrollHeight + "px";
//     }
//   }, [text]);

//   // Close emoji picker when recording starts
//   useEffect(() => {
//     if (isRecording) {
//       setShowEmojiPicker(false);
//     }
//   }, [isRecording]);

//   const handleSend = () => {
//     if (!text.trim() && files.length === 0) return;

//     onSendMessage({ text, files });
//     setText("");
//     setFiles([]);
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   const handleFileChange = (e) => {
//     if (!e.target.files) return;
//     setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     setIsDragging(false);

//     if (e.dataTransfer.files) {
//       setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
//     }
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragLeave = () => {
//     setIsDragging(false);
//   };

//   const handleEmojiClick = (emojiData) => {
//     const emoji = emojiData.emoji;
//     const textarea = textareaRef.current;

//     const start = textarea.selectionStart;
//     const end = textarea.selectionEnd;

//     const newText =
//       text.substring(0, start) +
//       emoji +
//       text.substring(end);

//     setText(newText);

//     setTimeout(() => {
//       textarea.selectionStart = textarea.selectionEnd =
//         start + emoji.length;
//       textarea.focus();
//     }, 0);

//     setShowEmojiPicker(false);
//   };

//   // 🔥 Voice recorder integration improvement
//   const handleVoiceSend = (audioBlob) => {
//     const audioFile = new File([audioBlob], "voice-message.webm", {
//       type: audioBlob.type || "audio/webm",
//     });

//     onSendMessage({
//       text: "",
//       files: [audioFile],
//     });

//     setIsRecording(false);
//   };

//   const handleStartRecording = () => {
//     setText("");
//     setFiles([]);
//     setIsRecording(true);
//   };

//   if (isRecording) {
//     return (
//       <VoiceRecorder
//         onCancel={() => setIsRecording(false)}
//         onSend={handleVoiceSend}
//       />
//     );
//   }

//   return (
//     <div className="flex flex-col w-full max-w-5xl mx-auto gap-2 relative">

//       {/* Attachment Preview */}
//       {files.length > 0 && (
//         <AttachmentPreview
//           files={files}
//           onRemove={(index) =>
//             setFiles((prev) => prev.filter((_, i) => i !== index))
//           }
//         />
//       )}

//       {/* Drag Overlay */}
//       {isDragging && (
//         <div className="absolute inset-0 bg-purple-600/20 border-2 border-dashed border-purple-500 rounded-2xl flex items-center justify-center text-purple-200 backdrop-blur-sm z-10">
//           Drop files here 📂
//         </div>
//       )}

//       <div
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onDrop={handleDrop}
//         className="flex items-end gap-3 bg-[#1d1736] px-4 py-3 rounded-2xl border border-purple-500/20 focus-within:ring-2 focus-within:ring-purple-600/30 transition"
//       >
//         {/* Attachment Button */}
//         <button
//           onClick={() => fileInputRef.current?.click()}
//           className="text-purple-300/70 hover:text-purple-400 transition"
//         >
//           <Paperclip size={18} />
//         </button>

//         <input
//           type="file"
//           multiple
//           hidden
//           ref={fileInputRef}
//           onChange={handleFileChange}
//         />

//         {/* Text Area */}
//         <textarea
//           ref={textareaRef}
//           rows="1"
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder="Write a message..."
//           className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder-purple-300/50 max-h-40 overflow-y-auto"
//         />

//         {/* Emoji Button */}
//         <div className="relative">
//           <button
//             onClick={() => setShowEmojiPicker((prev) => !prev)}
//             className="text-purple-300/70 hover:text-purple-400 transition"
//           >
//             <Smile size={18} />
//           </button>

//           {showEmojiPicker && (
//             <div className="absolute bottom-12 right-0 z-20 shadow-xl">
//               <EmojiPicker onEmojiClick={handleEmojiClick} />
//             </div>
//           )}
//         </div>

//         {/* Mic or Send */}
//         {!text.trim() && files.length === 0 ? (
//           <button
//             onClick={handleStartRecording}
//             className="text-purple-300/70 hover:text-purple-400 transition"
//           >
//             <Mic size={18} />
//           </button>
//         ) : (
//           <button
//             onClick={handleSend}
//             className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 transition active:scale-95"
//           >
//             <Send size={16} />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageInput;











// import React, { useState, useRef, useEffect } from "react";
// import { Send, Paperclip, Smile, Mic } from "lucide-react";
// import EmojiPicker from "emoji-picker-react";
// import AttachmentPreview from "./AttachmentPreview.jsx";
// import VoiceRecorder from "./VoiceRecorder.jsx";

// const MessageInput = ({ onSendMessage, conversationId }) => {
//   const [text, setText] = useState("");
//   const [files, setFiles] = useState([]);
//   const [isRecording, setIsRecording] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);

//   const fileInputRef = useRef(null);
//   const textareaRef = useRef(null);

//   // Auto resize textarea
//   useEffect(() => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//       textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
//     }
//   }, [text]);

//   // Close emoji picker when recording starts
//   useEffect(() => {
//     if (isRecording) setShowEmojiPicker(false);
//   }, [isRecording]);

//   const handleSend = async () => {
//     if (!text.trim() && files.length === 0) return;

//     // Your backend controller expects: req.body.conversationId, req.body.content, and req.file
//     // If there are multiple files, we loop to create separate messages (standard chat behavior)
//     if (files.length > 0) {
//       for (const file of files) {
//         const formData = new FormData();
//         formData.append("conversationId", conversationId);
//         formData.append("file", file);
//         // Only attach text as a caption for the first file, or leave empty
//         if (text.trim()) formData.append("content", text); 
        
//         await onSendMessage(formData);
//       }
//     } else {
//       // Pure text message
//       const formData = new FormData();
//       formData.append("conversationId", conversationId);
//       formData.append("content", text.trim());
      
//       await onSendMessage(formData);
//     }

//     setText("");
//     setFiles([]);
//     if (textareaRef.current) textareaRef.current.style.height = "auto";
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   const handleFileChange = (e) => {
//     if (!e.target.files) return;
//     // Note: Backend handles req.file (singular), so we process them individually in handleSend
//     setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files) {
//       setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
//     }
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragLeave = () => setIsDragging(false);

//   const handleEmojiClick = (emojiData) => {
//     const emoji = emojiData.emoji;
//     const textarea = textareaRef.current;
//     const start = textarea.selectionStart;
//     const end = textarea.selectionEnd;
//     const newText = text.substring(0, start) + emoji + text.substring(end);

//     setText(newText);
//     setTimeout(() => {
//       textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
//       textarea.focus();
//     }, 0);
//     setShowEmojiPicker(false);
//   };

//   const handleVoiceSend = async (audioBlob) => {
//     const audioFile = new File([audioBlob], "voice-message.webm", {
//       type: audioBlob.type || "audio/webm",
//     });

//     const formData = new FormData();
//     formData.append("conversationId", conversationId);
//     formData.append("file", audioFile);

//     await onSendMessage(formData);
//     setIsRecording(false);
//   };

//   const handleStartRecording = () => {
//     setText("");
//     setFiles([]);
//     setIsRecording(true);
//   };

//   if (isRecording) {
//     return <VoiceRecorder onCancel={() => setIsRecording(false)} onSend={handleVoiceSend} />;
//   }

//   return (
//     <div className="flex flex-col w-full max-w-5xl mx-auto gap-2 relative">
//       {files.length > 0 && (
//         <AttachmentPreview
//           files={files}
//           onRemove={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))}
//         />
//       )}

//       {isDragging && (
//         <div className="absolute inset-0 bg-purple-600/20 border-2 border-dashed border-purple-500 rounded-2xl flex items-center justify-center text-purple-200 backdrop-blur-sm z-10">
//           Drop files here 📂
//         </div>
//       )}

//       <div
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onDrop={handleDrop}
//         className="flex items-end gap-3 bg-[#1d1736] px-4 py-3 rounded-2xl border border-purple-500/20 focus-within:ring-2 focus-within:ring-purple-600/30 transition"
//       >
//         <button
//           onClick={() => fileInputRef.current?.click()}
//           className="text-purple-300/70 hover:text-purple-400 transition"
//         >
//           <Paperclip size={18} />
//         </button>

//         <input
//           type="file"
//           multiple
//           hidden
//           ref={fileInputRef}
//           onChange={handleFileChange}
//           accept="image/*,audio/*,video/*"
//         />

//         <textarea
//           ref={textareaRef}
//           rows="1"
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder="Write a message..."
//           className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder-purple-300/50 max-h-40 overflow-y-auto"
//         />

//         <div className="relative">
//           <button
//             onClick={() => setShowEmojiPicker((prev) => !prev)}
//             className="text-purple-300/70 hover:text-purple-400 transition"
//           >
//             <Smile size={18} />
//           </button>

//           {showEmojiPicker && (
//             <div className="absolute bottom-12 right-0 z-20 shadow-xl">
//               <EmojiPicker theme="dark" onEmojiClick={handleEmojiClick} />
//             </div>
//           )}
//         </div>

//         {!text.trim() && files.length === 0 ? (
//           <button
//             onClick={handleStartRecording}
//             className="text-purple-300/70 hover:text-purple-400 transition"
//           >
//             <Mic size={18} />
//           </button>
//         ) : (
//           <button
//             onClick={handleSend}
//             className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 transition active:scale-95"
//           >
//             <Send size={16} />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageInput;














import React, { useState, useRef } from 'react';
import { Paperclip, Send, Mic, Smile } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import AttachmentPreview from './AttachmentPreview';
import VoiceRecorder from './VoiceRecorder';

const MessageInput = () => {
  const { sendMessage, activeConversation, emitTyping, emitStopTyping } = useChat();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleSend = async () => {
    if (!text.trim() && !file) return;
    try {
      await sendMessage(text, file);
      setText("");
      setFile(null);
      emitStopTyping(activeConversation._id);
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const onTyping = (e) => {
    setText(e.target.value);
    emitTyping(activeConversation._id);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(activeConversation._id);
    }, 2000);
  };

  if (isRecording) {
    return <div className="p-4 bg-black border-t border-gray-800"><VoiceRecorder onCancel={() => setIsRecording(false)} onSend={handleSend} /></div>;
  }

  return (
    <div className="p-4 bg-black border-t border-gray-800 relative">
      <AttachmentPreview file={file} onClear={() => setFile(null)} />
      
      <div className="flex items-end gap-3 max-w-6xl mx-auto">
        <div className="flex gap-2 pb-1">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-purple-500 transition-colors">
            <Paperclip size={22} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files[0])} />
        </div>

        <div className="flex-1 bg-[#111] border border-gray-800 rounded-2xl flex items-end px-3 py-2 focus-within:border-purple-500/50 transition-colors">
          <textarea 
            rows="1"
            placeholder="Type a message..."
            value={text}
            onChange={onTyping}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm py-1 max-h-32 resize-none"
          />
          <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
            <Smile size={20} />
          </button>
        </div>

        <button 
          onClick={text.trim() || file ? handleSend : () => setIsRecording(true)}
          className="p-3 bg-linear-to-r from-purple-500 to-purple-700 text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          {text.trim() || file ? <Send size={20} /> : <Mic size={20} />}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;