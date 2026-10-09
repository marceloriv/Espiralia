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

  it('permite acceder al dashboard si hay perfil autenticado', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/¡hola, carolina!/i)).toBeInTheDocument();
  });

  it('navega a /todo correctamente dentro de la ruta protegida', () => {
    render(
      <MemoryRouter initialEntries={['/todo']}>
        <AppRoutes
          activeProfile={mockProfile}
          onSelectProfile={vi.fn()}
          onLockProfile={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/mis tareas/i)).toBeInTheDocument();
  });
});
