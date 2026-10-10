import React from 'react';
import { Chart } from '@tanstack/charts/react';
import { defineChart } from '@tanstack/charts';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import { CheckCircle2 } from 'lucide-react';
import type { TodoItem } from '../../types';
import styles from './TaskCompletionChart.module.css';

interface TaskCompletionChartProps {
  todos: TodoItem[];
}

export const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({ todos }) => {
  const total = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = total - completedCount;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const chart = React.useMemo(() => {
    if (total === 0) return null;

    const chartData = [
      { label: 'Completadas', count: completedCount, color: '#5db872' },
      { label: 'Pendientes', count: pendingCount, color: '#e8a55a' },
    ];

    const slices = pie(chartData, { value: d => d.count });

    return defineChart({
      marks: [
        polar({
          marks: [
            radialArc(slices, {
              innerRadius: ctx => ctx.radius * 0.72,
              outerRadius: ctx => ctx.radius,
              fill: d => d.color,
            }),
          ],
          scales: {
            angle: null,
            radius: null,
          },
        }),
      ],
      scales: {
        x: null,
        y: null,
      },
    });
  }, [total, completedCount, pendingCount]);

  if (total === 0 || !chart) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            <CheckCircle2 size={16} color="var(--color-success)" />
            <span>Progreso de Tareas</span>
          </h3>
          <span className={styles.chartSubtitle}>0 tareas</span>
        </div>
        <p className={styles.emptyNotice}>Sin tareas para graficar</p>
      </div>
    );
  }

  return (
    <div
      className={styles.chartCard}
      aria-label={`cumplimiento de tareas: ${completedCount} de ${total} completadas (${percentage}%)`}
    >
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>
          <CheckCircle2 size={16} color="var(--color-success)" />
          <span>Progreso de Tareas</span>
        </h3>
        <span className={styles.chartSubtitle}>
          {completedCount} de {total}
        </span>
      </div>

      <div className={styles.chartWrapper}>
        <Chart
          definition={chart}
          ariaLabel={`Progreso: ${percentage}%`}
          aspectRatio={1}
        />
        <div className={styles.percentageBadge} aria-hidden="true">
          <span className={styles.percentageNumber}>{percentage}%</span>
          <span className={styles.percentageLabel}>Éxito</span>
        </div>
      </div>
    </div>
  );
};
