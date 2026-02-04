import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from './Modal.module.css'
import Toast from "../Toast.js";
import LoadingScreen from "../LoadingScreen";

function DeviceResetModal(props) {
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
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

      const response = await axios.post(`${backend_host}/device/reset-link`);
      const payload = response?.data?.payload || {};
      const message = response?.data?.message || 'Device link reset. Use Link Device to link this device again.';
      const toastType = payload?.remoteReset === false ? 'warning' : 'success';

      if (props.onResetSuccess) {
        props.onResetSuccess({ message, toastType });
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

          <div className={styles.modalHeader}>Reset Device Link</div>

          <div className={styles.modalBodyCopy}>
            <p className={styles.warningTitle}>Destructive reset</p>
            <p className={styles.warningText}>
              {props.linkState === 'unlinked'
                ? 'No active link detected. This cleans up stored credentials before relinking.'
                : 'Clears stored credentials and removes this device from its current account.'}
            </p>
            <ul className={styles.warningList}>
              <li>Stops sending data until the device is linked again.</li>
              <li>Removes the account-device association on Earthquake Hub and locally.</li>
              <li>Relink to resume streaming.</li>
            </ul>
            <label className={styles.ackRow}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={loadingScreen}
              />
              <span>I understand this will unlink the device and stop data transmission.</span>
            </label>
          </div>

          <div className={styles.modalFooter}>
            <button
              className={styles.dangerBtn}
              onClick={handleDeviceReset}
              disabled={loadingScreen || !acknowledged}
            >
              Confirm reset
            </button>
            <button className={styles.cancelBtn} onClick={handleModalClose} disabled={loadingScreen}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default DeviceResetModal;
