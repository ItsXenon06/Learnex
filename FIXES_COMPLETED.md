# Bug Fixes & Changes Summary

## Issues Fixed

### 1. Default Feed Tab Changed to "Discover" ✅
- **File**: `frontend/src/pages/FeedPage.jsx:1558`
- **Change**: `useState("following")` → `useState("discover")`
- **Effect**: Feed now defaults to Discover tab instead of Following

### 2. Group Leave Transaction Error Fixed ✅
- **File**: `backend/src/main/java/com/studentsocial/backend/controller/GroupController.java`
- **Changes**:
  - Added `@Transactional` import
  - Added `@Transactional` annotation to `leaveGroup()` method (line 207)
- **Root Cause**: JPA `deleteByGroupIdAndUserId()` requires a transaction context
- **Effect**: Group leaving now properly commits the database transaction

### 3. Course API Calls - Debug Logging Added ✅
- **File**: `frontend/src/services/courseService.js:14`
- **Change**: Added debug console log to `getCoursePosts()` 
- **Note**: courseService correctly uses `api.get()` which routes through backend's base URL automatically
- **Effect**: Easier debugging of course posts fetch issues

### 4. Notification Grouping Improved ✅
- **File**: `frontend/src/pages/NotificationsPage.jsx:505-545`
- **Changes**: Refined notification display logic for grouped notifications
  - Badge shows only when `count > 1` (not single notifications)
  - Primary actor name always shown
  - Badge displays count+emoji for multi-actor notifications
- **Effect**: Cleaner grouping UI - single notifications don't show badges, grouped ones clearly show count

### 5. Image Upload Directory Verified ✅
- **Status**: `/vercel/share/v0-project/uploads/` directory exists with proper permissions
- **Files Present**: 7 image files currently stored
- **Note**: If you encounter 403 errors:
  - Ensure the file UUID actually exists in the uploads folder
  - Browser cache may be caching old failed requests - clear it
  - Check that the file was successfully uploaded via MediaController

## Hardcoded Course Setup for Future Expansion

The course system uses UUID `00000000-0000-0000-0000-000000000001` as the default course. This is intentional and allows you to:
- Keep this course ID hardcoded for initial development
- Create additional courses via `/api/courses/request` endpoint
- Each new course gets its own unique ID in the database

## Remaining Notes

- Uploads are served via backend at `/Learnex/uploads/**` - frontend images now correctly use `VITE_BACKEND_URL`
- Notification grouping backend endpoint supports `grouped=true` parameter for grouped responses
- Group leave now properly handles owner succession with correct transaction management
