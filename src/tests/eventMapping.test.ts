import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  applyTimeChange,
  categoryOf,
  countByCategory,
  occursOn,
  removeOccurrence,
  toCalendarEvent,
} from '../components/agenda/eventMapping';
import type { AgendaEvent } from '../types';

// Técnica: valores límite sobre el día quitado (primero, intermedio, último, única repetición).
describe('removeOccurrence', () => {
  // Lunes y miércoles del 2 al 25 de noviembre de 2026.
  const serie: AgendaEvent = {
    id: 's-1', profileId: 'p', title: 'Taller', date: '2026-11-02', startTime: '10:00',
    recurrence: { daysOfWeek: [1, 3], until: '2026-11-25' },
  };
  const nuevoId = () => 's-2';

  it('un día intermedio parte la serie en dos; la primera conserva el id', () => {
    const quedan = removeOccurrence(serie, '2026-11-11', nuevoId);
    expect(quedan).toEqual([
      { ...serie, recurrence: { daysOfWeek: [1, 3], until: '2026-11-10' } },
      { ...serie, id: 's-2', date: '2026-11-12' },
    ]);
    expect(quedan.some(ev => occursOn(ev, '2026-11-11'))).toBe(false);
    expect(quedan.some(ev => occursOn(ev, '2026-11-09'))).toBe(true);
    expect(quedan.some(ev => occursOn(ev, '2026-11-16'))).toBe(true);
  });

  it('el primer día solo corre el inicio', () => {
    expect(removeOccurrence(serie, '2026-11-02', nuevoId)).toEqual([{ ...serie, id: 's-2', date: '2026-11-03' }]);
  });

  it('el último día solo adelanta el término', () => {
    expect(removeOccurrence(serie, '2026-11-25', nuevoId)).toEqual([
      { ...serie, recurrence: { daysOfWeek: [1, 3], until: '2026-11-24' } },
    ]);
  });

  it('quitar la única repetición no deja series vacías', () => {
    const unica: AgendaEvent = { ...serie, recurrence: { daysOfWeek: [1], until: '2026-11-08' } };
    expect(removeOccurrence(unica, '2026-11-02', nuevoId)).toEqual([]);
  });
});

const single: AgendaEvent = {
  id: 'e1',
  profileId: 'p',
  title: 'Clase',
  date: '2026-10-14',
  startTime: '09:00',
  endTime: '10:30',
  category: 'estudio',
};

// 2026-10-14 es miércoles (getDay() = 3).
const weekly: AgendaEvent = {
  id: 'r1',
  profileId: 'p',
  title: 'Gimnasio',
  date: '2026-10-14',
  startTime: '18:00',
  endTime: '19:00',
  category: 'personal',
  recurrence: { daysOfWeek: [3], until: '2026-10-28' },
};

describe('toCalendarEvent', () => {
  // Técnica: partición de equivalencia (único con hora, sin endTime, todo el día, sin categoría, recurrentes).
  it('evento único con horas', () => {
    expect(toCalendarEvent(single)).toEqual({
      id: 'e1',
      title: 'Clase',
      start: '2026-10-14T09:00',
      end: '2026-10-14T10:30',
      allDay: false,
      ...CATEGORY_COLORS.estudio,
    });
  });

  it('evento del esquema viejo sin endTime dura 1 h', () => {
    const legacy: AgendaEvent = { id: 'e2', profileId: 'p', title: 'Viejo', date: '2026-10-14', startTime: '09:00' };
    expect(toCalendarEvent(legacy)).toMatchObject({ end: '2026-10-14T10:00' });
  });

  it('evento de todo el día', () => {
    const allDay: AgendaEvent = { id: 'e3', profileId: 'p', title: 'Feriado', date: '2026-10-14' };
    const out = toCalendarEvent(allDay);
    expect(out).toMatchObject({ start: '2026-10-14', allDay: true });
    expect(out).not.toHaveProperty('end');
  });

  // Auditoría 002, hallazgo 27: FullCalendar 7 descarta textColor (su prop es contrastColor) y el tema forma escribe el
  // título con el color del texto sobre un tinte del color del evento. Un textColor aquí prometía un contraste que no se pintaba.
  it('cada categoría pinta con un token de color y no entrega textColor, que FullCalendar 7 descarta', () => {
    for (const category of CATEGORIES) {
      const out = toCalendarEvent({ ...single, category });
      expect(out.color, category).toMatch(/^var\(--color-[\w-]+\)$/);
      expect(out, category).not.toHaveProperty('textColor');
    }
  });

  it('sin categoría usa los colores de personal', () => {
    const noCat: AgendaEvent = { id: 'e4', profileId: 'p', title: 'X', date: '2026-10-14', startTime: '08:00' };
    expect(toCalendarEvent(noCat)).toMatchObject(CATEGORY_COLORS.personal);
  });

  it('recurrente con until: endRecur exclusivo = until + 1 día y no editable por arrastre', () => {
    expect(toCalendarEvent(weekly)).toEqual({
      id: 'r1',
      title: 'Gimnasio',
      ...CATEGORY_COLORS.personal,
      daysOfWeek: [3],
      startRecur: '2026-10-14',
      endRecur: '2026-10-29',
      startTime: '18:00',
      endTime: '19:00',
      editable: false,
    });
  });

  it('recurrente sin until no define endRecur', () => {
    const open: AgendaEvent = { ...weekly, recurrence: { daysOfWeek: [3] } };
    expect(toCalendarEvent(open)).not.toHaveProperty('endRecur');
  });

  it('recurrente de todo el día', () => {
    const allDaySeries: AgendaEvent = { id: 'r2', profileId: 'p', title: 'Y', date: '2026-10-14', recurrence: { daysOfWeek: [1] } };
    const out = toCalendarEvent(allDaySeries);
    expect(out).toMatchObject({ allDay: true, daysOfWeek: [1] });
    expect(out).not.toHaveProperty('startTime');
  });
});

describe('applyTimeChange', () => {
  // Técnica: tabla de decisión (allDay × cruza de día × end nulo).
  it('mueve un evento con hora dentro del mismo día', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 15, 11, 0), new Date(2026, 9, 15, 12, 30), false)).toEqual({
      ...single,
      date: '2026-10-15',
      startTime: '11:00',
      endTime: '12:30',
    });
  });

  it('con end nulo asume 1 h', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 15, 8, 0), null, false)).toMatchObject({
      startTime: '08:00',
      endTime: '09:00',
    });
  });

  it('rechaza un cambio que cruza medianoche', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 15, 23, 30), new Date(2026, 9, 16, 0, 30), false)).toBeNull();
  });

  it('rechaza 23:30 sin end porque la hora por defecto cruza medianoche', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 15, 23, 30), null, false)).toBeNull();
  });

  it('rechaza start nulo', () => {
    expect(applyTimeChange(single, null, null, false)).toBeNull();
  });

  it('pasar a todo el día elimina las horas', () => {
    const out = applyTimeChange(single, new Date(2026, 9, 16), null, true);
    expect(out).toMatchObject({ id: 'e1', date: '2026-10-16' });
    expect(out).not.toHaveProperty('startTime');
    expect(out).not.toHaveProperty('endTime');
  });

  it('acepta todo el día con end exclusivo al día siguiente', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 16), new Date(2026, 9, 17), true)).not.toBeNull();
  });

  it('rechaza todo el día que abarca varios días', () => {
    expect(applyTimeChange(single, new Date(2026, 9, 16), new Date(2026, 9, 18), true)).toBeNull();
  });

  it('de todo el día a franja horaria asigna horas', () => {
    const allDay: AgendaEvent = { id: 'e5', profileId: 'p', title: 'Z', date: '2026-10-14' };
    expect(applyTimeChange(allDay, new Date(2026, 9, 14, 10, 0), null, false)).toMatchObject({
      startTime: '10:00',
      endTime: '11:00',
    });
  });
});

describe('occursOn', () => {
  // Técnica: valores límite (antes del inicio, inicio, until inclusive, día después de until, otro día de semana).
  it('evento único solo ocurre en su fecha', () => {
    expect(occursOn(single, '2026-10-14')).toBe(true);
    expect(occursOn(single, '2026-10-15')).toBe(false);
  });

  it.each([
    ['2026-10-07', false],
    ['2026-10-14', true],
    ['2026-10-21', true],
    ['2026-10-28', true],
    ['2026-11-04', false],
    ['2026-10-15', false],
  ])('serie semanal de miércoles en %s → %s', (date, expected) => {
    expect(occursOn(weekly, date)).toBe(expected);
  });

  it('serie sin until sigue ocurriendo', () => {
    expect(occursOn({ ...weekly, recurrence: { daysOfWeek: [3] } }, '2027-01-06')).toBe(true);
  });
});

describe('countByCategory', () => {
  it('cuenta por categoría y trata la ausencia como personal', () => {
    const events: AgendaEvent[] = [
      { ...single, id: 'a', category: 'trabajo' },
      { ...single, id: 'b', category: 'trabajo' },
      { id: 'c', profileId: 'p', title: 'sin cat', date: '2026-10-14' },
      { ...single, id: 'd', category: 'urgente' },
    ];
    expect(countByCategory(events)).toEqual({ todas: 4, trabajo: 2, personal: 1, urgente: 1, estudio: 0, universidad: 0 });
  });
});

// Técnica: partición de equivalencia (categoría de la lista, ausente, guardada fuera de la lista).
// La Acción Rápida guardó 'salud' y 'general' hasta 2026-11-04; esos eventos siguen en localStorage.
describe('categoryOf', () => {
  const guardadoFueraDeLista = (category: string) =>
    ({ ...single, id: `x-${category}`, category }) as unknown as AgendaEvent;

  it('respeta una categoría de la lista y trata la ausencia como personal', () => {
    expect(categoryOf({ ...single, category: 'urgente' })).toBe('urgente');
    expect(categoryOf({ id: 'c', profileId: 'p', title: 'sin cat', date: '2026-10-14' })).toBe('personal');
  });

  it('una categoría que la Agenda no conoce se muestra y se cuenta como personal', () => {
    const viejos = [guardadoFueraDeLista('salud'), guardadoFueraDeLista('general')];
    expect(viejos.map(categoryOf)).toEqual(['personal', 'personal']);
    expect(toCalendarEvent(viejos[0])).toMatchObject(CATEGORY_COLORS.personal);
    expect(countByCategory(viejos)).toEqual({ todas: 2, trabajo: 0, personal: 2, urgente: 0, estudio: 0, universidad: 0 });
  });
});
