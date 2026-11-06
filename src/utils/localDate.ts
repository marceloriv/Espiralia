const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local 'YYYY-MM-DD'. Nunca usar toISOString(): en zonas UTC negativas corre el día. */
export const toLocalDateStr = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Hora local 'HH:mm'. */
export const toLocalTimeStr = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** Suma días a una fecha 'YYYY-MM-DD' en calendario local. */
export const addDaysToDateStr = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toLocalDateStr(new Date(y, m - 1, d + days));
};

/** Término por defecto: inicio + 1 h, sin cruzar medianoche. */
export const defaultEndTime = (startTime: string): string => {
  const [h, m] = startTime.split(':').map(Number);
  return h >= 23 ? '23:59' : `${pad(h + 1)}:${pad(m)}`;
};

/** Semana ISO 8601 (lunes a domingo; la semana 1 contiene el primer jueves del año). */
export const isoWeekNumber = (date: Date): number => {
  const thursdayOf = (d: Date): Date => {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7) + 3);
    return t;
  };
  const thursday = thursdayOf(date);
  const firstThursday = thursdayOf(new Date(thursday.getFullYear(), 0, 4));
  return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
};

/** Clave de semana ISO 'AAAA-Www'. El año es el del jueves de esa semana: el 1 de enero puede caer en la semana 53. */
export const isoWeekKey = (date: Date): string => {
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  thursday.setDate(thursday.getDate() - ((thursday.getDay() + 6) % 7) + 3);
  return `${thursday.getFullYear()}-W${pad(isoWeekNumber(date))}`;
};

/** Semestre académico: enero a junio es 'AAAA-I', julio a diciembre es 'AAAA-II'. */
export const semesterLabel = (date: Date): string => `${date.getFullYear()}-${date.getMonth() < 6 ? 'I' : 'II'}`;
