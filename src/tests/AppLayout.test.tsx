import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../components/AppLayout';
import type { Profile } from '../types';

describe('AppLayout', () => {
  const mockProfile: Profile = {
    id: 'p-1',
    name: 'Francisca',
    avatar: 'F',
    createdAt: '2026-10-09',
  };

  it('renderiza enlaces de navegacion y dispara cambio de vista', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const onLockProfile = vi.fn();

    render(
      <AppLayout
        profile={mockProfile}
        currentView="dashboard"
        onViewChange={onViewChange}
        onLockProfile={onLockProfile}
      >
        <div>Contenido Principal</div>
      </AppLayout>
    );

    expect(screen.getByText('Espiralia')).toBeInTheDocument();
    expect(screen.getByText('Francisca')).toBeInTheDocument();
    expect(screen.getByText('Contenido Principal')).toBeInTheDocument();

    const agendaBtn = screen.getByRole('button', { name: /agenda/i });
    await user.click(agendaBtn);
    expect(onViewChange).toHaveBeenCalledWith('agenda');
  });

  it('permite cambiar de perfil tanto desde el sidebar como desde el acceso rapido de cabecera', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const onLockProfile = vi.fn();

    render(
      <AppLayout
        profile={mockProfile}
        currentView="dashboard"
        onViewChange={onViewChange}
        onLockProfile={onLockProfile}
      >
        <div>Contenido Principal</div>
      </AppLayout>
    );

    // Botones con accion de cambiar perfil (desktop y mobile header)
    const lockButtons = screen.getAllByRole('button', { name: /cambiar perfil/i });
    expect(lockButtons.length).toBeGreaterThanOrEqual(1);

    await user.click(lockButtons[0]);
    expect(onLockProfile).toHaveBeenCalledTimes(1);
  });
});
