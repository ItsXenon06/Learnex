import api from './api.js';

// ── Feed ──────────────────────────────────────────────────────────────────
// BUG FIX: previously passed userId as a query param to /feed.
// The backend now resolves userId from the JWT token — no param needed.
// Sending it anyway was harmless before but now the controller ignores it.
const getFeed = (page = 0, size = 20) =>
  api.get('/posts/feed', { params: { page, size } });

// Discover tab: public posts, no auth-specific filtering
const getDiscover = (page = 0, size = 20) =>
  api.get('/posts/discover', { params: { page, size } });

// User profile page: all posts by a specific user
const getUserPosts = (userId, page = 0, size = 20) =>
  api.get(`/users/${userId}/posts`, { params: { page, size } });

// ── Single post ───────────────────────────────────────────────────────────
const getPost = (postId) => api.get(`/posts/${postId}`);

// ── Create / Edit / Delete ────────────────────────────────────────────────
// BUG FIX: previously passed authorId as a query param.
// The backend now reads the author from the JWT — just send the body.
const createPost = (data) =>
  api.post('/posts', data);

const updatePost = (postId, data) =>
  api.put(`/posts/${postId}`, data);

// BUG FIX: previously passed userId as a query param.
// The backend now reads userId from the JWT.
const deletePost = (postId) =>
  api.delete(`/posts/${postId}`);

// ── Reactions ─────────────────────────────────────────────────────────────
// BUG FIX: previously passed userId in the body — backend now ignores it
// and uses the JWT. We still send reactionType in the body.
// These routes were also MISSING from the old PostController;
// they are now wired to POST/DELETE /api/posts/{id}/reactions.
const reactToPost = (postId, reactionType) =>
  api.post(`/posts/${postId}/reactions`, { reactionType });

// BUG FIX: userId was a query param — no longer needed.
const removePostReaction = (postId) =>
  api.delete(`/posts/${postId}/reactions`);

const getPostReactions = (postId) =>
  api.get(`/posts/${postId}/reactions`);

// ── Saved posts ───────────────────────────────────────────────────────────
const getSavedPosts = () =>
  api.get('/users/me/saved-posts');

const savePost = (postId) =>
  api.post(`/posts/${postId}/save`);

const unsavePost = (postId) =>
  api.delete(`/posts/${postId}/save`);

const uploadMedia = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export default {
  getFeed,
  getDiscover,
  getUserPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
  removePostReaction,
  getPostReactions,
  getSavedPosts,
  savePost,
  unsavePost,
};