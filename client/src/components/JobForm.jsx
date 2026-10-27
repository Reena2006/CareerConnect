import { useState } from "react";
import Icon from "./Icon.jsx";

export const emptyJob = {
  title: "",
  company: "",
  location: "",
  type: "Internship",
  description: "",
  skills: "",
  deadline: "",
};

export function validateJob(f) {
  const errors = {};
  if (!f.title.trim()) errors.title = "Title is required.";
  if (!f.company.trim()) errors.company = "Company is required.";
  if (!f.location.trim()) errors.location = "Location is required.";
  if (!f.description.trim()) errors.description = "Description is required.";
  else if (f.description.trim().length < 20) errors.description = "Description must be at least 20 characters.";
  return errors;
}

export default function JobForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(() =>
    initial
      ? { ...initial, skills: Array.isArray(initial.skills) ? initial.skills.join(", ") : initial.skills || "" }
      : { ...emptyJob }
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const ch = (e) => {
    const { name, value } = e.target;
    setF((prev) => ({ ...prev, [name]: value }));
    setFormError("");
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  async function submit(e) {
    e.preventDefault();
    const found = validateJob(f);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setFormError("");
    try {
      await onSave(f);
    } catch (x) {
      setFormError(x.message || "Could not save the opportunity.");
    } finally {
      setSaving(false);
    }
  }

  const field = (name, label, props = {}) => (
    <div className="field" key={name}>
      <label className="field-label" htmlFor={"job-" + name}>
        {label}
      </label>
      <input
        id={"job-" + name}
        className={"input form-control" + (errors[name] ? " is-invalid" : "")}
        name={name}
        value={f[name] || ""}
        onChange={ch}
        {...props}
      />
      {errors[name] && (
        <span className="field-error">
          <Icon name="alert" size={13} /> {errors[name]}
        </span>
      )}
    </div>
  );

  return (
    <form className="panel pad formbox" onSubmit={submit} noValidate>
      <div className="section-head">
        <div>
          <h3 className="section-title">{initial?._id ? "Edit opportunity" : "Post a new opportunity"}</h3>
          <p className="section-note">Fields marked by their validation message are required.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          <Icon name="x" size={15} /> Close
        </button>
      </div>

      {formError && (
        <p className="form-error" role="alert">
          <Icon name="alert" size={15} /> {formError}
        </p>
      )}

      <div className="gridform">
        {field("title", "Job title", { placeholder: "Frontend Intern" })}
        {field("company", "Company", { placeholder: "Company name" })}
        {field("location", "Location", { placeholder: "Bengaluru / Remote" })}
        {field("deadline", "Application deadline", { type: "date" })}

        <div className="field">
          <label className="field-label" htmlFor="job-type">
            Employment type
          </label>
          <select id="job-type" className="select form-select" name="type" value={f.type} onChange={ch}>
            <option>Internship</option>
            <option>Full-time</option>
            <option>Part-time</option>
          </select>
        </div>

        {field("skills", "Skills", { placeholder: "React, Node.js, MongoDB" })}

        <div className="field wide">
          <label className="field-label" htmlFor="job-description">
            Description
          </label>
          <textarea
            id="job-description"
            className={"textarea form-control" + (errors.description ? " is-invalid" : "")}
            name="description"
            value={f.description}
            onChange={ch}
            rows="4"
            placeholder="Responsibilities, eligibility, stipend and contact details"
          />
          {errors.description && (
            <span className="field-error">
              <Icon name="alert" size={13} /> {errors.description}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button type="submit" className={"btn btn-primary" + (saving ? " is-loading" : "")} disabled={saving}>
          {saving ? "Saving…" : initial?._id ? "Save changes" : "Post opportunity"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
