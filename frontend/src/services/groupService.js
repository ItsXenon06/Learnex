import api from './api.js';

// GET /api/groups
const getGroups = (page = 0, size = 30) =>
  api.get('/groups', { params: { page, size } });

// GET /api/groups/mine
const getMyGroups = () =>
  api.get('/groups/mine');

// GET /api/groups/{groupId}
const getGroup = (groupId) =>
  api.get(`/groups/${groupId}`);

// POST /api/groups
const createGroup = (data) =>
  api.post('/groups', data);

// PUT /api/groups/{groupId}
const updateGroup = (groupId, data) =>
  api.put(`/groups/${groupId}`, data);

// DELETE /api/groups/{groupId}
const deleteGroup = (groupId) =>
  api.delete(`/groups/${groupId}`);

// POST /api/groups/{id}/join
const joinGroup = (groupId) =>
  api.post(`/groups/${groupId}/join`);

// DELETE /api/groups/{id}/leave
const leaveGroup = (groupId) =>
  api.delete(`/groups/${groupId}/leave`);

// GET /api/groups/{id}/members  → List<{userId, email, roleName, joinedAt}>
const getMembers = (groupId) =>
  api.get(`/groups/${groupId}/members`);

// GET /api/groups/{id}/announcements
const getAnnouncements = (groupId) =>
  api.get(`/groups/${groupId}/announcements`);

// POST /api/groups/{id}/announcements
const createAnnouncement = (groupId, data) =>
  api.post(`/groups/${groupId}/announcements`, data);

// GET /api/groups/{id}/resources
const getResources = (groupId) =>
  api.get(`/groups/${groupId}/resources`);

export default {
  getGroups,
  getMyGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getMembers,
  getAnnouncements,
  createAnnouncement,
  getResources,
};