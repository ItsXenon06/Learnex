import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const AUTH_KEY = 'learnex_auth';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const auth = JSON.parse(raw);
        if (auth?.token) {
          setToken(auth.token);
          setUser(auth.user ?? null);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (userData, tokenValue) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: tokenValue, user: userData }));
    setToken(tokenValue);
    setUser(userData);
  };

  // ─── Login ────────────────────────────────────────────────────────
  // Backend: POST /api/auth/login → ApiResponse<AuthResponse>
  // AuthResponse: { token, userId, email, roles }
  // NOTE: backend does NOT return firstName/lastName from auth endpoints.
  // Those live in ProfileResponse — fetched separately when needed (ProfilePage).
  // All pages should derive display name from user.email as fallback.
  const login = async (identifier, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const payload = await res.json().catch(() => ({}));
if (!res.ok) {
  // Backend GlobalExceptionHandler returns { success: false, data: null, message: "..." }
  const msg =
    payload?.message ||
    payload?.data?.message ||
    (typeof payload?.errors === 'object'
      ? Object.values(payload.errors).join(', ')
      : null) ||
    'Registration failed';
  throw new Error(msg);
}

    // Unwrap ApiResponse<AuthResponse>
    const data = payload?.data ?? payload;
    const { token: tok, ...userData } = data;
    if (userData.displayName && userData.displayName.trim() !== '') {
      userData.displayName = userData.displayName.trim();
    }
    persist(userData, tok);
    return userData;
  };

  // ─── Register ─────────────────────────────────────────────────────
  // Backend RegisterRequest only uses { email, password } — extra fields
  // (firstName, lastName, username) are sent but backend ignores them for now.
  // Profile can be updated post-registration via PUT /api/users/{id}.
  const register = async ({ email, password, firstName, lastName, username }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, username }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.message || payload?.data?.message || 'Registration failed');
    }

    const data = payload?.data ?? payload;
    const { token: tok, ...userData } = data;
    persist(userData, tok);
    return userData;
  };

  // ─── OAuth Login ───────────────────────────────────────────────
  const oauthLogin = async (provider, token) => {
    const res = await fetch('/api/auth/oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, token }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.message || payload?.data?.message || 'OAuth login failed');
    }

    const data = payload?.data ?? payload;
    const { token: tok, ...userData } = data;
    persist(userData, tok);
    return userData;
  };

  // ─── Update user cache ────────────────────────────────────────────
  // Called by ProfilePage after a successful profile update so the
  // topbar/sidebar reflect the new displayName immediately.
  const updateUserCache = (updates) => {
    setUser(prev => {
      const merged = { ...prev, ...updates };
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        try {
          const auth = JSON.parse(stored);
          localStorage.setItem(AUTH_KEY, JSON.stringify({ ...auth, user: merged }));
        } catch { /* no-op */ }
      }
      return merged;
    });
  };

  // Expose a global handler for popup OAuth flows to call back into the app.
  useEffect(() => {
    window.__LEARNEX_OAUTH_HANDLER = async (provider, token) => {
      try {
        await oauthLogin(provider, token);
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message || 'OAuth failed' };
      }
    };
    return () => { window.__LEARNEX_OAUTH_HANDLER = undefined; };
  }, []);

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, oauthLogin, logout, updateUserCache }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Helpers (re-exported for convenience) ────────────────────────
// Derive initials from ProfileResponse.displayName or email
export function getInitials(displayName, email) {
  const src = displayName?.trim() || email?.trim() || '?';
  const parts = src.split(/[\s@]/);
  if (parts.length >= 2 && displayName) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

// Derive a short display name from ProfileResponse or AuthResponse
export function getDisplayName(profile, user) {
  if (profile?.displayName) return profile.displayName;
  if (user?.displayName)    return user.displayName;
  if (user?.email)          return user.email.split('@')[0];
  return 'Student';
}