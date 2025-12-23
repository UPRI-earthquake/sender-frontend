import React from "react";
import styles from "./Header.module.css";
import { ReactComponent as Logo } from './upri-logo.svg';
import TabNav from "./TabNav";

function Header({ activeTab, onSelectTab }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <Logo className={styles.logo} />
            <div>
              <p className={styles.kicker}>Earthquake Hub Sender</p>
              <h1>CS•UPRI ∣ rShake</h1>
            </div>
          </div>
          <div className={styles.headerNav}>
            <TabNav activeTab={activeTab} onSelect={onSelectTab} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
