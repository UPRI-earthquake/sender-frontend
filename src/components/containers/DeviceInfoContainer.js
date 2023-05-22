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
	const [channel, setChannel] = useState('Not Set');
	const [status, setStatus] = useState('Unlinked');

	const getDeviceInfo = async () => {
		try {
			const backend_host = process.env.REACT_APP_BACKEND_DEV
			const response = await axios.get(`${backend_host}/deviceInfo`)
			console.log(response)
			// Set device information
			if (response.data.streamId != null) {
				setNetwork(response.data.network)
				setStation(response.data.station)
				setLocation(response.data.location)
				setElevation(response.data.elevation)
				setChannel(response.data.channel)
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
				Network:
				<Tag className="m-1" severity="info" value={network}></Tag><br></br>
				Station:
				<Tag className="m-1" severity="info" value={station}></Tag><br></br>
				Location:
				<Tag className="m-1" severity="info" value={location}></Tag><br></br>
				Elevation:
				<Tag className="m-1" severity="info" value={elevation}></Tag><br></br>
				Channel:
				<Tag className="m-1" severity="info" value={channel}></Tag><br></br>
				Device Status:
				<Tag className="m-2 mt-1" icon={statusIcon} severity={statusBadgeBackground} value={status}></Tag><br></br>

				<div className="d-grid gap-2">
					<Button
						label="Link"
						severity="success"
						size="sm"
						rounded text raised
						disabled={linkButton}
						onClick={() => setDeviceLinkModalShow(true)}
					>
					</Button>
					<Button
						label="Unlink"
						severity="danger"
						size="sm"
						rounded text raised
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
