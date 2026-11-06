import React from 'react';
import { Chart } from '@tanstack/charts/react/tooltip';
import { defineChart } from '@tanstack/charts';
import type { ChartPoint } from '@tanstack/charts';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import type { PieDatum } from '@tanstack/charts/polar';
import { tooltip } from '@tanstack/charts/tooltip';
import { BarChart3 } from 'lucide-react';
import type { TodoItem, PlannerBlock } from '../../types';
import { StorageService } from '../../services/storage';
import styles from './CategoryDistributionChart.module.css';

interface CategoryDistributionChartProps {
  todos: TodoItem[];
  planner: PlannerBlock[];
}

interface CategoryRow {
  category: string;
  count: number;
  color: string;
}

type CategorySlice = PieDatum<CategoryRow>;

const PALETTE = [
  'var(--color-primary)',
  'var(--color-accent-teal)',
  'var(--color-accent-amber)',
  'var(--color-accent-sage)',
  'var(--color-accent-terracotta)',
  'var(--color-accent-slate)',
];
const CHART_SIZE = 200;
const share = new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 0 });

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  todos,
  planner,
}) => {
  const totalActivities = todos.length + planner.length;

  const rows = React.useMemo<CategoryRow[]>(() => {
    const counts: Record<string, number> = {};
    todos.forEach(t => {
      let cat = t.category?.trim();
      if (!cat && t.areaId && t.profileId) {
        cat = StorageService.getAreas(t.profileId).find(a => a.id === t.areaId)?.name;
      }
      const name = cat || 'General';
      counts[name] = (counts[name] ?? 0) + 1;
    });
    if (planner.length > 0) counts['Planner'] = (counts['Planner'] ?? 0) + planner.length;

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count], i) => ({ category, count, color: PALETTE[i % PALETTE.length] }));
  }, [todos, planner]);

  const chart = React.useMemo(() => {
    if (rows.length === 0) return null;
    const arcs = pie(rows, { value: 'count' });
    return defineChart(
      {
        marks: [
          polar({
            inset: 0,
            radiusRatio: 0.8,
            marks: [radialArc(arcs, { id: 'category-slices', key: 'category', color: 'category' })],
            scales: { angle: null, radius: null },
          }),
        ],
        scales: { x: null, y: null },
        color: { domain: rows.map(r => r.category), range: rows.map(r => r.color) },
        margin: 0,
      },
      {
        keyboard: true,
        tooltip: {
          use: tooltip,
          format: (point: ChartPoint<CategorySlice, number, number>) =>
            `${point.datum.category} · ${point.datum.count} (${share.format(point.datum.count / totalActivities)})`,
        },
      },
    );
  }, [rows, totalActivities]);

  if (totalActivities === 0 || !chart) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            <BarChart3 size={16} color="var(--color-primary-active)" aria-hidden="true" />
            <span>Distribución por Categoría</span>
          </h3>
          <span className={styles.chartSubtitle}>0 actividades</span>
        </div>
        <div className={styles.emptyStateContainer}>
          <p className={styles.emptyNotice}>Sin actividades categorizadas</p>
          <p className={styles.emptyHint}>Crea tareas o bloques en el Planner para visualizar la distribución aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.chartCard}
      aria-label={`distribución de actividades por categoría: ${totalActivities} registradas`}
    >
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>
          <BarChart3 size={16} color="var(--color-primary-active)" aria-hidden="true" />
          <span>Distribución por Categoría</span>
        </h3>
        <span className={styles.chartSubtitle}>
          {totalActivities} {totalActivities === 1 ? 'actividad' : 'actividades'}
        </span>
      </div>

      <p className={styles.headline}>
        <span className={styles.headlineName}>{rows[0].category}</span>
        <span className={styles.headlineLabel}>concentra más actividades</span>
      </p>

      <div className={styles.pieLayout}>
        <div className={styles.chartWrapper}>
          <Chart<CategorySlice, number, number>
            definition={chart}
            width={CHART_SIZE}
            height={CHART_SIZE}
            ariaLabel="Actividades por categoría"
          />
        </div>

        <ul className={styles.legend}>
          {rows.map(row => (
            <li key={row.category} className={styles.legendItem}>
              <span className={styles.swatch} aria-hidden="true" style={{ background: row.color }} />
              <span className={styles.legendName}>{row.category}</span>
              <span className={styles.legendCount}>{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
