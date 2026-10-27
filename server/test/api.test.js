// API integration tests for CareerConnect (Node's built-in test runner — no extra test dependency).
//
// Prerequisite: the API must be running, e.g. `npm run dev:memory` (or `npm run dev` with MongoDB).
//   npm test
// Optional: API_URL=http://localhost:5000/api npm test
//
// Admin credentials come from server/.env (defaults: admin@careerconnect.local / Admin123!ChangeMe).
import test from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.API_URL || "http://localhost:5000/api";
const STAMP = Date.now();
const STUDENT = { name: "Test Student", email: `student${STAMP}@test.local`, password: "Passw0rd123", department: "CSE" };
const ADMIN = {
  email: process.env.ADMIN_EMAIL || "admin@careerconnect.local",
  password: process.env.ADMIN_PASSWORD || "Admin123!ChangeMe",
};

let studentToken = "";
let adminToken = "";
let jobId = "";
let applicationId = "";
let resumeName = "";

async function req(path, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: form || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data, headers: res.headers };
}

test("health endpoint reports ok", async () => {
  const { status, data } = await req("/health");
  assert.equal(status, 200);
  assert.equal(data.status, "ok");
});

test("register rejects an invalid email", async () => {
  const { status, data } = await req("/auth/register", { method: "POST", body: { ...STUDENT, email: "not-an-email" } });
  assert.equal(status, 400);
  assert.match(data.message, /valid email/i);
});

test("register rejects a weak password", async () => {
  const { status, data } = await req("/auth/register", { method: "POST", body: { ...STUDENT, password: "abc" } });
  assert.equal(status, 400);
  assert.match(data.message, /at least 8 characters/i);
});

test("register creates a student and returns a JWT", async () => {
  const { status, data } = await req("/auth/register", { method: "POST", body: STUDENT });
  assert.equal(status, 201);
  assert.ok(data.token, "token expected");
  assert.equal(data.user.role, "student");
  studentToken = data.token;
});

test("registering the same email twice returns 409", async () => {
  const { status } = await req("/auth/register", { method: "POST", body: STUDENT });
  assert.equal(status, 409);
});

test("login with a wrong password returns 401", async () => {
  const { status } = await req("/auth/login", { method: "POST", body: { email: STUDENT.email, password: "WrongPass123" } });
  assert.equal(status, 401);
});

test("login with correct credentials returns a JWT", async () => {
  const { status, data } = await req("/auth/login", { method: "POST", body: { email: STUDENT.email, password: STUDENT.password } });
  assert.equal(status, 200);
  assert.ok(data.token);
  assert.equal(data.user.email, STUDENT.email);
});

test("GET /auth/me requires a token", async () => {
  assert.equal((await req("/auth/me")).status, 401);
  const { status, data } = await req("/auth/me", { token: studentToken });
  assert.equal(status, 200);
  assert.equal(data.user.role, "student");
  assert.equal(data.user.passwordHash, undefined, "password hash must never be returned");
});

test("admin can log in", async () => {
  const { status, data } = await req("/auth/login", { method: "POST", body: ADMIN });
  assert.equal(status, 200);
  assert.equal(data.user.role, "admin");
  adminToken = data.token;
});

test("jobs list is readable without a token", async () => {
  const { status, data } = await req("/jobs");
  assert.equal(status, 200);
  assert.ok(Array.isArray(data.jobs));
});

test("creating a job without a token returns 401", async () => {
  const { status } = await req("/jobs", { method: "POST", body: { title: "X", company: "Y", location: "Z", description: "d" } });
  assert.equal(status, 401);
});

test("a student cannot create a job (role-based access)", async () => {
  const { status } = await req("/jobs", {
    method: "POST",
    token: studentToken,
    body: { title: "X", company: "Y", location: "Z", description: "d" },
  });
  assert.equal(status, 403);
});

test("admin creates a job (CRUD create)", async () => {
  const { status, data } = await req("/jobs", {
    method: "POST",
    token: adminToken,
    body: {
      title: `MERN Intern ${STAMP}`,
      company: "Northline Systems",
      location: "Bengaluru",
      type: "Internship",
      description: "Build and maintain REST APIs with Express and MongoDB under mentor supervision.",
      skills: ["React", "Node.js", "MongoDB"],
      deadline: "",
    },
  });
  assert.equal(status, 201);
  assert.equal(data.job.title, `MERN Intern ${STAMP}`);
  jobId = data.job._id;
});

test("admin updates the job (CRUD update)", async () => {
  const { status, data } = await req(`/jobs/${jobId}`, {
    method: "PUT",
    token: adminToken,
    body: {
      title: `MERN Intern ${STAMP}`,
      company: "Northline Systems",
      location: "Remote",
      type: "Internship",
      description: "Build and maintain REST APIs with Express and MongoDB under mentor supervision.",
      skills: ["React", "Express"],
    },
  });
  assert.equal(status, 200);
  assert.equal(data.job.location, "Remote");
});

test("job search matches text and survives regex characters", async () => {
  const hit = await req(`/jobs?q=${encodeURIComponent("Northline")}`);
  assert.equal(hit.status, 200);
  assert.ok(hit.data.jobs.some((j) => j._id === jobId), "search should find the created job");

  const weird = await req(`/jobs?q=${encodeURIComponent("MERN (")}`);
  assert.equal(weird.status, 200, "regex metacharacters must not crash the search");

  const type = await req(`/jobs?type=Internship&q=${encodeURIComponent("MERN Intern")}`);
  assert.equal(type.status, 200);
  assert.ok(type.data.jobs.every((j) => j.type === "Internship"));
});

test("creating a job with missing fields returns 400", async () => {
  const { status } = await req("/jobs", { method: "POST", token: adminToken, body: { title: "Only title" } });
  assert.equal(status, 400);
});

test("student applies with a resume (multipart upload)", async () => {
  const form = new FormData();
  form.append("coverLetter", "I have built MERN projects during my coursework and would love to contribute.");
  form.append("resume", new Blob(["%PDF-1.4 test resume"], { type: "application/pdf" }), `resume-${STAMP}.pdf`);
  const { status, data } = await req(`/applications/${jobId}`, { method: "POST", token: studentToken, form });
  assert.equal(status, 201);
  assert.equal(data.application.status, "Pending");
  applicationId = data.application._id;
  resumeName = data.application.resumePath;
  assert.ok(resumeName, "resume filename expected");
});

test("applying twice to the same job returns 409", async () => {
  const form = new FormData();
  form.append("coverLetter", "Second attempt should be rejected as a duplicate application.");
  const { status } = await req(`/applications/${jobId}`, { method: "POST", token: studentToken, form });
  assert.equal(status, 409);
});

test("applying without a token returns 401", async () => {
  const { status } = await req(`/applications/${jobId}`, { method: "POST" });
  assert.equal(status, 401);
});

test("student reads their own application history", async () => {
  const { status, data } = await req("/applications/mine/list", { token: studentToken });
  assert.equal(status, 200);
  const mine = data.applications.filter((a) => a._id === applicationId);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].job.title, `MERN Intern ${STAMP}`, "job reference must be populated");
  assert.ok(mine[0].student, "the student id is stored on the application");
});

test("student cannot read the admin application list", async () => {
  const { status } = await req("/applications/admin/all", { token: studentToken });
  assert.equal(status, 403);
});

test("admin reads all applications", async () => {
  const { status, data } = await req("/applications/admin/all", { token: adminToken });
  assert.equal(status, 200);
  assert.ok(data.applications.some((a) => a._id === applicationId));
});

test("student cannot change an application status", async () => {
  const { status } = await req(`/applications/${applicationId}/status`, { method: "PATCH", token: studentToken, body: { status: "Selected" } });
  assert.equal(status, 403);
});

test("admin updates the application status", async () => {
  const { status, data } = await req(`/applications/${applicationId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "Shortlisted" },
  });
  assert.equal(status, 200);
  assert.equal(data.application.status, "Shortlisted");
});

test("admin downloads the uploaded resume", async () => {
  const res = await fetch(`${BASE}/applications/resume/${encodeURIComponent(resumeName)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.match(text, /%PDF/);
});

test("student can download their own resume but a stranger cannot", async () => {
  const stranger = { email: `other${STAMP}@test.local`, password: "Passw0rd123", name: "Other Student" };
  const created = await req("/auth/register", { method: "POST", body: stranger });
  assert.equal(created.status, 201);

  const own = await fetch(`${BASE}/applications/resume/${encodeURIComponent(resumeName)}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.equal(own.status, 200);

  const denied = await fetch(`${BASE}/applications/resume/${encodeURIComponent(resumeName)}`, {
    headers: { Authorization: `Bearer ${created.data.token}` },
  });
  assert.equal(denied.status, 403);
});

test("invalid status value returns 400", async () => {
  const { status } = await req(`/applications/${applicationId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "Whatever" },
  });
  assert.equal(status, 400);
});

test("admin deletes the job (CRUD delete)", async () => {
  const { status } = await req(`/jobs/${jobId}`, { method: "DELETE", token: adminToken });
  assert.equal(status, 200);
  const after = await req(`/jobs/${jobId}`, { method: "PUT", token: adminToken, body: { title: "x", company: "y", location: "z", description: "d" } });
  assert.equal(after.status, 404, "deleted job must not be updatable");
});