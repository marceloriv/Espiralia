import { describe, it, expect } from 'vitest';
import {
  CATEGORY_COLORS,
  applyTimeChange,
  countByCategory,
  occursOn,
  toCalendarEvent,
} from '../components/agenda/eventMapping';
import type { AgendaEvent } from '../types';

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
    expect(countByCategory(events)).toEqual({ todas: 4, trabajo: 2, personal: 1, urgente: 1, estudio: 0 });
  });
});
