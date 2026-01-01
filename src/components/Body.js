import React from "react";
import styles from "./Body.module.css";

function Body({ left, right, children, layout = 'weighted' }) {
  const columns = (left || right)
    ? [left, right].filter(Boolean)
    : React.Children.toArray(children);

  const layoutClass = (() => {
    if (layout === 'even') return styles.evenColumns;
    if (layout === 'linking') return styles.linkingColumns;
    return '';
  })();

  return (
    <div className={`${styles.body} ${layoutClass}`} id="main">
      {columns.map((content, index) => (
        <div key={index} className={styles.columnStack}>
          {content}
        </div>
      ))}
    </div>
  )
}

export default Body
