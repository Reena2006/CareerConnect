# TESTING — CareerConnect

Everything below was executed against a running instance of this project. Features are only
listed as *passing* where they were actually run.

**Test environment (27 October 2026)**

| Item | Value |
|---|---|
| OS | Windows 11 (VS Code terminal / Git Bash) |
| Node.js | v22.23.4 (portable copy in `.runtime/`) |
| npm | 10.9.9 |
| Database | In-memory MongoDB (`mongodb-memory-server`) via `npm run dev:memory` |
| API | http://localhost:5000 |
| Front end | http://localhost:5173 (Vite dev server) |
| Browser | Chromium 141 (desktop viewport 1440×900) |

---

## 1. Automated API tests (repeatable)

```powershell
# terminal 1
cd server
npm install
npm run dev:memory     # or: npm run dev  (with a real MongoDB)

# terminal 2
cd server
npm test
```

Runner: Node's built-in `node:test` (no extra test dependency) — file: `server/test/api.test.js`.

**Result: 28 of 28 passed, 0 failed.**

| # | Test | What it proves |
|---|---|---|
| 1 | health endpoint reports ok | API is up |
| 2 | register rejects an invalid email | server-side email validation (400) |
| 3 | register rejects a weak password | password policy (400) |
| 4 | register creates a student and returns a JWT | student registration + JWT issued |
| 5 | registering the same email twice → 409 | unique email constraint |
| 6 | login with wrong password → 401 | bcrypt comparison |
| 7 | login with correct credentials → JWT | login flow |
| 8 | `/auth/me` requires a token | 401 without token; `passwordHash` never returned |
| 9 | admin can log in | seeded admin account |
| 10 | jobs list readable without a token | public read |
| 11 | create job without token → 401 | authentication required |
| 12 | student creates job → 403 | **role-based access** |
| 13 | admin creates a job → 201 | CRUD create |
| 14 | admin updates a job → 200 | CRUD update |
| 15 | search matches text, survives `(` | search + regex-escaping fix |
| 16 | type filter returns only that type | job filtering |
| 17 | job with missing fields → 400 | server validation |
| 18 | student applies with resume (multipart) | file upload, `Pending` status |
| 19 | applying twice → 409 | unique (student, job) index |
| 20 | apply without token → 401 | protected route |
| 21 | student reads own history | populated job reference |
| 22 | student reads admin list → 403 | **role-based access** |
| 23 | admin reads all applications | admin review data |
| 24 | student changes status → 403 | **role-based access** |
| 25 | admin changes status → 200 | application management |
| 26 | admin downloads resume | uploaded file served with correct content |
| 27 | own resume 200 / stranger 403 | **resume ownership check** |
| 28 | invalid status → 400, deleted job → 404 | validation + delete |

> The test suite creates its own student accounts (`student<timestamp>@test.local`) and its own
> job, so it is safe to run repeatedly.

---

## 2. Front-end build

```powershell
cd client
npm run build
```

**Result: passes** — `✓ 44 modules transformed`, output in `client/dist/` (git-ignored).
This is what catches JSX/syntax errors, e.g. the broken `<Auth …/ >` tag that existed before.

---

## 3. Manual browser tests (actually performed)

| # | Flow | Steps | Result |
|---|---|---|---|
| 1 | App loads | Open `http://localhost:5173/` | ✅ Auth screen at `#/login`, correct `<title>`, no console errors |
| 2 | Empty login validation | Click **Log in** with empty fields | ✅ Inline "Email is required." / "Password is required." |
| 3 | Weak password validation | Register with `abc` | ✅ "Use at least 8 characters with a letter and a number." — request is **not** sent |
| 4 | Student registration | Register a full account | ✅ Redirects to dashboard, welcome toast, student-only sidebar |
| 5 | Role-based UI | Compare student vs admin sidebars | ✅ Students never see "Manage/Review applications" |
| 6 | Job list | Admin creates a job, student refreshes | ✅ Card with company, location, type badge, skill chips |
| 7 | Search & filter | Set filter to `Part-time` → `All types` | ✅ List refetches (0 → 1 results), search box filters server-side |
| 8 | View details | Click **View details** | ✅ Description + deadline toggle |
| 9 | Apply modal — validation | Submit cover letter `ok` | ✅ Inline error "Cover letter must be at least 20 characters…" |
| 10 | Apply modal — submit | Valid cover letter, no file | ✅ `POST /api/applications/:id → 201`, modal closes, button becomes **Applied** (disabled) |
| 11 | Application history | Open **My applications** | ✅ Table row: title, company, type, date, `Pending` |
| 12 | Route guard | Student opens `#/admin/applications` | ✅ **403 — Access denied** panel with a back link |
| 13 | Admin login | Log in as `admin@careerconnect.local` | ✅ Admin navigation, no "My applications" link |
| 14 | Job form validation | Save an empty job form | ✅ 4 inline errors (title, company, location, description) |
| 15 | Job CRUD — create | Fill and save the job form | ✅ Job appears, count updates, form closes |
| 16 | Job CRUD — delete | Delete a job (confirmation dialog) | ✅ Success toast "Opportunity deleted.", card removed |
| 17 | Toast messages | After each success action | ✅ Renders as `cc-toast success` bottom-right, auto-hides after 4 s |
| 18 | Admin review page | Open **Review applications** | ✅ Stats cards (Pending/Shortlisted/Selected/Rejected), student name+email+department, cover letter excerpt, resume download |
| 19 | Status change | Set an application to `Shortlisted` | ✅ Toast "Application status updated.", select keeps the value, counters update (0 Pending / 2 Shortlisted) |
| 20 | Responsive layout | Viewport 1440×900 → 390×780 | ✅ At 390px the sidebar becomes an off-canvas drawer, the hamburger appears, job grid = 1 column, stat grid = 2 columns, `scrollWidth` 374px stays inside the viewport (no horizontal scrolling) |
| 21 | Error handling | Stop the API / invalid token | ✅ Network failure shows "Cannot reach the API…"; a 401 clears the session and returns to the login screen |
| 22 | jQuery page removed | Reload the app after deleting the demo page | ✅ No broken sidebar/hero links, no console errors, `vite build` passes |

---

## 4. UI redesign regression pass — 27 October 2026

Every row below was executed in Chromium against the running app after the visual redesign.

| # | Check | Result |
|---|---|---|
| 1 | `npm run build` (production) | ✅ 46 modules, CSS 19.78 kB, JS 221.89 kB, no errors |
| 2 | `npm test` (API suite) | ✅ 28/28 pass — backend unchanged by the redesign |
| 3 | Fresh page load, console | ✅ Only Vite/React-DevTools debug lines — **no errors or warnings** |
| 4 | Auth — empty submit | ✅ Banner “Please fix the highlighted fields…”, 2 inline errors, `.is-invalid` styling |
| 5 | Auth — password visibility | ✅ `type` password→text, `aria-pressed` false→true, label Show→Hide |
| 6 | Student login | ✅ “Welcome back, Aarav”, student-only nav with active state, avatar + role chip |
| 7 | Student stats (real API data) | ✅ Open roles 1, My applications 0 → after applying: 1 and “In review” 1 |
| 8 | Search + empty state | ✅ Keyword with no match → “No opportunities match your search” + **Clear filters** restores the list |
| 9 | Apply — cover letter validation | ✅ “Cover letter must be at least 20 characters…” shown inline, modal stayed open |
| 10 | Apply — submission | ✅ `POST /applications → 201`, modal closed, toast “Application submitted successfully.”, button became **Applied** (disabled) |
| 11 | My applications | ✅ 5 columns, `.badge pending`, real counters (Applications 1 / In review 1) |
| 12 | Role guard | ✅ Student opening `#/admin/applications` → “403 — Access denied” card |
| 13 | Admin job form — empty submit | ✅ 4 inline errors (title, company, location, description) |
| 14 | Admin job create | ✅ Toast “Opportunity published.”, card added, stat cards updated (Opportunities 2) |
| 15 | Admin job edit | ✅ Header switched to “Edit opportunity”, form pre-filled, toast “Opportunity updated.”, location changed on the card |
| 16 | Admin job delete | ✅ **Custom ConfirmDialog** (aria-modal, Cancel/Delete, job name in the message); a `window.confirm` spy proved the browser dialog was **not** called; confirming removed the card + toast “Opportunity deleted.” |
| 17 | Admin application review | ✅ 7 columns, 6 rows, real stats (Total 6 / Pending 2 / Shortlisted 4), 3 resume download buttons |
| 18 | Status change | ✅ Pending → Shortlisted, toast “Application status updated.”, counters updated (Pending 1 / Shortlisted 5), control re-enabled |
| 19 | Mobile 390×780 | ✅ Hamburger visible (`display:grid`), sidebar off-canvas, `scrollWidth` 374 ≤ 390 (no horizontal overflow), job grid 1 col, stat grid 2 cols |
| 20 | Mobile drawer | ✅ Opens with overlay, `aria-expanded=true`, nav + logout reachable, **Escape closes it** (`left: -270`, `aria-expanded=false`) |
| 21 | Bootstrap coexistence | ✅ Computed styles confirm the design system wins: radius 8px, padding 10px 12px, custom chevron |

---

## 5. What was **not** tested (honest limits)

- **Browser file-picker UX for a resume.** The multipart upload path itself is covered by automated
  test #18/#26 (real file upload → 201 → download), and the client-side type/size checks exist in
  `ApplyModal.jsx`, but the native file-chooser dialog was not driven in the browser.
- **JWT expiry after 8 hours** — not waited out; the 401 → auto-logout path was exercised only
  indirectly (see test 25).
- **MongoDB Atlas** and a **MongoDB instance with authentication enabled** — not connected; only the
  in-memory MongoDB was used. The connection string format for authenticated MongoDB is documented
  in README §3.
- **Cross-browser** testing (Firefox/Edge) and **HTTPS/production hosting** — only Chromium and the
  local Vite dev server plus `vite build` were used.
- **Visual pixel-perfect screenshot review** — layout was verified through the accessibility tree,
  computed layout and viewport resizing, not through a full-page screenshot review.
- **jQuery (syllabus Module 3)** — the standalone demo page was removed from the project on
  27 October 2026 at the owner's request, so there is no jQuery code left to test. Earlier results
  for that page are no longer applicable.

---

## 6. Quick smoke test for the viva (≈2 minutes)

1. `cd server && npm run dev:memory` → "MongoDB connected" / "API at http://localhost:5000".
2. `cd client && npm run dev` → open http://localhost:5173.
3. Register a student → dashboard appears.
4. Log out → log in as admin → **+ Post opportunity**.
5. Log out → log in as the student → **Apply now** → submit → **My applications** shows `Pending`.
6. Admin → **Review applications** → set `Shortlisted`.
7. Optionally: `cd server && npm test` → `28/28 pass`.
