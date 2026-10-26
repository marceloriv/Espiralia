/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// DESIGN.md §6: no introducir colores fuera de los tokens. Aquí se vigilan los colores fuera de paleta
// detectados en la auditoría 001 y la coherencia de los fallbacks var(--token, #hex) con el valor del token.
const COMPONENTS_DIR = path.resolve('src/components');
const tokensCss = readFileSync('src/index.css', 'utf8');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : /\.(module\.css|tsx)$/.test(e.name) ? [full] : [];
  });

const files = walk(COMPONENTS_DIR);
const rel = (f: string) => path.relative(COMPONENTS_DIR, f);

// Primera definición hexadecimal de cada token en index.css.
const tokenHex = new Map<string, string>();
for (const m of tokensCss.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
  if (!tokenHex.has(m[1])) tokenHex.set(m[1], m[2].toLowerCase());
}

describe('Paleta solo con tokens', () => {
  it.each(['#6e0081', '#324b3e', '#3b82f6', '#10b981', '#f59e0b', '#d97706', '#b45309', '#b91c1c', '#520061'])(
    'ningún componente usa el color fuera de paleta %s',
    hex => {
      const offenders = files.filter(f => readFileSync(f, 'utf8').toLowerCase().includes(hex)).map(rel);
      expect(offenders).toEqual([]);
    },
  );

  it('los fallbacks var(--token, #hex) coinciden con el valor del token', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/var\((--[\w-]+)\s*,\s*(#[0-9a-fA-F]{6})\s*\)/g)) {
        const expected = tokenHex.get(m[1]);
        if (expected && expected !== m[2].toLowerCase()) offenders.push(`${rel(f)}: ${m[1]} ${m[2]} (token ${expected})`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
