# Integrations & Automations

**1. Polar.sh (Financials):**

- **Role:** Handles payments, subscriptions, tax.
- **Sync:** Webhooks (`order.created`, `subscription.created`) -> Supabase API.
- **Data:** Stores in `orders` table. Updates `enrollments` status.
- **Fields:** `polar_order_id`, `polar_subscription_id`.
- **Fields:** `polar_order_id`, `polar_subscription_id`.
- **Dev Webhook URL:** `https://kent-lms-pro-dev.loca.lt/api/webhooks/polar` (Localtunnel - Stable Subdomain)

**2. Notifications:**

- **Type:** Internal / In-App.
- **Trigger:** System events (XP gain, Certificate, Enrollment).
- **Table:** `notifications` (is_read bool).
- **Settings:** Controlled by `user_settings` (email/push flags).

**3. Storage (Supabase):**

- **Buckets:** `course-assets`.
- **Access:** Signed URLs generated via API `getSignedAssetUrl`.

**4. Automation Triggers (DB Level):**

- `handle_new_user`: Auth signup -> Create Profile + Settings.
- `calculate_course_progress`: Lesson completion -> Update Summary.
- `update_user_streak`: Activity -> Maintain Streak.
