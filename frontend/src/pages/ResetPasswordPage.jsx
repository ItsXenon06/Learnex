import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || t('messages.resetFailed'));
      setMessage(t('messages.passwordResetSuccess'));
      setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      setMessage(e.message || t('messages.somethingWentWrong'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 28 }}>
      <h2>{t('app.resetPassword')}</h2>
      <p>{t('app.resetPasswordDescription')}</p>
      <div style={{ marginTop: 12 }}>
        <input value={token} onChange={e => setToken(e.target.value)} placeholder={t('app.resetToken')} style={{ padding: 8, width: 420 }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('forms.password')} style={{ padding: 8, width: 420 }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 16px' }}>{loading ? t('app.resetting') : t('app.resetPassword')}</button>
        <button onClick={() => navigate('/login')} style={{ marginLeft: 12, padding: '10px 12px' }}>{t('app.back')}</button>
      </div>
      {message && <div style={{ marginTop: 12, color: '#ccc' }}>{message}</div>}
    </div>
  );
}
