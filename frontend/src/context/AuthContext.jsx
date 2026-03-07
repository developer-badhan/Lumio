import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on mount
  // On every page load/refresh we check if a valid access token exists in
  // localStorage. If it does, we call GET /auth/me to restore the user object.
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch (err) {
          // Token is invalid / expired and refresh also failed (axios interceptor
          // already attempted a refresh before this catch runs)
          localStorage.removeItem('token');
          setUser(null);
        }
      }

      // Always mark loading as done — ProtectedLayout depends on this
      setLoading(false);
    };

    checkAuth();
  }, []);

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };


  // Store verifyToken after registration 
  // Called by Register.jsx after POST /auth/register succeeds.
  const setPreVerifyToken = (verifyToken) => {
    localStorage.setItem('verifyToken', verifyToken);
  };


  // Called by Login.jsx after POST /auth/login succeeds.
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.removeItem('verifyToken'); 
    setUser(userData);
  };


  // Calls POST /auth/logout to clear the httpOnly refreshToken cookie on the
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // clear the client state so the user isn't stuck logged in locally
      console.error("Logout API failed:", err);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('verifyToken');
    setUser(null);
    window.location.href = '/login';
  };


  return (
    // updateUser is now exposed alongside the existing values
    <AuthContext.Provider value={{ user, login, logout, loading, setPreVerifyToken, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);