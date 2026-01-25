# Automated Service Verification Scenarios

This document outlines the end-to-end scenarios used to verify the backend API services (Service Layer) and Database Integrity without relying on the UI.

## 🧪 Test Environment Strategy

- **Runner:** Node.js Script (`scripts/verify-scenarios.ts`)
- **User Mode:** Real Database Interactions (using Supabase Client)
- **Cleanup:** Test data should be isolated or cleaned up (via specific generated IDs).

---

## 📜 Scenario 1: The "New Student" Journey (Onboarding)

**Goal:** Verify Auth, Profile creation, and Initial Settings.

- [x] **Action:** Sign Up a new random user (`test_student_[timestamp]@example.com`).
- [x] **Verify:** Auth user exists.
- [x] **Verify:** `ProfileService.getMyProfile()` returns the profile created by triggers.
- [x] **Action:** `ProfileService.updateProfile()` -> Change name to "Test Student".
- [x] **Verify:** Name update persisted.
- [x] **Action:** `SettingsService.updateSettings()` -> Turn off marketing emails.
- [x] **Verify:** Settings updated.

## 📜 Scenario 2: The "Avid Learner" Journey (Course & Progress)

**Goal:** Verify Course fetching, Enrollment, and Lesson Tracking.

- [x] **Action:** `CourseService.getPublicCourses()` -> Fetch list.
- [x] **Action:** Enroll in the first available course via `CourseService.enrollInCourse()`.
- [x] **Verify:** `CourseService.getUserEnrollments()` contains the new course.
- [x] **Action:** Fetch course structure (`getCourseStructure`).
- [x] **Action:** `ProgressService.completeLesson()` -> Mark 1st lesson as done.
- [x] **Verify:**
  - `ProgressService.getCourseProgress()` shows > 0%.
  - `lesson_progress` table has a completed record.

## 📜 Scenario 3: The "Gamer" Loop (Gamification)

**Goal:** Verify XP calculation, Streaks, and Leaderboard updates.

- [x] **Pre-requisite:** User from Scenario 2 has completed a lesson.
- [x] **Verify:** `GamificationService.getUserStats()`:
  - XP should be > 0 (Triggered by lesson completion).
  - Streak should be at least 1 (if logic handles "today").
- [x] **Action:** `GamificationService.getLeaderboard()`.
- [x] **Verify:** User appears in the weekly leaderboard list.
- [x] **Action:** `GamificationService.checkAchievements()` (if implemented) or verify XP Popup trigger logic compatibility.

## 📜 Scenario 4: The "Instructor" Flow (Permissions)

**Goal:** Verify RBAC (Role Based Access) and Content Management limits.

- [x] **Action:** Attempt to `InstructorService.addInstructor()` using the Student account.
- [x] **Verify:** Should **THROW ERROR** (RLS Policy Rejection).
- [x] **Action:** Fetch `InstructorService.getInstructors()` for a public course.
- [x] **Verify:** Should return list successfully (Read Public, Write Private).

---

## 📜 Scenario 5: "The Graduate" (Certificates)

**Goal:** Verify certificate issuance and retrieval upon course completion.

- [x] **Test:** `CertificateService.getMyCertificates(userId)` (Verified in `test-advanced-features.ts`).
- [x] **Verify:** Returns array (empty or populated).

## 📜 Scenario 6: "The Resource Hunter" (Assets)

**Goal:** Verify access to course materials.

- [x] **Test:** `AssetService.getCourseAssets(courseId)` (Verified in `test-advanced-features.ts`).
- [x] **Verify:** Returns assets for a specific course (Validated with course `Test Automation Course`).
- [x] **Verify:** Private vs Public URL generation.

## 📜 Scenario 7: "The Informed Student" (Notifications)

**Goal:** Verify system notifications and read status.

- [x] **Test:** `NotificationService.getUnread(userId)` (Verified in `test-advanced-features.ts`).
- [x] **Test:** `NotificationService.markAsRead(notificationId)`.
- [x] **Verify:** Data retrieval and update operations work.

## 📜 Scenario 8: "The Shopper" (Order History)

**Goal:** Verify purchase records and invoice retrieval.

- [x] **Test:** `OrderService.getMyOrders(userId)` (Verified in `test-advanced-features.ts`).
- [x] **Test:** `OrderService.getMyOrders(userId)` (Verified in `test-advanced-features.ts`).
- [x] **Verify:** Returns order history list.

### Scenario 9: "The Deep Dive" (Lesson Content & Gating)

- [x] Create a course with modules and lessons (Admin/Instructor only).
- [x] Verify that `Lesson service` retrieves lesson metadata.
- [x] **Negative Test**: Verify that a user *not enrolled* cannot access protected lesson content.
- [x] **Positive Test**: Verify that an *enrolled* user can access the content.
- **Verification Script**: `scripts/test-lesson-gating.ts`
- **Result**: ✅ Verified. RLS policies enforce `is_free_preview` or `enrollment` check.

### Scenario 10: Search & Filtering

- [x] Verify searching for courses by title or description.
- [x] Verify filtering by category (mocked or actual if schema supports).
- **Verification Script**: `scripts/test-search-filter.ts`
- **Result**: ✅ Verified. `CourseService.searchCourses` uses `ilike` and respects visibility.

### Scenario 11: Admin Content Creation

- [x] Verify that an Admin user can create a Course.
- [x] Verify that an Admin user can create a Module.
- [x] Verify that an Admin user can create a Lesson and add Content.
- **Verification Script**: `scripts/test-admin-content.ts`
- **Result**: ✅ Verified. New RLS policies added for Admin/Instructor write access.

### Scenario 12: Security Checks (Negative Testing)

- [x] Verify that a Student *cannot* update course details.
- [x] Verify that a Student *cannot* delete another user's enrollment.
- [x] Verify that Row Level Security (RLS) policies prevent unauthorized data modification.
- **Verification Script**: `scripts/test-security.ts`
- **Result**: ✅ Verified. RLS successfully blocks unauthorized UPDATE and DELETE.

### Scenario 13: "The Watcher" (Video Embedding)

- [x] Verify Admin can create a lesson of type 'video'.
- [x] Verify Vimeo URL/Metadata can be stored in `content_json` (Protected).
- [x] Verify retrieval of video metadata by enrolled user/admin.
- **Verification Script**: `scripts/test-video-embed.ts`
- **Result**: ✅ Verified. Vimeo ID stored and retrieved correctly.

### Scenario 14: "The Buyer" (Order Lifecycle)

- [x] **Action:** Simulate an Order Creation (e.g. via mock endpoint or direct DB insert simulating payment success).
- [x] **Verify:** `OrderService.getMyOrders()` returns the new order with status `paid`.
- [x] **Verify:** (Bonus) If the order is for a course, verify Enrollment is **automatically created** or updated.
- **Verification Script**: `scripts/test-orders.ts`
- **Result**: ✅ Verified. Explicit `service_role` policy added to enable webhook simulation.

### Scenario 15: "Honorable Discharge" (Certificate Trigger)

- [x] **Action:** Catch a user with 99% progress.
- [x] **Action:** `ProgressService.completeLesson()` -> Pushing them to 100%.
- [x] **Verify:** `CertificateService.getMyCertificates()` returns a new certificate.
- [x] **Verify:** Notification table receives a "You graduated!" message.
- **Verification Script**: `scripts/test-certificates.ts`
- **Result**: ✅ Verified. Trigger function updated to `SECURITY DEFINER` to bypass RLS.

### Scenario 16: "The Daily Grind" (Streak & XP Logic)

- [x] **Action:** Manually insert an activity for "yesterday" (simulating a 1-day streak).
- [x] **Action:** Trigger a new XP event for "today".
- [x] **Verify:** Streak increments to 2.
- [x] **Action:** Simulate a 2-day gap (activity 3 days ago).
- [x] **Action:** Trigger XP event.
- [x] **Verify:** Streak resets to 1.
- **Verification Script**: `scripts/test-streaks.ts`
- **Result**: ✅ Verified. Confirmed `lesson_completion` action increments and resets streak correctly.

---

## ✅ Success Criteria

- All API calls must return data or expected errors.
- No "500 Internal Server Errors".
- RLS policies must correctly block unauthorized actions in Scenario 4.
- All "Verify" steps must pass assertions (e.g., count > 0, status === 'completed').
