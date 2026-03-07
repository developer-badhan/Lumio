// chatService.js — API wrapper for all chat-related backend endpoints.
// Every function maps 1:1 to a backend route. No business logic here —
// that lives in ChatContext. Components never call api directly.

import api from "./axios";


// ─── Conversations ────────────────────────────────────────────────────────────

// GET /conversations — fetch all conversations for the logged-in user
export const fetchConversations = () =>
  api.get("/conversations");

// POST /conversations/private — find or create a private conversation
// receiverId: string (MongoDB _id of the other user)
export const getOrCreatePrivateConversation = (receiverId) =>
  api.post("/conversations/private", { receiverId });

// POST /conversations/group — create a new group conversation
// groupName: string, members: string[] (array of user _ids)
export const createGroupConversation = (groupName, members) =>
  api.post("/conversations/group", { groupName, members });

// PATCH /conversations/read/:conversationId — zero out unread count + mark all messages read
export const markConversationAsRead = (conversationId) =>
  api.patch(`/conversations/read/${conversationId}`);

// DELETE /conversations/:conversationId — soft delete (only hides for current user)
export const deleteConversation = (conversationId) =>
  api.delete(`/conversations/${conversationId}`);


// ─── Messages ────────────────────────────────────────────────────────────────

// GET /messages/:conversationId?cursor=X&limit=20
// cursor: ISO date string from previous page's nextCursor (omit for first page)
export const fetchMessages = (conversationId, cursor = null, limit = 20) => {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  return api.get(`/messages/${conversationId}`, { params });
};

// POST /messages — send text or media message
// conversationId: string
// content: string (required for text, omit for media-only)
// file: File object (optional, for image/audio/video/voice)
export const sendMessage = (conversationId, content, file = null) => {
  const formData = new FormData();
  formData.append("conversationId", conversationId);
  if (content) formData.append("content", content);
  if (file)    formData.append("file", file);

  return api.post("/messages", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

// PATCH /messages/edit/:messageId — edit a text message's content
export const editMessage = (messageId, newContent) =>
  api.patch(`/messages/edit/${messageId}`, { newContent });

// DELETE /messages/delete/:messageId — soft delete (sets isDeleted = true)
export const deleteMessage = (messageId) =>
  api.delete(`/messages/delete/${messageId}`);


// ─── Notifications ────────────────────────────────────────────────────────────

// GET /notifications?cursor=X&limit=20
export const fetchNotifications = (cursor = null, limit = 20) => {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  return api.get("/notifications", { params });
};

// PATCH /notifications/:notificationId — mark a single notification as read
export const markNotificationAsRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}`);