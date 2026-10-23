import { flushSync } from 'react-dom';

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/**
 * Pasar la página (DESIGN.md §0.7): al cambiar de vista, el contenido entra con la View Transitions API.
 * Es una mejora progresiva: sin soporte del navegador o con `prefers-reduced-motion` el cambio es inmediato.
 * `flushSync` hace que React pinte la vista nueva dentro de la transición, no después.
 */
export function turnPage(update: () => void): void {
  const doc = document as ViewTransitionDocument;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduceMotion) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}
