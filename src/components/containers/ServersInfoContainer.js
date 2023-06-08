import React, { useEffect, useState, useRef } from 'react';
import { Button, DataTable, Column, Tooltip, Panel, Toast } from 'primereact';
import { default as AddServerModal } from './../modals/AddServerModal';
import styles from "./ServersInfoContainer.module.css";

import axios from 'axios';

function ServersInfoContainer() {

	const toast = useRef(null); //TOAST

	//MODAL STATES
	const [showAddServerModal, setAddServerModalShow] = useState(false);
	const [servers, setServers] = useState([]);

	// Function for start streaming
	const startStreaming = async (url) => {
		try {
			const payload = {
				url: url
			}
			const backend_host = process.env.NODE_ENV === 'production'
				? process.env.REACT_APP_BACKEND_PROD
				: process.env.REACT_APP_BACKEND_DEV;
			const streamingEndpoint = `${backend_host}/device/stream/start`
			const response = await axios.post(streamingEndpoint, payload);
			console.log(response);
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

	const fetchServers = async () => {
		try {
			const backend_host = process.env.REACT_APP_BACKEND_DEV;
			const response = await axios.get(`${backend_host}/device/stream/status`);
			const serversList = response.data.payload;
			setServers(serversList);
			console.log(serversList)
		} catch (error) {
			console.log('Error fetching servers:', error);
		}
	}

	useEffect(() => {
    	fetchServers();
  	}, []);

	// Call startStreaming for each server
	useEffect(() => {
		if (servers.length > 0) {
			servers.forEach((server) => {
				startStreaming(server.url);
			});
		}
	}, [servers]);

	const handleAddServer = () => {
		fetchServers();
	}

	return (
    <div className={styles.serversInfo}>
			<Toast ref={toast} ></Toast>

			<AddServerModal show={showAddServerModal} close={() => setAddServerModalShow(false)} onAddServer={handleAddServer}></AddServerModal>

			<Panel header="Server Information">
				<DataTable value={servers} className="mb-2">
					<Column field="hostName" header="Host Name"></Column>
					<Column field="url" header="Server URL"></Column>
					<Column field="status" header="Stream Status"></Column>
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
