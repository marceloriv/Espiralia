import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// R-36 / R-38: la UI no puede afirmar certificaciones, cifrado en reposo, versiones ni funciones que la app no tiene.
const COMPONENTS_DIR = path.resolve(__dirname, '../components');

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith('.tsx') ? [full] : [];
  });

// Los comentarios no se muestran al usuario: se descartan antes de buscar.
const visibleSource = (file: string): string =>
  fs
    .readFileSync(file, 'utf-8')
    .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const BANNED_EVERYWHERE: RegExp[] = [
  /Certificad/,
  /Verificado/,
  /AES-256/,
  /IndexedDB/,
  /cifrado en reposo/i,
  /almacenamiento cifrado/i,
  /bóveda encriptada/i,
  /Bóveda Cifrada/,
  /v2\.4|v2\.6|v4\.8/,
  /Exporta a \.MD/,
  /A4\/A5/,
  /Plantillas Imprimibles/,
  /ferrogal/i,
  /Biorritmo/,
  /0 bytes transmitidos/,
  /LOCAL ENCRIPTADO/,
  // Firma personal y ejemplos de otro dominio (conducción) que no pertenecen a un producto público.
  /r\.v\. notas de taller/,
  /Conducción real/,
  /normas viales/,
  /\bmilitar\b/i,
];

const files = walk(COMPONENTS_DIR);
const landingFiles = files.filter(f => f.includes(`${path.sep}landing${path.sep}`) || f.endsWith('LandingView.tsx'));

describe('Afirmaciones honestas en la UI', () => {
  it.each(BANNED_EVERYWHERE.map(re => [String(re), re] as const))('ningún componente contiene %s', (_label, re) => {
    const offenders = files.filter(f => re.test(visibleSource(f))).map(f => path.relative(COMPONENTS_DIR, f));
    expect(offenders).toEqual([]);
  });

  it('la landing no promete un banco CONASET', () => {
    const offenders = landingFiles.filter(f => /CONASET/.test(visibleSource(f))).map(f => path.relative(COMPONENTS_DIR, f));
    expect(offenders).toEqual([]);
  });
});
