# Summary of Changes

## 1. Tab Position Switch - Discover ↔ Following

The positions of "Discover" and "Following" tabs in FeedPage have been switched. Now the tab order is:
- **Discover** (first tab)
- **Following** (second tab)

The underlying fetch logic automatically adapts based on the selected tab using the same state management.

**Files changed:**
- `frontend/src/pages/FeedPage.jsx` - Lines 1753-1758

## 2. Image Loading Fix (403 Forbidden)

Fixed the issue where images were returning 403 Forbidden errors. The problem was that the frontend was requesting images from the Vite dev server (`http://localhost:5173/uploads/`) instead of the backend (`http://localhost:1008/Learnex/uploads/`).

**Solution:**
- Created `BACKEND_URL` constant that uses `VITE_BACKEND_URL` environment variable
- Added `getImageUrl()` helper function to convert relative URLs to absolute backend URLs
- Updated `CardAttachmentGrid` component to use `getImageUrl()` for all image sources
- Updated `Lightbox` component to accept and use `getImageUrl()` for full-screen image display

**Files changed:**
- `frontend/src/pages/FeedPage.jsx` - Lines 771-778 (added helper), Lines 786, 809, 443, 521 (updated image URL usage)
- `frontend/.env.local` - Created with VITE_BACKEND_URL configuration

## 3. OAuth Callback URLs Documentation

Created comprehensive documentation for Facebook and GitHub OAuth setup.

**Callback URLs:**
```
Development:   http://localhost:5173/Learnex/login
Production:    https://yourdomain.com/Learnex/login
```

**Files created:**
- `OAUTH_SETUP.md` - Complete OAuth configuration guide with step-by-step instructions
- `frontend/.env.local` - Environment variables template with OAuth app ID placeholders

## 4. Current Backend OAuth Support

Verified that the backend already supports OAuth through:
- `AuthController` → `/api/auth/oauth` endpoint
- `OAuthRequest` DTO supporting "google" and "facebook" providers
- Token verification and user account linking/creation

The OAuth implementation is already in place; you just need to:
1. Configure OAuth apps on Facebook/GitHub developer platforms
2. Set the callback URLs as documented
3. Add OAuth app credentials to `.env.local`

