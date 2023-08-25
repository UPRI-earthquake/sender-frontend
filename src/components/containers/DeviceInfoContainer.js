import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { default as DeviceLinkModal } from './../modals/DeviceLinkModal';
import { default as DeviceUnlinkModal } from './../modals/DeviceUnlinkModal';
import styles from "./DeviceInfoContainer.module.css";
import Toast from '../Toast';

function DeviceInfoContainer(props) {
  //DEVICE INFO
  const [linkButton, setLinkButton] = useState();
  const [unlinkButton, setUnlinkButton] = useState(true);
  const [network, setNetwork] = useState('Not Set');
  const [station, setStation] = useState('Not Set');
  const [longitude, setLongitude] = useState('Not Set');
  const [latitude, setLatitude] = useState('Not Set');
  const [elevation, setElevation] = useState('Not Set');
  const [status, setStatus] = useState('Not Linked');

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const getDeviceInfo = async () => {
    try {
      const backend_host = process.env.NODE_ENV === 'production'
        ? window['ENV'].REACT_APP_BACKEND_PROD
        : window['ENV'].REACT_APP_BACKEND_DEV;
      const response = await axios.get(`${backend_host}/device/info`)
      console.log(response)
      const deviceInfo = response.data.payload;
      
      // Set device information
      if (deviceInfo.streamId != null) {
        setNetwork(deviceInfo.network)
        setStation(deviceInfo.station)
        setLongitude(`${deviceInfo.longitude}°`)
        setLatitude(`${deviceInfo.latitude}°`)
        setElevation(`${deviceInfo.elevation}m`)
        setStatus("Linked")
        setLinkButton(true); //disabled = true
        setUnlinkButton(false); //enabled = false
      } else {
        setNetwork('Not Set')
        setStation('Not Set')
        setLongitude('Not Set')
        setLatitude('Not Set')
        setElevation('Not Set')
        setStatus("Not Linked")
        setLinkButton(false); //disabled = false
        setUnlinkButton(true); //disabled = true
      }

    } catch (error) {
      console.log("Axios Error: " + error)
    }
  }

  useEffect(() => {
    getDeviceInfo()
  }, [])

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
    props.sendReloadFlag(); // Send reload flag to Body.js
    getDeviceInfo();

    // Set Toast Message
    setToastMessage('Device Successfully Unlinked');
    setToastType('success');

    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  }

  //MODAL STATES
  const [showDeviceLinkModal, setDeviceLinkModalShow] = useState(false);
  const [showDeviceUnlinkModal, setDeviceUnlinkModalShow] = useState(false);

  return (
    <div className={styles.deviceInfo}>
      <Toast message={toastMessage} toastType={toastType}></Toast>

      {showDeviceLinkModal && <DeviceLinkModal onModalClose={() => setDeviceLinkModalShow(false)} onLinkingSuccess={handleOnLinkingSuccess} />}
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
          </div>
        </div>
      </>
    </div>
  );
}

export default DeviceInfoContainer;
