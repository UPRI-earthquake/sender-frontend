import React, { useState, useEffect, useRef } from "react";
import Toast from "../Toast.js";
import axios from 'axios';
import styles from './Modal.module.css'
import LoadingScreen from "../LoadingScreen.js";

function AddServerModal(props) {
  //FORM INPUT - ADD NEW SERVER
  const [hostsOptions, setHostsOptions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState();
  const [selectedHostUrl, setSelectedHostUrl] = useState();
  const [loadingScreen, setLoadingScreen] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchRingserverHosts();
  }, [])

  const fetchRingserverHosts = async () => {
    try {
      const backend_host = process.env.NODE_ENV === 'production'
        ? window['ENV'].REACT_APP_BACKEND_PROD
        : window['ENV'].REACT_APP_BACKEND_DEV
      const response = await axios.get(`${backend_host}/servers/ringserver-hosts`);
      setHostsOptions(response.data.payload)
      setSelectedHostUrl(response.data.payload[0].ringserverUrl + ':' + response.data.payload[0].ringserverPort)
      setSelectedInstitution(response.data.payload[0].username)
    } catch (error) {
      // Handle any error that occurred during the request
      console.error('Error:', error.message);
    }
  }

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

  const handleHostChange = async (event) => {
    setSelectedHostUrl(event.target.value);
    const institution = hostsOptions.find((host) => 
      (host.ringserverUrl + ':' + host.ringserverPort) === event.target.value);
    setSelectedInstitution(institution.username);
  }

  //HANDLE ADD SERVER FORM SUBMIT
  const handleAddServerSubmit = async (event) => {
    event.preventDefault();
    setLoadingScreen(true);

    try {
      // Make a POST request to the server using Axios
      const backend_host = process.env.NODE_ENV === 'production'
				? window['ENV'].REACT_APP_BACKEND_PROD
				: window['ENV'].REACT_APP_BACKEND_DEV;
      const response = await axios.post(`${backend_host}/servers/add`, {
        url: selectedHostUrl,
        institutionName: selectedInstitution
      });

      console.log(response);

      // Call onAddServerSuccess prop
      props.onAddServerSuccess();
      props.onModalClose();
      
      setLoadingScreen(false); // remove loading screen 
    } catch (error) {
      console.log(error);
			let errorSummary = "";

			if (error.code === "ERR_NETWORK") {
				errorSummary += error.message;
			} else if (error.response.data.message) {
				errorSummary += error.response.data.message;
			} 

      // remove loading screen after timeout
      setTimeout(() => {
        setLoadingScreen(false);
        // Set Toast Content
        setToastType('error');
        setToastMessage(`Add New Server Error: ${errorSummary}`);
      }, 1000);
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
        <div ref={modalRef} className={`${styles.modal} ${styles.hidden}`}>

          {/* Loading Screen */}
          {(loadingScreen) 
            ? ( <LoadingScreen/> )
            : ( <div></div> )}
          {/* End of Loading Screen */}

          <div className={styles.modalHeader}>
            Add Ringserver
          </div>
          <form>
            <div className={styles.modalBody}>
              <label className={styles.inputLabel}>Ringserver URL</label>
              <select value={selectedHostUrl} onChange={handleHostChange}>
                {hostsOptions.map((host, index) => (
                  <option key={index} value={host.ringserverUrl + ':' + host.ringserverPort}>
                    {host.username}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.submitBtn} onClick={handleAddServerSubmit}>Add</button>
              <button className={styles.cancelBtn} onClick={handleModalClose} >Cancel</button>
            </div>
          </form>
        </div>
      </div>

    </>
  )
}

export default AddServerModal;
