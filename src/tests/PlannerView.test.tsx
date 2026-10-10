import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { PlannerView } from '../components/PlannerView';
import { StorageService } from '../services/storage';

describe('PlannerView', () => {
  const profileId = 'p-planner';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('permite agregar bloque de planificacion y alternar completado', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const infoSpy = vi.spyOn(sileo, 'info');
    const user = userEvent.setup();

    render(<PlannerView profileId={profileId} />);

    expect(screen.getByText(/planner y objetivos/i)).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/objetivo o bloque de enfoque/i);
    await user.type(titleInput, 'Planificar sprint');

    const addBtn = screen.getByRole('button', { name: /agregar bloque/i });
    await user.click(addBtn);

    expect(screen.getByText('Planificar sprint')).toBeInTheDocument();
    expect(successSpy).toHaveBeenCalledWith({ title: 'Bloque de enfoque guardado' });

    const checkbox = screen.getByRole('checkbox', { name: /completar planificar sprint/i });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(infoSpy).toHaveBeenCalledWith({ title: 'Bloque completado' });
  });

  it('permite eliminar un bloque', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
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
    expect(successSpy).toHaveBeenCalledWith({ title: 'Bloque eliminado' });
  });

  it('muestra estados vacios informativos por franja y permite alternar periodos', async () => {
    const user = userEvent.setup();
    render(<PlannerView profileId={profileId} />);

    // Verifica mensaje contextual en la franja mañana
    expect(screen.getByText(/sin bloques para mañana\. agrega un objetivo/i)).toBeInTheDocument();

    // Alternar a periodo mensual
    const mensualBtn = screen.getByRole('button', { name: /mensual/i });
    await user.click(mensualBtn);

    // Debe seguir mostrando el estado explicativo
    expect(screen.getByText(/sin bloques para mañana\. agrega un objetivo/i)).toBeInTheDocument();
  });
});
