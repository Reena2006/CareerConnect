import { useCallback, useEffect, useMemo, useState } from "react";
import { HashRouter, Link, Navigate, Route, Routes, useLocation, NavLink } from "react-router-dom";
import { api, API } from "./api.js";
import Auth from "./components/Auth.jsx";
import JobCard from "./components/JobCard.jsx";
import JobForm from "./components/JobForm.jsx";
import ApplyModal from "./components/ApplyModal.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import Icon from "./components/Icon.jsx";

function loadSession() {
  try {
    const raw = localStorage.getItem("cc-session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const CATEGORIES = ["All types", "Internship", "Full-time", "Part-time"];
const STATUSES = ["Pending", "Shortlisted", "Rejected", "Selected"];

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";

/* ---------- Shared UI pieces ---------- */
function Toast({ toast }) {
  if (!toast.message) return null;
  const icon = toast.kind === "success" ? "checkCircle" : toast.kind === "error" ? "alert" : "info";
  return (
    <div className={"cc-toast " + toast.kind} role="status" aria-live="polite">
      <Icon name={icon} size={17} />
      <span>{toast.message}</span>
    </div>
  );
}

function StatCard({ label, value, icon, tone }) {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      <span className={"stat-icon " + (tone || "")}>
        <Icon name={icon} size={18} />
      </span>
    </div>
  );
}

function StateBlock({ tone = "", icon, title, text, actionLabel, onAction }) {
  return (
    <div className={"panel state " + tone} role={tone === "error" ? "alert" : undefined}>
      <span className="state-icon">
        <Icon name={icon} size={20} />
      </span>
      <p className="state-title">{title}</p>
      <p className="state-text">{text}</p>
      {actionLabel && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAction}>
          <Icon name="refresh" size={14} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function JobSkeleton() {
  return (
    <div className="job-card" aria-hidden="true">
      <div className="job-top">
        <span className="skeleton" style={{ width: 42, height: 42, borderRadius: 10 }} />
        <span className="skeleton sk-chip" />
      </div>
      <span className="skeleton sk-title" />
      <span className="skeleton sk-line" style={{ width: "45%" }} />
      <span className="skeleton sk-line" style={{ width: "70%", marginTop: 14 }} />
      <div className="sk-row">
        <span className="skeleton sk-chip" />
        <span className="skeleton sk-chip" />
      </div>
      <span className="skeleton sk-line" style={{ marginTop: 22, width: "100%" }} />
    </div>
  );
}

function TableSkeleton({ rows = 3, cols = 4 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c}>
          <span className="skeleton sk-line" style={{ width: c === 0 ? "80%" : "55%", marginBottom: 0 }} />
        </td>
      ))}
    </tr>
  ));
}

/* ---------- Route guard (Module 4 routing, Module 6 authorization) ---------- */
function RequireRole({ role, session, children }) {
  if (!role.includes(session.user.role)) {
    return (
      <div className="panel access-card">
        <span className="state-icon" style={{ margin: "0 auto 12px" }}>
          <Icon name="shield" size={20} />
        </span>
        <h2>403 — Access denied</h2>
        <p>
          This page is restricted to {role.join(" and ")} accounts. You are signed in as{" "}
          <b>{session.user.role}</b>.
        </p>
        <Link className="btn btn-primary" to="/">
          Back to opportunities
        </Link>
      </div>
    );
  }
  return children;
}

/* ---------- Opportunities: search, filter, apply, admin CRUD ---------- */
function JobsPage({ session, note, handleError }) {
  const token = session.token;
  const admin = session.user.role === "admin";
  const student = session.user.role === "student";

  const [jobs, setJobs] = useState([]);
  const [mine, setMine] = useState([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("All types");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [applying, setApplying] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (type !== "All types") p.set("type", type);
      const d = await api("/jobs?" + p, { token });
      setJobs(d.jobs);
    } catch (x) {
      setLoadError(x.message);
      handleError(x);
    } finally {
      setLoading(false);
    }
  }, [q, type, token, handleError]);

  const loadMine = useCallback(async () => {
    if (!student) return;
    try {
      const d = await api("/applications/mine/list", { token });
      setMine(d.applications);
    } catch (x) {
      handleError(x);
    }
  }, [student, token, handleError]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);
  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const applied = useMemo(() => new Set(mine.map((a) => a.job?._id)), [mine]);

  const studentStats = useMemo(
    () => ({
      total: mine.length,
      pending: mine.filter((a) => a.status === "Pending").length,
      active: mine.filter((a) => a.status === "Shortlisted" || a.status === "Selected").length,
    }),
    [mine]
  );

  const adminStats = useMemo(() => {
    const week = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return {
      total: jobs.length,
      internships: jobs.filter((j) => j.type === "Internship").length,
      fulltime: jobs.filter((j) => j.type === "Full-time").length,
      closing: jobs.filter((j) => j.deadline && new Date(j.deadline).getTime() <= week).length,
    };
  }, [jobs]);

  async function submitApplication({ coverLetter, file }) {
    const fd = new FormData();
    fd.append("coverLetter", coverLetter);
    if (file) fd.append("resume", file);
    try {
      const d = await api("/applications/" + applying._id, { token, method: "POST", formData: fd });
      note(d.message, "success");
      setApplying(null);
      await loadMine();
    } catch (x) {
      if (x.status === 401) handleError(x);
      throw x;
    }
  }

  async function saveJob(f) {
    const payload = {
      ...f,
      skills: Array.isArray(f.skills) ? f.skills : f.skills.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing) await api("/jobs/" + editing._id, { token, method: "PUT", body: payload });
      else await api("/jobs", { token, method: "POST", body: payload });
      note(editing ? "Opportunity updated." : "Opportunity published.", "success");
      setFormOpen(false);
      setEditing(null);
      loadJobs();
    } catch (x) {
      handleError(x);
      throw x;
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api("/jobs/" + deleting._id, { token, method: "DELETE" });
      note("Opportunity deleted.", "success");
      setDeleting(null);
      loadJobs();
    } catch (x) {
      setDeleting(null);
      handleError(x);
    }
  }

  const firstName = session.user.name.split(" ")[0];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{admin ? "Opportunities" : `Welcome back, ${firstName}`}</h1>
          <p className="page-sub">
            {admin
              ? "Create, edit and remove the opportunities published to students."
              : "Browse internships and placements, and track every application from one place."}
          </p>
        </div>
        {admin && (
          <div className="page-actions">
            <button
              type="button"
              className={"btn " + (formOpen ? "btn-secondary" : "btn-primary")}
              onClick={() => {
                setEditing(null);
                setFormOpen(!formOpen);
              }}
            >
              <Icon name={formOpen ? "x" : "plus"} size={16} />
              {formOpen ? "Close form" : "Post opportunity"}
            </button>
          </div>
        )}
      </div>

      <div className="stat-grid">
        {admin ? (
          <>
            <StatCard label="Opportunities" value={adminStats.total} icon="grid" tone="navy" />
            <StatCard label="Internships" value={adminStats.internships} icon="briefcase" />
            <StatCard label="Full-time roles" value={adminStats.fulltime} icon="building" tone="green" />
            <StatCard label="Closing in 7 days" value={adminStats.closing} icon="clock" tone="amber" />
          </>
        ) : (
          <>
            <StatCard label="Open roles" value={loading ? "—" : jobs.length} icon="grid" tone="navy" />
            <StatCard label="My applications" value={studentStats.total} icon="clipboard" />
            <StatCard label="In review" value={studentStats.pending} icon="clock" tone="amber" />
            <StatCard label="Shortlisted / selected" value={studentStats.active} icon="checkCircle" tone="green" />
          </>
        )}
      </div>

      {admin && formOpen && (
        <JobForm
          key={editing?._id || "new"}
          initial={editing}
          onSave={saveJob}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      <div className="section-head">
        <h2 className="section-title">{admin ? "Published opportunities" : "Explore opportunities"}</h2>
        {!loading && !loadError && <span className="section-note">{jobs.length} result{jobs.length === 1 ? "" : "s"}</span>}
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Icon name="search" size={16} />
          <input
            className="input form-control"
            placeholder="Search role, company, location or skill..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search opportunities"
          />
        </div>
        <select className="select form-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
          {CATEGORIES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="job-grid" aria-hidden="true">
          <JobSkeleton />
          <JobSkeleton />
          <JobSkeleton />
        </div>
      ) : loadError ? (
        <StateBlock
          tone="error"
          icon="alert"
          title="We could not load opportunities"
          text={loadError}
          actionLabel="Try again"
          onAction={loadJobs}
        />
      ) : jobs.length ? (
        <div className="job-grid">
          {jobs.map((j) => (
            <JobCard
              key={j._id}
              job={j}
              admin={admin}
              applied={applied.has(j._id)}
              onApply={setApplying}
              onEdit={(job) => {
                setEditing({ ...job, deadline: job.deadline ? job.deadline.slice(0, 10) : "" });
                setFormOpen(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      ) : (
        <StateBlock
          icon="search"
          title={admin ? "No opportunities published yet" : "No opportunities match your search"}
          text={
            admin
              ? "Publish your first opportunity so students can start applying."
              : q || type !== "All types"
                ? "Try a different keyword or clear the type filter."
                : "New placements and internships will appear here as soon as they are published."
          }
          actionLabel={admin ? undefined : q || type !== "All types" ? "Clear filters" : undefined}
          onAction={() => {
            setQ("");
            setType("All types");
          }}
        />
      )}

      {applying && <ApplyModal job={applying} onCancel={() => setApplying(null)} onSubmit={submitApplication} />}

      {deleting && (
        <ConfirmDialog
          title="Delete opportunity"
          message={`"${deleting.title}" will be removed from the listings. Applications already submitted stay in the database.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}

/* ---------- Student application history ---------- */
function MyApplicationsPage({ session, handleError }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const d = await api("/applications/mine/list", { token: session.token });
      setApps(d.applications);
    } catch (x) {
      setLoadError(x.message);
      handleError(x);
    } finally {
      setLoading(false);
    }
  }, [session.token, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      total: apps.length,
      pending: apps.filter((a) => a.status === "Pending").length,
      shortlisted: apps.filter((a) => a.status === "Shortlisted").length,
      selected: apps.filter((a) => a.status === "Selected").length,
    }),
    [apps]
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My applications</h1>
          <p className="page-sub">Every opportunity you have applied to, with its current status.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Applications" value={loading ? "—" : counts.total} icon="clipboard" tone="navy" />
        <StatCard label="In review" value={counts.pending} icon="clock" tone="amber" />
        <StatCard label="Shortlisted" value={counts.shortlisted} icon="trending" />
        <StatCard label="Selected" value={counts.selected} icon="checkCircle" tone="green" />
      </div>

      <div className="panel table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Company</th>
                <th>Type</th>
                <th>Applied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={3} cols={5} />
              ) : (
                apps.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <span className="cell-title">{a.job?.title || "Job removed"}</span>
                      <span className="cell-sub">{a.job?.location || "—"}</span>
                    </td>
                    <td>{a.job?.company || "—"}</td>
                    <td>{a.job?.type || "—"}</td>
                    <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={"badge " + a.status.toLowerCase()}>{a.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && loadError && (
          <StateBlock tone="error" icon="alert" title="Could not load your applications" text={loadError} actionLabel="Try again" onAction={load} />
        )}
        {!loading && !loadError && !apps.length && (
          <StateBlock
            icon="inbox"
            title="No applications yet"
            text="Browse the opportunities page and apply to a role — it will appear here with its status."
          />
        )}
      </div>
    </>
  );
}

/* ---------- Admin application review ---------- */
function AdminApplicationsPage({ session, note, handleError }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingId, setSavingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const d = await api("/applications/admin/all", { token: session.token });
      setApps(d.applications);
    } catch (x) {
      setLoadError(x.message);
      handleError(x);
    } finally {
      setLoading(false);
    }
  }, [session.token, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id, status) {
    setSavingId(id);
    try {
      await api("/applications/" + id + "/status", { token: session.token, method: "PATCH", body: { status } });
      note("Application status updated.", "success");
      load();
    } catch (x) {
      handleError(x);
    } finally {
      setSavingId("");
    }
  }

  const counts = useMemo(
    () => ({
      total: apps.length,
      pending: apps.filter((a) => a.status === "Pending").length,
      shortlisted: apps.filter((a) => a.status === "Shortlisted").length,
      selected: apps.filter((a) => a.status === "Selected").length,
      rejected: apps.filter((a) => a.status === "Rejected").length,
    }),
    [apps]
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Application review</h1>
          <p className="page-sub">
            Review student details, download resumes and move each application to its next stage.
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total" value={loading ? "—" : counts.total} icon="users" tone="navy" />
        <StatCard label="Pending" value={counts.pending} icon="clock" tone="amber" />
        <StatCard label="Shortlisted" value={counts.shortlisted} icon="trending" />
        <StatCard label="Selected" value={counts.selected} icon="checkCircle" tone="green" />
        <StatCard label="Rejected" value={counts.rejected} icon="x" tone="navy" />
      </div>

      <div className="panel table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Department</th>
                <th>Opportunity</th>
                <th>Applied</th>
                <th>Cover letter</th>
                <th>Resume</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={3} cols={7} />
              ) : (
                apps.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <span className="cell-title">{a.student?.name || "Unknown"}</span>
                      <span className="cell-sub">{a.student?.email || "—"}</span>
                    </td>
                    <td>{a.student?.department || "—"}</td>
                    <td>
                      <span className="cell-title">{a.job?.title || "Job removed"}</span>
                      <span className="cell-sub">{a.job?.company || "—"}</span>
                    </td>
                    <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                    <td>{a.coverLetter ? a.coverLetter.slice(0, 60) + (a.coverLetter.length > 60 ? "…" : "") : "—"}</td>
                    <td>
                      {a.resumePath ? (
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => downloadResume(a.resumePath, session.token, note)}
                        >
                          <Icon name="download" size={14} /> Download
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <select
                        className="select form-select"
                        value={a.status}
                        onChange={(e) => changeStatus(a._id, e.target.value)}
                        aria-label={"Status for " + (a.student?.name || "student")}
                        disabled={savingId === a._id}
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && loadError && (
          <StateBlock tone="error" icon="alert" title="Could not load applications" text={loadError} actionLabel="Try again" onAction={load} />
        )}
        {!loading && !loadError && !apps.length && (
          <StateBlock
            icon="inbox"
            title="No applications yet"
            text="When students apply to your published opportunities, their submissions appear here."
          />
        )}
      </div>
    </>
  );
}

// Resumes are behind JWT auth, so the file is fetched as a Blob and saved by the browser.
async function downloadResume(filename, token, note) {
  try {
    const res = await fetch(`${API}/applications/resume/${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || `Download failed (HTTP ${res.status}).`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (x) {
    note(x.message, "error");
  }
}

/* ---------- Application shell: sidebar, header, mobile drawer ---------- */
function Shell({ session, logout, note, handleError }) {
  const admin = session.user.role === "admin";
  const student = session.user.role === "student";
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const titles = {
    "/": admin ? "Opportunities" : "Dashboard",
    "/applications": "My applications",
    "/admin/applications": "Application review",
  };
  const current = titles[location.pathname] || "Dashboard";
  const navClass = ({ isActive }) => "nav-item" + (isActive ? " active" : "");

  return (
    <div className="app">
      {navOpen && <div className="sidebar-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <aside className={"sidebar" + (navOpen ? " open" : "")} aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span className="brand-name">
            Career<span>Connect</span>
          </span>
        </div>

        <p className="nav-label">Workspace</p>
        <NavLink to="/" end className={navClass}>
          <Icon name="grid" size={17} />
          {admin ? "Manage opportunities" : "Explore opportunities"}
        </NavLink>
        {student && (
          <NavLink to="/applications" className={navClass}>
            <Icon name="clipboard" size={17} /> My applications
          </NavLink>
        )}
        {admin && (
          <NavLink to="/admin/applications" className={navClass}>
            <Icon name="users" size={17} /> Review applications
          </NavLink>
        )}

        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true">
            {initials(session.user.name)}
          </span>
          <span className="user-meta">
            <span className="user-name" title={session.user.name}>
              {session.user.name}
            </span>
            <span className="user-role">{session.user.role} account</span>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout} title="Log out">
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="hamburger"
              onClick={() => setNavOpen((v) => !v)}
              aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={navOpen}
            >
              <Icon name={navOpen ? "x" : "menu"} size={18} />
            </button>
            <div>
              <div className="topbar-title">{current}</div>
              <div className="topbar-sub">
                {admin ? "Administrator workspace" : "Student workspace"} · CareerConnect
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <span className="role-chip">{session.user.role}</span>
            <span className="avatar" title={session.user.name}>
              {initials(session.user.name)}
            </span>
          </div>
        </header>

        <div className="content">
          <Routes>
            <Route
              path="/"
              element={
                <RequireRole role={["student", "admin"]} session={session}>
                  <JobsPage session={session} note={note} handleError={handleError} />
                </RequireRole>
              }
            />
            <Route
              path="/applications"
              element={
                student ? (
                  <MyApplicationsPage session={session} handleError={handleError} />
                ) : (
                  <RequireRole role={["student"]} session={session}>
                    <></>
                  </RequireRole>
                )
              }
            />
            <Route
              path="/admin/applications"
              element={
                admin ? (
                  <AdminApplicationsPage session={session} note={note} handleError={handleError} />
                ) : (
                  <RequireRole role={["admin"]} session={session}>
                    <></>
                  </RequireRole>
                )
              }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <footer className="site-footer">
          CareerConnect · Student Placement &amp; Internship Portal · Web Technology IA3
        </footer>
      </div>
    </div>
  );
}

/* ---------- Root ---------- */
export default function App() {
  const [session, setSession] = useState(loadSession);
  const [toast, setToast] = useState({ message: "", kind: "info" });

  const note = useCallback((message, kind = "info") => {
    setToast({ message, kind });
    setTimeout(() => setToast({ message: "", kind: "info" }), 4000);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cc-session");
    setSession(null);
    setToast({ message: "You have been logged out.", kind: "info" });
  }, []);

  const handleError = useCallback(
    (x) => {
      if (x && x.status === 401) {
        logout();
        note("Session expired. Please log in again.", "error");
        return;
      }
      note(x ? x.message : "Something went wrong.", "error");
    },
    [logout, note]
  );

  const authDone = useCallback(
    (s) => {
      localStorage.setItem("cc-session", JSON.stringify(s));
      setSession(s);
      note("Welcome, " + s.user.name, "success");
    },
    [note]
  );

  if (!session) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Auth done={authDone} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toast toast={toast} />
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <Shell session={session} logout={logout} note={note} handleError={handleError} />
      <Toast toast={toast} />
    </HashRouter>
  );
}
