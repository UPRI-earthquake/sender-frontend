import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Button, DataTable, Column, InputSwitch, Tooltip } from 'primereact';
import { default as AddServerModal } from './../modals/AddServerModal';

import axios from 'axios';

function ServersInfoContainer() {

	//MODAL STATES
	const [showAddServerModal, setAddServerModalShow] = useState(false);

	const [servers, setServers] = useState([]);

	const fetchServers = async () => {
		// ServerListService.getServers().then((data) => setServers(data));
		const response = await axios.get('http://localhost:5001/servers/getList')
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
			<InputSwitch checked={rowData.isConnected}  onChange={(e) => handleToggleChange(e, rowData)}/>
		);
	}

	// TODO: handler for on/off (stream/stop streaming)
	const handleToggleChange = (event, rowData) => {
		
	}

	return (
		<>
			<AddServerModal show={showAddServerModal} close={() => setAddServerModalShow(false)} onAddServer={handleAddServer}></AddServerModal>

			<Card border="primary">
				<Card.Header>Server(s)</Card.Header>
				<Card.Body>
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
				</Card.Body>
			</Card>
		</>
	);
}

export default ServersInfoContainer;