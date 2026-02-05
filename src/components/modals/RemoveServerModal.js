import React, { useEffect, useRef, useState } from 'react';
import styles from './Modal.module.css';

function RemoveServerModal({ url, institutionName, onConfirm, onModalClose }) {
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return;
    modalEl.classList.remove(styles.hidden);
    modalEl.animate(
      [
        { opacity: 0, transform: 'scale(0.7)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      {
        duration: 150,
        easing: 'cubic-bezier(0, 0, 0.5, 1)',
      },
    );
  }, []);

  const handleConfirm = async (event) => {
    event.preventDefault();
    if (!onConfirm || !url) {
      onModalClose?.();
      return;
    }
    try {
      setSubmitting(true);
      await onConfirm(url);
      onModalClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (event) => {
    event.preventDefault();
    if (!submitting) {
      onModalClose?.();
    }
  };

  const label = institutionName || url || 'this server';

  return (
    <div className={styles.modalOverlay}>
      <div ref={modalRef} className={`${styles.modal} ${styles.hidden}`}>
        <div className={styles.modalHeader}>
          Remove ringserver endpoint
        </div>
        <div className={styles.modalBody}>
          <p>
            Are you sure you want to remove
            {' '}
            <strong>{label}</strong>
            {' '}
            from this sender?
          </p>
          {url && (
            <p>
              <code>{url}</code>
            </p>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Removing…' : 'Remove'}
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RemoveServerModal;

