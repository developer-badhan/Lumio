import React, { useEffect, useRef, useContext } from 'react';
import { Phone, Video, MoreVertical, Shield, Info } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Avatar from '../ui/Avatar';
import AnimatedChatBackground from '../ui/AnimatedChatBackground';


const ChatWindow = () => {

  const { activeConversation, messages, messagesLoading, typingUsers } = useChat();
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useContext(SocketContext);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

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

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">

      <AnimatedChatBackground />

      {/* Header */}
      <header className="h-16 border-b border-purple-900/40 flex items-center justify-between px-6 backdrop-blur-xl bg-black/50 z-10 shrink-0">

        {/* LEFT */}
        <div className="flex items-center gap-3">

          {/* Avatar */}
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

              {isTyping
                ? "typing..."
                : isOtherOnline && !isGroup
                  ? <span className="text-emerald-400">Online</span>
                  : <>
                      <Shield size={10}/>
                      End-to-end encrypted
                    </>
              }

            </p>
          </div>

        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2">

          <button className="action-btn">
            <Phone size={20}/>
          </button>

          <button className="action-btn">
            <Video size={20}/>
          </button>

          <button className="action-btn">
            <Info size={20}/>
          </button>

          <button className="action-btn">
            <MoreVertical size={20}/>
          </button>

        </div>

      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar relative z-10">

        {messagesLoading && messages.length === 0 ? (

          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Loading history...
          </div>

        ) : (

          messages.map((msg) => {

            const senderId = msg.sender?._id ?? msg.sender;
            const isOwn = senderId === currentUser?._id || senderId === "me";

            return (
              <ChatBubble
                key={msg._id}
                message={msg}
                isOwn={isOwn}
              />
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