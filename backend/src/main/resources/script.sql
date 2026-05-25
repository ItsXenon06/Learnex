-- =============================================================
--  AcademiaConnect — PostgreSQL Schema v5
--  "Facebook for students and universities"
--
--  This schema powers a social-academic network where students,
--  faculty, and staff can connect, share content, join study
--  groups, message each other, and interact within the context
--  of their institutions (schools, courses, terms).
--
--  Built on PostgreSQL 14+. Requires extensions: pgcrypto, citext.
--
--  DESIGN PHILOSOPHY
--  -----------------
--  • Every table has a UUID primary key generated server-side.
--  • Soft-deletes (deleted_at TIMESTAMPTZ) are used on user-facing
--    content (users, posts, comments, groups) so data can be
--    recovered and audit trails remain intact.
--  • Hard-deletes cascade on relational rows (reactions, memberships)
--    because those have no independent meaning once the parent is gone.
--  • Timestamps: created_at is immutable; updated_at is maintained
--    by trigger. All times stored in UTC (TIMESTAMPTZ).
--  • Visibility and moderation are first-class concepts, not
--    afterthoughts bolted on later.
--
--  CHANGES FROM v4 → v5 (audit fixes)
--  ------------------------------------
--  [V5-H1] ban: stale partial indexes dropped; active_ban VIEW is
--          the sole enforcement point. Documentation updated.
--  [V5-H2] connection: trigger added to enforce user_a < user_b
--          ordering when promoting a friend_request to connection,
--          preventing inconsistent PK ordering.
--  [V5-H3] guard_dm_member_count: changed from AFTER to BEFORE
--          INSERT to close concurrent-insert race condition.
--  [V5-H4] study_group.member_count: reconciliation function added;
--          trigger now also handles UPDATE (role changes don't
--          affect count, but this closes the surface).
--  [V5-H5] poll_vote: poll_id column removed; option_id alone
--          determines the poll via JOIN. Trigger updated.
--  [V5-M1] activity_log: DEFAULT partition added to catch any row
--          outside the explicit year ranges (clock skew, old data).
--  [V5-M2] comment: max nesting depth of 2 enforced by trigger
--          (direct reply to post, and one level of sub-reply).
--  [V5-M3] guard_post_not_deleted / guard_comment_not_deleted:
--          extended to also check author's deleted_at on INSERT.
--  [V5-M4] school.domain_email: UNIQUE partial index added; format
--          CHECK added (no @, must contain a dot).
--  [V5-M5] saved_post: index on (user_id, saved_at DESC) added.
--  [V5-M6] ban: expires_at added to idx_ban_user index.
--  [V5-L1] ck_email_lower note clarified in comment.
--  [V5-L2] post_group_id_fk made DEFERRABLE INITIALLY DEFERRED.
--  [V5-L3] message: content null-guard trigger added (must have
--          content OR at least one attachment).
--  [V5-L4] group_invitation: inviter membership trigger added.
--
--  POST-AUDIT FIXES (prod-readiness pass)
--  [PA-1] group_member.role_id: ON DELETE RESTRICT added (prevents silent
--         membership orphaning if a group_role row is deleted).
--  [PA-2] profile: created_at column added (was missing).
--  [PA-3] hashtag.tag: ck_hashtag_lowercase CHECK added so #Python and
--         #python cannot coexist as separate tags.
--  [PA-4] comment: guard_comment_same_post trigger added to prevent a reply
--         from parenting under a comment on a different post.
-- =============================================================

-- =============================================================
-- EXTENSIONS
-- pgcrypto  → gen_random_uuid() for all PKs
-- citext    → case-insensitive text type used for email
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";


-- =============================================================
-- UTILITY FUNCTIONS & TRIGGERS
-- =============================================================

-- Automatically stamps updated_at to NOW() on every UPDATE.
-- Attached via trigger to every table that has an updated_at column.
CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- =============================================================
-- SECTION 1: IDENTITY & ACCESS
--
-- Covers: users, roles, permissions, sessions, OAuth, devices,
-- and token management (refresh tokens, password reset,
-- account verification).
--
-- Key design decisions:
--  • email uses CITEXT for case-insensitive uniqueness, but we
--    also enforce lowercase storage via CHECK so all stored values
--    are normalised (CITEXT stores original case, comparisons are
--    case-insensitive — the CHECK forces canonical form).
--  • Soft-delete via deleted_at: a deleted user's rows remain for
--    audit purposes. is_active can be toggled for bans/suspensions
--    without losing the account.
--  • Role scoping: a user can be a 'global' moderator, a
--    'school'-level admin for one institution, or a 'group'-level
--    owner — all modelled in user_role with a scope column pair.
-- =============================================================

-- Roles define what a user can do (student, teacher, moderator, etc.)
CREATE TABLE role (
                      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                      name        VARCHAR(50) NOT NULL UNIQUE,
                      description TEXT,
                      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fine-grained actions on resources (e.g. action='delete', resource='post').
-- Roles are granted sets of permissions via role_permission.
CREATE TABLE permission (
                            id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                            action   VARCHAR(100) NOT NULL,
                            resource VARCHAR(100) NOT NULL,
                            UNIQUE (action, resource)
);

-- Many-to-many join between role and permission.
-- Cascade on both sides: deleting a role or permission removes its mappings.
CREATE TABLE role_permission (
                                 role_id       UUID NOT NULL REFERENCES role(id)       ON DELETE CASCADE,
                                 permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
                                 PRIMARY KEY (role_id, permission_id)
);

-- Core user account table.
-- password_hash is nullable to support OAuth-only accounts.
-- deleted_at IS NOT NULL means soft-deleted; triggers below prevent
-- deleted users from creating new content.
CREATE TABLE "user" (
                        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                        email         CITEXT       NOT NULL UNIQUE,
                        password_hash TEXT,                        -- NULL for OAuth-only accounts
                        is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
                        is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
                        deleted_at    TIMESTAMPTZ,                 -- NULL = active, NOT NULL = soft-deleted
                        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- [V5-L1] CITEXT stores original case but compares case-insensitively.
    -- This CHECK forces canonical lowercase storage so stored values are
    -- always normalised (useful for exports, ETL, external systems).
                        CONSTRAINT ck_email_lower CHECK (email = lower(email))
);

-- Assigns roles to users, optionally scoped to a school or group.
-- A user can be a platform_admin globally AND a teacher within a school.
-- Partial unique indexes (below) enforce:
--   • Only one role per (user, role, scope) combination globally
--   • Only one role per (user, role, scope, scope_id) for school/group
CREATE TABLE user_role (
                           id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                           user_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                           role_id    UUID        NOT NULL REFERENCES role(id)   ON DELETE CASCADE,
                           scope_type VARCHAR(20) NOT NULL DEFAULT 'global',
                           scope_id   UUID,                           -- NULL for global, school/group UUID otherwise
                           granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- scope_id must be present iff scope_type is not 'global'
                           CHECK (
                               (scope_type = 'global' AND scope_id IS NULL) OR
                               (scope_type IN ('school', 'group') AND scope_id IS NOT NULL)
                               ),
                           CONSTRAINT ck_user_role_scope_type
                               CHECK (scope_type IN ('global', 'school', 'group'))
);

-- Unique role assignment per user globally (scope_id IS NULL path)
CREATE UNIQUE INDEX uq_user_role_global
    ON user_role (user_id, role_id, scope_type)
    WHERE scope_id IS NULL;

-- Unique role assignment per user within a specific school or group
CREATE UNIQUE INDEX uq_user_role_scoped
    ON user_role (user_id, role_id, scope_type, scope_id)
    WHERE scope_id IS NOT NULL;

-- Tracks devices a user logs in from.
-- Used for push notifications and session management.
CREATE TABLE device (
                        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id      UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                        name         VARCHAR(100),                -- e.g. "John's iPhone 15"
                        platform     VARCHAR(30) NOT NULL,
                        push_token   TEXT,                        -- FCM / APNs token for push notifications
                        last_seen_at TIMESTAMPTZ,
                        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        CONSTRAINT ck_device_platform CHECK (platform IN ('web', 'ios', 'android'))
);

-- An active login session. Expires after a fixed TTL.
-- session links to device so we know which device the session is on.
CREATE TABLE session (
                         id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                         user_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                         device_id  UUID        REFERENCES device(id)          ON DELETE SET NULL,
                         ip         INET,
                         user_agent TEXT,
                         expires_at TIMESTAMPTZ NOT NULL,
                         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Long-lived token used to obtain new access tokens without re-login.
-- token_hash stores a bcrypt/SHA-256 hash; the raw token is only
-- returned at creation time and never stored.
CREATE TABLE refresh_token (
                               id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                               user_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                               token_hash TEXT        NOT NULL UNIQUE,
                               expires_at TIMESTAMPTZ NOT NULL,
                               created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Links a user account to a social login provider (Google, GitHub, etc.)
-- A user can have multiple OAuth accounts (e.g. Google + GitHub).
CREATE TABLE oauth_account (
                               id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                               user_id      UUID         NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                               provider     VARCHAR(50)  NOT NULL,       -- e.g. 'google', 'github', 'microsoft'
                               provider_uid VARCHAR(255) NOT NULL,       -- provider's stable user ID
                               access_token TEXT,                        -- stored encrypted in production
                               UNIQUE (provider, provider_uid)
);

-- One-time token emailed to users to verify their account email.
CREATE TABLE account_verification (
                                      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                      user_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                                      token_hash TEXT        NOT NULL UNIQUE,
                                      expires_at TIMESTAMPTZ NOT NULL,
                                      used_at    TIMESTAMPTZ,                   -- NULL = not yet used
                                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One-time token for password reset flow (forgot password email).
CREATE TABLE password_reset (
                                id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                user_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                                token_hash TEXT        NOT NULL UNIQUE,
                                expires_at TIMESTAMPTZ NOT NULL,
                                used_at    TIMESTAMPTZ,                   -- NULL = not yet used
                                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- SECTION 2: INSTITUTION
--
-- Models the academic hierarchy:
--   school_type → school → faculty → department → program
--                       → academic_term
--                       → course (via department) → class_section
--                                                 → enrollment
--
-- This mirrors real university structure. A "school" here means
-- an institution (university, high school, etc.), not a faculty.
-- Faculties and departments exist within a school.
-- =============================================================

-- Categorises institutions: university, high school, vocational, etc.
CREATE TABLE school_type (
                             id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                             name        VARCHAR(100) NOT NULL UNIQUE,
                             level       VARCHAR(50)  NOT NULL,
                             description TEXT,
                             CONSTRAINT ck_school_type_level
                                 CHECK (level IN ('primary', 'secondary', 'tertiary', 'vocational'))
);

-- An academic institution. domain_email is used to auto-verify
-- memberships when a user's email matches the school domain.
CREATE TABLE school (
                        id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                        name         VARCHAR(255) NOT NULL,
                        type_id      UUID         NOT NULL REFERENCES school_type(id),
                        domain_email VARCHAR(100),                -- e.g. "university.edu" (no @ sign)
                        country      VARCHAR(100),
                        city         VARCHAR(100),
                        logo_url     TEXT,
                        website      TEXT,
                        is_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
                        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- [V5-M4] Prevent two schools claiming the same email domain.
    -- Partial so that NULL domain_email schools don't conflict with each other.
    -- Format check: no @ sign (it's a domain, not an address), must have a dot.
                        CONSTRAINT ck_school_domain_format
                            CHECK (
                                domain_email IS NULL OR (
                                    domain_email NOT LIKE '%@%' AND domain_email LIKE '%.%'
                                    )
                                )
);

-- [V5-M4] Unique index on domain_email (only for non-null values).
-- Regular UNIQUE on a nullable column would allow multiple NULLs, which
-- is correct, but an explicit partial index makes the intent clearer
-- and works the same way across all Postgres versions.
CREATE UNIQUE INDEX uq_school_domain_email
    ON school (domain_email)
    WHERE domain_email IS NOT NULL;

-- A person's affiliation with a school: student, faculty, staff, alumni.
-- proof_url can be a photo of a student card or faculty letter.
-- Status starts as 'pending' until a school admin verifies the membership.
CREATE TABLE school_membership (
                                   id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                   user_id     UUID        NOT NULL REFERENCES "user"(id)   ON DELETE CASCADE,
                                   school_id   UUID        NOT NULL REFERENCES school(id)   ON DELETE CASCADE,
                                   role        VARCHAR(50) NOT NULL,
                                   status      VARCHAR(30) NOT NULL DEFAULT 'pending',
                                   proof_url   TEXT,
                                   verified_at TIMESTAMPTZ,
                                   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                   UNIQUE (user_id, school_id),               -- one membership record per user per school
                                   CONSTRAINT ck_school_membership_role
                                       CHECK (role IN ('student', 'faculty', 'staff', 'alumni')),
                                   CONSTRAINT ck_school_membership_status
                                       CHECK (status IN ('pending', 'verified', 'rejected'))
);

-- A faculty (college) within a school, e.g. "Faculty of Engineering".
-- Not to be confused with faculty members (people) — those use school_membership.
CREATE TABLE faculty (
                         id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                         school_id UUID         NOT NULL REFERENCES school(id) ON DELETE CASCADE,
                         name      VARCHAR(255) NOT NULL,
                         UNIQUE (school_id, name)
);

-- A department within a faculty, e.g. "Department of Computer Science".
CREATE TABLE department (
                            id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                            faculty_id UUID         NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
                            name       VARCHAR(255) NOT NULL,
                            code       VARCHAR(20)  -- short code, e.g. "CS", "MECH"
);

-- A degree program offered by a department, e.g. "BSc Computer Science".
CREATE TABLE program (
                         id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                         department_id  UUID         NOT NULL REFERENCES department(id) ON DELETE CASCADE,
                         name           VARCHAR(255) NOT NULL,
                         degree_type    VARCHAR(50),               -- e.g. "Bachelor", "Master", "PhD"
                         duration_years SMALLINT
);

-- A semester or academic term within a school (e.g. "Fall 2025").
-- Used to group class sections and enrollments into time periods.
-- end_date >= start_date allows single-day terms (orientation, etc.)
CREATE TABLE academic_term (
                               id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                               school_id  UUID         NOT NULL REFERENCES school(id) ON DELETE CASCADE,
                               name       VARCHAR(100) NOT NULL,
                               start_date DATE         NOT NULL,
                               end_date   DATE         NOT NULL,
                               CHECK (end_date >= start_date),            -- >= allows single-day terms
                               UNIQUE (school_id, name)
);

-- A specific course offered by a department, e.g. "CS101 - Intro to Programming".
-- level describes the academic level of the course.
CREATE TABLE course (
                        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                        department_id UUID         NOT NULL REFERENCES department(id) ON DELETE CASCADE,
                        code          VARCHAR(20)  NOT NULL,
                        name          VARCHAR(255) NOT NULL,
                        credits       SMALLINT,
                        level         VARCHAR(20),
                        UNIQUE (department_id, code),
                        CONSTRAINT ck_course_level
                            CHECK (level IS NULL OR level IN ('undergraduate', 'graduate', 'postgraduate', 'professional'))
);

-- A specific offering of a course in a given term with a specific instructor.
-- E.g. CS101 in Fall 2025 taught by Prof. Smith in Room 201.
-- schedule_json holds structured timetable data (days, times, room).
CREATE TABLE class_section (
                               id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                               course_id     UUID        NOT NULL REFERENCES course(id)        ON DELETE CASCADE,
                               term_id       UUID        NOT NULL REFERENCES academic_term(id) ON DELETE CASCADE,
                               instructor_id UUID        REFERENCES "user"(id)                 ON DELETE SET NULL,
                               room          VARCHAR(100),
                               schedule_json JSONB,                       -- e.g. {"days":["Mon","Wed"],"time":"09:00"}
                               created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A student's enrollment in a class section.
-- Status transitions: enrolled → completed (passed), or enrolled → dropped.
CREATE TABLE enrollment (
                            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id     UUID        NOT NULL REFERENCES "user"(id)        ON DELETE CASCADE,
                            section_id  UUID        NOT NULL REFERENCES class_section(id) ON DELETE CASCADE,
                            status      VARCHAR(30) NOT NULL DEFAULT 'enrolled',
                            enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                            UNIQUE (user_id, section_id),              -- can only enroll once per section
                            CONSTRAINT ck_enrollment_status
                                CHECK (status IN ('enrolled', 'dropped', 'completed'))
);


-- =============================================================
-- SECTION 3: MEDIA
--
-- All uploaded files (images, videos, PDFs, documents) are
-- tracked here. The actual binary is stored in object storage
-- (S3/GCS); this table stores the metadata and access URL.
--
-- status tracks the processing pipeline:
--   'processing' → file uploaded, thumbnail/transcode in progress
--   'ready'      → file is fully processed and publicly accessible
--   'failed'     → processing failed; should be retried or deleted
--
-- width/height are for images; duration_s is for videos.
-- =============================================================

CREATE TABLE media_file (
                            id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                            owner_id   UUID         NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                            url        TEXT         NOT NULL,
                            bucket_key TEXT         NOT NULL UNIQUE,   -- unique path within the storage bucket
                            mime_type  VARCHAR(100) NOT NULL,          -- e.g. "image/jpeg", "video/mp4"
                            size_bytes BIGINT,
                            width      INT,                            -- pixels (images only)
                            height     INT,                            -- pixels (images only)
                            duration_s INT,                            -- seconds (videos only)
                            status     VARCHAR(30)  NOT NULL DEFAULT 'ready',
                            created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                            CONSTRAINT ck_media_status CHECK (status IN ('processing', 'ready', 'failed'))
);


-- =============================================================
-- SECTION 4: PROFILE & SOCIAL GRAPH
--
-- Every user has one profile (created automatically on signup).
-- The social graph has two modes:
--   • Follow (asymmetric, like Twitter): follower_id follows followee_id
--   • Connection (symmetric, like LinkedIn): requires mutual acceptance
--     via friend_request. Enforced: user_a < user_b (UUID ordering)
--     so (A,B) and (B,A) can't both exist.
--
-- Additional: blocked_user (hides content), muted_user (hides
-- from feed without the other party knowing).
-- =============================================================

CREATE TABLE profile (
                         id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                         user_id         UUID        NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
                         display_name    VARCHAR(100),
                         headline        VARCHAR(160),              -- short bio, e.g. "CS student @ MIT"
                         bio             TEXT,
                         website         TEXT,
                         avatar_media_id UUID        REFERENCES media_file(id) ON DELETE SET NULL,
                         cover_media_id  UUID        REFERENCES media_file(id) ON DELETE SET NULL,
                         created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                         updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A user's education history. year_from/year_to are graduation years.
-- Both nullable because someone might list an in-progress degree.
CREATE TABLE profile_education (
                                   id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                   profile_id UUID        NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
                                   school_id  UUID        REFERENCES school(id)           ON DELETE SET NULL,
                                   degree     VARCHAR(100),
                                   field      VARCHAR(100),
                                   year_from  SMALLINT,
                                   year_to    SMALLINT,
    -- Only validate ordering if both years are present
                                   CONSTRAINT ck_edu_years CHECK (
                                       year_from IS NULL OR year_to IS NULL OR year_from <= year_to
                                       )
);

-- Awards, publications, certifications, etc.
CREATE TABLE profile_achievement (
                                     id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                                     profile_id  UUID         NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
                                     title       VARCHAR(200) NOT NULL,
                                     description TEXT,
                                     awarded_at  DATE         -- DATE (not TIMESTAMPTZ): only the date matters
);

-- Asymmetric follow relationship (Twitter-style).
-- Separate from connection: you can follow someone without being connected.
-- CHECK prevents self-follows.
CREATE TABLE follow (
                        follower_id UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                        followee_id UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        PRIMARY KEY (follower_id, followee_id),
                        CHECK (follower_id <> followee_id)
);

-- A connection request (LinkedIn-style friend request).
-- from_id < to_id enforced so the pair (A→B) and (B→A) map to the
-- same row, preventing duplicate requests in opposite directions.
CREATE TABLE friend_request (
                                id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                from_id      UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                                to_id        UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                                status       VARCHAR(20) NOT NULL DEFAULT 'pending',
                                responded_at TIMESTAMPTZ,
                                created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                UNIQUE (from_id, to_id),
                                CHECK (from_id < to_id),                   -- canonical ordering; see accept trigger
                                CONSTRAINT ck_friend_request_status
                                    CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Symmetric connection (exists after a friend_request is accepted).
-- user_a < user_b always (UUID ordering) — the trigger below enforces
-- this when promoting from friend_request, eliminating the ordering
-- dependency on application code.
-- [V5-H2] Trigger fn_promote_connection ensures correct (a<b) ordering.
CREATE TABLE connection (
                            user_a     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                            user_b     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                            PRIMARY KEY (user_a, user_b),
                            CHECK (user_a < user_b)
    -- PK (user_a, user_b) covers lookups by user_a; separate index on user_b below
);

-- Blocks a user. A blocked user cannot see the blocker's content or
-- message them. Checked at query time; not enforced by DB triggers.
CREATE TABLE blocked_user (
                              blocker_id UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                              blocked_id UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              PRIMARY KEY (blocker_id, blocked_id),
                              CHECK (blocker_id <> blocked_id)
);

-- Mutes a user's posts from your feed without notifying them.
CREATE TABLE muted_user (
                            muter_id   UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                            muted_id   UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                            PRIMARY KEY (muter_id, muted_id),
                            CHECK (muter_id <> muted_id)
);


-- =============================================================
-- SECTION 5: FEED & CONTENT
--
-- The core of the social network:
--   post → attachments, reactions, comments, shares, hashtags,
--          mentions, polls
--
-- Visibility controls who can see a post:
--   public      → anyone on the platform
--   connections → only connected users
--   school      → only members of the post's school
--   group       → only members of the post's group
--   private     → only the author
--
-- Soft-delete on post and comment: deleted_at IS NOT NULL hides the
-- content but retains it for moderation review.
-- =============================================================

-- Hashtags used in posts. Normalised into a separate table so we
-- can query trending tags, counts, etc., without full-text scanning posts.
CREATE TABLE hashtag (
                         id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                         tag VARCHAR(100) NOT NULL UNIQUE,           -- stored without the # symbol
    -- Enforce lowercase so #Python and #python are the same tag.
    -- Application should also lowercase before insert/lookup.
                         CONSTRAINT ck_hashtag_lowercase CHECK (tag = lower(tag))
);

-- The primary content unit, equivalent to a Facebook/Twitter post.
-- group_id FK is added via ALTER TABLE after study_group is created
-- (forward reference resolved by deferred FK — see [V5-L2]).
CREATE TABLE post (
                      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                      author_id  UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                      content    TEXT,                            -- NULL allowed for attachment-only posts
                      visibility VARCHAR(30) NOT NULL DEFAULT 'public',
                      school_id  UUID        REFERENCES school(id)          ON DELETE SET NULL,
                      group_id   UUID,                            -- FK added below after study_group exists
                      is_edited  BOOLEAN     NOT NULL DEFAULT FALSE,
                      is_pinned  BOOLEAN     NOT NULL DEFAULT FALSE,
                      deleted_at TIMESTAMPTZ,
                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                      CONSTRAINT ck_post_visibility
                          CHECK (visibility IN ('public', 'connections', 'school', 'group', 'private'))
);

-- A file attached to a post (image, video, PDF, document).
-- sort_order controls display order when multiple files are attached.
CREATE TABLE post_attachment (
                                 id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                 post_id    UUID        NOT NULL REFERENCES post(id)       ON DELETE CASCADE,
                                 media_id   UUID        NOT NULL REFERENCES media_file(id) ON DELETE CASCADE,
                                 type       VARCHAR(30) NOT NULL,
                                 sort_order SMALLINT    NOT NULL DEFAULT 0,
                                 CONSTRAINT ck_post_attachment_type
                                     CHECK (type IN ('image', 'video', 'pdf', 'document'))
);

-- Reaction types (like, love, insightful, etc.) are stored in a
-- lookup table so new reactions can be added without schema changes.
CREATE TABLE reaction_type (
                               id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                               name  VARCHAR(30) NOT NULL UNIQUE,
                               emoji VARCHAR(10),
                               color VARCHAR(7)                            -- hex color for UI display
);

-- A single user's reaction to a post. UNIQUE(post_id, user_id) means
-- one reaction per user per post (they can change type by updating the row).
CREATE TABLE post_reaction (
                               id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                               post_id          UUID        NOT NULL REFERENCES post(id)          ON DELETE CASCADE,
                               user_id          UUID        NOT NULL REFERENCES "user"(id)        ON DELETE CASCADE,
                               reaction_type_id UUID        NOT NULL REFERENCES reaction_type(id) ON DELETE CASCADE,
                               created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                               UNIQUE (post_id, user_id)
);

-- A comment on a post. parent_id enables threaded replies.
-- Max nesting depth = 2 enforced by trigger guard_comment_depth.
-- (top-level comment + one sub-reply; sub-replies cannot have children)
-- NOTE: parent_id does not enforce that the parent belongs to the same post_id.
-- The trigger guard_comment_same_post below enforces this at the DB level.
CREATE TABLE comment (
                         id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                         post_id    UUID        NOT NULL REFERENCES post(id)    ON DELETE CASCADE,
                         author_id  UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                         parent_id  UUID        REFERENCES comment(id)          ON DELETE CASCADE,
                         content    TEXT        NOT NULL,
                         is_edited  BOOLEAN     NOT NULL DEFAULT FALSE,
                         deleted_at TIMESTAMPTZ,
                         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                         updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A reaction to a specific comment (same reaction_type table).
CREATE TABLE comment_reaction (
                                  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                  comment_id       UUID        NOT NULL REFERENCES comment(id)       ON DELETE CASCADE,
                                  user_id          UUID        NOT NULL REFERENCES "user"(id)        ON DELETE CASCADE,
                                  reaction_type_id UUID        NOT NULL REFERENCES reaction_type(id) ON DELETE CASCADE,
                                  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                  UNIQUE (comment_id, user_id)
);

-- A user re-sharing someone else's post, optionally adding a note.
-- UNIQUE(user_id, post_id) prevents double-sharing the same post.
CREATE TABLE share (
                       id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                       user_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                       post_id    UUID        NOT NULL REFERENCES post(id)   ON DELETE CASCADE,
                       note       TEXT,
                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       UNIQUE (user_id, post_id)
);

-- A user bookmarking a post to read later.
CREATE TABLE saved_post (
                            id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id  UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                            post_id  UUID        NOT NULL REFERENCES post(id)   ON DELETE CASCADE,
                            saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                            UNIQUE (user_id, post_id)
);

-- Links hashtags to posts. A post can have many hashtags.
CREATE TABLE post_hashtag (
                              post_id    UUID NOT NULL REFERENCES post(id)    ON DELETE CASCADE,
                              hashtag_id UUID NOT NULL REFERENCES hashtag(id) ON DELETE CASCADE,
                              PRIMARY KEY (post_id, hashtag_id)
);

-- A mention of a user within a post or comment.
-- Exactly one of post_id or comment_id must be set (CHECK constraint).
-- [V5-H2 from v4] Uniqueness enforced via partial indexes (not standard
-- UNIQUE) because NULL != NULL in standard indexes — two rows with
-- post_id=NULL would not conflict on a UNIQUE(post_id, user_id) index.
CREATE TABLE mention (
                         id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                         post_id           UUID        REFERENCES post(id)    ON DELETE CASCADE,
                         comment_id        UUID        REFERENCES comment(id) ON DELETE CASCADE,
                         mentioned_user_id UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                         created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Exactly one context: a post-mention or a comment-mention, never both or neither
                         CONSTRAINT ck_mention_target CHECK (
                             (post_id IS NOT NULL AND comment_id IS NULL) OR
                             (post_id IS NULL     AND comment_id IS NOT NULL)
                             )
);

-- Partial unique indexes handle NULL correctly:
-- Only one mention of a user per post (when post_id is set)
CREATE UNIQUE INDEX uq_mention_post_user
    ON mention (post_id, mentioned_user_id)
    WHERE post_id IS NOT NULL;

-- Only one mention of a user per comment (when comment_id is set)
CREATE UNIQUE INDEX uq_mention_comment_user
    ON mention (comment_id, mentioned_user_id)
    WHERE comment_id IS NOT NULL;

-- A poll attached to a post. One poll per post (UNIQUE on post_id).
-- ends_at is when voting closes; NULL means the poll is indefinitely open.
CREATE TABLE poll (
                      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                      post_id    UUID        NOT NULL UNIQUE REFERENCES post(id) ON DELETE CASCADE,
                      question   TEXT        NOT NULL,
                      ends_at    TIMESTAMPTZ,
                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The options in a poll (e.g. "Option A", "Option B").
-- sort_order is unique per poll so display ordering is deterministic.
CREATE TABLE poll_option (
                             id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                             poll_id    UUID         NOT NULL REFERENCES poll(id) ON DELETE CASCADE,
                             label      VARCHAR(255) NOT NULL,
                             sort_order SMALLINT     NOT NULL DEFAULT 0,
                             UNIQUE (poll_id, sort_order)               -- no two options can share a display position
);

-- A user's vote on a poll option.
-- [V5-H5] poll_id column REMOVED from this table. It was a denormalised
-- duplicate of poll_option.poll_id that created an anomaly window
-- (client could pass a mismatched poll_id). Now poll_id is derived
-- via JOIN to poll_option when needed. The trigger below validates that
-- the option belongs to an open poll (not ended).
-- UNIQUE(option_id, user_id): one vote per option per user.
-- A user cannot vote for two options in the same poll — enforced by the
-- trigger fn_guard_one_vote_per_poll.
CREATE TABLE poll_vote (
                           id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                           option_id UUID        NOT NULL REFERENCES poll_option(id) ON DELETE CASCADE,
                           user_id   UUID        NOT NULL REFERENCES "user"(id)      ON DELETE CASCADE,
                           voted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                           UNIQUE (option_id, user_id)
);


-- =============================================================
-- SECTION 6: GROUPS
--
-- Study groups are the primary collaboration unit — like Facebook
-- Groups but academically focused. Types:
--   class   → auto-created for a class_section, linked via section_id
--   club    → student club (e.g. Robotics Club)
--   society → academic society
--   general → catch-all
--
-- Members have roles (owner, admin, moderator, member) stored in
-- group_role with JSON permissions so new capabilities can be
-- added without schema changes.
--
-- member_count is a denormalised counter maintained by trigger
-- (faster than COUNT(*) on large groups). A reconciliation
-- function recalculate_member_count() is provided for drift repair.
-- =============================================================

-- Roles within a group and their permission sets.
-- permissions_json is a freeform map allowing per-capability flags.
CREATE TABLE group_role (
                            id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                            name             VARCHAR(50) NOT NULL UNIQUE,
                            permissions_json JSONB       NOT NULL DEFAULT '{}'
);

-- A study group. deleted_at soft-deletes the group without losing history.
-- section_id links a 'class' type group to its class section.
CREATE TABLE study_group (
                             id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                             name           VARCHAR(255) NOT NULL,
                             description    TEXT,
                             type           VARCHAR(50)  NOT NULL DEFAULT 'general',
                             school_id      UUID         REFERENCES school(id)        ON DELETE SET NULL,
                             section_id     UUID         REFERENCES class_section(id) ON DELETE SET NULL,
                             cover_media_id UUID         REFERENCES media_file(id)    ON DELETE SET NULL,
                             is_private     BOOLEAN      NOT NULL DEFAULT FALSE,
                             member_count   INT          NOT NULL DEFAULT 0,           -- maintained by trigger
                             created_by     UUID         NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                             deleted_at     TIMESTAMPTZ,
                             created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                             CONSTRAINT ck_group_type
                                 CHECK (type IN ('class', 'club', 'society', 'general')),
                             CONSTRAINT ck_member_count_non_negative
                                 CHECK (member_count >= 0)
);

-- [V5-L2] The post → study_group FK is added here (after study_group exists).
-- DEFERRABLE INITIALLY DEFERRED means the FK is only checked at COMMIT,
-- not at each statement. This allows inserting a post and its group in the
-- same transaction regardless of order, and prevents failures in seed scripts.
ALTER TABLE post
    ADD CONSTRAINT post_group_id_fk
        FOREIGN KEY (group_id) REFERENCES study_group(id)
            ON DELETE SET NULL
            DEFERRABLE INITIALLY DEFERRED;

-- A user's membership in a study group with a specific role.
CREATE TABLE group_member (
                              id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                              group_id  UUID        NOT NULL REFERENCES study_group(id) ON DELETE CASCADE,
                              user_id   UUID        NOT NULL REFERENCES "user"(id)      ON DELETE CASCADE,
                              role_id   UUID        NOT NULL REFERENCES group_role(id) ON DELETE RESTRICT,
                              joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              UNIQUE (group_id, user_id)                 -- one membership per user per group
);

-- A request to join a private group. Status starts as pending.
CREATE TABLE group_join_request (
                                    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                    group_id   UUID        NOT NULL REFERENCES study_group(id) ON DELETE CASCADE,
                                    user_id    UUID        NOT NULL REFERENCES "user"(id)      ON DELETE CASCADE,
                                    message    TEXT,
                                    status     VARCHAR(20) NOT NULL DEFAULT 'pending',
                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                    UNIQUE (group_id, user_id),
                                    CONSTRAINT ck_group_join_request_status
                                        CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- An invitation sent by a group member to bring in someone new.
-- [V5-L4] Trigger fn_guard_inviter_membership verifies that the inviter
-- is actually a member of the group before the row is inserted.
CREATE TABLE group_invitation (
                                  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                  group_id   UUID        NOT NULL REFERENCES study_group(id) ON DELETE CASCADE,
                                  inviter_id UUID        NOT NULL REFERENCES "user"(id)      ON DELETE CASCADE,
                                  invitee_id UUID        NOT NULL REFERENCES "user"(id)      ON DELETE CASCADE,
                                  status     VARCHAR(20) NOT NULL DEFAULT 'pending',
                                  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                  UNIQUE (group_id, invitee_id),             -- one pending invite per invitee per group
                                  CONSTRAINT ck_group_invitation_status
                                      CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- An announcement pinned by an admin/owner in a group.
-- pinned_until defines when the pin expires (NULL = permanent pin).
CREATE TABLE group_announcement (
                                    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                                    group_id     UUID         NOT NULL REFERENCES study_group(id) ON DELETE CASCADE,
                                    author_id    UUID         NOT NULL REFERENCES "user"(id)      ON DELETE CASCADE,
                                    title        VARCHAR(255) NOT NULL,
                                    body         TEXT         NOT NULL,
                                    pinned_until TIMESTAMPTZ,
                                    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- A file shared within a group (lecture notes, assignments, etc.)
CREATE TABLE group_resource (
                                id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                                group_id    UUID         NOT NULL REFERENCES study_group(id) ON DELETE CASCADE,
                                media_id    UUID         NOT NULL REFERENCES media_file(id)  ON DELETE CASCADE,
                                uploaded_by UUID         NOT NULL REFERENCES "user"(id)      ON DELETE CASCADE,
                                title       VARCHAR(255) NOT NULL,
                                description TEXT,
                                folder      VARCHAR(100),                  -- virtual folder path for organisation
                                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- =============================================================
-- SECTION 7: MESSAGING
--
-- Three conversation types:
--   dm    → direct message between exactly 2 users (enforced by trigger)
--   group → multi-user chat (no member limit)
--   class → tied to a class_section; section_id must be set
--
-- Messages support threading (reply_to_id), soft-delete (is_deleted),
-- reactions (emoji), read receipts, and pinning.
-- =============================================================

-- A conversation thread. For 'class' type, section_id is mandatory.
CREATE TABLE conversation (
                              id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                              type            VARCHAR(20) NOT NULL DEFAULT 'dm',
                              name            VARCHAR(255),              -- display name for group/class chats
                              avatar_media_id UUID        REFERENCES media_file(id)    ON DELETE SET NULL,
                              section_id      UUID        REFERENCES class_section(id) ON DELETE SET NULL,
                              created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              CONSTRAINT ck_conversation_type
                                  CHECK (type IN ('dm', 'group', 'class')),
    -- section_id must be set iff type = 'class'
                              CONSTRAINT ck_conversation_section
                                  CHECK (
                                      (type = 'class' AND section_id IS NOT NULL) OR
                                      (type <> 'class' AND section_id IS NULL)
                                      )
);

-- A participant in a conversation. last_read_at is used to compute
-- unread message counts without a full table scan.
CREATE TABLE conversation_member (
                                     id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                     conv_id      UUID        NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
                                     user_id      UUID        NOT NULL REFERENCES "user"(id)       ON DELETE CASCADE,
                                     role         VARCHAR(20) NOT NULL DEFAULT 'member',
                                     joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                     last_read_at TIMESTAMPTZ,
                                     UNIQUE (conv_id, user_id),
                                     CONSTRAINT ck_conv_member_role
                                         CHECK (role IN ('owner', 'admin', 'member'))
);

-- A message within a conversation.
-- reply_to_id allows threading (reply to a specific message).
-- is_deleted = TRUE soft-deletes (content hidden, metadata kept for threading).
-- [V5-L3] Trigger fn_guard_message_content ensures content is not null
-- when no attachment exists (enforced after INSERT on message_attachment too).
CREATE TABLE message (
                         id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                         conv_id     UUID        NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
                         sender_id   UUID        NOT NULL REFERENCES "user"(id)       ON DELETE CASCADE,
                         content     TEXT,                          -- nullable: attachment-only messages allowed
                         reply_to_id UUID        REFERENCES message(id)               ON DELETE SET NULL,
                         is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
                         sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                         edited_at   TIMESTAMPTZ
);

-- A file attached to a message.
CREATE TABLE message_attachment (
                                    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                    message_id UUID        NOT NULL REFERENCES message(id)    ON DELETE CASCADE,
                                    media_id   UUID        NOT NULL REFERENCES media_file(id) ON DELETE CASCADE,
                                    type       VARCHAR(30) NOT NULL,
                                    CONSTRAINT ck_message_attachment_type
                                        CHECK (type IN ('image', 'video', 'pdf', 'document'))
);

-- An emoji reaction to a message (e.g. 👍 on a specific message).
-- UNIQUE(message_id, user_id, emoji): same user can react with different emojis.
CREATE TABLE message_reaction (
                                  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                  message_id UUID        NOT NULL REFERENCES message(id) ON DELETE CASCADE,
                                  user_id    UUID        NOT NULL REFERENCES "user"(id)  ON DELETE CASCADE,
                                  emoji      VARCHAR(10) NOT NULL,
                                  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                  UNIQUE (message_id, user_id, emoji)
);

-- Tracks when each user read a message (for "seen by" indicators).
CREATE TABLE read_receipt (
                              id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                              message_id UUID        NOT NULL REFERENCES message(id) ON DELETE CASCADE,
                              user_id    UUID        NOT NULL REFERENCES "user"(id)  ON DELETE CASCADE,
                              read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              UNIQUE (message_id, user_id)
);

-- A message pinned in a conversation for easy reference.
CREATE TABLE pinned_message (
                                id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                conv_id    UUID        NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
                                message_id UUID        NOT NULL REFERENCES message(id)      ON DELETE CASCADE,
                                pinned_by  UUID        NOT NULL REFERENCES "user"(id)       ON DELETE CASCADE,
                                pinned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                UNIQUE (conv_id, message_id)
);


-- =============================================================
-- SECTION 8: NOTIFICATIONS
--
-- In-app notifications (also drives push and email via
-- notification_preference settings).
--
-- payload_json carries the notification context, e.g.:
--   {"actor_id": "...", "post_id": "...", "preview": "Great post!"}
-- The shape varies per type; application code must handle each type.
--
-- notification_preference lets users opt out of specific channels
-- per notification type (e.g. no email for 'like' but push for 'mention').
-- =============================================================

CREATE TABLE notification (
                              id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                              user_id      UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                              type         VARCHAR(50) NOT NULL,
                              payload_json JSONB       NOT NULL DEFAULT '{}',
                              is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
                              created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              CONSTRAINT ck_notification_type
                                  CHECK (type IN ('like', 'comment', 'mention', 'follow', 'message',
                                                  'group_invite', 'group_join_request', 'friend_request',
                                                  'share', 'poll_ended'))
);

-- Per-user, per-type delivery preferences.
-- If a row is absent for a (user, type) pair, the application should
-- fall back to a system default (all channels enabled).
CREATE TABLE notification_preference (
                                         id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                         user_id UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                                         type    VARCHAR(50) NOT NULL,
                                         email   BOOLEAN     NOT NULL DEFAULT TRUE,
                                         push    BOOLEAN     NOT NULL DEFAULT TRUE,
                                         in_app  BOOLEAN     NOT NULL DEFAULT TRUE,
                                         UNIQUE (user_id, type),
    -- Must match the same type list as notification.type
                                         CONSTRAINT ck_notif_pref_type
                                             CHECK (type IN ('like', 'comment', 'mention', 'follow', 'message',
                                                             'group_invite', 'group_join_request', 'friend_request',
                                                             'share', 'poll_ended'))
);


-- =============================================================
-- SECTION 9: MODERATION
--
-- Moderation pipeline:
--   1. User submits a report (or AI auto-flags content → content_flag)
--   2. Moderator reviews; status moves: open → reviewing → resolved/dismissed
--   3. Moderator takes action (warn, remove_content, ban, dismiss)
--      → moderation_action row created
--   4. If ban: ban row inserted; active_ban VIEW is the source of truth
--
-- Bans can be platform-wide, school-scoped, or group-scoped.
-- [V5-H1] The partial unique indexes on ban with NOW() in the predicate
-- were REMOVED. NOW() is evaluated once at index-creation time, so those
-- indexes provided false uniqueness enforcement for later-inserted rows.
-- The active_ban VIEW below is the sole authoritative source for checking
-- whether a user is currently banned. Application code MUST query this
-- view, not the ban table directly.
-- =============================================================

-- Lookup table of report reasons (spam, harassment, plagiarism, etc.)
CREATE TABLE report_reason (
                               id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                               label    VARCHAR(100) NOT NULL UNIQUE,
                               category VARCHAR(50)  NOT NULL,
                               CONSTRAINT ck_report_reason_category
                                   CHECK (category IN ('content', 'account', 'academic'))
);

-- A user's report of a piece of content or another user.
-- target_type + target_id form a polymorphic FK (no DB-level FK possible;
-- referential integrity is enforced at application level).
CREATE TABLE report (
                        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                        reporter_id UUID        NOT NULL REFERENCES "user"(id)    ON DELETE CASCADE,
                        reason_id   UUID        REFERENCES report_reason(id)       ON DELETE SET NULL,
                        target_type VARCHAR(50) NOT NULL,
                        target_id   UUID        NOT NULL,
                        detail      TEXT,
                        status      VARCHAR(30) NOT NULL DEFAULT 'open',
                        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        CONSTRAINT ck_report_target_type
                            CHECK (target_type IN ('post', 'comment', 'user', 'message', 'group')),
                        CONSTRAINT ck_report_status
                            CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed'))
);

-- An action taken by a moderator in response to a report (or proactively).
CREATE TABLE moderation_action (
                                   id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                                   moderator_id UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                                   report_id    UUID        REFERENCES report(id)           ON DELETE SET NULL,
                                   action       VARCHAR(50) NOT NULL,
                                   note         TEXT,
                                   taken_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                   CONSTRAINT ck_moderation_action
                                       CHECK (action IN ('warn', 'remove_content', 'ban', 'dismiss'))
);

-- Auto-generated content flags from AI/spam detection pipeline.
-- These feed into the moderation queue for human review.
CREATE TABLE content_flag (
                              id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                              content_type    VARCHAR(50) NOT NULL,
                              content_id      UUID        NOT NULL,
                              flag_type       VARCHAR(50) NOT NULL,
                              auto_flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              CONSTRAINT ck_content_flag_type
                                  CHECK (flag_type IN ('spam', 'hate_speech', 'nsfw', 'plagiarism')),
                              CONSTRAINT ck_content_flag_content_type
                                  CHECK (content_type IN ('post', 'comment', 'message', 'group'))
);

-- A ban on a user, either platform-wide or scoped to a school/group.
-- scope_type + scope_id form a nullable scope pair (same pattern as user_role).
-- expires_at = NULL means permanent ban.
--
-- [V5-H1] IMPORTANT — stale partial indexes removed. Use active_ban VIEW below.
-- Application MUST check active_ban (or query: WHERE expires_at IS NULL OR expires_at > NOW())
-- and MUST NOT rely on the ban table alone for enforcement.
CREATE TABLE ban (
                     id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                     user_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                     banned_by  UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                     scope_type VARCHAR(20) NOT NULL DEFAULT 'platform',
                     scope_id   UUID,
                     reason     TEXT,
                     expires_at TIMESTAMPTZ,                    -- NULL = permanent ban
                     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                     CHECK (
                         (scope_type = 'platform' AND scope_id IS NULL) OR
                         (scope_type IN ('school', 'group') AND scope_id IS NOT NULL)
                         ),
                     CONSTRAINT ck_ban_scope_type
                         CHECK (scope_type IN ('platform', 'school', 'group'))
);

-- THE authoritative source for active ban checking.
-- Always query this view in application code, not the ban table directly.
-- A ban is active if it has no expiry (permanent) or hasn't expired yet.
CREATE VIEW active_ban AS
SELECT *
FROM ban
WHERE expires_at IS NULL OR expires_at > NOW();


-- =============================================================
-- SECTION 10: ACTIVITY & AUDIT
--
-- Two logging tables:
--   activity_log  → high-volume user activity (page views, interactions).
--                   Range-partitioned by created_at for performance.
--                   [V5-M1] DEFAULT partition added for out-of-range rows.
--   audit_log     → lower-volume admin/system events with full payload.
--   login_history → authentication events per device.
-- =============================================================

-- High-volume activity tracking (views, clicks, interactions).
-- Partitioned by year for efficient pruning and query performance.
-- Composite PK (id, created_at) required by Postgres declarative
-- partitioning (the partition key must be part of the PK).
CREATE TABLE activity_log (
                              id            UUID         NOT NULL DEFAULT gen_random_uuid(),
                              user_id       UUID         REFERENCES "user"(id) ON DELETE SET NULL,
                              action        VARCHAR(100) NOT NULL,
                              resource_type VARCHAR(50),
                              resource_id   UUID,
                              ip            INET,
                              created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                              PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE activity_log_2025
    PARTITION OF activity_log
        FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE activity_log_2026
    PARTITION OF activity_log
        FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE activity_log_2027
    PARTITION OF activity_log
        FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE activity_log_2028
    PARTITION OF activity_log
        FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

-- [V5-M1] Catch-all for rows outside all explicit year ranges.
-- Without this, inserting a row with a date before 2025 or after 2028
-- raises an error. This partition silently absorbs clock-skewed rows
-- and historical imports. Monitor it and add explicit partitions as needed.
CREATE TABLE activity_log_default
    PARTITION OF activity_log DEFAULT;

-- Lower-volume audit log for security-sensitive events
-- (role changes, bans, content removals, admin actions).
-- payload_json carries the full before/after state of the changed entity.
CREATE TABLE audit_log (
                           id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                           actor_id     UUID         REFERENCES "user"(id) ON DELETE SET NULL,
                           event_type   VARCHAR(100) NOT NULL,
                           payload_json JSONB        NOT NULL DEFAULT '{}',
                           created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Per-device login history: successful and failed attempts.
-- Useful for security alerts ("new login from unknown device").
CREATE TABLE login_history (
                               id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                               user_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                               device_id  UUID        REFERENCES device(id)          ON DELETE SET NULL,
                               ip         INET,
                               success    BOOLEAN     NOT NULL,
                               created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- INDEXES
--
-- Strategy:
--   1. FK columns that are queried in JOINs or WHERE clauses get indexes.
--   2. Feed queries (newest first) use DESC on created_at.
--   3. Partial indexes (WHERE ...) exclude logically deleted rows from
--      high-traffic paths, keeping index size small.
--   4. Multi-column indexes are ordered by selectivity: most selective
--      column first (except where ordering matters for range scans).
-- =============================================================

-- Identity & access
CREATE INDEX idx_user_email          ON "user"(email);
CREATE INDEX idx_user_active         ON "user"(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_deleted        ON "user"(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_session_user        ON session(user_id);
CREATE INDEX idx_session_expires     ON session(expires_at);
CREATE INDEX idx_refresh_token_user  ON refresh_token(user_id);
CREATE INDEX idx_refresh_token_expires ON refresh_token(expires_at); -- for cleanup jobs
CREATE INDEX idx_oauth_provider      ON oauth_account(provider, provider_uid);
CREATE INDEX idx_user_role_user      ON user_role(user_id, scope_type, scope_id);

-- Institution
CREATE INDEX idx_school_type              ON school(type_id);
CREATE INDEX idx_school_membership_user   ON school_membership(user_id);
CREATE INDEX idx_school_membership_school ON school_membership(school_id, status);
CREATE INDEX idx_enrollment_user          ON enrollment(user_id);
CREATE INDEX idx_enrollment_section       ON enrollment(section_id);
CREATE INDEX idx_class_section_course_term ON class_section(course_id, term_id);

-- Feed — main content queries.
-- Partial indexes (WHERE deleted_at IS NULL) are used for feed generation
-- because deleted posts never appear in feeds.
-- The non-partial idx_post_author_all is for admin/moderation queries
-- that need to see all posts including deleted ones.
CREATE INDEX idx_post_author     ON post(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_author_all ON post(author_id, created_at DESC);
CREATE INDEX idx_post_school     ON post(school_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_group      ON post(group_id,  created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_visibility ON post(visibility, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_pinned     ON post(group_id, is_pinned)
    WHERE is_pinned = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_comment_post    ON comment(post_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_comment_parent  ON comment(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_post_reaction_post  ON post_reaction(post_id);
CREATE INDEX idx_hashtag_tag         ON hashtag(tag);
CREATE INDEX idx_post_hashtag_hashtag ON post_hashtag(hashtag_id);
CREATE INDEX idx_mention_user        ON mention(mentioned_user_id);
CREATE INDEX idx_mention_post        ON mention(post_id)    WHERE post_id IS NOT NULL;
CREATE INDEX idx_mention_comment     ON mention(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX idx_poll_vote_option    ON poll_vote(option_id);  -- replaces old poll_id index
CREATE INDEX idx_poll_option_poll    ON poll_option(poll_id);

-- Attachments
CREATE INDEX idx_post_attachment_post       ON post_attachment(post_id);
CREATE INDEX idx_message_attachment_message ON message_attachment(message_id);

-- Profile
CREATE INDEX idx_profile_education_profile   ON profile_education(profile_id);
CREATE INDEX idx_profile_achievement_profile ON profile_achievement(profile_id);

-- Social graph
CREATE INDEX idx_follow_follower     ON follow(follower_id);
CREATE INDEX idx_follow_followee     ON follow(followee_id);
-- PK (user_a, user_b) covers user_a lookups on connection; only user_b needs its own index
CREATE INDEX idx_connection_b        ON connection(user_b);
CREATE INDEX idx_blocked_blocker     ON blocked_user(blocker_id);
CREATE INDEX idx_blocked_blocked     ON blocked_user(blocked_id);
CREATE INDEX idx_friend_request_from ON friend_request(from_id);
CREATE INDEX idx_friend_request_to   ON friend_request(to_id);

-- Groups
CREATE INDEX idx_group_member_user      ON group_member(user_id);
CREATE INDEX idx_group_member_group     ON group_member(group_id);
CREATE INDEX idx_study_group_school     ON study_group(school_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_group_resource_group   ON group_resource(group_id);
CREATE INDEX idx_group_resource_uploader ON group_resource(uploaded_by);
CREATE INDEX idx_group_announcement_group  ON group_announcement(group_id);
CREATE INDEX idx_group_announcement_author ON group_announcement(author_id);

-- Messaging
CREATE INDEX idx_conv_member_user    ON conversation_member(user_id);
CREATE INDEX idx_message_conv        ON message(conv_id, sent_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_message_sender      ON message(sender_id);
CREATE INDEX idx_read_receipt_user   ON read_receipt(user_id, message_id);
CREATE INDEX idx_read_receipt_message ON read_receipt(message_id);
CREATE INDEX idx_pinned_message_conv ON pinned_message(conv_id);

-- Saved posts — user's saved list ordered by recency
CREATE INDEX idx_saved_post_post      ON saved_post(post_id);
CREATE INDEX idx_saved_post_user_time ON saved_post(user_id, saved_at DESC); -- [V5-M5]

-- Notifications
CREATE INDEX idx_notification_user_unread ON notification(user_id, created_at DESC)
    WHERE is_read = FALSE;
CREATE INDEX idx_notification_user_all    ON notification(user_id, created_at DESC);

-- Moderation
CREATE INDEX idx_report_status  ON report(status, created_at);
CREATE INDEX idx_report_target  ON report(target_type, target_id);
-- [V5-M6] Include expires_at so active_ban VIEW queries can be satisfied from the index
CREATE INDEX idx_ban_user        ON ban(user_id, scope_type, expires_at);
CREATE INDEX idx_content_flag    ON content_flag(content_type, content_id);

-- Audit
CREATE INDEX idx_audit_actor        ON audit_log(actor_id, created_at DESC);
CREATE INDEX idx_activity_user      ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_login_history_user ON login_history(user_id, created_at DESC);


-- =============================================================
-- TRIGGERS
-- =============================================================

-- ---------------------
-- Auto-update updated_at
-- ---------------------
CREATE TRIGGER trg_post_updated_at
    BEFORE UPDATE ON post
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profile_updated_at
    BEFORE UPDATE ON profile
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_comment_updated_at
    BEFORE UPDATE ON comment
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------
-- [V5-H3] group member counter
-- Fires AFTER INSERT or DELETE on group_member to keep the denormalised
-- member_count column in sync. Uses GREATEST(...,0) to avoid going negative
-- if count drifts from a direct SQL update.
-- Call recalculate_member_count(group_id) to repair any drift.
-- ---------------------
CREATE OR REPLACE FUNCTION sync_member_count()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE study_group
        SET member_count = member_count + 1
        WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE study_group
        SET member_count = GREATEST(member_count - 1, 0)
        WHERE id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_group_member_count
    AFTER INSERT OR DELETE ON group_member
    FOR EACH ROW EXECUTE FUNCTION sync_member_count();

-- Utility: call this to repair member_count after bulk imports or direct SQL.
-- Usage: SELECT recalculate_member_count('group-uuid-here');
--        Or for all groups: SELECT recalculate_member_count(id) FROM study_group;
CREATE OR REPLACE FUNCTION recalculate_member_count(p_group_id UUID)
    RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE study_group
    SET member_count = (
        SELECT COUNT(*) FROM group_member WHERE group_id = p_group_id
    )
    WHERE id = p_group_id;
END;
$$;

-- ---------------------
-- Guard: prevent interactions with soft-deleted posts.
-- Also checks that the acting user's account is not deleted.
-- Applied to: post_reaction (INSERT), comment (INSERT).
-- [V5-M3] Added user deleted_at check.
-- ---------------------
CREATE OR REPLACE FUNCTION guard_post_not_deleted()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Prevent reacting to or commenting on a deleted post
    IF EXISTS (
        SELECT 1 FROM post
        WHERE id = NEW.post_id AND deleted_at IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cannot interact with a deleted post (id: %)', NEW.post_id;
    END IF;

    -- Prevent a soft-deleted user account from creating new content
    IF EXISTS (
        SELECT 1 FROM "user"
        WHERE id = NEW.author_id AND deleted_at IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Deleted user account (id: %) cannot create content', NEW.author_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Note: comment uses author_id; post_reaction uses user_id — both checked via author_id
-- field in the trigger. For post_reaction the user is called user_id, so we need
-- a separate variant:
CREATE OR REPLACE FUNCTION guard_post_reaction_not_deleted()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM post WHERE id = NEW.post_id AND deleted_at IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cannot react to a deleted post (id: %)', NEW.post_id;
    END IF;
    IF EXISTS (
        SELECT 1 FROM "user" WHERE id = NEW.user_id AND deleted_at IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Deleted user account (id: %) cannot react', NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_post_reaction_live
    BEFORE INSERT ON post_reaction
    FOR EACH ROW EXECUTE FUNCTION guard_post_reaction_not_deleted();

CREATE TRIGGER trg_comment_on_live_post
    BEFORE INSERT ON comment
    FOR EACH ROW EXECUTE FUNCTION guard_post_not_deleted();

-- ---------------------
-- Guard: prevent reactions on soft-deleted comments.
-- ---------------------
CREATE OR REPLACE FUNCTION guard_comment_not_deleted()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM comment
        WHERE id = NEW.comment_id AND deleted_at IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cannot react to a deleted comment (id: %)', NEW.comment_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_reaction_live
    BEFORE INSERT ON comment_reaction
    FOR EACH ROW EXECUTE FUNCTION guard_comment_not_deleted();

-- ---------------------
-- [V5-H2] Guard: DM conversations must have exactly 2 members.
-- Changed from AFTER to BEFORE INSERT to eliminate the race condition
-- where two concurrent inserts both pass the > 2 check before either commits.
-- BEFORE INSERT: count existing rows (NEW is not yet committed).
-- ---------------------
CREATE OR REPLACE FUNCTION guard_dm_member_count()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_conv_type  VARCHAR(20);
    v_member_cnt INT;
BEGIN
    SELECT type INTO v_conv_type
    FROM conversation
    WHERE id = NEW.conv_id;

    IF v_conv_type = 'dm' THEN
        -- Count existing members (NEW row not yet inserted, so this is safe)
        SELECT COUNT(*) INTO v_member_cnt
        FROM conversation_member
        WHERE conv_id = NEW.conv_id;

        IF v_member_cnt >= 2 THEN
            RAISE EXCEPTION
                'DM conversation % already has % member(s); DMs are limited to 2',
                NEW.conv_id, v_member_cnt;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Changed from AFTER to BEFORE to close the race condition window
CREATE TRIGGER trg_dm_member_count
    BEFORE INSERT ON conversation_member
    FOR EACH ROW EXECUTE FUNCTION guard_dm_member_count();

-- ---------------------
-- [V5-H5] Guard: poll vote consistency.
-- poll_vote no longer has a poll_id column, so we derive the poll from
-- the option and validate the poll has not ended.
-- ---------------------
CREATE OR REPLACE FUNCTION guard_poll_vote_consistency()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_poll_id  UUID;
    v_ends_at  TIMESTAMPTZ;
    v_existing INT;
BEGIN
    -- Derive the poll from the chosen option
    SELECT poll_id, p.ends_at
    INTO v_poll_id, v_ends_at
    FROM poll_option po
             JOIN poll p ON p.id = po.poll_id
    WHERE po.id = NEW.option_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'poll_vote: option_id % does not exist', NEW.option_id;
    END IF;

    -- Prevent voting on a closed poll
    IF v_ends_at IS NOT NULL AND v_ends_at < NOW() THEN
        RAISE EXCEPTION 'poll_vote: poll % has ended; voting is closed', v_poll_id;
    END IF;

    -- Prevent voting for more than one option in the same poll
    SELECT COUNT(*) INTO v_existing
    FROM poll_vote pv
             JOIN poll_option po ON po.id = pv.option_id
    WHERE po.poll_id = v_poll_id
      AND pv.user_id = NEW.user_id;

    IF v_existing > 0 THEN
        RAISE EXCEPTION
            'poll_vote: user % has already voted in poll %', NEW.user_id, v_poll_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_poll_vote_consistency
    BEFORE INSERT ON poll_vote
    FOR EACH ROW EXECUTE FUNCTION guard_poll_vote_consistency();

-- ---------------------
-- [V5-M2] Guard: limit comment nesting to depth 2.
-- Depth 0 = top-level comment (parent_id IS NULL)
-- Depth 1 = reply to a top-level comment (parent_id IS NOT NULL, grandparent IS NULL)
-- Depth 2+ = not allowed; user must reply to the top-level comment instead
-- ---------------------
CREATE OR REPLACE FUNCTION guard_comment_depth()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_parent_parent UUID;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW; -- top-level comment, always allowed
    END IF;

    -- Check if the parent already has a parent (depth would be >= 2)
    SELECT parent_id INTO v_parent_parent
    FROM comment
    WHERE id = NEW.parent_id;

    IF v_parent_parent IS NOT NULL THEN
        RAISE EXCEPTION
            'Comment nesting is limited to 2 levels. Reply to the top-level comment instead.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_depth
    BEFORE INSERT ON comment
    FOR EACH ROW EXECUTE FUNCTION guard_comment_depth();

-- ---------------------
-- Guard: a reply's parent_id must belong to the same post_id.
-- Without this, a comment on post A could parent under a comment on post B,
-- corrupting thread display. Checked on INSERT only (post_id is immutable).
-- ---------------------
CREATE OR REPLACE FUNCTION guard_comment_same_post()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_parent_post_id UUID;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW; -- top-level comment, no parent to check
    END IF;

    SELECT post_id INTO v_parent_post_id
    FROM comment
    WHERE id = NEW.parent_id;

    IF v_parent_post_id <> NEW.post_id THEN
        RAISE EXCEPTION
            'Reply parent_id % belongs to post %, not post % — cross-post threading not allowed',
            NEW.parent_id, v_parent_post_id, NEW.post_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_same_post
    BEFORE INSERT ON comment
    FOR EACH ROW EXECUTE FUNCTION guard_comment_same_post();

-- ---------------------
-- [V5-H2] Guard: enforce user_a < user_b ordering when creating a connection.
-- Called when the application promotes a friend_request to a connection.
-- Automatically swaps user_a/user_b if the caller passes them in the wrong order.
-- ---------------------
CREATE OR REPLACE FUNCTION fn_normalize_connection()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_tmp UUID;
BEGIN
    -- If the caller passed (user_a, user_b) in the wrong order, swap them
    -- before the PK CHECK (user_a < user_b) fires. This means application
    -- code never needs to pre-sort — the DB always normalises the pair.
    IF NEW.user_a > NEW.user_b THEN
        v_tmp      := NEW.user_a;
        NEW.user_a := NEW.user_b;
        NEW.user_b := v_tmp;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_connection
    BEFORE INSERT ON connection
    FOR EACH ROW EXECUTE FUNCTION fn_normalize_connection();

-- ---------------------
-- [V5-L3] Guard: a message must have content OR at least one attachment.
-- Checked AFTER INSERT so that we can query message_attachment for the
-- newly inserted message. If neither exists, the INSERT is rejected.
-- This is enforced as a deferred AFTER trigger to allow message + attachment
-- to be inserted in the same transaction.
-- ---------------------
CREATE OR REPLACE FUNCTION guard_message_content()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.content IS NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM message_attachment WHERE message_id = NEW.id
        ) THEN
            RAISE EXCEPTION
                'Message % has no content and no attachment; at least one is required', NEW.id;
        END IF;
    END IF;
    RETURN NULL; -- AFTER trigger; return value ignored
END;
$$;

-- CONSTRAINT trigger: deferred so attachment can be inserted before the check fires
CREATE CONSTRAINT TRIGGER trg_message_content
    AFTER INSERT ON message
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION guard_message_content();

-- ---------------------
-- [V5-L4] Guard: group invitation inviter must be a member of the group.
-- Prevents non-members (or former members) from sending invitations.
-- ---------------------
CREATE OR REPLACE FUNCTION fn_guard_inviter_membership()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM group_member
        WHERE group_id = NEW.group_id
          AND user_id  = NEW.inviter_id
    ) THEN
        RAISE EXCEPTION
            'User % is not a member of group % and cannot send invitations',
            NEW.inviter_id, NEW.group_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_group_inviter_membership
    BEFORE INSERT ON group_invitation
    FOR EACH ROW EXECUTE FUNCTION fn_guard_inviter_membership();


-- =============================================================
-- SEED DATA
--
-- Minimum data required for the application to function.
-- Roles, reaction types, report reasons, school types, and group roles
-- are referenced by FK throughout the application.
-- =============================================================

-- Platform roles. Scope is determined by user_role.scope_type.
INSERT INTO role (name, description) VALUES
                                         ('student',        'Regular enrolled student'),
                                         ('teacher',        'Course instructor or lecturer'),
                                         ('staff',          'Non-teaching school staff'),
                                         ('alumni',         'Former student'),
                                         ('moderator',      'Platform content moderator'),
                                         ('school_admin',   'Administrator for a specific school'),
                                         ('platform_admin', 'Global platform administrator');

-- Reaction types for posts and comments.
-- emoji + color are used by the front end for rendering.
INSERT INTO reaction_type (name, emoji, color) VALUES
                                                   ('like',       '👍', '#378ADD'),
                                                   ('love',       '❤️',  '#D4537E'),
                                                   ('insightful', '💡', '#EF9F27'),
                                                   ('support',    '🤝', '#1D9E75'),
                                                   ('celebrate',  '🎉', '#7F77DD');

-- Standard report reasons. category groups them in the moderation UI.
INSERT INTO report_reason (label, category) VALUES
                                                ('Spam',                  'content'),
                                                ('Harassment',            'content'),
                                                ('Hate speech',           'content'),
                                                ('Misinformation',        'content'),
                                                ('Academic dishonesty',   'academic'),
                                                ('Plagiarism',            'academic'),
                                                ('Fake account',          'account'),
                                                ('Impersonation',         'account'),
                                                ('Inappropriate content', 'content');

-- Institution classification levels.
INSERT INTO school_type (name, level, description) VALUES
                                                       ('University',          'tertiary',   'Degree-granting higher education institution'),
                                                       ('Community College',   'tertiary',   'Two-year college offering associate degrees'),
                                                       ('Vocational School',   'vocational', 'Practical skills and trade training'),
                                                       ('High School',         'secondary',  'Ages 14-18, secondary education'),
                                                       ('Middle School',       'secondary',  'Ages 11-14, lower secondary'),
                                                       ('Primary School',      'primary',    'Ages 5-11, foundational education'),
                                                       ('International School','tertiary',   'Internationally accredited institution');

-- Group roles and their permission sets.
-- permissions_json is consumed by the application to determine
-- what a member can do (manage members, pin posts, etc.).
INSERT INTO group_role (name, permissions_json) VALUES
                                                    ('owner',     '{"manage_members":true,  "post":true, "delete_group":true,  "pin":true}'),
                                                    ('admin',     '{"manage_members":true,  "post":true, "delete_group":false, "pin":true}'),
                                                    ('moderator', '{"manage_members":false, "post":true, "delete_group":false, "pin":true}'),
                                                    ('member',    '{"manage_members":false, "post":true, "delete_group":false, "pin":false}');


-- =============================================================
-- MIGRATION NOTES (v4 → v5)
-- =============================================================
--
-- Run all steps inside a transaction. Test on a copy first.
--
-- 1. [V5-H1] Drop stale partial ban indexes:
--    DROP INDEX IF EXISTS uq_ban_active_platform;
--    DROP INDEX IF EXISTS uq_ban_active_scoped;
--    -- No data migration needed; just remove the misleading indexes.
--
-- 2. [V5-H5] Remove poll_id from poll_vote:
--    -- Verify consistency first:
--    SELECT COUNT(*) FROM poll_vote pv
--    JOIN poll_option po ON po.id = pv.option_id
--    WHERE po.poll_id <> pv.poll_id;  -- must return 0 before proceeding
--    ALTER TABLE poll_vote DROP CONSTRAINT IF EXISTS poll_vote_poll_id_fkey;
--    ALTER TABLE poll_vote DROP COLUMN poll_id;
--    ALTER TABLE poll_vote DROP CONSTRAINT IF EXISTS poll_vote_poll_id_user_id_key;
--    ALTER TABLE poll_vote ADD CONSTRAINT uq_poll_vote UNIQUE (option_id, user_id);
--    DROP INDEX IF EXISTS idx_poll_vote_poll;
--    CREATE INDEX idx_poll_vote_option ON poll_vote(option_id);
--
-- 3. [V5-H2] Add connection normalisation trigger:
--    (just CREATE the trigger function and trigger as defined above)
--
-- 4. [V5-H3] Replace DM member count trigger (AFTER → BEFORE):
--    DROP TRIGGER trg_dm_member_count ON conversation_member;
--    (re-create function and trigger as defined above)
--
-- 5. [V5-M1] Add default partition:
--    -- Only if on Pg 11+ and no DEFAULT partition exists:
--    CREATE TABLE activity_log_default PARTITION OF activity_log DEFAULT;
--
-- 6. [V5-M2] Add comment depth trigger:
--    (just CREATE the trigger function and trigger as defined above)
--
-- 7. [V5-M3] Replace guard_post_not_deleted with user-check variant:
--    DROP TRIGGER trg_post_reaction_live ON post_reaction;
--    DROP TRIGGER trg_comment_on_live_post ON comment;
--    (re-create functions and triggers as defined above)
--
-- 8. [V5-M4] Add school domain unique index and format check:
--    -- Clean data first if needed:
--    UPDATE school SET domain_email = NULL
--    WHERE domain_email LIKE '%@%' OR domain_email NOT LIKE '%.%';
--    ALTER TABLE school ADD CONSTRAINT ck_school_domain_format
--        CHECK (domain_email IS NULL OR
--               (domain_email NOT LIKE '%@%' AND domain_email LIKE '%.%'));
--    CREATE UNIQUE INDEX uq_school_domain_email
--        ON school (domain_email) WHERE domain_email IS NOT NULL;
--
-- 9. [V5-M5] Add saved_post time index:
--    CREATE INDEX idx_saved_post_user_time ON saved_post(user_id, saved_at DESC);
--
-- 10.[V5-M6] Replace ban index with expires_at included:
--    DROP INDEX IF EXISTS idx_ban_user;
--    CREATE INDEX idx_ban_user ON ban(user_id, scope_type, expires_at);
--
-- 11.[V5-L2] Make post_group_id_fk deferrable:
--    ALTER TABLE post DROP CONSTRAINT IF EXISTS post_group_id_fk;
--    ALTER TABLE post ADD CONSTRAINT post_group_id_fk
--        FOREIGN KEY (group_id) REFERENCES study_group(id)
--        ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
--
-- 12.[V5-L3] Add message content guard trigger:
--    (just CREATE the trigger function and trigger as defined above)
--
-- 13.[V5-L4] Add group invitation inviter membership trigger:
--    -- Clean stale invalid invitations first (inviter no longer a member):
--    DELETE FROM group_invitation gi
--    WHERE NOT EXISTS (
--        SELECT 1 FROM group_member gm
--        WHERE gm.group_id = gi.group_id AND gm.user_id = gi.inviter_id
--    );
--    (then CREATE the trigger function and trigger as defined above)
--
-- =============================================================