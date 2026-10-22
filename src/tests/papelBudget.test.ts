/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// DESIGN.md §0.10 criterio 1: presupuesto de materiales por vista, para que la firma no se diluya.
// Una vista tiene como máximo 1 Pliego, 4 tarjetas de Papel y 3 piezas pequeñas de Papel.
const VIEWS = readdirSync('src/components')
  .filter(f => /View\.tsx$/.test(f))
  .map(f => path.join('src/components', f));

const count = (src: string, re: RegExp) => (src.match(re) ?? []).length;

describe('Presupuesto de materiales por vista', () => {
  it('hay vistas que revisar', () => {
    expect(VIEWS.length).toBeGreaterThanOrEqual(6);
  });

  it.each(VIEWS)('%s respeta el presupuesto', file => {
    const src = readFileSync(file, 'utf8');
    const piezas = count(src, /<Papel\b[^>]*forma="pieza"/g);
    const tarjetas = count(src, /<Papel\b/g) - piezas;

    expect(count(src, /<Pliego\b/g), 'Pliego').toBeLessThanOrEqual(1);
    expect(tarjetas, 'tarjetas de Papel').toBeLessThanOrEqual(4);
    expect(piezas, 'piezas de Papel').toBeLessThanOrEqual(3);
  });
});
