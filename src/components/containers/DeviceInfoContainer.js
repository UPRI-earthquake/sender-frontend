import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { default as DeviceLinkModal } from './../modals/DeviceLinkModal';
import { default as DeviceUnlinkModal } from './../modals/DeviceUnlinkModal';
import styles from "./DeviceInfoContainer.module.css";

function DeviceInfoContainer() {
	//DEVICE INFO
	const [linkButton, setLinkButton] = useState();
	const [unlinkButton, setUnlinkButton] = useState(true);
	const [network, setNetwork] = useState('Not Set');
	const [station, setStation] = useState('Not Set');
	const [location, setLocation] = useState('Not Set');
	const [elevation, setElevation] = useState('Not Set');
	const [status, setStatus] = useState('Unlinked');

	const getDeviceInfo = async () => {
		try {
			const backend_host = process.env.NODE_ENV === 'production'
				? process.env.REACT_APP_BACKEND_PROD
				: process.env.REACT_APP_BACKEND_DEV;
			const response = await axios.get(`${backend_host}/deviceInfo`)
			console.log(response)
			// Set device information
			if (response.data.streamId != null) {
				setNetwork(response.data.network)
				setStation(response.data.station)
				setLocation(response.data.location)
				setElevation(response.data.elevation)
				setStatus("Linked")
				setLinkButton(true); //disabled = true
				setUnlinkButton(false); //enabled = false
			} else{
				setStatus("Unlinked")
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
	}

	//MODAL STATES
	const [showDeviceLinkModal, setDeviceLinkModalShow] = useState(false);
	const [showDeviceUnlinkModal, setDeviceUnlinkModalShow] = useState(false);

	return (
    <div className={styles.deviceInfo}>
			{showDeviceLinkModal && <DeviceLinkModal onModalClose={() => setDeviceLinkModalShow(false)} onLinkingSuccess={handleOnLinkingSuccess} />}

			<DeviceUnlinkModal show={showDeviceUnlinkModal} close={() => setDeviceUnlinkModalShow(false)}></DeviceUnlinkModal>


      <>
        <div className={styles.panelHeader}>
          <p>Device Information</p>
        </div>
        <div className={styles.panelBody}>
          <table>
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
              <td className={styles.label}>Location</td>
              <td>:</td>
              <td className={styles.labelValue}>{location}</td>
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
                <p className={(status === 'Unlinked') ? styles.unlinkedLabel : styles.linkedLabel}>{status}</p>
              </td>
            </tr>
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
              >Unlink</button>
            </div>
        </div>
      </>
		</div>
	);
}

export default DeviceInfoContainer;
