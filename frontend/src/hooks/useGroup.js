import { useContext } from 'react';
import GroupContext from '../context/GroupContext';

// Custom hook to access the GroupContext
export const useGroup = () => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used inside <GroupProvider>');
  return ctx;
};
