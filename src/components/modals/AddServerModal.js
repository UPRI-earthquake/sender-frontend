import React, { useState } from "react";
import Toast from "../Toast.js";
import axios from 'axios';
import styles from './Modal.module.css'

function AddServerModal(props) {
  //FORM INPUT - ADD NEW SERVER
  const [inputUrl, setInputUrl] = useState('');
  const [inputHostName, setInputHostName] = useState('');

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('error')

  //HANDLE ADD SERVER FORM SUBMIT
  const handleAddServerSubmit = async (event) => {
    event.preventDefault();

    try {
      // Make a POST request to the server using Axios
      const backend_host = process.env.NODE_ENV === 'production'
				? process.env.REACT_APP_BACKEND_PROD
				: process.env.REACT_APP_BACKEND_DEV;
      const response = await axios.post(`${backend_host}/servers/add`, {
        hostName: inputHostName,
        url: inputUrl,
      });

      console.log(response);
      setInputUrl('');
      setInputHostName('');

      // Call onAddServerSuccess prop
      props.onAddServerSuccess();
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
      setToastMessage(`Add New Server Error: ${errorSummary}`);
    }
  };

  const handleModalClose = (event) => {
    event.preventDefault();

    props.onModalClose();
  }

  return (
    <>
      <Toast message={toastMessage} toastType={toastType}></Toast>

      <div className={styles.modalOverlay}> 
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            Add Ringserver
          </div>
          <form>
            <div className={styles.modalBody}>
              <div className={styles.inputField}>
                <input
                  className={styles.modalInput}
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  autoFocus
                />
                <label className={styles.inputLabel}>Ringserver URL</label>
              </div>

              <div className={styles.inputField}>
                <input
                  className={styles.modalInput}
                  value={inputHostName}
                  onChange={(e) => setInputHostName(e.target.value)}
                />
                <label className={styles.inputLabel}>Host Name</label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={handleModalClose} >Cancel</button>
              <button className={styles.submitBtn} onClick={handleAddServerSubmit}>Submit</button>
            </div>
          </form>
        </div>
      </div>

    </>
  )
}

export default AddServerModal;
