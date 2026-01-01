import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const summarizeAttempts = (attempts) => {
  if (!Array.isArray(attempts) || attempts.length === 0) {
    return 'n/a';
  }
  return attempts
    .map((attempt) => {
      const hostLabel = attempt?.hostname
        ? `${attempt.hostname}${attempt?.port ? `:${attempt.port}` : ''}`
        : 'unknown';
      return attempt?.ok ? `${hostLabel} (ok)` : `${hostLabel} (err: ${attempt?.error || 'failed'})`;
    })
    .join(', ');
};

const formatRingserverLabel = (ringserver) => {
  if (!ringserver) {
    return 'Ringserver';
  }
  const friendlyName = ringserver?.source?.institutionName || ringserver?.label;
  const host = ringserver?.target?.hostname;
  const port = ringserver?.target?.port;
  const hostPort = host ? `${host}${port ? `:${port}` : ''}` : null;
  if (friendlyName && hostPort) {
    return `${friendlyName} (${hostPort})`;
  }
  if (friendlyName) {
    return friendlyName;
  }
  if (hostPort) {
    return hostPort;
  }
  if (ringserver?.source?.url) {
    return ringserver.source.url;
  }
  return 'Ringserver';
};

const buildNetworkDetails = (network) => {
  if (!network) {
    return [
      { label: 'DNS', value: 'Awaiting check', tone: 'muted' },
      { label: 'TCP', value: 'Awaiting check', tone: 'muted' },
      { label: 'HTTPS', value: 'Awaiting check', tone: 'muted' },
    ];
  }
  const details = [
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

  const ringservers = Array.isArray(network?.ringservers) ? network.ringservers : [];
  ringservers.forEach((ringserver) => {
    let tone = 'muted';
    let value = 'Awaiting check';
    if (ringserver?.error) {
      tone = 'danger';
      value = ringserver.error;
    } else if (!ringserver?.dns?.ok) {
      tone = 'danger';
      value = ringserver?.dns?.error || 'DNS lookup failed';
    } else if (!ringserver?.tcp?.ok) {
      tone = 'danger';
      value = ringserver?.tcp?.error || 'TCP connection failed';
    } else if (ringserver?.dns?.ok && ringserver?.tcp?.ok) {
      tone = 'success';
      const portSuffix = ringserver?.target?.port ? ` (port ${ringserver.target.port})` : '';
      value = `Reachable${portSuffix}`;
    }

    details.push({
      label: formatRingserverLabel(ringserver),
      value,
      tone,
    });
  });

  return details;
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
  const targetHost = timePayload?.target?.hostname
    ? `${timePayload.target.hostname}${timePayload.target.port ? `:${timePayload.target.port}` : ''}`
    : 'n/a';
  const stratum = timePayload?.stratum || 'n/a';
  const attemptsLabel = summarizeAttempts(timePayload?.attempts);

  const details = [
    { label: 'Clock offset', value: offsetLabel, tone: offsetTone },
    { label: 'Round trip', value: roundTrip, tone: 'muted' },
    { label: 'Server time', value: serverDate, tone: 'muted' },
  ];

  details.push({ label: 'NTP target', value: targetHost, tone: 'muted' });
  details.push({ label: 'Stratum', value: stratum, tone: 'muted' });
  details.push({ label: 'Attempts', value: attemptsLabel, tone: 'muted' });

  return details;
};

const linkifyText = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = String(text).split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a key={`link-${index}`} href={part} target="_blank" rel="noreferrer" className={styles.inlineLink}>
          {part}
        </a>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
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
  const [expandedDetails, setExpandedDetails] = useState({});
  const [truncatedDetails, setTruncatedDetails] = useState({});
  const detailRefs = useRef({});
  const [openSummary, setOpenSummary] = useState({});

  const registerDetailRef = (key, field) => (el) => {
    if (!detailRefs.current[key]) {
      detailRefs.current[key] = {};
    }
    if (el) {
      detailRefs.current[key][field] = el;
    } else {
      delete detailRefs.current[key][field];
      if (Object.keys(detailRefs.current[key]).length === 0) {
        delete detailRefs.current[key];
      }
    }
  };

  const toggleDetailExpansion = (key) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    if (!showDetails) {
      setTruncatedDetails({});
      return undefined;
    }
    const measure = () => {
      const next = {};
      Object.entries(detailRefs.current).forEach(([key, refGroup]) => {
        if (!refGroup) return;
        const labelEl = refGroup.label;
        const valueEl = refGroup.value;
        const labelTruncated = Boolean(labelEl && labelEl.scrollWidth > labelEl.clientWidth + 1);
        const valueTruncated = Boolean(valueEl && valueEl.scrollWidth > valueEl.clientWidth + 1);
        if (labelTruncated || valueTruncated) {
          next[key] = { label: labelTruncated, value: valueTruncated };
        }
      });
      setTruncatedDetails(next);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
    };
  }, [health, showDetails]);

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
  const ringserverResults = Array.isArray(health.network?.ringservers) ? health.network.ringservers : [];
  const w1ChecksOk = Boolean(health.network?.dns?.ok && health.network?.tcp?.ok && health.network?.https?.ok);
  const ringserversOk = ringserverResults.every((ringserver) => ringserver?.dns?.ok && ringserver?.tcp?.ok);
  const networkOk = Boolean(health.network) && w1ChecksOk && ringserversOk;
  const failingRingserver = ringserverResults.find((ringserver) => !(ringserver?.dns?.ok && ringserver?.tcp?.ok));
  const networkStatus = {
    label: !health.network ? 'Not run' : networkOk ? 'Pass' : 'Issue detected',
    tone: !health.network ? 'muted' : networkOk ? 'success' : 'danger',
    helper: !health.network
      ? 'Waiting for first check to populate DNS, TCP, and HTTPS reachability.'
      : networkOk
        ? ringserverResults.length
          ? `Reachable at ${targetHost} and ${ringserverResults.length} downstream ringserver${ringserverResults.length > 1 ? 's' : ''}.`
          : `Reachable at ${targetHost}.`
        : failingRingserver
          ? `Downstream ringserver unreachable: ${formatRingserverLabel(failingRingserver)}.`
          : `Check connectivity from this device to ${targetHost}.`,
  };

  const offsetMs = typeof health.time?.offsetMs === 'number' ? health.time.offsetMs : null;
  const clockOk = typeof offsetMs === 'number' && Math.abs(offsetMs) <= 1500;
  const ntpFixSteps = 'NTP blocked or misconfigured; SSH into the Raspberry Shake, edit /etc/ntp.conf to add "server 0.asia.pool.ntp.org" (per https://upri-earthquake.github.io/issues/rshake-ntp-issue.html), then restart the device.';

  const timeStatus = {
    label: !health.time ? 'Not run' : clockOk ? 'Pass' : 'Clock drift',
    tone: !health.time ? 'muted' : clockOk ? 'success' : 'warn',
    helper: !health.time
      ? 'Waiting for first check to compare device time with EarthquakeHub.'
      : clockOk
        ? `Offset ${formatOffset(offsetMs)} vs ${targetHost}.`
        : typeof offsetMs === 'number'
          ? `Offset ${formatOffset(offsetMs)} vs ${targetHost}. ${ntpFixSteps}`
          : `NTP blocked or unreachable; ${ntpFixSteps}`,
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

  const renderDetailItems = (details, sectionKey) => (
    details.map((detail, index) => {
      const label = detail?.label || `Detail ${index + 1}`;
      const rawValue = detail?.value ?? 'n/a';
      const valueText = typeof rawValue === 'string' ? rawValue : String(rawValue);
      const toneClass = styles[`tone-${detail.tone}`] || '';
      const detailKey = `${sectionKey}-${index}`;
      const isExpanded = Boolean(expandedDetails[detailKey]);
      const truncatedMeta = truncatedDetails[detailKey] || {};
      const isTruncated = Boolean(truncatedMeta.label || truncatedMeta.value);
      const showToggle = isTruncated || isExpanded;

      return (
        <div key={`${label}-${index}`} className={`${styles.detailItem} ${toneClass}`}>
          <p
            ref={registerDetailRef(detailKey, 'label')}
            className={`${styles.detailLabel} ${!isExpanded ? styles.truncate : ''}`}
            title={label}
          >
            {label}
          </p>
          <p
            ref={registerDetailRef(detailKey, 'value')}
            className={`${styles.detailValue} ${!isExpanded ? styles.truncate : ''}`}
            title={valueText || ''}
          >
            {valueText || 'n/a'}
          </p>
          {showToggle && (
            <button
              type="button"
              className={styles.detailToggle}
              onClick={() => toggleDetailExpansion(detailKey)}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      );
    })
  );

  const renderSummary = (summaryText, summaryKey) => {
    const text = summaryText || '';
    const shouldClamp = text.length > 140;
    const isOpen = Boolean(openSummary[summaryKey]);
    return (
      <div className={styles.summaryRow} key={`${summaryKey}-summary`}>
        <p
          className={`${styles.checkSummary} ${shouldClamp ? styles.clampedSummary : ''}`}
          title={!shouldClamp ? text : undefined}
        >
          {linkifyText(text)}
        </p>
        {shouldClamp && (
          <div className={styles.infoTooltip}>
            <button
              type="button"
              className={styles.infoButton}
              aria-label="Show full summary"
              aria-expanded={isOpen}
              onClick={() => setOpenSummary((prev) => ({
                ...prev,
                [summaryKey]: !prev[summaryKey],
              }))}
            >
              <svg
                className={styles.infoButtonIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10.5v6" />
                <circle cx="12" cy="7.25" r="0.85" fill="currentColor" />
              </svg>
            </button>
            <div className={`${styles.tooltipBubble} ${isOpen ? styles.tooltipBubbleVisible : ''}`}>
              {linkifyText(text)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.deviceHealth}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>HEALTH</p>
          <h2 className={styles.title}>Connectivity Checks</h2>
          <p className={styles.subtitle}>Network path and clock alignment checks against EarthquakeHub and configured ringservers.</p>
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
              <div className={styles.checkHeaderBody}>
                <p className={styles.sectionLabel}>Network path</p>
                {renderSummary(networkStatus.helper || '', 'network')}
              </div>
              <span
                className={`${styles.statusPill} ${pillTone(networkStatus.tone)}`}
                title={networkStatus.label || ''}
              >
                {networkStatus.label}
              </span>
            </div>
            {showDetails && (
              <div className={styles.detailGrid}>
                {renderDetailItems(networkDetails, 'network')}
              </div>
            )}
          </div>

          <div className={styles.checkCard}>
            <div className={styles.checkHeader}>
              <div className={styles.checkHeaderBody}>
                <p className={styles.sectionLabel}>Clock sync</p>
                {renderSummary(timeStatus.helper || '', 'time')}
              </div>
              <span
                className={`${styles.statusPill} ${pillTone(timeStatus.tone)}`}
                title={timeStatus.label || ''}
              >
                {timeStatus.label}
              </span>
            </div>
            {showDetails && (
              <div className={styles.detailGrid}>
                {renderDetailItems(timeDetails, 'time')}
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
