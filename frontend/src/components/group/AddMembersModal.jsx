import React, { useState, useEffect } from 'react';
import { X, Search, Check, UserPlus, Loader2 } from 'lucide-react';
import { useGroup } from '../../hooks/useGroup';
import Avatar from '../ui/Avatar';
import api from '../../services/axios';

const MAX_GROUP_MEMBERS = 256;

const AddMembersModal = ({ onClose }) => {
  const { members, handleAddMembers, groupDetails } = useGroup();

  const [allUsers,  setAllUsers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(new Set());
  const [search,    setSearch]    = useState('');
  const [adding,    setAdding]    = useState(false);
  const [error,     setError]     = useState('');

  const existingIds = new Set(members.map(m => m._id?.toString?.() ?? m._id));
  const currentCount = groupDetails?.participantCount ?? members.length;
  const remaining = MAX_GROUP_MEMBERS - currentCount;

  useEffect(() => {
    api.get('/auth/users')
      .then(({ data }) => setAllUsers(data.users ?? []))
      .catch(() => setAllUsers([]))
      .finally(() => setLoading(false));
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const eligible = allUsers.filter(
    u => !existingIds.has(u._id) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleUser = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= remaining) { setError(`This group can only add ${remaining} more member(s).`); return prev; }
      next.add(id);
      setError('');
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!selected.size) return;
    setAdding(true);
    setError('');
    try {
      const { addedCount, skippedCount } = await handleAddMembers([...selected]);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to add members');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f0e1a] border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
           style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/70 shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus size={17} className="text-purple-400" />
            <h2 className="text-white font-semibold">Add Members</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              autoFocus
              type="text"
              placeholder="Search people to add…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1a1827] border border-gray-800 rounded-xl pl-8 pr-4 py-2
                text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-all"
            />
          </div>
          {selected.size > 0 && (
            <p className="text-xs text-purple-400 mt-2">{selected.size} selected · {remaining - selected.size} spots remaining</p>
          )}
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={22} className="text-purple-400 animate-spin" /></div>
          ) : eligible.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-10">
              {search ? 'No users match your search' : 'Everyone is already in the group'}
            </p>
          ) : (
            eligible.map(u => {
              const isSel = selected.has(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u._id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${isSel ? 'bg-purple-500/8' : 'hover:bg-white/3'}`}
                >
                  <Avatar src={u.profilePic} name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{u.name}</p>
                    <p className="text-xs text-gray-600 truncate">{u.email}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                    ${isSel ? 'bg-purple-500 border-purple-500' : 'border-gray-700'}`}>
                    {isSel && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 px-4 py-4 border-t border-gray-800/70 shrink-0">
          <button onClick={onClose} disabled={adding}
            className="flex-1 py-2.5 rounded-xl border border-gray-800 text-sm text-gray-400
              hover:text-white hover:border-gray-600 transition-colors disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected.size || adding}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm
              transition-colors disabled:opacity-50">
            {adding
              ? <><Loader2 size={15} className="animate-spin" /> Adding…</>
              : <><UserPlus size={15} /> Add {selected.size || ''} Member{selected.size !== 1 ? 's' : ''}</>
            }
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddMembersModal;