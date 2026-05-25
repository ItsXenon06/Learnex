import api from './api.js';

// BUG FIX: All userId params removed — backend reads identity from JWT.
// Only data the backend can't derive itself is sent (recipientId, content, etc.)

// POST /api/conversations   body: { recipientId }
// Returns existing DM if one already exists (idempotent).
const startConversation = (recipientId) =>
  api.post('/conversations', { recipientId });

// GET /api/conversations
// → List<ConversationResponse>
const getConversations = () =>
  api.get('/conversations');

// GET /api/conversations/{convId}/messages?page=...&size=...
// → MessagePageResponse { messages (newest first), page, size, totalElements, totalPages, hasNext }
const getMessages = (convId, page = 0, size = 50) =>
  api.get(`/conversations/${convId}/messages`, { params: { page, size } });

// POST /api/conversations/{convId}/messages
// body: { content, replyToId? }
// → MessageResponse
const sendMessage = (convId, content, replyToId = null) =>
  api.post(`/conversations/${convId}/messages`, {
    content,
    ...(replyToId ? { replyToId } : {}),
  });

// PUT /api/conversations/{convId}/messages/{msgId}/read
const markMessageAsRead = (convId, msgId) =>
  api.put(`/conversations/${convId}/messages/${msgId}/read`);

export default {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessageAsRead,
};