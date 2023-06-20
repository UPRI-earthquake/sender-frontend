import React, { useEffect, useState, useRef } from 'react';
import { Toast } from 'primereact';
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

      {showAddServerModal && <AddServerModal onModalClose={() => setAddServerModalShow(false)} onAddServer={handleAddServer} />}

      <div className={styles.panelHeader}>
        <p>Servers Information</p>
      </div>
      <div className={styles.panelBody}>
      <div className={styles.serversTableContainer}>
        <table className={styles.serversTable}>
          <thead>
            <tr>
              <th>Host Name</th>
              <th>Server URL</th>
              <th>Stream Status</th>
            </tr>
          </thead>

          {servers.length > 0 ? (
            servers.map((server) => (
              <tbody>
                <tr key={server.url}>
                  <td>{server.hostName}</td>
                  <td>{server.url}</td>
                  <td>{server.status}</td>
                </tr>
              </tbody>
            ))
          ) : (
            <tbody>
              <tr><td>No Servers Added</td></tr>
            </tbody>
          )}
        </table>
        </div>
        <div className={styles.buttonDiv}>
					<button
						className={styles.addServerButton}
						onClick={() => setAddServerModalShow(true)}
					>Add New Server</button>
				</div>
			</div>
		</div>
	);
}

export default ServersInfoContainer;
