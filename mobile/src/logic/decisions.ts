import { WeatherData, WeatherRow, DecisionResult, DecisionStatus } from '../types/weather';
import { ActivityKey, Period, RegionKey } from '../types/activities';
import { buildRows, rowsBetween, sumPrecip, avgVal, maxVal, minVal, isStorm, isWintry } from '../services/weather';
import { startOfDay, makeTime, hoursAfter, hoursBefore, dayLabel, getWeekendDays, formatTimeHHMM } from '../utils/date';
import { REGIONS } from '../data/regions';

const RULES: Record<ActivityKey, { rainProb: number; windMaxMph: number; tempMinC: number; tempMaxC: number; hours: [number, number]; minHours: number }> = {
  grass:   { rainProb: 30, windMaxMph: 26, tempMinC: 8,  tempMaxC: 28, hours: [8, 18],  minHours: 2 },
  washCar: { rainProb: 30, windMaxMph: 30, tempMinC: 4,  tempMaxC: 26, hours: [8, 19],  minHours: 2 },
  washing: { rainProb: 22, windMaxMph: 34, tempMinC: 8,  tempMaxC: 32, hours: [7, 18],  minHours: 4 },
  paint:   { rainProb: 15, windMaxMph: 22, tempMinC: 10, tempMaxC: 25, hours: [9, 17],  minHours: 5 },
  bbq:     { rainProb: 40, windMaxMph: 28, tempMinC: 10, tempMaxC: 34, hours: [11, 21], minHours: 2 },
  dog:     { rainProb: 60, windMaxMph: 42, tempMinC: -2, tempMaxC: 26, hours: [6, 22],  minHours: 1 },
  jacket:  { rainProb: 45, windMaxMph: 34, tempMinC: 12, tempMaxC: 100,hours: [6, 23],  minHours: 1 },
  run:     { rainProb: 60, windMaxMph: 35, tempMinC: 2,  tempMaxC: 25, hours: [5, 22],  minHours: 1 },
  windows: { rainProb: 25, windMaxMph: 24, tempMinC: 4,  tempMaxC: 25, hours: [8, 17],  minHours: 2 },
  plants:  { rainProb: 45, windMaxMph: 35, tempMinC: 4,  tempMaxC: 34, hours: [6, 21],  minHours: 1 },
  camping: { rainProb: 35, windMaxMph: 22, tempMinC: 5,  tempMaxC: 30, hours: [10, 22], minHours: 4 },
  hiking:  { rainProb: 45, windMaxMph: 32, tempMinC: 3,  tempMaxC: 26, hours: [7, 19],  minHours: 3 },
  beach:   { rainProb: 30, windMaxMph: 24, tempMinC: 18, tempMaxC: 33, hours: [10, 18], minHours: 3 },
  fishing: { rainProb: 50, windMaxMph: 28, tempMinC: 4,  tempMaxC: 28, hours: [6, 20],  minHours: 3 },
  golf:    { rainProb: 35, windMaxMph: 25, tempMinC: 4,  tempMaxC: 28, hours: [7, 19],  minHours: 3 },
  cycling: { rainProb: 45, windMaxMph: 28, tempMinC: 3,  tempMaxC: 28, hours: [6, 20],  minHours: 2 },
};

function findWindow(rows: WeatherRow[], predicate: (r: WeatherRow) => boolean, minHours: number, locale: string): string {
  let run: WeatherRow[] = [], best: WeatherRow[] = [];
  for (const row of rows) {
    if (predicate(row)) run.push(row);
    else { if (run.length > best.length) best = run; run = []; }
  }
  if (run.length > best.length) best = run;
  if (best.length < minHours) return 'No clear window';
  const end = new Date(best[best.length - 1].time.getTime() + 3600000);
  return `${formatTimeHHMM(best[0].time, locale)}–${formatTimeHHMM(end, locale)}`;
}

function scoreValue(s: DecisionStatus): number {
  if (['GO', 'WATER', 'TAKE ONE'].includes(s)) return 3;
  if (['CAUTION', 'CHECK SOIL', 'MAYBE'].includes(s)) return 2;
  return 1;
}

function isWinterRest(day: Date, regionKey: RegionKey): boolean {
  const m = day.getMonth();
  return ['AU', 'NZ'].includes(regionKey) ? [5, 6, 7].includes(m) : [11, 0, 1].includes(m);
}

function getTargetDays(data: WeatherData, period: Period): Date[] {
  const today = startOfDay(new Date());
  if (period === 'today') return [today];
  if (period === 'tomorrow') return [startOfDay(hoursAfter(today, 24))];
  const dates = (data.daily.time || []).map(d => startOfDay(new Date(d)));
  const targets = getWeekendDays();
  const weekend = dates.filter(d => targets.some(t => t.getTime() === d.getTime()));
  return weekend.length ? weekend : [today];
}

export function analyseDay(
  data: WeatherData,
  activityKey: ActivityKey,
  day: Date,
  isToday: boolean,
  period: Period,
  regionKey: RegionKey,
): DecisionResult {
  const task = RULES[activityKey];
  const locale = REGIONS[regionKey].locale;
  const now = new Date();
  const rows = buildRows(data);
  const start = makeTime(day, task.hours[0]);
  const end = makeTime(day, task.hours[1]);
  const base = isToday ? now : start;
  const useful = rowsBetween(rows, isToday ? new Date(Math.max(start.getTime(), now.getTime())) : start, end);
  const next12 = rowsBetween(rows, base, hoursAfter(base, 12));
  const next24 = rowsBetween(rows, base, hoursAfter(base, 24));
  const past24 = rowsBetween(rows, hoursBefore(base, 24), base);
  const past72 = rowsBetween(rows, hoursBefore(base, 72), base);

  const currentRain = isToday ? (data.current.precipitation || data.current.rain || 0) : 0;
  const temp = avgVal(useful.map(r => r.temp), data.current.temperature_2m);
  const maxTemp = maxVal(useful.map(r => r.temp), data.current.temperature_2m);
  const minFeels = useful.length ? Math.min(...useful.map(r => r.apparent)) : (data.current.apparent_temperature ?? data.current.temperature_2m);
  const maxWind = maxVal(useful.map(r => r.wind), 0);
  const maxGust = maxVal(useful.map(r => r.gust), 0);
  const avgHumidity = avgVal(useful.map(r => r.humidity).filter((v): v is number => v !== null), 0);
  const rainProb = maxVal(useful.map(r => r.rainProb), 0);
  const rainNext12 = sumPrecip(next12);
  const rainNext24 = sumPrecip(next24);
  const rainPast24 = sumPrecip(past24);
  const rainPast72 = sumPrecip(past72);
  const rainTotal = sumPrecip(useful);
  const storm = isStorm(useful) || isStorm(next12);
  const wintry = isWintry(useful) || isWintry(next12);
  const soilRow = rows.slice().reverse().find(r => r.time <= base && r.soil !== null);
  const soil = soilRow?.soil ?? null;
  const evap = useful.reduce((t, r) => t + r.evap, 0);

  const good = (r: WeatherRow) =>
    r.rainProb <= task.rainProb && r.precip < 0.2 &&
    r.wind <= task.windMaxMph && r.temp >= task.tempMinC && r.temp <= task.tempMaxC;

  let best = findWindow(useful, good, task.minHours, locale);
  let score = 100;
  const reasons: string[] = [];

  if (!useful.length) { score -= 40; reasons.push('No usable daylight window left.'); }
  if (currentRain > 0) { score -= ['run', 'dog'].includes(activityKey) ? 10 : 35; reasons.push('It is raining now.'); }
  if (storm) { score -= 45; reasons.push('Storm risk makes this a poor choice.'); }
  if (wintry) { score -= 30; reasons.push('Wintry or icy conditions possible.'); }
  if (rainProb > task.rainProb) { score -= 20; reasons.push('Rain risk is higher than ideal.'); }
  if (maxWind > task.windMaxMph || maxGust > task.windMaxMph + 10) { score -= 18; reasons.push('Wind may be too strong.'); }
  if (temp < task.tempMinC) { score -= 16; reasons.push('It may be too cold.'); }
  if (temp > task.tempMaxC) { score -= 16; reasons.push('It may be too hot.'); }

  if (activityKey === 'grass') {
    if (rainPast24 > 2) { score -= 35; reasons.push('Grass is likely wet from recent rain.'); }
    if (isWinterRest(day, regionKey)) { score -= 20; reasons.push('Winter rest period — avoid mowing unless dry and mild.'); }
    if (isToday && new Date().getHours() >= 15) { score -= 22; reasons.push('Getting late for a useful grass cut.'); }
  }
  if (activityKey === 'washing') {
    if (best === 'No clear window') { score -= 35; reasons.push('Not enough dry daylight hours for washing to dry.'); }
    if (avgHumidity > 82) { score -= 18; reasons.push('High humidity — drying will be slow.'); }
  }
  if (activityKey === 'paint') {
    if (rainPast24 > 1) { score -= 35; reasons.push('Surfaces may still be damp from recent rain.'); }
    if (rainNext12 > 0.2) { score -= 35; reasons.push('Rain before paint can dry or cure.'); }
  }
  if (activityKey === 'washCar' || activityKey === 'windows') {
    if (rainNext12 > 0.5) { score -= 25; reasons.push('Rain likely soon — may not stay clean.'); }
    if (temp <= 2) { score -= 35; reasons.push('Near-freezing — washing may be unsafe.'); }
  }
  if (activityKey === 'run') {
    if (maxTemp >= 29) { score -= 45; reasons.push('Too hot for a safe run.'); }
    else if (maxTemp >= 22) { score -= 15; reasons.push('Heat may make running harder.'); }
  }
  if (activityKey === 'dog') {
    if (maxTemp >= 28) { score -= 45; reasons.push('Too hot for a safe dog walk.'); }
    else if (maxTemp >= 23) { score -= 20; reasons.push('Heat may be uncomfortable for dogs.'); }
  }

  if (best === 'No clear window') { score -= 20; reasons.push('No proper usable window found.'); }
  if (!reasons.length) reasons.push('Conditions look usable.');

  let status: DecisionStatus = 'GO';
  let css = '';
  if (score < 45) { status = 'NO-GO'; css = 'no'; }
  else if (score < 72) { status = 'CAUTION'; css = 'caution'; }

  const leadMap: Partial<Record<DecisionStatus, string>> = {
    'GO': 'Good conditions look likely.',
    'CAUTION': 'Possible, but check the details.',
    'NO-GO': 'Waiting is likely the better choice.',
  };
  const lead = leadMap[status] ?? 'Check the details before deciding.';

  return {
    status,
    css,
    best,
    reason: `${lead} ${reasons.slice(0, 3).join(' ')}`.trim(),
    why: reasons.slice(0, 5),
    rain: `${Math.round(rainProb)}% max`,
    windMph: maxWind,
    tempC: activityKey === 'jacket' ? minFeels : temp,
    score: scoreValue(status),
    date: day,
    label: dayLabel(day, regionKey),
  };
}

export function analyse(
  data: WeatherData,
  activityKey: ActivityKey,
  period: Period,
  regionKey: RegionKey,
): DecisionResult {
  const days = getTargetDays(data, period);
  const today = startOfDay(new Date());
  const results = days.map(d => analyseDay(data, activityKey, d, startOfDay(d).getTime() === today.getTime(), period, regionKey));
  const chosen = results.slice().sort((a, b) => b.score - a.score)[0] ?? results[0];
  if (period === 'weekend') chosen.reason = `Best weekend option: ${chosen.label}. ${chosen.reason}`;
  return chosen;
}
