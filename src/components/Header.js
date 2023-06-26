import React from "react";
import styles from "./Header.module.css";
import { ReactComponent as Logo } from './upri-logo.svg';

function Header() {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <Logo className={styles.logo} />
        <h1>CS•UPRI ∣ rShake</h1>
      </div>
    </div>
  )
}

export default Header
