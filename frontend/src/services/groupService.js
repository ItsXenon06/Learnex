import api from './api.js';

// GET /api/groups
const getGroups = (page = 0, size = 30) =>
  api.get('/groups', { params: { page, size } });

// FIX: was /users/me/groups which didn't exist.
// Backend now serves this at GET /api/groups/mine
const getMyGroups = () =>
  api.get('/groups/mine');

const getGroup = (groupId) =>
  api.get(`/groups/${groupId}`);

// POST /api/groups  (userId from JWT, not params)
const createGroup = (data) =>
  api.post('/groups', data);

const updateGroup = (groupId, data) =>
  api.put(`/groups/${groupId}`, data);

const deleteGroup = (groupId) =>
  api.delete(`/groups/${groupId}`);

// POST /api/groups/{id}/join
const joinGroup = (groupId) =>
  api.post(`/groups/${groupId}/join`);

// DELETE /api/groups/{id}/leave
const leaveGroup = (groupId) =>
  api.delete(`/groups/${groupId}/leave`);

const getMembers = (groupId) =>
  api.get(`/groups/${groupId}/members`);

const getAnnouncements = (groupId) =>
  api.get(`/groups/${groupId}/announcements`);

const createAnnouncement = (groupId, data) =>
  api.post(`/groups/${groupId}/announcements`, data);

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