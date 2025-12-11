import React, { useCallback, useEffect, useRef, useState } from 'react';
import { default as AddServerModal } from './../modals/AddServerModal';
import styles from "./ServersInfoContainer.module.css";
import Toast from '../Toast';

import axios from 'axios';

function ServersInfoContainer({ refreshFlag }) {
  const BASE_POLL_MS = 15000;
  const MAX_POLL_MS = 30000;

  //MODAL STATES
  const [showAddServerModal, setAddServerModalShow] = useState(false);
  const [servers, setServers] = useState([]);
  const [pollDelay, setPollDelay] = useState(BASE_POLL_MS);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const pollTimer = useRef(null);

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const fetchServers = useCallback(async () => {
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
      setPollDelay(BASE_POLL_MS);
    } catch (error) {
      console.log('Error fetching servers:', error);
      setPollDelay((prev) => Math.min(prev * 2, MAX_POLL_MS));
    }
  }, [BASE_POLL_MS, MAX_POLL_MS]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers, refreshFlag]);

  const handleAddServer = async () => {
    await fetchServers();

    // Set Toast Message
    setToastMessage('New Server Added');
    setToastType('success');

    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  }

  const statusClass = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('error')) return styles.statusDanger;
    if (normalized.includes('not')) return styles.statusWarn;
    if (normalized.includes('connect')) return styles.statusWarn;
    if (normalized.includes('stream')) return styles.statusSuccess;
    return styles.statusMuted;
  };

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const schedule = () => {
      if (pollTimer.current) {
        clearTimeout(pollTimer.current);
      }
      if (!pageVisible) {
        return;
      }
      pollTimer.current = setTimeout(async () => {
        await fetchServers();
        if (!cancelled) {
          schedule();
        }
      }, pollDelay);
    };

    schedule();

    return () => {
      cancelled = true;
      if (pollTimer.current) {
        clearTimeout(pollTimer.current);
      }
    };
  }, [fetchServers, pageVisible, pollDelay]);

  return (
    <div className={styles.serversInfo}>
      <Toast message={toastMessage} toastType={toastType}></Toast>
      {showAddServerModal && <AddServerModal onModalClose={() => setAddServerModalShow(false)} onAddServerSuccess={handleAddServer} />}

      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>Network</p>
          <h2 className={styles.title}>Servers Information</h2>
          <p className={styles.subtext}>Ringserver endpoints configured for this sender.</p>
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => setAddServerModalShow(true)}
        >Add server</button>
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
                    <td>
                      <span className={`${styles.statusChip} ${statusClass(server.status)}`}>
                        {server.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={3} className={styles.emptyState}>No servers added yet.</td>
                </tr>
              </tbody>
            )}

          </table>
        </div>
      </div>
    </div>
  );
}

export default ServersInfoContainer;
