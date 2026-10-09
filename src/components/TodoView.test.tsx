import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoView } from './TodoView';
import { StorageService } from '../services/storage';

describe('TodoView', () => {
  const profileId = 'p-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('permite agregar, alternar y filtrar tareas', async () => {
    const user = userEvent.setup();

    render(<TodoView profileId={profileId} />);

    expect(screen.getByText(/mis tareas/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/¿qué tienes pendiente\?/i);
    await user.type(input, 'Comprar insumos{enter}');

    expect(screen.getByText('Comprar insumos')).toBeInTheDocument();

    // Toggle completed
    const checkbox = screen.getByRole('checkbox', { name: /completar comprar insumos/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    // Filter pendientes -> no debe aparecer
    const pendingFilter = screen.getByRole('button', { name: /pendientes/i });
    await user.click(pendingFilter);
    expect(screen.queryByText('Comprar insumos')).not.toBeInTheDocument();

    // Filter completadas -> sí debe aparecer
    const completedFilter = screen.getByRole('button', { name: /completadas/i });
    await user.click(completedFilter);
    expect(screen.getByText('Comprar insumos')).toBeInTheDocument();
  });

  it('permite eliminar una tarea', async () => {
    const user = userEvent.setup();
    StorageService.saveTodo({
      id: 't-del',
      profileId,
      title: 'Tarea a borrar',
      category: 'General',
      priority: 'baja',
      completed: false,
      createdAt: '2026-10-09',
    });

    render(<TodoView profileId={profileId} />);

    expect(screen.getByText('Tarea a borrar')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /eliminar tarea a borrar/i });
    await user.click(deleteBtn);

    expect(screen.queryByText('Tarea a borrar')).not.toBeInTheDocument();
    expect(StorageService.getTodos(profileId)).toEqual([]);
  });
});
