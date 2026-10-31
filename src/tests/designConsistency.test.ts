/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// DESIGN.md §7: un mismo componente se ve y se comporta igual en todas las vistas. Este test vigila lo ya migrado:
// los diálogos toman sus primitivos de common/Dialogo.module.css y todo valor sale de un token de src/index.css.
const componentsDir = path.resolve('src/components');
const read = (rel: string) => readFileSync(path.join(componentsDir, rel), 'utf8');
const tokensCss = readFileSync('src/index.css', 'utf8');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.module.css') ? [path.join(dir, e.name)] : [],
  );
const allModules = walk(componentsDir);

// Modales que ya usan los primitivos de diálogo. Habit y Vault conservan su forma de ritual (papel rasgado) y toman solo velo y controles.
const MODALES = [
  'folders/FolderModal',
  'planner/PlannerBlockModal',
  'planner/GoalsDrawer',
  'notes/NoteModal',
  'profile/ProfileSettingsModal',
  'quickAction/QuickActionModal',
  'habits/HabitModal',
  'vault/VaultModal',
];

describe('Primitivos de diálogo (DESIGN.md §7.2)', () => {
  it.each(MODALES)('%s toma sus controles de common/Dialogo.module.css', modal => {
    const css = read(`${modal}.module.css`);
    expect(css).toContain("from '../common/Dialogo.module.css'");
    // Un modal no redefine el radio de sus botones: lo da el primitivo.
    expect(css, 'botón con radio propio').not.toMatch(/\.(btnSave|saveBtn|submitBtn|btnPrimary|btnCancel|cancelBtn|btnSecondary)\s*\{[^}]*border-radius/);
  });

  it('el velo de todo modal sale de --color-scrim y no de un rgba() propio', () => {
    const offenders = allModules
      .filter(f => /rgba\(\s*20\s*,\s*20\s*,\s*19\s*,\s*0\.(45|5)\s*\)/.test(readFileSync(f, 'utf8')))
      .map(f => path.relative(componentsDir, f));
    expect(offenders).toEqual([]);
  });

  it('Dialogo.module.css no tiene colores sueltos ni transition: all', () => {
    const css = read('common/Dialogo.module.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/transition:\s*all/);
  });

  it('cada var(--token) de Dialogo.module.css existe en src/index.css', () => {
    const css = read('common/Dialogo.module.css');
    const usados = [...new Set([...css.matchAll(/var\(--([a-z0-9-]+)/g)].map(m => m[1]))];
    const faltan = usados.filter(name => !new RegExp(String.raw`--${name}\s*:`).test(tokensCss));
    expect(faltan).toEqual([]);
  });

  it('los tokens nuevos de §7.4 existen en src/index.css', () => {
    for (const name of ['color-scrim', 'color-focus', 'color-text-primary', 'duration-fast', 'color-border-control']) {
      expect(tokensCss, name).toMatch(new RegExp(String.raw`--${name}\s*:`));
    }
  });
});
