# Leave Group Functionality Fix

## Overview
Fixed the 500 Internal Server Error when users attempt to leave a group. The issue was in the backend's error handling and logic flow in the `/api/groups/{id}/leave` endpoint.

## Root Cause
The `leaveGroup` endpoint in `GroupController.java` had several issues:

1. **Poor error handling**: Used `RuntimeException` instead of `IllegalArgumentException`, which resulted in raw 500 errors instead of proper HTTP 4xx responses
2. **Order of operations**: The group was fetched inside the successor-not-found block, instead of at the beginning
3. **Exception message**: The "Owner role not seeded" message was misleading; the real issue was better expressed as "Owner role not found in database"

## Changes Made

### Backend (`GroupController.java`)

**File**: `/vercel/share/v0-project/backend/src/main/java/com/studentsocial/backend/controller/GroupController.java`

**Endpoint**: `DELETE /api/groups/{id}/leave`

#### Key Improvements:

1. **Fetch group early** (line 210): Get the group at the start to fail fast if group not found
2. **Better exception types** (lines 211, 218, 234): Use `IllegalArgumentException` for validation errors (catches via GlobalExceptionHandler → HTTP 400)
3. **Clear succession logic** (lines 221-242):
   - Check if leaving user is owner
   - Try to find earliest admin to promote first
   - Fall back to earliest member
   - If no one left, soft-delete group
   - Only consider members OTHER than the one leaving (via `excludeUserId` parameter)
4. **Improved comments**: Clarified that only non-leaving members are considered for succession

#### Group Succession Hierarchy:
1. **If leaving user is owner**: Promote earliest admin (by `joinedAt` ASC)
2. **If no admins exist**: Promote earliest regular member
3. **If group becomes empty**: Soft-delete the group via `deleted_at`
4. **If user is not owner**: Simply remove membership, no succession needed

### Frontend (`GroupDetailPage.jsx`)

**File**: `/vercel/share/v0-project/frontend/src/pages/GroupDetailPage.jsx`

#### Changes:

1. **Removed debug console.log statements** (lines 184, 192, 200, 228, 235-237, 245, 252, 257):
   - Removed all `console.log("[v0] ...")` statements from `useEffect` and `handleJoin`
   - These were diagnostic logs and aren't needed for production

#### Frontend Leave Logic (unchanged, working correctly):
- Optimistic update: immediately show user as non-member
- Sends DELETE request to `/api/groups/{id}/leave`
- On failure: rolls back the optimistic update
- On success: closes leave confirmation modal

## How It Works

### User Leaves a Group (Non-Owner)
1. User clicks "Leave Group" button
2. Confirmation modal appears
3. User confirms
4. Frontend sends: `DELETE /api/groups/{groupId}/leave`
5. Backend:
   - Finds the group
   - Finds the user's membership
   - Removes the membership (since user is not owner)
   - Database trigger automatically decrements `member_count`
6. Response: `{ success: true, data: null }`
7. Frontend closes modal, updates local state

### Owner Leaves a Group
1. Owner clicks "Leave Group"
2. Confirmation modal appears
3. Owner confirms
4. Frontend sends: `DELETE /api/groups/{groupId}/leave`
5. Backend:
   - Finds the group
   - Identifies user is owner
   - **Succession**: Looks for earliest admin to promote to owner
   - **Fallback**: If no admins, promotes earliest member to owner
   - **Last resort**: If no other members, soft-deletes group
   - Removes owner's membership
6. Response: `{ success: true, data: null }`
7. Frontend closes modal, updates local state

## Database Schema Alignment

The fix respects the existing database schema:

- `group_member.role_id` → references `group_role(id)` (on `"owner"`, `"admin"`, `"member"`, `"moderator"`)
- `group_member.joined_at` → Used for ordering in succession (earliest = longest-standing)
- `study_group.member_count` → Auto-maintained by trigger `trg_group_member_count` (fires on INSERT/DELETE)
- `study_group.deleted_at` → Soft-delete flag (NULL = active, set = soft-deleted)

## Testing Recommendations

### Scenario 1: Non-Owner Leaves
- User joins group as member
- User leaves group
- Expected: User removed from group, member count decreases

### Scenario 2: Owner Leaves (Admin Successor)
- Owner invites an admin
- Admin joins group
- Owner leaves
- Expected: Admin promoted to owner, owner removed

### Scenario 3: Owner Leaves (Member Successor)
- Owner has only regular members
- Owner leaves
- Expected: Earliest member promoted to owner, owner removed

### Scenario 4: Last Person Leaves
- Owner is only member left
- Owner leaves
- Expected: Group soft-deleted, owner removed

### Scenario 5: Non-Member Tries to Leave
- User who's not a member tries leaving
- Expected: HTTP 400 "You are not a member of this group"

## Error Handling

All validation errors now properly return HTTP 400 via `IllegalArgumentException`:
- Group not found
- User not a member of group
- Owner role not found in database (should never happen, but graceful error)

The `GlobalExceptionHandler` catches these and returns:
```json
{
  "success": false,
  "data": null,
  "message": "Error message here"
}
```

## Files Modified

1. `/vercel/share/v0-project/backend/src/main/java/com/studentsocial/backend/controller/GroupController.java`
   - Improved `leaveGroup()` method

2. `/vercel/share/v0-project/frontend/src/pages/GroupDetailPage.jsx`
   - Removed debug console.log statements

## No Breaking Changes

✅ All existing API contracts maintained  
✅ Frontend already had proper error handling  
✅ Database schema unchanged  
✅ Backward compatible with existing group structure
