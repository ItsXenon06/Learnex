# Database Schema Audit Report - v5

## Executive Summary

Completed audit and alignment of backend models with updated `script.sql` (PostgreSQL Schema v5). The schema includes significant changes from v4, including trigger improvements, constraint additions, and structural refinements.

## Changes Made

### 1. Mention Entity - **MAJOR REFACTOR** ✅

**Issue**: The Mention model used a polymorphic pattern (`targetType`/`targetId`) that didn't match the schema's separate `post_id` and `comment_id` columns with CHECK constraint.

**Schema (script.sql lines 689-711)**:
```sql
CREATE TABLE mention (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id           UUID REFERENCES post(id) ON DELETE CASCADE,
    comment_id        UUID REFERENCES comment(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_mention_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);
```

**Fix Applied**:
- Replaced `targetType` and `targetId` fields with `post` and `comment` ManyToOne relationships
- Added JPA lifecycle validation to mirror the DB CHECK constraint
- Updated column mappings to match schema exactly

**File**: `backend/src/main/java/com/studentsocial/backend/model/Mention.java`

### 2. MessagingService - Type Conversion Fix ✅

**Issue**: `Conversation.createdAt` is `OffsetDateTime` but `ConversationResponse.createdAt` expects `LocalDateTime`, causing a compilation error.

**Fix Applied**:
- Added `.toLocalDateTime()` conversion in `MessagingService.toConversationResponse()`

**File**: `backend/src/main/java/com/studentsocial/backend/service/MessagingService.java` (line 185)

### 3. GroupMember Entity - No Changes Needed ✅

**Schema Requirement** (script.sql line 814):
```sql
role_id UUID NOT NULL REFERENCES group_role(id) ON DELETE RESTRICT
```

**Analysis**: The `ON DELETE RESTRICT` constraint is enforced at the database level via the SQL schema. JPA doesn't need to specify this - it's a DB-level referential integrity constraint that prevents deletion of group roles that are still referenced by group members.

**Status**: ✅ Correctly configured - DB constraint handles this

### 4. Hashtag Entity - No Changes Needed ✅

**Schema Requirement** (script.sql lines 574-577):
```sql
CONSTRAINT ck_hashtag_lowercase CHECK (tag = lower(tag))
```

**Analysis**: The lowercase CHECK constraint is enforced at the database level. JPA's `@Check` annotation is not part of standard JPA/Hibernate, and the constraint is properly defined in the SQL schema.

**Status**: ✅ Correctly configured - DB constraint handles this

### 5. Other Schema Changes - Verified ✅

All other v5 schema changes are enforced at the database level via triggers and constraints:

- **[V5-H1]** Ban: Active ban VIEW is the enforcement point (no model changes needed)
- **[V5-H2]** Connection: Trigger enforces user_a < user_b ordering (no model changes needed)
- **[V5-H3]** DM member count: BEFORE INSERT trigger (no model changes needed)
- **[V5-H5]** Poll vote: poll_id removed, derived via JOIN (PollVote model already correct)
- **[V5-M1]** Activity log: DEFAULT partition (no model changes needed)
- **[V5-M2]** Comment depth: Trigger enforces max nesting of 2 (no model changes needed)
- **[V5-M3]** Guard triggers: Extended to check author deleted_at (no model changes needed)
- **[V5-M4]** School domain: CHECK constraint and unique index (no model changes needed)
- **[V5-M5]** Saved post: Index optimization (no model changes needed)
- **[V5-M6]** Ban index: Index optimization (no model changes needed)
- **[V5-L2]** Post group FK: DEFERRABLE INITIALLY DEFERRED (no model changes needed)
- **[V5-L3]** Message content: Deferred trigger (no model changes needed)
- **[V5-L4]** Group invitation: Inviter membership trigger (no model changes needed)
- **[PA-1]** GroupMember role: ON DELETE RESTRICT (verified above)
- **[PA-2]** Profile created_at: Already present in model ✅
- **[PA-3]** Hashtag lowercase: Verified above ✅
- **[PA-4]** Comment same post: Trigger enforcement (no model changes needed)

## Model Verification Summary

### ✅ Models Verified Correct (No Changes Needed)
- User
- Profile (has created_at)
- Post
- Comment
- PostReaction
- CommentReaction
- Poll
- PollOption
- PollVote (already correct - no poll_id field)
- StudyGroup
- GroupRole
- GroupMember
- GroupInvitation
- GroupJoinRequest
- Conversation
- ConversationMember
- Message
- MessageAttachment
- MessageReaction
- Hashtag
- School
- SchoolMembership
- UserRole
- Ban
- Connection
- FriendRequest
- Follow
- BlockedUser
- MutedUser
- Notification
- NotificationPreference
- MediaFile
- PostAttachment
- PostHashtag
- Share
- SavedPost
- Mention (UPDATED)

## Database-Level Constraints & Triggers

All CHECK constraints, triggers, and complex validations are properly defined in the SQL schema and will be enforced by PostgreSQL:

1. **CHECK Constraints**: Email lowercase, hashtag lowercase, school domain format, comment depth, mention target, etc.
2. **Triggers**: Updated_at auto-stamp, member count sync, poll vote validation, DM member limit, message content validation, connection ordering, etc.
3. **Partial Unique Indexes**: Handle NULL correctly for mentions, user roles, etc.
4. **Deferred Constraints**: Post group FK, message content validation

## Recommendations

1. **Application Layer**: Ensure the application lowercases hashtag tags before insert/lookup (as noted in schema comments)
2. **Ban Checking**: Always query the `active_ban` VIEW, not the ban table directly
3. **Connection Ordering**: Let the DB trigger handle user_a/user_b ordering - no need to sort in application code
4. **Message Validation**: Ensure messages have content OR at least one attachment (enforced by deferred trigger)
5. **Comment Nesting**: Application should respect the 2-level nesting limit (enforced by trigger)

## Conclusion

The backend model layer is now fully aligned with the v5 database schema. All critical constraints and validations are enforced at the database level, providing robust data integrity. The only code changes required were:
1. The Mention entity refactoring to match the schema's relational structure
2. A type conversion fix in MessagingService for OffsetDateTime → LocalDateTime

**Audit Date**: 2026-05-22  
**Schema Version**: v5  
**Status**: ✅ COMPLETE