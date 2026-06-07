import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService.js';

/* ─── Styles matching LoginPage aesthetic ─────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Pinyon+Script&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --red: #E8192C; --red-hover: #FF1F35;
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

.fp-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--bg);
}

/* ── LEFT PANEL ── */
.fp-left {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 52px 56px; background: #0c0c0c;
}

.fp-left-bg { position: absolute; inset: 0; z-index: 0; }
.fp-left-bg::before {
  content: ''; position: absolute; top: -20%; left: -10%;
  width: 120%; height: 70%;
  background: linear-gradient(135deg, transparent 40%, rgba(232,25,44,.07) 60%, transparent 80%);
  transform: rotate(-15deg);
}
.fp-left-bg::after {
  content: ''; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(232,25,44,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(232,25,44,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at 30% 50%, black 30%, transparent 80%);
}
.fp-watermark {
  position: absolute; bottom: -60px; right: -40px; z-index: 0;
  opacity: 0.04; font-family: var(--font-display); font-size: 320px;
  color: var(--red); line-height: 1; pointer-events: none; user-select: none;
}

.fp-logo {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 16px;
}
.fp-logo-icon {
  width: 54px; height: 54px; border-radius: 14px;
  background: linear-gradient(135deg, #d4001a 0%, #9c0012 60%, #700010 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(200,0,20,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
  flex-shrink: 0; overflow: hidden;
}
.fp-logo-x {
  font-family: 'Pinyon Script', cursive; font-size: 38px; color: #000;
  line-height: 1; position: relative; z-index: 1; margin-top: 4px;
  letter-spacing: -1px;
}
.fp-logo-name { font-family: var(--font-display); font-size: 30px; letter-spacing: 5px; }
.fp-logo-name span { color: var(--red); }

.fp-left-hero {
  position: relative; z-index: 1; margin-top: -8px;
}
.fp-headline {
  font-family: var(--font-display); font-size: clamp(52px, 5.5vw, 78px);
  line-height: 0.92; letter-spacing: 2px; margin-bottom: 22px;
}
.fp-headline em { color: var(--red); display: block; font-style: normal; }
.fp-left-desc { font-size: 15px; color: var(--text-muted); line-height: 1.8; max-width: 340px; }

.fp-steps {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; gap: 0;
}
.fp-step {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,.04);
}
.fp-step:last-child { border-bottom: none; }
.fp-step-num {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(232,25,44,.12); border: 1px solid rgba(232,25,44,.2);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 14px; color: var(--red);
  flex-shrink: 0; margin-top: 2px;
}
.fp-step-text strong { display: block; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.fp-step-text span { font-size: 12px; color: var(--text-muted); }

/* ── RIGHT PANEL ── */
.fp-right {
  display: flex; align-items: center; justify-content: center;
  padding: 48px 40px; background: var(--surface); position: relative; overflow: hidden;
}
.fp-right::before {
  content: ''; position: absolute; top: -100px; right: -100px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(232,25,44,.08) 0%, transparent 70%);
}
.fp-right::after {
  content: ''; position: absolute; bottom: -80px; left: -80px;
  width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(232,25,44,.04) 0%, transparent 70%);
}

.fp-card {
  width: 100%; max-width: 400px;
  position: relative; z-index: 1;
  animation: fp-in .4s cubic-bezier(.4,0,.2,1);
}
@keyframes fp-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Success state */
.fp-card.success-state { text-align: center; }
.fp-success-icon {
  width: 64px; height: 64px; border-radius: 16px; margin: 0 auto 20px;
  background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.25);
  display: flex; align-items: center; justify-content: center; font-size: 28px;
}
.fp-success-title {
  font-family: var(--font-display); font-size: 32px; letter-spacing: 2px;
  margin-bottom: 10px; color: var(--text);
}
.fp-success-body {
  font-size: 14px; color: var(--text-muted); line-height: 1.75; margin-bottom: 28px;
}
.fp-success-email {
  font-weight: 600; color: var(--text);
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 14px; display: inline-block;
  font-family: 'DM Sans', sans-serif; font-size: 14px; margin-bottom: 6px;
}

.fp-eyebrow {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 3px; color: var(--red); margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.fp-eyebrow::before {
  content: ''; width: 20px; height: 1px; background: var(--red); opacity: .6;
}
.fp-title {
  font-family: var(--font-display); font-size: 42px; letter-spacing: 2px;
  margin-bottom: 8px; line-height: 1;
}
.fp-subtitle {
  font-size: 14px; color: var(--text-muted); margin-bottom: 36px; line-height: 1.6;
}

.fp-field { margin-bottom: 20px; }
.fp-label {
  display: block; font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 8px;
}
.fp-input-wrap { position: relative; }
.fp-input-wrap input {
  width: 100%; padding: 13px 16px 13px 46px;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 10px; color: var(--text); font-size: 14px;
  font-family: var(--font-body); outline: none;
  transition: border-color .2s, box-shadow .2s;
}
.fp-input-wrap input:focus {
  border-color: var(--red);
  box-shadow: 0 0 0 3px rgba(232,25,44,.12);
}
.fp-input-wrap input::placeholder { color: #444; }
.fp-input-icon {
  position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
  color: #444; font-size: 15px; pointer-events: none;
  transition: color .2s;
}
.fp-input-wrap:focus-within .fp-input-icon { color: var(--red); }

.fp-actions { display: flex; gap: 10px; margin-top: 8px; }
.fp-btn-primary {
  flex: 1; padding: 13px; background: var(--red);
  border: none; border-radius: 10px; color: #fff;
  font-size: 13px; font-weight: 700; font-family: var(--font-body);
  letter-spacing: 1.5px; text-transform: uppercase;
  cursor: pointer; transition: all .2s;
  box-shadow: 0 4px 24px rgba(232,25,44,.3);
}
.fp-btn-primary:not(:disabled):hover {
  background: var(--red-hover); transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(232,25,44,.35);
}
.fp-btn-primary:disabled { opacity: .55; cursor: not-allowed; transform: none; }

.fp-btn-secondary {
  padding: 13px 18px; background: transparent;
  border: 1px solid var(--border); border-radius: 10px;
  color: var(--text-muted); font-size: 13px; font-weight: 600;
  font-family: var(--font-body); cursor: pointer;
  transition: all .2s; white-space: nowrap;
}
.fp-btn-secondary:hover { border-color: var(--border-hover); color: var(--text); background: var(--surface2); }

/* Loading spinner inside button */
.fp-spinner {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.25); border-top-color: #fff;
  border-radius: 50%; animation: fp-spin .7s linear infinite;
  vertical-align: middle; margin-right: 8px;
}
@keyframes fp-spin { to { transform: rotate(360deg); } }

.fp-back-link {
  display: flex; align-items: center; gap: 7px; margin-top: 24px;
  font-size: 13px; color: var(--text-muted); justify-content: center;
}
.fp-back-link button {
  background: none; border: none; color: var(--red);
  font-weight: 600; font-size: 13px; cursor: pointer;
  font-family: var(--font-body); padding: 0;
  transition: opacity .15s;
}
.fp-back-link button:hover { opacity: .8; }

/* Mobile */
.fp-mobile-logo {
  display: none; align-items: center; gap: 10px;
  margin-bottom: 32px; justify-content: center;
}

@media (max-width: 768px) {
  .fp-root { grid-template-columns: 1fr; }
  .fp-left { display: none; }
  .fp-right { padding: 32px 24px; }
  .fp-mobile-logo { display: flex; }
}
`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="fp-root">

        {/* ── LEFT ── */}
        <div className="fp-left">
          <div className="fp-left-bg" />
          <div className="fp-watermark">X</div>

          <div className="fp-logo">
            <div className="fp-logo-icon">
              <span className="fp-logo-x">𝒳</span>
            </div>
            <span className="fp-logo-name">LEARN<span>EX</span></span>
          </div>

          <div className="fp-left-hero">
            <div className="fp-headline">
              FORGOT<br />YOUR<br /><em>PASSWORD?</em>
            </div>
            <p className="fp-left-desc">
              No worries — it happens to everyone. We'll send a reset link straight to your inbox.
            </p>
          </div>

          <div className="fp-steps">
            <div className="fp-step">
              <div className="fp-step-num">1</div>
              <div className="fp-step-text">
                <strong>Enter your email</strong>
                <span>The address linked to your Learnex account</span>
              </div>
            </div>
            <div className="fp-step">
              <div className="fp-step-num">2</div>
              <div className="fp-step-text">
                <strong>Check your inbox</strong>
                <span>A reset link lands in seconds</span>
              </div>
            </div>
            <div className="fp-step">
              <div className="fp-step-num">3</div>
              <div className="fp-step-text">
                <strong>Set a new password</strong>
                <span>Back in the game instantly</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="fp-right">

          {sent ? (
            /* ── SUCCESS STATE ── */
            <div className="fp-card success-state">
              <div className="fp-success-icon">📬</div>
              <div className="fp-success-title">Check Your Email</div>
              <p className="fp-success-body">
                If an account exists for{' '}
                <div className="fp-success-email">{email}</div>
                {' '}we've sent a password reset link.
                <br /><br />
                Didn't get it? Check your spam folder, or{' '}
                <button
                  onClick={() => { setSent(false); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: 'inherit' }}
                >
                  try again
                </button>.
              </p>
              <button
                className="fp-btn-primary"
                onClick={() => navigate('/login')}
                style={{ width: '100%' }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* ── FORM STATE ── */
            <div className="fp-card">
              <div className="fp-mobile-logo">
                <div className="fp-logo-icon" style={{ width: 36, height: 36, borderRadius: 10 }}>
                  <span className="fp-logo-x" style={{ fontSize: 26 }}>𝒳</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 3 }}>
                  LEARN<span style={{ color: 'var(--red)' }}>EX</span>
                </span>
              </div>

              <div className="fp-eyebrow">Account Recovery</div>
              <div className="fp-title">Reset Password</div>
              <p className="fp-subtitle">
                Enter your email and we'll send you a link to get back in.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="fp-field">
                  <label className="fp-label">Email Address</label>
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon">✉</span>
                    <input
                      type="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      disabled={loading}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(232,25,44,.08)', border: '1px solid rgba(232,25,44,.25)',
                    borderRadius: 10, padding: '11px 14px', marginBottom: 16,
                    fontSize: 13, color: '#ff6b7a', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span>⚠</span> {error}
                  </div>
                )}

                <div className="fp-actions">
                  <button
                    type="submit"
                    className="fp-btn-primary"
                    disabled={loading}
                  >
                    {loading
                      ? <><span className="fp-spinner" />Sending…</>
                      : 'Send Reset Link →'}
                  </button>
                  <button
                    type="button"
                    className="fp-btn-secondary"
                    onClick={() => navigate('/login')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="fp-back-link">
                Remembered it?{' '}
                <button onClick={() => navigate('/login')}>Sign in instead</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}