/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// DESIGN.md §0.6: la ruta crítica (display y cuerpo) no pasa de 120KB, y las cuatro familias del sistema son las únicas que se nombran.
const FONTS_DIR = 'src/assets/fonts';
const kb = (file: string) => statSync(path.join(FONTS_DIR, file)).size / 1024;
const indexCss = readFileSync('src/index.css', 'utf8');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : /\.css$/.test(e.name) ? [full] : [];
  });

describe('Presupuesto y uso de la tipografía', () => {
  it('display (Fraunces) y cuerpo (Atkinson) suman menos de 120KB', () => {
    expect(kb('fraunces-latin.woff2') + kb('atkinson-hyperlegible-next-latin.woff2')).toBeLessThan(120);
  });

  it('solo existen los cuatro archivos de la tipografía actual', () => {
    expect(readdirSync(FONTS_DIR).sort()).toEqual([
      'atkinson-hyperlegible-next-latin.woff2',
      'fraunces-latin.woff2',
      'reenie-beanie-latin.woff2',
      'spline-sans-mono-latin.woff2',
    ]);
  });

  // Técnica: tabla de decisión. Cada rol de DESIGN.md §0.6 apunta a su familia.
  it.each([
    ['--font-primary', 'Fraunces'],
    ['--font-family-2', 'Atkinson Hyperlegible Next'],
    ['--font-script', 'Reenie Beanie'],
    ['--font-family-3', 'Spline Sans Mono'],
  ])('%s empieza por %s', (token, family) => {
    const m = indexCss.match(new RegExp(`${token}:\\s*"([^"]+)"`));
    expect(m?.[1]).toBe(family);
  });

  it('ningún CSS nombra las familias anteriores', () => {
    const offenders = walk('src')
      .filter(f => /Caveat|JetBrains Mono|Copernicus|StyreneB|'Inter'|"Inter"/.test(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')))
      .map(f => path.relative('src', f));
    expect(offenders).toEqual([]);
  });

  it('el manuscrito nunca baja de 22px (--text-script-min)', () => {
    expect(indexCss).toMatch(/--text-script-min:\s*1\.375rem/);
    const offenders: string[] = [];
    for (const f of walk('src')) {
      const css = readFileSync(f, 'utf8');
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*font-family:\s*var\(--font-script\)[^{}]*)\}/g)) {
        const size = m[2].match(/font-size:\s*([^;]+);/)?.[1].trim();
        if (!size) continue;
        const px = size.endsWith('rem') ? parseFloat(size) * 16 : size.endsWith('px') ? parseFloat(size) : size.includes('--text-script-min') ? 22 : NaN;
        if (!(px >= 22)) offenders.push(`${path.relative('src', f)} ${m[1].trim()} ${size}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
