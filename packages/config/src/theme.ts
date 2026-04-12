// GameHub Design Token System
// Dark-mode-first, sports-themed

export const colors = {
  // Convenience aliases
  white: '#FFFFFF',
  black: '#000000',

  // Primary palette
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Dark navy backgrounds
  navy: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Accent green (success, attending, live)
  accent: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
  },

  // Warning amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },

  // Error red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  // Neutral grays
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
    1000: '#000000',
  },

  // Semantic aliases — dark mode
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceRaised: '#334155',
    surfaceOverlay: '#475569',
    border: '#334155',
    borderSubtle: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textDisabled: '#475569',
    textInverse: '#0F172A',
    icon: '#94A3B8',
    iconActive: '#3B82F6',
  },

  // Semantic aliases — light mode
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceRaised: '#F1F5F9',
    surfaceOverlay: '#E2E8F0',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    textDisabled: '#CBD5E1',
    textInverse: '#F8FAFC',
    icon: '#64748B',
    iconActive: '#2563EB',
  },

  // Sport-specific accent colors
  sport: {
    soccer: '#10B981',
    basketball: '#F59E0B',
    baseball: '#EF4444',
    softball: '#EC4899',
    lacrosse: '#8B5CF6',
    hockey: '#06B6D4',
    football: '#78350F',
    volleyball: '#F97316',
    tennis: '#84CC16',
    swimming: '#0EA5E9',
    other: '#6366F1',
  },

  // Provider brand colors
  provider: {
    teamsnap: '#EF4444',
    sportsengine: '#3B82F6',
    playmetrics: '#10B981',
    leagueapps: '#F59E0B',
    gamechanger: '#1D4ED8',
    band: '#6366F1',
    heja: '#059669',
    crossbar: '#DC2626',
    ics: '#64748B',
    email: '#8B5CF6',
    manual: '#94A3B8',
  },

  // RSVP status colors
  rsvp: {
    attending: '#10B981',
    notAttending: '#EF4444',
    maybe: '#F59E0B',
    pending: '#64748B',
  },

  // Transparent
  transparent: 'transparent',
} as const;

export const typography = {
  // Font families
  fontFamily: {
    sans: 'System',
    mono: 'Courier New',
  },

  // Font sizes (in logical pixels / rem equivalents)
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 15,
    lg: 17,
    xl: 19,
    '2xl': 22,
    '3xl': 26,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
    loose: 2.0,
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },

  // Preset text styles
  styles: {
    displayLarge: { fontSize: 48, fontWeight: '900', lineHeight: 1.2, letterSpacing: -0.8 },
    displayMedium: { fontSize: 40, fontWeight: '800', lineHeight: 1.2, letterSpacing: -0.4 },
    displaySmall: { fontSize: 32, fontWeight: '700', lineHeight: 1.35, letterSpacing: -0.4 },
    headingLarge: { fontSize: 26, fontWeight: '700', lineHeight: 1.35, letterSpacing: -0.4 },
    headingMedium: { fontSize: 22, fontWeight: '600', lineHeight: 1.35, letterSpacing: 0 },
    headingSmall: { fontSize: 19, fontWeight: '600', lineHeight: 1.5, letterSpacing: 0 },
    bodyLarge: { fontSize: 17, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0 },
    bodyMedium: { fontSize: 15, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0 },
    bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0 },
    labelLarge: { fontSize: 15, fontWeight: '600', lineHeight: 1.35, letterSpacing: 0.4 },
    labelMedium: { fontSize: 13, fontWeight: '600', lineHeight: 1.35, letterSpacing: 0.4 },
    labelSmall: { fontSize: 11, fontWeight: '600', lineHeight: 1.35, letterSpacing: 0.8 },
    caption: { fontSize: 11, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0.4 },
    overline: { fontSize: 11, fontWeight: '700', lineHeight: 1.35, letterSpacing: 1.6 },
    code: { fontSize: 13, fontWeight: '400', lineHeight: 1.65, letterSpacing: 0 },
  },
} as const;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
  24: 96,
} as const;

export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 24,
    elevation: 16,
  },
  // Colored glow shadows for dark mode
  primaryGlow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  accentGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  errorGlow: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const animation = {
  // Durations in milliseconds
  duration: {
    instant: 0,
    fastest: 80,
    faster: 120,
    fast: 180,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 700,
  },

  // Easing curves (CSS-compatible strings)
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Spring configs for React Native Reanimated / Animated
  spring: {
    gentle: { damping: 20, stiffness: 150, mass: 0.8 },
    responsive: { damping: 18, stiffness: 220, mass: 0.6 },
    bouncy: { damping: 12, stiffness: 300, mass: 0.7 },
    stiff: { damping: 30, stiffness: 400, mass: 1.0 },
  },
} as const;

// Full composed theme object
export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  animation,

  // Convenience semantic shorthands for dark mode (default)
  bg: colors.dark.background,
  surface: colors.dark.surface,
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  border: colors.dark.border,
  primary: colors.primary[500],
  accent: colors.accent[500],
  warning: colors.warning[500],
  error: colors.error[500],
} as const;

export type Theme = typeof theme;
export type ColorScheme = 'dark' | 'light';

// Returns semantic color values for a given color scheme
export function getSemanticColors(scheme: ColorScheme) {
  return scheme === 'dark' ? colors.dark : colors.light;
}

export default theme;
