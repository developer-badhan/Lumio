import api from './axios.js';

/**
 * Get paginated call history for the currently logged-in user
 * across all conversations.
 * @param {{ cursor?: string, limit?: number }} params
 */
export const getMyCallHistory = (params = {}) =>
  api.get('/calls', { params });

/**
 * Get a single call record by its database ID.
 * @param {string} callId
 */
export const getCallById = (callId) =>
  api.get(`/calls/${callId}`);

/**
 * Get paginated call history for a specific conversation.
 * Useful for rendering a call log inside a chat window.
 * @param {string} conversationId
 * @param {{ cursor?: string, limit?: number }} params
 */
export const getConversationCallHistory = (conversationId, params = {}) =>
  api.get(`/calls/conversation/${conversationId}`, { params });