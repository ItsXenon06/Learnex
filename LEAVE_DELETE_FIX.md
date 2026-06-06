# Group Leave/Delete Fix - Comprehensive Report

## Problem Summary
- **Member trying to leave**: 500 Internal Server Error
- **Owner trying to leave**: 500 Internal Server Error  
- **After owner leaves and member promoted**: Owner didn't actually leave
- **Delete functionality**: Not working due to same backend issues

## Root Cause Analysis

### Issue 1: Invalid JPQL Syntax in `findEarliestByGroupIdAndRole`
**File**: `backend/src/main/java/com/studentsocial/backend/repository/GroupMemberRepository.java`

**Problem**: The query used `LIMIT 1` keyword which is NOT valid in JPQL (Java Persistence Query Language). JPQL uses pagination differently.

```java
// ❌ BEFORE (BROKEN):
@Query("""
    SELECT gm FROM GroupMember gm
    WHERE gm.group.id = :groupId
      AND gm.user.id  <> :excludeUserId
      AND gm.role.name = :roleName
    ORDER BY gm.joinedAt ASC
    LIMIT 1  // <- INVALID IN JPQL
    """)
Optional<GroupMember> findEarliestByGroupIdAndRole(
        @Param("groupId")       UUID   groupId,
        @Param("excludeUserId") UUID   excludeUserId,
        @Param("roleName")      String roleName);
```

This caused a **compilation/execution error** that resulted in the 500 error whenever `/leave` was called.

### Issue 2: Non-existent "admin" Role
**File**: `backend/src/main/java/com/studentsocial/backend/controller/GroupController.java`

**Problem**: The logic looked for an "admin" role, but your schema only has "owner" and "member" roles.

```java
// ❌ BEFORE (BROKEN):
Optional<GroupMember> successor = groupMemberRepository.findEarliestByGroupIdAndRole(id, userId, "admin");
if (successor.isEmpty()) {
    successor = groupMemberRepository.findEarliestByGroupIdAndRole(id, userId, "member");
}
```

Since "admin" role never exists, the logic would always fail to find anyone to promote.

## Solution Implemented

### Fix 1: Corrected JPQL Query
```java
// ✅ AFTER (FIXED):
@Query("""
    SELECT gm FROM GroupMember gm
    WHERE gm.group.id = :groupId
      AND gm.user.id  <> :excludeUserId
    ORDER BY gm.joinedAt ASC
    """)
Optional<GroupMember> findEarliestByGroupIdAndRole(
        @Param("groupId")       UUID   groupId,
        @Param("excludeUserId") UUID   excludeUserId);
```

Key changes:
- Removed invalid `LIMIT 1` (JPA automatically returns first result from `Optional<>`)
- Removed role name parameter (it wasn't working anyway)
- Removed role name filter (now queries for ANY member to promote)

### Fix 2: Simplified Controller Logic
```java
// ✅ AFTER (FIXED):
if ("owner".equals(memberRole)) {
    Optional<GroupMember> successor = groupMemberRepository.findEarliestByGroupIdAndRole(id, userId);
    
    if (successor.isPresent()) {
        // Promote earliest member to owner
        GroupRole ownerRole = groupRoleRepository.findByName("owner")...
        successor.get().setRole(ownerRole);
        groupMemberRepository.save(successor.get());
    } else {
        // No other members → soft-delete group
        group.setDeletedAt(LocalDateTime.now());
        studyGroupRepository.save(group);
    }
}
groupMemberRepository.deleteByGroupIdAndUserId(id, userId);
```

## Behavior After Fix

### When a Member Leaves
1. User's role is checked: "member"
2. No succession logic needed (not owner)
3. User is removed from `group_member` table
4. Frontend redirects to groups list

### When an Owner Leaves (with other members)
1. User's role is checked: "owner"
2. Query finds earliest (longest-standing) member by `joinedAt` date
3. That member is promoted to "owner" role in database
4. Current owner is removed from `group_member` table
5. Frontend redirects to groups list

### When an Owner Leaves (solo)
1. User's role is checked: "owner"
2. Query finds no other members
3. Group is soft-deleted (`deletedAt` set to current timestamp)
4. User is removed from `group_member` table
5. Group no longer appears in group listings

## Testing Checklist

After backend rebuild, test these scenarios:

- [ ] Member joins group
- [ ] Member leaves group (should see "Joined" → "Join" button state, then redirect)
- [ ] Admin creates group (auto-promoted to owner)
- [ ] Owner adds another member
- [ ] Owner leaves → other member should be promoted to owner
- [ ] New owner can verify they're now owner (UI shows different controls)
- [ ] Owner deletes group (only owner can delete)
- [ ] Create group with only owner, owner leaves → group auto-deletes

## Commit Information
- **Commit**: `0267d56`
- **Branch**: `database-inspection-report`
- **Files Changed**: 
  - `backend/src/main/java/com/studentsocial/backend/repository/GroupMemberRepository.java`
  - `backend/src/main/java/com/studentsocial/backend/controller/GroupController.java`

## Backend Rebuild Required
This fix requires rebuilding the backend JAR file for deployment. The Java compilation will now succeed without errors.
