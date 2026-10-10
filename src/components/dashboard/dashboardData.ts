import type { AgendaEvent, TodoItem } from '../../types';
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

export const isCritical = (todo: TodoItem): boolean =>
  (todo.status !== undefined ? todo.status !== 'completada' : !todo.completed) && todo.priority === 'alta';

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
