# RLS (Security Policies)

**Access Layers:**

1.  **Anonymous / Public:**
    -   Can view `courses` where `status='published'` AND `visibility='public'`.
    -   Can view `profiles` (public info).

2.  **Authenticated (Login):**
    -   Can view `lessons` (titles only) for published courses.
    -   **Free Preview:** Can view `lesson_contents` IF `lesson.is_free_preview = true`.

3.  **Enrolled Student:**
    -   Must have active record in `enrollments`.
    -   Can view ALL `lesson_contents` for that course.
    -   Can manage own `lesson_progress`, `user_streaks`, `user_settings`, `notifications`.

4.  **Instructor / Admin:**
    -   Instructor: Can edit courses where they are in `course_instructors`.
    -   Admin: Full access to all tables.

**Critical Rules:**
-   **Draft Content:** Invisible to students/public.
-   **Certificates:** Generally public (verification).
-   **Orders:** Private to owner.
