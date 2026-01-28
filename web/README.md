# LMS Pro

## Getting Started

1. **Environment Setup:**
   Copy `.env.local.example` to `.env.local` and fill in the required keys.

   - **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - **Polar:** `POLAR_SANDBOX_TOKEN` (for payments & license keys)
   - **Zoom:** `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` (from Marketplace -> Meeting SDK App)
   - **Acumbamail:** Tokens for email service.

2. **Install Dependencies:**

   ```bash
   npm install
   ```

   *Note: If you encounter peer dependency warnings for `@zoomus/websdk`, you can ignore them or use `--legacy-peer-deps`.*

3. **Run Development Server:**

   ```bash
   npm run dev
   ```

## Features

- **Course Player:** Video (Mux/Vimeo) + Live Class (Zoom Integrated)
- **Gamification:** XP, Levels, Leaderboard, Gems
- **Payments:** Polar.sh Integration (Subscriptions & One-time)
- **License Gating:** Restrict content access based on Polar License Keys.

## Zoom Integration

To enable Live Classes:

1. Create a **Meeting SDK** app in [Zoom Marketplace](https://marketplace.zoom.us/).
2. Add credentials to `.env.local`.
3. In `courses > lessons`, set `type` to `live_class`.
4. Set `video_url` to the **Meeting ID**.
5. Set `content_json` to `{"passcode": "123456"}`.

## Testing

Run E2E tests:

```bash
npx playwright test
```
