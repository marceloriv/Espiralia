import React from 'react';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReload?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Un error de render en cualquier vista dejaba la pantalla en blanco (AGENTS.md §10 A10). Esto muestra un aviso
 * y deja recargar; los datos no se tocan, porque viven en localStorage. React ya registra el error en la consola.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const { onReload = () => window.location.reload() } = this.props;
    return (
      <div className={styles.pantalla} role="alert">
        <h1 className={styles.titulo}>Algo salió mal</h1>
        <p className={styles.texto}>
          Tus datos siguen guardados en este navegador. Recarga la página para volver a Espiralia.
        </p>
        <button type="button" className={styles.boton} onClick={onReload}>
          Recargar
        </button>
      </div>
    );
  }
}
