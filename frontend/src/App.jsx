import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import LoginPage          from './pages/LoginPage';
import FeedPage           from './pages/FeedPage';
import ProfilePage        from './pages/ProfilePage';
import NotificationsPage  from './pages/NotificationsPage';
import MessagesPage       from './pages/MessagesPage';
import GroupsPage         from './pages/GroupsPage';
import GroupDetailPage    from './pages/GroupDetailPage';
import SavedPage          from './pages/SavedPage';
import PostDetailPage     from './pages/PostDetailPage';
import SearchPage   from './pages/SearchPage';
import HashtagPage  from './pages/HashtagPage';
import CoursePage   from './pages/CoursePage';

/* ─── Session-expired toast ──────────────────────────────────────────────── */
const EXPIRED_KEY = 'learnex_session_expired';

function SessionExpiredToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(EXPIRED_KEY)) {
      sessionStorage.removeItem(EXPIRED_KEY);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999,
      background: '#0e0e12',
      border: '1px solid rgba(232,25,44,.4)',
      borderRadius: 12,
      padding: '14px 22px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(232,25,44,.15)',
      animation: 'toast-in .3s cubic-bezier(.4,0,.2,1)',
      fontFamily: "'Syne', sans-serif",
      minWidth: 300, maxWidth: 420,
    }}>
      <style>{`
        @keyframes toast-in {
          from { opacity:0; transform:translateX(-50%) translateY(-12px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
      <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F5', marginBottom: 2 }}>
          Session Expired
        </div>
        <div style={{ fontSize: 12, color: '#55556a', fontFamily: "'JetBrains Mono', monospace" }}>
          Please sign in again to continue.
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'none', border: 'none', color: '#55556a',
          cursor: 'pointer', fontSize: 16, padding: '0 2px', flexShrink: 0,
          transition: 'color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#F0F0F5'}
        onMouseLeave={e => e.currentTarget.style.color = '#55556a'}
      >
        ✕
      </button>
    </div>
  );
}

/* ─── Route guards ───────────────────────────────────────────────────────── */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#07070a',
      color: '#55556a', fontFamily: 'Syne, sans-serif', fontSize: 14,
    }}>
      Loading…
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/feed" replace /> : children;
}

/* ─── Routes ─────────────────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <>
      <SessionExpiredToast />
      <Routes>
        <Route path="/"         element={<Navigate to="/feed" replace />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><LoginPage /></PublicRoute>} />

        <Route path="/feed"
          element={<PrivateRoute><FeedPage /></PrivateRoute>} />

        {/* Profile */}
        <Route path="/profile/:userId"
          element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/:userId/followers"
          element={<PrivateRoute><ProfilePage initialTab="followers" /></PrivateRoute>} />
        <Route path="/profile/:userId/following"
          element={<PrivateRoute><ProfilePage initialTab="following" /></PrivateRoute>} />
        <Route path="/profile/edit"
          element={<PrivateRoute><ProfilePage editOnOpen /></PrivateRoute>} />

        {/* Messages */}
        <Route path="/messages"
          element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/messages/:convId"
          element={<PrivateRoute><MessagesPage /></PrivateRoute>} />

        {/* Notifications */}
        <Route path="/notifications"
          element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />

        {/* Groups list */}
        <Route path="/groups"
          element={<PrivateRoute><GroupsPage /></PrivateRoute>} />
        <Route path="/groups/new"
          element={<PrivateRoute><GroupsPage openCreate /></PrivateRoute>} />

        {/* Group detail — MUST be after /groups/new to avoid "new" matching :groupId */}
        <Route path="/groups/:groupId"
          element={<PrivateRoute><GroupDetailPage /></PrivateRoute>} />

        {/* Saved */}
        <Route path="/saved"
          element={<PrivateRoute><SavedPage /></PrivateRoute>} />

        {/* Post detail */}
        <Route path="/post/:postId"
          element={<PrivateRoute><PostDetailPage /></PrivateRoute>} />

<Route path="/search"
  element={<PrivateRoute><SearchPage /></PrivateRoute>} />
<Route path="/hashtag/:tag"
  element={<PrivateRoute><HashtagPage /></PrivateRoute>} />
<Route path="/courses"
  element={<PrivateRoute><CoursePage /></PrivateRoute>} />
<Route path="/courses/:courseId"
  element={<PrivateRoute><CoursePage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/Learnex">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}