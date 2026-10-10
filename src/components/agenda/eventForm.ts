import type { AgendaEvent, EventCategory, EventRecurrence } from '../../types';
import { defaultEndTime } from '../../utils/localDate';

export const MAX_TITLE_LENGTH = 120;
export const DEFAULT_CATEGORY: EventCategory = 'personal';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface EventFormState {
  editingId?: string;
  notes?: string;
  title: string;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  category: EventCategory;
  repeatWeekly: boolean;
  daysOfWeek: number[];
  until: string; // '' = sin término
}

export type EventFormResult = { ok: true; event: AgendaEvent } | { ok: false; error: string };

export const emptyEventForm = (date: string): EventFormState => ({
  title: '',
  date,
  allDay: false,
  startTime: '09:00',
  endTime: '10:00',
  category: DEFAULT_CATEGORY,
  repeatWeekly: false,
  daysOfWeek: [],
  until: '',
});

export const eventFormFromEvent = (ev: AgendaEvent): EventFormState => ({
  editingId: ev.id,
  notes: ev.notes,
  title: ev.title,
  date: ev.date,
  allDay: !ev.startTime,
  startTime: ev.startTime ?? '09:00',
  endTime: ev.endTime ?? (ev.startTime ? defaultEndTime(ev.startTime) : '10:00'),
  category: ev.category ?? DEFAULT_CATEGORY,
  repeatWeekly: Boolean(ev.recurrence),
  daysOfWeek: ev.recurrence?.daysOfWeek ?? [],
  until: ev.recurrence?.until ?? '',
});

/** Valida el formulario (frontera de input del usuario) y arma el AgendaEvent a guardar. */
export const validateEventForm = (
  form: EventFormState,
  profileId: string,
  newId: () => string = () => `e-${Date.now()}`,
): EventFormResult => {
  const title = form.title.trim();
  if (!title) return { ok: false, error: 'El título es obligatorio' };
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `El título no puede superar ${MAX_TITLE_LENGTH} caracteres` };
  }
  if (!DATE_RE.test(form.date)) return { ok: false, error: 'La fecha no es válida' };
  if (!form.allDay) {
    if (!TIME_RE.test(form.startTime) || !TIME_RE.test(form.endTime)) {
      return { ok: false, error: 'Las horas deben tener formato HH:mm' };
    }
    if (form.endTime <= form.startTime) {
      return { ok: false, error: 'La hora de término debe ser posterior a la de inicio' };
    }
  }

  let recurrence: EventRecurrence | undefined;
  if (form.repeatWeekly) {
    if (form.daysOfWeek.length === 0) return { ok: false, error: 'Elige al menos un día para repetir' };
    if (form.until && (!DATE_RE.test(form.until) || form.until < form.date)) {
      return { ok: false, error: 'La fecha de término de la repetición no puede ser anterior al inicio' };
    }
    recurrence = {
      daysOfWeek: [...form.daysOfWeek].sort((a, b) => a - b),
      ...(form.until ? { until: form.until } : {}),
    };
  }

  const event: AgendaEvent = { id: form.editingId ?? newId(), profileId, title, date: form.date, category: form.category };
  if (!form.allDay) {
    event.startTime = form.startTime;
    event.endTime = form.endTime;
  }
  if (form.notes) event.notes = form.notes;
  if (recurrence) event.recurrence = recurrence;
  return { ok: true, event };
};
