import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

/* ─── Styles ──────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Pinyon+Script&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red: #E8192C; --red-hover: #FF1F35; --red-dim: #9B1120;
    --red-glow: rgba(232,25,44,0.22); --red-subtle: rgba(232,25,44,0.08);
    --black: #080808; --bg: #0E0E0E; --surface: #141414;
    --surface2: #1C1C1C; --surface3: #242424;
    --border: rgba(255,255,255,0.07); --border-hover: rgba(255,255,255,0.14);
    --text: #F0F0F0; --text-muted: #888; --text-dim: #444;
    --gold: #C9A84C; --success: #22c55e;
    --font-display: 'Bebas Neue', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-script: 'Pinyon Script', cursive;
  }
  body { font-family: var(--font-body); background: var(--bg); color: var(--text); }

  .auth-root { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }

  /* LEFT */
  .left {
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 52px 56px; background: #0c0c0c;
  }
  .left-bg { position: absolute; inset: 0; z-index: 0; }
  .left-bg::before {
    content: ''; position: absolute; top: -20%; left: -10%;
    width: 120%; height: 70%;
    background: linear-gradient(135deg, transparent 40%, var(--red-glow) 60%, transparent 80%);
    transform: rotate(-15deg);
  }
  .left-bg::after {
    content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(rgba(232,25,44,0.06) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(232,25,44,0.06) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at 30% 50%, black 30%, transparent 80%);
  }
  .left-watermark {
    position: absolute; bottom: -60px; right: -40px; z-index: 0;
    opacity: 0.04; font-family: var(--font-display); font-size: 320px;
    color: var(--red); line-height: 1; pointer-events: none; user-select: none;
  }
  .left-logo { position: relative; z-index: 1; display: flex; align-items: center; gap: 16px; }
  .logo-icon {
    width: 54px; height: 54px; border-radius: 14px;
    background: linear-gradient(135deg, #d4001a 0%, #9c0012 60%, #700010 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(200,0,20,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
    position: relative; overflow: hidden; flex-shrink: 0;
  }
  .logo-x {
    font-family: var(--font-script); font-size: 38px; color: #000; line-height: 1;
    position: relative; z-index: 1; margin-top: 4px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3); letter-spacing: -1px;
  }
  .logo-name { font-family: var(--font-display); font-size: 30px; letter-spacing: 5px; color: var(--text); }
  .logo-name span { color: var(--red); }
  .left-hero { position: relative; z-index: 1; margin-top: -8px; }
  .left-tagline {
  font-family: var(--font-display); font-size: clamp(36px,5vw,88px);
  line-height: 0.97; letter-spacing: 1px; margin-bottom: 26px;
  word-break: keep-all;
}
  .left-tagline span { color: var(--red); display: block; }
  .left-desc { font-size: 16px; color: var(--text-muted); line-height: 1.75; max-width: 380px; }
  .left-features { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 10px; }
  .feature-pill {
    display: flex; align-items: center; gap: 18px; padding: 22px;
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    border-radius: 14px; backdrop-filter: blur(4px); transition: border-color 0.2s;
  }
  .feature-pill:hover { border-color: rgba(232,25,44,0.3); }
  .pill-icon {
    width: 42px; height: 42px; background: rgba(232,25,44,0.12);
    border-radius: 10px; display: flex; align-items: center;
    justify-content: center; font-size: 20px; flex-shrink: 0;
  }
  .pill-text strong { display: block; font-size: 15px; font-weight: 600; margin-bottom: 3px; }
  .pill-text span { font-size: 13px; color: var(--text-muted); }

  /* RIGHT */
  .right {
    display: flex; align-items: center; justify-content: center;
    padding: 48px 40px; background: var(--surface);
    position: relative; overflow: hidden;
  }
  .right::before {
    content: ''; position: absolute; top: -100px; right: -100px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, var(--red-glow) 0%, transparent 70%);
  }
  .form-card { width: 100%; max-width: 420px; position: relative; z-index: 1; }

  .mobile-logo { display: none; align-items: center; gap: 10px; margin-bottom: 32px; justify-content: center; }

  .tabs {
    display: flex; background: var(--surface2); border-radius: 12px;
    padding: 4px; margin-bottom: 36px; border: 1px solid var(--border);
  }
  .tab {
    flex: 1; padding: 10px; text-align: center; font-size: 13px;
    font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
    cursor: pointer; border-radius: 9px; transition: all 0.25s ease;
    color: var(--text-muted); border: none; background: transparent;
  }
  .tab.active { background: var(--red); color: #fff; box-shadow: 0 4px 20px var(--red-glow); }

  .form-title { font-family: var(--font-display); font-size: 38px; letter-spacing: 2px; margin-bottom: 6px; }
  .form-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 32px; }

  .field-group { display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); }
  .field-row { display: flex; gap: 12px; }
  .field-row .field { flex: 1; }

  .input-wrap { position: relative; }
  .input-wrap input {
    width: 100%; padding: 13px 16px 13px 44px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 10px; color: var(--text); font-size: 14px;
    font-family: var(--font-body); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-wrap input:focus { border-color: var(--red); box-shadow: 0 0 0 3px var(--red-glow); }
  .input-wrap input::placeholder { color: #444; }
  .input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: #444; font-size: 15px; pointer-events: none; transition: color 0.2s;
  }
  .input-wrap:focus-within .input-icon { color: var(--red); }

  .strength-bar { display: flex; gap: 4px; margin-top: 6px; }
  .strength-seg { flex: 1; height: 3px; border-radius: 2px; background: var(--surface2); transition: background 0.3s; }
  .fill-weak { background: #E8192C; }
  .fill-medium { background: var(--gold); }
  .fill-strong { background: var(--success); }

  .divider {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px; color: #333; font-size: 12px;
  }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .social-row { display: flex; gap: 10px; margin-bottom: 28px; }
  .social-btn {
    flex: 1; padding: 11px; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 10px;
    color: var(--text); font-size: 13px; font-family: var(--font-body);
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    position: relative;
  }
  .social-btn:hover:not(:disabled) { border-color: var(--border-hover); background: #222; }
  .social-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .social-btn.github-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }
  .social-btn.fb-btn:hover:not(:disabled) { border-color: rgba(24,119,242,0.5); background: rgba(24,119,242,0.05); }
  .social-btn.loading { border-color: var(--red) !important; }
  .social-spinner {
    width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.2);
    border-top-color: var(--red); border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .submit-btn {
    width: 100%; padding: 14px; background: var(--red);
    border: none; border-radius: 10px; color: #fff;
    font-size: 13px; font-weight: 700; font-family: var(--font-body);
    letter-spacing: 1.5px; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 24px var(--red-glow);
  }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
  .submit-btn:not(:disabled):hover { background: var(--red-hover); transform: translateY(-1px); box-shadow: 0 8px 32px var(--red-glow); }

  .error-banner {
    background: rgba(232,25,44,0.1); border: 1px solid rgba(232,25,44,0.3);
    border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
    font-size: 13px; color: #ff6b7a; display: flex; align-items: center; gap: 8px;
  }
  .info-banner {
    background: rgba(74,158,255,0.08); border: 1px solid rgba(74,158,255,0.25);
    border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
    font-size: 13px; color: #4a9eff; display: flex; align-items: center; gap: 8px;
  }

  .form-footer { text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted); }
  .form-footer button { background: none; border: none; color: var(--red); font-weight: 600; cursor: pointer; font-family: var(--font-body); }

  .terms { font-size: 11px; color: #444; text-align: center; margin-top: 16px; line-height: 1.5; }
  .terms span { color: var(--text-muted); cursor: pointer; text-decoration: underline; }

  .fade-in { animation: fadeIn 0.35s ease forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 768px) {
    .auth-root { grid-template-columns: 1fr; }
    .left { display: none; }
    .right { padding: 32px 24px; }
    .mobile-logo { display: flex; }
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(3, Math.ceil(s * 0.9));
}

function StrengthBar({ password }) {
  const level = getStrength(password);
  const cls = level === 1 ? 'fill-weak' : level === 2 ? 'fill-medium' : level >= 3 ? 'fill-strong' : '';
  return (
    <div className="strength-bar">
      {[0, 1, 2].map(i => <div key={i} className={`strength-seg ${i < level ? cls : ''}`} />)}
    </div>
  );
}

function LogoIcon({ size = 54 }) {
  return (
    <div className="logo-icon" style={{ width: size, height: size }}>
      <span className="logo-x" style={{ fontSize: size * 0.7 }}>𝒳</span>
    </div>
  );
}

function MobileLogoIcon() {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'linear-gradient(135deg, #c01020 0%, #8B0010 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 10px rgba(180,0,20,0.4)',
    }}>
      <span style={{ fontFamily: "'Pinyon Script', cursive", fontSize: 26, color: '#000', marginTop: 3 }}>𝒳</span>
    </div>
  );
}

/* GitHub SVG icon */
function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

/* Facebook SVG icon */
function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

const FEATURES = [
  { icon: '🎓', titleKey: 'features.studyTogether',    descKey: 'features.studyTogetherDesc' },
  { icon: '💬', titleKey: 'features.realTimeMessaging', descKey: 'features.realTimeMessagingDesc' },
  { icon: '📢', titleKey: 'features.campusFeed',        descKey: 'features.campusFeedDesc' },
];

/* ─── OAuth popup helper ──────────────────────────────────────────────── */
function openPopup(url, name, w = 600, h = 700) {
  const left = window.screenX + (window.innerWidth  - w) / 2;
  const top  = window.screenY + (window.innerHeight - h) / 2;
  return window.open(url, name, `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
}

/* ─── LoginPage ───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login, register, oauthLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [tab,      setTab]      = useState('login');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');
  const [pw,       setPw]       = useState('');
  const [form,     setForm]     = useState({
    identifier: '', email: '', password: '',
    firstName: '', lastName: '', username: '',
  });
  const [searchParams] = useSearchParams();
  const [sessionBanner, setSessionBanner] = useState('');
  const [oauthLoading, setOauthLoading] = useState(null); // 'github' | 'facebook' | null
  const popupTimerRef = useRef(null);

  useEffect(() => {
    const reason = searchParams.get('banner') || searchParams.get('session');
    if (reason === 'expired' || reason === 'session_expired') setSessionBanner(t('messages.sessionExpired'));
    else if (reason === 'unauthorized') setSessionBanner(t('messages.unauthorized'));
  }, [t]);

  useEffect(() => () => clearInterval(popupTimerRef.current), []);

  const isLogin = tab === 'login';

  const handleSwitch = (tabName) => {
    setTab(tabName);
    setError('');
    setInfo('');
    setPw('');
    setForm({ identifier: '', email: '', password: '', firstName: '', lastName: '', username: '' });
  };

  /* ── Email/password submit ── */
  const handleSubmit = async () => {
    setError(''); setInfo(''); setLoading(true);
    try {
      if (isLogin) {
        if (!form.identifier || !form.password) { setError(t('messages.fillAllFields')); return; }
        await login(form.identifier, form.password);
      } else {
        if (!form.email || !pw || !form.firstName || !form.lastName || !form.username) {
          setError(t('messages.fillAllFields')); return;
        }
        await register({
          email: form.email, password: pw,
          firstName: form.firstName, lastName: form.lastName, username: form.username,
        });
      }
      navigate('/feed');
    } catch (err) {
      setError(err.message || t('messages.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  /* ── OAuth ──────────────────────────────────────────────────────────────
   *
   *  GitHub uses the AUTHORIZATION CODE flow (not implicit).
   *  The popup visits GitHub → redirects to your oauth-callback page with
   *  ?code=XXX in the query string.  The callback page posts that code to
   *  window.opener, and the backend exchanges it for an access token.
   *
   *  Facebook uses the TOKEN (implicit) flow — the callback receives
   *  #access_token=XXX in the hash, same as before.
   *
   *  Required env vars (create frontend/.env.local):
   *    VITE_GITHUB_CLIENT_ID=your_github_oauth_app_client_id
   *    VITE_FACEBOOK_APP_ID=your_facebook_app_id
   *
   *  Callback URL to register in each provider:
   *    GitHub:   https://yourdomain.com/Learnex/oauth-callback.html?provider=github
   *    Facebook: https://yourdomain.com/Learnex/oauth-callback.html?provider=facebook
   *
   *  For local dev (Vite on :5173):
   *    GitHub:   http://localhost:5173/Learnex/oauth-callback.html?provider=github
   *    Facebook: http://localhost:5173/Learnex/oauth-callback.html?provider=facebook
   * ────────────────────────────────────────────────────────────────────── */
  const handleOAuth = (provider) => {
    if (oauthLoading) return;

    const origin   = window.location.origin;
    const redirect = `${origin}/Learnex/oauth-callback.html?provider=${provider}`;

    let authUrl = '';

    if (provider === 'github') {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId) {
        setError('GitHub OAuth is not configured (VITE_GITHUB_CLIENT_ID missing).');
        return;
      }
      // GitHub uses authorization code flow — callback receives ?code=
      const state = Math.random().toString(36).substring(2);
      sessionStorage.setItem('oauth_state', state);
      authUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirect)}` +
        `&scope=user:email` +
        `&state=${state}`;

    } else if (provider === 'facebook') {
      const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
      if (!appId) {
        setError('Facebook OAuth is not configured (VITE_FACEBOOK_APP_ID missing).');
        return;
      }
      // Facebook uses implicit token flow — callback receives #access_token=
      authUrl =
        `https://www.facebook.com/v18.0/dialog/oauth` +
        `?client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirect)}` +
        `&response_type=token` +
        `&scope=email`;
    }

    const popup = openPopup(authUrl, `${provider}_oauth`);
    if (!popup) {
      setError('Popup was blocked. Please allow popups for this site and try again.');
      return;
    }

    setOauthLoading(provider);
    setInfo(`Signing in with ${provider === 'github' ? 'GitHub' : 'Facebook'}…`);
    setError('');

    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.source !== 'learnex_oauth') return;
      if (event.data.provider !== provider) return;

      window.removeEventListener('message', handleMessage);
      clearInterval(popupTimerRef.current);
      popup?.close();
      setInfo('');

      if (event.data.error) {
        setOauthLoading(null);
        setError(`${provider === 'github' ? 'GitHub' : 'Facebook'} sign-in was cancelled or failed.`);
        return;
      }

      try {
        // For GitHub: event.data.code  (authorization code)
        // For Facebook: event.data.token (access token)
        const credential = event.data.code || event.data.token;
        await oauthLogin(provider, credential);
        navigate('/feed');
      } catch (err) {
        setError(err.message || `${provider === 'github' ? 'GitHub' : 'Facebook'} sign-in failed.`);
      } finally {
        setOauthLoading(null);
      }
    };

    window.addEventListener('message', handleMessage);

    clearInterval(popupTimerRef.current);
    popupTimerRef.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupTimerRef.current);
        window.removeEventListener('message', handleMessage);
        setOauthLoading(prev => {
          if (prev === provider) {
            setInfo('');
            setError('Sign-in was cancelled.');
          }
          return null;
        });
      }
    }, 500);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        {/* ── LEFT panel ── */}
        <div className="left">
          <div className="left-bg" />
          <div className="left-watermark">X</div>
          <div className="left-logo">
            <LogoIcon size={54} />
            <span className="logo-name">LEARN<span>EX</span></span>
          </div>
          <div className="left-hero">
            <div className="left-tagline">
              {t('app.taglineLine1')}<br />
              {t('app.taglineLine2')}<br />
              <span>{t('app.taglineLine3')}</span>
            </div>
            <p className="left-desc">{t('app.description')}</p>
          </div>
          <div className="left-features">
            {FEATURES.map(f => (
              <div className="feature-pill" key={f.titleKey}>
                <div className="pill-icon">{f.icon}</div>
                <div className="pill-text">
                  <strong>{t(f.titleKey)}</strong>
                  <span>{t(f.descKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT panel ── */}
        <div className="right">
          <div className="form-card fade-in" key={tab}>
            {/* Mobile logo */}
            <div className="mobile-logo">
              <MobileLogoIcon />
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 3 }}>
                LEARN<span style={{ color: '#E8192C' }}>EX</span>
              </span>
            </div>

            {/* Tab switcher */}
            <div className="tabs">
              <button className={`tab ${isLogin ? 'active' : ''}`} onClick={() => handleSwitch('login')}>
                {t('app.signIn')}
              </button>
              <button className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => handleSwitch('register')}>
                {t('app.register')}
              </button>
            </div>

            <div className="form-title">{isLogin ? t('app.welcomeBack') : t('app.joinLearnex')}</div>
            <div className="form-sub">{isLogin ? t('app.loginSubtitle') : t('app.registerSubtitle')}</div>

            {/* OAuth buttons */}
            <div className="divider">{t('app.continueWith')}</div>
            <div className="social-row">
              {/* GitHub */}
              <button
                className={`social-btn github-btn ${oauthLoading === 'github' ? 'loading' : ''}`}
                onClick={() => handleOAuth('github')}
                disabled={!!oauthLoading || loading}
              >
                {oauthLoading === 'github'
                  ? <><div className="social-spinner" /> Signing in…</>
                  : <><GitHubIcon /> GitHub</>
                }
              </button>

              {/* Facebook */}
              <button
                className={`social-btn fb-btn ${oauthLoading === 'facebook' ? 'loading' : ''}`}
                onClick={() => handleOAuth('facebook')}
                disabled={!!oauthLoading || loading}
              >
                {oauthLoading === 'facebook'
                  ? <><div className="social-spinner" /> Signing in…</>
                  : <><FacebookIcon /> Facebook</>
                }
              </button>
            </div>

            <div className="divider">{t('app.orWithEmail')}</div>

            {/* Banners */}
            {sessionBanner && (
              <div className="error-banner" style={{ background: 'rgba(201,168,76,.12)', borderColor: 'rgba(201,168,76,.35)', color: '#C9A84C' }}>
                <span>⏱</span> {sessionBanner}
              </div>
            )}
            {info && (
              <div className="info-banner">
                <div className="social-spinner" style={{ flexShrink: 0 }} />
                {info}
              </div>
            )}
            {error && (
              <div className="error-banner">
                <span>⚠</span> {error}
              </div>
            )}

            {/* Form fields */}
            <div className="field-group" onKeyDown={handleKeyDown}>
              {!isLogin && (
                <div className="field-row">
                  <div className="field">
                    <label>{t('forms.firstName')}</label>
                    <div className="input-wrap">
                      <span className="input-icon">👤</span>
                      <input
                        placeholder={t('app.firstNamePlaceholder')}
                        value={form.firstName}
                        onChange={e => setForm({ ...form, firstName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>{t('forms.lastName')}</label>
                    <div className="input-wrap">
                      <span className="input-icon">👤</span>
                      <input
                        placeholder={t('app.lastNamePlaceholder')}
                        value={form.lastName}
                        onChange={e => setForm({ ...form, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="field">
                  <label>{t('forms.username')}</label>
                  <div className="input-wrap">
                    <span className="input-icon">@</span>
                    <input
                      placeholder={t('app.usernamePlaceholder')}
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="field">
                <label>{isLogin ? t('app.emailOrUsername') : t('app.studentEmail')}</label>
                <div className="input-wrap">
                  <span className="input-icon">✉</span>
                  {isLogin
                    ? <input
                        placeholder={t('app.emailOrUsernamePlaceholder')}
                        value={form.identifier}
                        onChange={e => setForm({ ...form, identifier: e.target.value })}
                      />
                    : <input
                        type="email"
                        placeholder={t('app.studentEmailPlaceholder')}
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                  }
                </div>
              </div>

              <div className="field">
                <label>{t('forms.password')}</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder={isLogin ? t('app.enterPassword') : t('app.createPassword')}
                    value={isLogin ? form.password : pw}
                    onChange={e => isLogin
                      ? setForm({ ...form, password: e.target.value })
                      : setPw(e.target.value)
                    }
                  />
                </div>
                {!isLogin && pw && <StrengthBar password={pw} />}
              </div>

              {isLogin && (
                <div style={{ textAlign: 'right', marginTop: -8 }}>
                  <button
                    onClick={() => navigate('/forgot-password')}
                    style={{ background: 'none', border: 'none', color: '#E8192C', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {t('app.forgotPasswordLink')}
                  </button>
                </div>
              )}
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={loading || !!oauthLoading}
            >
              {loading
                ? t('app.pleaseWait')
                : isLogin ? t('app.signInButton') : t('app.createAccountButton')
              }
            </button>

            <div className="form-footer">
              {isLogin
                ? <><span>{t('app.dontHaveAccount')}</span><button onClick={() => handleSwitch('register')}>{t('app.signUpFree')}</button></>
                : <><span>{t('app.alreadyMember')}</span><button onClick={() => handleSwitch('login')}>{t('app.signIn')}</button></>
              }
            </div>

            {!isLogin && (
              <p className="terms">
                {t('app.termsAgreement')} <span>{t('app.termsOfService')}</span> {t('app.and')} <span>{t('app.privacyPolicy')}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}