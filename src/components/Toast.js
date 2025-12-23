import React, { useEffect, useState } from "react";
import styles from "./Toast.module.css";

function Toast(props) {
  const toastMessage = props.message || '';
  const toastType = props.toastType || 'success';
  const onDismiss = props.onDismiss;
  const [visible, setVisible] = useState(Boolean(toastMessage));

  useEffect(() => {
    setVisible(Boolean(toastMessage));
  }, [toastMessage]);

  const handleClose = () => {
    setVisible(false);
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  if (!toastMessage || !visible) {
    return null;
  }

  return (
    <div className={styles.toastContainer}>
      <div className={`${styles.toast} ${toastType === 'error' ? styles.error : styles.success}`}>
        <p className={styles.toastMessage}>{toastMessage}</p>
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast
