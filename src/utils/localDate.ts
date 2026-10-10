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
