import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import styles from './SystemStatusContainer.module.css';
import InfoTooltip from '../InfoTooltip';
import { logError } from '../../utils/logging';

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

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return null;
  }
  const abs = Math.max(0, Math.round(Math.abs(seconds)));
  const units = [
    { label: 'd', value: 86400 },
    { label: 'h', value: 3600 },
    { label: 'm', value: 60 },
  ];
  const parts = [];
  let remainder = abs;

  for (const unit of units) {
    if (remainder >= unit.value) {
      const count = Math.floor(remainder / unit.value);
      parts.push(`${count}${unit.label}`);
      remainder -= count * unit.value;
    }
    if (parts.length === 2) break;
  }

  if (parts.length < 2 && remainder > 0) {
    parts.push(`${remainder}s`);
  }

  if (parts.length === 0) {
    return '0s';
  }

  return parts.join(' ');
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

const formatUnixSeconds = (seconds) => {
  if (!Number.isFinite(Number(seconds))) return 'n/a';
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString(undefined, { hour12: false });
};

const toLowerString = (value) => String(value || '').trim().toLowerCase();

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
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tokenStatus, setTokenStatus] = useState({ state: 'missing' });
  const [refreshTokenStatus, setRefreshTokenStatus] = useState({ state: 'missing' });
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [deviceLinked, setDeviceLinked] = useState(false);
  const [diskRefreshing, setDiskRefreshing] = useState(false);
  const [cpuRefreshing, setCpuRefreshing] = useState(false);
  const [senderState, setSenderState] = useState(null);
  const [senderStateRefreshing, setSenderStateRefreshing] = useState(false);

  const fetchSystemState = async () => {
    setError(null);
    try {
      const [resourcesResult, deviceResult, senderStateResult] = await Promise.allSettled([
        axios.get(`${backendHost}/health/resources`),
        axios.get(`${backendHost}/device/info`),
        axios.get(`${backendHost}/health/sender-state`),
      ]);

      if (resourcesResult.status === 'fulfilled') {
        const payload = resourcesResult.value.data.payload || {};
        setResources({
          disk: payload.disk || null,
          cpu: payload.cpu || null,
        });
      } else {
        setResources({ disk: null, cpu: null });
        setError('Unable to load system stats');
      }

      if (deviceResult.status === 'fulfilled') {
        const payload = deviceResult.value.data.payload || {};
        setTokenStatus(payload.tokenStatus || { state: 'missing' });
        setRefreshTokenStatus(payload.refreshTokenStatus || { state: 'missing' });
        setDeviceLinked(Boolean(payload.linked));
      } else {
        setTokenStatus({ state: 'unknown', reason: 'Token status unavailable' });
        setRefreshTokenStatus({ state: 'unknown' });
        setDeviceLinked(false);
      }

      if (senderStateResult.status === 'fulfilled') {
        setSenderState(senderStateResult.value?.data?.payload || null);
      } else {
        setSenderState(null);
      }

      setLastUpdated(Date.now());
    } catch (err) {
      logError('Resource health error:', err);
      setError('Unable to load system stats');
    } finally {
      setDiskRefreshing(false);
      setCpuRefreshing(false);
      setSenderStateRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemState();
  }, [backendHost]);

  const handleManualTokenRefresh = async () => {
    setRefreshingToken(true);
    setTokenStatus((prev) => ({ ...prev, state: 'refreshing' }));
    try {
      await axios.post(`${backendHost}/device/refresh-token`);
      await fetchSystemState();
    } catch (error) {
      logError('Token refresh error:', error);
      await fetchSystemState();
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleRefreshDisk = async () => {
    setDiskRefreshing(true);
    try {
      const response = await axios.get(`${backendHost}/health/resources`);
      const payload = response.data.payload || {};
      setResources((prev) => ({
        ...prev,
        disk: payload.disk || null,
      }));
      setLastUpdated(Date.now());
    } catch (err) {
      logError('Disk refresh error:', err);
      setError('Unable to load disk stats');
    } finally {
      setDiskRefreshing(false);
    }
  };

  const handleRefreshCpu = async () => {
    setCpuRefreshing(true);
    try {
      const response = await axios.get(`${backendHost}/health/resources`);
      const payload = response.data.payload || {};
      setResources((prev) => ({
        ...prev,
        cpu: payload.cpu || null,
      }));
      setLastUpdated(Date.now());
    } catch (err) {
      logError('CPU refresh error:', err);
      setError('Unable to load CPU stats');
    } finally {
      setCpuRefreshing(false);
    }
  };

  const handleRefreshSenderState = async () => {
    setSenderStateRefreshing(true);
    try {
      const response = await axios.get(`${backendHost}/health/sender-state`);
      setSenderState(response?.data?.payload || null);
      setLastUpdated(Date.now());
    } catch (err) {
      logError('Sender state refresh error:', err);
      setError('Unable to load sender runtime state');
    } finally {
      setSenderStateRefreshing(false);
    }
  };

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
    : 'Resources and authorization needed for this sender to run.';
  const tokenStatusDetails = useMemo(() => {
    const state = tokenStatus?.state;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const secondsToExpiry = typeof tokenStatus?.secondsToExpiry === 'number'
      ? tokenStatus.secondsToExpiry
      : null;
    const expiresAt = typeof tokenStatus?.expiresAt === 'number' ? tokenStatus.expiresAt : null;
    const remainingSeconds = secondsToExpiry !== null
      ? secondsToExpiry
      : (expiresAt !== null ? expiresAt - nowSeconds : null);
    const reason = tokenStatus?.reason;

    const formattedRemaining = remainingSeconds !== null ? formatDuration(remainingSeconds) : null;
    const expiredAgo = remainingSeconds !== null && remainingSeconds < 0
      ? formatDuration(Math.abs(remainingSeconds))
      : null;

    const expiryLabel = () => {
      if (formattedRemaining && remainingSeconds >= 0) {
        return `Expires in ${formattedRemaining}`;
      }
      if (expiredAgo) {
        return `Expired ${expiredAgo} ago`;
      }
      return 'Expiry time unknown';
    };

    switch (state) {
      case 'valid':
        return {
          headline: tokenStatus?.expiringSoon ? 'Token expiring soon' : 'Token healthy',
          helper: expiryLabel(),
          tone: tokenStatus?.expiringSoon ? 'warn' : 'success',
          badgeLabel: tokenStatus?.expiringSoon ? 'Token expiring soon' : 'Token healthy',
          allowRefresh: Boolean(tokenStatus?.expiringSoon),
        };
      case 'refreshing':
        return {
          headline: 'Token refreshing',
          helper: 'Awaiting new credentials',
          tone: 'warn',
          badgeLabel: 'Refreshing',
          allowRefresh: false,
        };
      case 'expired':
        return {
          headline: 'Token expired',
          helper: expiryLabel(),
          tone: 'danger',
          badgeLabel: 'Token expired',
          allowRefresh: true,
        };
      case 'corrupted':
        return {
          headline: 'Token file corrupted',
          helper: reason || 'Regenerate credentials to continue streaming.',
          tone: 'danger',
          badgeLabel: 'Token issue',
          allowRefresh: true,
        };
      case 'invalid':
        return {
          headline: 'Token invalid',
          helper: reason || 'Regenerate credentials to continue streaming.',
          tone: 'danger',
          badgeLabel: 'Token invalid',
          allowRefresh: true,
        };
      case 'missing':
        return {
          headline: 'No token found',
          helper: 'Link device to fetch credentials.',
          tone: 'warn',
          badgeLabel: 'No token',
          allowRefresh: false,
        };
      default:
        return {
          headline: 'Token status unknown',
          helper: reason || 'Refresh to load token status.',
          tone: 'muted',
          badgeLabel: 'Unknown',
          allowRefresh: true,
        };
    }
  }, [tokenStatus]);

  const refreshLeewaySeconds = useMemo(() => {
    const raw = Number(window?.ENV?.REFRESH_EXPIRY_LEEWAY_MS || 0);
    if (!Number.isFinite(raw) || raw <= 0) return 10 * 60; // default 10m
    return Math.floor(raw / 1000);
  }, []);

  const formatRefreshEta = (seconds) => {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return null;
    if (seconds <= 0) return 'imminent';
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    const remMins = mins % 60;
    if (days > 0) {
      if (remHours > 0) return `${days}d ${remHours}h`;
      return `${days}d`;
    }
    if (hours <= 0) return `${mins}m`;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  };

  const adjustedSeconds = typeof tokenStatus?.secondsToExpiry === 'number'
    ? Math.max(0, tokenStatus.secondsToExpiry - refreshLeewaySeconds)
    : null;
  const nextRefreshEta = formatRefreshEta(adjustedSeconds);

  const relinkNotice = useMemo(() => {
    const refreshState = refreshTokenStatus?.state;
    const needsRelinkStates = ['invalid', 'expired', 'corrupted'];
    const needsRelink = needsRelinkStates.includes(refreshState) || (refreshState === 'missing' && deviceLinked);
    if (!needsRelink) {
      return { required: false, helper: '' };
    }
    const reason = refreshTokenStatus?.reason ? String(refreshTokenStatus.reason).trim() : '';
    const reasonPrefix = reason ? `${reason}${reason.endsWith('.') ? ' ' : '. '}` : '';
    return {
      required: true,
      helper: `${reasonPrefix}Unlink and relink this device to generate new credentials.`,
    };
  }, [refreshTokenStatus, deviceLinked]);

  const tokenRefreshDisabled = refreshingToken
    || !tokenStatusDetails.allowRefresh
    || relinkNotice.required;
  const lastUpdatedText = formatTimestamp(lastUpdated);

  const senderStateCheckedAt = senderState?.checkedAt
    ? new Date(senderState.checkedAt).toLocaleString(undefined, { hour12: false })
    : 'n/a';
  const autoUpdateInfo = senderState?.autoUpdate || {};
  const autoUpdatePayload = autoUpdateInfo?.state || {};
  const rollbackInfo = autoUpdatePayload?.rollback || {};
  const rollbackResult = rollbackInfo?.result || autoUpdatePayload?.ROLLBACK_RESULT || 'unknown';
  const backendUpdateResult = autoUpdatePayload?.backendResult || autoUpdatePayload?.BACKEND_PULL_STATE || 'n/a';
  const frontendUpdateResult = autoUpdatePayload?.frontendResult || autoUpdatePayload?.FRONTEND_PULL_STATE || 'n/a';
  const bundleTag = autoUpdatePayload?.bundleTag || autoUpdatePayload?.BUNDLE_TAG || 'n/a';

  const watchdogInfo = senderState?.watchdog || {};
  const watchdogState = watchdogInfo?.state || {};
  const watchdogBackendRestart = watchdogState?.WATCHDOG_BACKEND_LAST_RESTART_TS;
  const watchdogFrontendRestart = watchdogState?.WATCHDOG_FRONTEND_LAST_RESTART_TS;

  const diskAlertInfo = senderState?.diskAlerts || {};
  const diskAlertState = diskAlertInfo?.state || {};
  const diskAlertLevel = diskAlertState?.LAST_DISK_ALERT_LEVEL
    || diskAlertState?.DISK_ALERT_LAST_LEVEL
    || 'unknown';
  const diskAlertFreePct = diskAlertState?.LAST_DISK_ALERT_FREE_PCT
    || diskAlertState?.DISK_ALERT_LAST_FREE_PCT
    || null;

  const tokenAlertInfo = senderState?.tokenRefreshAlerts || {};
  const tokenAlertState = tokenAlertInfo?.state || {};
  const tokenRefreshFailures = Number(tokenAlertState?.failureCount ?? 0);

  const senderRuntimeTone = (() => {
    const backendFailed = toLowerString(backendUpdateResult).includes('fail');
    const frontendFailed = toLowerString(frontendUpdateResult).includes('fail');
    const rollbackFailed = toLowerString(rollbackResult).includes('fail');
    const diskLevel = toLowerString(diskAlertLevel);
    if (backendFailed || frontendFailed || rollbackFailed || diskLevel === 'critical') return 'danger';
    if (diskLevel === 'warn' || diskLevel === 'warning' || tokenRefreshFailures > 0) return 'warn';
    if (!senderState) return 'muted';
    return 'success';
  })();

  return (
    <div className={styles.systemStatus}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>SYSTEM</p>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Operational Status</h2>
            <InfoTooltip label="Operational status info" title="Operational status" variant="inline">
              {subtitle}
            </InfoTooltip>
          </div>
        </div>
      </div>

      <div className={styles.authCard}>
        <div className={styles.authTopRow}>
          <div>
            <div className={styles.authLabelRow}>
              <p className={styles.sectionLabel}>Authorization</p>
              <InfoTooltip label="How token refresh works" title="Token refresh" variant="inline">
                Access tokens refresh automatically when they are close to expiring or after an auth error.
                <br />
                <strong>Next refresh: {nextRefreshEta || 'when issued/near expiry'}</strong>
                <br />
                Expect a quick credentials check; if refresh keeps failing, reset device link and relink this device to Earthquake Hub.
              </InfoTooltip>
            </div>
            <p className={`${styles.tokenHeadline} ${styles[`tone-${tokenStatusDetails.tone}`] || ''}`}>
              {tokenStatusDetails.headline}
            </p>
            <p className={styles.tokenHelper}>{tokenStatusDetails.helper}</p>
          </div>
          <button
            className={styles.secondaryButton}
            onClick={handleManualTokenRefresh}
            disabled={tokenRefreshDisabled}
          >
            {refreshingToken ? 'Refreshing…' : 'Refresh token'}
          </button>
        </div>
        <div className={styles.authActionsRow}>
          {relinkNotice.required && (
            <p className={styles.relinkNotice}>{relinkNotice.helper}</p>
          )}
        </div>
      </div>

      <div className={styles.runtimeCard}>
        <div className={styles.metricHeader}>
          <div className={styles.authLabelRow}>
            <p className={styles.sectionLabel}>Sender runtime</p>
            <InfoTooltip label="Sender runtime info" title="Sender runtime state" variant="inline">
              Snapshot from backend `/health/sender-state` for update/watchdog/disk/token-refresh state files.
            </InfoTooltip>
          </div>
          <button
            type="button"
            className={`${styles.iconButton} ${senderStateRefreshing ? styles.iconButtonRefreshing : ''}`}
            onClick={handleRefreshSenderState}
            disabled={senderStateRefreshing}
            title="Refresh sender state"
            aria-label="Refresh sender state"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline
                points="23 4 23 10 17 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="1 20 1 14 7 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 15A9 9 0 0 1 6.36 18.36L1 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className={`${styles.metricStatus} ${styles[`tone-${senderRuntimeTone}`] || ''}`}>
          {senderState ? 'State file snapshot available' : 'State snapshot unavailable'}
        </p>
        <div className={styles.runtimeGrid}>
          <p className={styles.runtimeItem}><strong>Auto-update:</strong> {backendUpdateResult} / {frontendUpdateResult}</p>
          <p className={styles.runtimeItem}><strong>Bundle:</strong> {bundleTag}</p>
          <p className={styles.runtimeItem}><strong>Rollback:</strong> {rollbackResult}</p>
          <p className={styles.runtimeItem}>
            <strong>Watchdog restarts:</strong> backend {formatUnixSeconds(watchdogBackendRestart)}, frontend {formatUnixSeconds(watchdogFrontendRestart)}
          </p>
          <p className={styles.runtimeItem}>
            <strong>Disk alert:</strong> {diskAlertLevel}{diskAlertFreePct !== null && diskAlertFreePct !== undefined ? ` (${diskAlertFreePct}% free)` : ''}
          </p>
          <p className={styles.runtimeItem}><strong>Token refresh failures:</strong> {tokenRefreshFailures}</p>
        </div>
        <p className={styles.runtimeMeta}>Checked: {senderStateCheckedAt}</p>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <p className={styles.metricLabel}>Disk usage</p>
            <button
              type="button"
              className={`${styles.iconButton} ${diskRefreshing ? styles.iconButtonRefreshing : ''}`}
              onClick={handleRefreshDisk}
              disabled={diskRefreshing}
              title="Refresh disk usage"
              aria-label="Refresh disk usage"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polyline
                  points="23 4 23 10 17 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="1 20 1 14 7 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.49 15A9 9 0 0 1 6.36 18.36L1 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
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
            <button
              type="button"
              className={`${styles.iconButton} ${cpuRefreshing ? styles.iconButtonRefreshing : ''}`}
              onClick={handleRefreshCpu}
              disabled={cpuRefreshing}
              title="Refresh CPU usage"
              aria-label="Refresh CPU usage"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polyline
                  points="23 4 23 10 17 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="1 20 1 14 7 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.49 15A9 9 0 0 1 6.36 18.36L1 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
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
