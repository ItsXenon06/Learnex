import api from "./api.js";

const getGroups = (page = 0, size = 30) =>
  api.get("/groups", { params: { page, size } });

const getMyGroups = () => api.get("/groups/mine");
const getGroup = (groupId) => api.get(`/groups/${groupId}`);
const createGroup = (data) => api.post("/groups", data);
const updateGroup = (groupId, data) => api.put(`/groups/${groupId}`, data);
const deleteGroup = (groupId) => api.delete(`/groups/${groupId}`);
const joinGroup = (groupId) => api.post(`/groups/${groupId}/join`);
const leaveGroup = (groupId) => api.delete(`/groups/${groupId}/leave`);
const getMembers = (groupId) => api.get(`/groups/${groupId}/members`);

// PUT /api/groups/{groupId}/members/{userId}/role
// body: { role: 'owner' | 'admin' | 'moderator' | 'member' }
const updateMemberRole = (groupId, userId, role) =>
  api.put(`/groups/${groupId}/members/${userId}/role`, { role });

// DELETE /api/groups/{groupId}/members/{userId}
const removeMember = (groupId, userId) =>
  api.delete(`/groups/${groupId}/members/${userId}`);

const getAnnouncements = (groupId) =>
  api.get(`/groups/${groupId}/announcements`);
const createAnnouncement = (groupId, data) =>
  api.post(`/groups/${groupId}/announcements`, data);
const getResources = (groupId) => api.get(`/groups/${groupId}/resources`);

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
  updateMemberRole,
  removeMember,
  getAnnouncements,
  createAnnouncement,
  getResources,
};
