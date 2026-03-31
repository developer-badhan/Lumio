import { useContext } from 'react';
import { CallContext } from '../context/CallContext.jsx';

// Custom hook to access the CallContext
export const useCall = () => {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error('useCall must be used inside a <CallProvider>');
  }

  return context;
};