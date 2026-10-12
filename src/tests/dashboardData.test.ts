import { describe, it, expect } from 'vitest';
import { criticalTodos, dueLabel, greetingFor, isCritical, todayEventsSorted, computeAreaSummaries } from '../components/dashboard/dashboardData';
import type { AgendaEvent, TodoItem } from '../types';

describe('greetingFor', () => {
  // Técnica: valores límite en los cortes 05:00, 12:00 y 20:00.
  it.each([
    [0, 0, 'Buenas noches'],
    [4, 59, 'Buenas noches'],
    [5, 0, 'Buen día'],
    [11, 59, 'Buen día'],
    [12, 0, 'Buenas tardes'],
    [19, 59, 'Buenas tardes'],
    [20, 0, 'Buenas noches'],
  ])('%i:%i → %s', (h, m, expected) => {
    expect(greetingFor(new Date(2026, 9, 10, h, m))).toBe(expected);
  });
});

const ev = (patch: Partial<AgendaEvent> & Pick<AgendaEvent, 'id' | 'title'>): AgendaEvent => ({
  profileId: 'p',
  date: '2026-10-14',
  ...patch,
});

describe('todayEventsSorted', () => {
  // Técnica: partición de equivalencia (único de hoy, serie de hoy, otro día, todo el día) + límite.
  it('filtra hoy, incluye series, pone todo el día primero y ordena por hora', () => {
    const events = [
      ev({ id: 'b', title: 'Once', startTime: '11:00' }),
      ev({ id: 'a', title: 'Nueve', startTime: '09:00' }),
      ev({ id: 'x', title: 'Otro día', date: '2026-10-15', startTime: '08:00' }),
      ev({ id: 'd', title: 'Todo el día' }),
      ev({ id: 's', title: 'Serie', date: '2026-10-07', startTime: '20:00', recurrence: { daysOfWeek: [3] } }),
    ];
    expect(todayEventsSorted(events, '2026-10-14').map(e => e.id)).toEqual(['d', 'a', 'b', 's']);
  });

  it('respeta el límite', () => {
    const events = ['06', '07', '08', '09', '10'].map(h => ev({ id: h, title: h, startTime: `${h}:00` }));
    expect(todayEventsSorted(events, '2026-10-14')).toHaveLength(4);
  });
});

const todo = (patch: Partial<TodoItem> & Pick<TodoItem, 'id'>): TodoItem => {
  const statusDefault = patch.completed ? 'completada' : 'pendiente';
  const { areaId = 'area-1', status = statusDefault, ...rest } = patch;
  return {
    profileId: 'p',
    title: patch.id,
    areaId,
    category: 'General',
    priority: 'alta',
    status,
    completed: patch.completed ?? (status === 'completada'),
    createdAt: '2026-10-01',
    ...rest,
  };
};

describe('criticalTodos', () => {
  // Técnica: tabla de decisión (completada × prioridad × fecha).
  it('solo pendientes de prioridad alta', () => {
    const todos = [
      todo({ id: 'alta' }),
      todo({ id: 'media', priority: 'media' }),
      todo({ id: 'hecha', completed: true }),
    ];
    expect(criticalTodos(todos).map(t => t.id)).toEqual(['alta']);
    expect(isCritical(todos[0])).toBe(true);
    expect(isCritical(todos[2])).toBe(false);
  });

  it('considera tareas en_progreso de prioridad alta como críticas y excluye completadas con status', () => {
    const enProg = todo({ id: 'prog', status: 'en_progreso', completed: false });
    const comp = todo({ id: 'comp', status: 'completada', completed: true });
    expect(isCritical(enProg)).toBe(true);
    expect(isCritical(comp)).toBe(false);
  });

  it('ordena por dueDate ascendente y deja sin fecha al final', () => {
    const todos = [
      todo({ id: 'sin' }),
      todo({ id: 'tarde', dueDate: '2026-10-20' }),
      todo({ id: 'pronto', dueDate: '2026-10-12' }),
    ];
    expect(criticalTodos(todos).map(t => t.id)).toEqual(['pronto', 'tarde', 'sin']);
  });

  // Review Focus 1: sin interfaz de fechas, el orden de inserción se conserva.
  it('críticos sin fecha conservan el orden', () => {
    const todos = [todo({ id: 'uno' }), todo({ id: 'dos' }), todo({ id: 'tres' })];
    expect(criticalTodos(todos).map(t => t.id)).toEqual(['uno', 'dos', 'tres']);
  });

  it('respeta el límite', () => {
    const todos = ['a', 'b', 'c', 'd', 'e'].map(id => todo({ id }));
    expect(criticalTodos(todos)).toHaveLength(4);
  });
});

describe('dueLabel', () => {
  // Técnica: valores límite alrededor de hoy.
  it.each([
    [undefined, null],
    ['2026-10-09', 'Vencida'],
    ['2026-10-10', 'Hoy'],
    ['2026-10-11', 'Mañana'],
  ])('%s → %s', (due, expected) => {
    expect(dueLabel(due, '2026-10-10')).toBe(expected);
  });

  it('formatea fechas lejanas en corto es-CL', () => {
    expect(dueLabel('2026-10-17', '2026-10-10')).toMatch(/^17 oct/);
  });

  // Revisión final, Important 2: una fecha mal formada no debe romper la vista (RangeError) ni marcarse "Vencida".
  // Técnica: partición de equivalencia sobre formatos inválidos.
  it.each(['2026-10-18T03:00:00.000Z', '2026-1-5', 'mañana', '2026-13-40'])('devuelve null para la fecha mal formada %s', due => {
    expect(dueLabel(due, '2026-10-10')).toBeNull();
  });
});

describe('computeAreaSummaries', () => {
  it('calcula totales, pendientes y porcentaje de completitud por area', () => {
    const areas = [
      { id: 'a1', profileId: 'p1', name: 'Estudios', color: '#8b5cf6', createdAt: '' },
      { id: 'a2', profileId: 'p1', name: 'Personal', color: '#10b981', createdAt: '' },
      { id: 'a3', profileId: 'p1', name: 'Vacia', color: '#6b7280', createdAt: '' },
    ];
    const todos = [
      todo({ id: 't1', areaId: 'a1', priority: 'alta', status: 'completada', completed: true }),
      todo({ id: 't2', areaId: 'a1', priority: 'media', status: 'pendiente', completed: false }),
      todo({ id: 't3', areaId: 'a2', priority: 'baja', status: 'en_progreso', completed: false }),
    ];

    const summaries = computeAreaSummaries(areas, todos);

    expect(summaries).toHaveLength(3);
    // a1: 2 total, 1 pendiente, 50%
    expect(summaries[0].area.name).toBe('Estudios');
    expect(summaries[0].totalTodos).toBe(2);
    expect(summaries[0].pendingTodos).toBe(1);
    expect(summaries[0].completionPercentage).toBe(50);

    // a2: 1 total, 1 pendiente (en_progreso cuenta como no completada), 0%
    expect(summaries[1].area.name).toBe('Personal');
    expect(summaries[1].totalTodos).toBe(1);
    expect(summaries[1].pendingTodos).toBe(1);
    expect(summaries[1].completionPercentage).toBe(0);

    // a3: 0 total, 0 pendiente, 0% sin NaN
    expect(summaries[2].area.name).toBe('Vacia');
    expect(summaries[2].totalTodos).toBe(0);
    expect(summaries[2].pendingTodos).toBe(0);
    expect(summaries[2].completionPercentage).toBe(0);
  });
});
