/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// Skill antislop-ui: el emoji decorativo en la UI es una marca de texto generado. Los iconos salen de lucide-react.
// Se admiten ♡ (aforismos exigidos por DESIGN.md §6) y © (símbolo tipográfico).
const COMPONENTS_DIR = path.resolve('src/components');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : e.name.endsWith('.tsx') ? [full] : [];
  });

const visible = (file: string): string =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/[♡©]/g, '');

describe('Sin emoji decorativo en los componentes', () => {
  it('ningún .tsx de src/components contiene emoji', () => {
    const offenders = walk(COMPONENTS_DIR)
      .filter(f => /\p{Extended_Pictographic}/u.test(visible(f)))
      .map(f => path.relative(COMPONENTS_DIR, f));

    expect(offenders).toEqual([]);
  });
});
