/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Papel, TINTE_DE_MODULO } from '../components/common/Papel';

// DESIGN.md §0.3 y §0.4: el Papel es la superficie rasgada de lectura; su tinte codifica el módulo.
describe('Papel', () => {
  it('muestra su contenido y se nombra por su titular', () => {
    render(
      <Papel as="section" aria-labelledby="t-papel">
        <h3 id="t-papel">Recordatorios</h3>
      </Papel>,
    );

    expect(screen.getByRole('region', { name: 'Recordatorios' })).toBeInTheDocument();
  });

  it('por defecto es una tarjeta arena; acepta forma pieza y otro tinte', () => {
    const { container, rerender } = render(<Papel>a</Papel>);
    const papel = () => container.querySelector('[data-tinte]') as HTMLElement;

    expect(papel()).toHaveAttribute('data-forma', 'tarjeta');
    expect(papel()).toHaveAttribute('data-tinte', 'arena');

    rerender(<Papel forma="pieza" tinte="salvia">a</Papel>);
    expect(papel()).toHaveAttribute('data-forma', 'pieza');
    expect(papel()).toHaveAttribute('data-tinte', 'salvia');
  });

  it('la clase extra y los atributos van en el contenedor exterior, que es el que se coloca en el layout', () => {
    const { container } = render(<Papel className="extra" data-prueba="x">a</Papel>);

    expect(container.firstElementChild).toHaveClass('extra');
    expect(container.firstElementChild).toHaveAttribute('data-prueba', 'x');
  });

  it('cada módulo tiene su tinte, sin repetir ninguno', () => {
    expect(TINTE_DE_MODULO).toEqual({
      dashboard: 'arena',
      agenda: 'pizarra',
      planner: 'salvia',
      todo: 'terracota',
      notas: 'ambar',
      carpetas: 'rosa',
      integraciones: 'turquesa',
    });
    expect(new Set(Object.values(TINTE_DE_MODULO)).size).toBe(7);
  });

  describe('CSS', () => {
    const css = readFileSync('src/components/common/Papel.module.css', 'utf8');

    it('solo usa tokens de color, sin degradados lineales, mezcla de capas ni animación', () => {
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(css).not.toMatch(/linear-gradient|mix-blend-mode|blur\(|animation:|infinite/);
    });

    it('en forced-colors conserva un borde visible y quita el recorte', () => {
      const block = css.match(/@media \(forced-colors: active\) \{[\s\S]*?\n\}/)?.[0] ?? '';
      expect(block).toMatch(/clip-path:\s*none/);
      expect(block).toMatch(/border:\s*1px solid CanvasText/);
    });
  });
});
