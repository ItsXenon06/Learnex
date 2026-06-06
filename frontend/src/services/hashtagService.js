import api from './api.js'

// GET /api/hashtags/trending?limit=5
const getTrendingHashtags = (limit = 5) => 
  api.get('/hashtags/trending', { params: { limit } })

// GET /api/hashtags/{tag}/posts?page=0&size=20
const getHashtagPosts = (tag, page = 0, size = 20) => 
  api.get(`/hashtags/${encodeURIComponent(tag)}/posts`, { params: { page, size } })

const searchHashtags = (query) => 
  api.get('/hashtags/search', { params: { q: query } })

export default {
  getTrendingHashtags,
  getHashtagPosts,
  searchHashtags,
}
