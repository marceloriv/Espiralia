import { describe, it, expect } from 'vitest';
import {
  MAX_TITLE_LENGTH,
  emptyEventForm,
  eventFormFromEvent,
  validateEventForm,
} from '../components/agenda/eventForm';
import type { EventFormState } from '../components/agenda/eventForm';

const form = (patch: Partial<EventFormState> = {}): EventFormState => ({
  ...emptyEventForm('2026-10-14'),
  title: 'Reunión',
  ...patch,
});
const newId = () => 'e-fixed';

describe('validateEventForm', () => {
  // Técnica: valores límite sobre la longitud del título (0, 1, 120, 121).
  it.each([
    ['', false],
    ['   ', false],
    ['a', true],
    ['x'.repeat(MAX_TITLE_LENGTH), true],
    ['x'.repeat(MAX_TITLE_LENGTH + 1), false],
  ])('título caso %# → ok=%s', (title, ok) => {
    expect(validateEventForm(form({ title }), 'p-1', newId).ok).toBe(ok);
  });

  it('recorta espacios del título', () => {
    const r = validateEventForm(form({ title: '  Clase  ' }), 'p-1', newId);
    expect(r.ok && r.event.title).toBe('Clase');
  });

  // Técnica: partición de equivalencia sobre horas (válida, igual, anterior, mal formada, todo el día).
  it('rechaza término igual al inicio', () => {
    expect(validateEventForm(form({ startTime: '10:00', endTime: '10:00' }), 'p-1', newId)).toEqual({
      ok: false,
      error: 'La hora de término debe ser posterior a la de inicio',
    });
  });

  it('rechaza término anterior al inicio', () => {
    expect(validateEventForm(form({ startTime: '10:00', endTime: '09:59' }), 'p-1', newId).ok).toBe(false);
  });

  it('rechaza horas mal formadas', () => {
    expect(validateEventForm(form({ startTime: '9:00' }), 'p-1', newId).ok).toBe(false);
  });

  it('ignora y no guarda horas en eventos de todo el día', () => {
    const r = validateEventForm(form({ allDay: true, startTime: 'xx', endTime: 'yy' }), 'p-1', newId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.event).not.toHaveProperty('startTime');
      expect(r.event).not.toHaveProperty('endTime');
    }
  });

  it('rechaza fecha vacía', () => {
    expect(validateEventForm(form({ date: '' }), 'p-1', newId).ok).toBe(false);
  });

  // Técnica: tabla de decisión para recurrencia (repetir × días × until).
  it('rechaza repetir sin días', () => {
    expect(validateEventForm(form({ repeatWeekly: true, daysOfWeek: [] }), 'p-1', newId)).toEqual({
      ok: false,
      error: 'Elige al menos un día para repetir',
    });
  });

  it('rechaza until anterior al inicio', () => {
    const r = validateEventForm(form({ repeatWeekly: true, daysOfWeek: [3], until: '2026-10-13' }), 'p-1', newId);
    expect(r.ok).toBe(false);
  });

  it('acepta until igual al inicio y ordena los días', () => {
    const r = validateEventForm(
      form({ repeatWeekly: true, daysOfWeek: [5, 1, 3], until: '2026-10-14' }),
      'p-1',
      newId,
    );
    expect(r.ok && r.event.recurrence).toEqual({ daysOfWeek: [1, 3, 5], until: '2026-10-14' });
  });

  it('omite until vacío', () => {
    const r = validateEventForm(form({ repeatWeekly: true, daysOfWeek: [3] }), 'p-1', newId);
    expect(r.ok && r.event.recurrence).toEqual({ daysOfWeek: [3] });
  });

  it('no guarda recurrencia si repetir está desactivado aunque haya días marcados', () => {
    const r = validateEventForm(form({ repeatWeekly: false, daysOfWeek: [3] }), 'p-1', newId);
    expect(r.ok && r.event).not.toHaveProperty('recurrence');
  });

  it('crea un evento nuevo con id generado y perfil', () => {
    expect(validateEventForm(form(), 'p-1', newId)).toEqual({
      ok: true,
      event: {
        id: 'e-fixed',
        profileId: 'p-1',
        title: 'Reunión',
        date: '2026-10-14',
        startTime: '09:00',
        endTime: '10:00',
        category: 'personal',
      },
    });
  });

  it('al editar conserva id y notas existentes', () => {
    const r = validateEventForm(form({ editingId: 'e-old', notes: 'traer laptop' }), 'p-1', newId);
    expect(r.ok && r.event.id).toBe('e-old');
    expect(r.ok && r.event.notes).toBe('traer laptop');
  });
});

describe('eventFormFromEvent', () => {
  // Técnica: partición de equivalencia (esquema viejo con hora, todo el día, recurrente).
  it('propone término = inicio + 1 h para eventos viejos sin endTime', () => {
    const f = eventFormFromEvent({ id: 'e1', profileId: 'p', title: 'T', date: '2026-10-14', startTime: '09:30' });
    expect(f).toMatchObject({
      editingId: 'e1',
      allDay: false,
      startTime: '09:30',
      endTime: '10:30',
      category: 'personal',
      repeatWeekly: false,
    });
  });

  it('marca todo el día cuando no hay startTime', () => {
    expect(eventFormFromEvent({ id: 'e2', profileId: 'p', title: 'T', date: '2026-10-14' }).allDay).toBe(true);
  });

  it('carga la recurrencia', () => {
    const f = eventFormFromEvent({
      id: 'e3',
      profileId: 'p',
      title: 'T',
      date: '2026-10-14',
      startTime: '18:00',
      endTime: '19:00',
      recurrence: { daysOfWeek: [1], until: '2026-12-01' },
    });
    expect(f).toMatchObject({ repeatWeekly: true, daysOfWeek: [1], until: '2026-12-01' });
  });
});
