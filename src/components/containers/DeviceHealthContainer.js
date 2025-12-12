import React, { useMemo, useState } from 'react';
import axios from 'axios';
import styles from './DeviceHealthContainer.module.css';

const formatTimestamp = (timestampMs) => {
  if (!timestampMs) return null;
  const date = new Date(timestampMs);
  return date.toLocaleString(undefined, { hour12: false });
};

const formatOffset = (offsetMs) => {
  if (typeof offsetMs !== 'number' || Number.isNaN(offsetMs)) {
    return null;
  }
  const rounded = Math.round(offsetMs);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded} ms`;
};

const buildNetworkDetails = (network) => {
  if (!network) {
    return [
      { label: 'DNS', value: 'Awaiting check', tone: 'muted' },
      { label: 'TCP', value: 'Awaiting check', tone: 'muted' },
      { label: 'HTTPS', value: 'Awaiting check', tone: 'muted' },
    ];
  }
  return [
    {
      label: 'DNS',
      value: network?.dns?.ok ? network.dns.address || 'Resolved' : network?.dns?.error || 'Lookup failed',
      tone: network?.dns?.ok ? 'success' : 'danger',
    },
    {
      label: 'TCP',
      value: network?.tcp?.ok ? 'Port reachable' : network?.tcp?.error || 'Connection failed',
      tone: network?.tcp?.ok ? 'success' : 'danger',
    },
    {
      label: 'HTTPS',
      value: network?.https?.ok
        ? `HEAD ${network.https.status || ''}`.trim()
        : network?.https?.error || 'Handshake failed',
      tone: network?.https?.ok ? 'success' : 'danger',
    },
  ];
};

const buildTimeDetails = (timePayload) => {
  const offsetValue = typeof timePayload?.offsetMs === 'number' ? timePayload.offsetMs : null;
  const offsetLabel = formatOffset(offsetValue) || 'Unavailable';
  const offsetTone = offsetValue === null
    ? 'muted'
    : Math.abs(offsetValue) <= 1500
      ? 'success'
      : 'warn';
  const roundTrip = typeof timePayload?.roundTripMs === 'number' ? `${Math.round(timePayload.roundTripMs)} ms` : 'n/a';
  const serverDate = timePayload?.serverDate ? new Date(timePayload.serverDate).toLocaleString(undefined, { hour12: false }) : 'n/a';

  return [
    { label: 'Clock offset', value: offsetLabel, tone: offsetTone },
    { label: 'Round trip', value: roundTrip, tone: 'muted' },
    { label: 'Server time', value: serverDate, tone: 'muted' },
  ];
};

function DeviceHealthContainer() {
  const backendHost = useMemo(() => (
    process.env.NODE_ENV === 'production'
      ? `${window.location.origin}/api`
      : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`
  ), []);

  const [health, setHealth] = useState({
    checking: false,
    network: null,
    time: null,
    error: null,
    lastRun: null,
  });
  const [showDetails, setShowDetails] = useState(false);

  const runHealthChecks = async () => {
    setHealth((prev) => ({ ...prev, checking: true, error: null }));

    try {
      const [networkResp, timeResp] = await Promise.all([
        axios.get(`${backendHost}/health/network`),
        axios.get(`${backendHost}/health/time`),
      ]);

      setHealth({
        checking: false,
        network: networkResp.data.payload,
        time: timeResp.data.payload,
        error: null,
        lastRun: Date.now(),
      });
      setShowDetails(false);
    } catch (error) {
      console.log("Health check error: ", error);
      setHealth({
        checking: false,
        network: null,
        time: null,
        error: 'Health check failed. See console for details.',
        lastRun: Date.now(),
      });
      setShowDetails(false);
    }
  };

  const targetHost = health.network?.target?.hostname
    || health.time?.target?.hostname
    || 'EarthquakeHub services';
  const hasResults = Boolean(health.network || health.time);

  const networkDetails = buildNetworkDetails(health.network);
  const networkOk = networkDetails.every((detail) => detail.tone === 'success');
  const networkStatus = {
    label: !health.network ? 'Not run' : networkOk ? 'Pass' : 'Issue detected',
    tone: !health.network ? 'muted' : networkOk ? 'success' : 'danger',
    helper: !health.network
      ? 'Waiting for first check to populate DNS, TCP, and HTTPS reachability.'
      : networkOk
        ? `Reachable at ${targetHost}.`
        : `Check connectivity from this device to ${targetHost}.`,
  };

  const offsetMs = typeof health.time?.offsetMs === 'number' ? health.time.offsetMs : null;
  const clockOk = typeof offsetMs === 'number' && Math.abs(offsetMs) <= 1500;
  const timeStatus = {
    label: !health.time ? 'Not run' : clockOk ? 'Pass' : 'Clock drift',
    tone: !health.time ? 'muted' : clockOk ? 'success' : 'warn',
    helper: !health.time
      ? 'Waiting for first check to compare device time with EarthquakeHub.'
      : clockOk
        ? `Offset ${formatOffset(offsetMs)} vs ${targetHost}.`
        : `Offset ${formatOffset(offsetMs) || 'unknown'}; consider NTP sync.`,
  };

  const timeDetails = buildTimeDetails(health.time);
  const updatedLabel = formatTimestamp(health.lastRun) || 'Not run yet';

  const pillTone = (tone) => {
    switch (tone) {
      case 'success':
        return styles.pillSuccess;
      case 'warn':
        return styles.pillWarn;
      case 'danger':
        return styles.pillDanger;
      default:
        return styles.pillMuted;
    }
  };

  return (
    <div className={styles.deviceHealth}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>Health</p>
          <h2 className={styles.title}>Device health checks</h2>
          <p className={styles.subtitle}>Optional connectivity and clock alignment checks to EarthquakeHub services.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.primaryButton}
            onClick={runHealthChecks}
            disabled={health.checking}
          >
            {health.checking ? 'Checking…' : 'Run checks'}
          </button>
        </div>
      </div>

      {health.error && (
        <div className={styles.inlineError}>
          {health.error}
        </div>
      )}

      {hasResults && (
        <div className={styles.checksGrid}>
          <div className={styles.checkCard}>
            <div className={styles.checkHeader}>
              <div>
                <p className={styles.sectionLabel}>Network path</p>
                <p className={styles.checkSummary}>{networkStatus.helper}</p>
              </div>
              <span className={`${styles.statusPill} ${pillTone(networkStatus.tone)}`}>{networkStatus.label}</span>
            </div>
            {showDetails && (
              <div className={styles.detailGrid}>
                {networkDetails.map((detail) => (
                  <div key={detail.label} className={`${styles.detailItem} ${styles[`tone-${detail.tone}`] || ''}`}>
                    <p className={styles.detailLabel}>{detail.label}</p>
                    <p className={styles.detailValue}>{detail.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.checkCard}>
            <div className={styles.checkHeader}>
              <div>
                <p className={styles.sectionLabel}>Clock sync</p>
                <p className={styles.checkSummary}>{timeStatus.helper}</p>
              </div>
              <span className={`${styles.statusPill} ${pillTone(timeStatus.tone)}`}>{timeStatus.label}</span>
            </div>
            {showDetails && (
              <div className={styles.detailGrid}>
                {timeDetails.map((detail) => (
                  <div key={detail.label} className={`${styles.detailItem} ${styles[`tone-${detail.tone}`] || ''}`}>
                    <p className={styles.detailLabel}>{detail.label}</p>
                    <p className={styles.detailValue}>{detail.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {hasResults && (
        <div className={styles.detailsToggle}>
          <button
            className={styles.secondaryButton}
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? 'Hide technical details' : 'Show technical details'}
          </button>
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.timestamp}>{updatedLabel}</span>
      </div>
    </div>
  );
}

export default DeviceHealthContainer;
