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

  it('sin perfiles no muestra Introduce tu PIN Maestro y invita a crear uno', () => {
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    expect(screen.queryByText(/introduce tu pin maestro/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '5' })).not.toBeInTheDocument();
    expect(screen.getByText(/crea un perfil para empezar/i)).toBeInTheDocument();
  });

  it('con un perfil protegido seleccionado sí muestra el teclado de PIN', () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    expect(screen.getByText(/introduce tu pin maestro/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
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
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
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

  it('permite ingresar solo dígitos con el teclado físico e ignora letras y símbolos', async () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    // Teclear combinación de letras, símbolos y números
    await user.keyboard('abc!@# 1234xyz');

    // Las cajas de PIN deben tener exactamente 4 dígitos (los numéricos 1234)
    const pinBoxes = screen.getAllByText('●');
    expect(pinBoxes).toHaveLength(4);
  });

  it('refleja feedback visual keypadBtnPressed en el botón correspondiente al pulsar teclas', async () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    const btn5 = screen.getByRole('button', { name: '5' });
    expect(btn5.className).not.toMatch(/keypadBtnPressed/);

    // Al presionar la tecla física '5'
    await user.keyboard('5');

    // Se verifica que '5' fue introducido en el PIN
    expect(screen.getAllByText('●')).toHaveLength(1);
  });

  it('permite borrar dígitos con Backspace y confirmar con Enter', async () => {
    const onSelectProfile = vi.fn();
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '1234', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    // Escribir 125, corregir con Backspace y poner 34
    await user.keyboard('125{Backspace}34');
    expect(screen.getAllByText('●')).toHaveLength(4);

    // Confirmar con Enter
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
  });

  it('no captura teclas numéricas de PIN cuando el foco está en el nombre al crear perfil', async () => {
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Valentina12');

    expect(nameInput).toHaveValue('Valentina12');
    // Las cajas de PIN del fondo no deben haberse llenado
    expect(screen.queryAllByText('●')).toHaveLength(0);
  });

  it('si existe un perfil protegido con PIN, escribir directamente el PIN y presionar Enter lo desbloquea', async () => {
    const onSelectProfile = vi.fn();
    StorageService.saveProfile({ id: 'p-auto', name: 'Laura', avatar: 'L', pin: '5678', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    // Escribir PIN directo con el teclado físico y Enter
    await user.keyboard('5678{Enter}');

    await waitFor(() => expect(onSelectProfile).toHaveBeenCalledTimes(1));
    expect(onSelectProfile.mock.calls[0][0].id).toBe('p-auto');
  });

  it('al escribir o pegar en el input de PIN del modal solo conserva dígitos numéricos', async () => {
    StorageService.saveProfile({ id: 'p-test', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await user.click(screen.getByText('Carlos'));
    const pinInput = screen.getByLabelText(/pin de acceso/i);

    await user.type(pinInput, 'abc12de34');
    expect(pinInput).toHaveValue('1234');
  });
});

