import api from './api.js';

// POST /api/conversations   body: { recipientId }
// Returns existing DM if one already exists (backend deduplicates)
const startConversation = (recipientId) =>
  api.post('/conversations', { recipientId });

// POST /api/conversations/group
// body: { name, memberIds, groupTag? }
// groupTag = "grp:{studyGroupId}" — backend returns existing conv if same tag exists
// This prevents creating duplicate group chats when pressing the chat button on a group
const startGroupConversation = (name, memberIds, groupTag = null) =>
  api.post('/conversations/group', {
    name,
    memberIds,
    ...(groupTag ? { groupTag } : {}),
  });

// GET /api/conversations
const getConversations = () =>
  api.get('/conversations');

// GET /api/conversations/{convId}/messages?page=...&size=...
const getMessages = (convId, page = 0, size = 50) =>
  api.get(`/conversations/${convId}/messages`, { params: { page, size } });

// POST /api/conversations/{convId}/messages
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
  startGroupConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessageAsRead,
};