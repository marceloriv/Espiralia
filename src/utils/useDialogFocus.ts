import { useEffect, useRef, useState } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Foco al montar un campo que el usuario acaba de revelar; equivale a `autoFocus` sin enfocar al cargar la página. */
export const focusOnMount = (node: HTMLElement | null) => node?.focus();

/**
 * Foco de un diálogo (WCAG 2.4.3): al abrirse lleva el foco a su primer control, salvo que el diálogo ya lo
 * haya enfocado, y al cerrarse lo devuelve al elemento que lo tenía. Hay que llamarlo antes de los efectos
 * del diálogo para que un foco propio (por ejemplo, un campo de texto) se imponga. `active` sirve a los
 * diálogos que siguen montados mientras están cerrados.
 */
export const useDialogFocus = (active = true) => {
  const ref = useRef<HTMLDivElement>(null);
  // Lectura en el primer render, antes de que `autoFocus` o un efecto muevan el foco dentro del diálogo.
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const focusedInside = !!node?.contains(document.activeElement);
    const previous = (focusedInside ? opener : document.activeElement) as HTMLElement | null;
    if (node && !focusedInside) (node.querySelector<HTMLElement>(FOCUSABLE) ?? node).focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [active, opener]);

  return ref;
};
