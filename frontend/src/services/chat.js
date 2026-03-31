import api from "./axios";


// Conversations 
export const fetchConversations = () =>
  api.get("/conversations");

export const getOrCreatePrivateConversation = (receiverId) =>
  api.post("/conversations/private", { receiverId });

export const createGroupConversation = (groupName, members) =>
  api.post("/conversations/group", { groupName, members });

export const markConversationAsRead = (conversationId) =>
  api.patch(`/conversations/read/${conversationId}`);

export const deleteConversation = (conversationId) =>
  api.delete(`/conversations/${conversationId}`);


//  Messages 
export const fetchMessages = (conversationId, cursor = null, limit = 20) => {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  return api.get(`/messages/${conversationId}`, { params });
};

// Updated: accepts optional replyTo (message _id string)
export const sendMessage = (conversationId, content, file = null, replyTo = null) => {
  const formData = new FormData();
  formData.append("conversationId", conversationId);
  if (content)  formData.append("content",  content);
  if (file)     formData.append("file",     file);
  if (replyTo)  formData.append("replyTo",  replyTo);

  return api.post("/messages", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const editMessage = (messageId, newContent) =>
  api.patch(`/messages/edit/${messageId}`, { newContent });

export const deleteMessage = (messageId) =>
  api.delete(`/messages/delete/${messageId}`);

// NEW: toggle an emoji reaction on a message
export const reactToMessage = (messageId, emoji) =>
  api.post(`/messages/${messageId}/react`, { emoji });

// NEW: soft-delete all of the current user's messages in a conversation
export const clearChat = (conversationId) =>
  api.patch(`/conversations/clear/${conversationId}`);


//  Notifications 
export const fetchNotifications = (cursor = null, limit = 20) => {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  return api.get("/notifications", { params });
};

export const markNotificationAsRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}`);


// Block/Unblock 
export const blockUser   = (userId) => 
  api.post(`/auth/block/${userId}`);

export const unblockUser = (userId) => 
  api.delete(`/auth/unblock/${userId}`);


// AI => Used for explicit/manual AI triggers. Auto-trigger happens server-side via
//sendMessage (private AI chat) or @Lumio mention detection (group chat).
 export const sendAIMessage = (conversationId, message) =>
  api.post(`/ai/respond/${conversationId}`, { message });