export const colors = {
  bg: '#000000',
  navigation: '#000000',
  chart: '#080808',
  section: '#080808',
  surface: '#0D0D0D',
  surfaceRaised: '#111111',
  control: '#161616',
  divider: '#232323',
  dividerSoft: '#181818',
  text: '#F4F4F4',
  textMuted: '#858585',
  textFaint: '#575757',
  positive: '#08B996',
  negative: '#F04A59',
  overviewPositive: '#089981',
  overviewNegative: '#F23645',
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
  pill: 999,
} as const;

export const typography = {
  family: 'MonaSans',
  medium: 'MonaSans-Medium',
  semibold: 'MonaSans-SemiBold',
  bold: 'MonaSans-Bold',
  mono: 'RobotoMono-Medium',
  monoSemibold: 'RobotoMono-SemiBold',
  monoBold: 'RobotoMono-Bold',
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
