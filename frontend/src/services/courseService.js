import api from './api.js';

const getCourses = () => api.get('/courses');
const getCourse  = (id) => api.get(`/courses/${id}`);
const requestCourse = (courseName, reason, courseCode = "", schoolName = "") =>
  api.post('/courses/request', {
    courseName,
    reason,
    courseCode: courseCode || undefined,
    schoolName: schoolName || undefined,
  });

// Course forum endpoints - uses backend baseURL automatically
const getCoursePosts = (courseId, page = 0, size = 20) => {
  console.log("[v0] getCoursePosts called:", { courseId, page, size });
  return api.get(`/courses/${courseId}/posts`, { params: { page, size } });
};

const createCoursePost = (courseId, content, visibility = "public", mediaIds = []) =>
  api.post(`/courses/${courseId}/posts`, { 
    content, 
    visibility, 
    mediaIds,
    courseId 
  });

export default { 
  getCourses, 
  getCourse, 
  requestCourse,
  getCoursePosts,
  createCoursePost
};
