import React from "react";
import styles from "./TabNav.module.css";

function TabNav({ activeTab, onSelect, compact = false }) {
  const tabs = [
    {
      id: 'linking',
      label: 'Setup',
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
          <path d="M6 4v4" />
          <path d="M6 12v8" />
          <path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
          <path d="M12 4v10" />
          <path d="M12 18v2" />
          <path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
          <path d="M18 4v1" />
          <path d="M18 9v11" />
        </svg>
      ),
    },
    {
      id: 'monitoring',
      label: 'Status',
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1l0 -10" />
          <path d="M7 20h10" />
          <path d="M9 16v4" />
          <path d="M15 16v4" />
          <path d="M7 10h2l2 3l2 -6l1 3h3" />
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
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
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
