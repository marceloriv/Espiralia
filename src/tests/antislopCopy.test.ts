/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// Skill antislop-copywriting: español único (salvo los aforismos de DESIGN.md §6), sin vocabulario de relleno y sin em dash (R-02).
const COMPONENTS_DIR = path.resolve('src/components');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : e.name.endsWith('.tsx') ? [full] : [];
  });

const visible = (file: string): string =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const BANNED: RegExp[] = [
  /santuario/i,
  /Clarify your mind/i,
  /focus plan/i,
  /End of day reflection/i,
  /Mini Reminders/i,
  /Eliminate distractions/i,
  /Tasks that matter/i,
  /Focus Schedule/i,
  /TOP PRIORITIES/,
  /Brain Dump/i,
  /Energy Check/i,
  /Client-Side/i,
  /nobleza de la papelería/i,
  /Interoperabilidad Total/i,
  /Cadencia Vital que Respeta/i,
  /—/,
];

const files = walk(COMPONENTS_DIR);

describe('Copy de la interfaz', () => {
  it.each(BANNED.map(re => [String(re), re] as const))('ningún componente contiene %s', (_label, re) => {
    const offenders = files.filter(f => re.test(visible(f))).map(f => path.relative(COMPONENTS_DIR, f));
    expect(offenders).toEqual([]);
  });
});
