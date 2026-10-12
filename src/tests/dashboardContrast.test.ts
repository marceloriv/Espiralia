/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// Lectura directa del archivo: con ?raw, Vitest entrega el objeto del CSS Module en vez del texto.
const tokensCss = readFileSync('src/index.css', 'utf8');
const dashboardCss = readFileSync('src/components/DashboardView.module.css', 'utf8');

// Revisión final, Important 1: WCAG 1.4.3 exige 4.5:1 para texto normal.
// Se calcula desde el CSS real para que un cambio de token o de regla rompa el test.
const token = (name: string) => {
  const match = tokensCss.match(new RegExp(String.raw`--${name}:\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --${name} no encontrado`);
  return match[1];
};

const rule = (selector: string) => {
  const match = dashboardCss.match(new RegExp(String.raw`\.${selector}\s*\{([^}]*)\}`));
  if (!match) throw new Error(`regla .${selector} no encontrada`);
  return match[1];
};

const varOf = (body: string, prop: string) => body.match(new RegExp(String.raw`(?:^|[;\s])${prop}:\s*var\(--([\w-]+)\)`))?.[1];

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('contraste del Dashboard', () => {
  it('el chip de críticos cumple 4.5:1', () => {
    const chip = rule('chip');
    const critical = rule('chipCritical');
    const fg = varOf(critical, 'color') ?? varOf(chip, 'color');
    const bg = varOf(critical, 'background-color') ?? varOf(chip, 'background-color');
    expect(contrast(token(fg!), token(bg!))).toBeGreaterThanOrEqual(4.5);
  });
});
