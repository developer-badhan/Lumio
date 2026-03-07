// import React from "react";
// import { Check, CheckCheck, Clock } from "lucide-react";

// const ChatBubble = ({
//   message,
//   isMe,
//   timestamp,
//   status = "sent",
//   avatar,
//   username,
// }) => {
//   const renderStatusIcon = () => {
//     if (!isMe) return null;

//     switch (status) {
//       case "sending":
//         return <Clock size={12} className="text-purple-300 animate-pulse" />;
//       case "sent":
//         return <Check size={12} className="text-purple-300" />;
//       case "delivered":
//         return <CheckCheck size={12} className="text-purple-300" />;
//       case "read":
//         // keep blue only for read tick (as requested)
//         return <CheckCheck size={12} className="text-blue-500" />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <div
//       className={`flex w-full mb-4 items-end ${
//         isMe ? "justify-end" : "justify-start"
//       }`}
//     >
//       {/* Avatar (other user) */}
//       {!isMe && (
//         <div className="w-8 h-8 rounded-full overflow-hidden mr-3 shrink-0 border border-purple-500/20">
//           {avatar ? (
//             <img
//               src={avatar}
//               alt="avatar"
//               className="w-full h-full object-cover"
//             />
//           ) : (
//             <div className="w-full h-full bg-purple-600 flex items-center justify-center text-xs font-semibold text-white">
//               {username?.charAt(0).toUpperCase() || "U"}
//             </div>
//           )}
//         </div>
//       )}

//       <div
//         className={`group relative max-w-[75%] sm:max-w-[65%] flex flex-col ${
//           isMe ? "items-end" : "items-start"
//         }`}
//       >
//         {/* Username */}
//         {!isMe && username && (
//           <span className="text-xs text-purple-300/60 mb-1 ml-1">
//             {username}
//           </span>
//         )}

//         {/* Bubble */}
//         <div
//           className={`
//             relative px-4 py-3 rounded-2xl text-sm leading-relaxed wrap-break-word
//             transition-all duration-300 transform
//             animate-[fadeIn_0.25s_ease-out]
//             ${
//               isMe
//                 ? "bg-linear-to-br from-purple-600 to-purple-700 text-white rounded-br-none shadow-lg shadow-purple-900/40"
//                 : "bg-[#1d1736] text-white border border-purple-500/10 rounded-bl-none"
//             }
//           `}
//         >
//           {/* Subtle animated glow layer */}
//           <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 bg-purple-500/5 blur-xl pointer-events-none" />

//           <span className="relative z-10">{message}</span>
//         </div>

//         {/* Metadata */}
//         <div
//           className={`
//             flex items-center mt-1 gap-1.5 px-1 
//             opacity-0 group-hover:opacity-100 
//             transition-all duration-200
//           `}
//         >
//           <span className="text-[10px] font-medium text-purple-300/50">
//             {timestamp}
//           </span>

//           {renderStatusIcon()}
//         </div>

//         {/* Reaction Micro Interaction */}
//         <div
//           className={`
//             absolute -bottom-2 opacity-0 group-hover:opacity-100 
//             transition-all duration-200 scale-90 group-hover:scale-100
//             ${isMe ? "-left-14" : "-right-14"}
//             flex gap-1
//           `}
//         >
//           <button className="text-xs bg-[#151129] border border-purple-500/20 px-2 py-0.5 rounded-full hover:bg-purple-600 transition">
//             👍
//           </button>
//           <button className="text-xs bg-[#151129] border border-purple-500/20 px-2 py-0.5 rounded-full hover:bg-purple-600 transition">
//             ❤️
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatBubble;






// import React from "react";
// import { Check, CheckCheck, Clock } from "lucide-react";

// const ChatBubble = ({
//   msg, // The full message object from MongoDB
//   currentUserId,
// }) => {
//   const isMe = msg.sender?._id === currentUserId || msg.sender === currentUserId;
//   const username = msg.sender?.name || "User";
//   const avatar = msg.sender?.profilePic;
//   const timestamp = new Date(msg.createdAt).toLocaleTimeString([], { 
//     hour: '2-digit', 
//     minute: '2-digit' 
//   });

//   // Backend logic for status ticks
//   const renderStatusIcon = () => {
//     if (!isMe) return null;
    
//     // In a private chat, if readBy has more than 1 ID, the other person read it
//     const isRead = msg.readBy?.length > 1;
//     const isDelivered = msg.deliveredTo?.length > 1;

//     if (isRead) return <CheckCheck size={12} className="text-blue-500" />;
//     if (isDelivered) return <CheckCheck size={12} className="text-purple-300" />;
//     return <Check size={12} className="text-purple-300" />;
//   };

//   // Logic to render different media types based on backend schema
//   const renderContent = () => {
//     if (msg.isDeleted) {
//       return <span className="italic opacity-60">This message was deleted</span>;
//     }

//     switch (msg.messageType) {
//       case "image":
//         return (
//           <div className="flex flex-col gap-2">
//             <img 
//               src={msg.media?.url} 
//               alt="Sent content" 
//               className="rounded-lg max-h-60 w-full object-cover border border-purple-500/20" 
//             />
//             {msg.content && <span>{msg.content}</span>}
//           </div>
//         );
//       case "video":
//         return (
//           <div className="flex flex-col gap-2">
//             <video 
//               src={msg.media?.url} 
//               controls 
//               className="rounded-lg max-h-60 w-full border border-purple-500/20" 
//             />
//             {msg.content && <span>{msg.content}</span>}
//           </div>
//         );
//       case "audio":
//       case "voice":
//         return (
//           <div className="flex flex-col gap-1 min-w-50">
//             <audio src={msg.media?.url} controls className="h-8 w-full accent-purple-500" />
//             {msg.messageType === "voice" && <span className="text-[10px] opacity-50">Voice Message</span>}
//           </div>
//         );
//       default:
//         return <span>{msg.content}</span>;
//     }
//   };

//   return (
//     <div className={`flex w-full mb-4 items-end ${isMe ? "justify-end" : "justify-start"}`}>
//       {/* Avatar (other user) */}
//       {!isMe && (
//         <div className="w-8 h-8 rounded-full overflow-hidden mr-3 shrink-0 border border-purple-500/20">
//           {avatar ? (
//             <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
//           ) : (
//             <div className="w-full h-full bg-purple-600 flex items-center justify-center text-xs font-semibold text-white">
//               {username.charAt(0).toUpperCase()}
//             </div>
//           )}
//         </div>
//       )}

//       <div className={`group relative max-w-[75%] sm:max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
//         {/* Username */}
//         {!isMe && username && (
//           <span className="text-xs text-purple-300/60 mb-1 ml-1">{username}</span>
//         )}

//         {/* Bubble */}
//         <div
//           className={`
//             relative px-4 py-3 rounded-2xl text-sm leading-relaxed wrap-break-word
//             transition-all duration-300 transform
//             animate-[fadeIn_0.25s_ease-out]
//             ${
//               isMe
//                 ? "bg-linear-to-br from-purple-600 to-purple-700 text-white rounded-br-none shadow-lg shadow-purple-900/40"
//                 : "bg-[#1d1736] text-white border border-purple-500/10 rounded-bl-none"
//             }
//           `}
//         >
//           {/* Subtle animated glow layer */}
//           <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 bg-purple-500/5 blur-xl pointer-events-none" />

//           <div className="relative z-10">
//             {renderContent()}
//             {msg.isEdited && !msg.isDeleted && (
//               <span className="text-[10px] opacity-40 ml-2">(edited)</span>
//             )}
//           </div>
//         </div>

//         {/* Metadata */}
//         <div className="flex items-center mt-1 gap-1.5 px-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
//           <span className="text-[10px] font-medium text-purple-300/50">
//             {timestamp}
//           </span>
//           {renderStatusIcon()}
//         </div>

//         {/* Reaction Micro Interaction */}
//         <div className={`absolute -bottom-2 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 ${isMe ? "-left-14" : "-right-14"} flex gap-1`}>
//           <button className="text-xs bg-[#151129] border border-purple-500/20 px-2 py-0.5 rounded-full hover:bg-purple-600 transition">👍</button>
//           <button className="text-xs bg-[#151129] border border-purple-500/20 px-2 py-0.5 rounded-full hover:bg-purple-600 transition">❤️</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatBubble;
















import React from 'react';
import { Check, CheckCheck, Play } from 'lucide-react';

const ChatBubble = ({ message, isOwn }) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isRead = message.readBy && message.readBy.length > 0;

  return (
    <div className={`flex flex-col mb-4 max-w-[75%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
      <div 
        className={`px-4 py-2 rounded-2xl relative group ${
          isOwn 
            ? 'bg-linear-to-r from-purple-600 to-purple-800 text-white rounded-br-sm' 
            : 'bg-[#1a1a1a] border border-gray-800 text-gray-100 rounded-bl-sm'
        } ${message.isOptimistic ? 'opacity-70' : ''}`}
      >
        {/* Render Image */}
        {message.messageType === 'image' && message.fileUrl && (
          <img 
            src={message.fileUrl} 
            alt="Attachment" 
            className="max-w-62.5 rounded-lg mb-2 object-cover border border-black/20"
          />
        )}

        {/* Render Audio */}
        {message.messageType === 'audio' && message.fileUrl && (
          <div className="flex items-center gap-3 w-48 bg-black/20 p-2 rounded-full mb-1">
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <Play size={14} className="ml-1 text-white" />
            </button>
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-purple-400 rounded-full" />
            </div>
          </div>
        )}

        {/* Render Text */}
        {message.content && (
          <p className="text-[15px] leading-relaxed wrap-break-word">{message.content}</p>
        )}

        {/* Timestamp and Read Receipts */}
        <div className={`flex items-center gap-1 mt-1 text-[11px] select-none ${isOwn ? 'text-purple-200/70 justify-end' : 'text-gray-500'}`}>
          <span>{time}</span>
          {isOwn && (
             isRead ? <CheckCheck size={14} className="text-blue-400" /> : <Check size={14} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;