import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';
import { Tag, Button } from 'primereact';
import { useSelector, useDispatch } from "react-redux";
import { setDeviceNetwork, setDeviceStation, setDeviceLocation, setDeviceStatus, unsetDeviceNetwork, } from '../redux/deviceInfo';
import { default as DeviceLinkModal } from './DeviceLinkModal';
import { default as DeviceUnlinkModal } from './DeviceUnlinkModal';

function DeviceInfoContainer() {
	//DEVICE INFO
	const [deviceStatusBadgeBackground, setDeviceStatusBadgeBackground] = useState('danger');
	const [deviceStatusIcon, setDeviceStatusIcon] = useState('pi pi-times');
	const [linkButton, setLinkButton] = useState();
	const [unlinkButton, setUnlinkButton] = useState();
	const { network: deviceNetwork,
		station: deviceStation,
		location: deviceLocation,
		status: deviceStatus } = useSelector((state) => state.deviceInfo);
	const dispatch = useDispatch();

	useEffect(() => {
		axios.get('/deviceInfo')
		.then(res => {
			dispatch(setDeviceNetwork(res.data.network));
			dispatch(setDeviceStation(res.data.station));
			dispatch(setDeviceLocation(res.data.location));
			dispatch(setDeviceStatus(res.data.linkingStatus));
			if (res.data.linkingStatus === 'Linked') {
				setDeviceStatusBadgeBackground("success");
				setDeviceStatusIcon('pi pi-check');
				setLinkButton(false); //disabled = false
				setUnlinkButton(true); //enabled = true
			} else{
				setLinkButton(false); //disabled = false
				setUnlinkButton(true); //disabled = true
			}
		})
		.catch(err => console.log(err))
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
						<Tag className="m-1" severity="info" value={deviceNetwork}></Tag><br></br>
						Station:
						<Tag className="m-1" severity="info" value={deviceStation}></Tag><br></br>
						Location:
						<Tag className="m-1" severity="info" value={deviceLocation}></Tag><br></br>
						Device Status:
						<Tag className="m-2 mt-1" icon={deviceStatusIcon} severity={deviceStatusBadgeBackground} value={deviceStatus}></Tag><br></br>

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