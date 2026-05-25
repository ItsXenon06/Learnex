import api from './api.js';

// BUG FIX: previously sent userId in the body — the backend CommentController
// now overwrites whatever userId the client sends with the JWT-resolved userId.
// Sending it is now harmless but redundant; kept here for clarity.
// The backend's CreateCommentRequest.userId will be overwritten server-side.
const createComment = (postId, content, parentId = null) =>
  api.post(`/posts/${postId}/comments`, { content, parentId });

const getComments = (postId) =>
  api.get(`/posts/${postId}/comments`);

// BUG FIX: previously passed userId as a query param.
// Backend now resolves from JWT.
const deleteComment = (commentId) =>
  api.delete(`/comments/${commentId}`);

const reactToComment = (commentId, reactionType) =>
  api.post(`/comments/${commentId}/reactions`, { reactionType });

const removeCommentReaction = (commentId) =>
  api.delete(`/comments/${commentId}/reactions`);

export default {
  createComment,
  getComments,
  deleteComment,
  reactToComment,
  removeCommentReaction,
};