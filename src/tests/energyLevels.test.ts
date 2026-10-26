import { describe, it, expect } from 'vitest';
import { ENERGY_LEVELS, DEFAULT_ENERGY_VALUE, energyLabel } from '../utils/energyLevels';

// Datos de usuarios existentes: daily_energy guarda estos emoji. El valor guardado no puede cambiar.
describe('energyLevels', () => {
  it('conserva los valores guardados por versiones anteriores, en el mismo orden', () => {
    expect(ENERGY_LEVELS.map(l => l.value)).toEqual(['☁️', '☕', '🌱', '✨', '☀️']);
  });

  it.each([
    ['☁️', 'Baja'],
    ['☕', 'Suave'],
    ['🌱', 'Media'],
    ['✨', 'Alta'],
    ['☀️', 'Plena'],
  ])('energyLabel(%s) devuelve %s', (value, label) => {
    expect(energyLabel(value)).toBe(label);
  });

  it('energyLabel devuelve "Sin registrar" sin valor o con un valor desconocido', () => {
    expect(energyLabel(undefined)).toBe('Sin registrar');
    expect(energyLabel('???')).toBe('Sin registrar');
  });

  it('el valor por defecto es uno de los niveles', () => {
    expect(ENERGY_LEVELS.map(l => l.value)).toContain(DEFAULT_ENERGY_VALUE);
  });
});
