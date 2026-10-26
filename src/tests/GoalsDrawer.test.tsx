import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalsDrawer } from '../components/planner/GoalsDrawer';
import { StorageService } from '../services/storage';
import type { Goal } from '../types';

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

  it('se cierra con Escape', async () => {
    const user = userEvent.setup();
    render(<GoalsDrawer profileId={profileId} onGoalsChange={() => {}} />);

    await user.click(screen.getByRole('button', { name: /\+ nueva meta/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
