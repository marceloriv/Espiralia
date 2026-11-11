/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VentanaCarga } from '../components/common/VentanaCarga';
import { RouteLoadingFallback } from '../components/RouteLoadingFallback';
import { esArranque, reiniciarArranque, terminarArranque } from '../utils/arranqueCarga';

// DESIGN.md §7.8: la ventana de carga cubre el arranque y el cambio de perfil; dentro de la app manda el esqueleto.
const css = readFileSync('src/components/common/VentanaCarga.module.css', 'utf8');

describe('VentanaCarga', () => {
  it('anuncia qué carga con role=status y la etiqueta visible; el efecto es decorativo', () => {
    const { container } = render(<VentanaCarga etiqueta="Verificando tu PIN…" />);
    const estado = screen.getByRole('status');
    expect(estado).toHaveTextContent('Verificando tu PIN…');
    expect(estado).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('RouteLoadingFallback: ventana en el arranque, esqueleto después', () => {
  // Técnica: tabla de decisión (¿es la primera espera de la sesión o del perfil?).
  beforeEach(() => reiniciarArranque());

  it('la primera espera muestra la ventana de carga', () => {
    render(<RouteLoadingFallback />);
    expect(screen.getByRole('status')).toHaveTextContent(/abriendo espiralia/i);
  });

  it('al terminar la espera deja de ser arranque, y la siguiente usa el esqueleto', () => {
    const primera = render(<RouteLoadingFallback />);
    primera.unmount();
    expect(esArranque()).toBe(false);
    render(<RouteLoadingFallback />);
    expect(screen.getByRole('status')).toHaveTextContent(/cargando espacio/i);
  });

  it('cambiar de perfil reinicia el arranque', () => {
    terminarArranque();
    reiniciarArranque();
    expect(esArranque()).toBe(true);
  });
});

describe('CSS de la ventana de carga', () => {
  it('no se ve hasta 300ms, así una carga rápida no la enseña', () => {
    expect(css).toMatch(/\.ventana\s*\{[^}]*animation:\s*aparecer\s+220ms\s+ease-out\s+300ms/);
  });

  it('el efecto es de una sola pasada: ninguna animación infinita', () => {
    expect(css).not.toMatch(/\binfinite\b/);
  });

  it('con prefers-reduced-motion no hay pliegue y se ve el Nautilus ya formado', () => {
    const reducido = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? '';
    expect(reducido).toMatch(/\.hoja\s*\{[^}]*display:\s*none/);
    expect(reducido).toMatch(/\.nautilo\s*\{[^}]*opacity:\s*1/);
  });

  it('usa tokens, no colores sueltos, así sirve en los dos temas', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});
