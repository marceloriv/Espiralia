import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { AppLayout } from '../components/AppLayout';
import type { Profile, ViewType } from '../types';

const freeProfile: Profile = { id: 'p-1', name: 'Francisca', avatar: 'F', createdAt: '2026-10-09' };
const protectedProfile: Profile = { ...freeProfile, pinHash: 'a'.repeat(64), pinSalt: 'b'.repeat(32) };

const renderLayout = (profile: Profile = freeProfile, currentView: ViewType = 'dashboard') => {
  const onViewChange = vi.fn();
  const onLockProfile = vi.fn();
  render(
    <AppLayout profile={profile} currentView={currentView} onViewChange={onViewChange} onLockProfile={onLockProfile}>
      <div>Contenido Principal</div>
    </AppLayout>,
  );
  return { onViewChange, onLockProfile };
};

describe('AppLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza enlaces de navegacion y dispara cambio de vista', async () => {
    const user = userEvent.setup();
    const { onViewChange } = renderLayout();

    expect(screen.getByRole('heading', { name: 'Espiralia', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Francisca')).toBeInTheDocument();
    expect(screen.getByText('Contenido Principal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /agenda/i }));
    expect(onViewChange).toHaveBeenCalledWith('agenda');
  });

  // Técnica: tabla de decisión (perfil con PIN / sin PIN → etiqueta e icono de sesión).
  it('ofrece "Cambiar perfil" en un perfil sin PIN y cierra sesión', async () => {
    const infoSpy = vi.spyOn(sileo, 'info');
    const user = userEvent.setup();
    const { onLockProfile } = renderLayout(freeProfile);

    const lockButtons = screen.getAllByRole('button', { name: /cambiar perfil/i });
    expect(lockButtons).toHaveLength(1);
    expect(screen.getByText('Acceso libre')).toBeInTheDocument();

    await user.click(lockButtons[0]);
    expect(infoSpy).toHaveBeenCalledWith({ title: 'Sesión cerrada' });
    expect(onLockProfile).toHaveBeenCalledTimes(1);
  });

  it('ofrece "Bloquear perfil" en un perfil protegido por PIN', () => {
    renderLayout(protectedProfile);

    expect(screen.getByRole('button', { name: /bloquear perfil/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cambiar perfil/i })).not.toBeInTheDocument();
    expect(screen.getByText('Protegido por PIN')).toBeInTheDocument();
  });

  // Técnica: partición de equivalencia sobre las cuatro vistas (título con mayúsculas correctas).
  it.each([
    ['dashboard', 'Dashboard'],
    ['agenda', 'Agenda'],
    ['planner', 'Planner'],
    ['todo', 'To-Do'],
  ] as const)('la barra superior titula la vista %s como "%s"', (view, title) => {
    renderLayout(freeProfile, view);
    expect(within(screen.getByRole('banner')).getByText(title)).toBeInTheDocument();
  });

  it('no muestra controles de features que todavía no existen', () => {
    renderLayout();
    for (const label of [/buscar/i, /nueva nota/i, /acción rápida/i, /bóveda/i, /ajustes/i, /indexeddb/i, /cifrad/i]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('proporciona enlace de salto de navegación (skip link) y landmarks accesibles', () => {
    renderLayout();

    const skipLink = screen.getByRole('link', { name: /saltar al contenido principal/i });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');

    const nav = screen.getByRole('navigation', { name: /navegación principal/i });
    for (const name of [/dashboard/i, /agenda/i, /planner/i, /to-do/i]) {
      expect(within(nav).getByRole('button', { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole('button', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page');
  });
});
