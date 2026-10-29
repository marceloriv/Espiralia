import type { AgendaEvent, TodoItem, Area, HabitTrackerItem, PlannerBlock, DayOfWeek } from '../../types';
import { occursOn } from '../agenda/eventMapping';
import { addDaysToDateStr, toLocalDateStr } from '../../utils/localDate';

export type Greeting = 'Buen día' | 'Buenas tardes' | 'Buenas noches';

export const greetingFor = (date: Date): Greeting => {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Buen día';
  if (h >= 12 && h < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

/** Eventos que ocurren hoy (incluidas series): todo el día primero ('' < 'HH:mm'), luego por hora. */
export const todayEventsSorted = (events: AgendaEvent[], todayStr: string, limit = 4): AgendaEvent[] =>
  events
    .filter(e => occursOn(e, todayStr))
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    .slice(0, limit);

/** Próxima ocurrencia de cada evento desde hoy (las series, dentro de 7 días), con `date` = esa ocurrencia. */
export const upcomingOccurrences = (events: AgendaEvent[], todayStr: string, limit = 3): AgendaEvent[] =>
  events
    .flatMap(e => {
      if (!e.recurrence) return e.date >= todayStr ? [e] : [];
      for (let i = 0; i < 7; i++) {
        const date = addDaysToDateStr(todayStr, i);
        if (occursOn(e, date)) return [{ ...e, date }];
      }
      return [];
    })
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    .slice(0, limit);

export const isCritical =(todo: TodoItem): boolean =>
  !todo.completed && (todo.status !== undefined ? todo.status !== 'completada' : true) && todo.priority === 'alta';

/** Críticos por vencimiento ascendente; sin fecha al final, en orden de inserción (sort estable). */
export const criticalTodos = (todos: TodoItem[], limit = 4): TodoItem[] =>
  todos
    .filter(isCritical)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    })
    .slice(0, limit);

const shortDateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });

export const dueLabel = (dueDate: string | undefined, todayStr: string): string | null => {
  if (!dueDate) return null;
  const [y, m, d] = dueDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // Solo YYYY-MM-DD de calendario real: lo demás no se compara como texto ni rompe el formateador.
  if (Number.isNaN(date.getTime()) || toLocalDateStr(date) !== dueDate) return null;
  if (dueDate < todayStr) return 'Vencida';
  if (dueDate === todayStr) return 'Hoy';
  if (dueDate === addDaysToDateStr(todayStr, 1)) return 'Mañana';
  return shortDateFormatter.format(date);
};

export interface AreaSummary {
  area: Area;
  totalTodos: number;
  pendingTodos: number;
  completionPercentage: number;
}

export const computeAreaSummaries = (areas: Area[], todos: TodoItem[]): AreaSummary[] =>
  areas.map(area => {
    const areaTodos = todos.filter(t => t.areaId === area.id);
    const totalTodos = areaTodos.length;
    const completedTodos = areaTodos.filter(t => t.completed || t.status === 'completada').length;
    const pendingTodos = totalTodos - completedTodos;
    const completionPercentage = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100);
    return {
      area,
      totalTodos,
      pendingTodos,
      completionPercentage,
    };
  });

/**
 * Racha de hábitos: días consecutivos con al menos un hábito marcado como cumplido hasta el día actual de la semana.
 * @param habits Lista de hábitos del perfil
 * @param todayHabitIdx Índice del día actual (0=Lunes, 6=Domingo)
 */
export const computeHabitStreak = (habits: HabitTrackerItem[], todayHabitIdx: number): number => {
  if (habits.length === 0) return 0;

  const isDayDone = (dayIdx: number) => habits.some(h => Boolean(h.daysCompleted?.[dayIdx]));

  let streak = 0;
  let startIdx = todayHabitIdx;
  if (!isDayDone(todayHabitIdx)) {
    startIdx = todayHabitIdx - 1;
  }

  for (let i = startIdx; i >= 0; i--) {
    if (isDayDone(i)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export interface NetFocusResult {
  hours: number;
  count: number;
}

/**
 * Horas de foco neto hoy: suma de duración de eventos de hoy + 1.5h por cada bloque del planner de hoy.
 */
export const computeNetFocusHours = (
  events: AgendaEvent[],
  plannerBlocks: PlannerBlock[],
  todayStr: string,
  todayDayOfWeek: DayOfWeek
): NetFocusResult => {
  const todayEvents = events.filter(e => occursOn(e, todayStr));
  const todayBlocks = plannerBlocks.filter(b => b.dayOfWeek === todayDayOfWeek);

  let totalMinutes = 0;
  for (const ev of todayEvents) {
    if (ev.startTime && ev.endTime) {
      const [startH, startM] = ev.startTime.split(':').map(Number);
      const [endH, endM] = ev.endTime.split(':').map(Number);
      const diff = (endH * 60 + endM) - (startH * 60 + startM);
      totalMinutes += diff > 0 ? diff : 60;
    } else {
      totalMinutes += 60;
    }
  }

  totalMinutes += todayBlocks.length * 90;

  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  const count = todayEvents.length + todayBlocks.length;

  return { hours, count };
};

export interface TaskPerformanceResult {
  /** `null` cuando no hay tareas: un porcentaje sin base sería inventado. */
  percentage: number | null;
  completed: number;
  total: number;
}

/**
 * Rendimiento de tareas: porcentaje global de tareas completadas del perfil y conteos.
 */
export const computeTaskPerformance = (todos: TodoItem[]): TaskPerformanceResult => {
  const total = todos.length;
  if (total === 0) {
    return { percentage: null, completed: 0, total: 0 };
  }
  const completed = todos.filter(t => t.completed || t.status === 'completada').length;
  const percentage = Math.round((completed / total) * 100);
  return { percentage, completed, total };
};

