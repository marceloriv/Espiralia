import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../routes';

describe('Rutas de Landing e Inicio', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('permite acceder a /inicio y despliega la landing editorial', async () => {
    render(
      <MemoryRouter initialEntries={['/inicio']}>
        <AppRoutes
          activeProfile={null}
          onSelectProfile={() => {}}
          onLockProfile={() => {}}
        />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /organiza tu semana en un cuaderno que guarda todo en tu navegador/i }, { timeout: 4000 })).toBeInTheDocument();
  });

  it('cuando no hay perfil activo, la raíz / presenta la landing de bienvenida', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes
          activeProfile={null}
          onSelectProfile={() => {}}
          onLockProfile={() => {}}
        />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /organiza tu semana en un cuaderno que guarda todo en tu navegador/i }, { timeout: 4000 })).toBeInTheDocument();
  });
});
