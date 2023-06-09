import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tag, Button, Panel } from 'primereact';
import { default as DeviceLinkModal } from './../modals/DeviceLinkModal';
import { default as DeviceUnlinkModal } from './../modals/DeviceUnlinkModal';
import styles from "./DeviceInfoContainer.module.css";

function DeviceInfoContainer() {
	//DEVICE INFO
	const [statusBadgeBackground, setStatusBadgeBackground] = useState('danger');
	const [statusIcon, setStatusIcon] = useState('pi pi-times');
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
				setStatusBadgeBackground("success");
				setStatusIcon('pi pi-check');
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
			<DeviceLinkModal show={showDeviceLinkModal} close={() => setDeviceLinkModalShow(false)} onLinkingSuccess={handleOnLinkingSuccess}></DeviceLinkModal>

			<DeviceUnlinkModal show={showDeviceUnlinkModal} close={() => setDeviceUnlinkModalShow(false)}></DeviceUnlinkModal>

			<Panel header="Device Information">
				<div className={styles.elementSpacing}>
					<div className={styles.tagContainer}>
						<div className={styles.tagLabel}>Network:</div>
						<Tag className={styles.tagValue} severity="info" value={network}></Tag>
					</div>
				</div>
				<div className={styles.elementSpacing}>
					<div className={styles.tagContainer}>
						<div className={styles.tagLabel}>Station:</div>
						<Tag className={styles.tagValue} severity="info" value={station}></Tag>
					</div>
				</div>
				<div className={styles.elementSpacing}>
					<div className={styles.tagContainer}>
						<div className={styles.tagLabel}>Location:</div>
						<Tag className={styles.tagValue} severity="info" value={location}></Tag>
					</div>
				</div>
				<div className={styles.elementSpacing}>
					<div className={styles.tagContainer}>
						<div className={styles.tagLabel}>Elevation:</div>
						<Tag className={styles.tagValue} severity="info" value={elevation}></Tag>
					</div>
				</div>
				<div className={styles.elementSpacing}>
					<div className={styles.tagContainer}>
						<div className={styles.tagLabel}>Device Status:</div>
						<Tag className={styles.tagValue} icon={statusIcon} severity={statusBadgeBackground} value={status}></Tag>
					</div>
				</div>

				<div className={styles.buttonDiv}>
					<Button
						label="Link"
						severity="success"
						size="sm"
						text raised
						disabled={linkButton}
						onClick={() => setDeviceLinkModalShow(true)}
					>
					</Button>
					<Button
						label="Unlink"
						severity="danger"
						size="sm"
						text raised
						disabled={unlinkButton}
						onClick={() => setDeviceUnlinkModalShow(true)}
					>
					</Button>
				</div>
			</Panel>
		</div>
	);
}

export default DeviceInfoContainer;
