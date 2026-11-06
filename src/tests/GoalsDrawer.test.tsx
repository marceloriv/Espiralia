import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalsDrawer } from '../components/planner/GoalsDrawer';
import { StorageService } from '../services/storage';
import type { Goal } from '../types';
import { simularConfirmacion } from './confirmacion';

describe('GoalsDrawer', () => {
  const profileId = 'p-goals-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza metas, calcula el porcentaje de progreso y permite alternar sub-items', async () => {
    const user = userEvent.setup();
    const testGoal: Goal = {
      id: 'g-test-1',
      profileId,
      title: 'Avanzar módulos Clase B',
      category: 'Metas Académicas',
      period: 'semanal',
      items: [
        { id: 'sub-1', title: 'Módulo 1: Señales', completed: true },
        { id: 'sub-2', title: 'Módulo 2: Velocidad', completed: false },
      ],
      createdAt: '2026-10-14',
    };
    StorageService.saveGoal(testGoal);

    render(<GoalsDrawer profileId={profileId} onGoalsChange={() => {}} />);

    expect(screen.getByText('Avanzar módulos Clase B')).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /módulo 2: velocidad/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('permite crear una nueva meta con sub-items', async () => {
    const user = userEvent.setup();
    render(<GoalsDrawer profileId={profileId} onGoalsChange={() => {}} />);

    const openModalBtn = screen.getByRole('button', { name: /\+ nueva meta/i });
    await user.click(openModalBtn);

    const titleInput = screen.getByLabelText(/título de la meta/i);
    await user.type(titleInput, 'Lectura semanal');

    const subItemInput = screen.getByPlaceholderText(/agregar sub-tarea o paso/i);
    await user.type(subItemInput, 'Capítulo 1{enter}');

    const submitBtn = screen.getByRole('button', { name: /guardar meta/i });
    await user.click(submitBtn);

    expect(screen.getByText('Lectura semanal')).toBeInTheDocument();
    expect(screen.getByText('Capítulo 1')).toBeInTheDocument();
  });

  // Una meta solo se podía crear, marcar o borrar; el período "mensual" existía en el tipo pero no en la UI.
  it('edita una meta: título, período y sub-tareas, sin perder las marcadas', async () => {
    const user = userEvent.setup();
    StorageService.saveGoal({ id: 'g-edit', profileId, title: 'Leer más', period: 'semanal', items: [{ id: 's-1', title: 'Capítulo 1', completed: true }], createdAt: '2026-11-01' });
    render(<GoalsDrawer profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: 'Editar meta Leer más' }));
    expect(screen.getByRole('heading', { name: /editar meta/i })).toBeInTheDocument();
    const titulo = screen.getByLabelText(/título de la meta/i);
    await user.clear(titulo);
    await user.type(titulo, 'Leer cada día');
    await user.selectOptions(screen.getByLabelText(/período/i), 'mensual');
    await user.type(screen.getByLabelText(/sub-tareas/i), 'Capítulo 2{enter}');
    await user.click(screen.getByRole('button', { name: /guardar meta/i }));

    const [meta] = StorageService.getGoals(profileId);
    expect(meta).toMatchObject({ id: 'g-edit', title: 'Leer cada día', period: 'mensual' });
    expect(meta.items.map(i => [i.title, i.completed])).toEqual([['Capítulo 1', true], ['Capítulo 2', false]]);
    expect(screen.getByText('Mensual')).toBeInTheDocument();
  });

  it('borrar una meta pide confirmación', async () => {
    const user = userEvent.setup();
    simularConfirmacion(false);
    StorageService.saveGoal({ id: 'g-keep', profileId, title: 'Correr', period: 'semanal', items: [], createdAt: '2026-11-01' });
    render(<GoalsDrawer profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar meta Correr' }));

    expect(StorageService.getGoals(profileId)).toHaveLength(1);
    vi.restoreAllMocks();
  });

  it('se cierra con Escape', async () => {
    const user = userEvent.setup();
    render(<GoalsDrawer profileId={profileId} onGoalsChange={() => {}} />);

    await user.click(screen.getByRole('button', { name: /\+ nueva meta/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
