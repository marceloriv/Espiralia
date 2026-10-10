import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { CheckCircle2 } from 'lucide-react';
import type { TodoItem } from '../../types';
import { ensureChartRegistered } from './chartSetup';
import styles from './TaskCompletionChart.module.css';

ensureChartRegistered();

interface TaskCompletionChartProps {
  todos: TodoItem[];
}

export const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({ todos }) => {
  const total = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = total - completedCount;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (total === 0) {
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

  const chartData = {
    labels: ['Completadas', 'Pendientes'],
    datasets: [
      {
        data: [completedCount, pendingCount],
        backgroundColor: ['#5db872', '#e8a55a'],
        hoverBackgroundColor: ['#4ea462', '#d59449'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          },
          color: '#6c6a64',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { label: string; parsed: number }) => {
            const count = context.parsed;
            const pct = Math.round((count / total) * 100);
            return ` ${context.label}: ${count} (${pct}%)`;
          },
        },
      },
    },
  };

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
        <Doughnut data={chartData} options={chartOptions} />
        <div className={styles.percentageBadge} aria-hidden="true">
          <span className={styles.percentageNumber}>{percentage}%</span>
          <span className={styles.percentageLabel}>Éxito</span>
        </div>
      </div>
    </div>
  );
};
