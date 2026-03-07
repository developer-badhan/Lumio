// import React, { useEffect, useRef } from 'react';
// import { useChat } from '../../context/ChatContext.jsx';
// import { useAuth } from '../../context/AuthContext.jsx';
// import { useSocket } from '../../hooks/useSocket.js';
// import { Phone, Video, Info } from 'lucide-react';
// import ChatBubble from './ChatBubble.jsx'; 
// import MessageInput from './MessageInput.jsx'; 
// import TypingIndicator from './TypingIndicator.jsx';
// import Avatar from '../ui/Avatar.jsx';

// const ChatWindow = () => {
//   const { activeChat, messages, sendMessage, fetchMessages, loading } = useChat();
//   const { user } = useAuth();
//   const { onlineUsers } = useSocket();
//   const messagesRef = useRef(null);

//   useEffect(() => {
//     if (activeChat) fetchMessages(activeChat._id);
//   }, [activeChat, fetchMessages]);

//   useEffect(() => {
//     messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
//   }, [messages]);

//   if (!activeChat) {
//     return (
//       <div className="flex-1 flex flex-col items-center justify-center bg-[#0f0b1f] relative">
//         <div className="absolute inset-0 bg-linear-to-br from-purple-900/5 to-black opacity-40 pointer-events-none" />
//         <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
//           <svg viewBox="0 0 24 24" className="w-10 h-10 text-purple-500 opacity-50" fill="currentColor">
//             <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
//           </svg>
//         </div>
//         <h3 className="text-xl font-bold text-white mb-2">Your Space Awaits</h3>
//         <p className="text-purple-300/50 text-sm">Select a conversation to start a new connection.</p>
//       </div>
//     );
//   }

//   const otherUser = activeChat.type === 'private' 
//     ? activeChat.participants.find(p => p._id !== user._id) 
//     : null;
//   const isOnline = otherUser && onlineUsers.includes(otherUser._id);

//   return (
//     <main className="flex-1 flex flex-col relative z-10 bg-[#0f0b1f]">
//       {/* Header */}
//       <header className="h-16 flex items-center justify-between px-6 border-b border-purple-500/10 bg-[#151129]">
//         <div className="flex items-center gap-3">
//           <Avatar 
//             name={activeChat.type === 'group' ? activeChat.groupName : otherUser?.name} 
//             src={activeChat.type === 'private' ? otherUser?.profilePic : null}
//             size="sm" 
//             status={isOnline ? "online" : "offline"} 
//           />
//           <div>
//             <p className="font-semibold text-white">{activeChat.type === 'group' ? activeChat.groupName : otherUser?.name}</p>
//             <span className="text-xs text-purple-300/60">
//               {isOnline ? "Active Now" : "Offline"}
//             </span>
//           </div>
//         </div>

//         <div className="flex items-center gap-6 text-purple-300">
//           <button className="hover:text-white transition"><Phone size={20} /></button>
//           <button className="hover:text-white transition"><Video size={20} /></button>
//           <button className="hover:text-white transition"><Info size={20} /></button>
//         </div>
//       </header>

//       {/* Messages Scroll Area */}
//       <div ref={messagesRef} className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
//         <div className="max-w-3xl mx-auto space-y-4">
//           {messages.map((msg) => {
//             const isMe = msg.sender._id === user._id || msg.sender === user._id;
            
//             return (
//               <div key={msg._id} className="animate-fadeIn">
//                 <ChatBubble
//                   message={msg.content}
//                   isMe={isMe}
//                   timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                   status={msg.deliveredTo.length > 0 ? (msg.readBy.length > 1 ? "read" : "delivered") : "sent"}
//                   username={!isMe ? (msg.sender.name || otherUser?.name) : undefined}
//                   avatar={!isMe ? (msg.sender.profilePic || otherUser?.profilePic) : undefined}
//                   // Handling your specific media types from backend
//                   media={msg.media} 
//                   messageType={msg.messageType}
//                 />
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Footer */}
//       <footer className="p-4 border-t border-purple-500/10 bg-[#151129]">
//         <div className="max-w-3xl mx-auto">
//           <MessageInput onSendMessage={(data) => sendMessage(data.text, data.files?.[0])} />
//         </div>
//         <p className="text-center text-[10px] text-purple-300/30 mt-2 uppercase tracking-widest">
//           End-to-End Encrypted
//         </p>
//       </footer>
//     </main>
//   );
// };

// export default ChatWindow;








import React, { useEffect, useRef } from 'react';
import { Phone, Video, MoreVertical, Shield } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Avatar from '../ui/Avatar';

const ChatWindow = () => {
  const { activeConversation, messages, messagesLoading, typingUsers } = useChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const isTyping = typingUsers[activeConversation?._id]?.size > 0;
  const displayName = activeConversation.isGroup ? activeConversation.groupName : activeConversation.participants[0]?.name;

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Avatar src={!activeConversation.isGroup ? activeConversation.participants[0]?.avatar : null} fallback={displayName?.charAt(0)} />
          <div>
            <h2 className="text-white font-semibold text-sm leading-tight">{displayName}</h2>
            <p className="text-[10px] text-purple-400 flex items-center gap-1">
              {isTyping ? "typing..." : <><Shield size={10} /> End-to-end encrypted</>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-purple-500 transition-colors"><Phone size={20} /></button>
          <button className="hover:text-purple-500 transition-colors"><Video size={20} /></button>
          <button className="hover:text-purple-500 transition-colors"><MoreVertical size={20} /></button>
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col custom-scrollbar bg-[url('https://i.ibb.co/0V3Zp5Z/chat-bg.png')] bg-repeat bg-center opacity-95">
        {messagesLoading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Loading history...</div>
        ) : (
          messages.map((msg) => (
            <ChatBubble key={msg._id} message={msg} isOwn={msg.sender?._id === 'me' || msg.sender === 'me'} />
          ))
        )}
        {isTyping && <TypingIndicator />}
        <div ref={scrollRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatWindow;