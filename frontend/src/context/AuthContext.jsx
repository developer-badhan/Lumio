import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/axios';
import { 
  updateProfile as updateProfileApi, 
  deleteAccount as deleteAccountApi 
} from '../services/profile';

/**
 * AuthContext manages authentication state and actions across the app. It provides:
 * - user: The current authenticated user's data (or null if not authenticated)
 * - login(token, userData): Call on successful login to store token and user info
 * - logout(): Call to log out the user, clear tokens, and redirect to login page
 * - loading: Indicates if the auth state is still being determined (e.g. on app load)
 * - setPreVerifyToken(token): Store the verifyToken after registration for later use in email verification
 * - updateUser(updatedUserData): Directly update the user state (used for real-time updates from socket events)
 * - updateProfile(payload): Call API to update user profile, then merge changes into user state
 * deleteAccount(): Call API to delete account, then clear state and redirect
 * you can use the useAuth() hook in any component to access these values and functions.
 * 
 * On app load, it checks for an existing token and tries to rehydrate the user session by calling GET /auth/me.
 * If the token is invalid or expired, it clears the token and sets user to null.
 * The loading state is used to prevent rendering protected routes until we've determined if the user is authenticated or not.
 */

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

  // ── Directly set user state (used by socket online/offline events) 
  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  // ── Call API + update local state 
  // Returns { success, user, error } — Settings.jsx uses this to show feedback.
  const updateProfile = async (payload) => {
    try {
      const { data } = await updateProfileApi(payload);
      // Merge updated fields into existing user state so unrelated fields
      // (isOnline, lastSeen, etc.) are preserved.
      setUser(prev => ({ ...prev, ...data.user }));
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      return { success: false, error: message };
    }
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


  // Calls DELETE /auth/delete-account, then wipes local state and redirects.
  // Returns { success, error } so Settings.jsx can show feedback before redirecting.
  const deleteAccount = async () => {
    try {
      await deleteAccountApi();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete account.';
      return { success: false, error: message };
    }
    // Wipe everything regardless of API result
    localStorage.removeItem('token');
    localStorage.removeItem('verifyToken');
    setUser(null);
    window.location.href = '/login';
    return { success: true };
  };


  return (
    // updateUser is now exposed alongside the existing values
    <AuthContext.Provider value={{ 
        user, 
        login, 
        logout, 
        loading, 
        setPreVerifyToken, 
        updateUser,
        updateProfile,
        deleteAccount
       }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);