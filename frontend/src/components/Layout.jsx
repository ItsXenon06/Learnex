/**
 * Layout.jsx — Shared shell for all authenticated pages.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getInitials } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

/* ─── Shared CSS ──────────────────────────────────────────────────────────── */
export const sharedCss = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#E8192C;--red2:#FF1F35;--red3:#ff4d5e;
  --red-glow:rgba(232,25,44,.25);--red-sub:rgba(232,25,44,.08);--red-border:rgba(232,25,44,.28);
  --orange:#FF6B35;--orange-sub:rgba(255,107,53,.08);
  --bg:#070709;--s1:#0e0e12;--s2:#141419;--s3:#1c1c23;--s4:#24242d;
  --b1:rgba(255,255,255,.06);--b2:rgba(255,255,255,.11);--b3:rgba(255,255,255,.18);
  --t1:#F0F0F5;--t2:#9999aa;--t3:#55556a;--t4:#2e2e3e;
  --gold:#C9A84C;--gold-sub:rgba(201,168,76,.12);--gold-border:rgba(201,168,76,.25);
  --green:#22c55e;--blue:#4a9eff;--purple:#9b59f5;
  --grad-red:linear-gradient(135deg,#E8192C 0%,#7a000e 100%);
  --grad-fire:linear-gradient(135deg,#E8192C 0%,#FF6B35 100%);
  --grad-royal:linear-gradient(135deg,#E8192C 0%,#9b59f5 100%);
  --fd:'Bebas Neue',sans-serif;--fb:'Syne',sans-serif;--fm:'JetBrains Mono',monospace;
  --tb:58px;--sb:300px;--rp:310px;
  --ease:cubic-bezier(.4,0,.2,1);
}
html{-webkit-font-smoothing:antialiased;scroll-behavior:smooth;}
body{
  font-family:var(--fb);background:var(--bg);color:var(--t1);min-height:100vh;
  background-color:#07070a;
  background-image:
    radial-gradient(ellipse 55% 45% at 10% 15%,rgba(232,25,44,.09) 0%,transparent 60%),
    radial-gradient(ellipse 45% 55% at 90% 80%,rgba(255,107,53,.07) 0%,transparent 55%),
    radial-gradient(ellipse 35% 40% at 55% 50%,rgba(155,89,245,.05) 0%,transparent 50%),
    radial-gradient(ellipse 60% 30% at 70% 10%,rgba(74,158,255,.04) 0%,transparent 45%),
    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='.022'/></svg>");
}

/* TOPBAR */
.tb{
  position:fixed;top:0;left:0;right:0;z-index:300;
  height:var(--tb);
  background:rgba(7,7,9,.92);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--b1);
  display:flex;align-items:center;padding:0 24px;gap:16px;
}
.tb-logo{font-family:var(--fd);font-size:24px;letter-spacing:5px;flex-shrink:0;user-select:none;cursor:pointer;}
.tb-logo em{color:var(--red);font-style:normal;text-shadow:0 0 20px var(--red-glow);}
.tb-divider{width:1px;height:22px;background:var(--b2);flex-shrink:0;}
.tb-search{flex:1;max-width:380px;position:relative;}
.tb-search input{
  width:100%;padding:8px 16px 8px 38px;
  background:var(--s2);border:1px solid var(--b1);border-radius:8px;
  color:var(--t1);font-size:13px;font-family:var(--fb);outline:none;
  transition:border-color .2s,background .2s,box-shadow .2s;letter-spacing:.2px;
}
.tb-search input:focus{border-color:var(--red-border);background:var(--s3);box-shadow:0 0 0 3px var(--red-sub);}
.tb-search input::placeholder{color:var(--t3);}
.tb-si{
  position:absolute;left:13px;top:50%;transform:translateY(-50%);
  color:var(--t3);font-size:14px;cursor:pointer;transition:color .15s;
  background:none;border:none;padding:0;display:flex;align-items:center;
}
.tb-si:hover{color:var(--t1);}
.tb-gap{flex:1;}
.tb-pills{display:flex;align-items:center;gap:6px;}
.tb-pill{
  height:34px;padding:0 14px;border-radius:7px;border:none;
  background:var(--s2);color:var(--t2);font-size:12px;font-family:var(--fb);font-weight:600;
  letter-spacing:.5px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:7px;
  position:relative;
}
.tb-lang{display:flex;align-items:center;gap:8px;}
.lang-btn{
  height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--b1);
  background:var(--s2);color:var(--t2);font-size:12px;font-family:var(--fb);font-weight:700;
  cursor:pointer;transition:all .15s;
}
.lang-btn.on{background:var(--red);color:#fff;border-color:var(--red-border);}
.tb-pill:hover{background:var(--s3);color:var(--t1);}
.tb-pill.tb-pill--active{background:var(--red-sub);color:var(--red);border:1px solid var(--red-border);}
.tb-dot{position:absolute;top:6px;right:6px;width:6px;height:6px;background:var(--red);border-radius:50%;border:1.5px solid var(--bg);box-shadow:0 0 6px var(--red);}
.tb-av{
  width:34px;height:34px;border-radius:8px;cursor:pointer;flex-shrink:0;
  background:var(--grad-fire);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:14px;color:#fff;
  border:1px solid transparent;transition:all .2s;
  box-shadow:0 2px 10px var(--red-glow);overflow:hidden;
}
.tb-av:hover{border-color:var(--red);transform:scale(1.05);}

/* PAGE — 3-col (sidebar | content | rightPanel?) */
.lx-page{
  padding-top:var(--tb);
  display:grid;
  min-height:100vh;
  width:100%;
  max-width:1600px;
  margin:0 auto;
}
.lx-page--2col{grid-template-columns:var(--sb) 1fr;}
.lx-page--3col{grid-template-columns:var(--sb) 1fr var(--rp);}

/* SIDEBAR */
.sidebar{
  padding:16px 10px;position:sticky;top:var(--tb);
  height:calc(100vh - var(--tb));overflow-y:auto;
  display:flex;flex-direction:column;gap:2px;
  border-right:1px solid var(--b1);
}
.sidebar::-webkit-scrollbar{display:none;}
.sb-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:var(--t4);padding:12px 14px 6px;margin-top:6px;}
.nb{
  display:flex;align-items:center;gap:13px;padding:12px 16px;border-radius:10px;
  border:none;background:transparent;color:var(--t2);font-size:15px;font-family:var(--fb);
  font-weight:600;letter-spacing:.2px;cursor:pointer;transition:all .15s;width:100%;text-align:left;
}
.nb:hover{background:var(--s2);color:var(--t1);}
.nb.on{
  background:rgba(232,25,44,.05);
  color:rgba(232,25,44,.85);
  border-left:2px solid rgba(232,25,44,.4);
  padding-left:14px;
}
.nb-icon{font-size:19px;width:24px;text-align:center;flex-shrink:0;}
.nb-badge{margin-left:auto;background:var(--red);color:#fff;font-size:11px;font-weight:800;border-radius:5px;padding:2px 7px;font-family:var(--fm);}
.sb-divider{height:1px;background:var(--b1);margin:8px 10px;}
.sb-footer{margin-top:auto;border-top:1px solid var(--b1);padding-top:12px;}
.sb-me{display:flex;align-items:center;gap:11px;padding:11px 16px;border-radius:10px;cursor:pointer;transition:background .15s;}
.sb-me:hover{background:var(--s2);}
.sb-mav{width:38px;height:38px;border-radius:9px;flex-shrink:0;background:var(--grad-fire);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:15px;color:#fff;overflow:hidden;}
.sb-minfo{min-width:0;}
.sb-mname{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
.sb-memail{font-size:11px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
.sb-logout{display:flex;align-items:center;gap:9px;padding:10px 16px;border-radius:10px;border:none;background:transparent;color:var(--t3);font-size:13px;font-family:var(--fb);cursor:pointer;transition:all .15s;width:100%;}
.sb-logout:hover{color:var(--red);background:var(--red-sub);}

/* COMMON SKELETON */
.sk{background:var(--s3);border-radius:5px;animation:lx-pulse 1.7s ease infinite;}
@keyframes lx-pulse{0%,100%{opacity:.2}50%{opacity:.5}}

/* COMMON EMPTY STATE */
.lx-empty{text-align:center;padding:60px 20px;}
.lx-empty-ic{font-size:40px;margin-bottom:14px;}
.lx-empty-t{font-family:var(--fd);font-size:30px;letter-spacing:3px;margin-bottom:8px;}
.lx-empty-s{font-size:13px;color:var(--t3);line-height:1.8;}

/* MOBILE BOTTOM NAV */
.mob-nav{
  display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;
  background:rgba(7,7,9,.97);backdrop-filter:blur(14px);
  border-top:1px solid var(--b1);padding:6px 0;
}
.mn-inner{display:flex;justify-content:space-around;}
.mn-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 12px;border:none;background:transparent;color:var(--t3);cursor:pointer;transition:color .15s;position:relative;}
.mn-btn.on{color:var(--red);}
.mn-btn span:first-child{font-size:20px;}
.mn-btn span:last-child{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}
.mn-dot{position:absolute;top:2px;right:6px;width:6px;height:6px;background:var(--red);border-radius:50%;border:1.5px solid var(--bg);}

@media(max-width:1200px){.lx-page--3col{grid-template-columns:var(--sb) 1fr;} .lx-rp{display:none;}}
@media(max-width:780px){
  .sidebar{display:none;}
  .lx-page--2col,.lx-page--3col{grid-template-columns:1fr;}
  .mob-nav{display:block;}
  .lx-page > *:not(.mob-nav){padding-bottom:70px;}
}
`;

/* ─── Nav config ─────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { key: 'feed',          icon: '🏠', labelKey: 'nav.feed',          path: '/feed' },
  { key: 'notifications', icon: '🔔', labelKey: 'nav.notifications', path: '/notifications', badgeKey: 'unreadNotif' },
  { key: 'messages',      icon: '💬', labelKey: 'nav.messages',      path: '/messages',      badgeKey: 'unreadMsgs' },
  { key: 'groups',        icon: '👥', labelKey: 'nav.groups',        path: '/groups' },
  { key: 'saved',         icon: '🔖', labelKey: 'nav.saved',         path: '/saved' },
  { key: 'courses',       icon: '🎓', labelKey: 'nav.courses',       path: '/courses' },
];

const MOBILE_NAV = [
  { key: 'feed',          icon: '🏠', labelKey: 'nav.feed',     path: '/feed' },
  { key: 'notifications', icon: '🔔', labelKey: 'nav.notifications',   path: '/notifications', badgeKey: 'unreadNotif' },
  { key: 'messages',      icon: '💬', labelKey: 'nav.messages', path: '/messages',      badgeKey: 'unreadMsgs' },
  { key: 'groups',        icon: '👥', labelKey: 'nav.groups',   path: '/groups' },
  { key: 'profile',       icon: '👤', labelKey: 'nav.profile' },
];

/* ─── Layout ─────────────────────────────────────────────────────────────── */
export default function Layout({
  active,
  children,
  rightPanel,
  profile,
  unreadNotif = 0,
  unreadMsgs  = 0,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.resolvedLanguage || 'en';
  const setLanguage = (lng) => {
    i18n.changeLanguage(lng);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('learnex_lang', lng);
    }
  };

  const uid = user?.userId ?? user?.id;

  // ── All state declarations at top level ───────────────────────────────────
  const [searchVal,      setSearchVal]      = useState('');
  const [liveUnreadNotif, setLiveUnreadNotif] = useState(unreadNotif);
  const [ownProfile,     setOwnProfile]     = useState(null);

  // ── Effect 1: sync unreadNotif prop → local state ─────────────────────────
  useEffect(() => {
    setLiveUnreadNotif(unreadNotif);
  }, [unreadNotif]);

  // ── Effect 2: fetch own profile for topbar/sidebar avatar ─────────────────
  useEffect(() => {
    if (!uid) return;
    const token = (() => {
      try { return JSON.parse(localStorage.getItem('learnex_auth') || '{}')?.token || ''; }
      catch { return ''; }
    })();
    if (!token) return;
    fetch(`/api/users/${uid}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setOwnProfile(data?.data ?? data); })
      .catch(() => {});
  }, [uid]);

  // ── Effect 3: listen for notifications-cleared event from NotificationsPage
  useEffect(() => {
    const handler = () => setLiveUnreadNotif(0);
    window.addEventListener('learnex:notifications-cleared', handler);
    return () => window.removeEventListener('learnex:notifications-cleared', handler);
  }, []);

  // ── Effect 4: poll unread notification count every 30s ────────────────────
  useEffect(() => {
    if (!uid) return;
    const fetchUnread = () => {
      const token = (() => {
        try { return JSON.parse(localStorage.getItem('learnex_auth') || '{}')?.token || ''; }
        catch { return ''; }
      })();
      if (!token) return;
      fetch('/api/notifications?page=0&size=1&unreadOnly=true', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const count = data?.data?.unreadCount ?? data?.unreadCount ?? 0;
          setLiveUnreadNotif(count);
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [uid]);

  // ── Derived values ────────────────────────────────────────────────────────
  const activeProfile = ownProfile ?? profile;
  const avatarUrl     = activeProfile?.avatarUrl ?? null;
  const displayName   = activeProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Student';
  const ini           = getInitials(activeProfile?.displayName || user?.displayName, user?.email);

  const badges = { unreadNotif: liveUnreadNotif, unreadMsgs };
  const cols   = rightPanel ? 'lx-page--3col' : 'lx-page--2col';

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleSearch = () => {
    const q = searchVal.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <style>{sharedCss}</style>

      {/* ── TOPBAR ── */}
      <div className="tb">
        <span className="tb-logo" onClick={() => navigate('/feed')}>
          LEARN<em>EX</em>
        </span>
        <div className="tb-divider" />
        <div className="tb-search">
          <button className="tb-si" onClick={handleSearch} title={t('app.search')}>⌕</button>
          <input
            placeholder={t('app.searchPlaceholder')}
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="tb-gap" />
        <div className="tb-pills">
          <button
            className={`tb-pill ${active === 'notifications' ? 'tb-pill--active' : ''}`}
            onClick={() => navigate('/notifications')}
          >
            🔔 {t('nav.notifications')}
            {liveUnreadNotif > 0 && <span className="tb-dot" />}
          </button>
          <button
            className={`tb-pill ${active === 'messages' ? 'tb-pill--active' : ''}`}
            onClick={() => navigate('/messages')}
          >
            💬 {t('nav.messages')}
            {unreadMsgs > 0 && <span className="tb-dot" />}
          </button>
          <button
            className={`tb-pill ${active === 'groups' ? 'tb-pill--active' : ''}`}
            onClick={() => navigate('/groups')}
          >
            👥 {t('nav.groups')}
          </button>
        </div>
        <div className="tb-lang">
          {['en', 'vi'].map(lang => (
            <button
              key={lang}
              className={`lang-btn ${currentLang === lang ? 'on' : ''}`}
              onClick={() => setLanguage(lang)}
              type="button"
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <div
          className="tb-av"
            title={displayName}
            onClick={() => navigate(`/profile/${uid}`)}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
              : ini
            }
          </div>
      </div>

      {/* ── PAGE GRID ── */}
      <div className={`lx-page ${cols}`}>
        {/* ── SIDEBAR ── */}
        <nav className="sidebar">
          <div className="sb-label">{t('nav.navigation')}</div>

          {NAV_ITEMS.map(n => (
            <button
              key={n.key}
              className={`nb ${active === n.key ? 'on' : ''}`}
              onClick={() => navigate(n.path)}
            >
              <span className="nb-icon">{n.icon}</span>
              {t(n.labelKey)}
              {n.badgeKey && badges[n.badgeKey] > 0 && (
                <span className="nb-badge">{badges[n.badgeKey]}</span>
              )}
            </button>
          ))}

          {/* Footer: current user */}
          <div className="sb-footer">
            <div className="sb-me" onClick={() => navigate(`/profile/${uid}`)}>
              <div className="sb-mav">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                  : ini
                }
              </div>
              <div className="sb-minfo">
                <div className="sb-mname">{displayName}</div>
                <div className="sb-memail">{user?.email}</div>
              </div>
            </div>
            <button className="sb-logout" onClick={handleLogout}>
              <span>⎋</span> {t('app.signOut')}
            </button>
          </div>
        </nav>

        {/* ── MAIN CONTENT ── */}
        {children}

        {/* ── RIGHT PANEL (optional) ── */}
        {rightPanel && (
          <aside className="lx-rp">{rightPanel}</aside>
        )}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mob-nav">
        <div className="mn-inner">
          {MOBILE_NAV.map(n => {
            const path = n.key === 'profile' ? `/profile/${uid}` : n.path;
            const isOn = n.key === active || (n.key === 'profile' && active === 'profile');
            const hasDot = n.badgeKey && badges[n.badgeKey] > 0;
            return (
              <button
                key={n.key}
                className={`mn-btn ${isOn ? 'on' : ''}`}
                onClick={() => navigate(path)}
              >
                <span>{n.icon}</span>
                <span>{t(n.labelKey)}</span>
                {hasDot && <span className="mn-dot" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}