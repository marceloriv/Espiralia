import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCompletionChart } from '../components/charts/TaskCompletionChart';
import type { TodoItem } from '../types';

describe('TaskCompletionChart', () => {
  it('muestra estado vacío si no hay tareas registradas', () => {
    render(<TaskCompletionChart todos={[]} />);
    expect(screen.getByText(/sin tareas para graficar/i)).toBeInTheDocument();
  });

  it('renderiza canvas y ratio de tareas cuando existen tareas registradas', () => {
    const mockTodos: TodoItem[] = [
      { id: '1', profileId: 'p1', title: 'T1', category: 'General', priority: 'media', completed: true, createdAt: '2026-10-09' },
      { id: '2', profileId: 'p1', title: 'T2', category: 'General', priority: 'alta', completed: false, createdAt: '2026-10-09' },
    ];
    render(<TaskCompletionChart todos={mockTodos} />);
    expect(screen.getByLabelText(/cumplimiento de tareas: 1 de 2 completadas \(50%\)/i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('muestra 100% de cumplimiento cuando todas están completadas', () => {
    const mockTodos: TodoItem[] = [
      { id: '1', profileId: 'p1', title: 'T1', category: 'General', priority: 'media', completed: true, createdAt: '2026-10-09' },
    ];
    render(<TaskCompletionChart todos={mockTodos} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
