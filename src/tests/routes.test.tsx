import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../routes';
import type { Profile } from '../types';

describe('AppRoutes con rutas protegidas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockProfile: Profile = {
    id: 'p-auth',
    name: 'Carolina',
    avatar: 'C',
    createdAt: '2026-10-09',
  };

  it('redirige a /login si no hay perfil activo al entrar a ruta protegida', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes
          activeProfile={null}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/selecciona tu perfil/i)).toBeInTheDocument();
  });

  // Técnica: partición de equivalencia (vista diferida: fallback primero, contenido después).
  it('permite acceder al dashboard si hay perfil autenticado', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    // El Dashboard es diferido: primero se ve el fallback de Suspense.
    expect(screen.getByRole('status')).toHaveTextContent(/cargando espacio/i);
    expect(await screen.findByText(/carolina./i, {}, { timeout: 10000 })).toBeInTheDocument();
  });

  it('navega a /todo correctamente dentro de la ruta protegida cargando vista lazy', async () => {
    render(
      <MemoryRouter initialEntries={['/todo']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText(/mis tareas/i)).toBeInTheDocument();
  });

  it('navega a /agenda y resuelve componente diferido con Suspense', async () => {
    render(
      <MemoryRouter initialEntries={['/agenda']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    // El chunk diferido de la Agenda incluye FullCalendar: su import() tarda más que el default de 1 s en jsdom.
    expect(await screen.findByPlaceholderText(/título del evento/i, {}, { timeout: 10000 })).toBeInTheDocument();
  });

  it('navega a /notes y resuelve vista lazy de notas', async () => {
    render(
      <MemoryRouter initialEntries={['/notes']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 2, name: /notas & reflexiones/i }, { timeout: 10000 })).toBeInTheDocument();
  });

  it('navega a /folders y resuelve vista lazy de carpetas', async () => {
    render(
      <MemoryRouter initialEntries={['/folders']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 2, name: /carpetas & vínculos/i }, { timeout: 10000 })).toBeInTheDocument();
  });

  it('navega a /planner y resuelve vista lazy de planner', async () => {
    render(
      <MemoryRouter initialEntries={['/planner']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 2, name: /planner semanal/i }, { timeout: 10000 })).toBeInTheDocument();
  });

  it('navega a /integrations y resuelve vista lazy de integraciones', async () => {
    render(
      <MemoryRouter initialEntries={['/integrations']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 1, name: /integraciones & enlace externo/i }, { timeout: 10000 })).toBeInTheDocument();
  });
});
