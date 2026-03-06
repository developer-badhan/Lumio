import React, { createContext, useEffect, useState } from 'react';
import { socket } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';
import api from '../services/axios.js';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!loading && user) {
      const token = localStorage.getItem('token');

      // 1. Set Auth Token
      socket.auth = { token };

      // Handlers 
      const handleConnect = () => {
        console.log('Socket connected:', socket.id);
      };

      const handleConnectError = async (err) => {
        if (err.message === 'Authentication failed') {
          console.warn('Socket: access token expired — attempting refresh');

          try {
            const { data } = await api.post('/auth/refresh-token');
            const newToken = data.accessToken;
            localStorage.setItem('token', newToken);

            socket.auth = { token: newToken };
            socket.connect();
          } catch (refreshError) {
            console.error('Socket: refresh failed — user will be logged out', refreshError);
          }
        } else if (err.message === 'Authentication token missing') {
          console.error('Socket: token missing on connect attempt — check ProtectedRoute guard');
        } else {
          console.error('Socket connection error:', err.message);
        }
      };

      const handleStatusChange = ({ userId, isOnline }) => {
        setOnlineUsers((prev) => {
          if (isOnline) {
            if (!prev.includes(userId)) return [...prev, userId];
            return prev;
          } else {
            return prev.filter((id) => id !== userId);
          }
        });
      };

      // NEW: Handler for the initial list of online users
      const handleInitialUsers = (users) => {
        setOnlineUsers(users);
      };

      // 2. Attach all listeners BEFORE connecting to ensure no events are missed
      socket.on('connect', handleConnect);
      socket.on('connect_error', handleConnectError);
      socket.on('user-status-change', handleStatusChange);
      socket.on('initial-online-users', handleInitialUsers);

      // 3. Finally, initiate connection
      socket.connect();

      // cleanup of previous effect fires → socket disconnects cleanly.
      return () => {
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleConnectError);
        socket.off('user-status-change', handleStatusChange);
        socket.off('initial-online-users', handleInitialUsers);
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