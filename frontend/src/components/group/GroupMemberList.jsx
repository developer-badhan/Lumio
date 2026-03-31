import React, { useState, useCallback } from 'react';
import { Search, MoreVertical, Crown, Shield, Loader2, Sparkles } from 'lucide-react';
import { useGroup } from '../../hooks/useGroup';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../ui/Avatar';
import MemberActionMenu from './MemberActionMenu';


/*
** This component displays the list of group members in the Group Info Panel.
** It supports searching, shows role badges, and provides admin actions via a dropdown menu.
** Admin actions include promoting/demoting members, removing members, and transferring ownership.
** The list is sorted by role (owner > admin > member) and then alphabetically.
** The component also handles loading states and shows appropriate feedback for actions.
** The isAIUser function is used to detect if a member is the Lumio AI user, which is always shown as online.
*/

const ROLE_ORDER = { super_admin: 0, admin: 1, member: 2 };

const RoleBadge = ({ role }) => {
  if (role === 'super_admin') return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400
      bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
      <Crown size={9} />Owner
    </span>
  );
  if (role === 'admin') return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-400
      bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-full">
      <Shield size={9} />Admin
    </span>
  );
  return null;
};

const GroupMemberList = ({ compact = false }) => {
  const {
    members, isLoadingGroup, myRole,
    handlePromote, handleDemote,
    handleRemoveMember, handleTransferOwnership,
  } = useGroup();
  const { user: currentUser } = useAuth();
  const { showToast }         = useToast?.() ?? {};

  const [search,      setSearch]      = useState('');
  const [menuOpen,    setMenuOpen]    = useState(null); // member._id or null
  const [actionLoading, setActionLoading] = useState(null);

  const sorted = [...members]
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2))
    .filter(m =>
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
    );

  const withLoading = useCallback(async (memberId, fn, successMsg) => {
    setActionLoading(memberId);
    try {
      await fn();
      showToast?.({ type: 'success', message: successMsg });
    } catch (err) {
      showToast?.({ type: 'error', message: err?.response?.data?.message ?? 'Action failed' });
    } finally {
      setActionLoading(null);
      setMenuOpen(null);
    }
  }, [showToast]);

  const isAIUser = (user) => user?.name === 'Lumio AI';

  return (
    <div className="flex flex-col">
      {/* Search */}
      {!compact && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1827] border border-gray-800 rounded-xl pl-8 pr-3 py-2
              text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-all"
          />
        </div>
      )}

      {/* Header count */}
      <p className="text-[11px] text-gray-600 font-medium mb-2 uppercase tracking-wider px-1">
        {members.length} member{members.length !== 1 ? 's' : ''}
      </p>

      {isLoadingGroup ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="text-purple-400 animate-spin" />
        </div>
      ) : (
        <div className={`flex flex-col gap-0.5 ${compact ? 'max-h-48' : 'max-h-72'} overflow-y-auto custom-scrollbar`}>
          {sorted.map(m => {
            const isLoading = actionLoading === m._id;
            const isSelf    = m._id === currentUser?._id;
            return (
              <div
                key={m._id}
                className="flex items-center gap-3 px-1 py-2 rounded-xl hover:bg-white/3 transition-colors group relative"
              >
                {/* <Avatar src={m.profilePic} name={m.name} size="sm" online={m.isOnline} /> */}
                {isAIUser(m) ? (
                  <div className="relative shrink-0">
                    {/* subtle glow */}
                    <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-sm" />
                    <div className="relative w-8 h-8 rounded-full 
                      bg-teal-600/20 border border-teal-500/30 
                      flex items-center justify-center">
                      <Sparkles size={14} className="text-teal-400" />
                    </div>
                        {/* online dot */}
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                      </div>
                  ) : (
                  <Avatar
                    src={m.profilePic}
                    name={m.name}
                    size="sm"
                    online={m.isOnline}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-white font-medium truncate">
                      {m.name}{isSelf && <span className="text-gray-600 font-normal"> (You)</span>}
                    </p>
                    <RoleBadge role={m.role} />
                  </div>
                  {!compact && (
                    <p className="text-xs text-gray-600 truncate">{m.email}</p>
                  )}
                </div>

                {isLoading
                  ? <Loader2 size={14} className="text-purple-400 animate-spin shrink-0" />
                  : !isSelf && (myRole === 'admin' || myRole === 'super_admin') && (
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setMenuOpen(prev => prev === m._id ? null : m._id)}
                        className="p-1 rounded-lg text-gray-700 hover:text-gray-300
                          hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {menuOpen === m._id && (
                        <MemberActionMenu
                          member={m}
                          myRole={myRole}
                          currentUserId={currentUser?._id}
                          onClose={() => setMenuOpen(null)}
                          alignRight
                          onPromote={() => withLoading(m._id, () => handlePromote(m._id), `${m.name} is now an admin`)}
                          onDemote={() => withLoading(m._id, () => handleDemote(m._id), `${m.name} is no longer an admin`)}
                          onRemove={() => withLoading(m._id, () => handleRemoveMember(m._id), `${m.name} removed from group`)}
                          onTransfer={() => withLoading(m._id, () => handleTransferOwnership(m._id), `Ownership transferred to ${m.name}`)}
                        />
                      )}
                    </div>
                  )
                }
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupMemberList;