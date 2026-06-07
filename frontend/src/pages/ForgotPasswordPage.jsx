import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../services/authService.js';

const css = `
.forgot-container{
  display:flex;align-items:center;justify-content:center;min-height:100vh;
  background:linear-gradient(135deg,var(--s2),var(--s1));
  padding:20px;
}
.forgot-card{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  padding:40px;width:100%;max-width:420px;
  box-shadow:0 10px 40px rgba(0,0,0,.3);
}
.forgot-title{
  font-family:var(--fd);font-size:24px;font-weight:800;letter-spacing:1px;
  margin-bottom:8px;color:var(--t1);
}
.forgot-desc{
  font-size:13px;color:var(--t3);font-family:var(--fm);margin-bottom:24px;line-height:1.6;
}
.forgot-field{
  margin-bottom:18px;
}
.forgot-label{
  font-size:12px;font-weight:700;color:var(--t2);text-transform:uppercase;
  letter-spacing:.5px;display:block;margin-bottom:8px;
}
.forgot-input{
  width:100%;padding:11px 14px;background:var(--s2);border:1px solid var(--b1);
  border-radius:8px;color:var(--t1);font-family:var(--fb);font-size:14px;
  transition:border-color .15s;
}
.forgot-input:focus{outline:none;border-color:var(--red);box-shadow:0 0 0 2px rgba(232,25,44,.1);}
.forgot-input::placeholder{color:var(--t4);}
.forgot-actions{
  display:flex;gap:12px;margin-top:24px;
}
.forgot-btn{
  flex:1;padding:12px 20px;border:none;border-radius:8px;
  font-family:var(--fb);font-weight:700;font-size:13px;letter-spacing:.5px;
  cursor:pointer;transition:all .15s;
}
.forgot-btn-submit{
  background:var(--grad-fire);color:#fff;box-shadow:0 3px 14px var(--red-glow);
}
.forgot-btn-submit:hover:not(:disabled){
  transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);
}
.forgot-btn-back{
  background:var(--s2);color:var(--t2);border:1px solid var(--b1);
}
.forgot-btn-back:hover{background:var(--s3);color:var(--t1);}
.forgot-btn:disabled{opacity:.5;cursor:not-allowed;}
.forgot-message{
  margin-top:16px;padding:12px 14px;border-radius:8px;font-size:13px;
  font-family:var(--fm);line-height:1.5;
}
.forgot-message.success{
  background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#22c55e;
}
.forgot-message.error{
  background:rgba(232,25,44,.1);border:1px solid rgba(232,25,44,.3);color:var(--red);
}
`;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setMessage('');
    setMessageType('');
    
    if (!email) {
      setMessage('Please enter your email address.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword({ email });
      const token = response?.data?.token;
      if (token) {
        setMessage(`Reset link sent to ${email}. Check your email for further instructions.`);
        setMessageType('success');
      } else {
        setMessage(`Reset link sent to ${email}. Check your email for further instructions.`);
        setMessageType('success');
      }
    } catch (e) {
      setMessage(e.message || 'Failed to send reset email. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="forgot-container">
        <div className="forgot-card">
          <h2 className="forgot-title">Forgot Password?</h2>
          <p className="forgot-desc">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="forgot-field">
              <label className="forgot-label">Email Address</label>
              <input
                type="email"
                className="forgot-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <div className="forgot-actions">
              <button
                type="submit"
                disabled={loading}
                className="forgot-btn forgot-btn-submit"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={loading}
                className="forgot-btn forgot-btn-back"
              >
                Back to Login
              </button>
            </div>
          </form>

          {message && (
            <div className={`forgot-message ${messageType}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
