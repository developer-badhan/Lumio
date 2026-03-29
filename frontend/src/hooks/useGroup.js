import { useContext } from 'react';
import GroupContext from '../context/GroupContext';

export const useGroup = () => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used inside <GroupProvider>');
  return ctx;
};
