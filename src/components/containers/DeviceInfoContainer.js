import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { default as DeviceLinkModal } from './../modals/DeviceLinkModal';
import { default as DeviceUnlinkModal } from './../modals/DeviceUnlinkModal';
import styles from "./DeviceInfoContainer.module.css";
import Toast from '../Toast';
import { logError } from '../../utils/logging';

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
  const [linkState, setLinkState] = useState('unknown');
  const [prefillLocation, setPrefillLocation] = useState({ longitude: '', latitude: '', elevation: '' });
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
      setLinkState(deviceInfo.linkState || 'unknown');
      const nextStatus = deviceInfo.linked
        ? 'Linked'
        : (deviceInfo.linkState === 'unlinked' ? 'Unlinked' : 'Not Linked');
      setStatus(nextStatus);
      setLinkButton(Boolean(deviceInfo.linked)); // disabled when linked
      setUnlinkButton(!deviceInfo.linked); // enabled when linked

      setPrefillLocation({
        longitude: formattedLongitude || '',
        latitude: formattedLatitude || '',
        elevation: formattedElevation || '',
      });
    } catch (error) {
      logError('Device info fetch failed:', error);
    }
  }

  useEffect(() => {
    getDeviceInfo()
  }, [backendHost])

  const handleOnLinkingSuccess = () => {
    if (props.setRefreshFlag) {
      props.setRefreshFlag((prev) => !prev); // Refresh other panels (e.g. servers list) immediately after linking
    }
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


  const handleRefreshHostMetadata = async () => {
    setRefreshingMetadata(true);
    try {
      await axios.post(`${backendHost}/device/config/refresh`);
      await getDeviceInfo();
      setToastType('success');
      setToastMessage('Location values refreshed from RShake config');
    } catch (error) {
      logError('Host metadata refresh failed:', error);
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
          <p className={styles.kicker}>DEVICE</p>
          <h2 className={styles.title}>Device Information</h2>
        </div>
        <div className={styles.badgeStack}>
          <span className={`${styles.statusPill} ${
            status === 'Linked'
              ? pillTone('success')
              : status === 'Unlinked'
                ? pillTone('muted')
                : pillTone('warn')
          }`}>{status}</span>
        </div>
      </div>

      <div className={styles.panelBody}>
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
      </div>
    </div>
  );
}

export default DeviceInfoContainer;
