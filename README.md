# CareerConnect — Student Placement & Internship Portal

A full-stack MERN project for the **Web Technology IA3** syllabus: students register, browse internships and placements, apply with a resume and track their application status; admins post opportunities and review applications.

**Stack:** HTML5 · CSS3 (responsive + Bootstrap 5) · JavaScript/JSON · React 18 (Vite) · Node.js · Express · MongoDB (Mongoose) · REST API · JWT authentication

---

## 1. Requirements

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18 or newer (22 LTS recommended) | https://nodejs.org — installs `npm` too |
| MongoDB | 6+ (Community) **or** MongoDB Atlas | OR use the built-in in-memory database (see §4.3) |
| Browser | Chrome / Edge / Firefox | |
| Editor | VS Code | Terminal → New Terminal |

> **No Node.js on your machine?** A ready-to-use portable copy already lives in this repo at
> `.runtime/node-v22.23.4-win-x64/` (it is git-ignored). Open a terminal in the project root and run:
> ```powershell
> $env:PATH = "$PWD\.runtime\node-v22.23.4-win-x64;$env:PATH"
> node -v   # v22.23.4
> npm -v    # 10.9.9
> ```
> Installing Node.js properly from nodejs.org is still the recommended long-term option.

---

## 2. Project structure

```
CareerConnect-IA3/
├── client/                     # React front end (Vite)
│   ├── index.html              # HTML5 shell + Bootstrap 5 CDN
│   ├── public/                 # Static assets served by Vite
│   └── src/
│       ├── App.jsx             # Routing, layout, jobs / applications pages
│       ├── api.js              # fetch helper (JSON + JWT headers)
│       ├── components/         # Auth, JobCard, JobForm, ApplyModal
│       └── styles.css          # Responsive design (desktop → mobile)
├── server/                     # Express REST API
│   ├── .env.example            # Copy to .env  ← never commit .env
│   ├── src/
│   │   ├── server.js           # App bootstrap, MongoDB connect, admin seed
│   │   ├── dev.js              # Boots an in-memory MongoDB (no install needed)
│   │   ├── middleware/auth.js  # JWT verification + role check
│   │   ├── models/             # User, Job, Application (Mongoose schemas)
│   │   └── routes/             # auth, jobs, applications (REST endpoints)
│   ├── test/api.test.js        # 28 automated API tests (node:test)
│   └── uploads/                # Uploaded resumes (git-ignored)
├── README.md                   # This file — setup and run instructions
├── MODULE-MAPPING.md           # Syllabus module → code mapping
├── TESTING.md                  # How to test + what was actually tested
└── .gitignore                  # node_modules, .env, dist, uploads, …
```

---

## 3. Environment configuration

```powershell
cd server
copy .env.example .env      # Windows CMD:  copy .env.example .env
```

`server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/careerconnect
JWT_SECRET=paste_a_long_random_secret_here_change_this_in_production_2026
CLIENT_URL=http://localhost:5173
ADMIN_NAME=CareerConnect Admin
ADMIN_EMAIL=admin@careerconnect.local
ADMIN_PASSWORD=Admin123!ChangeMe
```

| Variable | Meaning |
|---|---|
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Secret used to sign JWTs — **change it** before sharing |
| `CLIENT_URL` | Allowed CORS origin (the Vite dev server) |
| `ADMIN_*` | Admin account seeded on first start (only if the email does not exist) |

**Security rules**

- `.env` is listed in `.gitignore` — never commit it, and never paste its values into GitHub.
- Passwords are hashed with **bcrypt (12 rounds)**; the API never returns `passwordHash`.
- `.env.example` contains placeholders only and **is** committed.

**MongoDB with authentication enabled:** put the credentials in the URI and URL-encode any
special characters in the password (`@`, `:`, `/`, `%` …):

```env
MONGODB_URI=mongodb://careerconnect_user:YOUR_PASSWORD@127.0.0.1:27017/careerconnect?authSource=careerconnect
```

---

## 4. Running the application locally (VS Code on Windows)

Open **two terminals** in VS Code (`Terminal → New Terminal`).

### 4.1 Backend (terminal 1)

```powershell
cd server
npm install
copy .env.example .env
npm run dev          # starts Express on http://localhost:5000
```

### 4.2 Frontend (terminal 2)

```powershell
cd client
npm install
npm run dev          # starts Vite on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### 4.3 No MongoDB installed? Use the in-memory database

```powershell
cd server
npm run dev:memory   # downloads mongod once, starts a throw-away database, then runs the API
```

`npm run dev:memory` needs no MongoDB installation; all data is erased when you stop the
process. It reads `server/.env` for the JWT/admin settings but ignores `MONGODB_URI`.
For coursework demos this is the fastest option; use `npm run dev` with a real MongoDB (or Atlas)
when you want data to persist.

### 4.4 Login

| Role | Email | Password |
|---|---|---|
| Admin | `admin@careerconnect.local` | value of `ADMIN_PASSWORD` in `server/.env` |
| Student | register in the browser | you choose it (≥ 8 characters, letters + numbers) |

---

## 5. Testing

```powershell
cd server
npm test             # 28 REST API tests — API must already be running
```

See **[TESTING.md](TESTING.md)** for the full manual checklist and the list of features that were
actually executed and verified.

---

## 6. REST API reference

All responses are JSON. Protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/health` | public | Health check |
| POST | `/api/auth/register` | public | Register a student → `{token,user}` |
| POST | `/api/auth/login` | public | Login → `{token,user}` |
| GET | `/api/auth/me` | logged in | Current user (no password hash) |
| GET | `/api/jobs` | public | List jobs, `?q=` search, `?type=` filter |
| POST | `/api/jobs` | admin | Create a job |
| PUT | `/api/jobs/:id` | admin | Update a job |
| DELETE | `/api/jobs/:id` | admin | Delete a job |
| POST | `/api/applications/:jobId` | student | Apply (multipart: `coverLetter`, `resume`) |
| GET | `/api/applications/mine/list` | student | Own application history |
| GET | `/api/applications/admin/all` | admin | All applications |
| PATCH | `/api/applications/:id/status` | admin | `Pending/Shortlisted/Rejected/Selected` |
| GET | `/api/applications/resume/:filename` | owner/admin | Download uploaded resume |

Error responses are `{ "message": "…" }` with a matching HTTP status (400/401/403/404/409/500)
and are shown to the user as toast messages.

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `Set JWT_SECRET in server/.env` and the API exits | Copy `.env.example` to `.env` |
| `MongooseServerSelectionError` on start | Start MongoDB, or run `npm run dev:memory`, or check `MONGODB_URI` |
| Browser says "Cannot reach the API" | Backend not running — `npm run dev` in `server/` |
| CORS error | `CLIENT_URL` must equal the Vite origin (`http://localhost:5173`) |
| "Session expired" toast after restarting the API with a new `JWT_SECRET` | Expected — log in again |
| Port already in use | Change `PORT` (server) or run `npm run dev -- --port 5174` (client) |
| `command not found: node` | Install Node.js, or add `.runtime\node-v22.23.4-win-x64` to `PATH` (§1) |

---

## 8. GitHub checklist

- `node_modules/`, `dist/`, `server/uploads/`, `.runtime/` are git-ignored.
- `.env` is git-ignored; only `.env.example` is committed.
- No passwords, tokens or database dumps are stored in the repository.
- Generated files (`package-lock.json`) **are** committed on purpose — they make installs reproducible.

---

*Educational project for local use. Do not deploy it with the demo credentials or process real personal data.*
