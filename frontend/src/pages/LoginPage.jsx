import { useState, useEffect } from 'react';
import {useSearchParams} from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
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
  }
  body { font-family: var(--font-body); background: var(--bg); color: var(--text); }

  .auth-root { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }

  /* LEFT */
  .left {
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 48px; background: #0c0c0c;
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
  .left-logo { position: relative; z-index: 1; display: flex; align-items: center; gap: 14px; }
  .logo-name { font-family: var(--font-display); font-size: 28px; letter-spacing: 4px; color: var(--text); }
  .logo-name span { color: var(--red); }
  .left-hero { position: relative; z-index: 1; }
  .left-tagline {
    font-family: var(--font-display); font-size: clamp(52px,6vw,80px);
    line-height: 0.95; letter-spacing: 2px; margin-bottom: 24px;
  }
  .left-tagline span { color: var(--red); display: block; }
  .left-desc { font-size: 15px; color: var(--text-muted); line-height: 1.7; max-width: 340px; }
  .left-features { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; }
  .feature-pill {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px; background: rgba(255,255,255,0.03);
    border: 1px solid var(--border); border-radius: 12px;
    backdrop-filter: blur(4px); transition: border-color 0.2s;
  }
  .feature-pill:hover { border-color: rgba(232,25,44,0.3); }
  .pill-icon {
    width: 34px; height: 34px; background: rgba(232,25,44,0.12);
    border-radius: 8px; display: flex; align-items: center;
    justify-content: center; font-size: 16px; flex-shrink: 0;
  }
  .pill-text strong { display: block; font-size: 13px; font-weight: 600; margin-bottom: 2px; }
  .pill-text span { font-size: 11px; color: var(--text-muted); }

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
  }
  .social-btn:hover { border-color: var(--border-hover); background: #222; }

  .submit-btn {
    width: 100%; padding: 14px; background: var(--red);
    border: none; border-radius: 10px; color: #fff;
    font-size: 13px; font-weight: 700; font-family: var(--font-body);
    letter-spacing: 1.5px; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 24px var(--red-glow);
    position: relative; overflow: hidden;
  }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
  .submit-btn:not(:disabled):hover { background: var(--red-hover); transform: translateY(-1px); box-shadow: 0 8px 32px var(--red-glow); }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }

  .error-banner {
    background: rgba(232,25,44,0.1); border: 1px solid rgba(232,25,44,0.3);
    border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
    font-size: 13px; color: #ff6b7a; display: flex; align-items: center; gap: 8px;
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

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function LearnexLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="44" rx="11" fill="#E8192C"/>
      <rect width="44" height="44" rx="11" fill="url(#lg)" opacity="0.6"/>
      <path d="M10 10 L22 22 M22 22 L34 34" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M34 10 L22 22 M22 22 L10 34" stroke="white" strokeWidth="5.5" strokeLinecap="round"/>
      <circle cx="22" cy="22" r="2.5" fill="rgba(255,255,255,0.35)"/>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff3a4d"/><stop offset="100%" stopColor="#8B0010"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

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
      {[0,1,2].map(i => <div key={i} className={`strength-seg ${i < level ? cls : ''}`}/>)}
    </div>
  );
}

const FEATURES = [
  { icon: '🎓', title: 'Study Together', desc: 'Join subject groups & collaborate on coursework' },
  { icon: '💬', title: 'Real-time Messaging', desc: 'DMs and group chats with your classmates' },
  { icon: '📢', title: 'Campus Feed', desc: 'Stay updated on events, posts & announcements' },
];

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [pw, setPw]         = useState('');
  const [form, setForm]     = useState({ identifier: '', email: '', password: '', firstName: '', lastName: '', username: '' });
  const [searchParams] = useSearchParams();
  const [sessionBanner, setSessionBanner] = useState('');
  const isLogin = tab === 'login';

  useEffect(() => {
    const reason = searchParams.get('banner');
    if (reason === 'session_expired') {
      setSessionBanner('Your session has expired. Please sign in again.');
    }
    else if (reason === 'unauthorized') {
      setSessionBanner('You are not authorized to access this page.');
    }
  }, []);

  const handleSwitch = (t) => {
    setTab(t); setError(''); setPw('');
    setForm({ identifier: '', email: '', password: '', firstName: '', lastName: '', username: '' });
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (isLogin) {
        if (!form.identifier || !form.password) { setError('Please fill in all fields.'); return; }
        await login(form.identifier, form.password);
      } else {
        if (!form.email || !pw || !form.firstName || !form.lastName || !form.username) {
          setError('Please fill in all fields.'); return;
        }
        await register({ email: form.email, password: pw, firstName: form.firstName, lastName: form.lastName, username: form.username });
      }
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        {/* LEFT */}
        <div className="left">
          <div className="left-bg"/>
          <div className="left-watermark">X</div>
          <div className="left-logo">
            <LearnexLogo size={44}/>
            <span className="logo-name">LEARN<span>EX</span></span>
          </div>
          <div className="left-hero">
            <div className="left-tagline">LEARN.<br/>CONNECT.<br/><span>GROW.</span></div>
            <p className="left-desc">The social platform built for students. Share knowledge, collaborate on projects, and thrive together on campus.</p>
          </div>
          <div className="left-features">
            {FEATURES.map(f => (
              <div className="feature-pill" key={f.title}>
                <div className="pill-icon">{f.icon}</div>
                <div className="pill-text"><strong>{f.title}</strong><span>{f.desc}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <div className="form-card fade-in" key={tab}>
            <div className="mobile-logo">
              <LearnexLogo size={36}/>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 3 }}>
                LEARN<span style={{ color: '#E8192C' }}>EX</span>
              </span>
            </div>

            <div className="tabs">
              <button className={`tab ${isLogin ? 'active' : ''}`} onClick={() => handleSwitch('login')}>Sign In</button>
              <button className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => handleSwitch('register')}>Register</button>
            </div>

            <div className="form-title">{isLogin ? 'Welcome Back' : 'Join Learnex'}</div>
            <div className="form-sub">{isLogin ? 'Sign in to your student account' : 'Create your free student account'}</div>

            <div className="divider">continue with</div>
            <div className="social-row">
              <button className="social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button className="social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </button>
            </div>

            <div className="divider">or with email</div>

            {sessionBanner && (
            <div className="error-banner" style={{ background: 'rgba(201,168,76,.12)', borderColor: 'rgba(201,168,76,.35)', color: '#C9A84C' }}>
         <span>⏱</span> {sessionBanner}
      </div>
            )}
   {error && (
     <div className="error-banner">
      <span>⚠</span> {error}
     </div>
   )}

            <div className="field-group" onKeyDown={handleKeyDown}>
              {!isLogin && (
                <div className="field-row">
                  <div className="field">
                    <label>First Name</label>
                    <div className="input-wrap">
                      <span className="input-icon">👤</span>
                      <input placeholder="Alex" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}/>
                    </div>
                  </div>
                  <div className="field">
                    <label>Last Name</label>
                    <div className="input-wrap">
                      <span className="input-icon">👤</span>
                      <input placeholder="Nguyen" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}/>
                    </div>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="field">
                  <label>Username</label>
                  <div className="input-wrap">
                    <span className="input-icon">@</span>
                    <input placeholder="alex.nguyen" value={form.username} onChange={e => setForm({...form, username: e.target.value})}/>
                  </div>
                </div>
              )}

              <div className="field">
                <label>{isLogin ? 'Email or Username' : 'Student Email'}</label>
                <div className="input-wrap">
                  <span className="input-icon">✉</span>
                  {isLogin
                    ? <input placeholder="you@university.edu or username" value={form.identifier} onChange={e => setForm({...form, identifier: e.target.value})}/>
                    : <input type="email" placeholder="you@university.edu" value={form.email} onChange={e => setForm({...form, email: e.target.value})}/>
                  }
                </div>
              </div>

              <div className="field">
                <label>Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                    value={isLogin ? form.password : pw}
                    onChange={e => isLogin ? setForm({...form, password: e.target.value}) : setPw(e.target.value)}
                  />
                </div>
                {!isLogin && pw && <StrengthBar password={pw}/>}
              </div>

              {isLogin && (
                <div style={{ textAlign: 'right', marginTop: -8 }}>
                  <button style={{ background: 'none', border: 'none', color: '#E8192C', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Please wait…' : isLogin ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
            </button>

            <div className="form-footer">
              {isLogin
                ? <><span>Don't have an account? </span><button onClick={() => handleSwitch('register')}>Sign up free</button></>
                : <><span>Already a member? </span><button onClick={() => handleSwitch('login')}>Sign in</button></>
              }
            </div>

            {!isLogin && (
              <p className="terms">By creating an account you agree to our <span>Terms of Service</span> and <span>Privacy Policy</span></p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}