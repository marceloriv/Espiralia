import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { OrigamiNautilus } from './common/OrigamiNautilus';
import { focusOnMount } from '../utils/useDialogFocus';
import styles from './NotFoundView.module.css';

interface NotFoundViewProps {
  hasActiveProfile: boolean;
  onNavigateHome: () => void;
}

/** Pantalla de una dirección que no existe. Va a pantalla completa, con o sin sesión, y no redirige. */
export const NotFoundView: React.FC<NotFoundViewProps> = ({ hasActiveProfile, onNavigateHome }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const anterior = document.title;
    document.title = 'Página no encontrada · Espiralia';
    return () => {
      document.title = anterior;
    };
  }, []);

  return (
    <main className={styles.pantalla}>
      <div className={styles.pliego}>
        <div className={styles.washiTape} aria-hidden="true" />
        <div className={styles.perforaciones} aria-hidden="true">
          <span className={styles.perforacion} />
          <span className={styles.perforacion} />
          <span className={styles.perforacion} />
          <span className={styles.perforacion} />
          <span className={styles.perforacion} />
          <span className={styles.perforacion} />
        </div>
        <div className={styles.sello} aria-hidden="true">404</div>

        <div className={styles.hoja}>
          <OrigamiNautilus />
        </div>

        <p className={styles.etiqueta}>Extraviada</p>
        {/* Un cambio de ruta no anuncia nada a un lector de pantalla: el título recibe el foco al montarse. */}
        <h1 ref={focusOnMount} tabIndex={-1} className={styles.titulo}>
          Esta página no existe
        </h1>
        <p className={styles.texto}>
          La dirección que escribiste no lleva a ningún cuaderno. Revisa que esté bien escrita o vuelve al punto de partida.
        </p>
        <p className={styles.direccion}>
          <code>{pathname}</code>
        </p>
        <button type="button" className={styles.boton} onClick={onNavigateHome}>
          {hasActiveProfile ? 'Volver al Dashboard' : 'Volver al inicio'}
        </button>
      </div>
    </main>
  );
};
