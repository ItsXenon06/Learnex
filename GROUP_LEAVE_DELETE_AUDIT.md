# Group Leave & Delete Function Audit

## Commit: `7cd142d`

### Issue Summary
The leave/delete group functions weren't properly communicating errors or handling complex scenarios (owner succession, group deletion).

---

## Backend Fixes (GroupController.java)

### 1. **leaveGroup Endpoint** (Lines 203-251)
**Functionality:**
- If user is NOT owner: simply remove them from group
- If user IS owner:
  - Find earliest **admin** by `joinedAt` to promote
  - If no admin, find earliest **member** to promote
  - If no other members exist, soft-delete the group (set `deletedAt`)
  - Then remove the departing owner from group_members

**Changes Made:**
- Added comprehensive logging at each decision point
- Tracks: user ID, role, successor found/not found, promotion, deletion
- **These logs are essential for debugging** - keep them until we confirm everything works

**Logs Output (follow in backend console):**
```
[v0] leaveGroup called: userId=..., groupId=...
[v0] User role: owner/member/admin
[v0] User is owner, finding successor...
[v0] No admin found, looking for member
[v0] Found successor: ... → promotes to owner
[v0] No successor found, deleting group
[v0] User removed from group
```

### 2. **deleteGroup Endpoint** (Lines 353-379)
**Functionality:**
- Only group **owner** can delete
- Sets `deletedAt` to soft-delete (doesn't remove records, just hides them)

**Changes Made:**
- Added role validation logging
- Tracks deletion success/failure
- Shows clear error if non-owner tries to delete

**Logs Output:**
```
[v0] deleteGroup called: userId=..., groupId=...
[v0] Delete attempt - User role: owner/member/admin
[v0] User is not owner, denying delete
[v0] Group deleted successfully
```

---

## Frontend Fixes

### 1. **handleLeave** (GroupDetailPage.jsx, Lines 255-280)
**Changes:**
- Added console logging for debugging
- **Auto-redirect after successful leave**: Uses `setTimeout(() => navigate("/groups"), 500)` to give user feedback before leaving
- Better error logging on failure

### 2. **handleDelete** (GroupsPage.jsx, Lines 257-270)
**Changes:**
- Added console logging before/after delete
- Initialize error state to clear old messages: `setErr("")`
- Better error tracking

---

## How to Test

### Test Case 1: Regular Member Leaves
1. Login as a regular member
2. Enter any group you're in
3. Click "Leave Group"
4. **Expected:** Should redirect to /groups after ~500ms, no errors in console

**Monitor:** Backend logs for `[v0] User role: member`

---

### Test Case 2: Owner Leaves (Has Admin Successor)
1. Login as group owner
2. Ensure there's at least 1 admin in the group
3. Click "Leave Group"
4. **Expected:** 
   - Admin with earliest joinedAt becomes new owner
   - Original owner leaves
   - Redirect to /groups

**Monitor:** Backend logs for:
```
[v0] User role: owner
[v0] User is owner, finding successor...
[v0] Found successor: [admin UUID]
[v0] Successor promoted to owner
```

---

### Test Case 3: Owner Leaves (No Admin, Has Members)
1. Login as owner (no admins)
2. Click "Leave Group"
3. **Expected:**
   - Earliest member becomes owner
   - Original owner leaves

**Monitor:** Backend logs for:
```
[v0] User role: owner
[v0] No admin found, looking for member
[v0] Found successor: [member UUID]
```

---

### Test Case 4: Owner Leaves (No Other Members) - Group Deleted
1. Login as owner of a 1-person group (create one or remove all others)
2. Click "Leave Group"
3. **Expected:**
   - Group is soft-deleted (not removed, just marked with deletedAt)
   - Redirect to /groups
   - Group no longer appears in list

**Monitor:** Backend logs for:
```
[v0] User role: owner
[v0] No successor found, deleting group
[v0] Group soft-deleted
```

---

### Test Case 5: Owner Deletes Group
1. Login as group owner
2. Open "Delete Group" modal
3. Click "Delete"
4. **Expected:** Group soft-deleted, modal closes

**Monitor:** Backend logs for:
```
[v0] deleteGroup called: userId=...
[v0] Delete attempt - User role: owner
[v0] Group deleted successfully
```

---

### Test Case 6: Non-Owner Tries to Delete (Should Fail)
1. Login as regular member
2. Try to delete group (shouldn't see button, but test API)
3. **Expected:** Error "Only the group owner can delete the group"

**Monitor:** Backend logs:
```
[v0] Delete attempt - User role: member
[v0] User is not owner, denying delete
```

---

## Database Impact

- **No schema changes** - uses existing tables
- **Group Soft Delete:** Sets `deleted_at` timestamp on `study_group` table
- **Member Promotion:** Updates `group_member.group_role_id` to owner role
- **No cascading deletes** - groups/members remain in DB but are filtered out by `deletedAt IS NULL`

---

## Cleanup Notes

Once all tests pass and you confirm the fix works:
1. Remove all `System.out.println("[v0] ...")` statements from backend
2. Remove `console.error("[v0] ...")` and `console.log("[v0] ...")` from frontend
3. These were added only for debugging

---

## Related Code

- **Repository:** `GroupMemberRepository.findEarliestByGroupIdAndRole()` - finds successor by role and joinedAt
- **DTO:** `StudyGroupResponse` - now properly serializes `isMember` as Boolean
- **Roles:** "owner", "admin", "member", "moderator" (check your role hierarchy)

