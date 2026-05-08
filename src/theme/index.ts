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
  pageBg: string;       // Base background — near-true black
  pageBgTint: string;   // Slightly lifted background for contrast areas
  surfaceElevated: string; // Surface 2 — for sheets / popovers
  featureBg: string;    // Subtle accent-tinted dark for icon wells / highlights
  cardBg: string;       // Surface 1 — cards, inputs, list rows

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

// Pro-sports dark base — applied app-wide. Lifted off pure black for legibility.
const SURFACE_0 = '#101014';   // base page background — still dark, less black-hole
const SURFACE_1 = '#1C1C22';   // cards, inputs, list rows
const SURFACE_2 = '#26262E';   // sheets, popovers
const SURFACE_TINT = '#16161B';// contrast bands

const NEUTRAL = {
  textPrimary: '#FAFAFA',
  textSecondary: '#C4C4CC',
  textMuted: '#8A8A94',
  textInverse: '#101014',
  border: '#2E2E36',
  borderStrong: '#45454F',
  divider: '#22222A',
  cardBg: SURFACE_1,
  surfaceElevated: SURFACE_2,
  success: '#22C55E',
  successGreen: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerRed: '#EF4444',
  info: '#38BDF8',
  textOnPrimary: '#FAFAFA',
  textOnPrimaryMuted: 'rgba(250,250,250,0.7)',
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

// Mix `base` toward `target` by ratio (0..1).
function tint(base: string, target: string, ratio: number) {
  const a = base.replace('#', '');
  const b = target.replace('#', '');
  const ar = parseInt(a.substring(0, 2), 16);
  const ag = parseInt(a.substring(2, 4), 16);
  const ab = parseInt(a.substring(4, 6), 16);
  const br = parseInt(b.substring(0, 2), 16);
  const bg = parseInt(b.substring(2, 4), 16);
  const bb = parseInt(b.substring(4, 6), 16);
  const r = Math.round(ar + (br - ar) * ratio);
  const g = Math.round(ag + (bg - ag) * ratio);
  const bl = Math.round(ab + (bb - ab) * ratio);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

function build(opts: {
  primary: string;
  secondary: string;
  accent: string;
  secondaryGlowRgb: string;
  accentGlowRgb: string;
}): SportTheme {
  const primaryDark = shade(opts.primary, -0.35);
  const accentDark = shade(opts.accent, -0.25);

  // Dark hero gradient: near-black with a faint sport-tinted wash in the middle.
  const heroMid1 = tint(SURFACE_0, opts.primary, 0.35);
  const heroMid2 = tint(SURFACE_0, opts.secondary, 0.22);

  return {
    ...NEUTRAL,
    primary: opts.primary,
    primaryDark,
    secondary: opts.secondary,
    accent: opts.accent,
    accentDark,
    accentLight: `rgba(${opts.accentGlowRgb}, 0.14)`,
    accentGlow: `rgba(${opts.accentGlowRgb}, 0.55)`,
    secondaryGlow: `rgba(${opts.secondaryGlowRgb}, 0.4)`,
    pageBg: SURFACE_0,
    pageBgTint: SURFACE_TINT,
    featureBg: `rgba(${opts.accentGlowRgb}, 0.10)`,
    heroGradient: [SURFACE_0, heroMid1, heroMid2, SURFACE_0] as const,
    heroMobileGradient: [SURFACE_0, heroMid1, SURFACE_0] as const,
    headerGradient: [SURFACE_0, heroMid1] as const,
    accentGradient: [opts.accent, accentDark] as const,
    headerBg: SURFACE_0,
    tabBarActive: opts.accent,
  };
}

export const SPORT_THEMES: Record<string, SportTheme> = {
  'table-tennis': build({
    primary: '#1A365D',
    secondary: '#2B4C8C',
    accent: '#FF5500', // Cyber Orange — brand-default accent
    secondaryGlowRgb: '43, 76, 140',
    accentGlowRgb: '255, 85, 0',
  }),
  tennis: build({
    primary: '#1B5E20',
    secondary: '#2E7D32',
    accent: '#A3FF12',
    secondaryGlowRgb: '46, 125, 50',
    accentGlowRgb: '163, 255, 18',
  }),
  badminton: build({
    primary: '#4A148C',
    secondary: '#6A1B9A',
    accent: '#E000FF',
    secondaryGlowRgb: '106, 27, 154',
    accentGlowRgb: '224, 0, 255',
  }),
  squash: build({
    primary: '#7A1F00',
    secondary: '#C94C12',
    accent: '#FF8A1A',
    secondaryGlowRgb: '201, 76, 18',
    accentGlowRgb: '255, 138, 26',
  }),
  racquetball: build({
    primary: '#7A0035',
    secondary: '#B0003A',
    accent: '#FF1F6B',
    secondaryGlowRgb: '176, 0, 58',
    accentGlowRgb: '255, 31, 107',
  }),
  padel: build({
    primary: '#004D40',
    secondary: '#00796B',
    accent: '#00FFC2',
    secondaryGlowRgb: '0, 121, 107',
    accentGlowRgb: '0, 255, 194',
  }),
  pickleball: build({
    primary: '#7A3D00',
    secondary: '#C46C00',
    accent: '#FFD200',
    secondaryGlowRgb: '196, 108, 0',
    accentGlowRgb: '255, 210, 0',
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

// Sharper, engineered corners — pro-sports precision.
export const radii = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  pill: 999,
} as const;

// Bebas Neue → display/h1/scoreboard. Inter → body/UI.
export const fonts = {
  heading: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  display: 'BebasNeue_400Regular',
  heading600: 'Inter_600SemiBold',
  heading700: 'Inter_700Bold',
  heading800: 'Inter_800ExtraBold',
  heading900: 'Inter_900Black',
  body400: 'Inter_400Regular',
  body500: 'Inter_500Medium',
  body600: 'Inter_600SemiBold',
};

export const typography = {
  // The stadium-scoreboard headline — used for the rating number, app brand, hero titles.
  display: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '400' as const,
    letterSpacing: 1,
    fontFamily: fonts.display,
    textTransform: 'uppercase' as const,
  },
  scoreboard: {
    fontSize: 76,
    lineHeight: 82,
    fontWeight: '400' as const,
    letterSpacing: 2,
    fontFamily: fonts.display,
  },
  h1: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '400' as const,
    letterSpacing: 0.6,
    fontFamily: fonts.display,
    textTransform: 'uppercase' as const,
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
    fontWeight: '400' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    fontFamily: fonts.display,
  },
  button: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    fontFamily: fonts.heading700,
  },
};

// Shadows are mostly invisible on near-black surfaces — the dark-mode design
// leans on 1px borders for depth. Kept here for use on bright accent buttons
// and floating overlays that sit above the base.
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  // Card lift — kept as a subtle drop for sheets/floats only.
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;

// Colored glow — used for the rating number radiating cyber-orange off the screen.
export function coloredShadow(hex: string, intensity: 'sm' | 'md' | 'lg' = 'md') {
  const base = shadows[intensity];
  return { ...base, shadowColor: hex, shadowOpacity: 0.55, elevation: base.elevation + 2 };
}

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
};
