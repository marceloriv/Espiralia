import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryDistributionChart } from '../components/charts/CategoryDistributionChart';
import type { TodoItem, PlannerBlock } from '../types';

describe('CategoryDistributionChart', () => {
  it('muestra estado vacío cuando no hay tareas ni bloques en el planner', () => {
    render(<CategoryDistributionChart todos={[]} planner={[]} />);
    expect(screen.getByText(/sin actividades categorizadas/i)).toBeInTheDocument();
    expect(screen.getByText(/crea tareas o bloques en el planner/i)).toBeInTheDocument();
  });

  it('calcula y renderiza el gráfico de barras por categoría', () => {
    const todos: TodoItem[] = [
      { id: '1', profileId: 'p1', title: 'T1', areaId: 'area-1', category: 'Trabajo', priority: 'alta', status: 'pendiente', completed: false, createdAt: '2026-10-09' },
      { id: '2', profileId: 'p1', title: 'T2', areaId: 'area-1', category: 'General', priority: 'baja', status: 'completada', completed: true, createdAt: '2026-10-09' },
    ];
    const planner: PlannerBlock[] = [
      { id: 'b1', profileId: 'p1', period: 'semanal', timeSlot: 'mañana', title: 'B1', priority: 'alta', completed: false },
    ];

    render(<CategoryDistributionChart todos={todos} planner={planner} />);
    expect(screen.getByLabelText(/distribución de actividades por categoría/i)).toBeInTheDocument();
    expect(screen.getByText(/3 actividades/i)).toBeInTheDocument();
    expect(document.querySelector('svg.ts-chart')).toBeInTheDocument();
    expect(screen.getByText(/concentra más actividades/i)).toBeInTheDocument();
  });

  it('muestra desglose cuando solo hay tareas', () => {
    const todos: TodoItem[] = [
      { id: '1', profileId: 'p1', title: 'T1', areaId: 'area-1', category: 'Estudio', priority: 'alta', status: 'pendiente', completed: false, createdAt: '2026-10-09' },
    ];

    render(<CategoryDistributionChart todos={todos} planner={[]} />);
    expect(screen.getByText(/1 actividad/i)).toBeInTheDocument();
  });
});
