import React from 'react';
import styles from './OrigamiHoja.module.css';

/**
 * Hoja de papel con tres figuras plegadas en CSS (molinillo, caracol, rosa) al pie de la navegación lateral.
 * Es el motivo propio de Espiralia (DESIGN.md §0.1): decora y no lleva información, por eso queda fuera del árbol de accesibilidad.
 */
export const OrigamiHoja: React.FC = () => (
  <div className={styles.hoja} aria-hidden="true">
    <span className={styles.molinillo}>
      <i className={styles.rotor}>
        <i className={styles.aspa} />
        <i className={styles.aspa} />
        <i className={styles.aspa} />
        <i className={styles.aspa} />
      </i>
      <i className={styles.tallo} />
      <i className={styles.buje} />
    </span>
    <span className={styles.caracol}>
      <i className={styles.cuerpo} />
      <i className={styles.ojo} />
      <i className={styles.antena} />
      <i className={styles.antena} />
      <i className={styles.concha}>
        <i className={styles.alfiler} />
      </i>
    </span>
    <span className={styles.rosa}>
      <i className={styles.tallo} />
      <i className={styles.follaje} />
      <i className={styles.follaje} />
      <i className={styles.petalo} />
      <i className={styles.petalo} />
      <i className={styles.petalo} />
      <i className={styles.petalo} />
      <i className={styles.petalo} />
      <i className={styles.alfiler} />
    </span>
  </div>
);
