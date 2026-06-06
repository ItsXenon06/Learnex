# Vice-Admin Role Setup Guide

## Overview
Your group role hierarchy now works like Discord:
- **Owner**: Full control, can assign admin roles, delete group, leave (admin inherits)
- **Admin** (Vice-Admin): Similar permissions to owner, becomes owner if owner leaves
- **Moderator**: Moderation capabilities
- **Member**: Regular member

## Database Setup
No database changes needed! The roles already exist in your database:

```sql
SELECT * FROM group_role;
-- Results: owner, admin, moderator, member
```

## New Endpoints Added

### 1. Update Member Role
**Endpoint**: `PUT /api/groups/{groupId}/members/{memberId}/role`

**Required**: Only the group owner can call this endpoint

**Request Body**:
```json
{
  "roleName": "admin"  // or "moderator", "member"
}
```

**Example - Promote a member to admin**:
```bash
curl -X PUT http://localhost:8080/api/groups/{groupId}/members/{memberId}/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"roleName": "admin"}'
```

**Example - Demote admin back to member**:
```bash
curl -X PUT http://localhost:8080/api/groups/{groupId}/members/{memberId}/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"roleName": "member"}'
```

### 2. Leave Group Succession Logic
When a group owner leaves, the system automatically:
1. Finds the **earliest admin** (by join date) and promotes them to owner
2. If no admins exist, finds the **earliest member** and promotes them to owner
3. If only 1 member remains, the group is soft-deleted when they leave

**Endpoint**: `DELETE /api/groups/{groupId}/leave`

## Frontend Implementation

To add a UI for promoting members to admin:

```javascript
// Promote a member to admin
const promoteToAdmin = async (groupId, memberId) => {
  const res = await fetch(`/api/groups/${groupId}/members/${memberId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleName: 'admin' }),
  });
  return res.json();
};

// Demote admin to member
const demoteToMember = async (groupId, memberId) => {
  const res = await fetch(`/api/groups/${groupId}/members/${memberId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleName: 'member' }),
  });
  return res.json();
};
```

## Permissions Summary

| Action | Owner | Admin | Moderator | Member |
|--------|-------|-------|-----------|--------|
| Promote/Demote Members | ✅ | ❌ | ❌ | ❌ |
| Delete Group | ✅ | ❌ | ❌ | ❌ |
| Leave Group | ✅ (inherits) | ✅ (becomes owner if sole admin) | ✅ | ✅ |
| Create Posts | ✅ | ✅ | ✅ | ✅ |
| Edit Own Posts | ✅ | ✅ | ✅ | ✅ |

## Notes
- You cannot promote the owner to a different role
- You cannot demote the owner
- If an owner leaves and multiple admins exist, the **earliest admin by join date** inherits ownership
- If only the owner remains in the group and they leave, the group is automatically soft-deleted
