import { startTransition } from 'react';
import { flushSync } from 'react-dom';

/**
 * Pasar la página (DESIGN.md §0.7): al cambiar de vista, el contenido entra con la View Transitions API
 * y `startTransition` nativo de React para render concurrente suave sin bloquear la interfaz.
 * Es una mejora progresiva: sin soporte del navegador o con `prefers-reduced-motion` el cambio es inmediato.
 * `flushSync` hace que React pinte la vista nueva dentro de la transición, no después.
 */
export function turnPage(update: () => void): void {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!('startViewTransition' in document) || reduceMotion) {
    startTransition(update);
    return;
  }
  document.startViewTransition(() => {
    flushSync(() => {
      startTransition(update);
    });
  });
}
