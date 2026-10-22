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
