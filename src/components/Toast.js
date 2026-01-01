import React, { useEffect, useState } from "react";
import styles from "./Toast.module.css";

const ICONS = {
  success: "✓",
  error: "⚠",
  warning: "⚠",
  info: "ℹ",
};

function Toast({ message = "", toastType = "info", onDismiss }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
  }, [message]);

  const handleClose = () => {
    setVisible(false);
    if (typeof onDismiss === "function") onDismiss();
  };

  if (!message || !visible) return null;

  const typeClass =
    toastType === "success"
      ? styles.success
      : toastType === "error"
      ? styles.error
      : toastType === "warning"
      ? styles.warning
      : styles.info;

  return (
    <div className={styles.toastContainer} role="status" aria-live="polite">
      <div className={`${styles.toast} ${typeClass}`}>
        <span className={styles.icon} aria-hidden="true">
          {ICONS[toastType] || ICONS.info}
        </span>
        <p className={styles.toastMessage}>{message}</p>
        {typeof onDismiss === "function" && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default Toast;
