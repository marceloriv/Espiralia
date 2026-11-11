import React from 'react';
import { Marca } from './Marca';
import styles from './OrigamiHoja.module.css';

/**
 * Hoja de papel rasgado al pie de la navegación lateral con la mascota Nautilus, la misma de la página 404.
 * Es el motivo propio de Espiralia (DESIGN.md §0.1): decora y no lleva información, por eso queda fuera del árbol de accesibilidad.
 */
export const OrigamiHoja: React.FC = () => (
  <div className={styles.hoja} aria-hidden="true">
    <Marca variante="mascota" className={styles.nautilo} />
  </div>
);
