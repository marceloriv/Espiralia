/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { turnPage } from '../utils/pageTurn';

// DESIGN.md §0.7: una sola escena (pasar la página), con la View Transitions API como mejora progresiva.
const indexCss = readFileSync('src/index.css', 'utf8');
const appLayoutCss = readFileSync('src/components/AppLayout.module.css', 'utf8');

const setReducedMotion = (reduce: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
  })) as unknown as typeof window.matchMedia;
};

// El tipo del DOM declara la API como obligatoria; en los tests se simula su ausencia y su presencia.
const vtDoc = document as unknown as { startViewTransition?: unknown };

afterEach(() => {
  delete vtDoc.startViewTransition;
});

describe('turnPage', () => {
  // Técnica: tabla de decisión (soporte del navegador x preferencia de movimiento).
  it('inicia la transición cuando hay soporte y el usuario no pidió menos movimiento', () => {
    setReducedMotion(false);
    const update = vi.fn();
    const start = vi.fn((cb: () => void) => cb());
    vtDoc.startViewTransition = start;

    turnPage(update);

    expect(start).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('con prefers-reduced-motion cambia de vista al instante, sin transición', () => {
    setReducedMotion(true);
    const update = vi.fn();
    const start = vi.fn();
    vtDoc.startViewTransition = start;

    turnPage(update);

    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('sin soporte de View Transitions cambia de vista al instante', () => {
    setReducedMotion(false);
    const update = vi.fn();

    turnPage(update);

    expect(update).toHaveBeenCalledTimes(1);
  });
});

describe('CSS de pasar la página y del grano', () => {
  it('el contenido entra en 240ms con 8px de desplazamiento y el resto de la pantalla no se anima', () => {
    expect(indexCss).toMatch(/::view-transition-new\(pagina\)\s*\{[^}]*pagina-entra 240ms/);
    expect(indexCss).toMatch(/@keyframes pagina-entra\s*\{[^}]*translateX\(8px\)/);
    expect(indexCss).toMatch(/::view-transition-old\(root\),\s*::view-transition-new\(root\)\s*\{[^}]*animation:\s*none/);
    expect(appLayoutCss).toMatch(/\.contentArea\s*\{[^}]*view-transition-name:\s*pagina/);
  });

  it('con prefers-reduced-motion se apagan las animaciones de la transición', () => {
    expect(indexCss).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*::view-transition-group\(\*\)[\s\S]*?animation:\s*none !important/);
  });

  it('el grano es un fondo SVG del body al 3 %, sin capa fija ni mix-blend-mode', () => {
    const body = indexCss.match(/(?:^|\n)body\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(body).toMatch(/background-image:\s*url\("data:image\/svg\+xml/);
    expect(body).toContain("opacity='.03'");
    expect(body).not.toMatch(/position:\s*fixed/);
    // `mix-blend-mode: normal` no mezcla nada: solo anula el plus-lighter del navegador durante el cambio de tema (src/utils/theme.ts).
    expect(indexCss.replace(/mix-blend-mode:\s*normal;/g, '')).not.toMatch(/mix-blend-mode/);
  });
});
