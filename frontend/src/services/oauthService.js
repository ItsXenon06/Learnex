import api from './api.js';

// Generate a random state token for CSRF protection
const generateState = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Store state in sessionStorage (cleared on browser close)
const storeState = (provider, state) => {
  sessionStorage.setItem(`oauth_state_${provider}`, state);
};

// Verify state matches stored value
const verifyState = (provider, state) => {
  const stored = sessionStorage.getItem(`oauth_state_${provider}`);
  sessionStorage.removeItem(`oauth_state_${provider}`);
  return stored === state;
};

// GitHub OAuth
export const getGithubAuthUrl = () => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  if (!clientId) throw new Error('VITE_GITHUB_CLIENT_ID not configured');

  const state = generateState();
  storeState('github', state);

  const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:5173/Learnex/auth/callback/github';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:email',
    state: state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

// Facebook OAuth
export const getFacebookAuthUrl = () => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  if (!appId) throw new Error('VITE_FACEBOOK_APP_ID not configured');

  const state = generateState();
  storeState('facebook', state);

  const redirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI || 'http://localhost:5173/Learnex/auth/callback/facebook';

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'email,public_profile',
    state: state,
  });

  return `https://www.facebook.com/v25.0/dialog/oauth?${params.toString()}`;
};

// Handle OAuth callback with state validation
export const handleOAuthCallback = async (provider, code, state) => {
  if (!verifyState(provider, state)) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }

  return api.post('/auth/oauth', { provider, code });
};

export default {
  getGithubAuthUrl,
  getFacebookAuthUrl,
  handleOAuthCallback,
  generateState,
  verifyState,
};