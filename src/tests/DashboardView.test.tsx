import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardView } from '../components/DashboardView';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import type { Profile, TodoItem } from '../types';

const profile: Profile = { id: 'p-dash', name: 'Andrés', avatar: 'A', createdAt: '2026-10-09' };

const saveTodo = (patch: Partial<TodoItem> & Pick<TodoItem, 'id' | 'title'>) => {
  const statusDefault = patch.completed ? 'completada' : 'pendiente';
  const { areaId = 'area-1', status = statusDefault, ...rest } = patch;
  return StorageService.saveTodo({
    profileId: profile.id,
    areaId,
    category: 'General',
    priority: 'alta',
    status,
    completed: patch.completed ?? (status === 'completada'),
    createdAt: '2026-10-09',
    ...rest,
  });
};

const renderDashboard = (onNavigate = vi.fn()) => {
  render(<DashboardView profile={profile} onNavigate={onNavigate} />);
  return onNavigate;
};

describe('DashboardView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Técnica: valor límite representativo (09:00 cae en "Buen día").
  it('saluda según la hora y muestra los chips de resumen', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 10, 9, 0));
    saveTodo({ id: 't1', title: 'Crítica uno' });
    saveTodo({ id: 't2', title: 'Crítica dos' });
    saveTodo({ id: 't3', title: 'Normal', priority: 'media' });
    saveTodo({ id: 't4', title: 'Hecha', completed: true });

    renderDashboard();

    expect(screen.getByRole('heading', { level: 2, name: 'Buen día, Andrés.' })).toBeInTheDocument();
    const heroDate = screen.getByText(/octubre/i);
    expect(heroDate.textContent).not.toMatch(/De Octubre/);
    const chips = within(screen.getByRole('list', { name: /resumen/i }));
    expect(chips.getByText('3 pendientes')).toBeInTheDocument();
    expect(chips.getByText('2 críticos')).toBeInTheDocument();
  });

  it('los atajos llevan a To-Do y a Agenda', async () => {
    const user = userEvent.setup();
    const onNavigate = renderDashboard();

    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));
    await user.click(screen.getByRole('button', { name: /nuevo evento/i }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'todo');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'agenda');
  });

  // Técnica: partición de equivalencia (con hora, serie de hoy, otro perfil).
  it('lista los eventos de hoy ordenados, con badge de categoría e incluyendo series', () => {
    const today = toLocalDateStr(new Date());
    StorageService.saveEvent({ id: 'e2', profileId: profile.id, title: 'Reunión', date: today, startTime: '11:00', category: 'trabajo' });
    StorageService.saveEvent({ id: 'e1', profileId: profile.id, title: 'Clase', date: today, startTime: '09:00', category: 'estudio' });
    StorageService.saveEvent({
      id: 's1',
      profileId: profile.id,
      title: 'Gimnasio',
      date: today,
      startTime: '20:00',
      recurrence: { daysOfWeek: [new Date().getDay()] },
    });
    StorageService.saveEvent({ id: 'o1', profileId: 'p-otro', title: 'Ajeno', date: today, startTime: '10:00' });

    renderDashboard();

    const list = within(screen.getByRole('list', { name: /eventos de hoy/i }));
    expect(list.getAllByRole('listitem').map(li => li.textContent)).toEqual([
      expect.stringContaining('Clase'),
      expect.stringContaining('Reunión'),
      expect.stringContaining('Gimnasio'),
    ]);
    expect(list.getByText('Estudio')).toBeInTheDocument();
    expect(screen.queryByText('Ajeno')).not.toBeInTheDocument();
  });

  // Review Focus 5.
  it('muestra solo críticos y completar uno lo persiste y lo saca de la lista', async () => {
    const user = userEvent.setup();
    saveTodo({ id: 'c1', title: 'Pagar arriendo' });
    saveTodo({ id: 'n1', title: 'Leer', priority: 'media' });

    renderDashboard();

    const critical = within(screen.getByRole('list', { name: /no olvidar/i }));
    expect(critical.getByText('Pagar arriendo')).toBeInTheDocument();
    expect(critical.queryByText('Leer')).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /completar pagar arriendo/i }));

    expect(StorageService.getTodos(profile.id).find(t => t.id === 'c1')?.completed).toBe(true);
    expect(screen.getByText('Nada crítico pendiente')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: /resumen/i })).getByText('0 críticos')).toBeInTheDocument();
  });

  it('muestra el planner semanal y los empty states', () => {
    StorageService.savePlanner({
      id: 'b1',
      profileId: profile.id,
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Bloque de foco',
      priority: 'alta',
      completed: false,
    });

    renderDashboard();

    expect(within(screen.getByRole('list', { name: /planner/i })).getByText('Bloque de foco')).toBeInTheDocument();
    expect(screen.getByText('No hay eventos para hoy')).toBeInTheDocument();
    expect(screen.getByText('Nada crítico pendiente')).toBeInTheDocument();
  });

  // Revisión final, Minor 1 re-graduado: el contador cuenta todos los bloques semanales, la lista muestra 4.
  // Técnica: valor límite (6 > tope de 4).
  it('cuenta todos los bloques semanales aunque liste solo 4', () => {
    for (let i = 1; i <= 6; i++) {
      StorageService.savePlanner({
        id: `b${i}`,
        profileId: profile.id,
        period: 'semanal',
        timeSlot: 'mañana',
        title: `Bloque ${i}`,
        priority: 'media',
        completed: false,
      });
    }

    renderDashboard();

    expect(screen.getByText('6 bloques')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: /planner/i })).getAllByRole('listitem')).toHaveLength(4);
  });

  it('hidrata los datos de almacenamiento sincronicamente en el render inicial sin flash vacio', () => {
    saveTodo({ id: 't-sync', title: 'Verificacion sincrona CLS' });
    const { container } = render(<DashboardView profile={profile} onNavigate={vi.fn()} />);
    expect(container.textContent).toContain('Verificacion sincrona CLS');
  });

  it('conserva la sección de métricas con ambos gráficos', () => {
    saveTodo({ id: 't-chart', title: 'Tarea con métrica', category: 'Trabajo', completed: true });

    renderDashboard();

    expect(screen.getByRole('heading', { name: /métricas y rendimiento/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/cumplimiento de tareas: 1 de 1 completadas \(100%\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/distribución de actividades por categoría/i)).toBeInTheDocument();
  });

  it('muestra la sección de áreas temáticas clave con sus tarjetas y progreso', () => {
    const areas = StorageService.getAreas(profile.id);
    const estudiosArea = areas.find(a => a.name === 'Estudios')!;
    saveTodo({ id: 't-area-1', title: 'Tarea de estudio', areaId: estudiosArea.id, completed: false });
    saveTodo({ id: 't-area-2', title: 'Tarea completada', areaId: estudiosArea.id, completed: true });

    renderDashboard();

    const areasSection = screen.getByRole('region', { name: /áreas temáticas clave/i });
    expect(within(areasSection).getByText('Estudios')).toBeInTheDocument();
    expect(within(areasSection).getByText('50%')).toBeInTheDocument();
    expect(within(areasSection).getByText('1 pendiente')).toBeInTheDocument();
  });

  it('no muestra bloques de features no implementadas', () => {
    renderDashboard();
    for (const label of [/documentos confidenciales/i, /cifrado cuántico/i]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});
