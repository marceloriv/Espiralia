import { describe, it, expect } from 'vitest';
import { IcsService } from '../services/icsService';
import { toLocalDateStr, toLocalTimeStr } from '../utils/localDate';
import type { AgendaEvent } from '../types';

describe('IcsService', () => {
  const sampleEvents: AgendaEvent[] = [
    {
      id: 'ev-1',
      profileId: 'p-1',
      title: 'Práctica de Manejo Conaset',
      date: '2026-10-20',
      startTime: '10:00',
      endTime: '11:30',
      category: 'estudio',
      notes: 'Practicar estacionamiento',
    },
    {
      id: 'ev-2',
      profileId: 'p-1',
      title: 'Sesión Terapéutica Personal',
      date: '2026-10-21',
      startTime: '16:00',
      category: 'personal',
    },
  ];

  it('exporta eventos a formato VCALENDAR válido', () => {
    const ics = IcsService.exportToIcs(sampleEvents);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:Práctica de Manejo Conaset');
    expect(ics).toContain('DTSTART:20261020T100000');
    expect(ics).toContain('DTEND:20261020T113000');
    expect(ics).toContain('DESCRIPTION:Practicar estacionamiento');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('permite filtrar la exportación por categoría/área', () => {
    const ics = IcsService.exportToIcs(sampleEvents, { category: 'estudio' });
    expect(ics).toContain('SUMMARY:Práctica de Manejo Conaset');
    expect(ics).not.toContain('SUMMARY:Sesión Terapéutica Personal');
  });

  it('parsea contenido VCALENDAR a eventos AgendaEvent válidos', () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-123
SUMMARY:Entrega Portafolio U 2026-II
DTSTART:20261115T090000
DTEND:20261115T100000
DESCRIPTION:Cartas de recomendación y becas
CATEGORIES:UNIVERSIDAD
END:VEVENT
END:VCALENDAR`;

    const parsed = IcsService.parseIcs(ics, 'p-1');
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Entrega Portafolio U 2026-II');
    expect(parsed[0].date).toBe('2026-11-15');
    expect(parsed[0].startTime).toBe('09:00');
    expect(parsed[0].endTime).toBe('10:00');
    expect(parsed[0].notes).toBe('Cartas de recomendación y becas');
    expect(parsed[0].profileId).toBe('p-1');
  });

  it('maneja con seguridad archivos corruptos o vacíos sin lanzar errores', () => {
    expect(IcsService.parseIcs('', 'p-1')).toEqual([]);
    expect(IcsService.parseIcs('NOT AN ICS FILE', 'p-1')).toEqual([]);
  });
});

// El export perdía las series, el import duplicaba al reimportar, ignoraba las series y leía la hora UTC como local.
describe('IcsService: series, UID y UTC', () => {
  const ics = (...vevent: string[]) =>
    ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', ...vevent, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');

  it('exporta una serie semanal como RRULE con sus días y su término', () => {
    const serie: AgendaEvent = {
      id: 'ev-serie', profileId: 'p-1', title: 'Taller', date: '2026-11-02', startTime: '10:00', endTime: '11:00',
      recurrence: { daysOfWeek: [1, 3], until: '2026-12-18' },
    };
    expect(IcsService.exportToIcs([serie])).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261218T235959');
  });

  it('reimportar su propio .ics conserva los ids: guardar reemplaza en vez de duplicar', () => {
    const propios: AgendaEvent[] = [
      { id: 'e-1', profileId: 'p-1', title: 'Uno', date: '2026-11-04', startTime: '09:00', endTime: '10:00' },
      { id: 'e-2', profileId: 'p-1', title: 'Dos', date: '2026-11-05' },
    ];
    expect(IcsService.parseIcs(IcsService.exportToIcs(propios), 'p-1').map(e => e.id)).toEqual(['e-1', 'e-2']);
  });

  it('un UID ajeno da siempre el mismo id', () => {
    const contenido = ics('UID:abc-123@google.com', 'SUMMARY:Externo', 'DTSTART;VALUE=DATE:20261110');
    expect(IcsService.parseIcs(contenido, 'p-1')[0].id).toBe(IcsService.parseIcs(contenido, 'p-1')[0].id);
  });

  it('importa RRULE semanal como serie', () => {
    const [ev] = IcsService.parseIcs(
      ics('UID:serie@x', 'SUMMARY:Gimnasio', 'DTSTART:20261102T100000', 'DTEND:20261102T110000', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261130'),
      'p-1',
    );
    expect(ev.recurrence).toEqual({ daysOfWeek: [1, 3], until: '2026-11-30' });
  });

  it('convierte las horas en UTC (Z) a la hora local', () => {
    const [ev] = IcsService.parseIcs(ics('UID:utc@x', 'SUMMARY:Llamada', 'DTSTART:20261103T150000Z', 'DTEND:20261103T160000Z'), 'p-1');
    const inicio = new Date(Date.UTC(2026, 10, 3, 15, 0));
    const fin = new Date(Date.UTC(2026, 10, 3, 16, 0));
    expect(ev).toMatchObject({ date: toLocalDateStr(inicio), startTime: toLocalTimeStr(inicio), endTime: toLocalTimeStr(fin) });
  });
});
