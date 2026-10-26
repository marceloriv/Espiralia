/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// Skill antislop-ui: R-19 (movimiento con propósito), R-10 (desenfoque como acento) y franjas laterales sin significado.
const COMPONENTS_DIR = path.resolve('src/components');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : e.name.endsWith('.module.css') ? [full] : [];
  });

const rules = walk(COMPONENTS_DIR).flatMap(file => {
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
    file: path.relative(COMPONENTS_DIR, file),
    selector: m[1].trim().replace(/\s+/g, ' '),
    body: m[2],
  }));
});

describe('Movimiento, desenfoque y franjas decorativas', () => {
  it('no hay animaciones infinitas salvo el spinner de carga y el molinillo de origami', () => {
    // La persona dueña aprobó el giro lento del molinillo en el mock del 2026-10-25 (R-19 se mantiene por decisión suya):
    // 24s por vuelta y solo con prefers-reduced-motion: no-preference.
    const offenders = rules
      .filter(r => /animation(-iteration-count)?:[^;]*\binfinite\b/.test(r.body))
      .filter(r => !(r.file === 'RouteLoadingFallback.module.css' && /spin/.test(r.body)))
      .filter(r => !(r.file === path.join('common', 'OrigamiHoja.module.css') && /aspas 24s/.test(r.body)))
      .map(r => `${r.file} ${r.selector}`);

    expect(offenders).toEqual([]);
  });

  it('backdrop-filter solo en velos de modal y en barras fijas (superior y lateral/inferior móvil)', () => {
    const allowed = /overlay|backdrop|scrim|modal|topBar|sidebar/i;
    const offenders = rules
      .filter(r => /backdrop-filter:/.test(r.body) && !allowed.test(r.selector))
      .map(r => `${r.file} ${r.selector}`);

    expect(offenders).toEqual([]);
  });

  it('border-left de 3px o más solo marca categoría o estado', () => {
    // Estado (Active, Priority, Critical, alertBox), tipo de acceso rápido (quickBtn), categoría de horario (scheduleRow),
    // cita tipográfica (Aphorism) y el triángulo de la cinta (ribbonTail, un truco de bordes y no una franja).
    const allowedSelector = /Active|Priority|Critical|alertBox|quickBtn|scheduleRow|Aphorism|ribbonTail/;
    const offenders = rules
      .filter(r => /border-left:\s*(?:[3-9]|\d{2,})(?:\.\d+)?px\s+solid/.test(r.body))
      // El lomo neutro de los cuadernos (color hairline) es un motivo de identidad, no una franja de color.
      .filter(r => !/border-left:[^;]*hairline/.test(r.body))
      .filter(r => r.file !== path.join('planner', 'PlannerBlockCard.module.css') && !allowedSelector.test(r.selector))
      .map(r => `${r.file} ${r.selector}`);

    expect(offenders).toEqual([]);
  });
});
