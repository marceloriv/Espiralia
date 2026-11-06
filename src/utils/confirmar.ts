import { sileo } from 'sileo';

const ESPERA_MS = 10000;

/**
 * Pide confirmación con un aviso de sileo en vez de `window.confirm`. Si nadie pulsa el botón antes de
 * ESPERA_MS, el aviso se cierra y no se borra nada. Sileo usa un solo aviso a la vez, así que el aviso de
 * éxito que muestre `onConfirm` reemplaza a este.
 */
export const confirmar = (mensaje: string, onConfirm: () => void, boton = 'Eliminar') => {
  let hecho = false;
  sileo.action({
    title: 'Confirmar',
    description: mensaje,
    duration: ESPERA_MS,
    // Abierto desde el inicio: sin esto, el botón solo aparece al pasar el mouse.
    autopilot: { expand: 0, collapse: ESPERA_MS },
    button: {
      title: boton,
      // Un segundo clic, antes de que llegue el aviso siguiente, no repite el borrado.
      onClick: () => {
        if (hecho) return;
        hecho = true;
        onConfirm();
      },
    },
  });
  // El aviso queda al inicio del documento; llevar el foco al botón lo deja a una tecla (WCAG 2.1.1).
  requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-sileo-button]')?.focus());
};
