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
  const [tokenStatus, setTokenStatus] = useState({ state: 'missing' });
  const [refreshTokenStatus, setRefreshTokenStatus] = useState({ state: 'missing' });
  const [refreshingMetadata, setRefreshingMetadata] = useState(false);

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
      setRefreshTokenStatus(deviceInfo.refreshTokenStatus || { state: 'missing' });

    } catch (error) {
      console.log("Axios Error: " + error)
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
      const backendMessage = error?.response?.data?.message;
      setToastType('error');
      setToastMessage(backendMessage || 'Unable to refresh token. See console for details.');
      await getDeviceInfo();
    } finally {
      setTimeout(() => {
        setToastMessage('');
      }, 5000);
      setRefreshingToken(false);
    }
  }

  const handleRefreshHostMetadata = async () => {
    setRefreshingMetadata(true);
    try {
      await axios.post(`${backendHost}/device/config/refresh`);
      await getDeviceInfo();
      setToastType('success');
      setToastMessage('Location values refreshed from RShake config');
    } catch (error) {
      console.log(error);
      const errorSummary = error?.response?.data?.message;
      setToastType('error');
      setToastMessage(errorSummary || 'Unable to read metadata from RShake config.');
    } finally {
      setTimeout(() => {
        setToastMessage('');
      }, 5000);
      setRefreshingMetadata(false);
    }
  };

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

  const relinkNotice = useMemo(() => {
    const refreshState = refreshTokenStatus?.state;
    const linked = status === 'Linked';
    const needsRelinkStates = ['invalid', 'expired', 'corrupted'];
    const needsRelink = needsRelinkStates.includes(refreshState) || (refreshState === 'missing' && linked);
    if (!needsRelink) {
      return { required: false, helper: '' };
    }
    const reason = refreshTokenStatus?.reason ? String(refreshTokenStatus.reason).trim() : '';
    const reasonPrefix = reason ? `${reason}${reason.endsWith('.') ? ' ' : '. '}` : '';
    return {
      required: true,
      helper: `${reasonPrefix}Unlink and relink this device to generate new credentials.`,
    };
  }, [refreshTokenStatus, status]);

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

  const networkItems = [
    { label: 'Network', value: network },
    { label: 'Station', value: station },
  ];

  const locationItems = [
    { label: 'Latitude', value: latitude },
    { label: 'Longitude', value: longitude },
    { label: 'Elevation', value: elevation },
  ];

  const isLinked = status === 'Linked';

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
          <p className={styles.subtext}>Values prefill from RShake config. Adjust in rs.local before linking.</p>
        </div>
        <div className={styles.badgeStack}>
          <span className={`${styles.statusPill} ${pillTone(status === 'Linked' ? 'success' : 'warn')}`}>{status}</span>
          <span className={`${styles.statusPill} ${pillTone(tokenStatusDetails.tone)}`}>{tokenStatusDetails.label}</span>
        </div>
      </div>

      <div className={styles.panelBody}>
        {relinkNotice.required && (
          <div className={`${styles.alertCard} ${styles.alertDanger}`}>
            <div>
              <p className={styles.alertTitle}>Relink required</p>
              <p className={styles.alertBody}>{relinkNotice.helper}</p>
            </div>
          </div>
        )}
        <div className={styles.infoSections}>
          <div className={styles.infoSection}>
            <p className={styles.sectionLabel}>Network &amp; Station</p>
            <div className={`${styles.infoGrid} ${styles.twoColumn}`}>
              {networkItems.map((item) => (
                <div key={item.label} className={styles.infoItem}>
                  <p className={styles.infoLabel}>{item.label}</p>
                  <p className={styles.infoValue}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.infoSection}>
            <div className={styles.sectionLabelRow}>
              <div>
                <p className={styles.sectionLabel}>Location</p>
                <p className={styles.sectionHelper}>Synced from device host configuration.</p>
              </div>
              <span className={styles.iconOrnament}>
                <button
                  type="button"
                  className={`${styles.iconButton} ${refreshingMetadata ? styles.iconButtonRefreshing : ''}`}
                  onClick={handleRefreshHostMetadata}
                  disabled={refreshingMetadata}
                  title="Refresh from RShake config"
                  aria-label="Refresh location from RShake config"
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
              </span>
            </div>
            <div className={`${styles.infoGrid} ${styles.locationGrid}`}>
              {locationItems.map((item) => (
                <div key={item.label} className={styles.infoItem}>
                  <p className={styles.infoLabel}>{item.label}</p>
                  <p className={styles.infoValue}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
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
                || relinkNotice.required
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
