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
 * crece desde `origin` (donde se pulsó). Con `prefers-reduced-motion` no hay círculo (es movimiento) pero sí un fundido corto: un
 * cambio instantáneo de todo el color de la pantalla se siente como un golpe. Sin soporte de la API el cambio es inmediato.
 * `onApplied` corre dentro de la transición, para que el estado de React cambie junto con el tema.
 */
export function switchTheme(next: Theme, origin: { x: number; y: number }, onApplied?: () => void): void {
  const apply = () => {
    applyTheme(next);
    onApplied?.();
  };
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!('startViewTransition' in document)) {
    apply();
    return;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme-switching', '');
  const transition = document.startViewTransition(() => flushSync(apply));
  const radio = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));

  // Máscara radial con borde difuso (sólido hasta el 55 % del radio, transparente al 75 %) en vez de un recorte duro: el tema nuevo
  // aparece como una mancha que se expande y no como un corte. El tamaño final cubre `radio` con todo el borde difuso fuera de pantalla.
  const final = (2 * radio) / 0.55;
  const at = (size: number) => `${origin.x - size / 2}px ${origin.y - size / 2}px`;
  // Un gradiente no se interpola con `none`: la máscara va como par desde-hasta para estar activa durante toda la animación.
  // `closest-side`: el radio del gradiente es la mitad del cuadrado, no su semidiagonal; así el círculo termina de cubrir la pantalla
  // justo al final de la animación y no a los dos tercios.
  const mask = 'radial-gradient(circle closest-side, #000 55%, transparent 75%)';

  const circle = {
    keyframes: {
      maskImage: [mask, mask],
      maskRepeat: ['no-repeat', 'no-repeat'],
      maskSize: ['0px 0px', `${final}px ${final}px`],
      maskPosition: [at(0), at(final)],
    },
    options: { duration: 2000, easing: 'cubic-bezier(0.37, 0, 0.63, 1)' },
  };
  const fade = { keyframes: { opacity: [0, 1] }, options: { duration: 600, easing: 'ease-in-out' } };
  const { keyframes, options } = reduceMotion ? fade : circle;

  transition.ready
    .then(() => root.animate(keyframes, { ...options, pseudoElement: '::view-transition-new(root)' }))
    .catch(() => {
      // La transición se canceló (otra vista empezó antes): el tema ya se aplicó.
    });
  void transition.finished.finally(() => root.removeAttribute('data-theme-switching'));
}
