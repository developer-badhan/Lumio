import api from './axios';

// Group CRUD 
export const createGroup = (formData) =>
  api.post('/groups', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getGroupDetails = (groupId) =>
  api.get(`/groups/${groupId}`);

export const updateGroupInfo = (groupId, formData) =>
  api.patch(`/groups/${groupId}/info`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteGroup = (groupId) =>
  api.delete(`/groups/${groupId}`);

//  Members 
export const getGroupMembers = (groupId, search = '') =>
  api.get(`/groups/${groupId}/members`, { params: search ? { search } : {} });

export const addMembers = (groupId, memberIds) =>
  api.post(`/groups/${groupId}/members`, { memberIds });

export const removeMember = (groupId, userId) =>
  api.delete(`/groups/${groupId}/members/${userId}`);

export const leaveGroup = (groupId) =>
  api.post(`/groups/${groupId}/leave`);

export const promoteToAdmin = (groupId, userId) =>
  api.patch(`/groups/${groupId}/members/${userId}/promote`);

export const demoteAdmin = (groupId, userId) =>
  api.patch(`/groups/${groupId}/members/${userId}/demote`);

export const toggleRestriction = (groupId) =>
  api.patch(`/groups/${groupId}/restrict`);

export const transferOwnership = (groupId, userId) =>
  api.patch(`/groups/${groupId}/transfer`, { userId });

export const generateInviteLink = (groupId) =>
  api.get(`/groups/${groupId}/invite`);

export const joinViaInvite = (token) =>
  api.post(`/groups/join/${token}`);

export const getMentionSuggestions = (groupId, query = '') =>
  api.get(`/groups/${groupId}/mentions`, { params: query ? { query } : {} });

export const checkSendPermission = (groupId) =>
  api.get(`/groups/${groupId}/can-send`);