import type { EventInput } from '@fullcalendar/react';
import type { AgendaEvent, EventCategory } from '../../types';
import { addDaysToDateStr, defaultEndTime, toLocalDateStr, toLocalTimeStr } from '../../utils/localDate';
import { DEFAULT_CATEGORY } from './eventForm';

export type CategoryFilter = EventCategory | 'todas';

export const CATEGORIES: EventCategory[] = ['trabajo', 'personal', 'urgente', 'estudio'];
export const FILTERS: CategoryFilter[] = ['todas', ...CATEGORIES];
export const FILTER_LABELS: Record<CategoryFilter, string> = {
  todas: 'Todas',
  trabajo: 'Trabajo',
  personal: 'Personal',
  urgente: 'Urgente',
  estudio: 'Estudio',
};

// Contraste texto/fondo >= 4.5:1: ink sobre teal y amber; blanco sobre primary y error.
export const CATEGORY_COLORS: Record<EventCategory, { color: string; textColor: string }> = {
  trabajo: { color: 'var(--color-accent-teal)', textColor: 'var(--color-ink)' },
  personal: { color: 'var(--color-primary)', textColor: 'var(--color-on-primary)' },
  urgente: { color: 'var(--color-error)', textColor: 'var(--color-on-primary)' },
  estudio: { color: 'var(--color-accent-amber)', textColor: 'var(--color-ink)' },
};

export const WEEK_DAYS = [
  { value: 1, short: 'Lu', long: 'Lunes' },
  { value: 2, short: 'Ma', long: 'Martes' },
  { value: 3, short: 'Mi', long: 'Miércoles' },
  { value: 4, short: 'Ju', long: 'Jueves' },
  { value: 5, short: 'Vi', long: 'Viernes' },
  { value: 6, short: 'Sá', long: 'Sábado' },
  { value: 0, short: 'Do', long: 'Domingo' },
];

export const categoryOf = (ev: AgendaEvent): EventCategory => ev.category ?? DEFAULT_CATEGORY;

export const toCalendarEvent = (ev: AgendaEvent): EventInput => {
  const base = { id: ev.id, title: ev.title, ...CATEGORY_COLORS[categoryOf(ev)] };
  const endTime = ev.startTime ? (ev.endTime ?? defaultEndTime(ev.startTime)) : undefined;

  if (ev.recurrence) {
    return {
      ...base,
      daysOfWeek: ev.recurrence.daysOfWeek,
      startRecur: ev.date,
      // endRecur es exclusivo en FullCalendar; until es inclusivo en el modelo.
      ...(ev.recurrence.until ? { endRecur: addDaysToDateStr(ev.recurrence.until, 1) } : {}),
      ...(ev.startTime ? { startTime: ev.startTime, endTime } : { allDay: true }),
      editable: false,
    };
  }
  if (!ev.startTime) return { ...base, start: ev.date, allDay: true };
  return { ...base, start: `${ev.date}T${ev.startTime}`, end: `${ev.date}T${endTime}`, allDay: false };
};

/** Aplica un arrastre/redimensionado. Devuelve null si el resultado no cabe en un solo día. */
export const applyTimeChange = (
  ev: AgendaEvent,
  start: Date | null,
  end: Date | null,
  allDay: boolean,
): AgendaEvent | null => {
  if (!start) return null;
  const date = toLocalDateStr(start);

  if (allDay) {
    if (end && toLocalDateStr(end) !== addDaysToDateStr(date, 1)) return null;
    const next: AgendaEvent = { ...ev, date };
    delete next.startTime;
    delete next.endTime;
    return next;
  }

  const endDate = end ?? new Date(start.getTime() + 60 * 60 * 1000);
  if (toLocalDateStr(endDate) !== date) return null;
  return { ...ev, date, startTime: toLocalTimeStr(start), endTime: toLocalTimeStr(endDate) };
};

export const occursOn = (ev: AgendaEvent, dateStr: string): boolean => {
  if (!ev.recurrence) return ev.date === dateStr;
  if (dateStr < ev.date) return false;
  if (ev.recurrence.until && dateStr > ev.recurrence.until) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  return ev.recurrence.daysOfWeek.includes(new Date(y, m - 1, d).getDay());
};

export const countByCategory = (events: AgendaEvent[]): Record<CategoryFilter, number> => {
  const counts: Record<CategoryFilter, number> = { todas: events.length, trabajo: 0, personal: 0, urgente: 0, estudio: 0 };
  for (const ev of events) counts[categoryOf(ev)] += 1;
  return counts;
};
