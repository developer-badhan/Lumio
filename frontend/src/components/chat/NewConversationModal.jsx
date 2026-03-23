import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Users, MessageSquare, Check, Loader2, ChevronRight } from "lucide-react";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import api from "../../services/axios";

/**
 * NewConversationModal
 * ─────────────────────
 * Two-mode modal (tab-switched):
 *
 *  "Direct"  — search users by name/email → openPrivateConversation(userId)
 *  "Group"   — enter group name + select ≥1 members → createGroup(name, memberIds)
 *
 * Props:
 *   onClose  () => void   — called after success or on backdrop/X click
 */

const TABS = [
  { key: "direct", label: "Direct Message", Icon: MessageSquare },
  { key: "group",  label: "New Group",       Icon: Users },
];

const NewConversationModal = ({ onClose }) => {
  const { openPrivateConversation, createGroup, selectConversation } = useChat();
  const { user: currentUser } = useAuth();

  // ── Shared ────────────────────────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState("direct");
  const [search,      setSearch]      = useState("");
  const [users,       setUsers]       = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState(null);
  const searchTimeoutRef = useRef(null);

  // ── Group-only ────────────────────────────────────────────────────────────
  const [groupName,        setGroupName]        = useState("");
  const [selectedMembers,  setSelectedMembers]  = useState([]);  // array of user objects

  // ── Search users via API ──────────────────────────────────────────────────
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) { setUsers([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get("/users/search", { params: { q: query } });
      // Exclude self from results
      setUsers((data.users || []).filter(u => u._id !== currentUser?._id));
    } catch (err) {
      console.error("User search failed:", err);
      setUsers([]);
    } finally {
      setSearching(false);
    }
  }, [currentUser]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchUsers(search), 350);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, searchUsers]);

  // Reset search when switching tabs
  useEffect(() => {
    setSearch("");
    setUsers([]);
    setError(null);
  }, [activeTab]);

  // ── Direct message ────────────────────────────────────────────────────────
  const handleSelectUser = async (user) => {
    setSubmitting(true);
    setError(null);
    try {
      const conversation = await openPrivateConversation(user._id);
      if (conversation) {
        selectConversation(conversation);
        onClose();
      }
    } catch (err) {
      setError("Failed to open conversation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Group creation ────────────────────────────────────────────────────────
  const toggleMember = (user) => {
    setSelectedMembers(prev => {
      const exists = prev.some(m => m._id === user._id);
      return exists ? prev.filter(m => m._id !== user._id) : [...prev, user];
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) { setError("Group name is required."); return; }
    if (selectedMembers.length < 1) { setError("Select at least one member."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const memberIds    = selectedMembers.map(m => m._id);
      const conversation = await createGroup(groupName.trim(), memberIds);
      if (conversation) {
        selectConversation(conversation);
        onClose();
      }
    } catch (err) {
      setError("Failed to create group. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Backdrop click closes modal ───────────────────────────────────────────
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-[#0e0e0e] border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-white font-semibold text-base">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Tab switcher ───────────────────────────────────────────────── */}
        <div className="px-4 pt-4 shrink-0">
          <div className="flex bg-[#151515] rounded-xl p-1 gap-1">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === key
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden px-4 pt-4 pb-4 gap-3">

          {/* Group name input (group tab only) */}
          {activeTab === "group" && (
            <input
              type="text"
              placeholder="Group name..."
              value={groupName}
              onChange={e => { setGroupName(e.target.value); setError(null); }}
              className="w-full bg-[#151515] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors shrink-0"
            />
          )}

          {/* Selected members chips (group tab only) */}
          {activeTab === "group" && selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {selectedMembers.map(m => (
                <span
                  key={m._id}
                  className="flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs px-2.5 py-1 rounded-full"
                >
                  {m.name}
                  <button
                    onClick={() => toggleMember(m)}
                    className="text-purple-400 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search box */}
          <div className="relative shrink-0">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search people by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#151515] border border-gray-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-400 text-xs px-1 shrink-0">{error}</p>
          )}

          {/* User results list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="text-purple-500 animate-spin" />
              </div>
            ) : users.length === 0 && search.trim() ? (
              <div className="text-center py-10">
                <p className="text-gray-600 text-sm">No users found for "{search}"</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10">
                <Search size={28} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  {activeTab === "direct"
                    ? "Search for someone to message"
                    : "Search to add group members"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {users.map(user => {
                  const isSelected = selectedMembers.some(m => m._id === user._id);

                  return (
                    <button
                      key={user._id}
                      onClick={() =>
                        activeTab === "direct"
                          ? handleSelectUser(user)
                          : toggleMember(user)
                      }
                      disabled={submitting}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-left ${
                        isSelected
                          ? "bg-purple-500/15 border border-purple-500/30"
                          : "hover:bg-[#1a1a1a]"
                      }`}
                    >
                      <Avatar
                        src={user.profilePic || user.avatar || null}
                        name={user.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Direct: arrow icon | Group: checkbox */}
                      {activeTab === "direct" ? (
                        <ChevronRight size={16} className="text-gray-600 shrink-0" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "bg-purple-500 border-purple-500"
                            : "border-gray-600"
                        }`}>
                          {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create Group button (group tab only) */}
          {activeTab === "group" && (
            <button
              onClick={handleCreateGroup}
              disabled={submitting || !groupName.trim() || selectedMembers.length < 1}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0"
            >
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
                : <><Users size={16} /> Create Group ({selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""})</>
              }
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;