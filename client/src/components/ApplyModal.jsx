import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

const ALLOWED = [".pdf", ".doc", ".docx"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function ApplyModal({ job, onCancel, onSubmit }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  // Module 2: client-side validation of the file before uploading.
  function pick(e) {
    const chosen = e.target.files?.[0] || null;
    setError("");
    if (!chosen) return setFile(null);
    const ext = "." + chosen.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setFile(null);
      return setError("Resume must be a PDF, DOC or DOCX file.");
    }
    if (chosen.size > MAX_SIZE) {
      setFile(null);
      return setError("Resume must be 5 MB or smaller.");
    }
    setFile(chosen);
  }

  async function submit(e) {
    e.preventDefault();
    if (coverLetter.trim().length > 0 && coverLetter.trim().length < 20) {
      return setError("Cover letter must be at least 20 characters, or left empty.");
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({ coverLetter: coverLetter.trim(), file });
    } catch (x) {
      setError(x.message);
      setBusy(false);
    }
  }

  return (
    <div
      className="cc-modal-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Apply for an opportunity"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <form className="cc-dialog" onSubmit={submit} noValidate>
        <div className="modalhead">
          <div>
            <p className="sub" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 11 }}>
              Application
            </p>
            <h3 style={{ marginTop: 6 }}>{job.title}</h3>
            <p className="sub">
              {job.company} · {job.location}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onCancel} aria-label="Close dialog">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <p className="form-error" role="alert">
              <Icon name="alert" size={15} /> {error}
            </p>
          )}

          <div className="field">
            <label className="field-label" htmlFor="apply-cover">
              Cover letter <span className="optional">(optional)</span>
            </label>
            <textarea
              id="apply-cover"
              className="textarea form-control"
              rows="5"
              value={coverLetter}
              onChange={(e) => {
                setCoverLetter(e.target.value);
                setError("");
              }}
              placeholder="Introduce yourself and explain why you are a good fit for this role."
            />
            <span className="field-hint">
              {coverLetter.trim().length > 0 && coverLetter.trim().length < 20
                ? "Aim for at least 20 characters."
                : "Leave empty if you prefer to apply with your resume only."}
            </span>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label" htmlFor="apply-resume">
              Resume <span className="optional">(PDF, DOC or DOCX · max 5 MB · optional)</span>
            </label>
            <input
              id="apply-resume"
              className="input form-control"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={pick}
            />
            {file && <span className="field-hint">Selected: {file.name}</span>}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={"btn btn-primary" + (busy ? " is-loading" : "")} disabled={busy}>
            {busy ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
}
