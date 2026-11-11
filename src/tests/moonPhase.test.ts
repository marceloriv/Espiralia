import { describe, it, expect } from 'vitest';
import { moonPhase } from '../utils/moonPhase';

// Técnica: partición de equivalencia con fechas de fase conocida (efemérides de 2026).
// El modelo usa el mes sinódico medio: se prueba lejos del cambio de fase, donde no hay ambigüedad.
describe('moonPhase', () => {
  it.each([
    [new Date(2026, 10, 9, 12), 'nueva'],
    [new Date(2026, 10, 17, 12), 'creciente'],
    [new Date(2026, 9, 26, 12), 'llena'],
    [new Date(2026, 10, 3, 12), 'menguante'],
  ])('%s da el icono %s', (fecha, icono) => {
    expect(moonPhase(fecha).icono).toBe(icono);
  });

  it('nombra la fase en español', () => {
    expect(moonPhase(new Date(2026, 9, 26, 12)).nombre).toBe('Luna llena');
    expect(moonPhase(new Date(2026, 10, 9, 12)).nombre).toBe('Luna nueva');
  });
});
