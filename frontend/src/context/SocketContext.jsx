import React, { createContext, useEffect, useState } from 'react';
import { socket } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, loading } = useAuth();
  // We'll store online users in an array of user IDs
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Only attempt connection if auth check is done and user exists
    if (!loading && user) {
      const token = localStorage.getItem('token');
      
      // Attach token for your backend socket auth middleware
      socket.auth = { token };
      socket.connect();

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      // Listen for the online/offline events from backend
      socket.on('user-status-change', ({ userId, isOnline }) => {
        setOnlineUsers((prev) => {
          if (isOnline) {
            if (!prev.includes(userId)) return [...prev, userId];
            return prev;
          } else {
            return prev.filter((id) => id !== userId);
          }
        });
      });

      // Cleanup on unmount or when user logs out
      return () => {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('user-status-change');
        socket.disconnect();
      };
    }
  }, [user, loading]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};