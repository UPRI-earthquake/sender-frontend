import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DeviceResetModal from '../modals/DeviceResetModal';
import Toast from '../Toast';
import styles from './RecoveryContainer.module.css';

function RecoveryContainer() {
  const backendHost = useMemo(() => (
    process.env.NODE_ENV === 'production'
      ? `${window.location.origin}/api`
      : `http://${window.location.hostname}:${window['ENV'].REACT_APP_BACKEND_PORT}`
  ), []);

  const [linked, setLinked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [linkState, setLinkState] = useState('unknown');

  const fetchLinkedState = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendHost}/device/info`);
      const payload = response.data.payload || {};
      setLinked(Boolean(payload.linked));
      if (payload.linkState) {
        setLinkState(payload.linkState);
      } else {
        setLinkState(payload.linked ? 'linked' : 'notLinked');
      }
    } catch (error) {
      console.log('Recovery: unable to load device info', error);
      setLinked(false);
      setLinkState('unknown');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkedState();
  }, [backendHost]);

  const handleResettingChange = (inProgress) => {
    setResetting(inProgress);
  };

  const handleResetSuccess = () => {
    setLinked(false);
    setLinkState('notLinked');
    setToastType('success');
    setToastMessage('Device link reset. Re-register to continue.');
    setTimeout(() => setToastMessage(''), 5000);
  };

  const isDisabled = resetting || loading || !(linked || linkState === 'unlinked');
  const linkedLabel = linked ? 'Linked' : (linkState === 'unlinked' ? 'Unlinked' : 'Not linked');
  const linkedTone = linked
    ? styles.pillSuccess
    : (linkState === 'notLinked' ? styles.pillWarn : styles.pillMuted);

  return (
    <div className={styles.recoveryPanel}>
      <Toast message={toastMessage} toastType={toastType} />

      {showResetModal && (
        <DeviceResetModal
          onModalClose={() => setShowResetModal(false)}
          onResettingChange={handleResettingChange}
          onResetSuccess={handleResetSuccess}
          linkState={linkState}
        />
      )}

      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>RECOVERY</p>
          <h2 className={styles.title}>Reset</h2>
          <p className={styles.subtitle}>
            Use only to remove this device's association with the current account.
          </p>
        </div>
        <div className={styles.badgeStack}>
          <span className={`${styles.statusPill} ${linkedTone}`}>{linkedLabel}</span>
        </div>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.copyBlock}>
          <p className={styles.helper}>Clears all saved link data on this device and on Earthquake Hub.</p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.resetButton}
            disabled={isDisabled}
            onClick={() => setShowResetModal(true)}
          >
            {resetting ? 'Resetting…' : 'Reset Device Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecoveryContainer;
