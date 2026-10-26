import { describe, it, expect } from 'vitest';
import { addDaysToDateStr, defaultEndTime, isoWeekNumber, semesterLabel, toLocalDateStr, toLocalTimeStr } from '../utils/localDate';

describe('semesterLabel', () => {
  it.each([
    [new Date(2026, 5, 30), '2026-I'],
    [new Date(2026, 6, 1), '2026-II'],
    [new Date(2026, 9, 22), '2026-II'],
  ])('%s es el semestre %s', (date, label) => {
    expect(semesterLabel(date)).toBe(label);
  });
});

// Técnica: valores límite en el borde de año (la semana ISO 1 puede empezar en diciembre y la 53 terminar en enero).
describe('isoWeekNumber', () => {
  it.each([
    [new Date(2026, 9, 22), 43],
    [new Date(2026, 11, 31), 53],
    [new Date(2027, 0, 1), 53],
    [new Date(2024, 11, 30), 1],
  ])('%s es la semana ISO %i', (date, week) => {
    expect(isoWeekNumber(date)).toBe(week);
  });
});

// Técnica: valores límite (bordes de día, mes, año, bisiesto y fin del día para horas).
describe('localDate', () => {
  it('usa el día local a las 23:59, no el día UTC', () => {
    expect(toLocalDateStr(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10');
  });

  it('cambia de día exactamente a las 00:00 locales', () => {
    expect(toLocalDateStr(new Date(2026, 9, 11, 0, 0))).toBe('2026-10-11');
  });

  it('formatea la hora local con ceros a la izquierda', () => {
    expect(toLocalTimeStr(new Date(2026, 9, 10, 9, 5))).toBe('09:05');
  });

  it.each([
    ['2026-10-31', 1, '2026-11-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2027-02-28', 1, '2027-03-01'],
    ['2026-10-01', -1, '2026-09-30'],
  ])('addDaysToDateStr(%s, %i) = %s', (date, days, expected) => {
    expect(addDaysToDateStr(date, days)).toBe(expected);
  });

  it.each([
    ['09:30', '10:30'],
    ['22:59', '23:59'],
    ['23:00', '23:59'],
    ['23:30', '23:59'],
  ])('defaultEndTime(%s) = %s', (start, expected) => {
    expect(defaultEndTime(start)).toBe(expected);
  });
});
