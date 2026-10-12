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

  // Guarda de la deuda técnica del roadmap: el layout expone los controles reales y ningún campo de búsqueda.
  it('no muestra controles de features que todavía no existen', () => {
    renderLayout();
    const names = screen.getAllByRole('button').map(b => b.getAttribute('aria-label') ?? b.textContent?.trim());
    expect(names).toEqual(['+ Acción Rápida', 'Dashboard', 'Agenda', 'Planner', 'To-Do', 'Ajustes & PIN', 'Cambiar perfil (Francisca)']);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    const forbidden = [/buscar/i, /nueva nota/i, /bóveda/i, /notas rápidas/i, /carpetas/i, /indexeddb/i, /cifrad/i, /\bAES\b/];
    for (const label of forbidden) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
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
