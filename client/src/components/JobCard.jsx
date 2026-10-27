import { useState } from "react";
import Icon from "./Icon.jsx";

const TYPE_CHIP = { Internship: "blue", "Full-time": "green", "Part-time": "amber" };

export default function JobCard({ job, admin, applied, onApply, onEdit, onDelete }) {
  const [details, setDetails] = useState(false);
  const expired = job.deadline && new Date(job.deadline) < new Date();

  return (
    <article className="job-card">
      <div className="job-top">
        <span className="company-mark" aria-hidden="true">
          {(job.company || "J").trim()[0].toUpperCase()}
        </span>
        <span className={"chip " + (TYPE_CHIP[job.type] || "")}>
          <Icon name="briefcase" size={13} />
          {job.type}
        </span>
      </div>

      <h3 className="job-title">{job.title}</h3>
      <p className="job-company">{job.company}</p>

      <div className="job-meta">
        <span className="meta-item">
          <Icon name="pin" size={14} /> {job.location}
        </span>
        <span className="meta-item">
          <Icon name="clock" size={14} />
          {job.deadline ? "Closes " + new Date(job.deadline).toLocaleDateString() : "Open until filled"}
        </span>
      </div>

      {job.skills?.length > 0 && (
        <div className="skills">
          {job.skills.map((s) => (
            <span className="skill-chip" key={s}>
              {s}
            </span>
          ))}
        </div>
      )}

      {details && (
        <div className="job-details">
          <p>{job.description}</p>
          {job.deadline && (
            <span className={"deadline" + (expired ? " expired" : "")}>
              <Icon name={expired ? "alert" : "info"} size={14} />
              {expired ? "Applications closed" : "Applications close " + new Date(job.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      <div className="job-actions">
        <button
          type="button"
          className="link-btn muted"
          onClick={() => setDetails(!details)}
          aria-expanded={details}
        >
          {details ? "Hide details" : "View details"}
        </button>

        {admin ? (
          <span className="push-right" style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(job)}>
              <Icon name="edit" size={14} /> Edit
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(job)}>
              <Icon name="trash" size={14} /> Delete
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={"btn push-right " + (applied ? "btn-secondary" : "btn-primary")}
            disabled={applied || expired}
            onClick={() => onApply(job)}
          >
            {applied ? (
              <>
                <Icon name="check" size={15} /> Applied
              </>
            ) : expired ? (
              "Closed"
            ) : (
              "Apply now"
            )}
          </button>
        )}
      </div>
    </article>
  );
}
