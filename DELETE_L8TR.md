# LEARNEX - Project Structure & Deletion Guide

## Root Level - IDE/Build Configuration (To Delete)

```
.idea/                          # IntelliJ IDEA metadata
├── compiler.xml
├── dataSources/
├── dataSources.local.xml
├── dataSources.xml
├── data_sources_history.xml
├── encodings.xml
├── jarRepositories.xml
├── misc.xml
├── sqldialects.xml
├── uiDesigner.xml
├── vcs.xml
└── workspace.xml

.env                            # Sensitive environment variables
backend.iml                     # IntelliJ project file
```

---

## BACKEND - Spring Boot Application

### Root Configuration Files

```
backend/
├── .env                        # Backend environment variables
├── .gitattributes
├── .gitignore
├── .mvn/wrapper/               # Maven wrapper
│   └── maven-wrapper.properties
├── HELP.md                     # Build/development help
├── mvnw                        # Maven wrapper (Linux/Mac)
├── mvnw.cmd                    # Maven wrapper (Windows)
├── OAUTH_EMAIL_SETUP.txt       # OAuth configuration guide
└── pom.xml                     # Maven dependencies & plugins
```

### Java Source Code Structure

#### Main Application

```
src/main/java/com/studentsocial/backend/
├── LearnexApplication.java     # Spring Boot main entry point
```

#### Configuration Layer (3 files)

```
config/
├── DotenvEnvironmentPostProcessor.java   # Load .env files
├── SecurityConfig.java                   # Spring Security setup
└── WebMvcConfig.java                     # Web MVC configuration
```

#### Controllers - REST API Endpoints (11 files)

```
controller/
├── AuthController.java         # Authentication endpoints (login, register, etc.)
├── CommentController.java      # Comment CRUD operations
├── ConversationController.java # Messaging conversation endpoints
├── CourseController.java       # Course management endpoints
├── GroupController.java        # Study group management
├── GroupPostController.java    # Group post operations
├── HashtagController.java      # Hashtag search & management
├── MediaController.java        # Media upload/download endpoints
├── NotificationController.java # User notifications
├── PostController.java         # Feed post operations
└── UserController.java         # User profile & management
```

#### DTOs - Request Objects (13 files)

```
dto/request/
├── CourseRequestDto.java
├── CreateCommentRequest.java
├── CreateConversationRequest.java
├── CreatePostRequest.java
├── ForgotPasswordRequest.java
├── LoginRequest.java
├── OAuthRequest.java
├── ReactRequest.java           # Like/reaction request
├── RegisterRequest.java
├── ResetPasswordRequest.java
├── SendMessageRequest.java
├── UpdatePreferenceRequest.java
└── UpdateProfileRequest.java
```

#### DTOs - Response Objects (15 files)

```
dto/response/
├── ApiResponse.java            # Generic API response wrapper
├── AttachmentResponse.java     # File attachment metadata
├── AuthResponse.java           # Authentication response
├── CommentResponse.java
├── ConversationResponse.java
├── CourseRequestResponse.java
├── CourseResponse.java
├── FollowResponse.java
├── MessagePageResponse.java
├── MessageResponse.java
├── NotificationPageResponse.java
├── NotificationResponse.java
├── PostResponse.java
├── ProfileResponse.java
├── ReactionSummaryResponse.java
└── StudyGroupResponse.java
```

#### Exception Handling (4 files)

```
exception/
├── GlobalExceptionHandler.java         # Centralized exception handler
├── ResourceNotFoundException.java      # 404 errors
├── UnauthorizedException.java          # 401 errors
└── ValidationException.java            # 400 validation errors
```

#### Data Models - JPA Entities (70+ classes)

```
model/

User Management (7):
├── User.java                   # Core user entity
├── Profile.java                # User profile details
├── UserRole.java               # User-Role relationship
├── Role.java                   # Roles (Admin, Teacher, Student)
├── Permission.java             # Fine-grained permissions
├── RolePermission.java         # Role-Permission mapping
└── Device.java                 # User device tracking

Authentication & Security (8):
├── OAuthAccount.java           # OAuth provider accounts
├── Oauth.java                  # OAuth configuration
├── RefreshToken.java           # JWT refresh tokens
├── Session.java                # User sessions
├── PasswordReset.java          # Password reset tokens
├── AccountVerification.java    # Email verification
├── Ban.java                    # User bans
└── BlockedUser.java            # User blocking/muting

Academic Structure (6):
├── School.java                 # School/Institution
├── SchoolType.java             # School type enum
├── Faculty.java                # Faculty/Department
├── Department.java             # Academic department
├── Program.java                # Degree program
└── AcademicTerm.java           # Semester/Term

Courses & Enrollment (4):
├── Course.java                 # Course entity
├── CourseRequestEntity.java    # Course enrollment requests
├── ClassSection.java           # Course sections
└── Enrollment.java             # Student enrollment

Posts & Content (14):
├── Post.java                   # Feed posts
├── GroupPost.java              # Study group posts
├── PostAttachment.java         # Post media attachments
├── PostHashtag.java            # Post-Hashtag relationship
├── SavedPost.java              # Bookmarked posts
├── Share.java                  # Post shares
├── Hashtag.java                # Hashtag entity
├── Mention.java                # User mentions in posts
├── Comment.java                # Post comments
├── CommentReaction.java        # Comment likes/reactions
├── PostReaction.java           # Post reactions
├── ReactionType.java           # Reaction types (like, love, etc.)
├── Poll.java                   # Poll questions
└── PollOption.java & PollVote.java # Poll options and votes

Messaging (8):
├── Conversation.java           # Direct message conversations
├── ConversationMember.java     # Conversation participants
├── Message.java                # Messages
├── MessageAttachment.java      # Message attachments
├── MessageReaction.java        # Message reactions
├── ReadReceipt.java            # Message read status
├── PinnedMessage.java          # Pinned messages
└── MessagePageResponse.java    # Pagination response

Social Features (6):
├── Follow.java                 # User follows
├── FriendRequest.java          # Friend requests
├── Connection.java             # User connections
├── MutedUser.java              # Muted users
├── ContentFlag.java            # Content flagging
└── Report.java                 # User/content reports
├── ReportReason.java           # Report reason types

Study Groups (8):
├── StudyGroup.java             # Group entity
├── GroupMember.java            # Group membership
├── GroupRole.java              # Group roles/permissions
├── GroupAnnouncement.java      # Group announcements
├── GroupInvitation.java        # Group invitations
├── GroupJoinRequest.java       # Join requests
├── GroupResource.java          # Group resources/files
└── Document.java              # Shared documents

User Achievements (3):
├── ProfileAchievement.java    # User badges/achievements
├── ProfileEducation.java      # Education history
└── NotificationPreference.java # Notification settings

Content Management (4):
├── MediaFile.java              # Uploaded files
├── ModerationAction.java       # Moderation actions
├── Notification.java           # User notifications
└── SchoolMembership.java       # School membership
```

#### Repositories - Data Access Layer (17 files)

```
repository/

User & Auth Repositories:
├── UserRepository.java                 # User CRUD & queries
├── ProfileRepository.java              # User profile queries
├── UserRoleRepository.java             # User-Role mapping
├── RoleRepository.java                 # Role queries
├── OauthRepository.java                # OAuth account queries
├── NotificationPreferenceRepository.java

Content Repositories:
├── PostRepository.java                 # Post queries (feed, trending)
├── CommentRepository.java              # Comment queries
├── CommentReactionRepository.java      # Comment reaction queries
├── PostReactionRepository.java         # Post reaction queries
├── PostAttachmentRepository.java       # Attachment queries
├── SavedPostRepository.java            # Saved posts queries
├── FollowRepository.java               # Follow/follower queries

Group & Course Repositories:
├── StudyGroupRepository.java           # Study group queries
├── GroupMemberRepository.java          # Group member queries
├── GroupRoleRepository.java            # Group role queries
├── CourseRepository.java               # Course queries
├── CourseRequestRepository.java        # Course request queries

Messaging Repositories:
├── ConversationRepository.java         # Conversation queries
├── ConversationMemberRepository.java   # Conversation member queries
├── MessageRepository.java              # Message queries (pagination, search)

Notification & Media Repositories:
├── NotificationRepository.java         # Notification queries
├── MediaFileRepository.java            # File metadata queries
├── ReactionTypeRepository.java         # Reaction type queries
```

#### Services - Business Logic Layer (9+ files)

```
service/

Core Services:
├── AuthService.java            # Authentication & authorization logic
├── UserService.java            # User management logic
├── PostService.java            # Post operations & feed logic
├── SavedPostService.java       # Saved/bookmark logic

Content Services:
├── CommentService.java         # Comment operations
├── PostReactionService.java    # Reaction/like logic
├── HashtagService.java         # Hashtag operations

Communication Services:
├── NotificationService.java    # Notification generation/delivery
├── MessagingService.java       # Direct messaging logic

Administrative Services:
├── EmailService.java           # Email notifications (OAuth, verification)
├── CourseService.java          # Course management
├── GroupService.java           # Study group operations
```

#### Security Layer (5 files)

```
security/
├── JwtService.java             # JWT token generation & validation
├── JwtFilter.java              # JWT authentication filter
├── JwtAuthenticationFilter.java # Filter configuration
├── CustomerUserDetails.java    # User details implementation
└── CustomerUserDetailsService.java # User details service
```

#### Storage Layer (1 directory)

```
storage/                        # File storage operations
```

### Resources & Configuration

```
src/main/resources/
├── application.properties      # Spring Boot properties (DB, server port, etc.)
├── script.sql                  # Database schema initialization script
├── META-INF/
│   └── spring.factories        # Auto-configuration factories
├── static/                     # Static files (CSS, JS, images)
└── templates/                  # Thymeleaf HTML templates
```

### Test Layer

```
src/test/java/com/studentsocial/backend/
└── BackendApplicationTests.java
```

### Build Output (Generated - Safe to Delete)

```
target/                         # Maven build artifacts
├── classes/                    # Compiled Java classes
├── generated-sources/          # Generated code
├── generated-test-sources/     # Generated test code
├── maven-status/               # Build status info
└── test-classes/               # Compiled test classes
```

---

## FRONTEND - React/Vite Application

### Root Configuration Files

```
frontend/
├── .env.local                  # Frontend environment variables (API URLs, etc.)
├── .gitignore
├── eslint.config.js            # ESLint configuration
├── index.html                  # Main HTML entry point
├── package.json                # NPM dependencies & scripts
├── package-lock.json           # Locked dependency versions
├── vite.config.js              # Vite build configuration
└── README.md                   # Frontend documentation
```

### Public Assets (Static Files)

```
public/                         # Served as-is by Vite
├── favicon.svg
├── favicon1.svg
├── icons.svg                   # SVG icons library
├── manifest.json               # PWA manifest
└── oauth-callback.html         # OAuth redirect page
```

### Source Code Structure

#### Application Root

```
src/
├── main.jsx                    # React entry point (ReactDOM.render)
├── App.jsx                     # Root component
├── index.css                   # Global styles
└── tokens.css                  # Design tokens/CSS variables
```

#### Assets - Media Files

```
assets/                         # Static imports for components
├── hero.png                    # Hero section image
└── vite.svg                    # Vite logo
```

#### Components - Reusable UI Components (1 file)

```
components/
└── Layout.jsx                  # Main app layout wrapper
```

#### Contexts - State Management (1 file)

```
contexts/                       # React Context API
└── AuthContext.jsx             # Authentication state (user, tokens, login/logout)
```

#### Internationalization (i18n) (3 files)

```
i18n/                           # Multi-language support
├── en.json                     # English translations
├── vi.json                     # Vietnamese translations
└── i18n.js                     # i18n configuration & language switcher
```

#### Pages - Route Components (13 files)

```
pages/                          # Full-page components (routed pages)

Authentication:
├── LoginPage.jsx               # Login form & OAuth integration
├── ForgotPasswordPage.jsx      # Password recovery
└── ResetPasswordPage.jsx       # Password reset with token

Social Features:
├── FeedPage.jsx                # Main feed (posts, comments, reactions)
├── ProfilePage.jsx             # User profile & edit profile
├── SearchPage.jsx              # Global search users/posts/hashtags

Posts & Content:
├── PostDetailPage.jsx          # Single post view with comments
├── HashtagPage.jsx             # Posts for specific hashtag
└── SavedPage.jsx               # Saved/bookmarked posts

Messaging & Groups:
├── MessagesPage.jsx            # Direct messages (conversations list & chat)
├── NotificationsPage.jsx       # Notification center
├── GroupsPage.jsx              # Study groups list
└── GroupDetailPage.jsx         # Group details & posts
└── CoursePage.jsx              # Course view & materials
```

#### Services - API Client Layer (10 files)

```
services/                       # Axios HTTP client & API calls

Core Services:
├── api.js                      # Axios instance, interceptors, error handling

Authentication & User:
├── authService.js              # Login, register, logout, OAuth
├── userService.js              # User profile, preferences, follow/block

Content Services:
├── postService.js              # CRUD posts, feed, reactions, likes
├── commentService.js           # Comments, comment reactions
├── hashtagService.js           # Hashtag search & trending

Social Services:
├── groupService.js             # Study groups, members, join/leave
├── courseService.js            # Courses, enrollment

Communication Services:
├── conversationService.js      # Conversations, messages, read receipts
├── notificationService.js      # Notifications, preferences
```

### Build Output (Generated - Safe to Delete)

```
dist/                           # Vite build output
├── index-*.js                  # Bundled JavaScript files
├── index-*.css                 # Bundled CSS files
├── favicon.svg
├── icons.svg
└── oauth-callback.html
```

---

## Project Summary & Statistics

| Layer                      | Component        | Count | Key Responsibilities                                                                             |
| -------------------------- | ---------------- | ----- | ------------------------------------------------------------------------------------------------ |
| **Backend - Controllers**  | REST Endpoints   | 11    | Handle HTTP requests for Auth, Posts, Comments, Groups, Courses, Messaging, Notifications, Media |
| **Backend - Models**       | JPA Entities     | 70+   | User, Post, Comment, Group, Course, Message, Notification, Reaction, Report, OAuth, etc.         |
| **Backend - DTOs**         | Request          | 13    | Login, Register, CreatePost, SendMessage, UpdateProfile, etc.                                    |
| **Backend - DTOs**         | Response         | 15    | ApiResponse, PostResponse, CommentResponse, NotificationResponse, etc.                           |
| **Backend - Repositories** | Data Access      | 17    | User, Post, Comment, Group, Course, Message, Notification, etc.                                  |
| **Backend - Services**     | Business Logic   | 9+    | Auth, User, Post, Comment, Group, Course, Notification, Messaging, Email                         |
| **Backend - Security**     | JWT/Auth         | 5     | JwtService, JwtFilter, UserDetails, Authentication                                               |
| **Backend - Config**       | Spring Config    | 3     | Security, WebMVC, DotenvEnvironment                                                              |
| **Backend - Exception**    | Error Handling   | 4     | GlobalExceptionHandler, ResourceNotFound, Unauthorized, Validation                               |
| **Frontend - Pages**       | Route Components | 13    | Login, Feed, Profile, Groups, Posts, Messages, Notifications, Courses, Search, Hashtags, Saved   |
| **Frontend - Services**    | API Clients      | 10    | Auth, User, Post, Comment, Group, Course, Conversation, Notification, Hashtag                    |
| **Frontend - i18n**        | Translations     | 2     | English (en.json), Vietnamese (vi.json)                                                          |
| **Frontend - Assets**      | Media & Icons    | 4     | Hero image, Vite logo, SVG icons, PWA manifest                                                   |
| **Database**               | Schema Script    | 1     | script.sql (70+ tables for all entities)                                                         |

### Technology Stack

```
Backend:
- Spring Boot 3.x
- Spring Security + JWT
- Spring Data JPA + Hibernate
- Database: PostgreSQL/MySQL (via JPA)
- OAuth 2.0 (Google, Facebook, etc.)
- Email: SMTP integration
- File Storage: Local disk or cloud

Frontend:
- React 18.x
- Vite (build tool)
- Axios (HTTP client)
- Context API (state management)
- i18n (internationalization)
- CSS (custom & design tokens)
- ESLint (code quality)

Deployment:
- Maven (backend build)
- NPM (frontend build)
- Docker ready (if Dockerfile exists)
```

### Key Features

```
Core Social Features:
✓ User authentication (email + OAuth)
✓ Social feed with posts, comments, reactions
✓ Direct messaging & conversations
✓ User profiles & follow system
✓ Notifications (in-app & email)

Academic Features:
✓ Study groups & group posts
✓ Course management & enrollment
✓ Schools/Faculties/Programs structure
✓ Academic terms/semesters
✓ Student enrollment tracking

Content Management:
✓ Hashtag search & trending
✓ Post saving/bookmarking
✓ Media uploads & attachments
✓ Content flagging & reporting

Community & Moderation:
✓ User bans & blocking
✓ Friend requests
✓ User connections
✓ Moderation actions
✓ Role-based permissions

Communication:
✓ Real-time messaging
✓ Conversation read receipts
✓ Message reactions
✓ Group announcements
✓ Pinned messages
```

---

## UPLOADS - User Generated Content

```
uploads/                        # Directory for user-uploaded files (7 files)
├── 3873eb47-8d9d-433b-97e3-19e03e1ecbe6.png
├── 4772b109-706a-4b18-b18f-35abd21f3f4f.png
├── 589b610c-7b84-422e-ae07-a17169f48a61.png
├── a318059e-bebe-4ce2-a92e-63a3231829ed.png
├── b19fa057-a4ce-4eed-aad7-0b68fa1ece21.png
├── b9e68558-f417-4523-82e1-04286a20a1f4f.jpg
└── c617f3f4-cb2b-4bc9-938c-8bfa162eb561.png

Note: Files are stored with UUID filenames for privacy/organization
```

---

## ITEMS TO DELETE (Cleanup Guide)

### IDE & Build Artifacts - SAFE TO DELETE

```
.idea/                          # IntelliJ IDEA metadata
├── compiler.xml
├── dataSources/
├── dataSources.local.xml
├── dataSources.xml
├── data_sources_history.xml
├── encodings.xml
├── jarRepositories.xml
├── misc.xml
├── sqldialects.xml
├── uiDesigner.xml
├── vcs.xml
└── workspace.xml

backend.iml                     # IntelliJ project file
.vscode/                        # VS Code workspace (optional)
```

**Regenerate:** Auto-generated when you open project in IDE

---

### Build Outputs - SAFE TO DELETE

```
backend/target/                 # Maven build artifacts
├── classes/
├── generated-sources/
├── generated-test-sources/
├── maven-status/
└── test-classes/

frontend/dist/                  # Vite build output
├── index-*.js
├── index-*.css
└── other assets
```

**Regenerate:**

- Backend: `mvn clean compile` or `mvn clean install`
- Frontend: `npm run build`

---

### Sensitive Files - DO NOT COMMIT

```
backend/.env                    # Contains: DB credentials, JWT secret, OAuth keys, email password
frontend/.env.local             # Contains: API URLs, debug flags
```

**Alternative:** Create `.env.example` files in git with placeholders for team reference

---

### Clean Commands

```bash
# Clean Maven build
cd backend
mvn clean

# Clean Node modules & reinstall
cd frontend
rm -rf node_modules dist package-lock.json
npm install

# Delete IDE files
rm -rf .idea backend.iml .vscode

# Rebuild everything
mvn clean install
cd ../frontend && npm run build
```

---

## Quick Reference: What's Important vs What's Temporary

| Item             | Type     | Location                                   | Important? | Safe to Delete? |
| ---------------- | -------- | ------------------------------------------ | ---------- | --------------- |
| Source Code      | Java/JSX | `backend/src/main`, `frontend/src`         | ✅ YES     | ❌ NO           |
| Database Schema  | SQL      | `backend/src/main/resources/script.sql`    | ✅ YES     | ❌ NO           |
| Dependencies     | Config   | `backend/pom.xml`, `frontend/package.json` | ✅ YES     | ❌ NO           |
| Compiled Classes | Build    | `backend/target/classes`                   | ❌ NO      | ✅ YES          |
| Bundled Frontend | Build    | `frontend/dist/`                           | ❌ NO      | ✅ YES          |
| IDE Settings     | Config   | `.idea/`, `.vscode/`, `*.iml`              | ❌ NO      | ✅ YES          |
| Environment Vars | Secret   | `.env`, `.env.local`                       | ✅ YES     | ⚠️ Don't commit |
| User Uploads     | Data     | `uploads/`                                 | ✅ YES     | ❌ NO           |
| Git Config       | Config   | `.git/`, `.gitignore`                      | ✅ YES     | ❌ NO           |
