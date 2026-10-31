import { flushSync } from 'react-dom';

/** Clave de la elección de tema. Va fuera de los datos de los perfiles: es una preferencia del navegador, no de un cuaderno. */
export const THEME_KEY = 'espiralia_theme';

export type Theme = 'light' | 'dark';

const prefersDark = () => Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

/** Tema que se está viendo: el elegido (data-theme) o, sin elección, el del sistema. */
export const currentTheme = (): Theme => {
  const chosen = document.documentElement.getAttribute('data-theme');
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return prefersDark() ? 'dark' : 'light';
};

/** Fija el tema, lo guarda y avisa a la barra del navegador (theme-color). No anima: eso es `switchTheme`. */
export const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage lleno o bloqueado: el tema cambia igual, solo que no se recuerda.
  }
  const bar = theme === 'dark' ? '#1a1817' : '#faf9f5';
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
    meta.content = bar;
  });
};

/**
 * Cambia de tema con el efecto de https://theme-toggle.rdsx.dev: la View Transitions API revela el tema nuevo con un círculo que
 * crece desde `origin` (donde se pulsó). Sin soporte o con `prefers-reduced-motion` el cambio es inmediato.
 * `onApplied` corre dentro de la transición, para que el estado de React cambie junto con el tema.
 */
export function switchTheme(next: Theme, origin: { x: number; y: number }, onApplied?: () => void): void {
  const apply = () => {
    applyTheme(next);
    onApplied?.();
  };
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!('startViewTransition' in document) || reduceMotion) {
    apply();
    return;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme-switching', '');
  const transition = document.startViewTransition(() => flushSync(apply));
  const radio = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));

  transition.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radio}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 450, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      ),
    )
    .catch(() => {
      // La transición se canceló (otra vista empezó antes): el tema ya se aplicó.
    });
  void transition.finished.finally(() => root.removeAttribute('data-theme-switching'));
}
