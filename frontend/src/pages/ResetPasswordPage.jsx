import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const css = `
.reset-container{
  display:flex;align-items:center;justify-content:center;min-height:100vh;
  background:linear-gradient(135deg,var(--s2),var(--s1));
  padding:20px;
}
.reset-card{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  padding:40px;width:100%;max-width:420px;
  box-shadow:0 10px 40px rgba(0,0,0,.3);
}
.reset-title{
  font-family:var(--fd);font-size:24px;font-weight:800;letter-spacing:1px;
  margin-bottom:8px;color:var(--t1);
}
.reset-desc{
  font-size:13px;color:var(--t3);font-family:var(--fm);margin-bottom:24px;line-height:1.6;
}
.reset-field{
  margin-bottom:18px;
}
.reset-label{
  font-size:12px;font-weight:700;color:var(--t2);text-transform:uppercase;
  letter-spacing:.5px;display:block;margin-bottom:8px;
}
.reset-input{
  width:100%;padding:11px 14px;background:var(--s2);border:1px solid var(--b1);
  border-radius:8px;color:var(--t1);font-family:var(--fb);font-size:14px;
  transition:border-color .15s;
}
.reset-input:focus{outline:none;border-color:var(--red);box-shadow:0 0 0 2px rgba(232,25,44,.1);}
.reset-input::placeholder{color:var(--t4);}
.reset-actions{
  display:flex;gap:12px;margin-top:24px;
}
.reset-btn{
  flex:1;padding:12px 20px;border:none;border-radius:8px;
  font-family:var(--fb);font-weight:700;font-size:13px;letter-spacing:.5px;
  cursor:pointer;transition:all .15s;
}
.reset-btn-submit{
  background:var(--grad-fire);color:#fff;box-shadow:0 3px 14px var(--red-glow);
}
.reset-btn-submit:hover:not(:disabled){
  transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);
}
.reset-btn-back{
  background:var(--s2);color:var(--t2);border:1px solid var(--b1);
}
.reset-btn-back:hover{background:var(--s3);color:var(--t1);}
.reset-btn:disabled{opacity:.5;cursor:not-allowed;}
.reset-message{
  margin-top:16px;padding:12px 14px;border-radius:8px;font-size:13px;
  font-family:var(--fm);line-height:1.5;
}
.reset-message.success{
  background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#22c55e;
}
.reset-message.error{
  background:rgba(232,25,44,.1);border:1px solid rgba(232,25,44,.3);color:var(--red);
}
`;

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setMessage('');
    setMessageType('');
    
    if (!tokenFromUrl) {
      setMessage('Invalid or missing reset token. Please check your email link.');
      setMessageType('error');
      return;
    }
    
    if (!password) {
      setMessage('Please enter a new password.');
      setMessageType('error');
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }
    
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.');
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
      if (!res.ok) {
        throw new Error(payload?.message || 'Password reset failed');
      }
      setMessage('Password reset successfully! Redirecting to login...');
      setMessageType('success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setMessage(e.message || 'Something went wrong.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="reset-container">
        <div className="reset-card">
          <h2 className="reset-title">Reset Password</h2>
          <p className="reset-desc">
            Enter your new password to regain access to your account.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="reset-field">
              <label className="reset-label">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="reset-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="reset-field">
              <label className="reset-label">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="reset-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                disabled={loading}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--t3)', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Show passwords
            </label>

            <div className="reset-actions">
              <button
                type="submit"
                disabled={loading}
                className="reset-btn reset-btn-submit"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={loading}
                className="reset-btn reset-btn-back"
              >
                Back to Login
              </button>
            </div>
          </form>

          {message && (
            <div className={`reset-message ${messageType}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
