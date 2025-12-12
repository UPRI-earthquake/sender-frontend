import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import styles from './SystemStatusContainer.module.css';

const formatBytes = (bytes) => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
    return null;
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const display = value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${display} ${units[unitIndex]}`;
};

const clampPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

const formatPercentLabel = (value, digits = 0) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  const rounded = Number(value.toFixed(digits));
  return `${rounded}%`;
};

const formatLoadAverage = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/a';
  }
  return value.toFixed(2);
};

const formatTimestamp = (timestampMs) => {
  if (!timestampMs) return null;
  const date = new Date(timestampMs);
  return date.toLocaleString(undefined, { hour12: false });
};

const classifyUsage = (value) => {
  const pct = clampPercent(value);
  if (pct >= 90) return { label: 'Critical', tone: 'danger' };
  if (pct >= 75) return { label: 'Elevated', tone: 'warn' };
  return { label: 'Healthy', tone: 'success' };
};

function SystemStatusContainer() {
  const backendHost = useMemo(() => (
    process.env.NODE_ENV === 'production'
      ? `${window.location.origin}/api`
      : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`
  ), []);

  const [resources, setResources] = useState({ disk: null, cpu: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${backendHost}/health/resources`);
      const payload = response.data.payload || {};
      setResources({
        disk: payload.disk || null,
        cpu: payload.cpu || null,
      });
      setLastUpdated(Date.now());
    } catch (err) {
      console.log('Resource health error: ', err);
      setError('Unable to load system stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [backendHost]);

  const diskPercentValue = clampPercent(resources.disk?.usedPercent);
  const cpuPercentValue = clampPercent(resources.cpu?.usagePercent);
  const diskPercentLabel = formatPercentLabel(resources.disk?.usedPercent);
  const cpuPercentLabel = formatPercentLabel(resources.cpu?.usagePercent, 1);
  const diskFreeText = formatBytes(resources.disk?.freeBytes) || 'n/a';
  const diskTotalText = formatBytes(resources.disk?.totalBytes) || 'n/a';
  const cpuLoad = Array.isArray(resources.cpu?.loadAverage)
    ? formatLoadAverage(resources.cpu.loadAverage[0])
    : 'n/a';
  const diskPath = resources.disk?.path || '/';
  const diskStatus = classifyUsage(resources.disk?.usedPercent);
  const cpuStatus = classifyUsage(resources.cpu?.usagePercent);
  const subtitle = error
    ? 'Unable to read device stats. Please refresh.'
    : 'Live snapshot of disk and CPU usage on this device.';
  const lastUpdatedText = formatTimestamp(lastUpdated);

  return (
    <div className={styles.systemStatus}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>System</p>
          <h2 className={styles.title}>System status</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={fetchResources}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <p className={styles.metricLabel}>Disk usage</p>
          </div>
          <div className={styles.metricBody}>
            <div
              className={`${styles.gaugeRing} ${styles.diskGauge}`}
              style={{ background: `conic-gradient(var(--gauge-fill) ${diskPercentValue}%, var(--gauge-track) ${diskPercentValue}% 100%)` }}
            >
              <div className={styles.gaugeCenter}>
                <span className={styles.gaugeValue}>{diskPercentLabel}</span>
                <span className={styles.gaugeSubtext}>used</span>
              </div>
            </div>
            <div className={styles.metricCopy}>
              <p className={`${styles.metricStatus} ${styles[`tone-${diskStatus.tone}`] || ''}`}>{diskStatus.label}</p>
              <p className={styles.metricHelper}>
                {resources.disk
                  ? `${diskFreeText} free of ${diskTotalText} (${diskPath})`
                  : 'Disk usage unavailable'}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <p className={styles.metricLabel}>CPU usage</p>
          </div>
          <div className={styles.metricBody}>
            <div
              className={`${styles.gaugeRing} ${styles.cpuGauge}`}
              style={{ background: `conic-gradient(var(--gauge-fill) ${cpuPercentValue}%, var(--gauge-track) ${cpuPercentValue}% 100%)` }}
            >
              <div className={styles.gaugeCenter}>
                <span className={styles.gaugeValue}>{cpuPercentLabel}</span>
                <span className={styles.gaugeSubtext}>1m avg {cpuLoad}</span>
              </div>
            </div>
            <div className={styles.metricCopy}>
              <p className={`${styles.metricStatus} ${styles[`tone-${cpuStatus.tone}`] || ''}`}>{cpuStatus.label}</p>
              <p className={styles.metricHelper}>
                {resources.cpu
                  ? `${resources.cpu.cores || '—'} cores • 1m load ${cpuLoad}`
                  : 'CPU usage unavailable'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        {error ? <span className={styles.errorText}>{error}</span> : <span />}
        {lastUpdatedText && <span className={styles.timestamp}>{lastUpdatedText}</span>}
      </div>
    </div>
  );
}

export default SystemStatusContainer;
