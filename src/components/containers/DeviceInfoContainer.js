import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { default as DeviceLinkModal } from './../modals/DeviceLinkModal';
import { default as DeviceUnlinkModal } from './../modals/DeviceUnlinkModal';
import styles from "./DeviceInfoContainer.module.css";
import Toast from '../Toast';

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

const formatTimestamp = (seconds) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
    return null;
  }
  const date = new Date(seconds * 1000);
  return date.toLocaleString(undefined, { hour12: false });
};

function DeviceInfoContainer(props) {
  const backendHost = useMemo(() => (
    process.env.NODE_ENV === 'production'
      ? `${window.location.origin}/api`
      : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`
  ), []);

  //DEVICE INFO
  const [linkButton, setLinkButton] = useState();
  const [unlinkButton, setUnlinkButton] = useState(true);
  const [network, setNetwork] = useState('Not Set');
  const [station, setStation] = useState('Not Set');
  const [longitude, setLongitude] = useState('Not Set');
  const [latitude, setLatitude] = useState('Not Set');
  const [elevation, setElevation] = useState('Not Set');
  const [status, setStatus] = useState('Not Linked');
  const [prefillLocation, setPrefillLocation] = useState({ longitude: '', latitude: '', elevation: '' });
  const [healthStatus, setHealthStatus] = useState({ network: null, time: null, checking: false });
  const [tokenStatus, setTokenStatus] = useState({ state: 'missing' });

  // TOASTS
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return '';
    return (Math.round(numericValue * 100) / 100).toFixed(2);
  };

  const formatDisplayValue = (value, suffix) => {
    const formatted = formatNumber(value);
    if (!formatted) return 'Not Set';
    return suffix ? `${formatted}${suffix}` : formatted;
  };

  const getDeviceInfo = async () => {
    try {
      const response = await axios.get(`${backendHost}/device/info`)
      const deviceInfo = response.data.payload;

      const mergedLongitude = deviceInfo.longitude ?? deviceInfo.hostConfig?.longitude;
      const mergedLatitude = deviceInfo.latitude ?? deviceInfo.hostConfig?.latitude;
      const mergedElevation = deviceInfo.elevation ?? deviceInfo.hostConfig?.elevation;
      const formattedLongitude = formatNumber(mergedLongitude);
      const formattedLatitude = formatNumber(mergedLatitude);
      const formattedElevation = formatNumber(mergedElevation);

      setNetwork(deviceInfo.network || deviceInfo.hostConfig?.network || 'Not Set');
      setStation(deviceInfo.station || deviceInfo.hostConfig?.station || 'Not Set');
      setLongitude(formatDisplayValue(mergedLongitude, '°'));
      setLatitude(formatDisplayValue(mergedLatitude, '°'));
      setElevation(formatDisplayValue(mergedElevation, 'm'));
      setStatus(deviceInfo.linked ? "Linked" : "Not Linked");
      setLinkButton(Boolean(deviceInfo.linked)); // disabled when linked
      setUnlinkButton(!deviceInfo.linked); // enabled when linked

      setPrefillLocation({
        longitude: formattedLongitude || '',
        latitude: formattedLatitude || '',
        elevation: formattedElevation || '',
      });
      setTokenStatus(deviceInfo.tokenStatus || { state: 'missing' });

    } catch (error) {
      console.log("Axios Error: " + error)
    }
  }

  const runHealthChecks = async () => {
    setHealthStatus((prev) => ({ ...prev, checking: true }));

    try {
      const [networkResp, timeResp] = await Promise.all([
        axios.get(`${backendHost}/health/network`),
        axios.get(`${backendHost}/health/time`),
      ]);

      setHealthStatus({
        checking: false,
        network: networkResp.data.payload,
        time: timeResp.data.payload,
      });
    } catch (error) {
      console.log("Health check error: ", error);
      setHealthStatus({ checking: false, network: null, time: null });
      setToastMessage('Health check failed. See console for details.');
      setToastType('error');
      setTimeout(() => setToastMessage(''), 5000);
    }
  }

  useEffect(() => {
    getDeviceInfo()
  }, [backendHost])

  const handleOnLinkingSuccess = () => {
    getDeviceInfo();

    // Set Toast Message
    setToastMessage('Device Successfully Linked');
    setToastType('success');

    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  }

  const handleOnUnlinkingSuccess = () => {
    props.setRefreshFlag((prev) => !prev); // Other container uses this flag to refresh their content
    getDeviceInfo();

    // Set Toast Message
    setToastMessage('Device Successfully Unlinked');
    setToastType('success');

    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  }

  const [refreshingToken, setRefreshingToken] = useState(false);

  const handleManualTokenRefresh = async () => {
    setRefreshingToken(true);
    try {
      await axios.post(`${backendHost}/device/refresh-token`);
      await getDeviceInfo();
      setToastMessage('Token refresh requested');
      setToastType('success');
    } catch (error) {
      console.log(error);
      setToastType('error');
      setToastMessage('Unable to refresh token. See console for details.');
    } finally {
      setTimeout(() => {
        setToastMessage('');
      }, 5000);
      setRefreshingToken(false);
    }
  }

  const healthSummary = () => {
    if (healthStatus.checking) return 'Running...';
    if (!healthStatus.network && !healthStatus.time) return 'Not run';
    const networkOk = healthStatus.network?.dns?.ok && healthStatus.network?.tcp?.ok && healthStatus.network?.https?.ok;
    const offset = healthStatus.time?.offsetMs ?? null;
    const offsetSummary = offset !== null ? `${Math.round(offset)} ms` : 'n/a';
    return `${networkOk ? 'Network OK' : 'Check network'} • Clock offset: ${offsetSummary}`;
  }

  const tokenStatusDetails = useMemo(() => {
    const state = tokenStatus?.state;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const secondsToExpiry = typeof tokenStatus?.secondsToExpiry === 'number'
      ? tokenStatus.secondsToExpiry
      : null;
    const expiresAt = typeof tokenStatus?.expiresAt === 'number' ? tokenStatus.expiresAt : null;
    const checkedAt = typeof tokenStatus?.checkedAt === 'number' ? tokenStatus.checkedAt : null;
    const reason = tokenStatus?.reason;

    const remainingSeconds = secondsToExpiry !== null
      ? secondsToExpiry
      : (expiresAt !== null ? expiresAt - nowSeconds : null);

    const expiresInText = () => {
      if (remainingSeconds === null) return 'Expiry time unknown.';
      if (remainingSeconds <= 0) {
        return 'Refreshing now.';
      }
      const formatted = formatDuration(remainingSeconds);
      return formatted ? `Expires in ${formatted}.` : 'Expiry time unknown.';
    };

    const expiredAgoText = () => {
      const elapsed = remainingSeconds !== null
        ? Math.abs(remainingSeconds)
        : (expiresAt !== null ? Math.max(0, nowSeconds - expiresAt) : null);
      if (elapsed === null) return 'Expired.';
      const formatted = formatDuration(elapsed);
      return formatted ? `Expired ${formatted} ago.` : 'Expired.';
    };

    const detectedAtText = () => {
      const formatted = formatTimestamp(checkedAt);
      return formatted ? `Detected ${formatted}.` : '';
    };

    switch (state) {
      case 'valid':
        return {
          label: tokenStatus?.expiringSoon ? 'Token valid (refresh soon)' : 'Token healthy',
          tone: tokenStatus?.expiringSoon ? 'warn' : 'success',
          helper: tokenStatus?.expiringSoon
            ? `${expiresInText()} Auto-refresh is scheduled.`
            : expiresInText(),
        };
      case 'expired':
        return {
          label: 'Token expired',
          tone: 'danger',
          helper: `${expiredAgoText()} Use Refresh Token or relink to regenerate credentials.`.trim(),
        };
      case 'corrupted':
        return {
          label: 'Token file corrupted',
          tone: 'danger',
          helper: `${reason || 'Token file corrupted.'} ${detectedAtText()} Use Refresh Token or relink to regenerate credentials.`.trim(),
        };
      case 'invalid':
        return {
          label: 'Token invalid',
          tone: 'danger',
          helper: `${reason || 'Unable to decode access token.'} ${detectedAtText()} Use Refresh Token or relink to regenerate credentials.`.trim(),
        };
      case 'missing':
        return {
          label: 'No token found',
          tone: 'warn',
          helper: `${reason || 'No access token saved.'} Link the device to fetch a fresh access token.`,
        };
      default:
        return {
          label: 'Token status unknown',
          tone: 'muted',
          helper: `${reason || 'Token status unavailable.'} Refresh the page or reset link state if linking fails.`,
        };
    }
  }, [tokenStatus]);

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

  const infoItems = [
    { label: 'Network', value: network },
    { label: 'Station', value: station },
    { label: 'Longitude', value: longitude },
    { label: 'Latitude', value: latitude },
    { label: 'Elevation', value: elevation },
  ];

  //MODAL STATES
  const [showDeviceLinkModal, setDeviceLinkModalShow] = useState(false);
  const [showDeviceUnlinkModal, setDeviceUnlinkModalShow] = useState(false);

  return (
    <div className={styles.deviceInfo}>
      <Toast message={toastMessage} toastType={toastType}></Toast>

      {showDeviceLinkModal && <DeviceLinkModal prefillLocation={prefillLocation} onModalClose={() => setDeviceLinkModalShow(false)} onLinkingSuccess={handleOnLinkingSuccess} />}
      {showDeviceUnlinkModal && <DeviceUnlinkModal onModalClose={() => setDeviceUnlinkModalShow(false)} onUnlinkingSuccess={handleOnUnlinkingSuccess} />}

      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>Device</p>
          <h2 className={styles.title}>Device Information</h2>
          <p className={styles.subtext}>Values prefill from your RShake config. Adjust in rs.local before linking.</p>
        </div>
        <div className={styles.badgeStack}>
          <span className={`${styles.statusPill} ${pillTone(status === 'Linked' ? 'success' : 'warn')}`}>{status}</span>
          <span className={`${styles.statusPill} ${pillTone(tokenStatusDetails.tone)}`}>{tokenStatusDetails.label}</span>
        </div>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.infoGrid}>
          {infoItems.map((item) => (
            <div key={item.label} className={styles.infoItem}>
              <p className={styles.infoLabel}>{item.label}</p>
              <p className={styles.infoValue}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className={styles.healthCard}>
          <div>
            <p className={styles.sectionLabel}>Device health</p>
            <p className={styles.healthSummary}>{healthSummary()}</p>
          </div>
          <button className={styles.ghostButton} onClick={runHealthChecks} disabled={healthStatus.checking}>
            {healthStatus.checking ? 'Checking...' : 'Run checks'}
          </button>
        </div>

        <div className={styles.actionsRow}>
          <button
            className={styles.primaryButton}
            disabled={linkButton}
            onClick={() => setDeviceLinkModalShow(true)}
          >
            Link device
          </button>
          <button
            className={styles.neutralButton}
            disabled={unlinkButton}
            onClick={() => setDeviceUnlinkModalShow(true)}
          >
            Unlink device
          </button>
        </div>

        <div className={styles.resetCard}>
          <div>
            <p className={styles.sectionLabel}>Access token</p>
            <p className={`${styles.tokenHeadline} ${styles[`tone-${tokenStatusDetails.tone}`] || ''}`}>{tokenStatusDetails.label}</p>
            <p className={styles.tokenHelper}>{tokenStatusDetails.helper}</p>
          </div>
          <div className={styles.resetActions}>
            <button
              className={styles.secondaryButton}
              onClick={handleManualTokenRefresh}
              disabled={
                refreshingToken
                || (tokenStatus?.state === 'valid' && !tokenStatus?.expiringSoon)
                || tokenStatus?.state === 'missing'
              }
            >
              {refreshingToken ? 'Refreshing…' : 'Refresh token'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceInfoContainer;
