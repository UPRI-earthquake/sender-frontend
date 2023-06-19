import React, { useEffect, useState, useRef } from 'react';
import { DataTable, Column, Tooltip, Toast } from 'primereact';
import { default as AddServerModal } from './../modals/AddServerModal';
import styles from "./ServersInfoContainer.module.css";

import axios from 'axios';

function ServersInfoContainer() {

	const toast = useRef(null); //TOAST

	//MODAL STATES
	const [showAddServerModal, setAddServerModalShow] = useState(false);
	const [servers, setServers] = useState([]);

	const fetchServers = async () => {
		try {
			const backend_host = process.env.NODE_ENV === 'production'
				? process.env.REACT_APP_BACKEND_PROD
				: process.env.REACT_APP_BACKEND_DEV;
			const response = await axios.get(`${backend_host}/device/stream/status`);
			const serversData = response.data.payload;
			const serversList = Object.keys(serversData).map((url) => {
				return {
					hostName: serversData[url].hostName,
					url: url,
					status: serversData[url].status
				};
			});
			setServers(serversList);
		} catch (error) {
			console.log('Error fetching servers:', error);
		}
	}

	useEffect(() => {
    	fetchServers();
  	}, []);


	const handleAddServer = async() => {
		await fetchServers();
	}

	return (
    <div className={styles.serversInfo}>
			<Toast ref={toast} ></Toast>

			<AddServerModal show={showAddServerModal} close={() => setAddServerModalShow(false)} onAddServer={handleAddServer}></AddServerModal>

      <div className={styles.panelHeader}>
        <p>Servers Information</p>
      </div>
			<div className={styles.panelBody}>
				<DataTable value={servers} className="mb-2">
					<Column field="hostName" header="Host Name"></Column>
					<Column field="url" header="Server URL"></Column>
					<Column field="status" header="Stream Status"></Column>
				</DataTable>
				<div className={styles.buttonDiv}>
					<Tooltip target="#addServerButton"></Tooltip>
					<button
            id='addServerButton'
						className={styles.addServerButton}
						data-pr-tooltip="Click here to open the form for adding new ringserver"
						data-pr-position="bottom"
						onClick={() => setAddServerModalShow(true)}
					>Add New Server</button>
				</div>
			</div>
		</div>
	);
}

export default ServersInfoContainer;
