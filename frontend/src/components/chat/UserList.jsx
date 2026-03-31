import React, { useEffect, useState, useContext, useMemo } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { fetchAllUsers } from '../../services/auth';
import Avatar from '../ui/Avatar';
import { Sparkles } from 'lucide-react';

// Detect Lumio AI user
const isAIUser = (user) => user?.name === 'Lumio AI';

// Format lastSeen into a human-readable relative string
const formatLastSeen = (date) => {
  if (!date) return 'Offline';

  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 1)   return 'Last seen just now';
  if (mins < 60)  return `Last seen ${mins}m ago`;
  if (hours < 24) return `Last seen ${hours}h ago`;
  if (days === 1) return 'Last seen yesterday';
  return `Last seen ${days}d ago`;
};

const UserList = ({ onUserSelect }) => {
  const { onlineUsers }             = useContext(SocketContext);
  const { user: currentUser }       = useAuth();
  const { openPrivateConversation } = useChat();

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [opening, setOpening]   = useState(null); 

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchAllUsers();
        const others = data.users.filter(u => u._id !== currentUser?._id);
        setAllUsers(others);
      } catch (err) {
        setError('Failed to load users.');
        console.error('UserList fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?._id]);

  const enrichedUsers = useMemo(() => {
    return allUsers.map(user => ({
      ...user,
      isOnline: isAIUser(user) ? true : onlineUsers.includes(user._id),
    }));
  }, [allUsers, onlineUsers]);

  // Sort: AI first, then online, then alphabetical
  const sortedUsers = useMemo(() => {
    return [...enrichedUsers].sort((a, b) => {
      const aAI = isAIUser(a);
      const bAI = isAIUser(b);

      if (aAI !== bAI) return aAI ? -1 : 1;
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [enrichedUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedUsers;
    return sortedUsers.filter(
      u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [sortedUsers, search]);

  const handleUserClick = async (user) => {
    if (opening) return;
    setOpening(user._id);
    try {
      await openPrivateConversation(user._id);
      onUserSelect?.();
    } catch (err) {
      console.error('Failed to open conversation:', err);
    } finally {
      setOpening(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-2 pt-2 space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-800 rounded animate-pulse w-2/3" />
              <div className="h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div>
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-purple-400 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const onlineCount = filteredUsers.filter(u => u.isOnline).length;

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <input
          type="text"
          placeholder="Search people..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#111] border border-gray-800 rounded-xl py-2 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all"
        />
      </div>

      {/* Online count */}
      {onlineCount > 0 && (
        <div className="px-4 pb-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {onlineCount} online now
          </span>
        </div>
      )}

      {/* User list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            No users found
          </div>
        ) : (
          filteredUsers.map(user => {
            const isAI = isAIUser(user);

            return (
              <button
                key={user._id}
                onClick={() => handleUserClick(user)}
                disabled={!!opening}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors text-left group disabled:opacity-60"
              >
                {/* Avatar */}
                {isAI ? (
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-teal-600/20 border border-teal-500/30 flex items-center justify-center">
                      <Sparkles size={18} className="text-teal-400" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                  </div>
                ) : (
                  <Avatar
                    src={user.profilePic}
                    fallback={user.name?.charAt(0)?.toUpperCase()}
                    alt={user.name}
                    online={user.isOnline}
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                      {user.name}
                    </p>

                    {isAI && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                        bg-teal-500/15 text-teal-400 border border-teal-500/20">
                        AI
                      </span>
                    )}
                  </div>

                  <p className={`text-xs truncate mt-0.5 ${user.isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {isAI ? 'AI Assistant' : (user.isOnline ? 'Online' : formatLastSeen(user.lastSeen))}
                  </p>
                </div>

                {opening === user._id && (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserList;