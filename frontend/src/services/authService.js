import api from './api.js';

// Login — backend expects { identifier, password }
export const login = ({ identifier, password }) =>
  api.post('/auth/login', { identifier, password });

// Register — backend expects { email, password } minimum
// Pass extra fields (firstName, lastName, username) if your backend supports them
export const register = ({ email, password, firstName, lastName, username }) =>
  api.post('/auth/register', { email, password, firstName, lastName, username });

// Keep default export for any existing imports
export default { login, register };