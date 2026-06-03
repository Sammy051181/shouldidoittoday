import { RegionKey } from '../types/activities';
import { REGIONS } from '../data/regions';

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function makeTime(day: Date, h: number): Date {
  const x = new Date(day);
  x.setHours(h, 0, 0, 0);
  return x;
}

export function hoursAfter(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3600000);
}

export function hoursBefore(d: Date, h: number): Date {
  return new Date(d.getTime() - h * 3600000);
}

export function dayLabel(d: Date, regionKey: RegionKey): string {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return d.toLocaleDateString(REGIONS[regionKey].locale, { weekday: 'long' });
}

export function getWeekendDays(): Date[] {
  const today = startOfDay(new Date());
  const day = today.getDay();
  let daysToFriday = (5 - day + 7) % 7;
  if (day === 6) daysToFriday = -1;
  if (day === 0) daysToFriday = -2;
  const friday = startOfDay(hoursAfter(today, daysToFriday * 24));
  return [
    friday,
    startOfDay(hoursAfter(friday, 24)),
    startOfDay(hoursAfter(friday, 48)),
  ].filter(d => d >= today);
}

export function formatTimeHHMM(d: Date, locale: string): string {
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
