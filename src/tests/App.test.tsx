import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

describe('App integración general', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
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
    expect(await screen.findByText(/¡hola, ignacio!/i)).toBeInTheDocument();

    // Cambiar perfil bloquea sesion
    const lockBtn = screen.getAllByRole('button', { name: /cambiar perfil/i })[0];
    await user.click(lockBtn);

    expect(await screen.findByText(/selecciona tu perfil/i)).toBeInTheDocument();
  });
});
