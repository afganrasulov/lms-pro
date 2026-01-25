# Gamification Mechanics

**XP System (Experience Points):**

- **Source:** `lesson_progress` triggers `xp_transactions`.
- **Values:** Video (50), Live Class (100), Quiz (75), Assignment (200).
- **Level:** Calculated as `(Total XP / 1000) + 1`.

**Duolingo Model:**

- **Streaks:**
  - Tracked in `user_streaks`.
  - Logic: Activity today extends streak. Missed day resets to 0.
  - Trigger: `update_user_streak()` on `lesson_completion`.
- **Gems:**
  - Currency stored in `profiles.gems`.
  - Earned separate from XP (future logic).
  - Used for marketplace/rewards.
- **Leaderboard:**
  - `weekly_leaderboard` VIEW.
  - Ranks by XP earned in last 7 days.

**Certificates:**

- **Trigger:** `course_progress_summary.progress_percent` reaches 100.00.
- **Action:** Creates `certificates` record + Notification.
