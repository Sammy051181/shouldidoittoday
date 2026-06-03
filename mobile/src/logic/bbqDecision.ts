import { WeatherData, DecisionResult, DecisionStatus } from '../types/weather';
import { Period, RegionKey } from '../types/activities';
import { buildRows, rowsBetween, sumPrecip, maxVal, isStorm } from '../services/weather';
import { startOfDay, makeTime, hoursAfter, hoursBefore, dayLabel, getWeekendDays, formatTimeHHMM } from '../utils/date';
import { REGIONS } from '../data/regions';

const BBQ_RULES = { rainProb: 40, windMaxMph: 28, tempMinC: 10, tempMaxC: 34, hours: [11, 21] as [number, number], minHours: 2 };

function findWindow(rows: typeof buildRows extends (...args: unknown[]) => (infer R)[] ? R[] : never[], predicate: (r: { rainProb: number; precip: number; wind: number; temp: number; time: Date }) => boolean, locale: string): string {
  const typed = rows as { rainProb: number; precip: number; wind: number; gust: number; temp: number; time: Date }[];
  let run: typeof typed = [], best: typeof typed = [];
  for (const row of typed) {
    if (predicate(row)) run.push(row); else { if (run.length > best.length) best = run; run = []; }
  }
  if (run.length > best.length) best = run;
  if (best.length < BBQ_RULES.minHours) return 'No clear window';
  const end = new Date(best[best.length - 1].time.getTime() + 3600000);
  return `${formatTimeHHMM(best[0].time, locale)}–${formatTimeHHMM(end, locale)}`;
}

export function analyseBbq(data: WeatherData, period: Period, regionKey: RegionKey): DecisionResult {
  const locale = REGIONS[regionKey].locale;
  const days = period === 'today' ? [startOfDay(new Date())]
    : period === 'tomorrow' ? [startOfDay(hoursAfter(startOfDay(new Date()), 24))]
    : getWeekendDays();

  const allRows = buildRows(data);
  let bestResult: DecisionResult | null = null;

  for (const day of days) {
    const isToday = startOfDay(day).getTime() === startOfDay(new Date()).getTime();
    const now = new Date();
    const start = makeTime(day, BBQ_RULES.hours[0]);
    const end = makeTime(day, BBQ_RULES.hours[1]);
    const useful = rowsBetween(allRows, isToday ? new Date(Math.max(start.getTime(), now.getTime())) : start, end)
      .filter(r => r.time.getHours() >= 12 && r.time.getHours() <= 21);
    const base = isToday ? now : start;
    const next12 = rowsBetween(allRows, base, hoursAfter(base, 12));

    const storm = isStorm(useful) || isStorm(next12);
    const maxGust = maxVal(useful.map(r => r.gust), 0);
    const rainProb = maxVal(useful.map(r => r.rainProb), 0);
    const rainTotal = sumPrecip(useful);
    const temp = useful.length ? useful.reduce((s, r) => s + r.temp, 0) / useful.length : data.current.temperature_2m;
    const maxWind = maxVal(useful.map(r => r.wind), 0);

    const reasons: string[] = [];
    let score = 100;

    const good = (r: { rainProb: number; precip: number; wind: number; temp: number }) =>
      r.rainProb <= BBQ_RULES.rainProb && r.precip < 0.2 &&
      r.wind <= BBQ_RULES.windMaxMph && r.temp >= BBQ_RULES.tempMinC && r.temp <= BBQ_RULES.tempMaxC;
    const best = findWindow(useful as Parameters<typeof findWindow>[0], good, locale);

    if (storm) { score -= 55; reasons.unshift('Thunder, lightning or storm risk is a serious safety concern.'); }
    if (maxGust > 38) { score -= 35; reasons.push('Very strong gusts could make outdoor cooking unsafe.'); }
    else if (maxGust > 28) { score -= 18; reasons.push('Gusts may make BBQ setup less comfortable.'); }
    if (rainProb > BBQ_RULES.rainProb) { score -= 20; reasons.push('Rain risk is higher than ideal.'); }
    if (rainTotal > 2) { score -= 18; reasons.push('Rain may make outdoor cooking less comfortable.'); }
    if (best === 'No clear window') { score -= 25; reasons.push('No clean lunch or evening window.'); }
    if (temp < BBQ_RULES.tempMinC) { score -= 16; reasons.push('It may be too cold for a BBQ.'); }
    if (!reasons.length) reasons.push('Good conditions for outdoor cooking.');

    let status: DecisionStatus = 'GO';
    let css = '';
    if (storm || maxGust > 40) { status = 'WARNING'; css = 'no'; }
    else if (score < 72) { status = 'CAUTION'; css = 'caution'; }

    const result: DecisionResult = {
      status, css, best,
      reason: reasons.slice(0, 3).join(' '),
      why: reasons.slice(0, 5),
      rain: `${Math.round(rainProb)}% max`,
      windMph: maxWind,
      tempC: temp,
      score: status === 'GO' ? 3 : status === 'CAUTION' ? 2 : 1,
      date: day,
      label: dayLabel(day, regionKey),
    };

    if (!bestResult || result.score > bestResult.score) bestResult = result;
  }

  return bestResult!;
}
