import { RegionKey } from '../types/activities';
import { REGIONS } from '../data/regions';

export function formatTemp(c: number, regionKey: RegionKey): string {
  const region = REGIONS[regionKey];
  if (region.tempUnit === 'F') return `${Math.round(c * 9 / 5 + 32)}°F`;
  return `${Math.round(c)}°C`;
}

export function formatWind(mph: number, regionKey: RegionKey): string {
  const region = REGIONS[regionKey];
  if (region.windUnit === 'kmh') return `${Math.round(mph * 1.60934)} km/h`;
  return `${Math.round(mph)} mph`;
}
