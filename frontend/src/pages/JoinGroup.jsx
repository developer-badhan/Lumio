import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, Loader2, Check, AlertTriangle } from 'lucide-react';
import * as groupService from '../services/group';
import { useChat } from '../hooks/useChat';

/**
 * JoinGroup page — /join-group?token=<jwt>
 *
 * Validates the invite token, shows a preview, and joins the group.
 * After a successful join the user is redirected to /dashboard and
 * the new conversation is selected automatically via the socket event
 * group:member-added → ChatContext.loadConversations().
 */
const JoinGroup = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { loadConversations, selectConversation } = useChat();

  const token = params.get('token');

  const [status,    setStatus]    = useState('idle'); // idle | joining | success | error
  const [error,     setError]     = useState('');
  const [groupInfo, setGroupInfo] = useState(null);    // { groupId, groupName }

  // Decode the groupName from the JWT payload (no secret needed — just reading claims)
  useEffect(() => {
    if (!token) { setStatus('error'); setError('Invalid invite link — no token found.'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.type !== 'group_invite') throw new Error();
      setGroupInfo({ groupId: payload.groupId });
    } catch {
      setStatus('error');
      setError('This invite link is invalid or has expired.');
    }
  }, [token]);

  const handleJoin = async () => {
    setStatus('joining');
    setError('');
    try {
      const { data } = await groupService.joinViaInvite(token);
      setGroupInfo(prev => ({ ...prev, groupName: data.groupName }));
      setStatus('success');

      // Give the socket event a moment to update the conversation list, then redirect
      setTimeout(async () => {
        await loadConversations();
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setStatus('error');
      setError(err?.response?.data?.message ?? 'Failed to join the group. The link may have expired.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#0f0e1a] border border-purple-500/20 rounded-2xl shadow-2xl
        w-full max-w-sm p-8 flex flex-col items-center gap-6 text-center">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-purple-600/15 flex items-center justify-center">
          {status === 'success'
            ? <Check size={28} className="text-emerald-400" />
            : status === 'error'
              ? <AlertTriangle size={28} className="text-red-400" />
              : <Users size={28} className="text-purple-400" />
          }
        </div>

        {/* Text */}
        {status === 'idle' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-white">You're invited!</h1>
              <p className="text-sm text-gray-500 mt-2">
                You've been invited to join a group on Lumio.
              </p>
            </div>
            <button
              onClick={handleJoin}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700
                text-white font-semibold text-sm transition-colors"
            >
              Join Group
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              No thanks
            </button>
          </>
        )}

        {status === 'joining' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-white">Joining…</h1>
              <p className="text-sm text-gray-500 mt-1">Please wait</p>
            </div>
            <Loader2 size={28} className="text-purple-400 animate-spin" />
          </>
        )}

        {status === 'success' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-white">You're in!</h1>
              <p className="text-sm text-gray-500 mt-1">Redirecting to your chats…</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div>
              <h1 className="text-lg font-bold text-white">Invite Invalid</h1>
              <p className="text-sm text-red-400/80 mt-2">{error}</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-xl border border-gray-800 hover:bg-white/3
                text-sm text-gray-400 hover:text-white transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default JoinGroup;