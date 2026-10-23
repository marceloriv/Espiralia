import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Antislop Layoutmobile Contract (R-03, R-05, R-35)', () => {
  const indexCss = fs.readFileSync(path.resolve(__dirname, '../index.css'), 'utf-8');
  const appLayoutCss = fs.readFileSync(path.resolve(__dirname, '../components/AppLayout.module.css'), 'utf-8');
  const dashboardCss = fs.readFileSync(path.resolve(__dirname, '../components/DashboardView.module.css'), 'utf-8');
  const plannerCss = fs.readFileSync(path.resolve(__dirname, '../components/PlannerView.module.css'), 'utf-8');
  const todoCss = fs.readFileSync(path.resolve(__dirname, '../components/TodoView.module.css'), 'utf-8');
  const notesCss = fs.readFileSync(path.resolve(__dirname, '../components/NotesView.module.css'), 'utf-8');
  const foldersCss = fs.readFileSync(path.resolve(__dirname, '../components/FoldersView.module.css'), 'utf-8');

  it('ninguna hoja de estilo usa 100vh (la barra del navegador móvil lo desborda): se usa 100dvh', () => {
    const componentsDir = path.resolve(__dirname, '../components');
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        const full = path.join(dir, e.name);
        return e.isDirectory() ? walk(full) : e.name.endsWith('.css') ? [full] : [];
      });
    const offenders = [path.resolve(__dirname, '../index.css'), ...walk(componentsDir)]
      .filter(f => /\b100vh\b/.test(fs.readFileSync(f, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '')))
      .map(f => path.basename(f));

    expect(offenders).toEqual([]);
  });

  it('el botón Más solo existe en la barra móvil y los destinos secundarios se ocultan allí', () => {
    expect(appLayoutCss).toMatch(/\.moreWrapper\s*\{[^}]*display:\s*none/);
    const mobileBlock = appLayoutCss.slice(appLayoutCss.indexOf('@media (max-width: 768px)'));
    expect(mobileBlock).toMatch(/\.navItemSecondary\s*\{[^}]*display:\s*none/);
    expect(mobileBlock).toMatch(/\.moreWrapper\s*\{[^}]*display:\s*(flex|block)/);
  });

  // El reset de min-width gana en especificidad a `.checkboxLabel` y `.checkboxTouchTarget` y los encogía a 20-25px de ancho.
  it('el reset min-width:0 de móvil no encoge el label que envuelve un checkbox (área táctil de 44px)', () => {
    const rule = indexCss.match(/@media \(max-width: 768px\)\s*\{\s*(main \*:not[^{]+)\{\s*min-width:\s*0/);
    expect(rule?.[1]).toContain("label:has(> input[type='checkbox'])");
  });

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

  it('AppLayout cede la fecha y el texto del buscador entre 769px y 1280px para que el encabezado no desborde', () => {
    expect(appLayoutCss).toMatch(/@media \(max-width: 1280px\)\s*\{\s*\.headerDate\s*\{[^}]*display:\s*none/);
    expect(appLayoutCss).toMatch(/@media \(max-width: 1100px\)\s*\{\s*\.searchPlaceholder,\s*\.searchShortcut\s*\{[^}]*display:\s*none/);
  });

  it('AppLayout deja Nueva Nota como ícono en móvil para que el título de la vista no se corte', () => {
    expect(appLayoutCss).toMatch(/\.newNoteLabel\s*\{[^}]*position:\s*absolute[^}]*clip:\s*rect\(0 0 0 0\)/);
  });

  it('TodoView mantiene el tamaño de las solapas de área y deja que la fila haga scroll', () => {
    expect(todoCss).toMatch(/\.folderTab\s*\{[^}]*flex-shrink:\s*0[^}]*white-space:\s*nowrap/);
  });

  it('DashboardView deja los siete días de hábitos visibles: columnas de 44px que pasan a otra fila en vez de cortarse', () => {
    expect(dashboardCss).toMatch(/\.habitPillsRow\s*\{[^}]*display:\s*grid[^}]*repeat\(auto-fit,\s*minmax\(44px,\s*1fr\)\)/);
    expect(dashboardCss).toMatch(/\.habitPillChecked,\s*\.habitPillEmpty\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/);
  });

  it('el contenido que no cabe hace scroll o encoge en vez de cortarse (tabla de Carpetas y métricas del Dashboard)', () => {
    expect(foldersCss).toMatch(/\.ledgerTableWrapper\s*\{[^}]*overflow-x:\s*auto/);
    expect(dashboardCss).toMatch(/\.kpiStrip\s*\{[^}]*repeat\(auto-fit,\s*minmax\(min\(100%,\s*150px\),\s*1fr\)\)/);
  });

  it('PlannerView reparte la semana en columnas de 190px que caben, porque la regla global anula el min-width (< 768px)', () => {
    expect(indexCss).toMatch(/@media \(max-width: 768px\)[\s\S]*?main \*:not\(button\)[^{]*\{[^}]*min-width:\s*0/);
    expect(plannerCss).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.weeklyGrid\s*\{[^}]*display:\s*grid/);
    // En escritorio el Pliego abarca las siete columnas aunque el área haga scroll; en móvil vuelve al ancho de la pantalla.
    expect(plannerCss).toMatch(/\.gridArea > \.weekPliego\s*\{[^}]*width:\s*max-content[^}]*min-width:\s*100%/);
    expect(plannerCss).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.gridArea > \.weekPliego\s*\{[^}]*width:\s*auto/);
    expect(plannerCss).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.weeklyGrid\s*\{[^}]*repeat\(auto-fill,\s*minmax\(min\(100%,\s*190px\),\s*1fr\)\)/);
  });

  it('TodoView escala el encabezado H1 y banner en pantallas moviles (< 640px)', () => {
    expect(todoCss).toContain('@media (max-width: 640px)');
    expect(todoCss).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.editorialH1\s*\{[^}]*font-size:\s*1\.85rem/);
  });

  it('NotesView define escala compacta de archivador y pliego para pantallas moviles (< 640px)', () => {
    expect(notesCss).toContain('@media (max-width: 640px)');
    // El pliego (Pliego.module.css) lleva su propio padding móvil; aquí solo queda la escala del archivador.
    expect(notesCss).not.toMatch(/\.binderMechanism/);
  });

  it('FoldersView define scroll-snap y dimensiones adaptadas para carpetas en pantallas moviles (< 640px)', () => {
    expect(foldersCss).toContain('@media (max-width: 640px)');
    expect(foldersCss).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.flatFolderTab[\s\S]*?width:\s*155px/);
    expect(foldersCss).toMatch(/@media \(max-width: 640px\)[\s\S]*?scroll-snap-type:\s*x mandatory/);
  });
});
