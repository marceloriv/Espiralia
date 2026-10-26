/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// DESIGN.md §3: el texto más pequeño es 11px (caption). Menos es ilegible y falla el zoom de texto.
const COMPONENTS_DIR = path.resolve('src/components');
const MIN_PX = 11;

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : e.name.endsWith('.module.css') ? [full] : [];
  });

describe('Escala tipográfica', () => {
  it('ningún font-size queda por debajo de 11px', () => {
    const offenders: string[] = [];
    for (const file of walk(COMPONENTS_DIR)) {
      const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/font-size:\s*([\d.]+)(px|rem)\b/g)) {
        const px = parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1);
        if (px < MIN_PX - 0.01) offenders.push(`${path.relative(COMPONENTS_DIR, file)}: ${m[0]}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
