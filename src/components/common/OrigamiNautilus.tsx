import React from 'react';
import styles from './OrigamiNautilus.module.css';

/**
 * Nautilus plegado en papel, hecho solo con CSS: caparazón de franjas radiales, cámaras en espiral, capucha y tentáculos.
 * Es el motivo de la página 404 (DESIGN.md §0.12) y hace eco de la espiral de Espiralia. Decora y no lleva información,
 * por eso queda fuera del árbol de accesibilidad.
 */
export const OrigamiNautilus: React.FC = () => (
  <div className={styles.nautilo} aria-hidden="true">
    <i className={styles.caparazon} />
    <i className={styles.camara} />
    <i className={styles.camara} />
    <i className={styles.camara} />
    <i className={styles.camara} />
    <i className={styles.alfiler} />
    <i className={styles.capucha} />
    <i className={styles.ojo} />
    <i className={styles.tentaculo} />
    <i className={styles.tentaculo} />
    <i className={styles.tentaculo} />
    <i className={styles.tentaculo} />
    <i className={styles.tentaculo} />
  </div>
);
