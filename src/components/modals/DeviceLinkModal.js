import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from './Modal.module.css'
import Toast from "../Toast.js";
import LoadingScreen from "../LoadingScreen";

function DeviceLinkModal(props) {
	//FORM INPUT - DEVICE LINK
	const [inputUsername, setInputUsername] = useState('');
	const [inputPassword, setInputPassword] = useState('');
	const [inputLongitude, setInputLongitude] = useState('');
  const [inputLatitude, setInputLatitude] = useState('');
  const [inputElevation, setInputElevation] = useState('');
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
  }, []);

  useEffect(() => {
    if (props.prefillLocation) {
      const defaultLon = props.prefillLocation.longitude;
      const defaultLat = props.prefillLocation.latitude;
      const defaultElev = props.prefillLocation.elevation;

      setInputLongitude(defaultLon === null || defaultLon === undefined ? '' : String(defaultLon));
      setInputLatitude(defaultLat === null || defaultLat === undefined ? '' : String(defaultLat));
      setInputElevation(defaultElev === null || defaultElev === undefined ? '' : String(defaultElev));
    }
  }, [props.prefillLocation]);

  // TOASTS
 const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('error')

	//HANDLE LINK FORM SUBMIT
	const handleDeviceLink = async (event) => {
		event.preventDefault();

    const trimmedLongitude = String(inputLongitude || '').trim();
    const trimmedLatitude = String(inputLatitude || '').trim();
    const trimmedElevation = String(inputElevation || '').trim();

    const lon = Number(trimmedLongitude);
    const lat = Number(trimmedLatitude);
    const elev = Number(trimmedElevation);

    if (!trimmedLongitude || !trimmedLatitude || !trimmedElevation) {
      setToastType('error');
      setToastMessage('Device Linking Error: Longitude, latitude, and elevation are required.');
      return;
    }

    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      setToastType('error');
      setToastMessage('Device Linking Error: Longitude must be a number between −180 and 180.');
      return;
    }

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setToastType('error');
      setToastMessage('Device Linking Error: Latitude must be a number between −90 and 90.');
      return;
    }

    if (Number.isNaN(elev)) {
      setToastType('error');
      setToastMessage('Device Linking Error: Elevation must be a numeric value.');
      return;
    }

    setLoadingScreen(true);

		try {
			const backend_host = process.env.NODE_ENV === 'production'
        ? `${window.location.origin}/api`
        : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`;
			await axios.post(`${backend_host}/device/link`, {
				username: inputUsername,
				password: inputPassword,
        longitude: String(trimmedLongitude),
        latitude: String(trimmedLatitude),
        elevation: String(trimmedElevation),
			});

			setInputUsername('');
			setInputPassword('');
      setInputLongitude('');
      setInputLatitude('');
      setInputElevation('');
			
      setLoadingScreen(false); // remove loading screen

			// Call onLinkingSuccess prop
			props.onLinkingSuccess();
      props.onModalClose();
      
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

      // remove loading screen after timeout
      setTimeout(() => {
        setLoadingScreen(false);
        // Set Toast Content
        setToastType('error');
        setToastMessage(`Device Linking Error: ${errorSummary}`);
      }, 1000);
		}
	}

  const handleModalClose = (event) => {
    event.preventDefault();

    setInputUsername('');
		setInputPassword('');
    setInputLongitude(props.prefillLocation?.longitude === null || props.prefillLocation?.longitude === undefined ? '' : String(props.prefillLocation?.longitude));
    setInputLatitude(props.prefillLocation?.latitude === null || props.prefillLocation?.latitude === undefined ? '' : String(props.prefillLocation?.latitude));
    setInputElevation(props.prefillLocation?.elevation === null || props.prefillLocation?.elevation === undefined ? '' : String(props.prefillLocation?.elevation));

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

              <div className={styles.inputField}>
                <input
                  className={styles.modalInput}
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={inputLongitude}
                  onChange={(e) => setInputLongitude(e.target.value)}
                />
                <label className={styles.inputLabel}>Longitude: <small>(in degree coordinates, −180 to 180; e.g. `10.1234`)</small></label>
              </div>

              <div className={styles.inputField}>
                <input
                  className={styles.modalInput}
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={inputLatitude}
                  onChange={(e) => setInputLatitude(e.target.value)}
                />
                <label className={styles.inputLabel}>Latitude: <small>(in degree coordinates, −90 to 90; e.g. `10.1234`)</small></label>
              </div>

              <div className={styles.inputField}>
                <input
                  className={styles.modalInput}
                  type="number"
                  step="0.01"
                  value={inputElevation}
                  onChange={(e) => setInputElevation(e.target.value)}
                />
                <label className={styles.inputLabel}>Elevation: <small>(in meters; relative to sea level e.g. `1.23`)</small></label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.submitBtn} onClick={handleDeviceLink}>Submit</button>
              <button className={styles.cancelBtn} onClick={handleModalClose} >Cancel</button>
            </div>
          </form>
        </div>
      </div>
		</>
	)
}

export default DeviceLinkModal;
