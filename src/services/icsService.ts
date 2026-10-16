import type { AgendaEvent, EventCategory } from '../types';

export interface IcsExportOptions {
  category?: string;
  startDate?: string;
  endDate?: string;
}

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

const parseIcsDateTime = (dtStr: string): { date: string; time?: string } => {
  // Manejo de prefijos tipo TZID=...:YYYYMMDDTHHmmss o formato directo YYYYMMDDTHHmmss
  const val = dtStr.includes(':') ? dtStr.split(':').pop()! : dtStr;
  const match = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?/);
  if (!match) {
    return { date: dtStr };
  }
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const time = match[4] && match[5] ? `${match[4]}:${match[5]}` : undefined;
  return { date, time };
};

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
      lines.push(`UID:${ev.id}@espiralia.local`);
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

      for (const line of rawLines) {
        const trimmed = line.trim();
        if (trimmed === 'BEGIN:VEVENT') {
          inEvent = true;
          currentEvent = {
            id: `ev-ics-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            profileId,
          };
          continue;
        }

        if (trimmed === 'END:VEVENT') {
          if (inEvent && currentEvent.title && currentEvent.date) {
            events.push(currentEvent as AgendaEvent);
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

        if (propName === 'SUMMARY') {
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
        } else if (propName === 'CATEGORIES') {
          const cat = propValue.toLowerCase().split(',')[0].trim();
          if (['trabajo', 'personal', 'urgente', 'estudio', 'universidad'].includes(cat)) {
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
