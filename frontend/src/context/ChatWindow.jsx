import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Send, Image as ImageIcon, Paperclip, MoreVertical } from 'lucide-react';

const ChatWindow = () => {
  const { activeChat, messages, sendMessage, fetchMessages, loading } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load messages when chat changes
  useEffect(() => {
    if (activeChat) fetchMessages(activeChat._id);
  }, [activeChat, fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) await sendMessage('', file);
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-screen bg-white">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src={activeChat.participants?.find(p => p._id !== user._id)?.profilePic || '/default-avatar.png'} 
            className="w-10 h-10 rounded-full object-cover" 
            alt="avatar"
          />
          <div>
            <h3 className="font-bold text-gray-800">
              {activeChat.type === 'group' ? activeChat.groupName : activeChat.participants?.find(p => p._id !== user._id)?.name}
            </h3>
            <span className="text-xs text-green-500">Online</span>
          </div>
        </div>
        <MoreVertical className="text-gray-500 cursor-pointer" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5]">
        {messages.map((msg) => {
          const isMe = msg.sender._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
              }`}>
                {/* Media Content */}
                {msg.messageType === 'image' && (
                  <img src={msg.media.url} alt="sent" className="rounded mb-2 max-w-full h-auto" />
                )}
                {msg.messageType === 'video' && (
                  <video controls src={msg.media.url} className="rounded mb-2 max-w-full" />
                )}
                
                {/* Text Content */}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t flex items-center gap-2">
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*"
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current.click()}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
        >
          <Paperclip size={20} />
        </button>
        
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;