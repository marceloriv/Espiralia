/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll } from 'vitest';

// DESIGN.md §0.10 criterio 4 y antislop-layoutmobile: en móvil el Dashboard pone lo accionable primero.
// La estructura del hero se reordena con `order` dentro de .dashboardContainer; el contenido no cambia.
const css = readFileSync('src/components/DashboardView.module.css', 'utf8');
const tsx = readFileSync('src/components/DashboardView.tsx', 'utf8');

const mobileBlock = (): string => {
  const blocks = [...css.matchAll(/@media \(max-width: 960px\) \{([\s\S]*?)\n\}/g)].map(m => m[1]);
  const found = blocks.find(b => /\.dashboardContainer\s*>\s*\*/.test(b));
  if (!found) throw new Error('no hay bloque móvil con .dashboardContainer > *');
  return found;
};

const orderOf = (block: string, cls: string): number => {
  const rule = block.match(new RegExp(String.raw`\.${cls}\s*\{[^}]*?order:\s*(\d+)`));
  if (!rule) throw new Error(`.${cls} sin order en el bloque móvil`);
  return Number(rule[1]);
};

describe('Dashboard en móvil: lo accionable primero', () => {
  let block = '';
  beforeAll(() => {
    block = mobileBlock();
  });

  it('el encabezado compacto va primero y las tareas del día enseguida', () => {
    expect(orderOf(block, 'heroHead')).toBeLessThan(orderOf(block, 'mainLayoutGrid'));
    expect(orderOf(block, 'mainLayoutGrid')).toBeLessThan(orderOf(block, 'quickSection'));
  });

  it('el aforismo, el lema y las tarjetas de serenidad van después de las tareas y los accesos', () => {
    const despues = ['heroAphorism', 'tactilePostIt', 'bentoTrio'].map(c => orderOf(block, c));
    expect(Math.min(...despues)).toBeGreaterThan(orderOf(block, 'quickSection'));
  });

  it('el resto de secciones queda al final', () => {
    const resto = Number(block.match(/\.dashboardContainer\s*>\s*\*\s*\{[^}]*?order:\s*(\d+)/)?.[1]);
    expect(resto).toBeGreaterThan(orderOf(block, 'bentoTrio'));
  });

  it('los accesos rápidos pasan a dos columnas para no ocupar media pantalla', () => {
    expect(block).toMatch(/\.quickGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/);
  });

  it('el encabezado esencial agrupa fecha, saludo, subtítulo y contadores en un solo bloque', () => {
    const head = tsx.match(/<div className=\{styles\.heroHead\}>([\s\S]*?)\n {12}<\/div>\n\n {12}<blockquote/)?.[1] ?? '';
    for (const pieza of ['fechaBloque', 'dash-greeting', 'heroSubtitle', 'heroChips']) expect(head, pieza).toContain(pieza);
    expect(head).not.toContain('heroAphorism');
  });

  it('en tableta (600 a 960px) la columna derecha pasa a dos columnas en vez de estirarse a todo el ancho', () => {
    const tablet = css.match(/@media \(min-width: 600px\) and \(max-width: 960px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(tablet).toMatch(/\.mainRightCol\s*\{[^}]*display:\s*grid/);
    expect(tablet).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });
});
