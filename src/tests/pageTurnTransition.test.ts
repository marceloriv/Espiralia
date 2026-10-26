import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// startTransition se espía para comprobar que turnPage pasa por él; el resto de React queda intacto.
const { startTransition } = vi.hoisted(() => ({ startTransition: vi.fn((callback: () => void) => callback()) }));
vi.mock('react', async importOriginal => ({ ...(await importOriginal<typeof import('react')>()), startTransition }));

import { turnPage } from '../utils/pageTurn';

const setReducedMotion = (reduce: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
  })) as unknown as typeof window.matchMedia;
};

const vtDoc = document as unknown as { startViewTransition?: unknown };

describe('turnPage y las transiciones de React', () => {
  beforeEach(() => {
    startTransition.mockClear();
  });

  afterEach(() => {
    delete vtDoc.startViewTransition;
  });

  // Técnica: tabla de decisión (soporte de View Transitions x preferencia de movimiento).
  // En los tres caminos la vista cambia con una transición de React, para no bloquear la interfaz.
  it.each([
    ['con soporte y sin preferencia de movimiento reducido', false, true],
    ['con prefers-reduced-motion', true, true],
    ['sin soporte de View Transitions', false, false],
  ])('%s: update corre dentro de startTransition', (_caso, reduce, soporte) => {
    setReducedMotion(reduce);
    if (soporte) vtDoc.startViewTransition = vi.fn((callback: () => void) => callback());
    const update = vi.fn();

    turnPage(update);

    expect(startTransition).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('con View Transitions, startTransition corre dentro del callback de la transición y no antes', () => {
    setReducedMotion(false);
    let dentroDelCallback = false;
    vtDoc.startViewTransition = vi.fn((callback: () => void) => {
      dentroDelCallback = true;
      callback();
      dentroDelCallback = false;
    });
    const enTransicion: boolean[] = [];
    startTransition.mockImplementationOnce((callback: () => void) => {
      enTransicion.push(dentroDelCallback);
      callback();
    });

    turnPage(vi.fn());

    expect(enTransicion).toEqual([true]);
  });
});
