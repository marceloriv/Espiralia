import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { AgendaView } from '../components/AgendaView';
import { WEEK_DAYS, occursOn } from '../components/agenda/eventMapping';
import { SAVE_ERROR } from '../components/agenda/eventPersistence';
import { StorageService } from '../services/storage';
import { addDaysToDateStr, toLocalDateStr } from '../utils/localDate';
import { downloadFile } from '../utils/downloadFile';
import type { AgendaEvent } from '../types';
import { simularConfirmacion } from './confirmacion';

vi.mock('../utils/downloadFile', () => ({ downloadFile: vi.fn() }));

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

  it('renderiza el almanaque de mesa, la agenda diaria y el ritmo de energía en español', () => {
    // El título es el mes en curso: sin reloj fijo, el test caducaba al terminar octubre.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15));
    try {
      render(<AgendaView profileId={profileId} />);
    } finally {
      vi.useRealTimers();
    }

    expect(screen.getByRole('heading', { level: 1, name: /octubre 2026/i })).toBeInTheDocument();
    expect(screen.getByText(/almanaque de mesa/i)).toBeInTheDocument();
    expect(screen.queryByText(/formato imprenta/i)).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /eventos del/i })).toBeInTheDocument();
    // La insignia "Agenda Diaria" repetía el titular del resumen (R-09).
    expect(screen.queryByText(/agenda diaria/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ritmo de energía y ánimo/i)).toBeInTheDocument();
    expect(screen.queryByText(/energy & mood/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/the weekly flow/i)).not.toBeInTheDocument();
  });

  describe('exportación, leyenda y ritmo del día', () => {
    it('"Exportar .ics" descarga los eventos visibles', async () => {
      const user = userEvent.setup();
      seed({ id: 'e-ics', title: 'Reunión de tesis', startTime: '10:00', endTime: '11:00', category: 'universidad' });
      render(<AgendaView profileId={profileId} />);

      await user.click(screen.getByRole('button', { name: /exportar \.ics/i }));

      expect(downloadFile).toHaveBeenCalledTimes(1);
      const [contenido, nombre, tipo] = vi.mocked(downloadFile).mock.calls[0];
      expect(contenido).toContain('SUMMARY:Reunión de tesis');
      expect(nombre).toMatch(/\.ics$/);
      expect(tipo).toMatch(/text\/calendar/);
    });

    it('la leyenda nombra las cinco categorías de evento', () => {
      render(<AgendaView profileId={profileId} />);

      const leyenda = within(screen.getByRole('group', { name: /colores por categoría/i }));
      for (const nombre of ['Trabajo', 'Personal', 'Urgente', 'Estudio', 'Universidad']) {
        expect(leyenda.getByText(nombre)).toBeInTheDocument();
      }
      expect(screen.queryByText('Trámites')).not.toBeInTheDocument();
    });

    it('la energía y el ánimo elegidos se guardan y siguen al volver a la vista', async () => {
      const user = userEvent.setup();
      const energia = () => within(screen.getByRole('group', { name: /nivel de energía/i }));
      const animo = () => within(screen.getByRole('group', { name: /disposición emocional/i }));
      const { unmount } = render(<AgendaView profileId={profileId} />);

      await user.click(energia().getByRole('button', { name: /plena/i }));
      await user.click(animo().getByRole('button', { name: /cansada/i }));
      unmount();
      render(<AgendaView profileId={profileId} />);

      expect(energia().getByRole('button', { name: /plena/i })).toHaveAttribute('aria-pressed', 'true');
      expect(animo().getByRole('button', { name: /cansada/i })).toHaveAttribute('aria-pressed', 'true');
      expect(StorageService.getTodayMood(profileId, today)).toBe('☀️');
      expect(StorageService.getTodayDisposition(profileId, today)).toBe('cansada');
    });
  });

  // DESIGN.md §0.9, paso 4: el almanaque es el pliego; el resumen del día, un papel pizarra; formulario y ritmo, cartulina.
  describe('materiales de papel', () => {
    it('el almanaque va en un pliego con anillas, sin la regla de latón ni el acento de encuadernación', () => {
      const { container } = render(<AgendaView profileId={profileId} />);

      expect(container.querySelector('[class*="calendarCard"] [class*="ringsLeft"]')).toBeInTheDocument();
      for (const clase of ['brassRuler', 'rulerMarks', 'bindingAccent', 'bindingRivet']) {
        expect(container.querySelector(`[class*="${clase}"]`), clase).not.toBeInTheDocument();
      }
    });

    it('el resumen del día es un papel pizarra con su titular', () => {
      render(<AgendaView profileId={profileId} />);

      const resumen = screen.getByRole('region', { name: /eventos del/i });
      expect(resumen.querySelector('[data-tinte="pizarra"][data-forma="tarjeta"]')).toBeInTheDocument();
    });

    it('la semana ISO y el contador de eventos del día son piezas de papel pizarra', () => {
      render(<AgendaView profileId={profileId} />);

      // El contador decía "Prioritarias" aunque contaba todos los eventos del día.
      expect(screen.queryByText(/prioritarias?$/i)).not.toBeInTheDocument();
      for (const pieza of [screen.getByText(/^semana \d+$/i), screen.getByText(/^\d+ eventos?$/i)]) {
        expect(pieza.closest('[data-forma="pieza"][data-tinte="pizarra"]')).not.toBeNull();
      }
    });

    it('queda un solo clip y lo lleva la nota del día; sin cinta washi ni muescas de boleto', () => {
      seed({ id: 'e1', title: 'Clase', startTime: '09:00' });
      const { container } = render(<AgendaView profileId={profileId} />);

      const clips = container.querySelectorAll('[class*="goldenMetalClip"]');
      expect(clips).toHaveLength(1);
      expect(clips[0].closest('[class*="motivationalPostIt"]')).not.toBeNull();
      for (const clase of ['postItWashi', 'ticketNotch', 'ticketPerforation']) {
        expect(container.querySelector(`[class*="${clase}"]`), clase).not.toBeInTheDocument();
      }
    });

    it('el formulario y el ritmo de energía son cartulina lisa, sin tinte de papel', () => {
      render(<AgendaView profileId={profileId} />);

      const formulario = screen.getByRole('form', { name: /nuevo evento/i });
      const ritmo = screen.getByText(/ritmo de energía y ánimo/i).closest('[class*="rhythmCard"]');
      expect(formulario.closest('[data-tinte]')).toBeNull();
      expect(ritmo).not.toBeNull();
      expect(ritmo?.closest('[data-tinte]')).toBeNull();
    });

    it('no inventa un recordatorio que la persona no escribió ni un número de cuaderno', () => {
      render(<AgendaView profileId={profileId} />);

      expect(screen.queryByText(/comprar papel kraft/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cuaderno #04|tomo primavera/i)).not.toBeInTheDocument();
    });
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

  // La Acción Rápida guardaba 'salud' y 'general'; con ese evento en el día la Agenda caía a "Algo salió mal".
  it('muestra como personal un evento guardado con una categoría que la Agenda no conoce', () => {
    seed({ id: 'qa-salud', title: 'Control médico', startTime: '10:00', endTime: '11:00', category: 'salud' as unknown as AgendaEvent['category'] });
    render(<AgendaView profileId={profileId} />);

    expect(dayList().getByText('10:00–11:00 · Personal')).toBeInTheDocument();
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
    const confirm = simularConfirmacion(false);
    const user = userEvent.setup();
    render(<AgendaView profileId={profileId} />);

    await user.click(screen.getByRole('button', { name: /eliminar serie gimnasio/i }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(StorageService.getEvents(profileId)).toHaveLength(1);

    simularConfirmacion(true);
    await user.click(screen.getByRole('button', { name: /eliminar serie gimnasio/i }));
    expect(StorageService.getEvents(profileId)).toEqual([]);
  });

  // Antes una serie solo se editaba o borraba entera.
  describe('un solo día de una serie', () => {
    const hoy = toLocalDateStr(new Date());
    const seedSerie = () => seed({ id: 'r-dia', title: 'Natación', startTime: '07:00', endTime: '08:00', recurrence: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] } });

    it('"Quitar este día" deja el resto de la serie', async () => {
      seedSerie();
      simularConfirmacion(true);
      const user = userEvent.setup();
      render(<AgendaView profileId={profileId} />);

      await user.click(screen.getByRole('button', { name: new RegExp(`quitar natación del ${hoy}`, 'i') }));

      const eventos = StorageService.getEvents(profileId);
      expect(eventos.some(ev => occursOn(ev, hoy))).toBe(false);
      expect(eventos.some(ev => occursOn(ev, addDaysToDateStr(hoy, 1)))).toBe(true);
    });

    it('"Cambiar solo este día" guarda un evento suelto y quita ese día de la serie', async () => {
      seedSerie();
      const user = userEvent.setup();
      render(<AgendaView profileId={profileId} />);

      await user.click(screen.getByRole('button', { name: /editar natación/i }));
      await user.click(screen.getByRole('checkbox', { name: /cambiar solo el/i }));
      const titulo = screen.getByPlaceholderText(/título del evento/i);
      await user.clear(titulo);
      await user.type(titulo, 'Natación libre');
      await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

      const eventos = StorageService.getEvents(profileId);
      const deHoy = eventos.filter(ev => occursOn(ev, hoy));
      expect(deHoy.map(ev => [ev.title, Boolean(ev.recurrence)])).toEqual([['Natación libre', false]]);
      expect(eventos.some(ev => ev.recurrence && occursOn(ev, addDaysToDateStr(hoy, 1)))).toBe(true);
    });
  });

  it('no pide confirmación para borrar un evento único', async () => {
    seed({ id: 'e-one', title: 'Único', startTime: '09:00' });
    const confirm = vi.spyOn(sileo, 'action');
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
});

