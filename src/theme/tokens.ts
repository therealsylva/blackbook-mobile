export const colors = {
  bg: '#000000',
  navigation: '#050506',
  surface: '#17181B',
  surfaceRaised: '#1A1B1F',
  divider: '#1D2025',
  text: '#F5F6F7',
  textMuted: '#808690',
  textFaint: '#4C5159',
  accent: '#F5F6F7',
  accentSoft: '#202226',
  positive: '#00C087',
  negative: '#FF4D67',
  overlay: 'rgba(0,0,0,0.76)',
  white: '#FFFFFF',
} as const;

export const spacing = {
  page: 18,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const typography = {
  regular: 'MonaSansRegular',
  medium: 'MonaSansMedium',
  semibold: 'MonaSansSemiBold',
  bold: 'MonaSansBold',
  mono: 'monospace',
} as const;
