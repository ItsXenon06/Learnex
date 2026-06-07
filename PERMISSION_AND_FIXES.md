# Uploads Permissions & Image 403 Fixes

## How to Check Uploads Folder Permissions

```bash
# Check folder permissions and contents
ls -la /vercel/share/v0-project/uploads/

# Check specific file permissions
ls -la /vercel/share/v0-project/uploads/filename.png

# Fix permissions if needed
chmod 755 /vercel/share/v0-project/uploads
chmod 644 /vercel/share/v0-project/uploads/*.png
chmod 644 /vercel/share/v0-project/uploads/*.jpg
```

**Expected Output:** Files should have `-rw-r--r--` (644) permissions and folder should have `drwxr-xr-x` (755).

## Fixes Applied

### 1. Spring Security Configuration (Backend)
**File:** `SecurityConfig.java`
**Issue:** `/uploads/**` path was not in the permitAll list, causing 403 Forbidden
**Fix:** Added `/uploads/**` to permitted paths so files can be accessed without JWT

```java
.requestMatchers("/uploads/**").permitAll()
```

### 2. Hashtag Navigation (Frontend)
**File:** `TrendingHashtagWidget.jsx`
**Issue:** Navigation paths were `/hashtags/` but route is `/hashtag/`
**Fix:** Changed navigation calls to use correct singular path:
```javascript
navigate(`/hashtag/${encodeURIComponent(tag)}`)  // was /hashtags/
navigate('/hashtag')  // was /hashtags
```

### 3. Image Error Handling (Frontend)
**File:** `FeedPage.jsx`
**Issue:** Failed images broke the layout
**Fix:** Added error handling to filter out failed images gracefully

## Next Steps

1. **Restart Backend** - Spring Security changes require restart
2. **Check Permissions** - Run the permission check commands above
3. **Test Image Loading** - Open Feed and check if images appear
4. **Test Hashtag Navigation** - Click trending hashtags or "See all"

## Troubleshooting

If images still show 403:
```bash
# Make all uploads readable
chmod -R 644 /vercel/share/v0-project/uploads/*

# Verify WebMvcConfig is serving the folder
# Check: backend/src/main/java/com/studentsocial/backend/config/WebMvcConfig.java
```

If hashtags still don't navigate:
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- Check browser console for JavaScript errors
- Verify Route is `/hashtag/:tag` in App.jsx
