import React from "react";
import styles from "./TabNav.module.css";

function TabNav({ activeTab, onSelect, compact = false }) {
  const tabs = [
    {
      id: 'linking',
      label: 'Setup',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 7h16M4 12h10M4 17h6" />
          <path d="M14 17h6v-5h-6v5Z" />
        </svg>
      ),
    },
    {
      id: 'monitoring',
      label: 'Status',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M3 12h3l2 6 4-12 2 6h5" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
    },
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
              {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
              {!compact && <span className={styles.tabLabel}>{tab.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TabNav;
