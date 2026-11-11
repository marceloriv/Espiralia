import type { AgendaEvent, EventCategory, EventRecurrence } from '../types';
import { toLocalDateStr, toLocalTimeStr } from '../utils/localDate';

export interface IcsExportOptions {
  category?: string;
  startDate?: string;
  endDate?: string;
}

/** Sufijo de los UID que escribe Espiralia: al reimportar su propio archivo se recupera el id original. */
const UID_PROPIO = '@espiralia.local';
/** Días de RFC 5545; el índice es el de `Date.getDay()` (0 = domingo). */
const DIAS_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const CATEGORIAS: EventCategory[] = ['trabajo', 'personal', 'urgente', 'estudio', 'universidad'];

const escapeIcs = (str: string): string =>
  str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

const unescapeIcs = (str: string): string =>
  str
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

const formatIcsDateTime = (dateStr: string, timeStr?: string): string => {
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) {
    return cleanDate;
  }
  const cleanTime = timeStr.replace(/:/g, '') + '00';
  return `${cleanDate}T${cleanTime}`;
};

/**
 * Fecha y hora locales de un DTSTART, DTEND o UNTIL. Con sufijo `Z` el valor es UTC y se pasa a la hora local.
 * ponytail: con TZID la hora se toma como local; acierta cuando el TZID es la zona del navegador, que es el caso
 * de un calendario personal. Convertir entre zonas pide la base de datos de husos (Temporal).
 */
const parseIcsDateTime = (dtStr: string): { date: string; time?: string } => {
  const val = dtStr.includes(':') ? dtStr.split(':').pop()! : dtStr;
  const match = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);
  if (!match) {
    return { date: dtStr };
  }
  const [, y, mo, d, h, mi, s, utc] = match;
  if (h && mi && utc) {
    const local = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0)));
    return { date: toLocalDateStr(local), time: toLocalTimeStr(local) };
  }
  return { date: `${y}-${mo}-${d}`, time: h && mi ? `${h}:${mi}` : undefined };
};

const rruleDe = (ev: AgendaEvent): string | null => {
  if (!ev.recurrence) return null;
  const dias = ev.recurrence.daysOfWeek.map(d => DIAS_ICS[d]).join(',');
  // UNTIL lleva hora si DTSTART la lleva (RFC 5545 §3.3.10); el último día de la serie entra completo.
  const until = ev.recurrence.until ? `;UNTIL=${ev.recurrence.until.replace(/-/g, '')}${ev.startTime ? 'T235959' : ''}` : '';
  return `RRULE:FREQ=WEEKLY;BYDAY=${dias}${until}`;
};

/** Series semanales o diarias sin intervalo. Otras reglas (mensuales, cada N semanas) se importan como un solo evento. */
const recurrenceDe = (rrule: string, date: string): EventRecurrence | undefined => {
  const partes = Object.fromEntries(rrule.split(';').map(p => p.split('=') as [string, string]));
  if (partes.INTERVAL && partes.INTERVAL !== '1') return undefined;

  let daysOfWeek: number[];
  if (partes.FREQ === 'DAILY') {
    daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
  } else if (partes.FREQ === 'WEEKLY') {
    daysOfWeek = partes.BYDAY
      ? partes.BYDAY.split(',').map(d => DIAS_ICS.indexOf(d.slice(-2))).filter(d => d >= 0)
      : [new Date(`${date}T12:00:00`).getDay()];
  } else {
    return undefined;
  }
  if (daysOfWeek.length === 0) return undefined;

  const until = partes.UNTIL ? parseIcsDateTime(partes.UNTIL).date : undefined;
  return { daysOfWeek: [...new Set(daysOfWeek)].sort((a, b) => a - b), ...(until ? { until } : {}) };
};

/** El mismo UID da siempre el mismo id: reimportar un archivo reemplaza sus eventos en vez de duplicarlos. */
const idDesdeUid = (uid: string): string =>
  uid.endsWith(UID_PROPIO) ? uid.slice(0, -UID_PROPIO.length) : `ics-${uid.replace(/[^A-Za-z0-9@._-]/g, '_')}`;

export const IcsService = {
  exportToIcs(events: AgendaEvent[], options?: IcsExportOptions): string {
    const filtered = events.filter(e => {
      if (options?.category && e.category?.toLowerCase() !== options.category.toLowerCase()) {
        return false;
      }
      if (options?.startDate && e.date < options.startDate) {
        return false;
      }
      if (options?.endDate && e.date > options.endDate) {
        return false;
      }
      return true;
    });

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Espiralia//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const ev of filtered) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${ev.id}${UID_PROPIO}`);
      lines.push(`DTSTAMP:${formatIcsDateTime(new Date().toISOString().slice(0, 10), '00:00')}Z`);
      lines.push(`SUMMARY:${escapeIcs(ev.title)}`);

      if (ev.startTime) {
        lines.push(`DTSTART:${formatIcsDateTime(ev.date, ev.startTime)}`);
        if (ev.endTime) {
          lines.push(`DTEND:${formatIcsDateTime(ev.date, ev.endTime)}`);
        }
      } else {
        lines.push(`DTSTART;VALUE=DATE:${ev.date.replace(/-/g, '')}`);
      }

      const rrule = rruleDe(ev);
      if (rrule) {
        lines.push(rrule);
      }

      if (ev.notes) {
        lines.push(`DESCRIPTION:${escapeIcs(ev.notes)}`);
      }

      if (ev.category) {
        lines.push(`CATEGORIES:${ev.category.toUpperCase()}`);
      }

      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  },

  parseIcs(content: string, profileId: string): AgendaEvent[] {
    if (!content || !content.includes('BEGIN:VCALENDAR')) {
      return [];
    }

    try {
      // Unfold folded lines RFC 5545
      const rawLines = content.replace(/\r\n[ \t]/g, '').split(/\r?\n/);
      const events: AgendaEvent[] = [];
      let inEvent = false;
      let currentEvent: Partial<AgendaEvent> = {};
      let rrule: string | undefined;

      for (const line of rawLines) {
        const trimmed = line.trim();
        if (trimmed === 'BEGIN:VEVENT') {
          inEvent = true;
          currentEvent = { profileId };
          rrule = undefined;
          continue;
        }

        if (trimmed === 'END:VEVENT') {
          if (inEvent && currentEvent.title && currentEvent.date) {
            const recurrence = rrule ? recurrenceDe(rrule, currentEvent.date) : undefined;
            events.push({
              ...currentEvent,
              id: currentEvent.id ?? `ev-ics-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 5)}`,
              ...(recurrence ? { recurrence } : {}),
            } as AgendaEvent);
          }
          inEvent = false;
          currentEvent = {};
          continue;
        }

        if (!inEvent) continue;

        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) continue;

        const propKeyWithParams = trimmed.slice(0, colonIdx);
        const propValue = trimmed.slice(colonIdx + 1);
        const propName = propKeyWithParams.split(';')[0].toUpperCase();

        if (propName === 'UID') {
          currentEvent.id = idDesdeUid(unescapeIcs(propValue));
        } else if (propName === 'SUMMARY') {
          currentEvent.title = unescapeIcs(propValue);
        } else if (propName === 'DESCRIPTION') {
          currentEvent.notes = unescapeIcs(propValue);
        } else if (propName === 'DTSTART') {
          const { date, time } = parseIcsDateTime(trimmed);
          currentEvent.date = date;
          if (time) currentEvent.startTime = time;
        } else if (propName === 'DTEND') {
          const { time } = parseIcsDateTime(trimmed);
          if (time) currentEvent.endTime = time;
        } else if (propName === 'RRULE') {
          // ponytail: EXDATE no se lee; una serie con días quitados llega completa.
          rrule = propValue;
        } else if (propName === 'CATEGORIES') {
          const cat = propValue.toLowerCase().split(',')[0].trim();
          if ((CATEGORIAS as string[]).includes(cat)) {
            currentEvent.category = cat as EventCategory;
          }
        }
      }

      return events;
    } catch {
      return [];
    }
  },
};
