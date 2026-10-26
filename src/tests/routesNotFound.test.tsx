import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../routes';
import type { Profile } from '../types';

const perfil: Profile = { id: 'p-404', name: 'Carolina', avatar: 'C', createdAt: '2026-10-26' };

const renderRoutes = (path: string, activeProfile: Profile | null) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes activeProfile={activeProfile} onSelectProfile={vi.fn()} onLockProfile={vi.fn()} />
    </MemoryRouter>,
  );

describe('AppRoutes con una dirección desconocida', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Técnica: tabla de decisión (sesión x tipo de dirección desconocida). Ninguna redirige: todas muestran la 404.
  it.each([
    ['sin sesión', null, '/no-existe', 'Volver al inicio'],
    ['sin sesión', null, '/dashboard/no-existe', 'Volver al inicio'],
    ['con sesión', perfil, '/no-existe', 'Volver al Dashboard'],
    ['con sesión', perfil, '/agenda/no-existe', 'Volver al Dashboard'],
  ])('%s en %s muestra la 404 con el botón "%s"', async (_caso, activeProfile, ruta, etiqueta) => {
    renderRoutes(ruta, activeProfile);

    expect(await screen.findByRole('heading', { level: 1, name: /esta página no existe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: etiqueta })).toBeInTheDocument();
    expect(screen.getByText(ruta)).toBeInTheDocument();
  });

  it('la raíz sin sesión sigue mostrando la bienvenida y no la 404', async () => {
    renderRoutes('/', null);

    expect((await screen.findAllByRole('button', { name: /crear mi cuaderno/i }, { timeout: 10000 })).length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: /esta página no existe/i })).toBeNull();
  });

  it('la pantalla de acceso sigue siendo una ruta conocida', () => {
    renderRoutes('/login', null);

    expect(screen.getByText(/selecciona tu perfil/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /esta página no existe/i })).toBeNull();
  });
});
