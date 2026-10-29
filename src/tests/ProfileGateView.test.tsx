import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { ProfileGateView } from '../components/ProfileGateView';
import { StorageService } from '../services/storage';
import { VaultService } from '../services/vaultService';
import type { ProfileBackup } from '../services/vaultCrypto';

describe('ProfileGateView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sin perfiles no muestra el diálogo de PIN y invita a crear uno', () => {
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    expect(screen.queryByRole('dialog', { name: /ingresa tu pin/i })).not.toBeInTheDocument();
    expect(screen.getByText(/crea un perfil para empezar/i)).toBeInTheDocument();
  });

  it('con un perfil protegido seleccionado muestra un único acceso de PIN: el diálogo con su input', () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: /ingresa tu pin/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/pin de acceso/i)).toHaveFocus();
    expect(screen.queryByRole('button', { name: '5' })).not.toBeInTheDocument();
    expect(screen.queryByText(/introduce tu pin maestro/i)).not.toBeInTheDocument();
  });

  it('la acción principal de los diálogos se ve como acción principal, no como el botón punteado de lista', async () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Desbloquear' }).className).toMatch(/btnSubmit/);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /nuevo perfil/i }));
    expect(screen.getByRole('button', { name: 'Crear perfil' }).className).toMatch(/btnSubmit/);
  });

  it('el aviso de PIN olvidado no promete una recuperación que no existe', async () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const infoSpy = vi.spyOn(sileo, 'info').mockImplementation(() => 'x');
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /olvidaste tu pin/i }));

    const { title } = infoSpy.mock.calls[0][0] as { title: string };
    expect(title).toMatch(/no puede restablecer un pin/i);
    expect(title).not.toMatch(/restaura/i);
  });

  describe('exportar respaldo desde el acceso', () => {
    const files: Array<{ name: string; blob: Blob }> = [];

    beforeEach(() => {
      files.length = 0;
      let lastBlob: Blob;
      vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => {
        lastBlob = blob as Blob;
        return 'blob:respaldo';
      });
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        files.push({ name: this.download, blob: lastBlob });
      });
    });

    // Técnica: partición de equivalencia sobre la cantidad de perfiles (ninguno, uno, varios).
    it('sin perfiles avisa y no descarga nada', async () => {
      const infoSpy = vi.spyOn(sileo, 'info').mockImplementation(() => 'x');
      const user = userEvent.setup();
      render(<ProfileGateView onSelectProfile={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /exportar respaldo/i }));

      expect(files).toHaveLength(0);
      expect(infoSpy).toHaveBeenCalledWith({ title: 'No hay perfiles para respaldar' });
    });

    it('descarga un archivo por perfil en el formato que importa la bóveda del cuaderno', async () => {
      StorageService.saveProfile({ id: 'p-a', name: 'Ana Pérez', avatar: 'A', createdAt: '2026-10-09' });
      StorageService.saveProfile({ id: 'p-b', name: 'Beto', avatar: 'B', createdAt: '2026-10-09' });
      const user = userEvent.setup();
      render(<ProfileGateView onSelectProfile={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /exportar respaldo/i }));

      // La exportación es asíncrona: espera a leer los PDF de cada perfil antes de descargar.
      await vi.waitFor(() => expect(files).toHaveLength(2));
      expect(files.map(f => f.name)).toEqual([
        expect.stringMatching(/^espiralia-ana-p-rez-\d{4}-\d{2}-\d{2}\.json$/),
        expect.stringMatching(/^espiralia-beto-\d{4}-\d{2}-\d{2}\.json$/),
      ]);
    });

    it('el archivo exportado se restaura con los mismos datos', async () => {
      StorageService.saveProfile({ id: 'p-a', name: 'Ana', avatar: 'A', createdAt: '2026-10-09' });
      StorageService.saveTodo({
        id: 't1', profileId: 'p-a', title: 'Entregar informe', areaId: 'a', priority: 'alta',
        status: 'pendiente', createdAt: '2026-10-09',
      });
      const user = userEvent.setup();
      render(<ProfileGateView onSelectProfile={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /exportar respaldo/i }));
      await vi.waitFor(() => expect(files).toHaveLength(1));

      const backup: unknown = JSON.parse(await files[0].blob.text());
      expect(VaultService.validateBackup(backup)).toBe(true);
      const { profile, counts } = VaultService.restoreProfile(backup as ProfileBackup, 'new_profile');
      expect(counts.todos).toBe(1);
      expect(StorageService.getTodos(profile.id).map(t => t.title)).toEqual(['Entregar informe']);
    });
  });

  it('Escape cierra el diálogo de PIN', async () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: /ingresa tu pin/i })).not.toBeInTheDocument();
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

  it('renderiza la interfaz de desbloqueo con post-it con clip y el diálogo de PIN', () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: /desbloquear cuaderno\./i })).toBeInTheDocument();
    expect(screen.getByText(/cuadernos registrados/i)).toBeInTheDocument();
    expect(screen.getByText(/disciplina hoy, paz mañana/i)).toBeInTheDocument();
    expect(screen.queryByText(/discipline today/i)).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /ingresa tu pin/i })).toBeInTheDocument();
  });

  describe('panel del cuaderno (DESIGN.md §0.9, paso 3)', () => {
    const renderLibre = () => {
      StorageService.saveProfile({ id: 'p-libre', name: 'Ana', avatar: 'A', createdAt: '2026-10-09' });
      return render(<ProfileGateView onSelectProfile={vi.fn()} />);
    };

    it('la tarjeta de cuadernos registrados es un pliego encuadernado', () => {
      const { container } = renderLibre();

      const anillas = container.querySelectorAll('main svg[aria-hidden="true"]');
      expect(anillas.length).toBeGreaterThanOrEqual(2);
      expect(container.querySelector('[class*="washiCorner"]')).not.toBeInTheDocument();
    });

    // Cada afirmación del panel se verificó contra el código (DESIGN.md §0.9): sin servidor, PIN con hash y sal, respaldo cifrable.
    it.each([
      [/todo queda en este navegador/i, /no salen de tu equipo/i],
      [/pin opcional por perfil/i, /hash con sal/i],
      [/respalda desde dentro del cuaderno/i, /cifrado opcional/i],
    ])('cuenta un dato verificable: %s', (titulo, detalle) => {
      renderLibre();
      const panel = screen.getByRole('complementary', { name: /sobre tu cuaderno/i });

      expect(within(panel).getByText(titulo)).toBeInTheDocument();
      expect(panel).toHaveTextContent(detalle);
    });

    it('marca el cuaderno como local con el sello y no repite la afirmación de PBKDF2 tres veces', () => {
      renderLibre();

      expect(within(screen.getByRole('complementary', { name: /sobre tu cuaderno/i })).getByText('LOCAL')).toBeInTheDocument();
      expect(screen.getAllByText(/pbkdf2/i)).toHaveLength(1);
    });
  });

  it('renderiza candado de latón en perfiles protegidos y la cerradura de combinación dentro del diálogo, oculta a lectores de pantalla', () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const { container } = render(<ProfileGateView onSelectProfile={vi.fn()} />);

    const padlock = container.querySelector('[class*="brassPadlock"]');
    expect(padlock).toBeInTheDocument();
    expect(padlock).toHaveAttribute('aria-hidden', 'true');

    const dialog = screen.getByRole('dialog', { name: /ingresa tu pin/i });
    const combinationLock = dialog.querySelector('[class*="combinationLockFrame"]');
    expect(combinationLock).toBeInTheDocument();
    expect(combinationLock).toHaveAttribute('aria-hidden', 'true');
  });

  it('permite ingresar solo dígitos con el teclado e ignora letras y símbolos', async () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await user.keyboard('abc!@# 1234xyz');

    expect(screen.getByLabelText(/pin de acceso/i)).toHaveValue('1234');
    expect(screen.getAllByText('●')).toHaveLength(4);
  });

  // Técnica: valores límite sobre la longitud del PIN (4 a 6 dígitos): la cerradura muestra 4 casillas como mínimo y crece hasta 6.
  it.each([
    ['', 4, 0],
    ['12', 4, 2],
    ['1234', 4, 4],
    ['12345', 5, 5],
    ['123456', 6, 6],
    ['1234567', 6, 6],
  ])('con el PIN "%s" la cerradura tiene %i casillas y %i llenas', async (typed, boxes, filled) => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    const user = userEvent.setup();
    const { container } = render(<ProfileGateView onSelectProfile={vi.fn()} />);

    if (typed) await user.keyboard(typed);

    expect(container.querySelectorAll('[class*="pinBox"]:not([class*="pinBoxes"])')).toHaveLength(boxes);
    expect(screen.queryAllByText('●')).toHaveLength(filled);
  });

  it('el error de PIN queda ligado al input y la cerradura no oculta el mensaje', async () => {
    StorageService.saveProfile({ id: 'p-pin', name: 'Carlos', avatar: 'C', pin: '4321', createdAt: '2026-10-09' });
    vi.spyOn(sileo, 'error').mockImplementation(() => 'x');
    const user = userEvent.setup();
    render(<ProfileGateView onSelectProfile={vi.fn()} />);

    await user.keyboard('0000{Enter}');

    const input = screen.getByLabelText(/pin de acceso/i);
    expect(await screen.findByRole('alert')).toHaveTextContent(/pin incorrecto/i);
    expect(input).toHaveAttribute('aria-describedby', 'pin-error-alert');
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

