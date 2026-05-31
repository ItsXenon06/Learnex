import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../services/authService.js';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await forgotPassword({ email });
      const token = response?.data?.token;
      if (token) {
        setMessage(t('messages.resetTokenTesting', { token }));
      } else {
        setMessage(t('messages.resetLinkSent'));
      }
    } catch (e) {
      setMessage(e.message || t('messages.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 28 }}>
      <h2>{t('app.forgotPassword')}</h2>
      <p>{t('app.forgotPasswordDescription')}</p>
      <div style={{ marginTop: 12 }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder={t('app.emailPlaceholder')} style={{ padding: 8, width: 320 }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 16px' }}>{loading ? t('app.sending') : t('app.sendResetEmail')}</button>
        <button onClick={() => navigate('/login')} style={{ marginLeft: 12, padding: '10px 12px' }}>{t('app.back')}</button>
      </div>
      {message && <div style={{ marginTop: 12, color: '#ccc' }}>{message}</div>}
    </div>
  );
}
