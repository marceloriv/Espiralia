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

// color-mix(in srgb) interpola los canales sRGB; un color con opacidad N sobre un fondo se ve igual que esa mezcla al N %.
const mixHex = (base: string, pct: number, over: string) =>
  '#' + [1, 3, 5].map(i => Math.round(parseInt(base.slice(i, i + 2), 16) * (pct / 100) + parseInt(over.slice(i, i + 2), 16) * (1 - pct / 100)).toString(16).padStart(2, '0')).join('');

// Color resuelto a hex: literal, var(--token) o color-mix(in srgb, var(--a) N%, var(--b)).
const resolve = (value: string) => {
  const mix = value.match(/^color-mix\(in srgb,\s*var\(--([\w-]+)\)\s+(\d+)%,\s*var\(--([\w-]+)\)\)$/);
  if (mix) return mixHex(token(mix[1]), Number(mix[2]), token(mix[3]));
  const alias = value.match(/^var\(--([\w-]+)\)$/);
  return alias ? token(alias[1]) : value;
};

const colorOf = (body: string, prop: string) =>
  resolve(body.match(new RegExp(String.raw`(?:^|[;\s])${prop}:\s*([^;]+);`))?.[1].trim() ?? '');

describe('contraste del Dashboard', () => {
  it('el chip de críticos cumple 4.5:1', () => {
    const chip = rule('chip');
    const critical = rule('chipCritical');
    const fg = varOf(critical, 'color') ?? varOf(chip, 'color');
    const bg = varOf(critical, 'background-color') ?? varOf(chip, 'background-color');
    expect(contrast(token(fg!), token(bg!))).toBeGreaterThanOrEqual(4.5);
  });

  // Hallazgo 18 de la auditoría 002: el ✓ blanco sobre el salvia #5a826d quedaba en 4.33:1.
  it('la marca del hábito cumplido cumple 4.5:1 sobre su círculo', () => {
    const fg = colorOf(rule('habitPillChecked'), 'color');
    const bg = colorOf(rule('habitPillChecked::before'), 'background-color');
    expect(contrast(fg, bg), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  // Hallazgo 26: la ✕ en reposo iba en --color-muted con opacity 0.6. Un ícono que identifica el control pide 3:1
  // (WCAG 1.4.11) sobre la caja, que pinta --superficie-terracota encima de su color: se mide en los dos extremos.
  it('la ✕ de cada compromiso cumple 3:1 en reposo sobre la caja', () => {
    expect(dashboardCss).toMatch(/\.distractionBox\s*\{\s*background-image:\s*var\(--superficie-terracota\);/);
    const btn = rule('distractionDelBtn');
    const fg = colorOf(btn, 'color');
    const opacity = Number(btn.match(/(?:^|[;\s])opacity:\s*([\d.]+)/)?.[1] ?? 1);
    const stops = tokensCss.match(/--superficie-terracota:[^;]+/)![0].match(/color-mix\(in srgb, var\(--[\w-]+\) \d+%, var\(--[\w-]+\)\)/g)!;
    expect(stops).toHaveLength(2);
    for (const bg of stops.map(resolve)) {
      expect(contrast(mixHex(fg, opacity * 100, bg), bg), `${fg} con opacidad ${opacity} sobre ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });
});
