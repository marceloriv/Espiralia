/// <reference types="node" />
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// DESIGN.md §0.10 criterio 5: la app no pide nada a dominios externos al cargar. Las fuentes viven en src/assets/fonts.
const html = readFileSync('index.html', 'utf8');
const fontsCss = readFileSync('src/fonts.css', 'utf8');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : /\.(css|tsx?)$/.test(e.name) && !full.includes(`${path.sep}tests${path.sep}`) ? [full] : [];
  });

describe('Sin peticiones externas al cargar', () => {
  it('index.html no enlaza hojas de estilo ni fuentes de otros dominios', () => {
    expect(html).not.toMatch(/(?:href|src)=["']https?:\/\//i);
    expect(html).not.toMatch(/googleapis|gstatic/i);
  });

  it('ningún CSS importa ni referencia recursos remotos con url() o @import', () => {
    const offenders = walk('src')
      .filter(f => f.endsWith('.css'))
      .filter(f => /(?:@import\s+(?:url\()?["']?|url\(\s*["']?)https?:\/\//i.test(readFileSync(f, 'utf8')))
      .map(f => path.relative('src', f));
    expect(offenders).toEqual([]);
  });

  it('cada @font-face apunta a un archivo woff2 que existe', () => {
    const files = [...fontsCss.matchAll(/url\("\.\/([^"]+\.woff2)"\)/g)].map(m => m[1]);
    expect(files.length).toBeGreaterThanOrEqual(5);
    for (const f of files) expect(existsSync(path.join('src', f)), f).toBe(true);
  });

  // Técnica: tabla de decisión. Cada familia que el CSS nombra primero debe tener su @font-face.
  it.each(['Fraunces', 'Atkinson Hyperlegible Next', 'Playball', 'Reenie Beanie', 'Spline Sans Mono'])('la familia %s está autoalojada con font-display swap', family => {
    const block = fontsCss.split('@font-face').find(b => b.includes(`font-family: "${family}"`));
    expect(block, family).toBeDefined();
    expect(block).toMatch(/font-display:\s*swap/);
  });

  it('src/main.tsx carga fonts.css', () => {
    expect(readFileSync('src/main.tsx', 'utf8')).toMatch(/import ['"]\.\/fonts\.css['"]/);
  });
});
