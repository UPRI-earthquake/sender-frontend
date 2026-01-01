import React, { useEffect, useRef } from "react";
import styles from "./Header.module.css";
import { ReactComponent as Logo } from "./upri-logo.svg";
import TabNav from "./TabNav";
import ThemeToggle from "./ThemeToggle";

function Header({ activeTab, onSelectTab }) {
  const headerRef = useRef(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof document === "undefined") return undefined;
    const root = document.documentElement;
    const applyHeight = () => {
      const rect = el.getBoundingClientRect();
      root.style.setProperty("--header-offset", `${Math.ceil(rect.height)}px`);
    };
    applyHeight();
    const ro = new ResizeObserver(applyHeight);
    ro.observe(el);
    window.addEventListener("resize", applyHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", applyHeight);
    };
  }, []);

  return (
    <header className={styles.header}>
      <a href="#main" className={styles.skipLink} aria-label="Skip to main content">
        Skip to content
      </a>
      <div className={styles.headerContent} ref={headerRef}>
        <div className={styles.headerLeft}>
          <Logo className={styles.logo} />
          <div className={styles.brandText}>
            <p className={styles.kicker}>Earthquake Hub Sender</p>
            <h1 className={styles.title}>CS•UPRI ∣ rShake</h1>
          </div>
        </div>
        <div className={styles.headerRight}>
          <ThemeToggle size="compact" />
          <TabNav activeTab={activeTab} onSelect={onSelectTab} />
        </div>
      </div>
    </header>
  );
}

export default Header;
