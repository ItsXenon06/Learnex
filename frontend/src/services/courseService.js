import api from './api.js';

const getCourses = () => api.get('/courses');
const getCourse  = (id) => api.get(`/courses/${id}`);
const requestCourse = (courseName, reason) =>
  api.post('/courses/request', { courseName, reason });

export default { getCourses, getCourse, requestCourse };