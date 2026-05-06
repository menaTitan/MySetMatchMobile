import { Platform } from 'react-native';

export interface SportTheme {
  // --- Sport-specific palette ---
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  accentGlow: string;
  secondaryGlow: string;

  // --- Page / surfaces ---
  pageBg: string;
  pageBgTint: string;
  featureBg: string;
  cardBg: string;

  // --- Gradients (for LinearGradient: 2+ color arrays) ---
  heroGradient: readonly [string, string, string, string];
  heroMobileGradient: readonly [string, string, string];
  headerGradient: readonly [string, string];
  accentGradient: readonly [string, string];

  // --- Text ---
  textOnPrimary: string;
  textOnPrimaryMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // --- Borders / dividers ---
  border: string;
  borderStrong: string;
  divider: string;

  // --- Functional ---
  success: string;
  successGreen: string;
  warning: string;
  danger: string;
  dangerRed: string;
  info: string;

  // --- Legacy aliases (kept for existing screens) ---
  headerBg: string;
  tabBarActive: string;
}

const NEUTRAL = {
  textPrimary: '#1E293B',      // slate-800
  textSecondary: '#475569',    // slate-600
  textMuted: '#7F8C8D',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  divider: '#EDF2F7',
  cardBg: '#FFFFFF',
  success: '#27AE60',
  successGreen: '#22C55E',
  warning: '#F59E0B',
  danger: '#E74C3C',
  dangerRed: '#EF4444',
  info: '#3498DB',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryMuted: 'rgba(255,255,255,0.75)',
};

function shade(hex: string, amount: number) {
  // amount: -1..1 ; negative = darker, positive = lighter
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (c: number) => {
    const target = amount < 0 ? 0 : 255;
    return Math.round(c + (target - c) * Math.abs(amount));
  };
  const toHex = (c: number) => mix(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function build(opts: {
  primary: string;
  secondary: string;
  accent: string;
  pageBg: string;
  pageBgTint: string;
  secondaryGlowRgb: string;
  accentGlowRgb: string;
}): SportTheme {
  const primaryDark = shade(opts.primary, -0.2);
  const accentDark = shade(opts.accent, -0.25);
  return {
    ...NEUTRAL,
    primary: opts.primary,
    primaryDark,
    secondary: opts.secondary,
    accent: opts.accent,
    accentDark,
    accentLight: `rgba(${opts.accentGlowRgb}, 0.15)`,
    accentGlow: `rgba(${opts.accentGlowRgb}, 0.45)`,
    secondaryGlow: `rgba(${opts.secondaryGlowRgb}, 0.4)`,
    pageBg: opts.pageBg,
    pageBgTint: opts.pageBgTint,
    featureBg: `rgba(${opts.secondaryGlowRgb}, 0.1)`,
    heroGradient: [shade(opts.primary, -0.35), opts.primary, opts.secondary, shade(opts.primary, -0.15)] as const,
    heroMobileGradient: [shade(opts.primary, -0.3), opts.primary, opts.secondary] as const,
    headerGradient: [opts.secondary, opts.primary] as const,
    accentGradient: [opts.accent, accentDark] as const,
    headerBg: opts.primary,
    tabBarActive: opts.accent,
  };
}

export const SPORT_THEMES: Record<string, SportTheme> = {
  'table-tennis': build({
    primary: '#1A365D',
    secondary: '#2B4C8C',
    accent: '#FF9F1C',
    pageBg: '#F4F6F7',
    pageBgTint: '#EBF4FF',
    secondaryGlowRgb: '43, 76, 140',
    accentGlowRgb: '255, 159, 28',
  }),
  tennis: build({
    primary: '#1B5E20',
    secondary: '#2E7D32',
    accent: '#CDDC39',
    pageBg: '#F1F8E9',
    pageBgTint: '#E8F5E9',
    secondaryGlowRgb: '46, 125, 50',
    accentGlowRgb: '205, 220, 57',
  }),
  badminton: build({
    primary: '#4A148C',
    secondary: '#6A1B9A',
    accent: '#D500F9',
    pageBg: '#F5F0FF',
    pageBgTint: '#EDE7F6',
    secondaryGlowRgb: '106, 27, 154',
    accentGlowRgb: '213, 0, 249',
  }),
  squash: build({
    primary: '#7A1F00',
    secondary: '#C94C12',
    accent: '#FFB74D',
    pageBg: '#FFF8F5',
    pageBgTint: '#FBE9E7',
    secondaryGlowRgb: '201, 76, 18',
    accentGlowRgb: '255, 183, 77',
  }),
  racquetball: build({
    primary: '#7A0035',
    secondary: '#B0003A',
    accent: '#FF4081',
    pageBg: '#FFF5F8',
    pageBgTint: '#FCE4EC',
    secondaryGlowRgb: '176, 0, 58',
    accentGlowRgb: '255, 64, 129',
  }),
  padel: build({
    primary: '#004D40',
    secondary: '#00796B',
    accent: '#64FFDA',
    pageBg: '#F0FAFA',
    pageBgTint: '#E0F2F1',
    secondaryGlowRgb: '0, 121, 107',
    accentGlowRgb: '100, 255, 218',
  }),
  pickleball: build({
    primary: '#7A3D00',
    secondary: '#C46C00',
    accent: '#FFD740',
    pageBg: '#FFFBF0',
    pageBgTint: '#FFF8E1',
    secondaryGlowRgb: '196, 108, 0',
    accentGlowRgb: '255, 215, 64',
  }),
};

export const DEFAULT_THEME = SPORT_THEMES['table-tennis'];

export function getThemeForSlug(slug?: string | null): SportTheme {
  if (!slug) return DEFAULT_THEME;
  return SPORT_THEMES[slug] ?? DEFAULT_THEME;
}

/* ============================================================
   DESIGN TOKENS — spacing, radii, typography, shadows, motion
   ============================================================ */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

// System fonts. Android → Roboto; iOS → San Francisco. Loaded Inter overrides both.
export const fonts = {
  heading: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  heading600: 'Inter_600SemiBold',
  heading700: 'Inter_700Bold',
  heading800: 'Inter_800ExtraBold',
  heading900: 'Inter_900Black',
  body400: 'Inter_400Regular',
  body500: 'Inter_500Medium',
  body600: 'Inter_600SemiBold',
};

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
    fontFamily: fonts.heading900,
  },
  h1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
    fontFamily: fonts.heading800,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    fontFamily: fonts.heading700,
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700' as const,
    fontFamily: fonts.heading700,
  },
  h4: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    fontFamily: fonts.heading700,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    fontFamily: fonts.body400,
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
    fontFamily: fonts.body600,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    fontFamily: fonts.body400,
  },
  smallStrong: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
    fontFamily: fonts.body600,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    fontFamily: fonts.body500,
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    fontFamily: fonts.heading700,
  },
  button: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    fontFamily: fonts.heading700,
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  // Web parity: matches site.css `box-shadow: 0 10px 30px rgba(0,0,0,0.08)`.
  // The signature card lift used everywhere on the web.
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
} as const;

export function coloredShadow(hex: string, intensity: 'sm' | 'md' | 'lg' = 'md') {
  const base = shadows[intensity];
  return { ...base, shadowColor: hex, shadowOpacity: 0.25, elevation: base.elevation + 2 };
}

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
};
