import api from './api.js';

// Login — backend expects { identifier, password }
export const login = ({ identifier, password }) =>
  api.post('/auth/login', { identifier, password });

// Register — backend expects { email, password } minimum
// Pass extra fields (firstName, lastName, username) if your backend supports them
export const register = ({ email, password, firstName, lastName, username }) =>
  api.post('/auth/register', { email, password, firstName, lastName, username });

// OAuth: send provider token to backend
export const oauth = ({ provider, token }) =>
  api.post('/auth/oauth', { provider, token });

export const forgotPassword = ({ email }) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = ({ token, newPassword }) =>
  api.post('/auth/reset-password', { token, newPassword });

// Keep default export for any existing imports
export default { login, register, oauth, forgotPassword, resetPassword };