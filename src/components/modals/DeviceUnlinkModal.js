import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from './Modal.module.css'
import Toast from "../Toast.js";

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

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('error')

	//HANDLE LINK FORM SUBMIT
	const handleDeviceUnlink = async(event) => {
		event.preventDefault();

    try {
			const backend_host = process.env.NODE_ENV === 'production'
				? window['ENV'].REACT_APP_BACKEND_PROD
				: window['ENV'].REACT_APP_BACKEND_DEV;
			await axios.post(`${backend_host}/device/unlink`);

      // Call onUnlinkingSuccess prop
			props.onUnlinkingSuccess();
      props.onModalClose();

		} catch (error) {
			console.log(error);
			let errorSummary = "";

			if (error.code === "ERR_NETWORK") {
				errorSummary += error.message;
			} else if (error.response.data.message) {
				errorSummary += error.response.data.message;
			}

      // Set Toast Content
      setToastType('error');
      setToastMessage(`Device Linking Error: ${errorSummary}`);
		}
	}

  const handleModalClose = (event) => {
    event.preventDefault();

    props.onModalClose();
  }

	return (
		<>
      <Toast message={toastMessage} toastType={toastType}></Toast>

      <div className={styles.modalOverlay}>
        <div ref={modalRef} className={`${styles.modal} ${styles.hidden}`}>
          <div className={styles.modalHeader}>
            Unlink Device-to-Account
          </div>

          <div>
            <p>Are you sure you want to unlink this device to account?</p>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.submitBtn} onClick={handleDeviceUnlink}>Confirm</button>
            <button className={styles.cancelBtn} onClick={handleModalClose} >Cancel</button>
          </div>
        </div>
      </div>
		</>
	)
}

export default DeviceUnlinkModal;
