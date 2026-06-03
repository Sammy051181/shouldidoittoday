export interface WeatherRow {
  time: Date;
  temp: number;
  apparent: number;
  precip: number;
  rainProb: number;
  weatherCode: number;
  wind: number;
  gust: number;
  humidity: number | null;
  cloud: number;
  evap: number;
  soil: number | null;
}

export interface WeatherData {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    relative_humidity_2m: number[];
    cloud_cover: number[];
    evapotranspiration: number[];
    soil_moisture_1_to_3cm: number[];
    uv_index: number[];
  };
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
  timezone: string;
}

export type DecisionStatus = 'GO' | 'CAUTION' | 'WARNING' | 'NO-GO'
  | 'WATER' | 'CHECK SOIL' | 'WAIT'
  | 'TAKE ONE' | 'MAYBE' | 'NO';

export interface DecisionResult {
  status: DecisionStatus;
  css: string;
  best: string;
  reason: string;
  why: string[];
  rain: string;
  windMph: number;
  tempC: number;
  score: number;
  date: Date;
  label: string;
}

export interface GeocodedPlace {
  latitude: number;
  longitude: number;
  name: string;
  countryCode: string | null;
}
