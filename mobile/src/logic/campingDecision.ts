import { WeatherData, DecisionResult, DecisionStatus } from '../types/weather';
import { Period, RegionKey } from '../types/activities';
import { buildRows, rowsBetween, sumPrecip, maxVal, minVal, avgVal, isStorm } from '../services/weather';
import { startOfDay, makeTime, hoursAfter, hoursBefore, dayLabel, getWeekendDays, formatTimeHHMM } from '../utils/date';
import { REGIONS } from '../data/regions';

export interface CampingDayResult {
  day: Date;
  title: string;
  morning: SegmentStats;
  afternoon: SegmentStats;
  evening: SegmentStats;
  overnight: SegmentStats;
  status: DecisionStatus;
  dayHighC: number;
  nightLowC: number;
  rainProb: number;
}

export interface SegmentStats {
  label: string;
  avgTempC: number;
  rainProb: number;
  precip: number;
  windMph: number;
  gustMph: number;
  storm: boolean;
  symbol: string;
}

function weatherSymbol(s: SegmentStats): string {
  if (s.storm) return '⛈️';
  if (s.gustMph >= 38) return '💨';
  if (s.precip >= 2 || s.rainProb >= 65) return '🌧️';
  if (s.precip > 0.2 || s.rainProb >= 35) return '🌦️';
  if (s.avgTempC <= 2) return '❄️';
  return s.rainProb < 20 ? '☀️' : '⛅';
}

function segmentStats(rows: ReturnType<typeof buildRows>, day: Date, label: string, startH: number, endH: number): SegmentStats {
  const start = makeTime(day, startH);
  const end = endH <= startH ? makeTime(hoursAfter(day, 24), endH) : makeTime(day, endH);
  const seg = rowsBetween(rows, start, end);
  const s: SegmentStats = {
    label,
    avgTempC: avgVal(seg.map(r => r.temp), 0),
    rainProb: maxVal(seg.map(r => r.rainProb), 0),
    precip: sumPrecip(seg),
    windMph: maxVal(seg.map(r => r.wind), 0),
    gustMph: maxVal(seg.map(r => r.gust), 0),
    storm: isStorm(seg),
    symbol: '',
  };
  s.symbol = weatherSymbol(s);
  return s;
}

export function analyseCamping(data: WeatherData, period: Period, regionKey: RegionKey): CampingDayResult[] {
  const locale = REGIONS[regionKey].locale;
  const rows = buildRows(data);
  const days = period === 'today' ? [startOfDay(new Date())]
    : period === 'tomorrow' ? [startOfDay(hoursAfter(startOfDay(new Date()), 24))]
    : getWeekendDays();

  return days.map(day => {
    const title = day.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });
    const morning = segmentStats(rows, day, 'Morning', 6, 12);
    const afternoon = segmentStats(rows, day, 'Afternoon', 12, 18);
    const evening = segmentStats(rows, day, 'Evening', 18, 23);
    const overnight = segmentStats(rows, day, 'Overnight', 23, 7);

    const dayRows = rowsBetween(rows, makeTime(day, 0), makeTime(day, 24));
    const nightRows = rowsBetween(rows, makeTime(day, 18), makeTime(hoursAfter(day, 24), 9));
    const dayHighC = maxVal(dayRows.map(r => r.temp), 0);
    const nightLowC = minVal(nightRows.map(r => r.apparent), 0);
    const rainProb = maxVal(dayRows.map(r => r.rainProb), 0);

    const overnightStorm = overnight.storm || evening.storm;
    const overnightMaxGust = Math.max(overnight.gustMph, evening.gustMph);
    const isToday = startOfDay(day).getTime() === startOfDay(new Date()).getTime();
    const base = isToday ? new Date() : makeTime(day, 10);
    const past24 = rowsBetween(rows, hoursBefore(base, 24), base);
    const pastRain = sumPrecip(past24);

    let score = 100;
    const reasons: string[] = [];
    if (overnightStorm) { score -= 50; reasons.unshift('Thunder or storm risk overnight.'); }
    if (overnightMaxGust > 40) { score -= 40; reasons.push('Very strong gusts overnight.'); }
    if (overnight.precip > 4) { score -= 30; reasons.push('Heavy overnight rain expected.'); }
    else if (overnight.precip > 1) { score -= 16; reasons.push('Some overnight rain expected.'); }
    if (nightLowC < 7) { score -= 18; reasons.push('Cold overnight temperatures.'); }
    if (pastRain > 4) { score -= 18; reasons.push('Ground may be wet from recent rain.'); }
    if (overnightMaxGust > 28) { score -= 18; reasons.push('Gusty overnight winds.'); }

    let status: DecisionStatus = 'GO';
    if (overnightStorm || overnightMaxGust > 40) { status = 'WARNING'; }
    else if (score < 72) { status = 'CAUTION'; }

    return { day, title, morning, afternoon, evening, overnight, status, dayHighC, nightLowC, rainProb };
  });
}
