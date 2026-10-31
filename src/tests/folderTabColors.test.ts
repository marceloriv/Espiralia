import { describe, it, expect } from 'vitest';
import { folderTabColors } from '../utils/folderTabColors';

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Técnica: partición de equivalencia sobre el color elegido (claro, medio, oscuro, límite entre tintas) más entradas inválidas.
describe('folderTabColors', () => {
  it.each([
    ['claro', '#e8a55a', '#141413'],
    ['medio gris azulado', '#7b8c9e', '#141413'],
    ['oscuro', '#8e1ea2', '#ffffff'],
    ['rojizo', '#9c4a3b', '#ffffff'],
  ])('color %s: la tinta con más contraste cumple AA sin tocar el relleno', (_nombre, hex, ink) => {
    const out = folderTabColors(hex);
    expect(out.fill).toBe(hex);
    expect(out.ink).toBe(ink);
    expect(ratio(out.fill, out.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('valor límite: un verde medio donde ni blanco ni oscuro llegan a 4,5 se oscurece hasta cumplir', () => {
    const out = folderTabColors('#5a826d');
    expect(out.fill).not.toBe('#5a826d');
    expect(ratio(out.fill, out.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('acepta hex de 3 dígitos', () => {
    const out = folderTabColors('#fff');
    expect(ratio(out.fill, out.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['', 'rojo', 'var(--x)', '#12'])('entrada inválida %j: usa el magenta de marca con tinta blanca', bad => {
    expect(folderTabColors(bad)).toEqual({ fill: '#8e1ea2', ink: '#ffffff' });
  });
});
