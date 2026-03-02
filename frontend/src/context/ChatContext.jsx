import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/axios';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/chats');
      setChats(data);
    } catch (err) { console.error("Error fetching chats", err); }
  };

  const sendMessage = async (content) => {
    if (!content.trim() || !activeChat) return;
    
    // Optimistic UI Update
    const tempMsg = { id: Date.now(), content, isMe: true, timestamp: new Date() };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post(`/chats/${activeChat.id}/messages`, { content });
    } catch (err) {
      // Rollback logic here if needed
      console.error("Failed to send message", err);
    }
  };

  return (
    <ChatContext.Provider value={{ chats, activeChat, setActiveChat, messages, sendMessage, fetchChats, loading }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);