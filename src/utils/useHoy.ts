import { useEffect, useState } from 'react';

/**
 * Fecha de hoy para mostrar en pantalla. `new Date()` en el cuerpo de un render no es puro: cada render daría un valor distinto.
 * Se fija al montar y se renueva cuando la pestaña vuelve a verse en otro día, para que una sesión abierta de un día a otro
 * no siga mostrando la fecha vieja.
 */
export const useHoy = (): Date => {
  const [hoy, setHoy] = useState(() => new Date());

  useEffect(() => {
    const renovar = () => {
      if (document.visibilityState !== 'visible') return;
      setHoy(previa => {
        const ahora = new Date();
        return ahora.toDateString() === previa.toDateString() ? previa : ahora;
      });
    };
    document.addEventListener('visibilitychange', renovar);
    return () => document.removeEventListener('visibilitychange', renovar);
  }, []);

  return hoy;
};
