import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { default as DeviceLinkModal } from './../modals/DeviceLinkModal';
import { default as DeviceUnlinkModal } from './../modals/DeviceUnlinkModal';
import styles from "./DeviceInfoContainer.module.css";
import Toast from '../Toast';

function DeviceInfoContainer(props) {
  const backendHost = useMemo(() => (
    process.env.NODE_ENV === 'production'
      ? `${window.location.origin}/api`
      : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`
  ), []);

  //DEVICE INFO
  const [linkButton, setLinkButton] = useState();
  const [unlinkButton, setUnlinkButton] = useState(true);
  const [network, setNetwork] = useState('Not Set');
  const [station, setStation] = useState('Not Set');
  const [longitude, setLongitude] = useState('Not Set');
  const [latitude, setLatitude] = useState('Not Set');
  const [elevation, setElevation] = useState('Not Set');
  const [status, setStatus] = useState('Not Linked');
  const [prefillLocation, setPrefillLocation] = useState({ longitude: '', latitude: '', elevation: '' });
  const [healthStatus, setHealthStatus] = useState({ network: null, time: null, checking: false });

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const formatDisplayValue = (value, suffix) => {
    if (value === null || value === undefined || value === '') return 'Not Set';
    const numericValue = Number(value);
    const printable = Number.isNaN(numericValue) ? value : numericValue;
    return suffix ? `${printable}${suffix}` : printable;
  };

  const getDeviceInfo = async () => {
    try {
      const response = await axios.get(`${backendHost}/device/info`)
      const deviceInfo = response.data.payload;

      const mergedLongitude = deviceInfo.longitude ?? deviceInfo.hostConfig?.longitude;
      const mergedLatitude = deviceInfo.latitude ?? deviceInfo.hostConfig?.latitude;
      const mergedElevation = deviceInfo.elevation ?? deviceInfo.hostConfig?.elevation;

      setNetwork(deviceInfo.network || deviceInfo.hostConfig?.network || 'Not Set');
      setStation(deviceInfo.station || deviceInfo.hostConfig?.station || 'Not Set');
      setLongitude(formatDisplayValue(mergedLongitude, '°'));
      setLatitude(formatDisplayValue(mergedLatitude, '°'));
      setElevation(formatDisplayValue(mergedElevation, 'm'));
      setStatus(deviceInfo.linked ? "Linked" : "Not Linked");
      setLinkButton(Boolean(deviceInfo.linked)); // disabled when linked
      setUnlinkButton(!deviceInfo.linked); // enabled when linked

      setPrefillLocation({
        longitude: mergedLongitude ?? '',
        latitude: mergedLatitude ?? '',
        elevation: mergedElevation ?? '',
      });

    } catch (error) {
      console.log("Axios Error: " + error)
    }
  }

  const runHealthChecks = async () => {
    setHealthStatus((prev) => ({ ...prev, checking: true }));

    try {
      const [networkResp, timeResp] = await Promise.all([
        axios.get(`${backendHost}/health/network`),
        axios.get(`${backendHost}/health/time`),
      ]);

      setHealthStatus({
        checking: false,
        network: networkResp.data.payload,
        time: timeResp.data.payload,
      });
    } catch (error) {
      console.log("Health check error: ", error);
      setHealthStatus({ checking: false, network: null, time: null });
      setToastMessage('Health check failed. See console for details.');
      setToastType('error');
      setTimeout(() => setToastMessage(''), 5000);
    }
  }

  useEffect(() => {
    getDeviceInfo()
  }, [backendHost])

  const handleOnLinkingSuccess = () => {
    getDeviceInfo();

    // Set Toast Message
    setToastMessage('Device Successfully Linked');
    setToastType('success');

    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  }

  const handleOnUnlinkingSuccess = () => {
    props.setRefreshFlag((prev) => !prev); // Other container uses this flag to refresh their content
    getDeviceInfo();

    // Set Toast Message
    setToastMessage('Device Successfully Unlinked');
    setToastType('success');

    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  }

  const handleResetLinkState = async () => {
    try {
      await axios.post(`${backendHost}/device/reset-link`, { localOnly: true });
      props.setRefreshFlag((prev) => !prev);
      getDeviceInfo();
      setToastMessage('Local link state cleared');
      setToastType('success');
    } catch (error) {
      console.log(error);
      setToastType('error');
      setToastMessage('Unable to clear link state. See console for details.');
    } finally {
      setTimeout(() => {
        setToastMessage('');
      }, 5000);
    }
  }

  const healthSummary = () => {
    if (healthStatus.checking) return 'Running...';
    if (!healthStatus.network && !healthStatus.time) return 'Not run';
    const networkOk = healthStatus.network?.dns?.ok && healthStatus.network?.tcp?.ok && healthStatus.network?.https?.ok;
    const offset = healthStatus.time?.offsetMs ?? null;
    const offsetSummary = offset !== null ? `${Math.round(offset)} ms` : 'n/a';
    return `${networkOk ? 'Network OK' : 'Check network'} • Clock offset: ${offsetSummary}`;
  }

  //MODAL STATES
  const [showDeviceLinkModal, setDeviceLinkModalShow] = useState(false);
  const [showDeviceUnlinkModal, setDeviceUnlinkModalShow] = useState(false);

  return (
    <div className={styles.deviceInfo}>
      <Toast message={toastMessage} toastType={toastType}></Toast>

      {showDeviceLinkModal && <DeviceLinkModal prefillLocation={prefillLocation} onModalClose={() => setDeviceLinkModalShow(false)} onLinkingSuccess={handleOnLinkingSuccess} />}
      {showDeviceUnlinkModal && <DeviceUnlinkModal onModalClose={() => setDeviceUnlinkModalShow(false)} onUnlinkingSuccess={handleOnUnlinkingSuccess} />}

      <>
        <div className={styles.panelHeader}>
          <p>Device Information</p>
        </div>
        <div className={styles.panelBody}>
          <table>
            <tbody>
              <tr>
                <td className={styles.label}>Network</td>
                <td>:</td>
                <td className={styles.labelValue}>{network}</td>
              </tr>
              <tr>
                <td className={styles.label}>Station</td>
                <td>:</td>
                <td className={styles.labelValue}>{station}</td>
              </tr>
              <tr>
                <td className={styles.label}>Longitude</td>
                <td>:</td>
                <td className={styles.labelValue}>{longitude}</td>
              </tr>
              <tr>
                <td className={styles.label}>Latitude</td>
                <td>:</td>
                <td className={styles.labelValue}>{latitude}</td>
              </tr>
              <tr>
                <td className={styles.label}>Elevation</td>
                <td>:</td>
                <td className={styles.labelValue}>{elevation}</td>
              </tr>
              <tr>
                <td>Device Status</td>
                <td>:</td>
                <td className={styles.labelValue}>
                  <p className={(status === 'Not Linked') ? styles.unlinkedLabel : styles.linkedLabel}>{status}</p>
                </td>
              </tr>
            </tbody>
          </table>

          <div className={styles.healthSection}>
            <div className={styles.healthHeader}>
              <p>Device Health</p>
              <button className={styles.secondaryButton} onClick={runHealthChecks} disabled={healthStatus.checking}>
                {healthStatus.checking ? 'Checking...' : 'Run Checks'}
              </button>
            </div>
            <div className={styles.healthSummary}>{healthSummary()}</div>
          </div>

          <div className={styles.buttonDiv}>
            <button
              className={styles.openLinkModalButton}
              disabled={linkButton}
              onClick={() => setDeviceLinkModalShow(true)}
            >Link</button>
            <button
              className={styles.openUnlinkModalButton}
              disabled={unlinkButton}
              onClick={() => setDeviceUnlinkModalShow(true)}
              hidden={false}
            >Unlink</button>
            <button
              className={styles.secondaryButton}
              onClick={handleResetLinkState}
            >Reset Link State</button>
          </div>
        </div>
      </>
    </div>
  );
}

export default DeviceInfoContainer;
