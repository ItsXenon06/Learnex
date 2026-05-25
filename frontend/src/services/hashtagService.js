import api from './api.js'

const getHashtagPosts = (tag, userId, page = 0, size = 20) => api.get(`/hashtags/${encodeURIComponent(tag)}/posts`, { params: { userId, page, size } })
const searchHashtags = (query) => api.get('/hashtags/search', { params: { q: query } })

export default {
  getHashtagPosts,
  searchHashtags,
}