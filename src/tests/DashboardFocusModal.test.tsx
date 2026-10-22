import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardView } from '../components/DashboardView';
import { StorageService } from '../services/storage';
import type { Profile } from '../types';

const profile = { id: 'p-focus-modal', name: 'Prueba' } as Profile;

describe('DashboardView: diálogo de foco', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile(profile);
    const areaId = StorageService.getAreas(profile.id)[0].id;
    StorageService.saveTodo({
      id: 't-1',
      profileId: profile.id,
      title: 'Tarea de prueba',
      areaId,
      priority: 'alta',
      status: 'pendiente',
      createdAt: '2026-10-22',
    });
  });

  it('el foco entra al diálogo al abrirse', async () => {
    const user = userEvent.setup();
    render(<DashboardView profile={profile} onNavigate={() => {}} />);

    await user.click(await screen.findByRole('button', { name: /cambiar foco/i }));

    const dialog = await screen.findByRole('dialog', { name: /seleccionar foco del día/i });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('se cierra con Escape', async () => {
    const user = userEvent.setup();
    render(<DashboardView profile={profile} onNavigate={() => {}} />);

    await user.click(await screen.findByRole('button', { name: /cambiar foco/i }));
    await screen.findByRole('dialog', { name: /seleccionar foco del día/i });
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: /seleccionar foco del día/i })).not.toBeInTheDocument();
  });
});
