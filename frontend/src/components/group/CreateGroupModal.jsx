import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Search, Check, Loader2, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import * as groupService from '../../services/group';
import api from '../../services/axios';
import Avatar from '../ui/Avatar';

const MAX_NAME = 100;

const CreateGroupModal = ({ onClose }) => {
  const { selectConversation, conversations } = useChat();

  // ── Step 1 state ───────────────────────────────────────────────────────────
  const [step,        setStep]        = useState(1);
  const [groupName,   setGroupName]   = useState('');
  const [iconFile,    setIconFile]    = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [nameError,   setNameError]   = useState('');

  // ── Step 2 state ───────────────────────────────────────────────────────────
  const [allUsers,  setAllUsers]  = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selected,  setSelected]  = useState(new Set());
  const [search,    setSearch]    = useState('');

  // ── Submission ─────────────────────────────────────────────────────────────
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fileRef = useRef(null);

  // Fetch all users on step 2 mount
  useEffect(() => {
    if (step !== 2) return;
    setUsersLoading(true);
    api.get('/auth/users')
      .then(({ data }) => setAllUsers(data.users ?? []))
      .catch(() => setAllUsers([]))
      .finally(() => setUsersLoading(false));
  }, [step]);

  const handleIconChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setIconFile(f);
    setIconPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const validateStep1 = () => {
    const trimmed = groupName.trim();
    if (!trimmed) { setNameError('Group name is required'); return false; }
    if (trimmed.length > MAX_NAME) { setNameError(`Max ${MAX_NAME} characters`); return false; }
    setNameError('');
    return true;
  };

  const goToStep2 = () => {
    if (validateStep1()) setStep(2);
  };

  const toggleUser = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!validateStep1()) { setStep(1); return; }
    setCreating(true);
    setCreateError('');
    try {
      const fd = new FormData();
      fd.append('groupName', groupName.trim());
      if (iconFile) fd.append('groupIcon', iconFile);
      selected.forEach(id => fd.append('memberIds[]', id));

      const { data } = await groupService.createGroup(fd);

      // Add to sidebar + open the new group immediately
      selectConversation(data.group);
      onClose();
    } catch (err) {
      setCreateError(err?.response?.data?.message ?? 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f0e1a] border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
           style={{ maxHeight: '90vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/70 shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            <h2 className="text-white font-semibold text-base">
              {step === 1 ? 'New Group' : 'Add Members'}
            </h2>
            <span className="text-xs text-gray-600">{step}/2</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Step 1: Name + Icon ── */}
        {step === 1 && (
          <div className="flex flex-col flex-1 overflow-y-auto p-5 gap-5">
            {/* Icon upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-purple-500/10 border-2 border-dashed
                    border-purple-500/30 hover:border-purple-500/60 flex items-center
                    justify-center cursor-pointer overflow-hidden transition-all"
                >
                  {iconPreview
                    ? <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <Camera size={24} className="text-purple-400/60" />
                  }
                </div>
                {iconPreview && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIconFile(null); setIconPreview(null); }}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600">Group icon (optional)</p>
              <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleIconChange} />
            </div>

            {/* Name input */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Group Name</label>
              <input
                autoFocus
                type="text"
                value={groupName}
                onChange={e => { setGroupName(e.target.value); setNameError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') goToStep2(); }}
                placeholder="e.g. Team Design, Book Club…"
                maxLength={MAX_NAME + 10}
                className={`w-full bg-[#1a1827] border rounded-xl px-4 py-2.5 text-sm text-white
                  placeholder-gray-600 outline-none transition-all
                  ${nameError ? 'border-red-500/60' : 'border-gray-800 focus:border-purple-500/50'}`}
              />
              <div className="flex justify-between mt-1.5">
                {nameError
                  ? <p className="text-xs text-red-400">{nameError}</p>
                  : <span />
                }
                <span className={`text-[10px] ${groupName.length > MAX_NAME ? 'text-red-400' : 'text-gray-700'}`}>
                  {groupName.length}/{MAX_NAME}
                </span>
              </div>
            </div>

            <button
              onClick={goToStep2}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm
                transition-colors mt-auto"
            >
              Add Members <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 2: Member selection ── */}
        {step === 2 && (
          <>
            {/* Search */}
            <div className="px-4 py-3 shrink-0 border-b border-gray-800/50">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search people…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#1a1827] border border-gray-800 rounded-xl pl-9 pr-4 py-2
                    text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-all"
                />
              </div>
              {selected.size > 0 && (
                <p className="text-xs text-purple-400 mt-2">
                  {selected.size} member{selected.size > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {usersLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={22} className="text-purple-400 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-10">No users found</p>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = selected.has(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => toggleUser(u._id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                        ${isSelected ? 'bg-purple-500/8' : 'hover:bg-white/3'}`}
                    >
                      <Avatar src={u.profilePic} name={u.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{u.name}</p>
                        <p className="text-xs text-gray-600 truncate">{u.email}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                        ${isSelected
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-700 hover:border-purple-500/50'}`}
                      >
                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Error */}
            {createError && (
              <div className="mx-4 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400">{createError}</p>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex gap-3 px-4 py-4 border-t border-gray-800/70 shrink-0">
              <button
                onClick={() => setStep(1)}
                disabled={creating}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-800
                  text-sm text-gray-400 hover:text-white hover:border-gray-600
                  transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm
                  transition-colors disabled:opacity-60"
              >
                {creating
                  ? <><Loader2 size={15} className="animate-spin" /> Creating…</>
                  : <><Users size={15} /> Create Group</>
                }
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default CreateGroupModal;