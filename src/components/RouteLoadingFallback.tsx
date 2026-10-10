import React from 'react';
import styles from './RouteLoadingFallback.module.css';

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      className={styles.fallbackContainer}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.spinner} />
      <span className={styles.text}>Cargando espacio...</span>
    </div>
  );
};
