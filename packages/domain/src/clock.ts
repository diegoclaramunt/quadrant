export type Clock = {
  now(): Date;
};

export function systemClock(): Clock {
  return { now: () => new Date() };
}

export function ymdInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error('No se pudo resolver la fecha en la zona horaria');
  }
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): {
  year: number;
  month: number;
  day: number;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Fecha inválida: ${value}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function isoWeekday(isoDate: string): number {
  const { year, month, day } = parseIsoDate(isoDate);
  const utc = Date.UTC(year, month - 1, day);
  const weekday = new Date(utc).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export function addDays(isoDate: string, days: number): string {
  const { year, month, day } = parseIsoDate(isoDate);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function mondayOf(isoDate: string): string {
  const weekday = isoWeekday(isoDate);
  return addDays(isoDate, 1 - weekday);
}

export function todayIso(clock: Clock, timeZone: string): string {
  return ymdInTimeZone(clock.now(), timeZone);
}

export function tomorrowIso(clock: Clock, timeZone: string): string {
  return addDays(todayIso(clock, timeZone), 1);
}

export function currentMonday(clock: Clock, timeZone: string): string {
  return mondayOf(todayIso(clock, timeZone));
}

export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
