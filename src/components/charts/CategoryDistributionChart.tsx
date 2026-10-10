import React from 'react';
import { Chart } from '@tanstack/charts/react';
import { defineChart, barY } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { BarChart3 } from 'lucide-react';
import type { TodoItem, PlannerBlock } from '../../types';
import { StorageService } from '../../services/storage';
import styles from './CategoryDistributionChart.module.css';

interface CategoryDistributionChartProps {
  todos: TodoItem[];
  planner: PlannerBlock[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  todos,
  planner,
}) => {
  const totalActivities = todos.length + planner.length;

  const chart = React.useMemo(() => {
    if (totalActivities === 0) return null;

    const categoryMap: Record<string, { category: string; todos: number; planner: number }> = {};

    todos.forEach(t => {
      let cat = t.category?.trim();
      if (!cat && t.areaId && t.profileId) {
        const area = StorageService.getAreas(t.profileId).find(a => a.id === t.areaId);
        cat = area?.name;
      }
      cat = cat || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, todos: 0, planner: 0 };
      }
      categoryMap[cat].todos += 1;
    });

    if (planner.length > 0) {
      if (!categoryMap['Planner']) {
        categoryMap['Planner'] = { category: 'Planner', todos: 0, planner: 0 };
      }
      categoryMap['Planner'].planner += planner.length;
    }

    const data = Object.values(categoryMap);

    return defineChart({
      marks: [
        barY(data, { x: 'category', y: 'todos', fill: '#8E1EA2' }),
        barY(data, { x: 'category', y: 'planner', fill: '#5db8a6' }),
      ],
      scales: {
        x: { scale: scaleBand },
        y: { scale: scaleLinear },
      },
    });
  }, [totalActivities, todos, planner]);

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
        <p className={styles.emptyNotice}>Sin actividades categorizadas</p>
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

      <div className={styles.chartWrapper}>
        <Chart
          definition={chart}
          ariaLabel="Gráfico de barras de actividades"
          aspectRatio={1.6}
        />
      </div>
    </div>
  );
};
