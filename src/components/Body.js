import React from "react";
import styles from "./Body.module.css";

function Body( {children} ) {
  return(
    <div className={styles.body}>
      {children}
    </div>
  )
}

export default Body
