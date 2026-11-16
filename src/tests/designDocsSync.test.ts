/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// DESIGN.md dice describir lo vigente: este test compara sus tablas de valores con src/index.css,
// para que una cifra cambiada en el CSS sin tocar el documento falle aquí y no se descubra meses después.
const doc = readFileSync('DESIGN.md', 'utf8');
const css = readFileSync('src/index.css', 'utf8');

const block = (open: string): string => {
  const start = css.indexOf(open);
  expect(start, `bloque ${open} no encontrado en index.css`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('\n}', start));
};
const light = block(':root {');
const dark = block(':root[data-theme="dark"]:not([data-force-light]) {');

const declared = (scope: string, name: string): string | undefined =>
  scope.match(new RegExp(String.raw`(?:^|\s)${name}:\s*([^;]+);`))?.[1];
const norm = (v: string | undefined): string => (v ?? '').toLowerCase().replace(/\s+/g, '');

const section = (from: string, to: string): string => {
  const start = doc.indexOf(from);
  const end = doc.indexOf(to, start + 1);
  expect(start, `sección ${from} no encontrada en DESIGN.md`).toBeGreaterThan(-1);
  expect(end, `sección ${to} no encontrada en DESIGN.md`).toBeGreaterThan(start);
  return doc.slice(start, end);
};

// Las tablas de la lista de §7.4 van indentadas: se recorta antes de mirar el borde.
const rows = (md: string): string[][] =>
  md.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('|') && !/^\|\s*:?-/.test(l))
    .map(l => l.split('|').slice(1, -1).map(c => c.trim().replace(/\*\*/g, '')));

const TOKEN_CELL = /^`(--[a-z0-9-]+)`$/;
// Un valor con alternativa entre paréntesis ("`#A` (`#B`)") también entra: se marca como fallo, un token tiene un solo valor.
const VALUE_CELL = /^`(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))`(\s*\(`[^`]+`\))?$/;
const firstCode = (cell: string): string | undefined => cell.match(/`([^`]+)`/)?.[1];

describe('DESIGN.md frente a src/index.css', () => {
  it.each([
    ['§2 tokens de color', section('## 2.', '## 3.'), 30],
    ['§0.4 tintes de papel', section('### 0.4', '### 0.5'), 7],
  ])('%s: cada valor claro documentado coincide con el CSS', (_nombre, md, minimo) => {
    const desvios: string[] = [];
    let revisados = 0;
    for (const r of rows(md)) {
      const t = r.find(c => TOKEN_CELL.test(c));
      const v = r.find(c => VALUE_CELL.test(c));
      if (!t || !v) continue;
      revisados++;
      const nombre = t.slice(1, -1);
      const valor = firstCode(v) ?? '';
      const real = declared(light, nombre);
      if (norm(real) !== norm(valor)) desvios.push(`${nombre}: doc ${valor}, css ${real ?? '(sin declarar)'}`);
      if (v.includes('(`')) desvios.push(`${nombre}: la celda lista un valor alternativo (${v})`);
    }
    expect(revisados).toBeGreaterThanOrEqual(minimo);
    expect(desvios).toEqual([]);
  });

  it('§4: cada sombra documentada coincide con su token', () => {
    const desvios: string[] = [];
    let revisados = 0;
    for (const linea of section('### Sombras', '## 5.').split('\n')) {
      const m = linea.match(/\(`(--shadow-[a-z-]+)`\):\s*`([^`]+)`/);
      if (!m) continue;
      revisados++;
      if (norm(declared(light, m[1])) !== norm(m[2])) desvios.push(`${m[1]}: doc ${m[2]}, css ${declared(light, m[1])}`);
    }
    expect(revisados).toBeGreaterThanOrEqual(5);
    expect(desvios).toEqual([]);
  });

  it('§7.4: la tabla de tokens oscuros coincide con el CSS en claro y en oscuro', () => {
    const desvios: string[] = [];
    let revisados = 0;
    for (const r of rows(section('### 7.4', '### 7.5'))) {
      const nombre = r[0]?.match(/`(--[a-z0-9-]+)`/)?.[1];
      if (r.length !== 4 || !nombre) continue;
      const [claro, oscuro] = [firstCode(r[1]), firstCode(r[2])];
      if (!claro || !oscuro) continue;
      revisados++;
      // Un token que el bloque oscuro no redeclara hereda el claro.
      if (norm(declared(light, nombre)) !== norm(claro)) desvios.push(`${nombre} claro: doc ${claro}, css ${declared(light, nombre)}`);
      const realOscuro = declared(dark, nombre) ?? declared(light, nombre);
      if (norm(realOscuro) !== norm(oscuro)) desvios.push(`${nombre} oscuro: doc ${oscuro}, css ${realOscuro}`);
    }
    expect(revisados).toBeGreaterThan(8);
    expect(desvios).toEqual([]);
  });

  it('§7.4: los siete tintes oscuros y sus variantes fuertes coinciden con el CSS', () => {
    const desvios: string[] = [];
    let revisados = 0;
    for (const r of rows(section('### 7.4', '### 7.5'))) {
      const tinte = r[1]?.match(/^(\S+)\s+`#/)?.[1];
      if (r.length !== 4 || !tinte) continue;
      revisados++;
      const id = tinte.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const esperado: [string, string, string | undefined][] = [
        [`--papel-${id}`, firstCode(r[1]) ?? '', declared(light, `--papel-${id}`)],
        [`--papel-${id}`, firstCode(r[2]) ?? '', declared(dark, `--papel-${id}`)],
        [`--papel-${id}-fuerte`, firstCode(r[3]) ?? '', declared(dark, `--papel-${id}-fuerte`)],
      ];
      for (const [nombre, valor, real] of esperado) {
        if (norm(real) !== norm(valor)) desvios.push(`${nombre}: doc ${valor}, css ${real}`);
      }
    }
    expect(revisados).toBe(7);
    expect(desvios).toEqual([]);
  });

  it('cada --token citado existe en algún .css de src/', () => {
    // Nombres de componente y marcadores de ejemplo que el documento escribe con forma de variable.
    const noEsVariable = new Set(['--btn-primary', '--btn-secondary', '--btn-secondary-dark', '--x', '--token', '--nombre']);
    const definidos = new Set<string>();
    for (const f of readdirSync('src', { recursive: true, encoding: 'utf8' })) {
      if (!f.endsWith('.css')) continue;
      for (const m of readFileSync(`src/${f}`, 'utf8').matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)) definidos.add(m[1]);
    }
    const citados = [...new Set([...doc.matchAll(/--[a-z][a-z0-9-]*/g)].map(m => m[0]))]
      // Un guion final marca un prefijo ("--papel-*", "--papel-<tinte>-fuerte"), no un token.
      .filter(t => !t.endsWith('-') && !noEsVariable.has(t));
    expect(citados.length).toBeGreaterThan(100);
    expect(citados.filter(t => !definidos.has(t))).toEqual([]);
  });

  it('cada ordinal de «excepción a MOTION 1» aparece una sola vez', () => {
    // Dos excepciones se llamaron "cuarta" el 2026-11-16: el registro de §0.12 las numera sin repetir.
    const ordinales = [...doc.matchAll(/(primera|segunda|tercera|cuarta|quinta|sexta|s[eé]ptima|octava|novena)\s+excepci[oó]n\s+a\s+MOTION\s+1/gi)]
      .map(m => m[1].toLowerCase());
    expect(ordinales.length).toBeGreaterThan(4);
    expect(new Set(ordinales).size).toBe(ordinales.length);
  });
});
