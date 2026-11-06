import { describe, it, expect, vi, afterEach } from 'vitest';
import { sileo } from 'sileo';
import { confirmar } from '../utils/confirmar';

describe('confirmar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Técnica: tabla de decisión (pulsa / no pulsa / pulsa dos veces).
  it('abre un aviso de acción con el mensaje y no borra hasta que se pulsa el botón', () => {
    const action = vi.spyOn(sileo, 'action').mockReturnValue('x');
    const onConfirm = vi.fn();

    confirmar('¿Eliminar la tarea "A"?', onConfirm);

    const opciones = action.mock.calls[0][0];
    expect(opciones.description).toBe('¿Eliminar la tarea "A"?');
    expect(opciones.button?.title).toBe('Eliminar');
    // Abierto desde el inicio y con cierre propio: sin pulsar, nada se borra.
    expect(opciones.autopilot).toEqual({ expand: 0, collapse: opciones.duration });
    expect(onConfirm).not.toHaveBeenCalled();

    opciones.button?.onClick();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('un segundo clic sobre el mismo aviso no repite el borrado', () => {
    const action = vi.spyOn(sileo, 'action').mockReturnValue('x');
    const onConfirm = vi.fn();

    confirmar('¿Eliminar?', onConfirm, 'Borrar');
    const boton = action.mock.calls[0][0].button;
    boton?.onClick();
    boton?.onClick();

    expect(boton?.title).toBe('Borrar');
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
