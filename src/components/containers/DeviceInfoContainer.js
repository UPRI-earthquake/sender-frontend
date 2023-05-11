import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';
import { Tag, Button } from 'primereact';
import { default as DeviceLinkModal } from './../modals/DeviceLinkModal';
import { default as DeviceUnlinkModal } from './../modals/DeviceUnlinkModal';

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
			const response = await axios.get('http://localhost:5001/deviceInfo')
			// console.log(response.data)
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
				setLinkButton(false); //disabled = false
				setUnlinkButton(true); //enabled = true
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

	//MODAL STATES
	const [showDeviceLinkModal, setDeviceLinkModalShow] = useState(false);
	const [showDeviceUnlinkModal, setDeviceUnlinkModalShow] = useState(false);

	return (
		<>
			<DeviceLinkModal show={showDeviceLinkModal} close={() => setDeviceLinkModalShow(false)}></DeviceLinkModal>

			<DeviceUnlinkModal show={showDeviceUnlinkModal} close={() => setDeviceUnlinkModalShow(false)}></DeviceUnlinkModal>

			<Card border="primary">
				<Card.Header>Device Info</Card.Header>
				<Card.Body>
					<Card.Text>
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
					</Card.Text>
				</Card.Body>
			</Card>
		</>
	);
}

export default DeviceInfoContainer;