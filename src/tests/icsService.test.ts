import { describe, it, expect } from 'vitest';
import { IcsService } from '../services/icsService';
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
