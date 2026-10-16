import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { AppLayout } from '../components/AppLayout';
import type { Profile, ViewType } from '../types';

const freeProfile: Profile = { id: 'p-1', name: 'Francisca', avatar: 'F', createdAt: '2026-10-09' };
const protectedProfile: Profile = { ...freeProfile, pinHash: 'a'.repeat(64), pinSalt: 'b'.repeat(32) };

const renderLayout = (
  profile: Profile = freeProfile,
  currentView: ViewType = 'dashboard',
  children: React.ReactNode = <div>Contenido Principal</div>,
) => {
  const onViewChange = vi.fn();
  const onLockProfile = vi.fn();
  render(
    <AppLayout profile={profile} currentView={currentView} onViewChange={onViewChange} onLockProfile={onLockProfile}>
      {children}
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

  // Técnica: partición de equivalencia sobre las vistas (título con mayúsculas correctas).
  it.each([
    ['dashboard', 'Dashboard'],
    ['agenda', 'Agenda'],
    ['planner', 'Planner'],
    ['todo', 'To-Do'],
    ['notes', 'Notas'],
    ['folders', 'Carpetas'],
  ] as const)('la barra superior titula la vista %s como "%s"', (view, title) => {
    renderLayout(freeProfile, view);
    expect(within(screen.getByRole('banner')).getByText(title)).toBeInTheDocument();
  });

  // Con F8 completada, todas las features del rediseño Stitch están implementadas.
  it('expone todos los controles de navegación, búsqueda y acciones del layout', () => {
    renderLayout();
    const names = screen.getAllByRole('button').map(b => b.getAttribute('aria-label') ?? b.textContent?.trim());
    expect(names).toEqual([
      '+ Acción Rápida',
      'Dashboard',
      'Agenda',
      'Planner',
      'To-Do',
      'Notas',
      'Carpetas',
      'Integraciones',
      'Ajustes & PIN',
      'Bóveda Offline',
      'Buscar en Espiralia (Ctrl+K)',
      '+ Nueva Nota',
      'Cambiar perfil (Francisca)',
    ]);
  });

  it('abre el modal de Búsqueda Global al hacer click en el disparador de la cabecera', async () => {
    const user = userEvent.setup();
    renderLayout();

    const searchBtn = screen.getByRole('button', { name: /buscar en espiralia/i });
    await user.click(searchBtn);

    expect(screen.getByRole('dialog', { name: /búsqueda global/i })).toBeInTheDocument();
  });

  it('abre el modal de Búsqueda Global al pulsar el atajo Ctrl+K', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.keyboard('{Control>}k{/Control}');

    expect(screen.getByRole('dialog', { name: /búsqueda global/i })).toBeInTheDocument();
  });

  it('abre el modal de Búsqueda Global al pulsar la tecla / cuando no se está en un campo editable', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.keyboard('/');

    expect(screen.getByRole('dialog', { name: /búsqueda global/i })).toBeInTheDocument();
  });

  it('no abre el modal de búsqueda al pulsar / dentro de un input editable', async () => {
    const user = userEvent.setup();
    renderLayout(freeProfile, 'dashboard', <input data-testid="test-input" />);

    const input = screen.getByTestId('test-input');
    await user.click(input);
    await user.type(input, '/');

    expect(screen.queryByRole('dialog', { name: /búsqueda global/i })).not.toBeInTheDocument();
  });

  it('restaura el foco en el disparador de búsqueda al cerrar el modal con Escape', async () => {
    const user = userEvent.setup();
    renderLayout();

    const searchBtn = screen.getByRole('button', { name: /buscar en espiralia/i });
    await user.click(searchBtn);
    expect(screen.getByRole('dialog', { name: /búsqueda global/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /búsqueda global/i })).not.toBeInTheDocument();
    expect(searchBtn).toHaveFocus();
  });

  it('abre el modal de Bóveda Offline al hacer click en el botón del sidebar', async () => {
    const user = userEvent.setup();
    renderLayout();

    const vaultBtn = screen.getByRole('button', { name: /bóveda offline/i });
    await user.click(vaultBtn);

    expect(screen.getByRole('dialog', { name: /bóveda offline/i })).toBeInTheDocument();
  });

  it('abre el modal de Nueva Nota al hacer click en el boton de la cabecera', async () => {
    const user = userEvent.setup();
    renderLayout();

    const newNoteBtn = screen.getByRole('button', { name: /\+ nueva nota/i });
    await user.click(newNoteBtn);

    expect(screen.getByRole('dialog', { name: /nueva nota o reflexión/i })).toBeInTheDocument();
  });

  it('abre el modal de Accion Rapida al hacer click en el boton de la barra lateral', async () => {
    const user = userEvent.setup();
    renderLayout();

    const quickActionBtn = screen.getByRole('button', { name: /\+ acción rápida/i });
    await user.click(quickActionBtn);

    expect(screen.getByRole('dialog', { name: /acción rápida/i })).toBeInTheDocument();
  });

  it('abre el modal de Ajustes & PIN al hacer click en el boton del footer del sidebar', async () => {
    const user = userEvent.setup();
    renderLayout();

    const settingsBtn = screen.getByRole('button', { name: /ajustes & pin/i });
    await user.click(settingsBtn);

    expect(screen.getByRole('dialog', { name: /ajustes de perfil/i })).toBeInTheDocument();
  });

  // Revisión final (Minor 6 re-graduado): en móvil la tarjeta del sidebar se oculta; el perfil activo sigue identificable.
  it('identifica el perfil activo en el botón de sesión de la barra superior', () => {
    renderLayout(protectedProfile);
    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('button', { name: 'Bloquear perfil (Francisca)' })).toBeInTheDocument();
    expect(within(banner).getByText('F')).toBeInTheDocument();
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
