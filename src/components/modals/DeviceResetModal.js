import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from './Modal.module.css'
import Toast from "../Toast.js";
import LoadingScreen from "../LoadingScreen";

function DeviceResetModal(props) {
  const [loadingScreen, setLoadingScreen] = useState(false);
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

    return () => {
      if (props.onResettingChange) {
        props.onResettingChange(false);
      }
    };
  }, [props.onResettingChange]);

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('error')

  const handleDeviceReset = async(event) => {
    event.preventDefault();
    setLoadingScreen(true);
    if (props.onResettingChange) {
      props.onResettingChange(true);
    }

    try {
      const backend_host = process.env.NODE_ENV === 'production'
        ? `${window.location.origin}/api`
        : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`;

      await axios.post(`${backend_host}/device/reset-link`);

      if (props.onResetSuccess) {
        props.onResetSuccess();
      }
      props.onModalClose();
    } catch (error) {
      console.log(error);
      let errorSummary = "Unable to reset link. Try again in a moment.";

      if (error.code === "ERR_NETWORK") {
        errorSummary = error.message;
      } else if (error?.response?.data?.message) {
        errorSummary = error.response.data.message;
      }

      setTimeout(() => {
        setLoadingScreen(false);
        if (props.onResettingChange) {
          props.onResettingChange(false);
        }
        setToastType('error');
        setToastMessage(errorSummary);
        setTimeout(() => {
          setToastMessage('');
        }, 5000);
      }, 300);
      return;
    }

    if (props.onResettingChange) {
      props.onResettingChange(false);
    }
    setLoadingScreen(false);
  }

  const handleModalClose = (event) => {
    event.preventDefault();

    if (props.onResettingChange) {
      props.onResettingChange(false);
    }
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
            Reset Device Link
          </div>

          <div>
            <p>This will remove the device from your account and clear all link data from this device and the server. Use this if the link is broken or you want to link this device to a different account.</p>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.submitBtn} onClick={handleDeviceReset} disabled={loadingScreen}>Confirm</button>
            <button className={styles.cancelBtn} onClick={handleModalClose} disabled={loadingScreen}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default DeviceResetModal;
