import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import type { TodoItem, PlannerBlock } from '../../types';
import { ensureChartRegistered } from './chartSetup';
import styles from './CategoryDistributionChart.module.css';

ensureChartRegistered();

interface CategoryDistributionChartProps {
  todos: TodoItem[];
  planner: PlannerBlock[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  todos,
  planner,
}) => {
  const totalActivities = todos.length + planner.length;

  if (totalActivities === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            <BarChart3 size={16} color="var(--color-primary-active)" />
            <span>Distribución por Categoría</span>
          </h3>
          <span className={styles.chartSubtitle}>0 actividades</span>
        </div>
        <p className={styles.emptyNotice}>Sin actividades categorizadas</p>
      </div>
    );
  }

  const categoryMap: Record<string, { todos: number; planner: number }> = {};

  todos.forEach(t => {
    const cat = t.category?.trim() || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { todos: 0, planner: 0 };
    }
    categoryMap[cat].todos += 1;
  });

  if (planner.length > 0) {
    if (!categoryMap['Planner']) {
      categoryMap['Planner'] = { todos: 0, planner: 0 };
    }
    categoryMap['Planner'].planner += planner.length;
  }

  const labels = Object.keys(categoryMap);
  const todosData = labels.map(l => categoryMap[l].todos);
  const plannerData = labels.map(l => categoryMap[l].planner);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tareas',
        data: todosData,
        backgroundColor: '#8E1EA2',
        borderRadius: 4,
      },
      {
        label: 'Planner',
        data: plannerData,
        backgroundColor: '#5db8a6',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6c6a64', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#6c6a64',
          font: { size: 10 },
        },
        grid: {
          color: '#ebe6df',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          padding: 8,
          font: { size: 11 },
          color: '#6c6a64',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            return ` ${context.dataset.label}: ${context.parsed.y} item(s)`;
          },
        },
      },
    },
  };

  return (
    <div
      className={styles.chartCard}
      aria-label={`distribución de actividades por categoría: ${totalActivities} registradas`}
    >
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>
          <BarChart3 size={16} color="var(--color-primary-active)" />
          <span>Distribución por Categoría</span>
        </h3>
        <span className={styles.chartSubtitle}>
          {totalActivities} {totalActivities === 1 ? 'actividad' : 'actividades'}
        </span>
      </div>

      <div className={styles.chartWrapper}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
