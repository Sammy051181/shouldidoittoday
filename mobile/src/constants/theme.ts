export const Colors = {
  // Brand blues
  blue: '#2563eb',
  blueLight: '#eff6ff',
  blueMid: '#bfdbfe',
  blueDark: '#1d4ed8',
  navy: '#0f172a',

  // Status
  go: '#16a34a',
  goBg: '#f0fdf4',
  goBorder: 'rgba(22,163,74,0.2)',

  caution: '#d97706',
  cautionBg: '#fffbeb',
  cautionBorder: 'rgba(217,119,6,0.2)',

  warning: '#dc2626',
  warningBg: '#fef2f2',
  warningBorder: 'rgba(220,38,38,0.2)',

  water: '#2563eb',
  waterBg: '#eff6ff',

  // Neutrals
  ink: '#0f172a',
  soft: '#1e3a5f',
  muted: '#64748b',
  line: '#dbeafe',
  bg: '#f0f7ff',
  card: '#ffffff',
  white: '#ffffff',
} as const;

export const Typography = {
  h1: 32,
  h2: 24,
  h3: 18,
  h4: 16,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  heavy: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
