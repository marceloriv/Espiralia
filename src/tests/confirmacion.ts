import { expect, vi } from 'vitest';
import { sileo } from 'sileo';

/** Reemplaza el aviso de confirmación de sileo: con `acepta` pulsa su botón al instante, sin él lo deja pasar. */
export const simularConfirmacion = (acepta: boolean) =>
  vi.spyOn(sileo, 'action').mockImplementation(opciones => {
    if (acepta) opciones.button?.onClick();
    return 'confirmacion';
  });

/** El aviso de confirmación lleva el mensaje en `description`. */
export const conMensaje = (texto: string) => expect.objectContaining({ description: expect.stringContaining(texto) });
