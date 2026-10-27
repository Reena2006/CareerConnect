import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";

/**
 * Polished replacement for window.confirm().
 * Keyboard: Escape cancels, Enter confirms, focus moves into the dialog.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  return (
    <div
      className="cc-modal-bg"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="cc-dialog narrow">
        <div className="modalhead">
          <div>
            <h3>{title}</h3>
            <p className="sub">This action needs your confirmation.</p>
          </div>
          <span className={"modal-icon" + (danger ? " danger" : "")}>
            <Icon name={danger ? "alert" : "info"} size={17} />
          </span>
        </div>

        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={"btn " + (danger ? "btn-danger" : "btn-primary") + (busy ? " is-loading" : "")}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
