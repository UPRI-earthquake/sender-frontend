import React, { useEffect, useState, useRef } from 'react';
import { Button, DataTable, Column, InputSwitch, Tooltip, Panel, Toast } from 'primereact';
import { default as AddServerModal } from './../modals/AddServerModal';
import styles from "./ServersInfoContainer.module.css";

import axios from 'axios';

function ServersInfoContainer() {

	const toast = useRef(null); //TOAST

	//MODAL STATES
	const [showAddServerModal, setAddServerModalShow] = useState(false);

	const [servers, setServers] = useState([]);

	const fetchServers = async () => {
		const backend_host = process.env.REACT_APP_BACKEND_DEV
		const response = await axios.get(`${backend_host}/servers/getList`)
		setServers(response.data)
	}

	useEffect(() => {
    	fetchServers();
  	}, []);

	const handleAddServer = () => {
		fetchServers();
	}

	const renderSwitch = (rowData) => {
		return (
			<InputSwitch checked={rowData.isAllowedToStream}  onChange={(e) => handleToggleChange(e, rowData)}/>
		);
	}

	// Handler for on/off (stream/stop streaming)
	const handleToggleChange = async (event, rowData) => {
		try {
			// TODO: POST request to /device/stream endpoint
			const payload = {
				url: rowData.url,
				toggleValue: event.target.value
			}
			const streamingEndpoint = (event.target.value === true)
				? `${process.env.REACT_APP_BACKEND_DEV}/device/stream/start`
				: `${process.env.REACT_APP_BACKEND_DEV}/device/stream/stop`
			
			console.log(streamingEndpoint)
			await axios.post(streamingEndpoint, payload);
			

			if (event.target.value) {
				// TODO: Add Toast
				toast.current.show({
					severity: 'success',
					summary: 'Slink2dali (child process) Execution Successful',
					detail: `Device is now streaming to ${rowData.url}`,
					life: 3000
				});
			} else {
				// TODO: Add Toast
				toast.current.show({
					severity: 'warn',
					summary: 'Slink2dali (child process) Exited',
					detail: `Device stopped streaming to ${rowData.url}`,
					life: 3000
				});
			}

			fetchServers(); // reload servers list table
		} catch (error) {
			let errorMessage = '';
			if (error.response) {
				// The request was made and the server responded with a status code
				errorMessage = error.response.data.message;
				console.error(errorMessage);
				// Handle the error message
			} else if (error.request) {
				// The request was made, but no response was received
				console.error(error.request);
				errorMessage = error.request
			} else {
				// Something happened in setting up the request that triggered an error
				console.error('Error:', error.message);
				errorMessage = error.message
			}

			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: `${errorMessage}`,
				life: 3000
			});
		}
	}

	return (
    <div className={styles.serversInfo}>
			<Toast ref={toast} ></Toast>

			<AddServerModal show={showAddServerModal} close={() => setAddServerModalShow(false)} onAddServer={handleAddServer}></AddServerModal>

			<Panel header="Server Information">
				<DataTable value={servers} className="mb-2">
					<Column field="hostName" header="Host Name"></Column>
					<Column field="url" header="Server URL"></Column>
					<Column body={renderSwitch} header="Stream"></Column>
				</DataTable>
				<div className={styles.buttonDiv}>
					<Tooltip target=".linkButton"></Tooltip>
					<Button
						className="linkButton"
						data-pr-tooltip="Click here to open the form for adding new ringserver"
						data-pr-position="bottom"
						label="Add New Server"
						severity="success"
						size="sm"
						text raised
						onClick={() => setAddServerModalShow(true)}
					>
					</Button>
				</div>
			</Panel>
		</div>
	);
}

export default ServersInfoContainer;
