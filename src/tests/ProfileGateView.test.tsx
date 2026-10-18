import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { ProfileGateView } from '../components/ProfileGateView';
import { StorageService } from '../services/storage';

describe('ProfileGateView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('permite crear un nuevo perfil sin PIN y seleccionarlo', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();

    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    expect(screen.getByText(/selecciona tu perfil/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    expect(screen.getByRole('dialog', { name: /crear perfil/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/nombre/i), 'Valentina');
    await user.click(screen.getByRole('button', { name: /crear perfil/i }));

    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
    expect(onSelectProfile.mock.calls[0][0].name).toBe('Valentina');
    expect(successSpy).toHaveBeenCalledWith({ title: 'Perfil "Valentina" creado' });
  });

  it('crea un perfil con PIN guardando solo hash y sal', async () => {
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/pin opcional/i), '2468');
    await user.click(screen.getByRole('button', { name: /crear perfil/i }));

    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem('espiralia_profiles')).not.toContain('2468');
    const [stored] = StorageService.getProfiles();
    expect(stored.pin).toBeUndefined();
    expect(stored.pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.pinSalt).toMatch(/^[0-9a-f]{32}$/);
  });

  // Técnica: partición de equivalencia sobre el PIN de creación (corto, con letras, sin dígitos).
  it.each(['123', '12a4', 'abcd'])('rechaza el PIN inválido "%s" al crear', async invalid => {
    const errorSpy = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/pin opcional/i), invalid);
    await user.click(screen.getByRole('button', { name: /crear perfil/i }));

    expect(errorSpy).toHaveBeenCalledWith({ title: 'El PIN debe tener entre 4 y 6 dígitos' });
    expect(screen.getByLabelText(/pin opcional/i)).toHaveAttribute('aria-invalid', 'true');
    expect(StorageService.getProfiles()).toEqual([]);
    expect(onSelectProfile).not.toHaveBeenCalled();
  });

  // Review Focus 1: contexto sin Web Crypto.
  it('si Web Crypto falla al crear con PIN avisa y no guarda nada', async () => {
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(new Error('no disponible'));
    const errorSpy = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    await user.type(screen.getByLabelText(/nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/pin opcional/i), '2468');
    await user.click(screen.getByRole('button', { name: /crear perfil/i }));

    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith({ title: 'No se pudo crear el perfil' }));
    expect(StorageService.getProfiles()).toEqual([]);
    expect(onSelectProfile).not.toHaveBeenCalled();
  });

  it('migra un PIN en texto plano a hash al abrir la pantalla', async () => {
    StorageService.saveProfile({ id: 'p-legacy', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await waitFor(() => expect(StorageService.getProfiles()[0].pinHash).toBeDefined());
    expect(StorageService.getProfiles()[0].pin).toBeUndefined();
    expect(localStorage.getItem('espiralia_profiles')).not.toContain('4321');
    expect(screen.getByText('Protegido por PIN')).toBeInTheDocument();
  });

  it('solicita PIN si el perfil tiene PIN y rechaza PIN incorrecto', async () => {
    const errorSpy = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();

    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    await user.click(screen.getByText('Carlos'));
    expect(screen.getByRole('dialog', { name: /ingresa tu pin/i })).toBeInTheDocument();

    const pinInput = screen.getByLabelText(/pin de acceso/i);
    await user.type(pinInput, '0000');
    await user.click(screen.getByRole('button', { name: /desbloquear/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/pin incorrecto/i);
    expect(pinInput).toHaveAttribute('aria-invalid', 'true');
    expect(errorSpy).toHaveBeenCalledWith({ title: 'PIN incorrecto' });
    expect(onSelectProfile).not.toHaveBeenCalled();

    await user.clear(pinInput);
    await user.type(pinInput, '4321');
    await user.click(screen.getByRole('button', { name: /desbloquear/i }));

    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
    expect(onSelectProfile.mock.calls[0][0].id).toBe('p-pin');
  });

  it('renderiza la interfaz de desbloqueo con pliego papercraft, teclado numerico 3x4 y post-it con clip', () => {
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: /desbloquear cuaderno\./i })).toBeInTheDocument();
    expect(screen.getByText(/cuadernos registrados/i)).toBeInTheDocument();
    expect(screen.getByText(/introduce tu pin maestro/i)).toBeInTheDocument();
    expect(screen.getByText(/discipline today, peace tomorrow/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
  });

  it('renderiza candado de latón artesanal en perfiles protegidos y cerradura de combinación cilíndrica en el PIN', () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const { container } = render(<ProfileGateView onSelectProfile={vi.fn()} />);

    const padlock = container.querySelector('[class*="brassPadlock"]');
    expect(padlock).toBeInTheDocument();
    expect(padlock).toHaveAttribute('aria-hidden', 'true');

    const combinationLock = container.querySelector('[class*="combinationLockFrame"]');
    expect(combinationLock).toBeInTheDocument();
    expect(combinationLock).toHaveAttribute('aria-hidden', 'true');
  });
});

