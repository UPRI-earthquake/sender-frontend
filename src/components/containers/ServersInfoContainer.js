import React, { useEffect, useState } from 'react';
import { default as AddServerModal } from './../modals/AddServerModal';
import styles from "./ServersInfoContainer.module.css";
import Toast from '../Toast';

import axios from 'axios';

function ServersInfoContainer(refreshFlag) {
  //MODAL STATES
  const [showAddServerModal, setAddServerModalShow] = useState(false);
  const [servers, setServers] = useState([]);

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const fetchServers = async () => {
    try {
      const backend_host = process.env.NODE_ENV === 'production'
        ? `${window.location.origin}/api`
        : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`;
      const response = await axios.get(`${backend_host}/stream/status`);
      const serversData = response.data.payload;
      const serversList = Object.keys(serversData).map((url) => {
        return {
          institutionName: serversData[url].institutionName,
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
  }, [refreshFlag]);

  const handleAddServer = async () => {
    await fetchServers();

    // Set Toast Message
    setToastMessage('New Server Added');
    setToastType('success');

    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  }

  return (
    <div className={styles.serversInfo}>
      <Toast message={toastMessage} toastType={toastType}></Toast>
      {showAddServerModal && <AddServerModal onModalClose={() => setAddServerModalShow(false)} onAddServerSuccess={handleAddServer} />}

      <div className={styles.panelHeader}>
        <p>Servers Information</p>
      </div>
      <div className={styles.panelBody}>
        <div className={styles.serversTableContainer}>
          <table className={styles.serversTable}>
            <thead>
              <tr>
                <th>Institution</th>
                <th>Server URL</th>
                <th>Stream Status</th>
              </tr>
            </thead>

            {servers.length > 0 ? (
              <tbody>
                {servers.map((server) => (
                  <tr key={server.url}>
                    <td>{server.institutionName}</td>
                    <td>{server.url}</td>
                    <td>{server.status}</td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td>No Servers Added</td>
                </tr>
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
