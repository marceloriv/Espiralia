import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { App } from '../App';
import { STORAGE_ERROR_EVENT } from '../services/storage';

describe('App integración general', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
    vi.clearAllMocks();
  });

  // Revisión final, Important 2: la sesión activa salta la pantalla de perfiles; el PIN se migra igual al arrancar.
  it('migra a hash el PIN en texto plano al arrancar con una sesión activa', async () => {
    localStorage.setItem(
      'espiralia_profiles',
      JSON.stringify([{ id: 'p-legacy', name: 'Rosa', avatar: 'R', pin: '4321', createdAt: '2026-10-09' }]),
    );
    localStorage.setItem('espiralia_active_profile_id', 'p-legacy');

    render(<App />);

    await waitFor(() => expect(localStorage.getItem('espiralia_profiles')).not.toContain('4321'), { timeout: 4000 });
    const [stored] = JSON.parse(localStorage.getItem('espiralia_profiles')!);
    expect(stored.pin).toBeUndefined();
    expect(stored.pinHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('inicia en la portada editorial de bienvenida si no hay sesion activa', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /el arte de organizar tu vida con serenidad cotidiana/i }, { timeout: 4000 })).toBeInTheDocument();
  });

  it('permite crear perfil, ingresar al dashboard y cambiar de perfil', async () => {
    const user = userEvent.setup();

    render(<App />);

    const openLandingBtns = await screen.findAllByRole('button', { name: /crear mi cuaderno/i });
    await user.click(openLandingBtns[0]);

    const openCreateBtn = await screen.findByRole('button', { name: /nuevo perfil/i });
    await user.click(openCreateBtn);

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Ignacio');

    const submitBtn = screen.getByRole('button', { name: /crear perfil/i });
    await user.click(submitBtn);

    // Debe mostrar dashboard
    // El Dashboard (con gráficos) es un chunk diferido: su import() en frío supera 1 s en jsdom.
    expect(await screen.findByRole('heading', { name: /ignacio/i }, { timeout: 10000 })).toBeInTheDocument();

    // Cambiar perfil bloquea sesion
    const lockBtn = screen.getAllByRole('button', { name: /cambiar perfil/i })[0];
    await user.click(lockBtn);

    expect(await screen.findByText(/selecciona tu perfil/i)).toBeInTheDocument();
  });

  it('dispara notificacion toast al seleccionar e iniciar sesion con un perfil', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();

    render(<App />);

    const openLandingBtns = await screen.findAllByRole('button', { name: /crear mi cuaderno/i });
    await user.click(openLandingBtns[0]);

    const openCreateBtn = await screen.findByRole('button', { name: /nuevo perfil/i });
    await user.click(openCreateBtn);

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Valentina');

    const submitBtn = screen.getByRole('button', { name: /crear perfil/i });
    await user.click(submitBtn);

    expect(successSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringContaining('Valentina'),
    }));
  });

  it('muestra un aviso al recibir espiralia:storage-error', () => {
    const errorSpy = vi.spyOn(sileo, 'error');
    render(<App />);

    act(() => {
      window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key: 'espiralia_p_todos' } }));
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringMatching(/almacenamiento del navegador está lleno/i),
    }));
  });

  it('no repite el aviso de almacenamiento lleno dentro de 3 segundos', () => {
    const errorSpy = vi.spyOn(sileo, 'error');
    render(<App />);

    act(() => {
      window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key: 'a' } }));
      window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key: 'b' } }));
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('configura el contenedor de notificaciones Sileo en posicion top-center', async () => {
    render(<App />);
    act(() => {
      sileo.info({ title: 'Test toast' });
    });
    await waitFor(() => {
      const viewport = document.querySelector('[data-sileo-viewport]');
      expect(viewport).not.toBeNull();
      expect(viewport?.getAttribute('data-position')).toBe('top-center');
    });
  });
});

