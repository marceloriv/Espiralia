import React, { useEffect, useState } from 'react';
import { Esqueleto } from './common/Esqueleto';
import { VentanaCarga } from './common/VentanaCarga';
import { esArranque, terminarArranque } from '../utils/arranqueCarga';
import styles from './RouteLoadingFallback.module.css';

/**
 * Carga de una vista (DESIGN.md §7.7 y §7.8). La primera espera tras abrir la app o cambiar de perfil muestra la ventana de
 * carga; las siguientes, el esqueleto de la vista: encabezado, bajada y tres tarjetas, la silueta común de la app.
 */
export const RouteLoadingFallback: React.FC = () => {
  // La decisión se toma al montar y no cambia: así el modo estricto de React (que monta dos veces) no cambia de aspecto a mitad.
  const [conVentana] = useState(esArranque);
  useEffect(() => terminarArranque, []);

  if (conVentana) return <VentanaCarga etiqueta="Abriendo Espiralia…" />;

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
