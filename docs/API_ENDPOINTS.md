# API Endpoints & Service Layer

This document serves as the reference for the application's API layer.
Since the application uses a **Serverless Architecture** with **Supabase**, there are no traditional REST API endpoints (e.g., `GET /api/courses`).

Instead, the "API" is exposed through typed **Service Classes** in the frontend, which interact directly with the Supabase Database via the Client SDK. Security is enforced via **Row Level Security (RLS)** policies on the database tables.

---

## Service Catalog

### 1. Asset Service

Handles file storage interactions for course assets and media.

* **Base Table/Bucket:** `storage.objects` (Bucket: `course-assets`)

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getSignedUrl(path, expiresIn)` | `createSignedUrl` | Private | Generates a time-limited URL for private assets. |
| `getPublicUrl(path)` | `getPublicUrl` | Public | Gets the public URL for publicly accessible assets (e.g. covers). |
| `getCourseAssets(courseId)` | `list()` | Connected | Lists all assets in a course folder. |

### 2. Certificate Service

Manages course completion certificates.

* **Base Table:** `certificates`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getMyCertificates(userId)` | `SELECT *` | Owner | Lists certificates belonging to the user. |
| `verifyCertificate(credentialId)` | `SELECT single` | Public | Publicly verifies a certificate ID and returns details. |

### 3. Course Service

Core functionality for course management and discovery.

* **Base Table:** `courses`, `enrollments`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getPublicCourses()` | `SELECT *` | Public | Fetches all courses with `status='published'` and `visibility='public'`. |
| `enrollUser(userId, courseId)` | `INSERT enrollments` | Admin/System | Enrolls a user in a course. |
| `checkAccess(userId, courseId)` | `SELECT enrollments` | Middleware | Checks if a user has an active enrollment. |
| `getCourseStructure(courseId)` | `SELECT * (Reset)` | Enrolled | Fetches full course hierarchy (Modules -> Lessons) for the player. |
| `createCourse(courseData)` | `INSERT courses` | Admin | Creates a new course draft. |
| `searchCourses(query)` | `SELECT * (ILIKE)` | Public | Searches courses by title or description. |

### 4. Gamification Service

Handles user experience points (XP), streaks, and leaderboards.

* **Base Table:** `weekly_leaderboard`, `profiles`, `user_streaks`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getLeaderboard(limit)` | `SELECT weekly_leaderboard` | Public | Fetches top users by weekly XP. |
| `getUserStats(userId)` | `SELECT profiles` | Owner | Gets user's XP, Gems, Level, and Streak status. |

### 5. Instructor Service

Manages course instructors and their roles.

* **Base Table:** `course_instructors`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getInstructors(courseId)` | `SELECT *` | Public | Lists instructors for a specific course. |
| `addInstructor(courseId, userId)` | `INSERT` | Admin | Assigns a user as an instructor/editor. |
| `removeInstructor(courseId, userId)` | `DELETE` | Admin | Removes an instructor from a course. |

### 6. Lesson Service

Manages lesson metadata and content.

* **Base Table:** `lessons`, `lesson_contents`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getLesson(slug)` | `SELECT lessons` | Public | Gets lesson metadata (title, type, etc.). |
| `getLessonContent(lessonId)` | `SELECT lesson_contents` | Enrolled | Fetches the actual markdown/video content (RLS protected). |
| `createLesson(lessonData)` | `INSERT lessons` | Admin | Creates a new lesson entry. |
| `updateLessonContent(...)` | `INSERT lesson_contents` | Admin | Creates a new version of the lesson content (Versioning). |

### 7. Module Service

Manages course modules (sections).

* **Base Table:** `modules`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getModules(courseId)` | `SELECT *` | Public/Enrolled | Lists modules for a course. |
| `createModule(moduleData)` | `INSERT` | Admin | Creates a new module. |
| `updateModule(moduleId, ...)` | `UPDATE` | Admin | Updates module details. |
| `deleteModule(moduleId)` | `DELETE` | Admin | Deletes a module. |

### 8. Notification Service

User notification system.

* **Base Table:** `notifications`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getUnread(userId)` | `SELECT *` | Owner | Fetches unread notifications. |
| `markAsRead(notificationId)` | `UPDATE` | Owner | Marks a specific notification as read. |
| `markAllAsRead(userId)` | `UPDATE` | Owner | Marks all user notifications as read. |

### 9. Order Service

Handles purchase history (Payment processing is likely handled simply or externally).

* **Base Table:** `orders`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getMyOrders(userId)` | `SELECT *` | Owner | Lists user's purchase history. |

### 10. Profile Service

User profile management.

* **Base Table:** `profiles`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getMyProfile(userId)` | `SELECT single` | Owner | Fetches full profile details. |
| `updateProfile(userId, ...)` | `UPDATE` | Owner | Updates profile (avatar, name). |
| `getPublicProfile(userId)` | `SELECT partial` | Public | Fetches public profile info (name, avatar, level). |

### 11. Progress Service

Tracks user progress through lessons.

* **Base Table:** `lesson_progress`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `completeLesson(...)` | `UPSERT` | Enrolled | Marks a lesson as 'completed'. Triggers XP award. |
| `updateWatchTime(...)` | `UPSERT` | Enrolled | Updates 'last_position_seconds' for video resume. |

### 12. Settings Service

User preference settings.

* **Base Table:** `user_settings`

| Method | Operation | Access | Description |
| :--- | :--- | :--- | :--- |
| `getSettings(userId)` | `SELECT single` | Owner | Fetches user preferences (notifications, etc.). |
| `updateSettings(userId, ...)` | `UPDATE` | Owner | Updates user preferences. |
