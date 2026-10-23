import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Surface & Background Contrast — Dimensional Layering (UI/UX Pro Max)', () => {
  const indexPath = path.resolve(__dirname, '../index.css');
  const indexCss = fs.readFileSync(indexPath, 'utf-8');

  it('declara todos los tokens de superficie y color huérfanos en index.css', () => {
    expect(indexCss).toMatch(/--color-background:\s*var\(--bg-card\);/);
    expect(indexCss).toMatch(/--color-surface-bright:\s*#FFFFFF;/);
    expect(indexCss).toMatch(/--font-mono:\s*var\(--font-family-3\);/);
    expect(indexCss).toMatch(/--color-danger:\s*var\(--color-error\);/);
  });

  it('no existen variables CSS indefinidas utilizadas en archivos module.css', () => {
    const definedTokens = new Set(indexCss.match(/--[a-zA-Z0-9_-]+/g) || []);
    
    function walk(dir: string): string[] {
      let files: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) files = files.concat(walk(full));
        else if (full.endsWith('.module.css')) files.push(full);
      }
      return files;
    }

    const cssFiles = walk(path.resolve(__dirname, '../components'));
    const missing: string[] = [];

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Una variable declarada en el propio módulo (por ejemplo --tono en Papel) también es válida.
      const local = new Set(content.match(/--[a-zA-Z0-9_-]+(?=\s*:)/g) || []);
      const matches = content.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g);
      for (const m of matches) {
        const token = m[1];
        if (!definedTokens.has(token) && !local.has(token)) {
          missing.push(`${token} en ${path.basename(file)}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('DashboardView tarjetas principales usan token de tarjeta y no el lienzo canvas', () => {
    const dashCssPath = path.resolve(__dirname, '../components/DashboardView.module.css');
    const dashCss = fs.readFileSync(dashCssPath, 'utf-8');

    // .bentoCard no debe camuflarse con var(--color-canvas)
    expect(dashCss).toMatch(/\.bentoCard\s*\{[^}]*background-color:\s*var\(--bg-card/);
  });

  it('las tarjetas de Papel (Horario, Recordatorios, Planner, Métricas) usan un tinte y no el lienzo canvas', () => {
    const papelCss = fs.readFileSync(path.resolve(__dirname, '../components/common/Papel.module.css'), 'utf-8');

    expect(papelCss).toMatch(/\.papel\s*\{[^}]*background-color:\s*var\(--tono\)/);
    expect(papelCss).toMatch(/\.papel\s*\{[^}]*--tono:\s*var\(--papel-arena\)/);
    const arena = indexCss.match(/--papel-arena:\s*(#[0-9a-fA-F]{6})/)?.[1];
    const canvas = indexCss.match(/--color-canvas:\s*(#[0-9a-fA-F]{6})/)?.[1];
    expect(arena).toBeDefined();
    expect(arena?.toLowerCase()).not.toBe(canvas?.toLowerCase());
    expect(papelCss).not.toMatch(/background-color:\s*var\(--color-canvas/);
  });

  it('PlannerDayColumn usa fondo opaco de tarjeta para no traslucir la trama', () => {
    const colCssPath = path.resolve(__dirname, '../components/planner/PlannerDayColumn.module.css');
    const colCss = fs.readFileSync(colCssPath, 'utf-8');
    expect(colCss).not.toContain('rgba(252, 249, 246, 0.6)');
    expect(colCss).toMatch(/background:\s*var\(--bg-card/);
  });
});
