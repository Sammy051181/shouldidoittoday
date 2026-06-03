import { GeocodedPlace } from '../types/weather';
import { RegionKey } from '../types/activities';

const UK_ALIASES: Record<string, GeocodedPlace> = {
  'trowbridge': { latitude: 51.3186, longitude: -2.2080, name: 'Trowbridge, Wiltshire, GB', countryCode: 'GB' },
  'bradford on avon': { latitude: 51.3470, longitude: -2.2527, name: 'Bradford-on-Avon, Wiltshire, GB', countryCode: 'GB' },
};

function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ').replace(/\s+/g, ' ');
}

function looksLikeUkPostcode(v: string): boolean {
  const c = v.trim().toUpperCase().replace(/\s/g, '');
  return /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/.test(c) || /^[A-Z]{1,2}[0-9][A-Z0-9]?$/.test(c);
}

function looksLikeUsZip(v: string): boolean {
  return /^[0-9]{5}(-[0-9]{4})?$/.test(v.trim());
}

function looksLikeCanadaPostal(v: string): boolean {
  const c = v.trim().toUpperCase().replace(/\s/g, '');
  return /^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$/.test(c) || /^[A-Z][0-9][A-Z]$/.test(c);
}

function looksLikeAuNzPostcode(v: string): boolean {
  return /^[0-9]{4}$/.test(v.trim());
}

async function geocodeUkPostcode(q: string): Promise<GeocodedPlace> {
  const cleaned = q.trim().toUpperCase().replace(/\s/g, '');
  const isFull = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/.test(cleaned);
  if (isFull) {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`);
    if (r.ok) {
      const d = await r.json();
      if (d.result) return {
        latitude: d.result.latitude,
        longitude: d.result.longitude,
        countryCode: 'GB',
        name: [d.result.postcode, d.result.admin_district, 'GB'].filter(Boolean).join(', '),
      };
    }
  }
  const outcode = cleaned.replace(/[0-9][A-Z]{2}$/, '');
  const r = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`);
  if (r.ok) {
    const d = await r.json();
    if (d.result) return {
      latitude: d.result.latitude,
      longitude: d.result.longitude,
      countryCode: 'GB',
      name: [d.result.outcode, Array.isArray(d.result.admin_district) ? d.result.admin_district[0] : d.result.admin_district, 'GB'].filter(Boolean).join(', '),
    };
  }
  throw new Error('Postcode not found. Try a full postcode or nearby town.');
}

async function geocodeZip(q: string, country: string): Promise<GeocodedPlace> {
  let postal = q.trim().toUpperCase().replace(/\s/g, '');
  if (country === 'US') postal = postal.slice(0, 5);
  const attempts = [postal];
  if (country === 'CA' && postal.length > 3) attempts.push(postal.slice(0, 3));
  for (const attempt of attempts) {
    const r = await fetch(`https://api.zippopotam.us/${country}/${encodeURIComponent(attempt)}`);
    if (!r.ok) continue;
    const d = await r.json();
    const p = d.places?.[0];
    if (p) return {
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      countryCode: country,
      name: [p['place name'], p.state, country].filter(Boolean).join(', '),
    };
  }
  throw new Error('Postal code not found. Try a nearby town or city.');
}

async function searchOpenMeteoGeocoding(variant: string, preferredCountry: string): Promise<GeocodedPlace | null> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(variant)}&count=10&language=en&format=json`);
  if (!r.ok) return null;
  const d = await r.json();
  if (!d.results?.length) return null;
  const countryMatches = d.results.filter((x: { country_code: string }) => x.country_code === preferredCountry);
  const best = countryMatches.length ? countryMatches[0] : d.results[0];
  return {
    latitude: best.latitude,
    longitude: best.longitude,
    countryCode: best.country_code,
    name: [best.name, best.admin1, best.country_code].filter(Boolean).join(', '),
  };
}

export async function geocode(query: string, regionKey: RegionKey): Promise<GeocodedPlace> {
  const trimmed = query.trim();
  const COUNTRY_CODES: Record<RegionKey, string> = { UK: 'GB', IE: 'IE', US: 'US', CA: 'CA', AU: 'AU', NZ: 'NZ' };
  const preferred = COUNTRY_CODES[regionKey];

  // Local aliases
  if (regionKey === 'UK') {
    const alias = UK_ALIASES[normalise(trimmed)];
    if (alias) return alias;
  }

  // Postcode/ZIP shortcuts
  if (regionKey === 'UK' && looksLikeUkPostcode(trimmed)) return geocodeUkPostcode(trimmed);
  if (regionKey === 'US' && looksLikeUsZip(trimmed)) return geocodeZip(trimmed, 'US');
  if (regionKey === 'CA' && looksLikeCanadaPostal(trimmed)) return geocodeZip(trimmed, 'CA');
  if ((regionKey === 'AU' || regionKey === 'NZ') && looksLikeAuNzPostcode(trimmed)) return geocodeZip(trimmed, preferred);

  // Build search variants
  const variants = [trimmed];
  if (regionKey === 'UK') {
    variants.push(`${trimmed}, UK`, `${trimmed}, England`, `${trimmed}, Scotland`, `${trimmed}, Wales`);
  }

  for (const variant of variants) {
    const result = await searchOpenMeteoGeocoding(variant, preferred);
    if (result) return result;
  }

  throw new Error("Couldn't find that location. Try a town, city or postcode.");
}

export async function reverseGeocode(lat: number, lon: number, timezone: string): Promise<{ name: string; countryCode: string | null }> {
  if (timezone === 'Europe/London') {
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&limit=1`);
      if (r.ok) {
        const d = await r.json();
        const p = d.result?.[0];
        if (p) return { name: [p.admin_district, p.region, 'GB'].filter(Boolean).join(', '), countryCode: 'GB' };
      }
    } catch {}
  }
  return { name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, countryCode: null };
}
