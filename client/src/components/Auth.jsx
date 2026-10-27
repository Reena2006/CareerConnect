import { useState } from "react";
import { api } from "../api.js";
import Icon from "./Icon.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Module 2: pure JavaScript validation, run before any request is sent.
export function validateAuth(mode, f) {
  const errors = {};
  if (mode === "register") {
    const name = f.name.trim();
    if (!name) errors.name = "Please enter your full name.";
    else if (name.length < 2) errors.name = "Name must be at least 2 characters.";
  }
  const email = f.email.trim();
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!f.password) errors.password = "Password is required.";
  else if (mode === "register" && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(f.password))
    errors.password = "Use at least 8 characters with a letter and a number.";
  return errors;
}

export default function Auth({ done }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", department: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const change = (e) => {
    const { name, value } = e.target;
    setF((prev) => ({ ...prev, [name]: value }));
    setFormError("");
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const switchMode = (next) => {
    setMode(next);
    setErrors({});
    setFormError("");
  };

  async function submit(e) {
    e.preventDefault();
    const found = validateAuth(mode, f);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      done(await api("/auth/" + mode, { method: "POST", body: f }));
    } catch (x) {
      setFormError(x.message);
      setBusy(false);
    }
  }

  const err = (name) =>
    errors[name] ? (
      <span className="field-error">
        <Icon name="alert" size={13} /> {errors[name]}
      </span>
    ) : null;

  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span className="brand-name">
            Career<span>Connect</span>
          </span>
        </div>

        <div>
          <h1 className="auth-headline">Campus placements and internships, organised in one place.</h1>
          <p className="auth-lead">
            Browse verified opportunities, submit applications with your resume and follow every
            status update from your dashboard.
          </p>
          <ul className="auth-points">
            <li>
              <Icon name="checkCircle" size={17} /> Curated internships, placements and part-time roles
            </li>
            <li>
              <Icon name="checkCircle" size={17} /> Application tracking with clear status updates
            </li>
            <li>
              <Icon name="checkCircle" size={17} /> Secure sign-in with hashed passwords and JWT sessions
            </li>
          </ul>
        </div>

        <p className="auth-foot">CareerConnect · Student Placement &amp; Internship Portal</p>
      </aside>

      <main className="auth-main">
        <div className="panel auth-card">
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="auth-sub">
            {mode === "login"
              ? "Sign in to continue to your dashboard."
              : "Register as a student to start applying."}
          </p>

          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={mode === "login" ? "active" : ""}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => switchMode("register")}
              className={mode === "register" ? "active" : ""}
            >
              Register
            </button>
          </div>

          <form onSubmit={submit} noValidate>
            {formError && (
              <p className="form-error" role="alert">
                <Icon name="alert" size={15} /> {formError}
              </p>
            )}

            {mode === "register" && (
              <div className="field">
                <label className="field-label" htmlFor="auth-name">
                  Full name
                </label>
                <input
                  id="auth-name"
                  className={"input form-control" + (errors.name ? " is-invalid" : "")}
                  name="name"
                  value={f.name}
                  onChange={change}
                  placeholder="e.g. Aditi Sharma"
                  autoComplete="name"
                />
                {err("name")}
              </div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="auth-email">
                Email address
              </label>
              <input
                id="auth-email"
                className={"input form-control" + (errors.email ? " is-invalid" : "")}
                type="email"
                name="email"
                value={f.email}
                onChange={change}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {err("email")}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="auth-password">
                Password
              </label>
              <span className="input-wrap">
                <input
                  id="auth-password"
                  className={"input form-control" + (errors.password ? " is-invalid" : "")}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={f.password}
                  onChange={change}
                  placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
                </button>
              </span>
              {mode === "register" && !errors.password && (
                <span className="field-hint">Mix letters and numbers — e.g. Passw0rd123</span>
              )}
              {err("password")}
            </div>

            {mode === "register" && (
              <div className="field">
                <label className="field-label" htmlFor="auth-department">
                  Department <span className="optional">(optional)</span>
                </label>
                <select
                  id="auth-department"
                  className="select form-select"
                  name="department"
                  value={f.department}
                  onChange={change}
                >
                  <option value="">Select department</option>
                  {["CSE", "IT", "ECE", "EEE", "Other"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className={"btn btn-primary btn-block" + (busy ? " is-loading" : "")}
              disabled={busy}
            >
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create student account"}
            </button>
          </form>

          <p className="auth-note">
            {mode === "login"
              ? "New here? Choose Register above to create a student account."
              : "Passwords are hashed with bcrypt before they are stored."}
          </p>
        </div>
      </main>
    </div>
  );
}
