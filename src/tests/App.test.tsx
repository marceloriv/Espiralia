import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { App } from '../App';

describe('App integración general', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
    vi.clearAllMocks();
  });

  it('inicia en el selector de perfiles si no hay sesion activa', () => {
    render(<App />);
    expect(screen.getByText(/selecciona tu perfil/i)).toBeInTheDocument();
  });

  it('permite crear perfil, ingresar al dashboard y cambiar de perfil', async () => {
    const user = userEvent.setup();

    render(<App />);

    const openCreateBtn = screen.getByRole('button', { name: /nuevo perfil/i });
    await user.click(openCreateBtn);

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Ignacio');

    const submitBtn = screen.getByRole('button', { name: /crear perfil/i });
    await user.click(submitBtn);

    // Debe mostrar dashboard
    // El Dashboard (con gráficos) es un chunk diferido: su import() en frío supera 1 s en jsdom.
    expect(await screen.findByRole('heading', { name: /¡hola, ignacio!/i }, { timeout: 10000 })).toBeInTheDocument();

    // Cambiar perfil bloquea sesion
    const lockBtn = screen.getAllByRole('button', { name: /cambiar perfil/i })[0];
    await user.click(lockBtn);

    expect(await screen.findByText(/selecciona tu perfil/i)).toBeInTheDocument();
  });

  it('dispara notificacion toast al seleccionar e iniciar sesion con un perfil', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();

    render(<App />);

    const openCreateBtn = screen.getByRole('button', { name: /nuevo perfil/i });
    await user.click(openCreateBtn);

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Valentina');

    const submitBtn = screen.getByRole('button', { name: /crear perfil/i });
    await user.click(submitBtn);

    expect(successSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringContaining('Valentina'),
    }));
  });
});
