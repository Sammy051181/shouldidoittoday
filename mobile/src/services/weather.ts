import { WeatherData, WeatherRow } from '../types/weather';

export async function getWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: 'temperature_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,cloud_cover,evapotranspiration,soil_moisture_1_to_3cm,uv_index',
    current: 'temperature_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m',
    daily: 'sunrise,sunset',
    timezone: 'auto',
    forecast_days: '10',
    past_days: '3',
    wind_speed_unit: 'mph',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Weather check failed. Please try again.');
  return res.json();
}

export function buildRows(data: WeatherData): WeatherRow[] {
  return data.hourly.time.map((t, i) => ({
    time: new Date(t),
    temp: data.hourly.temperature_2m[i] ?? 0,
    apparent: data.hourly.apparent_temperature?.[i] ?? data.hourly.temperature_2m[i] ?? 0,
    precip: data.hourly.precipitation[i] ?? 0,
    rainProb: data.hourly.precipitation_probability[i] ?? 0,
    weatherCode: data.hourly.weather_code?.[i] ?? 0,
    wind: data.hourly.wind_speed_10m[i] ?? 0,
    gust: data.hourly.wind_gusts_10m?.[i] ?? 0,
    humidity: data.hourly.relative_humidity_2m?.[i] ?? null,
    cloud: data.hourly.cloud_cover?.[i] ?? 0,
    evap: data.hourly.evapotranspiration?.[i] ?? 0,
    soil: data.hourly.soil_moisture_1_to_3cm?.[i] ?? null,
  }));
}

export function isStorm(rows: WeatherRow[]): boolean {
  return rows.some(r => r.weatherCode >= 95);
}

export function isWintry(rows: WeatherRow[]): boolean {
  return rows.some(r => [56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(r.weatherCode));
}

export function rowsBetween(rows: WeatherRow[], a: Date, b: Date): WeatherRow[] {
  return rows.filter(r => r.time >= a && r.time <= b);
}

export function sumPrecip(rows: WeatherRow[]): number {
  return rows.reduce((t, r) => t + r.precip, 0);
}

export function avgVal(arr: number[], fallback = 0): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : fallback;
}

export function maxVal(arr: number[], fallback = 0): number {
  return arr.length ? Math.max(...arr) : fallback;
}

export function minVal(arr: number[], fallback = 0): number {
  return arr.length ? Math.min(...arr) : fallback;
}
