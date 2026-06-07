# OAuth Configuration Guide

## Callback URLs

To enable Facebook and GitHub OAuth authentication in Learnex, you need to configure the following callback URLs in your OAuth application settings:

### GitHub OAuth App
**Callback URL:**
```
http://localhost:5173/Learnex/login
```

Or for production:
```
https://yourdomain.com/Learnex/login
```

**Steps to configure:**
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App (or edit existing)
3. Set "Authorization callback URL" to the callback URL above
4. Copy the Client ID and Client Secret
5. Add to `.env.local`:
   ```
   VITE_GITHUB_CLIENT_ID=your_github_client_id
   ```

### Facebook OAuth App
**Redirect URI:**
```
http://localhost:5173/Learnex/login
```

Or for production:
```
https://yourdomain.com/Learnex/login
```

**Steps to configure:**
1. Go to Facebook Developers → My Apps → Select your app
2. Go to Settings → Basic and copy App ID & App Secret
3. Go to Facebook Login → Settings
4. Add the redirect URI to "Valid OAuth Redirect URIs"
5. Add to `.env.local`:
   ```
   VITE_FACEBOOK_APP_ID=your_facebook_app_id
   ```

## Environment Variables

Copy `.env.local` example to your frontend directory:

```bash
# frontend/.env.local
VITE_BACKEND_URL=http://localhost:1008/Learnex
VITE_GITHUB_CLIENT_ID=your_github_oauth_app_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

For production, update the VITE_BACKEND_URL to your backend domain.

## Backend OAuth Support

The backend currently supports:
- **Google OAuth** (OAuth token verification)
- **Facebook OAuth** (OAuth token verification)

The backend receives OAuth tokens from the frontend and verifies them before creating/linking user accounts.

### Expected Flow:
1. Frontend redirects user to OAuth provider
2. OAuth provider redirects back to `http://localhost:5173/Learnex/login` with auth code
3. Frontend exchanges code for token (handled by OAuth SDK)
4. Frontend sends token to backend `/api/auth/oauth` endpoint
5. Backend verifies token and returns JWT token
6. Frontend stores JWT and uses it for authenticated requests

## Troubleshooting

**Images not showing (403 Forbidden)?**
- Ensure `VITE_BACKEND_URL` is set correctly in `.env.local`
- Backend upload directory must be readable and writable
- Files should be in `./uploads/` directory relative to backend root

**OAuth redirect loop?**
- Verify callback URLs match exactly (including protocol and path)
- Check that `VITE_GITHUB_CLIENT_ID` and `VITE_FACEBOOK_APP_ID` are set
- Ensure backend is running at the URL specified in `VITE_BACKEND_URL`

