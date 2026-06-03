import { RegionKey } from '../types/activities';

export interface RegionConfig {
  name: string;
  locale: string;
  tempUnit: 'C' | 'F';
  windUnit: 'mph' | 'kmh';
  placeholder: string;
  countryCode: string;
}

export const REGIONS: Record<RegionKey, RegionConfig> = {
  UK: { name: 'UK', locale: 'en-GB', tempUnit: 'C', windUnit: 'mph', placeholder: 'Postcode, town or city', countryCode: 'GB' },
  IE: { name: 'Ireland', locale: 'en-IE', tempUnit: 'C', windUnit: 'kmh', placeholder: 'Town, city or area', countryCode: 'IE' },
  US: { name: 'US', locale: 'en-US', tempUnit: 'F', windUnit: 'mph', placeholder: 'ZIP code, city or state', countryCode: 'US' },
  CA: { name: 'Canada', locale: 'en-CA', tempUnit: 'C', windUnit: 'kmh', placeholder: 'Postal code, town or city', countryCode: 'CA' },
  AU: { name: 'Australia', locale: 'en-AU', tempUnit: 'C', windUnit: 'kmh', placeholder: 'Postcode, suburb or city', countryCode: 'AU' },
  NZ: { name: 'New Zealand', locale: 'en-NZ', tempUnit: 'C', windUnit: 'kmh', placeholder: 'Postcode, town or city', countryCode: 'NZ' },
};
