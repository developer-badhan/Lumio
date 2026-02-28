import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    // Placeholder for API call
    console.log('Logging in with:', credentials);
    // const response = await authService.login(credentials);
    // setToken(response.token);
    // setUser(response.user);
    setLoading(false);
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    // Placeholder for API call
    console.log('Registering user:', userData);
    setLoading(false);
  }, []);

  const verifyOTP = useCallback(async (otp) => {
    setLoading(true);
    // Placeholder for API call
    console.log('Verifying OTP:', otp);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, verifyOTP }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for cleaner usage in components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};




// import { createContext, useContext, useEffect, useState } from "react"
// import axios from "../services/axios"

// const AuthContext = createContext()

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)

//   const getMe = async () => {
//     try {
//       const { data } = await axios.get("/auth/me")
//       setUser(data.user)
//     } catch (error) {
//       setUser(null)
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     getMe()
//   }, [])

//   return (
//     <AuthContext.Provider value={{ user, setUser, loading, getMe }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export const useAuth = () => useContext(AuthContext)