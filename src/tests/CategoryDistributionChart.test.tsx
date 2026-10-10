import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryDistributionChart } from '../components/charts/CategoryDistributionChart';
import type { TodoItem, PlannerBlock } from '../types';

describe('CategoryDistributionChart', () => {
  it('muestra estado vacío cuando no hay tareas ni bloques en el planner', () => {
    render(<CategoryDistributionChart todos={[]} planner={[]} />);
    expect(screen.getByText(/sin actividades categorizadas/i)).toBeInTheDocument();
  });

  it('calcula y renderiza el gráfico de barras por categoría', () => {
    const todos: TodoItem[] = [
      { id: '1', profileId: 'p1', title: 'T1', category: 'Trabajo', priority: 'alta', completed: false, createdAt: '2026-10-09' },
      { id: '2', profileId: 'p1', title: 'T2', category: 'General', priority: 'baja', completed: true, createdAt: '2026-10-09' },
    ];
    const planner: PlannerBlock[] = [
      { id: 'b1', profileId: 'p1', period: 'semanal', timeSlot: 'mañana', title: 'B1', priority: 'alta', completed: false },
    ];

    render(<CategoryDistributionChart todos={todos} planner={planner} />);
    expect(screen.getByLabelText(/distribución de actividades por categoría/i)).toBeInTheDocument();
    expect(screen.getByText(/3 actividades/i)).toBeInTheDocument();
  });

  it('muestra desglose cuando solo hay tareas', () => {
    const todos: TodoItem[] = [
      { id: '1', profileId: 'p1', title: 'T1', category: 'Estudio', priority: 'alta', completed: false, createdAt: '2026-10-09' },
    ];

    render(<CategoryDistributionChart todos={todos} planner={[]} />);
    expect(screen.getByText(/1 actividad/i)).toBeInTheDocument();
  });
});
