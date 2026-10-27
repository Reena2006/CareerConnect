# Web Technology IA3 — Module-by-module syllabus mapping

How each of the six syllabus modules is demonstrated inside **CareerConnect**, with the exact files to open.

---

## Module 1 — HTML and CSS

| Syllabus item | Where it is demonstrated |
|---|---|
| Semantic HTML5 structure | `client/index.html` (`<html lang>`, `<meta description>`, `<noscript>`); `client/src/App.jsx` renders `<aside> <main> <header> <article> <footer>` |
| Forms | Login/registration form (`client/src/components/Auth.jsx`), admin job form (`client/src/components/JobForm.jsx`), apply form with file upload (`client/src/components/ApplyModal.jsx`) |
| Tables | Application history and admin review tables with `<thead>/<tbody>`, striped rows and scrollable wrappers (`client/src/App.jsx`) |
| Navigation | Sidebar navigation with `NavLink` active-link highlighting (`client/src/App.jsx`, `.nav-item` rules in `client/src/styles.css`) |
| CSS selectors (element, class, id, attribute, pseudo) | Throughout `client/src/styles.css` — e.g. `.sidebar .nav-item.active`, `.data-table tbody tr:hover`, `.field-error`, `.btn:disabled`, `@media (max-width: 640px)` |
| Box model, layout, positioning | `styles.css`: `box-sizing:border-box`, grid (`.jobgrid`, `.statrow`, `.gridform`), flexbox (`.layout`, `.topbar`, `.actions`), fixed positioning (`.cc-toast`, `.cc-modal-bg`) |
| Responsive design | Breakpoints at **1024px**, **900px** and **640px** in `styles.css`: at 900px the sidebar becomes an off-canvas drawer opened by a hamburger button (with overlay and Escape to close), at 640px grids collapse to one column, form columns stack and toolbars go vertical |
| Bootstrap (where appropriate) | Bootstrap 5.3 CDN in `client/index.html`; Bootstrap `form-control` / `form-select` classes are applied to every form field, while the project's own design tokens in `styles.css` supply the final look |
| Colours, typography, professional UI | Green/teal design system in `styles.css` (gradients, cards, badges, status colours) |

---

## Module 2 — JavaScript and JSON

| Syllabus item | Where it is demonstrated |
|---|---|
| Functions | `validateAuth()`, `validateJob()` (`Auth.jsx`, `JobForm.jsx`), `api()` (`client/src/api.js`), `requireAuth()` / `requireAdmin()` (`server/src/middleware/auth.js`), `data()` / `valid()` / `esc()` (`server/src/routes/jobs.js`) |
| Events and event handling | `onChange`, `onSubmit`, `onClick` handlers in every React component; DOM events on `window`/`document.createElement` in the resume download helper (`client/src/App.jsx`) |
| DOM manipulation | React renders the UI declaratively; imperative DOM work in `downloadResume()` (creates an `<a>`, clicks it, revokes the object URL) and the Vite entry point `main.jsx` (`createRoot`) |
| Client-side validation | `validateAuth()` (email regex, 8-character password with letter + number), `validateJob()` (required fields, description length), apply-modal file checks (`.pdf/.doc/.docx`, 5 MB limit) |
| JSON data | JSON request/response payloads in `client/src/api.js` (`JSON.stringify` / `response.json()`); MongoDB documents returned as JSON by the REST API |
| JSON parsing and error handling | `api()` wraps `res.json()` in try/catch and converts HTTP errors into user-facing messages |

---

## Module 3 — jQuery

**Not currently demonstrated in this project.** The standalone jQuery page
(`client/public/jquery-demo.html`) and its `sample-jobs.json` data file were removed from the
repository on 27 October 2026 at the project owner's request, and the sidebar/hero links to it
were deleted.

The syllabus still lists jQuery as Module 3, so this module now has **no supporting code**.
If the module must be shown for submission, the page can be restored — it demonstrated:
selectors, `.val()`/`.text()`, traversal with `.find()`, manipulation with `.append()`, events
(`.click()`, `.submit()` with `e.preventDefault()`, `.on("input")`), effects
(`.fadeToggle()`, `.slideUp()`, `.fadeTo()`) and AJAX with `$.getJSON()`.

---

## Module 4 — React.js

| Syllabus item | Where it is demonstrated |
|---|---|
| Components | `Auth`, `JobCard`, `JobForm`, `ApplyModal` (`client/src/components/`), plus `Shell`, `JobsPage`, `MyApplicationsPage`, `AdminApplicationsPage`, `RequireRole`, `Toast` inside `client/src/App.jsx` |
| Props | `JobCard({job, admin, applied, onApply, onEdit, onDelete})`, `Auth({done, note})`, `ApplyModal({job, onCancel, onSubmit})`, session/token passed down as props |
| Rendering & lists | `jobs.map(...)` → job cards, `apps.map(...)` → table rows, `CATEGORIES.map(...)` → filter options, skill chips |
| Conditional rendering | `mode === "register" && ...`, `admin && ...`, `applied ? "Applied" : "Apply now"`, empty-state messages, role-based sidebar links |
| Forms (controlled inputs) | Every input is controlled (`value` + `onChange`), including the job form, auth form and apply modal |
| Routing | `react-router-dom` `HashRouter` with routes `/`, `/applications`, `/admin/applications`, `/login`; `NavLink` active styling; `<Navigate>` redirects; `RequireRole` guard component |
| Styling | Component classes in `client/src/styles.css` + Bootstrap utility classes; status badges per application state |
| Hooks | `useState`, `useEffect`, `useCallback`, `useMemo` (`applied` set of job IDs) |
| Entry point | `client/src/main.jsx` (`createRoot`), `client/index.html` |

---

## Module 5 — MongoDB

| Syllabus item | Where it is demonstrated |
|---|---|
| Collections | `users`, `jobs`, `applications` (Mongoose pluralises the model names) |
| Schemas | `server/src/models/User.js`, `Job.js`, `Application.js` — types, `required`, `trim`, `maxlength`, `enum`, `lowercase`, `unique`, `default`, `ref` references, timestamps |
| Indexes / constraints | `schema.index({student:1, job:1}, {unique:true})` — one application per student per job; unique email on `User` |
| Data persistence | Documents are written through Mongoose and survive server restarts (when using a real `MONGODB_URI`) |
| CRUD operations | Create: `User.create`, `Job.create`, `Application.create` · Read: `find`, `findOne`, `findById` with `.populate()` and `.sort()` · Update: `findByIdAndUpdate` with `runValidators` · Delete: `findByIdAndDelete` |
| Query features | Regex search across title/company/location/skills with escaped user input, `type` filter, `limit`, `populate` of related documents |
| Connection & seeding | `server/src/server.js` (`mongoose.connect`, admin seed on first boot); `server/src/dev.js` for an in-memory MongoDB |

---

## Module 6 — MERN full-stack development

| Syllabus item | Where it is demonstrated |
|---|---|
| Node.js | ES modules (`"type": "module"`), `fs`, `path`, `url` built-ins |
| Express | `server/src/server.js` — app setup, JSON body parser, CORS, static route mounting, central error-handling middleware; route modules in `server/src/routes/` |
| REST API | Full mapping in README §6 (GET/POST/PUT/PATCH/DELETE with proper status codes 200/201/400/401/403/404/409) |
| MongoDB integration | Mongoose models + `populate()` joins between jobs, users and applications |
| Authentication (JWT) | `server/src/routes/auth.js` — bcrypt hash (12 rounds), `jwt.sign(..., {expiresIn:"8h"})`, `Authorization: Bearer` parsing in `server/src/middleware/auth.js`, token stored in `localStorage` and attached by `client/src/api.js` |
| Authorization / role-based access | Server: `requireAdmin` returns **403** for students on job CRUD and application review; student-only routes check `role === "student"`. Client: sidebar shows only permitted links, `RequireRole` renders a 403 page for direct URL access |
| File upload (multer) | `server/src/routes/applications.js` — disk storage in `server/uploads/`, 5 MB limit, PDF/DOC/DOCX filter, ownership-checked download route |
| React ↔ API wiring | `client/src/api.js` fetch helper, error → toast mapping, auto-logout on 401 |
| Testing | `server/test/api.test.js` — 28 automated integration tests using Node's built-in test runner (`npm test`) |

---

## Quick demo script (for the viva)

1. Register a student → password rules and JWT are visible in the Network tab.
2. Log in as admin → post, edit and delete a job.
3. As the student → search/filter jobs, open **View details**, apply with cover letter + resume.
4. Student → **My applications** shows `Pending`.
5. Admin → **Review applications** → change the status; the student sees `Shortlisted`.
6. As a student, paste `#/admin/applications` into the URL → **403 Access denied**.
7. `cd server && npm test` → `28/28 pass` (optional).
