import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Antislop Layoutmobile Contract (R-03, R-05, R-35)', () => {
  const indexCss = fs.readFileSync(path.resolve(__dirname, '../index.css'), 'utf-8');
  const appLayoutCss = fs.readFileSync(path.resolve(__dirname, '../components/AppLayout.module.css'), 'utf-8');
  const dashboardCss = fs.readFileSync(path.resolve(__dirname, '../components/DashboardView.module.css'), 'utf-8');
  const plannerCss = fs.readFileSync(path.resolve(__dirname, '../components/PlannerView.module.css'), 'utf-8');
  const todoCss = fs.readFileSync(path.resolve(__dirname, '../components/TodoView.module.css'), 'utf-8');

  it('previene fugas de desplazamiento horizontal en el cuerpo (Horizontal Scroll Leak)', () => {
    expect(indexCss).toMatch(/body\s*\{[^}]*overflow-x:\s*hidden/);
  });

  it('barra de navegacion inferior respeta safe areas y reserva espacio para no tapar contenido', () => {
    // Bottom Nav That Eats Content & safe-area insets
    expect(appLayoutCss).toContain('safe-area-inset-bottom');
    expect(appLayoutCss).toMatch(/\.contentArea\s*\{[^}]*padding-bottom:\s*calc\(/);
  });

  it('DashboardView redefine escala tipografica y espaciado para pantallas moviles (< 640px)', () => {
    expect(dashboardCss).toContain('@media (max-width: 640px)');
    expect(dashboardCss).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.heroCard\s*\{[^}]*padding:\s*18px 16px/);
  });

  it('PlannerView define estado movil para reflow sin desborde (< 640px)', () => {
    expect(plannerCss).toContain('@media (max-width: 640px)');
    expect(plannerCss).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.plannerMainHeading\s*\{[^}]*font-size:\s*20px/);
  });

  it('TodoView escala el encabezado H1 y banner en pantallas moviles (< 640px)', () => {
    expect(todoCss).toContain('@media (max-width: 640px)');
    expect(todoCss).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.editorialH1\s*\{[^}]*font-size:\s*1\.85rem/);
  });
});
