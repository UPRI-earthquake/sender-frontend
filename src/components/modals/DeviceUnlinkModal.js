import React, { useEffect, useRef } from "react";
import styles from './Modal.module.css'

function DeviceUnlinkModal(props) {

  const modalRef = useRef(null);

  // ENTRANCE ANIMATION
  useEffect(() => {
    const modalEl = modalRef.current;
    modalEl.classList.remove(styles.hidden);
    modalEl.animate(
      [
        { opacity: 0, transform: 'scale(0.7)' },
        { opacity: 1, transform: 'scale(1)' }
      ],
      {
        duration: 150,
        easing: 'cubic-bezier(0, 0, 0.5, 1)'
      }
    );
  }, []);

	//HANDLE LINK FORM SUBMIT
	const handleDeviceUnlink = (event) => {
		event.preventDefault();
		// TODO: unlink device codeflow
	}

  const handleModalClose = (event) => {
    event.preventDefault();

    props.onModalClose();
  }

	return (
		<>
      <div className={styles.modalOverlay}>
        <div ref={modalRef} className={`${styles.modal} ${styles.hidden}`}>
          <div className={styles.modalHeader}>
            Unlink Device-to-Account
          </div>

          <div>
            <p>Are you sure to unlink this device to account?</p>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={handleModalClose} >Cancel</button>
            <button className={styles.submitBtn} onClick={handleDeviceUnlink}>Submit</button>
          </div>
        </div>
      </div>
		</>
	)
}

export default DeviceUnlinkModal;
