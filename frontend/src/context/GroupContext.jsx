import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';
import ChatContext from './ChatContext';
import * as groupService from '../services/group';

/**
 * GroupContext provides state and actions related to group conversations, including member management, group info, and UI panel visibility.
 * It listens to real-time group events via Socket.IO to keep the UI in sync with changes made by any member.
 * Usage:
 * const { members, groupDetails, isAdmin, handleAddMembers, handleRemoveMember, ... } = useGroup();
 * The GroupProvider should wrap the part of the app that needs access to group-related functionality, typically at a high level in the component tree.
 * Example:
 * <GroupProvider>
 *   <App />
 * </GroupProvider>
 */

const GroupContext = createContext();
export default GroupContext;

// GROUP_EVENTS mirror — must stay in sync with backend utils/groupHelper.js
const GE = Object.freeze({
  CREATED:               'group:created',
  INFO_UPDATED:          'group:info-updated',
  MEMBER_ADDED:          'group:member-added',
  MEMBER_REMOVED:        'group:member-removed',
  ADMIN_PROMOTED:        'group:admin-promoted',
  ADMIN_DEMOTED:         'group:admin-demoted',
  RESTRICTION_TOGGLED:   'group:restriction-toggled',
  OWNERSHIP_TRANSFERRED: 'group:ownership-transferred',
  MEMBER_LEFT:           'group:member-left',
  DELETED:               'group:deleted',
});

const toStr = (v) => v?._id?.toString?.() ?? v?.toString?.() ?? String(v ?? '');

export const GroupProvider = ({ children }) => {
  const { socket }                                  = useSocket();
  const { user: currentUser }                       = useAuth();
  const { activeConversation, selectConversation,
          loadConversations, setActiveConversation } = useContext(ChatContext);

  // ── Core group data ────────────────────────────────────────────────────────
  const [members,        setMembers]        = useState([]);
  const [groupDetails,   setGroupDetails]   = useState(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const [groupError,     setGroupError]     = useState(null);

  // ── UI panel visibility (kept here to avoid prop drilling) ─────────────────
  const [showInfoPanel,   setShowInfoPanel]   = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showAddMembers,  setShowAddMembers]  = useState(false);
  const [showInvite,      setShowInvite]      = useState(false);

  const activeGroupIdRef = useRef(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isGroup      = activeConversation?.type === 'group';
  const isRestricted = groupDetails?.isRestricted ?? activeConversation?.isRestricted ?? false;
  const myMember     = members.find(m => toStr(m._id) === currentUser?._id);
  const myRole       = myMember?.role ?? null;
  const isAdmin      = myRole === 'admin' || myRole === 'super_admin';
  const isSuperAdmin = myRole === 'super_admin';
  const canSend      = !isRestricted || isAdmin;

  // ── Load group details when active conversation changes ────────────────────
  const refreshGroupDetails = useCallback(async (groupId) => {
    const id = groupId ?? activeConversation?._id;
    if (!id || activeConversation?.type !== 'group') return;

    setIsLoadingGroup(true);
    setGroupError(null);
    try {
      const { data } = await groupService.getGroupDetails(id);
      setGroupDetails(data.group);
      setMembers(data.group.members ?? []);
    } catch (err) {
      console.error('GroupContext: failed to load group details', err);
      setGroupError(err?.response?.data?.message ?? 'Failed to load group info');
    } finally {
      setIsLoadingGroup(false);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (isGroup && activeConversation?._id) {
      activeGroupIdRef.current = activeConversation._id;
      setGroupDetails(null);
      setMembers([]);
      setShowInfoPanel(false);
      setShowSettings(false);
      setShowAddMembers(false);
      setShowInvite(false);
      refreshGroupDetails(activeConversation._id);
    } else {
      activeGroupIdRef.current = null;
      setGroupDetails(null);
      setMembers([]);
    }
  }, [activeConversation?._id, isGroup]);

  // ── Action: update group info ──────────────────────────────────────────────
  const handleUpdateInfo = useCallback(async ({ groupName, groupIcon, removeIcon }) => {
    if (!activeConversation?._id) return;
    const fd = new FormData();
    if (groupName  !== undefined) fd.append('groupName',   groupName);
    if (removeIcon !== undefined) fd.append('removeIcon',  String(removeIcon));
    if (groupIcon  instanceof File) fd.append('groupIcon', groupIcon);

    await groupService.updateGroupInfo(activeConversation._id, fd);
    // socket group:info-updated will propagate to ChatContext + GroupContext
  }, [activeConversation?._id]);

  // ── Action: add members ────────────────────────────────────────────────────
  const handleAddMembers = useCallback(async (memberIds) => {
    if (!activeConversation?._id) return;
    const { data } = await groupService.addMembers(activeConversation._id, memberIds);
    return data;
  }, [activeConversation?._id]);

  // ── Action: remove member ──────────────────────────────────────────────────
  const handleRemoveMember = useCallback(async (userId) => {
    if (!activeConversation?._id) return;
    await groupService.removeMember(activeConversation._id, userId);
  }, [activeConversation?._id]);

  // ── Action: promote ────────────────────────────────────────────────────────
  const handlePromote = useCallback(async (userId) => {
    if (!activeConversation?._id) return;
    await groupService.promoteToAdmin(activeConversation._id, userId);
  }, [activeConversation?._id]);

  // ── Action: demote ─────────────────────────────────────────────────────────
  const handleDemote = useCallback(async (userId) => {
    if (!activeConversation?._id) return;
    await groupService.demoteAdmin(activeConversation._id, userId);
  }, [activeConversation?._id]);

  // ── Action: toggle restriction ─────────────────────────────────────────────
  const handleToggleRestriction = useCallback(async () => {
    if (!activeConversation?._id) return;
    const { data } = await groupService.toggleRestriction(activeConversation._id);
    return data;
  }, [activeConversation?._id]);

  // ── Action: leave group ────────────────────────────────────────────────────
  const handleLeaveGroup = useCallback(async () => {
    if (!activeConversation?._id) return;
    await groupService.leaveGroup(activeConversation._id);
    // ChatContext's group:member-left / group:member-removed will handle sidebar cleanup
  }, [activeConversation?._id]);

  // ── Action: transfer ownership ─────────────────────────────────────────────
  const handleTransferOwnership = useCallback(async (userId) => {
    if (!activeConversation?._id) return;
    await groupService.transferOwnership(activeConversation._id, userId);
  }, [activeConversation?._id]);

  // ── Action: delete group ───────────────────────────────────────────────────
  const handleDeleteGroup = useCallback(async () => {
    if (!activeConversation?._id) return;
    await groupService.deleteGroup(activeConversation._id);
  }, [activeConversation?._id]);

  // ── Action: generate invite ────────────────────────────────────────────────
  const handleGenerateInvite = useCallback(async () => {
    if (!activeConversation?._id) return null;
    const { data } = await groupService.generateInviteLink(activeConversation._id);
    return data;
  }, [activeConversation?._id]);

  // ── Socket: GROUP_EVENTS listeners (detailed member-list updates) ──────────
  useEffect(() => {
    if (!socket) return;

    const isCurrent = (id) => id === activeGroupIdRef.current;

    // group:info-updated → update groupDetails name/icon
    const onInfoUpdated = ({ groupId, groupName, groupIcon }) => {
      if (!isCurrent(groupId)) return;
      setGroupDetails(prev => prev ? {
        ...prev,
        ...(groupName !== undefined && { groupName }),
        ...(groupIcon !== undefined && { groupIcon }),
      } : prev);
    };

    // group:member-added → add new members to list
    // payload: { groupId, addedMembers:[{_id,name,profilePic}], totalMembers }
    const onMemberAdded = ({ groupId, addedMembers = [], totalMembers }) => {
      if (!isCurrent(groupId)) return;
      setMembers(prev => {
        const existingIds = new Set(prev.map(m => toStr(m._id)));
        const toAdd = addedMembers
          .filter(m => !existingIds.has(toStr(m._id)))
          .map(m => ({ ...m, role: 'member', isOnline: false }));
        return [...prev, ...toAdd];
      });
      setGroupDetails(prev => prev ? { ...prev, participantCount: totalMembers } : prev);
    };

    // group:member-removed → remove from list
    // payload for remaining members: { groupId, removedUserId, removedBy }
    const onMemberRemoved = ({ groupId, removedUserId }) => {
      if (!isCurrent(groupId) || !removedUserId) return;
      setMembers(prev => prev.filter(m => toStr(m._id) !== removedUserId));
      setGroupDetails(prev => prev ? {
        ...prev,
        participantCount: Math.max(0, (prev.participantCount ?? 1) - 1),
      } : prev);
    };

    // group:member-left → remove from list
    // payload: { groupId, leftUser: { _id, name } }
    const onMemberLeft = ({ groupId, leftUser }) => {
      if (!isCurrent(groupId) || !leftUser?._id) return;
      setMembers(prev => prev.filter(m => toStr(m._id) !== toStr(leftUser._id)));
      setGroupDetails(prev => prev ? {
        ...prev,
        participantCount: Math.max(0, (prev.participantCount ?? 1) - 1),
      } : prev);
    };

    // group:admin-promoted → upgrade role in members list
    // payload: { groupId, promotedUserId, promotedBy }
    const onAdminPromoted = ({ groupId, promotedUserId }) => {
      if (!isCurrent(groupId) || !promotedUserId) return;
      setMembers(prev => prev.map(m =>
        toStr(m._id) === promotedUserId ? { ...m, role: 'admin' } : m
      ));
    };

    // group:admin-demoted → downgrade role in members list
    // payload: { groupId, demotedUserId, demotedBy }
    const onAdminDemoted = ({ groupId, demotedUserId }) => {
      if (!isCurrent(groupId) || !demotedUserId) return;
      setMembers(prev => prev.map(m =>
        toStr(m._id) === demotedUserId ? { ...m, role: 'member' } : m
      ));
    };

    // group:restriction-toggled → update isRestricted on groupDetails
    // payload: { groupId, isRestricted, changedBy }
    const onRestrictionToggled = ({ groupId, isRestricted }) => {
      if (!isCurrent(groupId)) return;
      setGroupDetails(prev => prev ? { ...prev, isRestricted } : prev);
    };

    // group:ownership-transferred → swap super_admin role
    // payload: { groupId, newOwner:{_id,name}, previousOwner:{_id,name} }
    const onOwnershipTransferred = ({ groupId, newOwner, previousOwner }) => {
      if (!isCurrent(groupId)) return;
      setMembers(prev => prev.map(m => {
        const id = toStr(m._id);
        if (id === toStr(newOwner?._id))     return { ...m, role: 'super_admin' };
        if (id === toStr(previousOwner?._id) && m.role === 'super_admin')
                                             return { ...m, role: 'admin' };
        return m;
      }));
      setGroupDetails(prev => prev ? { ...prev, groupAdmin: newOwner } : prev);
    };

    // group:deleted → clear group state (ChatContext handles sidebar eviction)
    const onGroupDeleted = ({ groupId }) => {
      if (!isCurrent(groupId)) return;
      setGroupDetails(null);
      setMembers([]);
      setShowInfoPanel(false);
      setShowSettings(false);
    };

    socket.on(GE.INFO_UPDATED,          onInfoUpdated);
    socket.on(GE.MEMBER_ADDED,          onMemberAdded);
    socket.on(GE.MEMBER_REMOVED,        onMemberRemoved);
    socket.on(GE.MEMBER_LEFT,           onMemberLeft);
    socket.on(GE.ADMIN_PROMOTED,        onAdminPromoted);
    socket.on(GE.ADMIN_DEMOTED,         onAdminDemoted);
    socket.on(GE.RESTRICTION_TOGGLED,   onRestrictionToggled);
    socket.on(GE.OWNERSHIP_TRANSFERRED, onOwnershipTransferred);
    socket.on(GE.DELETED,               onGroupDeleted);

    return () => {
      socket.off(GE.INFO_UPDATED,          onInfoUpdated);
      socket.off(GE.MEMBER_ADDED,          onMemberAdded);
      socket.off(GE.MEMBER_REMOVED,        onMemberRemoved);
      socket.off(GE.MEMBER_LEFT,           onMemberLeft);
      socket.off(GE.ADMIN_PROMOTED,        onAdminPromoted);
      socket.off(GE.ADMIN_DEMOTED,         onAdminDemoted);
      socket.off(GE.RESTRICTION_TOGGLED,   onRestrictionToggled);
      socket.off(GE.OWNERSHIP_TRANSFERRED, onOwnershipTransferred);
      socket.off(GE.DELETED,               onGroupDeleted);
    };
  }, [socket]);

  const value = {
    // State
    members, groupDetails, isLoadingGroup, groupError,
    // Derived
    isGroup, isRestricted, myRole, isAdmin, isSuperAdmin, canSend,
    // UI toggles
    showInfoPanel, setShowInfoPanel,
    showSettings,  setShowSettings,
    showAddMembers, setShowAddMembers,
    showInvite,    setShowInvite,
    // Actions
    refreshGroupDetails,
    handleUpdateInfo,
    handleAddMembers,
    handleRemoveMember,
    handlePromote,
    handleDemote,
    handleToggleRestriction,
    handleLeaveGroup,
    handleTransferOwnership,
    handleDeleteGroup,
    handleGenerateInvite,
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};