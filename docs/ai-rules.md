# AI Rules & Guidelines

These rules are mandatory for any AI assistant working on this project. Failure to follow them leads to technical debt and context loss.

## 1. Documentation is Code (The Golden Rule)

- **Rule:** Every time a new feature, table, API, or logic is implemented, the corresponding file in `docs/` MUST be updated immediately.
- **Trigger:** If you touch `schema.sql` -> Update `docs/schema_overview.md`.
- **Trigger:** If you change access rules -> Update `docs/rls_policies.md`.
- **Why:** Documentation is not an afterthought; it is the "Context Save Point" for the next AI.

## 2. Tech Stack Consistency

- **Backend:** Supabase (Auth, DB, Storage, Edge Functions). NO custom Express/Node servers.
- **Frontend:** Next.js (App Router), Tailwind CSS, Lucide React.
- **State:** React Query (Server State), Zustand (Client State).
- **Styling:** Use standard Tailwind utilities. Avoid CSS-in-JS complexities.

## 3. Database Integrity & Safety

- **Migrations:** Always use `IF NOT EXISTS` logic. Migrations must be idempotent.
- **Destructive Actions:** NEVER execute `DROP TABLE` or `DELETE FROM` without explicit, triple-confirmed user permission.
- **Security:** RLS (Row Level Security) must be enabled on ALL new tables by default. NO exceptions.

## 4. Coding Standards (TypeScript)

- **Strict Mode:** No `any`. Use properly defined interfaces/types (generated from DB).
- **Comments:** Comment the *Why*, not the *What*. Explain business logic, not syntax.
- **Filenames:** Use kebab-case for files (`user-settings.tsx`) and PascalCase for components (`UserSettings.tsx`).

## 5. UI/UX Principles (Premium Feel)

- **Design:** Aim for "Thinkific Enhanced" aesthetics. Dark Mode, Glassmorphism, subtle gradients.
- **Feedback:** Every user interaction (Save, Update, Upload) MUST have visual feedback (Loading spinners, Toasts).
- **Mobile First:** All interfaces must be fully responsive.

## 6. Live Task Tracking (tasks.md)

- **Rule:** The file `tasks.md` in the root directory is the living heartbeat of the project.
- **Trigger:** When starting a task -> Mark as `[/]` (in progress).
- **Trigger:** When finishing a task -> Mark as `[x]` (done).
- **Enforcement:** Never finish a turn without updating this file if progress was made.

## 7. Proactive Refactoring (Anti-Rot)

- **Rule:** Do not let code rot. If a file grows too large (>200 lines) or logic gets messy, you MUST proactively refactor it.
- **Trigger:** Identifying duplicated code blocks, deeply nested conditionals, or "God Components".
- **Action:** Split big components into smaller sub-components or custom hooks. Do this *before* asked, or atleast suggest it immediately.
- **Context:** If the conversation gets long, check if previous code needs cleanup.

## 8. Atomic Commits

- **Guideline:** Don't try to build the entire app in one prompt. Break it down into testable chunks.

## 9. Magic Command: "run next task"

- **Trigger:** When user says "run next task".
- **Protocol:**
  1. **Read:** Open `tasks.md` and find the first unchecked item (`[ ]`).
  2. **Update:** Mark it as `[/]` (In Progress) and save the file.
  3. **Execute:** Perform the necessary coding/actions for that specific task.
  4. **Finish:** Mark it as `[x]` (Done) in `tasks.md` and save.
  5. **Report:** Notify user that the specific task is complete.

## 10. Test Playwright

- **1:**  Do not ask me. Test with Playwright Find problem and fix it.
- **2:**  Playwright test komutundan önce build komutunu çalıştır ve sonra 8 worker ile testleri yap. (Latest Run: 9 passed, 6 failed - Fix in progress)

## 11. Dökümantasyon Kuralı

- **Yeni özellik eklemeden ÖNCE** `features-documentation.md` dosyasını oku
- Bu dosyadaki çalışan özelliklere DOKUNMA
- Eğer bir özelliği değiştirmen gerekiyorsa, ÖNCE bana danış
- Yeni özellik çalışır duruma geldiğinde, `features-documentation.md`'ye ekle

```

## Kullanım Önerisi

Her yeni özellik eklemeden önce AI'a şöyle deyin:
```

"features-documentation.md dosyasını oku ve mevcut özelliklere
zarar vermeden [yeni özellik] ekle"
