import React, { useEffect, useState } from 'react';
import { Card, Form } from 'react-bootstrap';
import { Button, DataTable, Column } from 'primereact';
import { default as AddServerModal } from './../modals/AddServerModal';

import axios from 'axios';

function ServersInfoContainer() {

	//MODAL STATES
	const [showAddServerModal, setAddServerModalShow] = useState(false);

	const [servers, setServers] = useState([]);
	const [checked, setChecked] = useState(false);

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

	const actionBodyTemplate = (rowData) => {
		return (
			<React.Fragment>
				<Form.Check 
					type="switch"
					id="custom-switch"
					label={rowData.connectionMessage}
					checked={rowData.isConnected}
					onChange={(e) => setChecked(e.value)}
				/>
			</React.Fragment>
		);
	};

	return (
		<>
			<AddServerModal show={showAddServerModal} close={() => setAddServerModalShow(false)} onAddServer={handleAddServer}></AddServerModal>

			<Card border="primary">
				<Card.Header>Server(s)</Card.Header>
				<Card.Body>
					<DataTable value={servers} className="mb-2">
						<Column field="hostName" header="Host Name"></Column>
						<Column field="url" header="Server URL"></Column>
						<Column header="Connection Status"
							body={actionBodyTemplate}
							exportable={false}
							style={{ minWidth: '12rem' }}>
						</Column>
						
					</DataTable>
					<div className="d-grid gap-2">
						<Button
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