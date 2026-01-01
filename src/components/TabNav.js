import React from "react";
import styles from "./TabNav.module.css";

function TabNav({ activeTab, onSelect }) {
  const tabs = [
    { id: 'linking', label: 'Setup' },
    { id: 'monitoring', label: 'Status' },
  ];

  return (
    <div className={styles.navShell}>
      <div className={styles.navBar} role="tablist" aria-label="Sender view">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabButton} ${isActive ? styles.active : ""}`}
              onClick={() => onSelect(tab.id)}
              aria-pressed={isActive}
              role="tab"
              aria-selected={isActive}
            >
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TabNav;
