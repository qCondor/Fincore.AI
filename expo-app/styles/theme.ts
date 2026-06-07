export const colors = {
  primary: '#005FCC',
  primaryDark: '#004FB0',
  accent: '#00C2FF',
  secondary: '#2F80ED',
  tertiary: '#56CCF2',

  textDark: '#1D1D1F',
  textMuted: '#6E6E73',
  textLight: '#AEAEB2',

  success: '#22C55E',
  successDark: '#166534',
  warning: '#F59E0B',
  warningDark: '#92400E',
  error: '#EF4444',
  errorDark: '#991B1B',

  glass: 'rgba(255,255,255,0.15)',
  glassBorder: 'rgba(255,255,255,0.2)',
  glassLight: 'rgba(255,255,255,0.95)',

  white: '#FFFFFF',
  black: '#000000',
};

export const gradients = {
  main: ['#56CCF2', '#2F80ED', '#005FCC'] as const,
  avatar: ['#005FCC', '#00C2FF'] as const,
  card: ['#FFFFFF', '#F8FAFC'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const typography = {
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
};
