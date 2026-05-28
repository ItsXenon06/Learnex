import api from './api.js';

// ── Feed ──────────────────────────────────────────────────────────────────
// sort: 'latest' | 'likes'   window: '24h' | '30d' | '365d'
const getFeed = (page = 0, size = 20, sort = 'latest', window = '24h') =>
  api.get('/posts/feed', { params: { page, size, sort, window } });

const getDiscover = (page = 0, size = 20, sort = 'latest', window = '24h') =>
  api.get('/posts/discover', { params: { page, size, sort, window } });

const getUserPosts = (userId, page = 0, size = 20) =>
  api.get(`/users/${userId}/posts`, { params: { page, size } });

// ── Single post ───────────────────────────────────────────────────────────
const getPost = (postId) => api.get(`/posts/${postId}`);

// ── Create / Edit / Delete ────────────────────────────────────────────────
const createPost = (data) => api.post('/posts', data);
const updatePost = (postId, data) => api.put(`/posts/${postId}`, data);
const deletePost = (postId) => api.delete(`/posts/${postId}`);

// ── Reactions ─────────────────────────────────────────────────────────────
const reactToPost = (postId, reactionType) =>
  api.post(`/posts/${postId}/reactions`, { reactionType });

const removePostReaction = (postId) =>
  api.delete(`/posts/${postId}/reactions`);

const getPostReactions = (postId) =>
  api.get(`/posts/${postId}/reactions`);

// ── Saved posts ───────────────────────────────────────────────────────────
const getSavedPosts = () => api.get('/users/me/saved-posts');
const savePost    = (postId) => api.post(`/posts/${postId}/save`);
const unsavePost  = (postId) => api.delete(`/posts/${postId}/save`);

// ── Media upload ──────────────────────────────────────────────────────────
const uploadMedia = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Group posts ───────────────────────────────────────────────────────────
const getGroupPosts = (groupId, page = 0, size = 20, sort = 'latest') =>
  api.get(`/groups/${groupId}/posts`, { params: { page, size, sort } });

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
  uploadMedia,
  getGroupPosts,
};