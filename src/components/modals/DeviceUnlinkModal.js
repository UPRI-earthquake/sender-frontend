import React, { useRef } from "react";
import styles from './Modal.module.css'

function DeviceUnlinkModal(props) {
	const toast = useRef(null); //TOAST

	//HANDLE LINK FORM SUBMIT
	const handleDeviceUnlink = (event) => {
		event.preventDefault();
		// TODO: unlink device codeflow

		// toast.current.show({ severity: 'success', summary: 'Unlinking Success', detail: 'Device-Account Unlinked', life: 3000 });
	}

  const handleModalClose = (event) => {
    event.preventDefault();

    props.onModalClose();
  }

	return (
		<>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
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
