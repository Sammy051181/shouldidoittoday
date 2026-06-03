import { WeatherData, DecisionResult, DecisionStatus } from '../types/weather';
import { Period, RegionKey } from '../types/activities';
import { buildRows, rowsBetween, sumPrecip, maxVal, avgVal } from '../services/weather';
import { startOfDay, makeTime, hoursAfter, hoursBefore, dayLabel, formatTimeHHMM } from '../utils/date';
import { REGIONS } from '../data/regions';

export function analysePlants(data: WeatherData, period: Period, regionKey: RegionKey): DecisionResult {
  const locale = REGIONS[regionKey].locale;
  const day = period === 'tomorrow'
    ? startOfDay(hoursAfter(startOfDay(new Date()), 24))
    : startOfDay(new Date());
  const isToday = period === 'today';
  const now = new Date();
  const allRows = buildRows(data);
  const start = makeTime(day, 6);
  const end = makeTime(day, 21);
  const base = isToday ? now : start;
  const useful = rowsBetween(allRows, isToday ? new Date(Math.max(start.getTime(), now.getTime())) : start, end)
    .filter(r => [6, 7, 8, 9, 18, 19, 20].includes(r.time.getHours()));
  const next24 = rowsBetween(allRows, base, hoursAfter(base, 24));
  const past24 = rowsBetween(allRows, hoursBefore(base, 24), base);
  const past72 = rowsBetween(allRows, hoursBefore(base, 72), base);

  const currentRain = isToday ? (data.current.precipitation || data.current.rain || 0) : 0;
  const maxTemp = maxVal(useful.map(r => r.temp), data.current.temperature_2m);
  const maxWind = maxVal(useful.map(r => r.wind), 0);
  const avgHumidity = avgVal(useful.map(r => r.humidity).filter((v): v is number => v !== null), 0);
  const rainNext24 = sumPrecip(next24);
  const rainPast24 = sumPrecip(past24);
  const rainPast72 = sumPrecip(past72);
  const soilRow = allRows.slice().reverse().find(r => r.time <= base && r.soil !== null);
  const soil = soilRow?.soil ?? null;

  // Find best window
  const good = (r: { precip: number; rainProb: number }) => r.precip < 0.1 && r.rainProb < 60;
  let run: typeof useful = [], best: typeof useful = [];
  for (const row of useful) {
    if (good(row)) run.push(row); else { if (run.length > best.length) best = run; run = []; }
  }
  if (run.length > best.length) best = run;
  const bestWindow = best.length
    ? `${formatTimeHHMM(best[0].time, locale)}–${formatTimeHHMM(new Date(best[best.length - 1].time.getTime() + 3600000), locale)}`
    : 'No clear window';

  let score = 42;
  const reasons: string[] = [];

  if (currentRain > 0) { score -= 35; reasons.push('It is raining now.'); }
  if (rainNext24 >= 2) { score -= 30; reasons.push('Useful rain expected in the next 24 hours.'); }
  else { score += 10; reasons.push('No useful rain expected soon.'); }
  if (rainPast24 >= 5) { score -= 32; reasons.push('There has been useful recent rain already.'); }
  else if (rainPast72 < 1) { score += 18; reasons.push('It has been fairly dry recently.'); }
  if (maxTemp >= 25) { score += 14; reasons.push('Warm conditions dry pots and baskets faster.'); }
  else if (maxTemp < 15) { score -= 18; reasons.push('Cooler conditions — established plants may need less water.'); }
  if (maxWind >= 18) { score += 8; reasons.push('Wind can dry pots and surface soil faster.'); }
  if (avgHumidity < 50 && avgHumidity > 0) { score += 8; reasons.push('Lower humidity dries plants and soil faster.'); }
  if (soil !== null && soil < 0.22) { score += 16; reasons.push('Near-surface soil moisture looks low.'); }

  let status: DecisionStatus = 'CHECK SOIL';
  let css = 'caution';
  if (score >= 76 && rainNext24 < 2 && currentRain <= 0) { status = 'WATER'; css = ''; }
  if (score < 45) { status = 'WAIT'; css = 'no'; }

  const recMap: Partial<Record<DecisionStatus, string>> = {
    'WATER': 'Water deeply during the best window. Prioritise pots, baskets and new plants.',
    'WAIT': 'Wait for now unless pots or new plants are visibly dry. Check soil first.',
    'CHECK SOIL': 'Check the soil. Water pots, baskets and new plants if the soil feels dry.',
  };

  return {
    status, css,
    best: bestWindow,
    reason: `${recMap[status] ?? ''} ${reasons.slice(0, 2).join(' ')}`.trim(),
    why: reasons.slice(0, 5),
    rain: `${Math.round(maxVal(useful.map(r => r.rainProb), 0))}% max`,
    windMph: maxWind,
    tempC: maxTemp,
    score: status === 'WATER' ? 3 : status === 'CHECK SOIL' ? 2 : 1,
    date: day,
    label: dayLabel(day, regionKey),
  };
}
