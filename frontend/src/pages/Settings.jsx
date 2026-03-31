import React, { useState, useRef, useEffect } from 'react';
import {
  User, Lock, Bell, MessageSquare, ShieldCheck,
  Trash2, ChevronRight, Camera, ArrowLeft, Bot,
  KeyRound, Check, X, Loader2, AlertCircle, Pencil,
  Eye, EyeOff, Shield, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';

// ─── Reusable primitives ──────────────────────────────────────────────────────

const Toggle = ({ enabled, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
      focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-2
      focus:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed ${
      enabled ? 'bg-purple-600' : 'bg-gray-700'
    }`}
    aria-checked={enabled}
    role="switch"
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow
      transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const FeedbackBanner = ({ type, message, onDismiss }) => {
  if (!message) return null;
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error:   'bg-red-500/10 border-red-500/30 text-red-400',
  };
  const Icon = type === 'success' ? Check : AlertCircle;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-6 ${styles[type]}`}>
      <Icon size={15} className="shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
};

const SettingRow = ({ icon, iconBg, label, desc, right, onClick, danger }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all
      ${onClick ? 'cursor-pointer' : ''}
      ${danger
        ? 'bg-red-500/5 border-red-500/15 hover:border-red-500/30'
        : 'bg-[#1a1530] border-purple-500/10 hover:border-purple-500/25'
      }`}
  >
    <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
      {desc && <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>}
    </div>
    {right}
  </div>
);

// ─── Profile Tab ──────────────────────────────────────────────────────────────

const ProfileTab = () => {
  const { user, updateProfile } = useAuth();

  const [name,         setName]         = useState(user?.name    ?? '');
  const [bio,          setBio]          = useState(user?.bio     ?? '');
  const [previewUrl,   setPreviewUrl]   = useState(null);
  const [picFile,      setPicFile]      = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [feedback,     setFeedback]     = useState(null);  // { type, message }
  const [isDirty,      setIsDirty]      = useState(false);

  const fileInputRef = useRef(null);

  // Sync from context when user changes (e.g. after another tab saves)
  useEffect(() => {
    setName(user?.name ?? '');
    setBio(user?.bio   ?? '');
  }, [user?._id]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handlePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image must be under 5 MB.' });
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPicFile(file);
    setIsDirty(true);
    e.target.value = '';
  };

  const handleNameChange = (v) => { setName(v); setIsDirty(true); };
  const handleBioChange  = (v) => {
    if (v.length > 150) return;
    setBio(v);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Display name cannot be empty.' });
      return;
    }
    setSaving(true);
    setFeedback(null);

    const result = await updateProfile({
      name:       name.trim(),
      bio:        bio.trim(),
      profilePic: picFile ?? undefined,
    });

    setSaving(false);

    if (result.success) {
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
      setPicFile(null);
      setIsDirty(false);
      // Keep the preview so it reflects the new pic immediately
    } else {
      setFeedback({ type: 'error', message: result.error });
    }
  };

  const handleDiscard = () => {
    setName(user?.name ?? '');
    setBio(user?.bio   ?? '');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPicFile(null);
    setIsDirty(false);
    setFeedback(null);
  };

  const displaySrc = previewUrl ?? user?.profilePic ?? null;

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold text-white">Profile</h2>
        <p className="text-sm text-gray-500 mt-1">
          This is how others see you in Lumio.
        </p>
      </div>

      <FeedbackBanner
        type={feedback?.type}
        message={feedback?.message}
        onDismiss={() => setFeedback(null)}
      />

      {/* ── Avatar picker ─────────────────────────────────── */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-purple-500/30 ring-offset-2 ring-offset-[#110e1f]">
            {displaySrc ? (
              <img
                src={displaySrc}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700
                flex items-center justify-center text-white text-2xl font-bold select-none">
                {user?.name?.slice(0, 2).toUpperCase() ?? 'ME'}
              </div>
            )}
          </div>

          {/* Hover overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center
              justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1"
            title="Change photo"
          >
            <Camera size={20} className="text-white" />
            <span className="text-white text-[10px] font-medium">Change</span>
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handlePicChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors
            flex items-center gap-1.5 font-medium"
        >
          <Camera size={13} />
          {displaySrc ? 'Change photo' : 'Upload photo'}
        </button>

        {picFile && (
          <p className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
            <Info size={11} />
            New photo — save to apply
          </p>
        )}
      </div>

      {/* ── Form fields ───────────────────────────────────── */}
      <div className="space-y-5">

        {/* Read-only email */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1 uppercase tracking-wider">
            Email
          </label>
          <div className="w-full bg-[#0d0a1c] border border-gray-800 rounded-xl px-4 py-3
            text-sm text-gray-400 flex items-center gap-2 select-none">
            <span className="flex-1 truncate">{user?.email}</span>
            <Lock size={13} className="text-gray-600 shrink-0" />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1 uppercase tracking-wider">
            Display Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              maxLength={50}
              placeholder="Your name"
              className="w-full bg-[#0d0a1c] border border-purple-500/20 rounded-xl px-4 py-3
                text-sm text-white placeholder-gray-600 focus:border-purple-500/60
                focus:ring-2 focus:ring-purple-500/10 outline-none transition-all pr-10"
            />
            <Pencil size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          </div>
          <p className="text-[11px] text-gray-600 mt-1 ml-1">
            {name.length}/50 characters
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1 uppercase tracking-wider">
            Bio
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={e => handleBioChange(e.target.value)}
            placeholder="Tell people a little about yourself…"
            className="w-full bg-[#0d0a1c] border border-purple-500/20 rounded-xl px-4 py-3
              text-sm text-white placeholder-gray-600 focus:border-purple-500/60
              focus:ring-2 focus:ring-purple-500/10 outline-none transition-all resize-none"
          />
          <div className="flex justify-between mt-1 ml-1 mr-1">
            <p className="text-[11px] text-gray-600">
              Shown on your profile card
            </p>
            <p className={`text-[11px] tabular-nums ${bio.length >= 140 ? 'text-amber-400' : 'text-gray-600'}`}>
              {bio.length}/150
            </p>
          </div>
        </div>

      </div>

      {/* ── Action buttons ────────────────────────────────── */}
      <div className="flex gap-3 mt-8">
        {isDirty && (
          <button
            onClick={handleDiscard}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400
              hover:border-gray-600 hover:text-gray-300 text-sm font-semibold
              transition-all disabled:opacity-40"
          >
            Discard
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700
            text-white text-sm font-bold shadow-lg shadow-purple-900/30
            hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Saving…</>
          ) : (
            <><Check size={15} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Notifications Tab ────────────────────────────────────────────────────────

const NotificationsTab = () => {
  const [notifs,    setNotifs]    = useState(true);
  const [sounds,    setSounds]    = useState(true);
  const [previews,  setPreviews]  = useState(true);
  const [groupPing, setGroupPing] = useState(false);

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold text-white">Notifications</h2>
        <p className="text-sm text-gray-500 mt-1">Manage how you're alerted.</p>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Enable Notifications', desc: 'Desktop and in-app push alerts',
            value: notifs, set: setNotifs },
          { label: 'Message Sounds', desc: 'Play sound on new messages',
            value: sounds, set: setSounds },
          { label: 'Message Previews', desc: 'Show message content in notifications',
            value: previews, set: setPreviews },
          { label: 'Group Mentions Only', desc: 'Only notify when @mentioned in groups',
            value: groupPing, set: setGroupPing },
        ].map(({ label, desc, value, set }) => (
          <div key={label}
            className="flex items-center justify-between p-4 bg-[#1a1530]
              border border-purple-500/10 rounded-2xl">
            <div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
            <Toggle enabled={value} onChange={set} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Account Tab ──────────────────────────────────────────────────────────────
const AccountTab = () => {
  const { deleteAccount } = useAuth();

  const [twoFactor,    setTwoFactor]    = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState(null);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    // If deleteAccount returns an error (rare — it usually redirects on success)
    if (result && !result.success) {
      setDeleteError(result.error);
      setDeleting(false);
    }
    // On success: AuthContext redirects to /login — no further action needed here
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold text-white">Account & Security</h2>
        <p className="text-sm text-gray-500 mt-1">Keep your account secure.</p>
      </div>

      <div className="space-y-3 mb-10">
        <SettingRow
          icon={<Lock size={17} className="text-purple-400" />}
          iconBg="bg-purple-500/15"
          label="Two-Step Verification"
          desc="Add a PIN for extra protection"
          right={<Toggle enabled={twoFactor} onChange={setTwoFactor} />}
        />
        <SettingRow
          icon={<KeyRound size={17} className="text-blue-400" />}
          iconBg="bg-blue-500/15"
          label="Change Password"
          desc="Update your login credentials"
          onClick={() => window.location.href = '/change-password'}
          right={<ChevronRight size={17} className="text-gray-600" />}
        />
        <SettingRow
          icon={<Shield size={17} className="text-emerald-400" />}
          iconBg="bg-emerald-500/15"
          label="Active Sessions"
          desc="View and manage logged-in devices"
          right={<ChevronRight size={17} className="text-gray-600" />}
        />
      </div>

      <div className="pt-6 border-t border-red-500/10">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider font-semibold">
          Danger Zone
        </p>

        {/* ── Delete account row — idle state ── */}
        {!showConfirm && (
          <SettingRow
            icon={<Trash2 size={17} className="text-red-400" />}
            iconBg="bg-red-500/10"
            label="Delete Account"
            desc="Permanently remove your account and all data"
            danger
            onClick={() => setShowConfirm(true)}
            right={<ChevronRight size={17} className="text-red-500/40" />}
          />
        )}

        {/* ── Delete account — confirmation state ── */}
        {showConfirm && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">

            {/* Error banner */}
            {deleteError && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-red-500/10
                border border-red-500/20 rounded-xl">
                <AlertCircle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{deleteError}</p>
              </div>
            )}

            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl shrink-0 mt-0.5">
                <Trash2 size={15} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">
                  Delete your account?
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  This permanently deletes your account, all messages, conversations,
                  and media. This action <span className="text-red-400/80 font-semibold">cannot be undone</span>.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/35
                  border border-red-500/30 text-red-400 text-sm font-bold
                  transition-colors disabled:opacity-50
                  flex items-center justify-center gap-1.5"
              >
                {deleting
                  ? <><Loader2 size={13} className="animate-spin" /> Deleting…</>
                  : <><Trash2 size={13} /> Yes, delete my account</>
                }
              </button>
              <button
                onClick={() => { setShowConfirm(false); setDeleteError(null); }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-700
                  text-gray-400 hover:text-white hover:border-gray-600
                  text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Privacy Tab ──────────────────────────────────────────────────────────────

const PrivacyTab = () => {
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold text-white">Privacy</h2>
        <p className="text-sm text-gray-500 mt-1">Control what others can see.</p>
      </div>

      <div className="space-y-3 mb-6">
        {[
          ['Last Seen',    'Everyone',     'Who can see when you were last active'],
          ['Profile Photo','My Contacts',  'Who can see your profile picture'],
          ['Bio',          'Everyone',     'Who can see your bio text'],
        ].map(([label, value, desc]) => (
          <div key={label}
            className="flex items-center justify-between p-4 bg-[#1a1530]
              border border-purple-500/10 rounded-2xl">
            <div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
            <span className="text-xs text-purple-400 font-medium bg-purple-500/10
              px-2.5 py-1 rounded-full">{value}</span>
          </div>
        ))}

        <div className="flex items-center justify-between p-4 bg-[#1a1530]
          border border-purple-500/10 rounded-2xl">
          <div>
            <p className="text-sm font-semibold text-white">Read Receipts</p>
            <p className="text-xs text-gray-500 mt-0.5">Show double-tick when messages are read</p>
          </div>
          <Toggle enabled={readReceipts} onChange={setReadReceipts} />
        </div>

        <div className="flex items-center justify-between p-4 bg-[#1a1530]
          border border-purple-500/10 rounded-2xl">
          <div>
            <p className="text-sm font-semibold text-white">Online Status</p>
            <p className="text-xs text-gray-500 mt-0.5">Let contacts know when you're active</p>
          </div>
          <Toggle enabled={onlineStatus} onChange={setOnlineStatus} />
        </div>
      </div>
    </div>
  );
};

// ─── Chats Tab ────────────────────────────────────────────────────────────────

const ChatsTab = () => (
  <div>
    <div className="mb-7">
      <h2 className="text-xl font-bold text-white">Chat Preferences</h2>
      <p className="text-sm text-gray-500 mt-1">Customise your chat experience.</p>
    </div>

    <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl
      flex gap-4 mb-5 items-start">
      <div className="p-2.5 bg-purple-500/20 rounded-xl shrink-0">
        <Bot size={18} className="text-purple-400" />
      </div>
      <div>
        <p className="font-semibold text-white text-sm">AI Assistant</p>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">
          Smart suggestions, message summaries, and quick replies.
        </p>
        <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg
          text-xs text-white font-semibold transition-colors">
          Enable AI
        </button>
      </div>
    </div>

    <div className="space-y-3">
      <SettingRow
        icon={<MessageSquare size={17} className="text-purple-400" />}
        iconBg="bg-purple-500/15"
        label="Chat Wallpaper"
        desc="Customise your chat background"
        right={<ChevronRight size={17} className="text-gray-600" />}
        onClick={() => {}}
      />
      <SettingRow
        icon={<Trash2 size={17} className="text-red-400" />}
        iconBg="bg-red-500/10"
        label="Clear All Conversations"
        desc="Delete your local chat history"
        danger
      />
    </div>
  </div>
);

// ─── Main Settings page ───────────────────────────────────────────────────────

const MENU = [
  { id: 'profile',       label: 'Profile',       Icon: User,         desc: 'Name, bio and photo' },
  { id: 'notifications', label: 'Notifications', Icon: Bell,         desc: 'Alerts and sounds' },
  { id: 'account',       label: 'Account',       Icon: ShieldCheck,  desc: 'Password and security' },
  { id: 'privacy',       label: 'Privacy',       Icon: Lock,         desc: 'Visibility settings' },
  { id: 'chats',         label: 'Chats',         Icon: MessageSquare,desc: 'History and AI' },
];

const TAB_CONTENT = {
  profile:       ProfileTab,
  notifications: NotificationsTab,
  account:       AccountTab,
  privacy:       PrivacyTab,
  chats:         ChatsTab,
};

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const ActiveComponent = TAB_CONTENT[activeTab];

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">

      {/* ── Mini nav rail ──────────────────────────────────── */}
      <div className="w-16 h-full bg-[#0a0a0a] border-r border-gray-800
        flex flex-col items-center py-6 gap-6">
        <a
          href="/"
          className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700
            shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          title="Back to chats"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
            <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
          </svg>
        </a>
        <a
          href="/"
          className="p-3 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10
            rounded-xl transition-all"
          title="Back"
        >
          <ArrowLeft size={22} />
        </a>
      </div>

      {/* ── Sidebar ────────────────────────────────────────── */}
      <div className="w-72 h-full bg-black border-r border-gray-800 flex flex-col">

        {/* User card at top */}
        <div className="p-5 border-b border-gray-800/60">
          <h1 className="text-lg font-bold text-white mb-4">Settings</h1>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-purple-500/30 shrink-0">
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700
                  flex items-center justify-center text-white text-sm font-bold select-none">
                  {user?.name?.slice(0, 2).toUpperCase() ?? 'ME'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name ?? '—'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {MENU.map(({ id, label, Icon, desc }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left
                  transition-all relative ${
                  active
                    ? 'bg-purple-500/10 text-purple-300'
                    : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5
                    bg-purple-500 rounded-r-full" />
                )}
                <div className={`p-1.5 rounded-lg transition-colors ${
                  active ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500'
                }`}>
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${active ? 'text-white' : ''}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-600 truncate">{desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

      </div>

      {/* ── Content area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#0c0917] relative">

        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-700/10
            rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/8
            rounded-full blur-[100px]" />
        </div>

        {/* Content card */}
        <div className="relative z-10 max-w-xl mx-auto px-6 py-10">
          <div className="bg-[#110e1f]/80 border border-purple-500/10 rounded-3xl p-8
            shadow-2xl shadow-purple-950/40 backdrop-blur-sm">
            <ActiveComponent key={activeTab} />
          </div>

          {/* Version badge */}
          <div className="mt-6 flex justify-center">
            <div className="px-4 py-2 bg-[#1a1530]/60 border border-purple-500/15
              rounded-full text-[10px] text-gray-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
              Lumio v1.0.4 — End-to-end encrypted
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;