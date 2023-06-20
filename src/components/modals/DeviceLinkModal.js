import React, { useState, useRef } from "react";
import { Toast } from 'primereact';
import axios from "axios";
import styles from './Modal.module.css'

function DeviceLinkModal(props) {
	//FORM INPUT - DEVICE LINK
	const [inputUsername, setInputUsername] = useState('');
	const [inputPassword, setInputPassword] = useState('');
	const toast = useRef(null); //TOAST

	//HANDLE LINK FORM SUBMIT
	const handleDeviceLink = async (event) => {
		event.preventDefault();

		try {
			const backend_host = process.env.NODE_ENV === 'production'
				? process.env.REACT_APP_BACKEND_PROD
				: process.env.REACT_APP_BACKEND_DEV;
			await axios.post(`${backend_host}/deviceLinkRequest`, {
				username: inputUsername,
				password: inputPassword
			});

			setInputUsername('');
			setInputPassword('');
			toast.current.show({
				severity: 'success',
				summary: 'Linking Success',
				detail: 'Device Link Request Successful',
				life: 3000
			});

			// Call onLinkingSuccess prop
			props.onLinkingSuccess();
			props.close();

		} catch (error) {
			console.log(error);
			let errorSummary = "";

			if (error.code === "ERR_NETWORK") {
				errorSummary += error.message;
			} else if (error.response.data.validationErrors) {
				error.response.data.validationErrors.forEach(error => {
					errorSummary += error.msg + ", \n";
				});
			} else if (error.response.data.message) {
				errorSummary += error.response.data.message;
			}

			toast.current.show({
				severity: 'error',
				summary: 'Device Linking Failed',
				detail: errorSummary,
				life: 3000
			});
		}
	}

  const handleModalClose = (event) => {
    event.preventDefault();

    setInputUsername('');
		setInputPassword('');

    props.onModalClose();
  }

	return (
		<>
			<Toast ref={toast} ></Toast>

      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <form>
            <div className={styles.modalHeader}>
              Device-to-Account Link
            </div>

            <div className={styles.modalBody}>
              <div className={styles.inputField}>
                <input
                  className={styles.modalInput}
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  autoFocus
                />
                <label className={styles.inputLabel}>Username</label>
              </div>

              <div className={styles.inputField}>
                <input
                type="password"
                  className={styles.modalInput}
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                />
                <label className={styles.inputLabel}>Password</label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={handleModalClose} >Cancel</button>
              <button className={styles.submitBtn} onClick={handleDeviceLink}>Submit</button>
            </div>
          </form>
        </div>
      </div>
		</>
	)
}

export default DeviceLinkModal;
