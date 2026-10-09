import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlannerView } from '../components/PlannerView';
import { StorageService } from '../services/storage';

describe('PlannerView', () => {
  const profileId = 'p-planner';

  beforeEach(() => {
    localStorage.clear();
  });

  it('permite agregar bloque de planificacion y alternar completado', async () => {
    const user = userEvent.setup();

    render(<PlannerView profileId={profileId} />);

    expect(screen.getByText(/planner y objetivos/i)).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/objetivo o bloque de enfoque/i);
    await user.type(titleInput, 'Planificar sprint');

    const addBtn = screen.getByRole('button', { name: /agregar bloque/i });
    await user.click(addBtn);

    expect(screen.getByText('Planificar sprint')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /completar planificar sprint/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('permite eliminar un bloque', async () => {
    const user = userEvent.setup();

    StorageService.savePlanner({
      id: 'pb-del',
      profileId,
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Bloque a eliminar',
      priority: 'media',
      completed: false,
    });

    render(<PlannerView profileId={profileId} />);

    expect(screen.getByText('Bloque a eliminar')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /eliminar bloque a eliminar/i });
    await user.click(deleteBtn);

    expect(screen.queryByText('Bloque a eliminar')).not.toBeInTheDocument();
  });
});
