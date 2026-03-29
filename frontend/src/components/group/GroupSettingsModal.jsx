import React, { useState, useRef, useEffect } from 'react';
import {
  X, Camera, Lock, Unlock, Crown, Trash2,
  Loader2, AlertTriangle, Settings, Check
} from 'lucide-react';
import { useGroup } from '../../hooks/useGroup';
import { useChat } from '../../hooks/useChat';
import Avatar from '../ui/Avatar';

const MAX_NAME = 100;

const GroupSettingsModal = ({ onClose }) => {
  const {
    groupDetails, members, myRole, isSuperAdmin, isAdmin, isRestricted,
    handleUpdateInfo, handleToggleRestriction,
    handleLeaveGroup, handleDeleteGroup,
    handleTransferOwnership,
  } = useGroup();
  const { selectConversation } = useChat();

  // ── Name / icon edit ───────────────────────────────────────────────────────
  const [groupName,    setGroupName]    = useState(groupDetails?.groupName ?? '');
  const [iconFile,     setIconFile]     = useState(null);
  const [iconPreview,  setIconPreview]  = useState(groupDetails?.groupIcon ?? '');
  const [removeIcon,   setRemoveIcon]   = useState(false);
  const [savingInfo,   setSavingInfo]   = useState(false);
  const [infoError,    setInfoError]    = useState('');
  const [infoSuccess,  setInfoSuccess]  = useState(false);
  const fileRef = useRef(null);

  // ── Restriction toggle ─────────────────────────────────────────────────────
  const [togglingRestrict, setTogglingRestrict] = useState(false);

  // ── Transfer ownership ─────────────────────────────────────────────────────
  const [showTransfer, setShowTransfer]   = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [transferring,   setTransferring]   = useState(false);
  const [transferError,  setTransferError]  = useState('');

  // ── Delete group ───────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,          setDeleting]          = useState(false);
  const [deleteError,       setDeleteError]       = useState('');

  // ── Leave group ────────────────────────────────────────────────────────────
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving,          setLeaving]          = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleIconChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setIconFile(f);
    setIconPreview(URL.createObjectURL(f));
    setRemoveIcon(false);
    e.target.value = '';
  };

  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview('');
    setRemoveIcon(true);
  };

  const hasInfoChanges =
    groupName.trim() !== groupDetails?.groupName ||
    iconFile !== null ||
    removeIcon;

  const handleSaveInfo = async () => {
    const trimmed = groupName.trim();
    if (!trimmed) { setInfoError('Group name cannot be empty'); return; }
    if (trimmed.length > MAX_NAME) { setInfoError(`Max ${MAX_NAME} characters`); return; }

    setSavingInfo(true);
    setInfoError('');
    try {
      await handleUpdateInfo({ groupName: trimmed, groupIcon: iconFile, removeIcon });
      setInfoSuccess(true);
      setIconFile(null);
      setRemoveIcon(false);
      setTimeout(() => setInfoSuccess(false), 2500);
    } catch (err) {
      setInfoError(err?.response?.data?.message ?? 'Failed to save changes');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleToggle = async () => {
    setTogglingRestrict(true);
    try { await handleToggleRestriction(); } catch {}
    finally { setTogglingRestrict(false); }
  };

  const handleConfirmTransfer = async () => {
    if (!transferTarget) { setTransferError('Select a member to transfer to'); return; }
    setTransferring(true);
    setTransferError('');
    try {
      await handleTransferOwnership(transferTarget);
      setShowTransfer(false);
    } catch (err) {
      setTransferError(err?.response?.data?.message ?? 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await handleDeleteGroup();
      selectConversation(null);
      onClose();
    } catch (err) {
      setDeleteError(err?.response?.data?.message ?? 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmLeave = async () => {
    setLeaving(true);
    try {
      await handleLeaveGroup();
      selectConversation(null);
      onClose();
    } catch {}
    finally { setLeaving(false); }
  };

  const transferableMembers = members.filter(
    m => m.role !== 'super_admin' && m._id !== groupDetails?.groupAdmin?._id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f0e1a] border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
           style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/70 shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={17} className="text-purple-400" />
            <h2 className="text-white font-semibold">Group Settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">

          {/* ── Group info edit (admin only) ── */}
          {isAdmin && (
            <section className="flex flex-col gap-4">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Group Info</p>

              {/* Icon */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 rounded-full bg-purple-500/10 border-2 border-dashed
                      border-purple-500/30 hover:border-purple-500/60 flex items-center
                      justify-center cursor-pointer overflow-hidden transition-all"
                  >
                    {iconPreview
                      ? <img src={iconPreview} alt="Icon" className="w-full h-full object-cover" />
                      : <Camera size={20} className="text-purple-400/60" />
                    }
                  </div>
                  <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleIconChange} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => fileRef.current?.click()}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Change icon
                  </button>
                  {(iconPreview || groupDetails?.groupIcon) && (
                    <button onClick={handleRemoveIcon}
                      className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
                      Remove icon
                    </button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => { setGroupName(e.target.value); setInfoError(''); }}
                  maxLength={MAX_NAME + 10}
                  className={`w-full bg-[#1a1827] border rounded-xl px-4 py-2.5 text-sm text-white
                    placeholder-gray-600 outline-none transition-all
                    ${infoError ? 'border-red-500/60' : 'border-gray-800 focus:border-purple-500/50'}`}
                />
                {infoError && <p className="text-xs text-red-400 mt-1.5">{infoError}</p>}
              </div>

              {hasInfoChanges && (
                <button
                  onClick={handleSaveInfo}
                  disabled={savingInfo}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                    bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm
                    transition-colors disabled:opacity-60"
                >
                  {savingInfo
                    ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    : infoSuccess
                      ? <><Check size={14} /> Saved</>
                      : 'Save Changes'
                  }
                </button>
              )}
            </section>
          )}

          <div className="h-px bg-gray-800/60" />

          {/* ── Restriction toggle (admin) ── */}
          {isAdmin && (
            <section className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white font-medium flex items-center gap-2">
                  {isRestricted ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} className="text-gray-500" />}
                  Restrict Messages
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isRestricted ? 'Only admins can send messages' : 'All members can send messages'}
                </p>
              </div>
              <button
                onClick={handleToggle}
                disabled={togglingRestrict}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0
                  ${isRestricted ? 'bg-amber-500' : 'bg-gray-700'}
                  ${togglingRestrict ? 'opacity-60' : ''}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                  transition-transform duration-200
                  ${isRestricted ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </section>
          )}

          {isAdmin && <div className="h-px bg-gray-800/60" />}

          {/* ── Transfer ownership (super admin only) ── */}
          {isSuperAdmin && (
            <section className="flex flex-col gap-2">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Ownership</p>
              {!showTransfer ? (
                <button
                  onClick={() => setShowTransfer(true)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-800
                    hover:bg-white/3 text-sm text-purple-300 transition-colors"
                >
                  <Crown size={15} />
                  Transfer Ownership
                </button>
              ) : (
                <div className="bg-[#1a1827] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs text-gray-500">Select member to become the new owner:</p>
                  <select
                    value={transferTarget}
                    onChange={e => { setTransferTarget(e.target.value); setTransferError(''); }}
                    className="w-full bg-[#0f0e1a] border border-gray-700 rounded-xl px-3 py-2
                      text-sm text-white outline-none focus:border-purple-500/50"
                  >
                    <option value="">— Select member —</option>
                    {transferableMembers.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                  {transferError && <p className="text-xs text-red-400">{transferError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setShowTransfer(false)} disabled={transferring}
                      className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-400
                        hover:text-white transition-colors disabled:opacity-40">
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmTransfer}
                      disabled={!transferTarget || transferring}
                      className="flex-1 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600
                        text-xs text-white font-semibold transition-colors disabled:opacity-40
                        flex items-center justify-center gap-1"
                    >
                      {transferring ? <Loader2 size={12} className="animate-spin" /> : <Crown size={12} />}
                      Transfer
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="h-px bg-gray-800/60" />

          {/* ── Danger zone ── */}
          <section className="flex flex-col gap-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Danger Zone</p>

            {/* Leave */}
            {!showLeaveConfirm ? (
              <button onClick={() => setShowLeaveConfirm(true)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-orange-500/20
                  hover:bg-orange-500/5 text-sm text-orange-400 transition-colors">
                Leave Group
              </button>
            ) : (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex flex-col gap-3">
                {isSuperAdmin && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={13} className="text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-orange-300/80">
                      As the owner, leaving will transfer ownership to the oldest admin (or first member).
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">Are you sure you want to leave this group?</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowLeaveConfirm(false)} disabled={leaving}
                    className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-400
                      hover:text-white transition-colors disabled:opacity-40">Cancel</button>
                  <button onClick={handleConfirmLeave} disabled={leaving}
                    className="flex-1 py-2 rounded-xl bg-orange-500/30 hover:bg-orange-500/50
                      text-xs text-white font-semibold transition-colors disabled:opacity-40
                      flex items-center justify-center gap-1">
                    {leaving ? <Loader2 size={12} className="animate-spin" /> : null}
                    Leave
                  </button>
                </div>
              </div>
            )}

            {/* Delete (super admin only) */}
            {isSuperAdmin && (
              !showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-red-500/20
                    hover:bg-red-500/5 text-sm text-red-400 transition-colors">
                  <Trash2 size={15} /> Delete Group
                </button>
              ) : (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-300/80">
                      This permanently deletes the group and all messages. This cannot be undone.
                    </p>
                  </div>
                  {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                      className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-400
                        hover:text-white transition-colors disabled:opacity-40">Cancel</button>
                    <button onClick={handleConfirmDelete} disabled={deleting}
                      className="flex-1 py-2 rounded-xl bg-red-500/30 hover:bg-red-500/50
                        text-xs text-white font-semibold transition-colors disabled:opacity-40
                        flex items-center justify-center gap-1">
                      {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Delete Forever
                    </button>
                  </div>
                </div>
              )
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;