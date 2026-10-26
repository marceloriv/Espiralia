import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundView } from '../components/NotFoundView';

const renderView = (hasActiveProfile: boolean, onNavigateHome = vi.fn(), path = '/ruta/rara') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NotFoundView hasActiveProfile={hasActiveProfile} onNavigateHome={onNavigateHome} />
    </MemoryRouter>,
  );

describe('NotFoundView', () => {
  beforeEach(() => {
    document.title = 'Espiralia';
  });

  it('tiene un único h1 y el foco queda en él, porque un cambio de ruta no anuncia nada al lector de pantalla', () => {
    renderView(false);
    const titulos = screen.getAllByRole('heading', { level: 1 });
    expect(titulos).toHaveLength(1);
    expect(titulos[0]).toHaveTextContent(/esta página no existe/i);
    expect(titulos[0]).toHaveFocus();
  });

  it('es el contenido principal de la pantalla', () => {
    renderView(false);
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { level: 1 }));
  });

  it('cambia el título del documento y lo restaura al salir', () => {
    const { unmount } = renderView(false);
    expect(document.title).toBe('Página no encontrada · Espiralia');
    unmount();
    expect(document.title).toBe('Espiralia');
  });

  // Técnica: tabla de decisión. Con sesión vuelve al Dashboard; sin ella, al inicio.
  it.each([
    [true, 'Volver al Dashboard'],
    [false, 'Volver al inicio'],
  ])('con sesión=%s el botón dice "%s" y llama a onNavigateHome', async (hasActiveProfile, etiqueta) => {
    const onNavigateHome = vi.fn();
    renderView(hasActiveProfile, onNavigateHome);

    await userEvent.setup().click(screen.getByRole('button', { name: etiqueta }));

    expect(onNavigateHome).toHaveBeenCalledTimes(1);
  });

  it('muestra la dirección que no existe, para que se vea qué se escribió mal', () => {
    renderView(false, vi.fn(), '/ruta/rara');
    expect(screen.getByText('/ruta/rara')).toBeInTheDocument();
  });

  it('muestra la dirección como texto y nunca como HTML', () => {
    renderView(false, vi.fn(), '/<img src=x onerror=alert(1)>');
    expect(screen.getByText('/<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('el origami del Nautilus es decorativo: va fuera del árbol de accesibilidad', () => {
    const { container } = renderView(false);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
