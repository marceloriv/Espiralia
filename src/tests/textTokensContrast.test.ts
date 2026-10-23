/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// R-25: el texto necesita 4.5:1 sobre todas las superficies donde puede aparecer.
const tokensCss = readFileSync('src/index.css', 'utf8');

const token = (name: string): string => {
  const match = tokensCss.match(new RegExp(String.raw`--${name}:\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --${name} no encontrado`);
  return match[1];
};

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

const SURFACES = ['color-canvas', 'color-surface-card', 'color-surface-warm', 'color-surface-cream-strong'].map(token).concat('#ffffff');
const TEXT_TOKENS = ['color-muted', 'color-text-success', 'color-text-teal', 'color-text-amber', 'color-text-primary-active'];

// DESIGN.md §0.4: color-mix(in srgb, <base> N%, <canvas>) interpola los canales sRGB; se resuelve aquí sin navegador.
const mixHex = (base: string, pct: number, over: string): string =>
  '#' + [1, 3, 5].map(i => {
    const a = parseInt(base.slice(i, i + 2), 16);
    const b = parseInt(over.slice(i, i + 2), 16);
    return Math.round(a * (pct / 100) + b * (1 - pct / 100)).toString(16).padStart(2, '0');
  }).join('');

const papelTint = (name: string): string => {
  const m = tokensCss.match(new RegExp(String.raw`--${name}:\s*([^;]+);`));
  if (!m) throw new Error(`token --${name} no encontrado`);
  const mix = m[1].match(/color-mix\(in srgb,\s*var\(--([\w-]+)\)\s+(\d+)%,\s*var\(--([\w-]+)\)\)/);
  if (mix) return mixHex(token(mix[1]), Number(mix[2]), token(mix[3]));
  const alias = m[1].match(/var\(--([\w-]+)\)/);
  if (alias) return token(alias[1]);
  const literal = m[1].trim().match(/^#[0-9a-fA-F]{6}$/);
  if (literal) return literal[0];
  throw new Error(`--${name} no es color-mix, alias ni hex`);
};

const TINTES = ['arena', 'pizarra', 'salvia', 'terracota', 'ambar', 'rosa', 'turquesa'];

const saturation = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
};

const distance = (a: string, b: string): number =>
  Math.hypot(...[1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)));

describe('Tintes de Papel con contraste AA', () => {
  const textos = ['color-ink', 'color-body'].map(token);

  it.each(TINTES.flatMap(t => [`papel-${t}`, `papel-${t}-fuerte`]))('%s deja leer el texto de tinta y de cuerpo', name => {
    const bg = papelTint(name);
    for (const fg of textos) {
      expect(ratio(fg, bg), `${fg} sobre ${name} (${bg})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('cada tinte tiene color propio: saturación mínima y ningún par se confunde a simple vista', () => {
    const tintes = TINTES.map(t => ({ t, hex: papelTint(`papel-${t}`) }));
    for (const { t, hex } of tintes) expect(saturation(hex), `${t} (${hex})`).toBeGreaterThanOrEqual(0.3);
    for (const [i, a] of tintes.entries()) {
      for (const b of tintes.slice(i + 1)) {
        expect(distance(a.hex, b.hex), `${a.t} (${a.hex}) contra ${b.t} (${b.hex})`).toBeGreaterThanOrEqual(15);
      }
    }
  });

  // Dentro del Papel, el texto secundario y de estado usa variantes algo más oscuras: sobre los tintes saturados los tokens globales quedan bajo 4.5:1.
  const TEXTOS_DE_PAPEL = {
    'color-muted': 'papel-texto-suave',
    'color-text-success': 'papel-texto-exito',
    'color-text-teal': 'papel-texto-turquesa',
    'color-text-amber': 'papel-texto-ambar',
    'color-text-primary-active': 'papel-texto-magenta',
    'color-text-error': 'papel-texto-error',
  };

  it.each(Object.values(TEXTOS_DE_PAPEL))('%s alcanza 4.5:1 sobre todos los tintes de superficie', name => {
    const fg = token(name);
    for (const t of TINTES) {
      const bg = papelTint(`papel-${t}`);
      expect(ratio(fg, bg), `${name} (${fg}) sobre papel-${t} (${bg})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el Papel redefine cada token de texto con su variante oscura', () => {
    const css = readFileSync('src/components/common/Papel.module.css', 'utf8');
    const regla = css.match(/\n\.papel\s*\{[^}]*\}/)?.[0] ?? '';
    for (const [global, local] of Object.entries(TEXTOS_DE_PAPEL)) {
      expect(regla, global).toContain(`--${global}: var(--${local});`);
    }
  });

  it('el tinte fuerte es más intenso que el claro en cada módulo', () => {
    const canvas = token('color-canvas');
    for (const t of TINTES.filter(x => x !== 'arena')) {
      expect(ratio(papelTint(`papel-${t}-fuerte`), canvas), t).toBeGreaterThan(ratio(papelTint(`papel-${t}`), canvas));
    }
  });
});

describe('Tokens de texto con contraste AA', () => {
  it.each(TEXT_TOKENS)('%s alcanza 4.5:1 sobre todas las superficies', name => {
    const fg = token(name);
    for (const bg of SURFACES) {
      expect(ratio(fg, bg), `${name} (${fg}) sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('ningún módulo CSS usa tokens decorativos como color de texto', () => {
    const componentsDir = path.resolve('src/components');
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.module.css') ? [path.join(dir, e.name)] : [],
      );
    const decorative = /(^|[;{\s])color:\s*var\(--color-(muted-soft|accent-teal|success|accent-amber|primary-active|tertiary|secondary)\b/m;

    const offenders = walk(componentsDir)
      .filter(f => decorative.test(readFileSync(f, 'utf8')))
      .map(f => path.relative(componentsDir, f));

    expect(offenders).toEqual([]);
  });
});
