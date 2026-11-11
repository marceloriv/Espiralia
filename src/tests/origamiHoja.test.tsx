/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { OrigamiHoja } from '../components/common/OrigamiHoja';

// DESIGN.md §0.12: la hoja de origami de la barra lateral lleva solo la mascota Nautilus, la misma de la página 404.
const css = readFileSync('src/components/common/OrigamiHoja.module.css', 'utf8');

describe('OrigamiHoja (DESIGN.md §0.12)', () => {
  it('es decorativa y lleva solo el Nautilus de la 404: sin molinillo ni flor', () => {
    const { container } = render(<OrigamiHoja />);
    const hoja = container.firstElementChild as HTMLElement;
    expect(hoja.getAttribute('aria-hidden')).toBe('true');
    expect(hoja.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0);
    expect(hoja.children).toHaveLength(1);
    const nautilo = hoja.firstElementChild as HTMLImageElement;
    // Mismo archivo que pinta la 404 (Marca variante="mascota"), decorativo y con su tamaño reservado.
    expect(nautilo.tagName).toBe('IMG');
    expect(nautilo.getAttribute('src')).toMatch(/03-mascota-Nautilus\.svg$/);
    expect(nautilo.getAttribute('alt')).toBe('');
    expect(nautilo.getAttribute('width')).toBe('640');
    expect(nautilo.getAttribute('height')).toBe('460');
  });

  it('el CSS no conserva figuras quitadas ni animaciones, y no usa colores sueltos', () => {
    expect(css).not.toMatch(/\.(molinillo|aspa|rotor|buje|rosa|petalo|follaje|caracol|antena|concha)\b/);
    expect(css).not.toMatch(/animation|@keyframes/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it('los tramos de alto van después de la posición base del Nautilus (si no, el top base gana y la hoja lo corta)', () => {
    const base = css.indexOf('.nautilo {');
    expect(base).toBeGreaterThan(-1);
    expect(css.indexOf('(min-height: 900px)')).toBeGreaterThan(base);
    expect(css.indexOf('(min-height: 980px)')).toBeGreaterThan(base);
  });
});
