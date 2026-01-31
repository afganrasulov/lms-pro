# Database Schema Overview

**Core Tables:**

- `profiles` (Auth link, Role: admin/instructor/student, XP, Level, Gems)
- `courses` (Title, Slug, Subtitle, Level, Category, Status: draft/published, Visibility: public/private)
- `modules` (Course grouping, Position)
- `lessons` (Content metadata, Slug, Type: video/live_class/quiz, Free Preview, **chapter_id**)
- `lesson_contents` (Markdown/JSON body, Versioned)
- `lesson_assets` (Video/File metadata, Providers: Mux/Vimeo)
- `enrollments` (User-Course link, Polar Order ID, Status)
- `course_instructors` (Team access management)

**Gamification & Features:**

- `xp_transactions` (Ledger for XP history - previously xp_logs)
- `user_streaks` (Daily activity tracking)
- `user_settings` (Notification prefs)
- `orders` (Polar.sh financial records)
- `certificates` (Issued on 100% completion)
- `notifications` (In-app alerts)
- `course_progress_summary` (Aggregated progress stats)

**Enums:**

- `user_role`: admin, instructor, student
- `content_status`: draft, published, archived
- `lesson_type`: video, text, quiz, assignment, live_class
