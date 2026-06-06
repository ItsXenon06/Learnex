# Debugging Report: Feed Page, Group Leaving, and Course Implementation

## Issue 1: Top 5 Hashtag Widget Not Rendering on Feed Page

### Status: WIDGET IS CORRECTLY IMPLEMENTED

**What's happening:**
- `TrendingHashtagWidget` is imported and rendered in `FeedPage.jsx` (line 1450)
- The widget is correctly styled and properly positioned in the right panel (`.lx-rp`)
- The component has proper error handling and returns `null` when loading/error/empty

**Why it's not showing in your screenshot:**
1. The widget silently returns `null` if:
   - Loading state is true
   - Error occurs (no error display to user)
   - No trending hashtags are returned from API

2. Looking at the code:
```jsx
if (loading) return null;
if (error) return null;
if (!trendingTags || trendingTags.length === 0) return null;
```

**Root cause of non-rendering:**
The API call `hashtagService.getTrendingHashtags(5)` is likely **failing silently** or returning empty data because:
- The backend `/api/hashtags/trending?limit=5` endpoint may not exist or return the wrong format
- No console error is logged (only caught silently)
- The component never renders, leaving the widget area blank

**What you're seeing:**
- In your screenshot, the right sidebar has only the "Suggested" users widget
- The trending hashtags section is missing entirely
- This is expected behavior when the API returns nothing

---

## Issue 2: Group Leaving - State Management Issues

### Status: PARTIALLY BROKEN - State Updates Conflict with API Errors

**Owner Leaving (GroupDetailPage.jsx, line 252-278):**

```javascript
const handleLeave = async () => {
  setLeaving(true);
  
  // ✅ Optimistic update — state changes immediately
  const prevIsMember = isMember;
  const prevRole = myRole;
  const prevCount = group?.memberCount ?? 0;
  setIsMember(false);  // ← State marked as not member immediately
  setMyRole(null);
  setGroup((g) => ({ ...g, memberCount: Math.max(0, (g?.memberCount ?? 1) - 1) }));
  
  try {
    await groupService.leaveGroup(groupId);  // ← API call
    setLeaveOpen(false);
    setTimeout(() => navigate('/groups'), 300);  // ← Navigate after success
  } catch (e) {
    // ✅ Rollback on failure
    setIsMember(prevIsMember);
    setMyRole(prevRole);
    setGroup((g) => ({ ...g, memberCount: prevCount }));
    alert(e?.response?.data?.message || "Could not leave group.");
  } finally {
    setLeaving(false);
  }
};
```

**Problem with this implementation:**
1. When API returns 500 error (from your screenshot):
   - State is ALREADY changed (optimistic update executed)
   - Alert shows "Could not leave group"
   - Rollback happens
   - BUT you're still seeing the group as "gone" because of the 500 error race condition

2. The 500 error occurs on the backend, so:
   - Frontend thinks it left successfully initially
   - Then rollback fails partially
   - State becomes inconsistent
   - User sees "group gone but error shown" (confusing UX)

**Member Leaving (GroupsPage.jsx, line 619-638):**

```javascript
const handleLeaveConfirm = async () => {
  if (!leaveTarget) return;
  setLeavingId(leaveTarget.id);
  try {
    await groupService.leaveGroup(leaveTarget.id);
    
    // ✅ State update after API success
    setGroups(prev => prev.map(g => g.id === leaveTarget.id
      ? { ...g, isMember: false, myRole: null, memberCount: Math.max(0, (g.memberCount ?? 1) - 1) }
      : g
    ));
    setLeaveTarget(null);
    showToast("Left group.");
  } catch (e) {
    setError(e?.response?.data?.message || "Could not leave group.");
    setLeaveTarget(null);
  } finally {
    setLeavingId(null);
  }
};
```

**Problem with this implementation:**
1. State update happens ONLY after API success
2. When API fails with 500:
   - `setError()` shows the error message
   - `setLeaveTarget(null)` closes the modal
   - State is NOT updated (correct!)
   - BUT the modal closes, so user doesn't know if they actually left or not
   - No visual feedback that the action failed

3. **No visual confirmation either way:**
   - No loading state shown in UI while request is pending
   - Only error message shown, but modal is closed simultaneously

**Root cause of the 500 errors:**
From your error log:
```
DELETE http://localhost:5173/api/groups/34ae8246-2793-4b2b-bb63-659d67f3732f/leave 500
```

The backend is returning a 500 error on the `/api/groups/{id}/leave` endpoint. This could be due to:
1. Missing error handling in the backend leave endpoint
2. Race condition when deleting groups (owner leaves = group deleted?)
3. Database constraint violation
4. Member not found in group

---

## Issue 3: Course Implementation - Diagnosis Only

### Status: INCOMPLETE/PARTIALLY IMPLEMENTED

**What exists:**
- ✅ `CourseDetailPage.jsx` - Lists course posts
- ✅ `CoursePage.jsx` - Lists all courses
- ✅ `CoursePostCreatePage.jsx` - Create post page
- ✅ `courseService.js` - API calls defined

**What's not working:**

1. **Course Posts Response Format Issue** (Line 64 in CourseDetailPage):
```javascript
const postsRes = await courseService.getCoursePosts(courseId);
setPosts(postsRes.data.data.content || []);  // ← Expects nested .content property
```

   The code expects response in format:
   ```json
   {
     "data": {
       "data": {
         "content": [...]  // ← Posts array
       }
     }
   }
   ```

   But the backend likely returns:
   ```json
   {
     "data": {
       "content": [...]  // ← Or maybe just this structure
     }
   }
   ```

   This causes `postsRes.data.data.content` to be `undefined`, so posts won't render.

2. **No Route Handler for Getting Course Posts**
   - The endpoint `/api/courses/{courseId}/posts` might not exist in the backend
   - Or it returns a different response format

3. **Missing Course Backend Integration**
   - No confirmation that `courseService.getCourse()` returns the expected format
   - No error handling if course doesn't exist
   - Loading/error states are shown correctly, but actual data may not load

4. **Post Creation Endpoint**
   - `createCoursePost()` sends correct data structure
   - But no confirmation that backend accepts it

**Evidence from code:**
```javascript
// Line 60-61: Expects nested .data.data structure
const courseRes = await courseService.getCourse(courseId);
setCourse(courseRes.data.data);  // ← .data.data

// Line 63-64: Also expects .data.data.content
const postsRes = await courseService.getCoursePosts(courseId);
setPosts(postsRes.data.data.content || []);  // ← .data.data.content
```

---

## Summary

| Issue | Root Cause | Status |
|-------|-----------|--------|
| **Trending Hashtags Not Showing** | API returns empty/error, widget returns null silently | Design issue - add fallback UI |
| **Group Leave - Owner** | Optimistic update + 500 error = state race condition | Backend 500 error on leave endpoint |
| **Group Leave - Member** | Modal closes before state updates on API error | No visual confirmation of failure |
| **Course Posts Not Loading** | Likely response format mismatch (`.data.data.content`) | Backend response format issue |

---

## Next Steps to Debug Further

1. **For Hashtags:** Check browser network tab to see what `/api/hashtags/trending` returns
2. **For Group Leave:** Check backend logs for why `/api/groups/{id}/leave` returns 500
3. **For Courses:** Verify backend returns `{ data: { data: { content: [...] } } }` format on `/api/courses/{id}/posts`
