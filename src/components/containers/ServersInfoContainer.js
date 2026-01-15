import React, { useCallback, useEffect, useRef, useState } from 'react';
import { default as AddServerModal } from './../modals/AddServerModal';
import { default as RemoveServerModal } from './../modals/RemoveServerModal';
import styles from "./ServersInfoContainer.module.css";
import Toast from '../Toast';
import InfoTooltip from '../InfoTooltip';

import axios from 'axios';

const formatTimestamp = (timestampMs) => {
  if (!timestampMs) return null;
  const date = new Date(timestampMs);
  return date.toLocaleString(undefined, { hour12: false });
};

function ServersInfoContainer({ refreshFlag }) {
  const BASE_POLL_MS = 15000;
  const MAX_POLL_MS = 30000;

  //MODAL STATES
  const [showAddServerModal, setAddServerModalShow] = useState(false);
  const [servers, setServers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [pollDelay, setPollDelay] = useState(BASE_POLL_MS);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const pollTimer = useRef(null);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [truncatedLogs, setTruncatedLogs] = useState({});
  const logTextRefs = useRef({});
  const [serverPendingRemoval, setServerPendingRemoval] = useState(null);
  const [linked, setLinked] = useState(false);
  const [linkState, setLinkState] = useState('unknown');

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);

    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  };

  const fetchServers = useCallback(async () => {
    try {
      const backend_host = process.env.NODE_ENV === 'production'
        ? `${window.location.origin}/api`
        : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`;
      const [serversResp, deviceResp] = await Promise.all([
        axios.get(`${backend_host}/stream/status`),
        axios.get(`${backend_host}/device/info`),
      ]);
      const serversData = serversResp.data.payload;
      const serversList = Object.keys(serversData).map((url) => {
        const serverEntry = serversData[url] || {};
        const logPayload = serverEntry.logs || serverEntry.recentLogs || serverEntry.lastErrors || [];
        return {
          institutionName: serverEntry.institutionName,
          url: url,
          status: serverEntry.status,
          retryCount: serverEntry.retryCount,
          logs: logPayload,
        };
      });
      setServers(serversList);
      setLastUpdated(Date.now());
      setPollDelay(BASE_POLL_MS);
      const devicePayload = deviceResp?.data?.payload || {};
      setLinked(Boolean(devicePayload.linked));
      setLinkState(devicePayload.linkState || 'unknown');
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
    showToast('New server added');
  }

  const statusClass = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('error')) return styles.statusDanger;
    if (normalized.includes('not')) return styles.statusWarn;
    if (normalized.includes('connect')) return styles.statusWarn;
    if (normalized.includes('stream')) return styles.statusSuccess;
    return styles.statusMuted;
  };

  const hasErrorStatus = (status) => (status || '').toLowerCase().includes('error');

  const handleRemoveServer = async (url) => {
    if (!url) return;
    try {
      const backend_host = process.env.NODE_ENV === 'production'
        ? `${window.location.origin}/api`
        : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`;
      await axios.post(`${backend_host}/servers/remove`, { url });
      showToast('Server removed');
      await fetchServers();
    } catch (error) {
      console.log('Remove server failed:', error);
      showToast('Unable to remove server. See console for details.', 'error');
    }
  };

  const extractLogs = (server) => {
    if (!server) return null;
    if (Array.isArray(server.logs) && server.logs.length) return server.logs;
    if (Array.isArray(server.recentLogs) && server.recentLogs.length) return server.recentLogs;
    if (Array.isArray(server.lastErrors) && server.lastErrors.length) return server.lastErrors;
    return null;
  };

  const toggleLog = (logKey) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [logKey]: !prev[logKey],
    }));
  };

  const registerLogTextRef = (logKey) => (el) => {
    if (el) {
      logTextRefs.current[logKey] = el;
    } else {
      delete logTextRefs.current[logKey];
    }
  };

  const measureTruncation = useCallback(() => {
    const next = {};
    Object.entries(logTextRefs.current).forEach(([logKey, el]) => {
      if (el) {
        next[logKey] = el.scrollWidth > el.clientWidth;
      }
    });
    setTruncatedLogs(next);
  }, []);

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

  useEffect(() => {
    if (!showErrorDetails) return;
    measureTruncation();
    const onResize = () => measureTruncation();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [servers, measureTruncation, showErrorDetails]);

  const errorServers = servers.filter((server) => hasErrorStatus(server.status));
  const updatedLabel = formatTimestamp(lastUpdated);
  const issueCount = errorServers.length;
  const issueHeadline = issueCount === 1
    ? '1 streaming issue detected'
    : `${issueCount} streaming issues detected`;
  const issueInstitutions = errorServers
    .map((server) => server.institutionName || server.url)
    .filter(Boolean)
    .join(', ');
  const addDisabled = !linked;
  const addTitle = addDisabled
    ? (linkState === 'unlinked' ? 'Relink device before adding servers' : 'Link device before adding servers')
    : 'Add a new server';

  return (
    <div className={styles.serversInfo}>
      <Toast message={toastMessage} toastType={toastType}></Toast>
      {showAddServerModal && <AddServerModal onModalClose={() => setAddServerModalShow(false)} onAddServerSuccess={handleAddServer} />}

      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>Network</p>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Servers Information</h2>
            <InfoTooltip label="Servers info" title="Ringservers" variant="inline">
              Ringserver endpoints configured for this sender.
            </InfoTooltip>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.primaryButton}
            onClick={() => setAddServerModalShow(true)}
            disabled={addDisabled}
            title={addTitle}
          >Add server</button>
        </div>
      </div>
      <div className={styles.panelBody}>
        {errorServers.length > 0 && (
          <>
            <div className={styles.errorBanner}>
              <div>
                <p className={styles.errorTitle}>{issueHeadline}</p>
                {issueInstitutions && (
                  <p className={styles.errorList}>{issueInstitutions}</p>
                )}
              </div>
              <div className={styles.errorActions}>
                <button
                  className={styles.ghostButton}
                  onClick={() => setShowErrorDetails((prev) => !prev)}
                >
                  {showErrorDetails ? 'Hide details' : 'View details'}
                </button>
              </div>
            </div>
            {showErrorDetails && (
              <div className={styles.errorDetails}>
                {errorServers.map((server) => {
                  const logs = extractLogs(server) || [];
                  const total = logs.length;
                  return (
                    <div key={server.url} className={styles.errorDetailRow}>
                      <div className={styles.errorMeta}>
                        <p className={styles.errorLabel}>{server.institutionName || 'Server'}</p>
                        <p className={`${styles.errorUrl} ${styles.truncate}`} title={server.url}>{server.url}</p>
                        {typeof server.retryCount === 'number' && (
                          <p className={styles.errorMetaHelper}>
                            {server.retryCount} {server.retryCount === 1 ? 'retry' : 'retries'}
                          </p>
                        )}
                      </div>
                      <div className={styles.errorLogColumn}>
                        <p className={styles.logHeading}>Recent error log</p>
                        {total ? (
                          <div className={styles.errorTableWrapper}>
                            <table className={styles.errorTable}>
                              <tbody>
                                {logs.map((entry, index) => {
                                  const logKey = `${server.url}-log-${index}`;
                                  const expanded = Boolean(expandedLogs[logKey]);
                                  const text = typeof entry === 'string' ? entry : JSON.stringify(entry);
                                  const needsToggle = text.length > 100;
                                  const isTruncated = truncatedLogs[logKey];
                                  const showToggle = needsToggle || isTruncated;
                                  return (
                                    <tr key={logKey}>
                                      <td className={styles.logCell}>
                                        <span
                                          ref={registerLogTextRef(logKey)}
                                          className={`${styles.logText} ${!expanded ? styles.truncate : ''}`}
                                          title={text}
                                        >
                                          {text}
                                        </span>
                                        {showToggle && (
                                          <button
                                            className={styles.logToggle}
                                            onClick={() => toggleLog(logKey)}
                                          >
                                            {expanded ? 'Show less' : 'Show more'}
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {total > 0 && (
                              <div className={styles.logMeta}>Showing logs from the latest retry ({total} entries)</div>
                            )}
                          </div>
                        ) : (
                          <p className={styles.logEmpty}>No error log details available.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {serverPendingRemoval && (
          <RemoveServerModal
            url={serverPendingRemoval.url}
            institutionName={serverPendingRemoval.institutionName}
            onConfirm={handleRemoveServer}
            onModalClose={() => setServerPendingRemoval(null)}
          />
        )}

        <div className={styles.serversTableContainer}>
          <div className={styles.serversTableScroll}>
            <table className={styles.serversTable}>
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Server URL</th>
                  <th>Stream Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {servers.length > 0 ? (
                  servers.map((server) => (
                    <tr key={server.url} className={hasErrorStatus(server.status) ? styles.errorRow : ''}>
                      <td className={styles.cellInstitution}>
                        <span className={styles.cellLabel}>Institution</span>
                        <span className={`${styles.cellValue} ${styles.truncate}`} title={server.institutionName || '—'}>
                          {server.institutionName || '—'}
                        </span>
                      </td>
                      <td className={styles.cellUrl}>
                        <span className={styles.cellLabel}>Server URL</span>
                        <span className={`${styles.urlText} ${styles.truncate}`} title={server.url}>
                          {server.url}
                        </span>
                      </td>
                      <td className={styles.cellStatus}>
                        <span className={styles.cellLabel}>Stream Status</span>
                        <div className={styles.statusCell}>
                          <span className={`${styles.statusChip} ${statusClass(server.status)}`}>
                            {server.status}
                          </span>
                        </div>
                      </td>
                      <td className={styles.cellActions}>
                        <span className={styles.cellLabel}>Action</span>
                        <button
                          className={styles.actionButton}
                          onClick={() => setServerPendingRemoval({
                            url: server.url,
                            institutionName: server.institutionName,
                          })}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>No servers added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.panelFooter}>
          <span className={styles.timestamp}>
            {updatedLabel ? updatedLabel : 'Waiting for first check'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ServersInfoContainer;
