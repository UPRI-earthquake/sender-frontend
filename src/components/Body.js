import React from "react";
import styles from "./Body.module.css";

function Body({ left, right, children }) {
  const columns = (left || right)
    ? [left, right].filter(Boolean)
    : React.Children.toArray(children);

  return (
    <div className={styles.body}>
      {columns.map((content, index) => (
        <div key={index} className={styles.columnStack}>
          {content}
        </div>
      ))}
    </div>
  )
}

export default Body
