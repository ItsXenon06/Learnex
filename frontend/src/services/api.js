import axios from 'axios';

const AUTH_STORAGE_KEY = 'learnex_auth';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const auth = JSON.parse(raw);
        if (auth?.token) {
          config.headers['Authorization'] = `Bearer ${auth.token}`;
        }
      }
    } catch (error) {
      console.warn('Failed to attach auth token', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: unwrap ApiResponse<T> + handle 401 ──────────────────────────
api.interceptors.response.use(
  (response) => {
    const d = response.data;
    if (
      d &&
      typeof d === 'object' &&
      Object.prototype.hasOwnProperty.call(d, 'success') &&
      Object.prototype.hasOwnProperty.call(d, 'data')
    ) {
      return { ...response, data: d.data };
    }
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      const code    = error.response?.data?.code;
      const isExpiry = code === 'TOKEN_EXPIRED';

      localStorage.removeItem(AUTH_STORAGE_KEY);

      if (!window.location.pathname.includes('/login')) {
        const reason = isExpiry ? 'expired' : 'unauthorized';
        window.location.href = `/login?session=${reason}`;
      }
    }

    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred';
    error.displayMessage = msg;
    return Promise.reject(error);
  },
);

export default api;