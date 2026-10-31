import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCompletionChart } from '../components/charts/TaskCompletionChart';
import type { TodoItem } from '../types';

describe('TaskCompletionChart', () => {
  it('muestra estado vacío si no hay tareas registradas', () => {
    render(<TaskCompletionChart todos={[]} />);
    expect(screen.getByText(/sin tareas para graficar/i)).toBeInTheDocument();
    expect(screen.getByText(/agrega tareas en to-do para visualizar tu progreso/i)).toBeInTheDocument();
  });

  it('renderiza canvas y ratio de tareas cuando existen tareas registradas', () => {
    const mockTodos: TodoItem[] = [
      { id: '1', profileId: 'p1', title: 'T1', areaId: 'area-1', category: 'General', priority: 'media', status: 'completada', completed: true, createdAt: '2026-10-09' },
      { id: '2', profileId: 'p1', title: 'T2', areaId: 'area-1', category: 'General', priority: 'alta', status: 'pendiente', completed: false, createdAt: '2026-10-09' },
    ];
    render(<TaskCompletionChart todos={mockTodos} />);
    expect(screen.getByLabelText(/cumplimiento de tareas: 1 de 2 completadas \(50%\)/i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(document.querySelector('svg.ts-chart')).toBeInTheDocument();
  });

  it('dibuja el gráfico con áreas conocidas sin perder el porcentaje', () => {
    const areas = [
      { id: 'a1', profileId: 'p1', name: 'Estudios', color: '#7b8c9e', createdAt: '2026-10-09' },
      { id: 'a2', profileId: 'p1', name: 'Personal', color: '#5a826d', createdAt: '2026-10-09' },
    ];
    const todo = (id: string, areaId: string, done: boolean): TodoItem => ({
      id, profileId: 'p1', title: id, areaId, priority: 'media', status: done ? 'completada' : 'pendiente', completed: done, createdAt: '2026-10-09',
    });
    render(<TaskCompletionChart todos={[todo('1', 'a1', true), todo('2', 'a2', false), todo('3', 'a2', false)]} areas={areas} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(document.querySelector('svg.ts-chart')).toBeInTheDocument();
  });

  it('la leyenda elige el área activa: arranca en la de más pendientes y cambia al pulsar', () => {
    const areas = [
      { id: 'a1', profileId: 'p1', name: 'Estudios', color: '#7b8c9e', createdAt: '2026-10-09' },
      { id: 'a2', profileId: 'p1', name: 'Personal', color: '#5a826d', createdAt: '2026-10-09' },
    ];
    const todo = (id: string, areaId: string, done: boolean): TodoItem => ({
      id, profileId: 'p1', title: id, areaId, priority: 'media', status: done ? 'completada' : 'pendiente', completed: done, createdAt: '2026-10-09',
    });
    render(<TaskCompletionChart todos={[todo('1', 'a1', true), todo('2', 'a2', false), todo('3', 'a2', false)]} areas={areas} />);
    const personal = screen.getByRole('button', { name: /personal/i });
    const estudios = screen.getByRole('button', { name: /estudios/i });
    expect(personal).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(estudios);
    expect(estudios).toHaveAttribute('aria-pressed', 'true');
    expect(personal).toHaveAttribute('aria-pressed', 'false');
  });

  it('muestra 100% de cumplimiento cuando todas están completadas', () => {
    const mockTodos: TodoItem[] = [
      { id: '1', profileId: 'p1', title: 'T1', areaId: 'area-1', category: 'General', priority: 'media', status: 'completada', completed: true, createdAt: '2026-10-09' },
    ];
    render(<TaskCompletionChart todos={mockTodos} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
