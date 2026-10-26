/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pliego } from '../components/common/Pliego';

// DESIGN.md §0.2: el pliego encuadernado es la firma visual. Es decorativo en sus anillas y neutro para lectores de pantalla.
describe('Pliego', () => {
  it('muestra su contenido y se nombra por su titular', () => {
    render(
      <Pliego aria-labelledby="titulo-pliego">
        <h3 id="titulo-pliego">Prioridades de hoy</h3>
        <p>Contenido</p>
      </Pliego>,
    );

    expect(screen.getByRole('region', { name: 'Prioridades de hoy' })).toHaveTextContent('Contenido');
  });

  it('dibuja las anillas lateral y superior ocultas a lectores de pantalla', () => {
    const { container } = render(<Pliego>x</Pliego>);

    const rings = container.querySelectorAll('svg');
    expect(rings).toHaveLength(2);
    rings.forEach(svg => expect(svg).toHaveAttribute('aria-hidden', 'true'));
  });

  it('usa ids de patrón únicos por instancia', () => {
    const { container } = render(
      <>
        <Pliego>a</Pliego>
        <Pliego>b</Pliego>
      </>,
    );

    const ids = [...container.querySelectorAll('pattern')].map(p => p.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('acepta otra etiqueta y una clase extra', () => {
    const { container } = render(
      <Pliego as="div" className="extra">
        x
      </Pliego>,
    );

    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(container.firstElementChild).toHaveClass('extra');
  });

  it('el CSS del pliego solo usa tokens de color y sin animaciones', () => {
    const css = readFileSync('src/components/common/Pliego.module.css', 'utf8');

    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/gradient|blur\(|animation:|infinite/);
  });
});
