import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { PlannerView } from '../components/PlannerView';
import { StorageService } from '../services/storage';

describe('PlannerView integración semanal y metas', () => {
  const profileId = 'p-planner';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renderiza las columnas de los 7 días (Lunes a Domingo) y el drawer de metas', () => {
    render(<PlannerView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 2, name: /planner semanal/i })).toBeInTheDocument();
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Martes')).toBeInTheDocument();
    expect(screen.getByText('Miércoles')).toBeInTheDocument();
    expect(screen.getByText('Jueves')).toBeInTheDocument();
    expect(screen.getByText('Viernes')).toBeInTheDocument();
    expect(screen.getByText('Sábado')).toBeInTheDocument();
    expect(screen.getByText('Domingo')).toBeInTheDocument();
    expect(screen.getByText(/metas semanales/i)).toBeInTheDocument();
  });

  it('permite abrir modal y registrar un nuevo bloque para un día específico', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();

    render(<PlannerView profileId={profileId} />);

    // Click en + Bloque en la columna Lunes
    const addLunesBtn = screen.getByRole('button', { name: /agregar bloque lunes/i });
    await user.click(addLunesBtn);

    expect(screen.getByRole('heading', { name: /nuevo bloque de enfoque/i })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/título del bloque/i);
    await user.type(titleInput, 'Sesión teórica Clase B');

    const saveBtn = screen.getByRole('button', { name: /guardar bloque/i });
    await user.click(saveBtn);

    expect(screen.getByText('Sesión teórica Clase B')).toBeInTheDocument();
    expect(successSpy).toHaveBeenCalledWith({ title: 'Bloque de enfoque guardado' });
  });

  it('muestra bloques legados en la columna "Sin día asignado" y permite completarlos', async () => {
    const user = userEvent.setup();
    StorageService.savePlanner({
      id: 'pb-legacy-1',
      profileId,
      period: 'semanal',
      timeSlot: 'tarde',
      title: 'Bloque legado sin día',
      priority: 'media',
      completed: false,
    });

    render(<PlannerView profileId={profileId} />);

    expect(screen.getByText('Sin día asignado')).toBeInTheDocument();
    expect(screen.getByText('Bloque legado sin día')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /completar bloque legado sin día/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('calcula y actualiza el medidor de cumplimiento semanal', async () => {
    const user = userEvent.setup();
    StorageService.savePlanner({
      id: 'pb-1',
      profileId,
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Bloque 1',
      priority: 'alta',
      completed: true,
      dayOfWeek: 1,
    });
    StorageService.savePlanner({
      id: 'pb-2',
      profileId,
      period: 'semanal',
      timeSlot: 'tarde',
      title: 'Bloque 2',
      priority: 'media',
      completed: false,
      dayOfWeek: 1,
    });

    render(<PlannerView profileId={profileId} />);

    // 1 de 2 completados = 50%
    expect(screen.getByText(/50%/)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /completar bloque 2/i });
    await user.click(checkbox);

    // 2 de 2 completados = 100%
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('permite navegar entre semanas y restablecer con el botón Hoy', async () => {
    const user = userEvent.setup();
    render(<PlannerView profileId={profileId} />);

    const nextWeekBtn = screen.getByRole('button', { name: /semana siguiente/i });
    const todayBtn = screen.getByRole('button', { name: /hoy/i });

    const initialLabel = screen.getByText(/–/i).textContent;

    await user.click(nextWeekBtn);
    expect(screen.getByText(/–/i).textContent).not.toBe(initialLabel);

    await user.click(todayBtn);
    expect(screen.getByText(/–/i).textContent).toBe(initialLabel);
  });

  it('inicializa correctamente el día en modal y limpia campos entre aperturas', async () => {
    const user = userEvent.setup();
    render(<PlannerView profileId={profileId} />);

    // Abrir desde Miércoles
    const addMiercolesBtn = screen.getByRole('button', { name: /agregar bloque miércoles/i });
    await user.click(addMiercolesBtn);

    const daySelect = screen.getByLabelText(/día de la semana/i) as HTMLSelectElement;
    expect(daySelect.value).toBe('3'); // Miércoles = 3

    const titleInput = screen.getByLabelText(/título del bloque/i);
    await user.type(titleInput, 'Lectura miércoles');

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelBtn);

    // Abrir ahora desde Jueves
    const addJuevesBtn = screen.getByRole('button', { name: /agregar bloque jueves/i });
    await user.click(addJuevesBtn);

    const daySelectJueves = screen.getByLabelText(/día de la semana/i) as HTMLSelectElement;
    expect(daySelectJueves.value).toBe('4'); // Jueves = 4

    const titleInputJueves = screen.getByLabelText(/título del bloque/i) as HTMLInputElement;
    expect(titleInputJueves.value).toBe(''); // Limpio
  });

  it('permite filtrar bloques por prioridad en el sub-header', async () => {
    const user = userEvent.setup();
    StorageService.savePlanner({
      id: 'pb-alta',
      profileId,
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Bloque Alta Prioridad',
      priority: 'alta',
      completed: false,
      dayOfWeek: 1,
    });
    StorageService.savePlanner({
      id: 'pb-baja',
      profileId,
      period: 'semanal',
      timeSlot: 'tarde',
      title: 'Bloque Baja Prioridad',
      priority: 'baja',
      completed: false,
      dayOfWeek: 1,
    });

    render(<PlannerView profileId={profileId} />);

    expect(screen.getByText('Bloque Alta Prioridad')).toBeInTheDocument();
    expect(screen.getByText('Bloque Baja Prioridad')).toBeInTheDocument();

    const altaPill = screen.getByRole('button', { name: /prioridad alta/i });
    await user.click(altaPill);

    expect(screen.getByText('Bloque Alta Prioridad')).toBeInTheDocument();
    expect(screen.queryByText('Bloque Baja Prioridad')).not.toBeInTheDocument();

    const todasPill = screen.getByRole('button', { name: /todas las prioridades/i });
    await user.click(todasPill);

    expect(screen.getByText('Bloque Alta Prioridad')).toBeInTheDocument();
    expect(screen.getByText('Bloque Baja Prioridad')).toBeInTheDocument();
  });

  it('renderiza la cabecera focus plan, filtros de area, rejilla semanal de 7 columnas y top priorities con clip', () => {
    render(<PlannerView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 1, name: /focus plan & agenda semanal\./i })).toBeInTheDocument();
    expect(screen.getByText(/01\. estudios & clase b/i)).toBeInTheDocument();
    expect(screen.getByText(/top priorities de la semana/i)).toBeInTheDocument();
    expect(screen.getByText(/habit tracker semanal/i)).toBeInTheDocument();
    expect(screen.getByText(/discipline today, peace tomorrow/i)).toBeInTheDocument();
  });
});

