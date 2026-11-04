import { describe, it, expect } from 'vitest';
import { textOnColor } from '../utils/textOnColor';

// R-25 / WCAG 1.4.3: el título de una solapa de Carpetas va sobre el color que eligió la persona.
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const hex = (...channels: number[]): string => '#' + channels.map(c => c.toString(16).padStart(2, '0')).join('');

describe('textOnColor', () => {
  // Técnica: partición de equivalencia sobre una rejilla de 4096 colores (cada canal de 17 en 17).
  it('elige negro o blanco con 4.5:1 o más sobre cualquier color', () => {
    const pasos = Array.from({ length: 16 }, (_, i) => i * 17);
    const fallos: string[] = [];
    for (const r of pasos) for (const g of pasos) for (const b of pasos) {
      const fondo = hex(r, g, b);
      if (ratio(textOnColor(fondo), fondo) < 4.5) fallos.push(fondo);
    }
    expect(fallos).toEqual([]);
  });

  it('pone negro sobre el salvia de la paleta, donde el blanco y la tinta del sistema no llegan a 4.5:1', () => {
    expect(textOnColor('#5a826d')).toBe('#000000');
  });
});
