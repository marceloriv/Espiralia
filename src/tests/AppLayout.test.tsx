import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { AppLayout } from '../components/AppLayout';
import type { Profile } from '../types';

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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
    const infoSpy = vi.spyOn(sileo, 'info');
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
    expect(infoSpy).toHaveBeenCalledWith({ title: 'Sesión cerrada' });
    expect(onLockProfile).toHaveBeenCalledTimes(1);
  });

  it('proporciona enlace de salto de navegación (skip link) y landmarks accesibles', () => {
    render(
      <AppLayout
        profile={mockProfile}
        currentView="dashboard"
        onViewChange={vi.fn()}
        onLockProfile={vi.fn()}
      >
        <div>Contenido Principal</div>
      </AppLayout>
    );

    const skipLink = screen.getByRole('link', { name: /saltar al contenido principal/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    const nav = screen.getByRole('navigation', { name: /navegación principal/i });
    expect(nav).toBeInTheDocument();

    const activeBtn = screen.getByRole('button', { name: /dashboard/i });
    expect(activeBtn).toHaveAttribute('aria-current', 'page');
  });
});
