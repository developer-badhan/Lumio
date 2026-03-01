import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user on page refresh if token exists
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch (err) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Accepts token + user from Login.jsx — no duplicate API call
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // clears the httpOnly refresh token cookie
    } catch (err) {
      // proceed with local cleanup even if backend call fails
    }
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);