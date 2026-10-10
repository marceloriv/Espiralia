import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { TodoView } from '../components/TodoView';
import { StorageService } from '../services/storage';

describe('TodoView', () => {
  const profileId = 'p-test';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('permite agregar, alternar y filtrar tareas', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const infoSpy = vi.spyOn(sileo, 'info');
    const user = userEvent.setup();

    render(<TodoView profileId={profileId} />);

    expect(screen.getByText(/mis tareas/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/¿qué tienes pendiente\?/i);
    await user.type(input, 'Comprar insumos{enter}');

    expect(screen.getByText('Comprar insumos')).toBeInTheDocument();
    expect(successSpy).toHaveBeenCalledWith({ title: 'Tarea agregada exitosamente' });

    // Toggle completed
    const checkbox = screen.getByRole('checkbox', { name: /completar comprar insumos/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(infoSpy).toHaveBeenCalledWith({ title: 'Tarea completada' });

    // Filter pendientes -> no debe aparecer
    const pendingFilter = screen.getByRole('button', { name: /pendientes/i });
    await user.click(pendingFilter);
    expect(pendingFilter).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Comprar insumos')).not.toBeInTheDocument();

    // Filter completadas -> sí debe aparecer
    const completedFilter = screen.getByRole('button', { name: /completadas/i });
    await user.click(completedFilter);
    expect(completedFilter).toHaveAttribute('aria-pressed', 'true');
    expect(pendingFilter).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Comprar insumos')).toBeInTheDocument();
  });

  it('permite eliminar una tarea', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
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
    expect(successSpy).toHaveBeenCalledWith({ title: 'Tarea eliminada' });
    expect(StorageService.getTodos(profileId)).toEqual([]);
  });

  it('muestra mensajes explicativos contextuales cuando la lista esta vacia', async () => {
    const user = userEvent.setup();
    render(<TodoView profileId={profileId} />);

    // Inicialmente no hay tareas en absoluto
    expect(screen.getByText(/aún no has agregado tareas/i)).toBeInTheDocument();
    expect(screen.getByText(/usa el formulario superior para crear tu primera tarea/i)).toBeInTheDocument();

    // Agregamos una tarea pendiente
    const input = screen.getByPlaceholderText(/¿qué tienes pendiente\?/i);
    await user.type(input, 'Tarea de prueba{enter}');

    // Ir a filtro completadas cuando ninguna esta completa
    const completedFilter = screen.getByRole('button', { name: /completadas/i });
    await user.click(completedFilter);

    expect(screen.getByText(/sin tareas completadas aún/i)).toBeInTheDocument();

    // Completar la tarea y verificar filtro pendientes
    const allFilter = screen.getByRole('button', { name: /todas/i });
    await user.click(allFilter);

    const checkbox = screen.getByRole('checkbox', { name: /completar tarea de prueba/i });
    await user.click(checkbox);

    const pendingFilter = screen.getByRole('button', { name: /pendientes/i });
    await user.click(pendingFilter);

    expect(screen.getByText(/¡todo al día!/i)).toBeInTheDocument();
  });
});
