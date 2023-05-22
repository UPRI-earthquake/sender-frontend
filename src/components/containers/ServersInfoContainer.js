import React, { useEffect, useState } from 'react';
import { Button, DataTable, Column, InputSwitch, Tooltip, Panel } from 'primereact';
import { default as AddServerModal } from './../modals/AddServerModal';
import styles from "./ServersInfoContainer.module.css";

import axios from 'axios';

function ServersInfoContainer() {

	//MODAL STATES
	const [showAddServerModal, setAddServerModalShow] = useState(false);

	const [servers, setServers] = useState([]);

	const fetchServers = async () => {
		// ServerListService.getServers().then((data) => setServers(data));
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

	// TODO: handler for on/off (stream/stop streaming)
	const handleToggleChange = (event, rowData) => {
		
	}

	return (
    <div className={styles.serversInfo}>
			<AddServerModal show={showAddServerModal} close={() => setAddServerModalShow(false)} onAddServer={handleAddServer}></AddServerModal>

			<Panel header="Server Information">
				<DataTable value={servers} className="mb-2">
					<Column field="hostName" header="Host Name"></Column>
					<Column field="url" header="Server URL"></Column>
					<Column body={renderSwitch} header="Connection Status"></Column>
				</DataTable>
				<div className="d-grid gap-2">
					<Tooltip target=".linkButton"></Tooltip>
					<Button
						className="linkButton"
						data-pr-tooltip="Click here to open the form for adding new ringserver"
						data-pr-position="bottom"
						label="Add New Server"
						severity="success"
						size="sm"
						rounded text raised
						onClick={() => setAddServerModalShow(true)}
					>
					</Button>
				</div>
			</Panel>
		</div>
	);
}

export default ServersInfoContainer;
