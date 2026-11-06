import React from 'react';
import { Chart } from '@tanstack/charts/react/core';
import { defineChart } from '@tanstack/charts';
import type { ChartPoint } from '@tanstack/charts';
import { decorative } from '@tanstack/charts/mark/decorative';
import { motion } from '@tanstack/charts/motion';
import { pie, polar, radialArc, radialText } from '@tanstack/charts/polar';
import type { PieDatum } from '@tanstack/charts/polar';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { CheckCircle2 } from 'lucide-react';
import type { TodoItem, Area } from '../../types';
import styles from './TaskCompletionChart.module.css';

interface TaskCompletionChartProps {
  todos: TodoItem[];
  areas?: Area[];
}

interface AreaRow {
  id: string;
  label: string;
  color: string;
  done: number;
  total: number;
}

type AreaSlice = PieDatum<AreaRow>;

const FALLBACK_COLORS = [
  'var(--color-accent-slate)',
  'var(--color-accent-sage)',
  'var(--color-accent-terracotta)',
  'var(--color-accent-amber)',
  'var(--color-accent-teal)',
];

const TAU = Math.PI * 2;
const GAP_ANGLE = (Math.PI / 180) * 2.8;
const CHART_SIZE = 200;

// Resorte del ejemplo oficial. Solo anima al cambiar de área: sin entrada (`initial: false`) y sin bucles.
// `motion()` respeta prefers-reduced-motion por defecto; con movimiento reducido el cambio es inmediato.
const DONUT_SPRING = { type: 'spring' as const, stiffness: 190, damping: 21, mass: 0.82 };
const DONUT_MOTION = { transition: DONUT_SPRING };

const isDone = (t: TodoItem) => (t.status ? t.status === 'completada' : Boolean(t.completed));

/** Una fila por área, de más a menos pendientes: la primera es la que conviene mirar. */
const buildRows = (todos: TodoItem[], areas: Area[]): AreaRow[] => {
  const rows = new Map<string, AreaRow>();
  for (const t of todos) {
    const area = areas.find(a => a.id === t.areaId);
    const label = area?.name ?? t.category?.trim() ?? 'General';
    const row = rows.get(label) ?? { id: label, label, color: area?.color ?? '', done: 0, total: 0 };
    row.total += 1;
    if (isDone(t)) row.done += 1;
    rows.set(label, row);
  }
  return [...rows.values()]
    .sort((a, b) => b.total - b.done - (a.total - a.done) || b.total - a.total)
    .map((row, i) => ({ ...row, color: row.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }));
};

export const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({ todos, areas = [] }) => {
  const total = todos.length;
  const completedCount = todos.filter(isDone).length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const rows = React.useMemo(() => buildRows(todos, areas), [todos, areas]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const selected = rows.find(r => r.id === activeId) ?? rows[0];

  const renderer = React.useMemo(() => motion<AreaSlice, number, number>({ initial: false }), []);

  const chart = React.useMemo(() => {
    if (!selected) return null;
    const arcs = pie(rows, { value: 'total', gapAngle: GAP_ANGLE });
    const active = arcs.filter(a => a.id === selected.id);
    const center = [
      { id: `${selected.id}:value`, text: `${selected.done} de ${selected.total}`, dy: -8 },
      { id: `${selected.id}:label`, text: selected.label, dy: 14 },
    ];
    const centerScales = {
      angle: { scale: scaleLinear().domain([0, TAU]) },
      radius: { scale: scaleLinear().domain([0, 1]) },
    };
    return defineChart(
      {
        marks: [
          polar({
            id: 'area-donut',
            radiusRatio: 0.74,
            marks: [
              radialArc(arcs, {
                id: 'area-arcs',
                key: 'id',
                color: 'id',
                innerRadius: ({ radius }) => radius * 0.6,
                cornerRadius: 7,
                motion: DONUT_MOTION,
              }),
            ],
            scales: { angle: null, radius: null },
          }),
          // El área elegida sobresale con borde y un anillo exterior.
          decorative(
            polar({
              id: 'selected-area',
              radiusRatio: 0.83,
              marks: [
                radialArc(active, {
                  id: 'selected-area-wedge',
                  key: 'id',
                  color: 'id',
                  innerRadius: ({ radius }) => radius * 0.59,
                  cornerRadius: 8,
                  stroke: 'var(--color-surface-soft)',
                  strokeWidth: 2.5,
                  motion: DONUT_MOTION,
                }),
                radialArc(active, {
                  id: 'selected-area-ring',
                  key: 'id',
                  color: 'id',
                  innerRadius: ({ radius }) => radius * 0.94,
                  outerRadius: ({ radius }) => radius,
                  cornerRadius: 4,
                  fillOpacity: 0.78,
                  motion: { delay: 70, transition: DONUT_SPRING },
                }),
              ],
              scales: { angle: null, radius: null },
            }),
          ),
          decorative(
            polar({
              id: 'donut-center',
              radiusRatio: 0.8,
              scales: centerScales,
              marks: [
                radialText(center.slice(0, 1), {
                  id: 'donut-center-value',
                  angle: () => 0,
                  radius: () => 0,
                  key: 'id',
                  text: 'text',
                  dy: row => row.dy,
                  fill: 'currentColor',
                  fontSize: 20,
                  fontWeight: 700,
                  motion: DONUT_MOTION,
                }),
                radialText(center.slice(1), {
                  id: 'donut-center-label',
                  angle: () => 0,
                  radius: () => 0,
                  key: 'id',
                  text: 'text',
                  dy: row => row.dy,
                  fill: 'color-mix(in srgb, currentColor 62%, transparent)',
                  fontSize: 11,
                  fontWeight: 600,
                  motion: DONUT_MOTION,
                }),
              ],
            }),
          ),
        ],
        scales: { x: null, y: null },
        color: { domain: rows.map(r => r.id), range: rows.map(r => r.color) },
        guides: false,
        margin: 0,
        motion: DONUT_MOTION,
      },
      {
        focus: 'nearest',
        focusRing: false,
        keyboard: true,
        tooltip: {
          use: tooltip,
          anchor: 'point',
          format: (point: ChartPoint<AreaSlice, number, number>) =>
            `${point.datum.label} · ${point.datum.done} de ${point.datum.total} hechas`,
        },
      },
    );
  }, [rows, selected]);

  if (total === 0 || !chart || !selected) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            <CheckCircle2 size={16} color="var(--color-success)" aria-hidden="true" />
            <span>Progreso de Tareas</span>
          </h3>
          <span className={styles.chartSubtitle}>0 tareas</span>
        </div>
        <div className={styles.emptyStateContainer}>
          <p className={styles.emptyNotice}>Sin tareas para graficar</p>
          <p className={styles.emptyHint}>Agrega tareas en To-Do para visualizar tu progreso diario.</p>
        </div>
      </div>
    );
  }

  const selectPoint = (point: ChartPoint<AreaSlice, number, number> | null) => {
    if (point && 'total' in point.datum) setActiveId(point.datum.id);
  };

  return (
    <div
      className={styles.chartCard}
      aria-label={`cumplimiento de tareas: ${completedCount} de ${total} completadas (${percentage}%)`}
    >
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>
          <CheckCircle2 size={16} color="var(--color-success)" aria-hidden="true" />
          <span>Progreso de Tareas</span>
        </h3>
        <span className={styles.chartSubtitle}>
          {completedCount} de {total}
        </span>
      </div>

      <p className={styles.headline}>
        <span className={styles.percentageNumber}>{percentage}%</span>
        <span className={styles.percentageLabel}>completadas · elige un área</span>
      </p>

      <div className={styles.donutLayout}>
        <div className={styles.chartWrapper}>
          <Chart<AreaSlice, number, number>
            definition={chart}
            renderer={renderer}
            width={CHART_SIZE}
            height={CHART_SIZE}
            ariaLabel="Tareas hechas por área"
            onFocusChange={selectPoint}
          />
        </div>

        <div className={styles.legend} role="group" aria-label="Elegir área">
          {rows.map(row => (
            <button
              key={row.id}
              type="button"
              className={styles.legendItem}
              aria-pressed={row.id === selected.id}
              onClick={() => setActiveId(row.id)}
            >
              <span className={styles.swatch} aria-hidden="true" style={{ background: row.color }} />
              <span className={styles.legendName}>{row.label}</span>
              <span className={styles.legendCount}>
                {row.done}/{row.total}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
