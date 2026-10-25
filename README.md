# CareerConnect — Student Placement & Internship Portal
## Run locally in VS Code
Requirements: Node.js 18+, MongoDB running locally (or MongoDB Atlas URI).

### Backend
1. Open terminal in `server`.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Run `npm run dev`.

### Frontend
1. Open a second terminal in `client`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open http://localhost:5173.

Demo admin login: `admin@careerconnect.local` / `Admin123!ChangeMe`
Students register using the registration tab. Change the demo admin password in `.env`.

### Features
Student registration/login, job search, job applications, application tracking, admin job CRUD, application status updates, resume upload, MongoDB persistence, responsive React UI, and a separate jQuery demo at `/jquery-demo.html`.

This is an educational local project. Do not use real sensitive data or deploy with demo credentials.
