import { Platform } from 'react-native';

export const colors = {
  bg: '#000000',
  navigation: '#050506',
  section: '#0C0D0F',
  surface: '#121316',
  surfaceRaised: '#181A1F',
  control: '#1C1E23',
  divider: '#24272C',
  dividerSoft: '#17191D',
  text: '#F5F6F7',
  textMuted: '#8B9099',
  textFaint: '#555B65',
  positive: '#00C891',
  negative: '#F24F69',
  overlay: 'rgba(0,0,0,0.82)',
  white: '#FFFFFF',
} as const;

export const spacing = {
  page: 16,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  sheet: 18,
} as const;

export const typography = {
  family: Platform.select({ android: 'sans-serif', ios: 'System', default: 'system-ui' }),
  mono: Platform.select({ android: 'monospace', ios: 'Menlo', default: 'monospace' }),
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const layout = {
  header: 52,
  search: 42,
  touch: 44,
  marketRow: 66,
  entity: 42,
  nav: 58,
} as const;
