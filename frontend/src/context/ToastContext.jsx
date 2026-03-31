import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';

/**
 * ToastContext provides a way to manage and display toast notifications across the app.
 * It includes an addToast function to trigger new toasts and automatically removes them after 5 seconds.
 * Usage:
 * const { addToast } = useToast();
 * addToast('This is a toast message!', 'success'); // type can be 'success', 'error', etc.
 * The ToastProvider should wrap the part of the app where you want to use toasts, typically at a high level in the component tree.
 * Example:
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-999 flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            {...toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);