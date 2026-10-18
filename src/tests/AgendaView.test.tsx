import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { AgendaView } from '../components/AgendaView';
import { WEEK_DAYS } from '../components/agenda/eventMapping';
import { SAVE_ERROR } from '../components/agenda/eventPersistence';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import type { AgendaEvent } from '../types';

const profileId = 'p-agenda';
const today = toLocalDateStr(new Date());
const dayList = () => within(screen.getByRole('list', { name: /eventos del día/i }));
const seed = (ev: Omit<AgendaEvent, 'profileId' | 'date'> & Partial<AgendaEvent>) =>
  StorageService.saveEvent({ profileId, date: today, ...ev });

describe('AgendaView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renderiza el almanaque de mesa con formato imprenta, dia hoy con chips apilados y panel diario con clip', () => {
    render(<AgendaView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 1, name: /octubre 2026/i })).toBeInTheDocument();
    expect(screen.getByText(/almanaque de mesa/i)).toBeInTheDocument();
    expect(screen.getByText(/formato imprenta/i)).toBeInTheDocument();
    expect(screen.getByText(/agenda diaria/i)).toBeInTheDocument();
    expect(screen.getByText(/energy & mood rhythm tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/the weekly flow & quick capture/i)).toBeInTheDocument();
  });

  // Técnica: partición de equivalencia sobre datos de entrada (perfil propio, ajeno, esquema viejo).
  it('muestra en el panel del día los eventos del perfil activo', () => {
    seed({ id: 'e1', title: 'Clase de conducción', startTime: '09:00', endTime: '10:00', category: 'estudio' });
    render(<AgendaView profileId={profileId} />);

    expect(screen.getByRole('heading', { name: /agenda de eventos/i })).toBeInTheDocument();
    expect(dayList().getByText('Clase de conducción')).toBeInTheDocument();
    expect(dayList().getByText('09:00–10:00 · Estudio')).toBeInTheDocument();
  });

  it('no mezcla eventos entre perfiles', () => {
    seed({ id: 'e1', title: 'Evento propio', startTime: '09:00' });
    StorageService.saveEvent({ id: 'e2', profileId: 'p-otro', title: 'Evento ajeno', date: today, startTime: '09:00' });
    render(<AgendaView profileId={profileId} />);

    expect(dayList().getByText('Evento propio')).toBeInTheDocument();
    expect(screen.queryByText('Evento ajeno')).not.toBeInTheDocument();
  });

  it('remonta al cambiar de perfil y muestra solo los eventos del nuevo', () => {
    seed({ id: 'e1', title: 'Del primero', startTime: '09:00' });
    StorageService.saveEvent({ id: 'e2', profileId: 'p-dos', title: 'Del segundo', date: today, startTime: '09:00' });
    const { rerender } = render(<AgendaView profileId={profileId} />);
    rerender(<AgendaView profileId="p-dos" />);

    expect(dayList().getByText('Del segundo')).toBeInTheDocument();
    expect(screen.queryByText('Del primero')).not.toBeInTheDocument();
  });

  it('muestra un evento del esquema viejo (sin endTime ni categoría) con 1 h y categoría personal', () => {
    seed({ id: 'old', title: 'Evento antiguo', startTime: '13:00' });
    render(<AgendaView profileId={profileId} />);

    expect(dayList().getByText('13:00–14:00 · Personal')).toBeInTheDocument();
  });

  it('crea un evento desde el formulario y lo persiste', async () => {
    const success = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'Reunión de coordinación');
    await user.click(screen.getByRole('button', { name: /agregar evento/i }));

    expect(dayList().getByText('Reunión de coordinación')).toBeInTheDocument();
    expect(StorageService.getEvents(profileId)).toEqual([
      expect.objectContaining({
        title: 'Reunión de coordinación',
        date: today,
        startTime: '09:00',
        endTime: '10:00',
        category: 'personal',
      }),
    ]);
    expect(success).toHaveBeenCalledWith({ title: 'Evento agendado con éxito' });
  });

  it('edita un evento existente conservando su id', async () => {
    seed({ id: 'e-edit', title: 'Borrador', startTime: '09:00', endTime: '10:00' });
    const success = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /editar borrador/i }));
    const title = screen.getByPlaceholderText(/título del evento/i);
    await user.clear(title);
    await user.type(title, 'Versión final');
    fireEvent.change(screen.getByLabelText(/hora de término/i), { target: { value: '11:00' } });
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(StorageService.getEvents(profileId)).toEqual([
      expect.objectContaining({ id: 'e-edit', title: 'Versión final', endTime: '11:00' }),
    ]);
    expect(success).toHaveBeenCalledWith({ title: 'Evento actualizado' });
  });

  it('avisa que editar una serie afecta todas las repeticiones', async () => {
    seed({ id: 'r1', title: 'Serie', startTime: '18:00', endTime: '19:00', recurrence: { daysOfWeek: [new Date().getDay()] } });
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /editar serie/i }));
    expect(screen.getByText('Los cambios se aplican a todas las repeticiones.')).toBeInTheDocument();
  });

  it('elimina un evento', async () => {
    seed({ id: 'e-del', title: 'Almuerzo de trabajo', startTime: '13:00', category: 'trabajo' });
    const success = vi.spyOn(sileo, 'success');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /eliminar almuerzo de trabajo/i }));

    expect(screen.queryByText('Almuerzo de trabajo')).not.toBeInTheDocument();
    expect(StorageService.getEvents(profileId)).toEqual([]);
    expect(success).toHaveBeenCalledWith({ title: 'Evento eliminado' });
  });

  // Técnica: partición de equivalencia sobre horas inválidas.
  it('rechaza un término anterior al inicio sin guardar', async () => {
    const error = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'Mal horario');
    fireEvent.change(screen.getByLabelText(/hora de inicio/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/hora de término/i), { target: { value: '09:00' } });
    await user.click(screen.getByRole('button', { name: /agregar evento/i }));

    expect(error).toHaveBeenCalledWith({ title: 'La hora de término debe ser posterior a la de inicio' });
    expect(StorageService.getEvents(profileId)).toEqual([]);
  });

  it('crea un evento recurrente semanal que aparece hoy', async () => {
    const user = userEvent.setup();
    const todayDow = new Date().getDay();
    const dayName = WEEK_DAYS.find(d => d.value === todayDow)!.long;
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'Gimnasio');
    await user.click(screen.getByRole('checkbox', { name: /repetir semanalmente/i }));
    await user.click(screen.getByRole('checkbox', { name: dayName }));
    await user.click(screen.getByRole('button', { name: /agregar evento/i }));

    expect(StorageService.getEvents(profileId)[0].recurrence).toEqual({ daysOfWeek: [todayDow] });
    expect(dayList().getByText('Gimnasio')).toBeInTheDocument();
  });

  it('filtra por categoría y expone el contador en el nombre accesible', async () => {
    seed({ id: 't1', title: 'Informe', startTime: '09:00', category: 'trabajo' });
    seed({ id: 't2', title: 'Reunión equipo', startTime: '10:00', category: 'trabajo' });
    seed({ id: 'p1', title: 'Cine', startTime: '20:00', category: 'personal' });
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    expect(screen.getByRole('button', { name: 'Todas, 3 eventos' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Personal, 1 evento' }));

    expect(screen.getByRole('button', { name: 'Personal, 1 evento' })).toHaveAttribute('aria-pressed', 'true');
    expect(dayList().getByText('Cine')).toBeInTheDocument();
    expect(dayList().queryByText('Informe')).not.toBeInTheDocument();
  });

  it('muestra error y no deja la vista en blanco si el almacenamiento está lleno', async () => {
    vi.spyOn(StorageService, 'saveEvent').mockImplementation(() => {
      throw new DOMException('lleno', 'QuotaExceededError');
    });
    const error = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'No cabe');
    await user.click(screen.getByRole('button', { name: /agregar evento/i }));

    expect(error).toHaveBeenCalledWith({ title: SAVE_ERROR });
    expect(screen.getByRole('heading', { name: /agenda de eventos/i })).toBeInTheDocument();
    expect(screen.getByText(/sin eventos programados/i)).toBeInTheDocument();
  });

  // Revisión final, Important #1. Técnica: tabla de decisión (único/serie × confirma/cancela).
  it('pide confirmación antes de borrar una serie y no borra si se cancela', async () => {
    seed({ id: 'r-del', title: 'Gimnasio', startTime: '20:00', recurrence: { daysOfWeek: [new Date().getDay()] } });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /eliminar serie gimnasio/i }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(StorageService.getEvents(profileId)).toHaveLength(1);

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: /eliminar serie gimnasio/i }));
    expect(StorageService.getEvents(profileId)).toEqual([]);
  });

  it('no pide confirmación para borrar un evento único', async () => {
    seed({ id: 'e-one', title: 'Único', startTime: '09:00' });
    const confirm = vi.spyOn(window, 'confirm');
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /eliminar único/i }));
    expect(confirm).not.toHaveBeenCalled();
    expect(StorageService.getEvents(profileId)).toEqual([]);
  });

  // Revisión final, Important #3. Técnica: partición de equivalencia (formulario nuevo / en edición / fecha incompleta).
  it('cambiar de día conserva lo escrito en un formulario nuevo', async () => {
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.type(screen.getByPlaceholderText(/título del evento/i), 'Mi borrador');
    fireEvent.change(screen.getByLabelText(/ir a fecha/i), { target: { value: '2026-12-25' } });

    expect(screen.getByRole('heading', { name: /nuevo evento para 2026-12-25/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/título del evento/i)).toHaveValue('Mi borrador');
  });

  it('cambiar de día no descarta una edición en curso', async () => {
    seed({ id: 'e-keep', title: 'Borrador', startTime: '09:00', endTime: '10:00' });
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /editar borrador/i }));
    fireEvent.change(screen.getByLabelText(/ir a fecha/i), { target: { value: '2026-12-25' } });

    expect(screen.getByRole('heading', { name: /eventos del 2026-12-25/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/título del evento/i)).toHaveValue('Borrador');
  });

  it('ignora fechas con año incompleto mientras se escribe en ir a fecha', () => {
    render(<AgendaView profileId={profileId} />);

    fireEvent.change(screen.getByLabelText(/ir a fecha/i), { target: { value: '0002-12-25' } });

    expect(screen.getByRole('heading', { name: new RegExp(`eventos del ${today}`, 'i') })).toBeInTheDocument();
  });

  it('ir a fecha cambia el día del panel y del formulario', () => {
    render(<AgendaView profileId={profileId} />);

    fireEvent.change(screen.getByLabelText(/ir a fecha/i), { target: { value: '2026-12-25' } });

    expect(screen.getByRole('heading', { name: /eventos del 2026-12-25/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nuevo evento para 2026-12-25/i })).toBeInTheDocument();
  });

  it('incluye regla milimetrada de latón y muescas de ticket recortable en la agenda', () => {
    seed({ id: 'e-ticket', title: 'Entrada concierto', startTime: '20:00' });
    const { container } = render(<AgendaView profileId={profileId} />);

    const ruler = container.querySelector('[class*="brassRulerBar"]');
    expect(ruler).toBeInTheDocument();
    expect(ruler).toHaveAttribute('aria-hidden', 'true');

    const topNotch = container.querySelector('[class*="ticketNotchTop"]');
    expect(topNotch).toBeInTheDocument();
    expect(topNotch).toHaveAttribute('aria-hidden', 'true');

    const perforation = container.querySelector('[class*="ticketPerforationLine"]');
    expect(perforation).toBeInTheDocument();
    expect(perforation).toHaveAttribute('aria-hidden', 'true');
  });
});

