import { useEffect, useRef } from 'react';

/** Llama `onClose` al pulsar Escape mientras `active` sea true (WCAG 2.1.2: diálogos cerrables con teclado). */
export const useEscapeKey = (onClose: () => void, active = true): void => {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active]);
};
