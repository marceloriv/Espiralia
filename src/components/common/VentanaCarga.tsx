import React, { Suspense, lazy } from 'react';
import styles from './VentanaCarga.module.css';

// El Nautilus pesa en CSS y solo entra en escena al 64 % de la secuencia: se difiere para no sumarlo a la carga inicial (§17.1).
const OrigamiNautilus = lazy(() => import('./OrigamiNautilus').then(m => ({ default: m.OrigamiNautilus })));

interface VentanaCargaProps {
  /** Qué se está cargando, en palabras de quien usa la app ("Abriendo tu cuaderno…"). Se ve y se anuncia. */
  etiqueta: string;
}

/** Una hoja entera (base + solapa). Se pinta dos veces: una fija y otra que hace el segundo pliegue. */
const Hoja: React.FC<{ clase: string }> = ({ clase }) => (
  <div className={`${styles.grupo} ${clase}`}>
    <i className={styles.base} />
    <i className={styles.solapa} />
  </div>
);

/**
 * Ventana de carga a pantalla completa (DESIGN.md §7.8). Es funcional: quien la monta decide cuándo hay una carga real
 * (un `Suspense` de arranque, la verificación de un PIN) y la desmonta al terminar; no hay temporizador falso. No se ve
 * hasta pasados 300ms, así que una carga rápida no la muestra. El efecto es decorativo (`aria-hidden`); lo que se anuncia
 * es la etiqueta, una sola vez, con `role="status"`.
 */
export const VentanaCarga: React.FC<VentanaCargaProps> = ({ etiqueta }) => (
  <div className={styles.ventana} role="status" aria-live="polite" aria-busy="true">
    <div className={styles.escena} aria-hidden="true">
      <div className={styles.hoja}>
        <Hoja clase={styles.fija} />
        <Hoja clase={styles.movil} />
      </div>
      <div className={styles.nautilo}>
        <Suspense fallback={null}>
          <OrigamiNautilus />
        </Suspense>
      </div>
    </div>
    <p className={styles.etiqueta}>{etiqueta}</p>
  </div>
);
