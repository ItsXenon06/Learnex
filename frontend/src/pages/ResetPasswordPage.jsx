import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@600;700;800&display=swap');

.rp-root{
  min-height:100vh;
  background:var(--s2,#0d0d0f);
  display:flex;align-items:center;justify-content:center;
  padding:24px;
  position:relative;
  overflow:hidden;
  font-family:'Space Mono',monospace;
}

/* Atmospheric background blobs */
.rp-root::before{
  content:'';position:absolute;
  width:500px;height:500px;border-radius:50%;
  background:radial-gradient(circle,rgba(232,25,44,.12) 0%,transparent 70%);
  top:-120px;left:-120px;pointer-events:none;
  animation:rp-pulse 6s ease-in-out infinite;
}
.rp-root::after{
  content:'';position:absolute;
  width:400px;height:400px;border-radius:50%;
  background:radial-gradient(circle,rgba(232,25,44,.07) 0%,transparent 70%);
  bottom:-100px;right:-80px;pointer-events:none;
  animation:rp-pulse 8s ease-in-out infinite reverse;
}
@keyframes rp-pulse{
  0%,100%{transform:scale(1);opacity:.7}
  50%{transform:scale(1.15);opacity:1}
}

.rp-card{
  position:relative;z-index:1;
  width:100%;max-width:420px;
  background:var(--s1,#131316);
  border:1px solid rgba(232,25,44,.18);
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 0 0 1px rgba(255,255,255,.04),
             0 24px 64px rgba(0,0,0,.5),
             0 0 40px rgba(232,25,44,.06);
  animation:rp-rise .5s cubic-bezier(.22,.68,0,1.2) both;
}
@keyframes rp-rise{
  from{opacity:0;transform:translateY(20px) scale(.97)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

/* Top accent bar */
.rp-accent-bar{
  height:3px;
  background:linear-gradient(90deg,transparent,#E8192C 30%,#ff6b35 70%,transparent);
}

.rp-inner{padding:36px 32px 32px;}

/* Logo / wordmark */
.rp-brand{
  display:flex;align-items:center;gap:10px;
  margin-bottom:32px;
}
.rp-logo{
  width:36px;height:36px;border-radius:9px;
  background:linear-gradient(135deg,#E8192C,#ff6b35);
  display:flex;align-items:center;justify-content:center;
  font-family:'Syne',sans-serif;font-size:18px;font-weight:800;
  color:#fff;letter-spacing:-1px;
  box-shadow:0 4px 16px rgba(232,25,44,.4);
}
.rp-wordmark{
  font-family:'Syne',sans-serif;font-size:18px;font-weight:700;
  color:var(--t1,#fff);letter-spacing:2px;text-transform:uppercase;
}

.rp-title{
  font-family:'Syne',sans-serif;
  font-size:22px;font-weight:800;
  color:var(--t1,#fff);
  letter-spacing:.5px;
  margin-bottom:6px;
}
.rp-subtitle{
  font-size:12px;color:var(--t3,#666);
  line-height:1.7;margin-bottom:28px;
}

/* Fields */
.rp-field{margin-bottom:18px;}
.rp-label{
  display:block;
  font-size:10px;font-weight:700;letter-spacing:2px;
  text-transform:uppercase;color:var(--t3,#666);
  margin-bottom:8px;
}

.rp-input-wrap{position:relative;}
.rp-input{
  width:100%;box-sizing:border-box;
  padding:12px 44px 12px 14px;
  background:var(--s2,#0d0d0f);
  border:1px solid rgba(255,255,255,.08);
  border-radius:9px;
  color:var(--t1,#fff);
  font-family:'Space Mono',monospace;
  font-size:13px;
  outline:none;
  transition:border-color .2s,box-shadow .2s;
}
.rp-input:focus{
  border-color:rgba(232,25,44,.5);
  box-shadow:0 0 0 3px rgba(232,25,44,.1);
}
.rp-input::placeholder{color:rgba(255,255,255,.2);}

/* Eye toggle */
.rp-eye{
  position:absolute;right:14px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;padding:2px;
  color:rgba(255,255,255,.3);font-size:15px;line-height:1;
  transition:color .15s;
}
.rp-eye:hover{color:rgba(255,255,255,.6);}

/* Show password row */
.rp-show-row{
  display:flex;align-items:center;gap:8px;
  cursor:pointer;margin-bottom:28px;
}
.rp-show-row input[type=checkbox]{
  width:14px;height:14px;accent-color:#E8192C;cursor:pointer;
}
.rp-show-label{
  font-size:11px;color:var(--t3,#666);
  user-select:none;cursor:pointer;
}

/* Buttons */
.rp-actions{display:flex;gap:10px;}
.rp-btn{
  flex:1;padding:13px 16px;border-radius:9px;border:none;
  font-family:'Space Mono',monospace;font-size:12px;font-weight:700;
  letter-spacing:.6px;text-transform:uppercase;cursor:pointer;
  transition:all .18s;
}
.rp-btn-primary{
  background:linear-gradient(135deg,#E8192C,#c0141f);
  color:#fff;
  box-shadow:0 4px 20px rgba(232,25,44,.35);
}
.rp-btn-primary:hover:not(:disabled){
  transform:translateY(-1px);
  box-shadow:0 6px 28px rgba(232,25,44,.5);
}
.rp-btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.rp-btn-secondary{
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.08);
  color:var(--t2,#aaa);
}
.rp-btn-secondary:hover{
  background:rgba(255,255,255,.09);color:var(--t1,#fff);
}

/* Message */
.rp-msg{
  margin-top:18px;padding:12px 14px;border-radius:9px;
  font-size:12px;line-height:1.6;
  display:flex;align-items:flex-start;gap:8px;
}
.rp-msg.success{
  background:rgba(34,197,94,.08);
  border:1px solid rgba(34,197,94,.2);
  color:#4ade80;
}
.rp-msg.error{
  background:rgba(232,25,44,.08);
  border:1px solid rgba(232,25,44,.2);
  color:#ff6b6b;
}
.rp-msg-icon{flex-shrink:0;margin-top:1px;}

/* Strength bar */
.rp-strength{margin-top:8px;display:flex;gap:4px;}
.rp-strength-seg{
  flex:1;height:3px;border-radius:2px;
  background:rgba(255,255,255,.08);
  transition:background .3s;
}
.rp-strength-seg.active-weak   {background:#E8192C;}
.rp-strength-seg.active-medium {background:#EF9F27;}
.rp-strength-seg.active-strong {background:#22c55e;}

/* Loading spinner inline */
.rp-spinner{
  display:inline-block;width:12px;height:12px;
  border:2px solid rgba(255,255,255,.3);
  border-top-color:#fff;border-radius:50%;
  animation:rp-spin .6s linear infinite;
  margin-right:8px;vertical-align:middle;
}
@keyframes rp-spin{to{transform:rotate(360deg)}}

/* Divider */
.rp-divider{
  height:1px;background:rgba(255,255,255,.06);
  margin:24px 0 20px;
}
.rp-back-link{
  display:flex;align-items:center;justify-content:center;gap:6px;
  font-size:11px;color:var(--t3,#666);letter-spacing:.5px;
  cursor:pointer;background:none;border:none;width:100%;
  transition:color .15s;padding:0;
}
.rp-back-link:hover{color:var(--t1,#fff);}
.rp-back-link:hover .rp-arrow{transform:translateX(-3px);}
.rp-arrow{transition:transform .15s;display:inline-block;}
`;

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  return Math.min(s, 3);
}

const STRENGTH_LABELS = ['', 'Weak', 'Medium', 'Strong'];
const STRENGTH_CLASS  = ['', 'active-weak', 'active-medium', 'active-strong'];

export default function ResetPasswordPage() {
  const [searchParams]  = useSearchParams();
  const tokenFromUrl    = searchParams.get('token') || '';
  const navigate        = useNavigate();

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [message,         setMessage]         = useState('');
  const [messageType,     setMessageType]     = useState('');

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setMessage('');
    setMessageType('');

    if (!tokenFromUrl) {
      setMessage('Invalid or missing reset token. Please use the link from your email.');
      setMessageType('error');
      return;
    }
    if (!password) {
      setMessage('Please enter a new password.');
      setMessageType('error');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      setMessageType('error');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl, newPassword: password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Password reset failed');

      setMessage('Password reset successfully! Redirecting to login…');
      setMessageType('success');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setMessage(err.message || 'Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="rp-root">
        <div className="rp-card">
          <div className="rp-accent-bar" />
          <div className="rp-inner">

            {/* Brand */}
            <div className="rp-brand">
              <div className="rp-logo">L</div>
              <span className="rp-wordmark">Learnex</span>
            </div>

            <h2 className="rp-title">Set new password</h2>
            <p className="rp-subtitle">
              Choose something strong — at least 8 characters with a mix of letters and numbers.
            </p>

            <form onSubmit={handleSubmit}>
              {/* New password */}
              <div className="rp-field">
                <label className="rp-label">New Password</label>
                <div className="rp-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="rp-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="min. 8 characters"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="rp-eye"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="rp-strength" title={STRENGTH_LABELS[strength]}>
                    {[1,2,3].map(i => (
                      <div
                        key={i}
                        className={`rp-strength-seg ${i <= strength ? STRENGTH_CLASS[strength] : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="rp-field">
                <label className="rp-label">Confirm Password</label>
                <div className="rp-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="rp-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="re-enter password"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Show toggle */}
              <label className="rp-show-row">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                />
                <span className="rp-show-label">Show passwords</span>
              </label>

              {/* Actions */}
              <div className="rp-actions">
                <button
                  type="submit"
                  className="rp-btn rp-btn-primary"
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading && <span className="rp-spinner" />}
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </form>

            {/* Message */}
            {message && (
              <div className={`rp-msg ${messageType}`}>
                <span className="rp-msg-icon">
                  {messageType === 'success' ? '✓' : '⚠'}
                </span>
                {message}
              </div>
            )}

            <div className="rp-divider" />

            <button
              className="rp-back-link"
              type="button"
              onClick={() => navigate('/login')}
            >
              <span className="rp-arrow">←</span>
              Back to login
            </button>

          </div>
        </div>
      </div>
    </>
  );
}