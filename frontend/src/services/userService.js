import api from './api.js';

// ─── Profile ──────────────────────────────────────────────────────────────
// GET /api/users/{userId} → ProfileResponse
const getProfile = (userId) => api.get(`/users/${userId}`);

// PUT /api/users/me  (NOT /{userId} — backend only accepts /me for security)
const updateProfile = (data) => api.put('/users/me', data);

// ─── Follow ───────────────────────────────────────────────────────────────
// No currentUserId param — backend resolves from JWT
const follow = (targetUserId) =>
  api.post(`/users/${targetUserId}/follow`);

const unfollow = (targetUserId) =>
  api.delete(`/users/${targetUserId}/follow`);

// GET /api/users/{userId}/followers → List<FollowResponse>
const getFollowers = (userId) => api.get(`/users/${userId}/followers`);

// GET /api/users/{userId}/following → List<FollowResponse>
const getFollowing = (userId) => api.get(`/users/${userId}/following`);

// ─── Search ───────────────────────────────────────────────────────────────
// GET /api/users/search?email=...  → exact email lookup for DM creation
// BUG FIX: was /api/users?email=... (route doesn't exist); correct is /search
const searchByEmail = (email) =>
  api.get('/users/search', { params: { email } });

// GET /api/users/search?q=... → general name/email fragment search
const search = (q) =>
  api.get('/users/search', { params: { q } });

// GET /api/users/me → ProfileResponse for the logged-in user
const getMe = () => api.get('/users/me');
const getSuggestions = () => api.get('/users/suggestions');
export default {
  getProfile,
  updateProfile,
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  searchByEmail,
  search,
  getMe,
  getSuggestions
};