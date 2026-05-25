import api from './api.js';

// BUG FIX: all userId params removed — backend now resolves identity from JWT.
// Passing userId as a query param was causing mismatches and silent failures.

// GET /api/notifications?page=...&size=...&unreadOnly=...
// → NotificationPageResponse { notifications, unreadCount, page, size, totalElements, totalPages, hasNext }
const getNotifications = (page = 0, size = 20, unreadOnly = false) =>
  api.get('/notifications', { params: { page, size, unreadOnly } });

// PUT /api/notifications/{id}/read
// → NotificationResponse
const markAsRead = (id) =>
  api.put(`/notifications/${id}/read`);

// PUT /api/notifications/read-all
// → { updated: number }
const markAllAsRead = () =>
  api.put('/notifications/read-all');

// GET /api/notifications/preferences
// → List<NotificationPreference>
const getPreferences = () =>
  api.get('/notifications/preferences');

// PUT /api/notifications/preferences/{type}
// body: { email?, push?, inApp? }
// → NotificationPreference
const updatePreference = (type, data) =>
  api.put(`/notifications/preferences/${type}`, data);

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreference,
};