import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from './AppLayout';
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

    const lockBtn = screen.getByRole('button', { name: /cambiar perfil/i });
    await user.click(lockBtn);
    expect(onLockProfile).toHaveBeenCalledTimes(1);
  });
});
