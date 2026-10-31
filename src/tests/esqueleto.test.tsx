/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Esqueleto } from '../components/common/Esqueleto';
import { RouteLoadingFallback } from '../components/RouteLoadingFallback';

// DESIGN.md §7.6: un estado de carga es un esqueleto con la silueta del contenido, nunca un spinner ni un vacío.
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap(f => {
    const full = path.join(dir, f);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
const componentsDir = path.resolve('src/components');
const cssModules = walk(componentsDir).filter(f => f.endsWith('.module.css'));

describe('Esqueleto de carga (DESIGN.md §7.6)', () => {
  it('cada pieza es decorativa: aria-hidden y sin texto', () => {
    const { container } = render(<Esqueleto forma="circulo" ancho="3rem" alto="3rem" />);
    const pieza = container.firstElementChild as HTMLElement;
    expect(pieza).toHaveAttribute('aria-hidden', 'true');
    expect(pieza).toHaveTextContent('');
    expect(pieza.style.width).toBe('3rem');
  });

  it('la carga de una vista anuncia qué carga una sola vez y dibuja piezas, no un spinner', () => {
    const { container } = render(<RouteLoadingFallback />);
    const estado = screen.getByRole('status');
    expect(estado).toHaveTextContent(/cargando espacio/i);
    expect(estado).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(4);
  });

  it('ningún módulo CSS define un spinner giratorio', () => {
    const offenders = cssModules
      .filter(f => /@keyframes\s+spin\b|animation:[^;]*\bspin\b/.test(readFileSync(f, 'utf8')))
      .map(f => path.relative(componentsDir, f));
    expect(offenders).toEqual([]);
  });
});
