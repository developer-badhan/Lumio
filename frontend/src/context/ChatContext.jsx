import React, { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const fetchChats = useCallback(async () => {
    // Placeholder for API call to fetch chat list
    console.log('Fetching conversations...');
    // const data = await chatService.getConversations();
    // setConversations(data);
  }, []);

  const sendMessage = useCallback(async (content) => {
    if (!activeChat) return;
    
    // Optimistic UI update for premium feel
    const tempMessage = {
      id: Date.now(),
      content,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    // Placeholder for API call
    console.log('Sending message:', content, 'to chat:', activeChat.id);
  }, [activeChat]);

  return (
    <ChatContext.Provider value={{ 
      conversations, 
      activeChat, 
      setActiveChat,
      messages, 
      isTyping,
      sendMessage, 
      fetchChats 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};