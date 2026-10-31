import React from 'react';
import { Esqueleto } from './common/Esqueleto';
import styles from './RouteLoadingFallback.module.css';

/** Esqueleto de una vista (DESIGN.md §7.6): encabezado, bajada y tres tarjetas, la silueta común de las vistas de la app. */
export const RouteLoadingFallback: React.FC = () => {
  return (
    <div className={styles.fallbackContainer} role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">Cargando espacio...</span>
      <div className={styles.encabezado}>
        <Esqueleto ancho="min(22rem, 70%)" alto="2rem" />
        <Esqueleto ancho="min(34rem, 90%)" />
      </div>
      <div className={styles.tarjetas}>
        <Esqueleto forma="bloque" alto="9rem" />
        <Esqueleto forma="bloque" alto="9rem" />
        <Esqueleto forma="bloque" alto="9rem" />
      </div>
      <Esqueleto forma="bloque" alto="12rem" />
    </div>
  );
};
