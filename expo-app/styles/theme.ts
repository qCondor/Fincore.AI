/**
 * Single source of truth for colour.
 *
 * Token names are SEMANTIC (role-based), not descriptive: `textSecondary`,
 * not `white80`. Dark mode swaps the values under these same names, so a
 * component that reads `t.textSecondary` needs no change when the palette
 * flips.
 *
 * The white-alpha values are grouped by the role they actually serve
 * (surface fill / border-glass / text), which is why several near-identical
 * opacities collapse into one token. Grouping is capped so no source value
 * moves by more than 0.05 alpha.
 */

export interface Palette {
  // ── Base ────────────────────────────────────────────────────────────────
  /** Screen background behind the wave gradient. */
  background: string;
  /** Solid brand blue — primary buttons, active segments, key accents. */
  primary: string;
  /** Pressed/darker variant of primary. */
  primaryDark: string;
  /**
   * Brand blue for TEXT/ICONS sitting on a card surface. Split from
   * `primary` because in dark mode a fill dark enough for white button
   * text is too dark to read as a link, and vice versa.
   */
  primaryOnSurface: string;
  /** Bright cyan accent — gradient partner, highlight dots. */
  accent: string;
  /** Mid blue — links, secondary emphasis on light surfaces. */
  secondary: string;
  /** Light blue — top stop of the main background gradient. */
  tertiary: string;
  /** Saturated cyan used for small "live"/emphasis dots. */
  accentBright: string;

  // ── Surfaces (light cards floating on the blue gradient) ────────────────
  /** Near-opaque white card. */
  surfaceCard: string;
  /** Slightly translucent raised surface. */
  surfaceRaised: string;
  /** Neutral inset panel on a light card (e.g. image placeholder). */
  surfaceInset: string;
  /** Neutral divider fill on light cards. */
  surfaceNeutral: string;
  surfaceNeutralAlt: string;
  /** Opaque dark panel used by modals. */
  surfaceModal: string;

  // ── Glass overlays (white alpha, used for fills and borders) ────────────
  overlayHairline: string;
  overlayFaint: string;
  overlaySubtle: string;
  overlayMedium: string;
  overlayStrong: string;
  /** High-alpha white border on light cards. */
  overlayBorder: string;

  // ── Text on the dark/blue background ────────────────────────────────────
  textPrimary: string;
  textNear: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textFaint: string;
  textGhost: string;

  // ── Text on light surfaces (cards, modals) ──────────────────────────────
  textOnSurface: string;
  textOnSurfaceStrong: string;
  textOnSurfaceSecondary: string;
  textOnSurfaceMuted: string;
  textOnSurfaceFaint: string;
  textOnSurfaceSubtle: string;
  /** Body copy inside the Coming Soon modal family. */
  textOnLightBody: string;
  textOnLightMuted: string;
  textOnLightHeading: string;
  textOnLightSubheading: string;

  // ── Status ──────────────────────────────────────────────────────────────
  success: string;
  successAlt: string;
  successText: string;
  successSurface: string;
  successTint: string;
  successTintStrong: string;
  successBorder: string;
  successOnDark: string;
  warning: string;
  warningAlt: string;
  warningText: string;
  warningSurface: string;
  warningBorder: string;
  danger: string;
  dangerAlt: string;
  dangerStrong: string;
  dangerText: string;
  dangerSurface: string;
  dangerBorder: string;
  dangerTint: string;
  info: string;
  infoAlt: string;
  /** Torch/flash "on" highlight. */
  highlight: string;
  highlightTint: string;

  // ── Shadows / scrims (black alpha) ──────────────────────────────────────
  /** Base colour for `shadowColor` (iOS applies its own opacity). */
  shadowBase: string;
  shadowSoft: string;
  shadowSoftAlt: string;
  shadowMedium: string;
  shadowStrong: string;
  scrim: string;
  scrimStrong: string;
  shadowBrand: string;
  shadowBrandSoft: string;

  // ── Brand-blue alpha tints (on light surfaces) ──────────────────────────
  primaryTintHairline: string;
  primaryTintFaint: string;
  primaryTintSubtle: string;
  primaryTintMedium: string;
  primaryTintMediumAlt: string;
  primaryTintStrong: string;
  primaryTintStronger: string;
  primaryTintBorder: string;
  accentTint: string;
  accentTintSubtle: string;
  secondaryTint: string;
  secondaryTintStrong: string;

  // ── Misc one-offs with a real role ──────────────────────────────────────
  /** Deep navy used for the auth-card scrim on the login screen. */
  authScrim: string;
  /** Deep-blue text shadow on the splash wordmark. */
  textShadowBrand: string;
  /** Frosted near-white sheet. */
  sheet: string;
  /** Muted slate for inactive tab icons. */
  iconInactive: string;

  // ── Native chrome (driven by the palette rather than hardcoded) ─────────
  /** expo-status-bar `style`. Both palettes are dark-background designs. */
  statusBarStyle: 'light' | 'dark';
  /** expo-blur `tint` for the frosted overlays. */
  blurTint: 'light' | 'dark' | 'default';
}

export const lightPalette: Palette = {
  background: '#005FCC',
  primary: '#005FCC',
  primaryDark: '#004FB0',
  primaryOnSurface: '#005FCC',
  accent: '#00C2FF',
  secondary: '#2F80ED',
  tertiary: '#56CCF2',
  accentBright: '#00E0FF',

  surfaceCard: 'rgba(255,255,255,0.95)',
  surfaceRaised: 'rgba(255,255,255,0.88)',
  surfaceInset: '#F5F7FA',
  surfaceNeutral: '#F0F0F0',
  surfaceNeutralAlt: '#F5F5F5',
  surfaceModal: '#1A1A2E',

  overlayHairline: 'rgba(255,255,255,0.08)',
  overlayFaint: 'rgba(255,255,255,0.1)',
  overlaySubtle: 'rgba(255,255,255,0.15)',
  overlayMedium: 'rgba(255,255,255,0.2)',
  overlayStrong: 'rgba(255,255,255,0.3)',
  overlayBorder: 'rgba(255,255,255,0.8)',

  textPrimary: '#FFFFFF',
  textNear: 'rgba(255,255,255,0.9)',
  textSecondary: 'rgba(255,255,255,0.8)',
  textTertiary: 'rgba(255,255,255,0.74)',
  textMuted: 'rgba(255,255,255,0.6)',
  textFaint: 'rgba(255,255,255,0.5)',
  textGhost: 'rgba(255,255,255,0.38)',

  textOnSurface: '#1A1A1A',
  textOnSurfaceStrong: '#1D1D1F',
  textOnSurfaceSecondary: '#666666',
  textOnSurfaceMuted: '#6E6E73',
  textOnSurfaceFaint: '#AEAEB2',
  textOnSurfaceSubtle: '#999999',
  textOnLightBody: '#444444',
  textOnLightMuted: '#4F627A',
  textOnLightHeading: '#0F2A4A',
  textOnLightSubheading: '#34506F',

  success: '#34C759',
  successAlt: '#30D158',
  successText: '#166534',
  successSurface: 'rgba(34,197,94,0.1)',
  successTint: 'rgba(52,199,89,0.18)',
  successTintStrong: 'rgba(52,199,89,0.2)',
  successBorder: 'rgba(34,197,94,0.3)',
  successOnDark: '#B7F6C4',
  warning: '#FF9F0A',
  warningAlt: '#FECA57',
  warningText: '#92400E',
  warningSurface: 'rgba(245,158,11,0.1)',
  warningBorder: 'rgba(245,158,11,0.3)',
  danger: '#FF453A',
  dangerAlt: '#FF6B6B',
  dangerStrong: '#FF3B30',
  dangerText: '#991B1B',
  dangerSurface: 'rgba(239,68,68,0.1)',
  dangerBorder: 'rgba(239,68,68,0.3)',
  dangerTint: 'rgba(255,69,58,0.2)',
  info: '#5AC8FA',
  infoAlt: '#007AFF',
  highlight: '#FFD60A',
  highlightTint: 'rgba(255,214,10,0.3)',

  shadowBase: '#000000',
  shadowSoft: 'rgba(0,0,0,0.06)',
  shadowSoftAlt: 'rgba(0,0,0,0.08)',
  shadowMedium: 'rgba(0,0,0,0.18)',
  shadowStrong: 'rgba(0,0,0,0.32)',
  scrim: 'rgba(0,0,0,0.6)',
  scrimStrong: 'rgba(4,24,51,0.72)',
  shadowBrand: 'rgba(0,95,204,0.35)',
  shadowBrandSoft: 'rgba(0,95,204,0.2)',

  primaryTintHairline: 'rgba(0,95,204,0.05)',
  primaryTintFaint: 'rgba(0,95,204,0.08)',
  primaryTintSubtle: 'rgba(0,95,204,0.1)',
  primaryTintMedium: 'rgba(0,95,204,0.18)',
  primaryTintMediumAlt: 'rgba(0,95,204,0.16)',
  primaryTintStrong: 'rgba(0,95,204,0.4)',
  primaryTintStronger: 'rgba(0,95,204,0.5)',
  primaryTintBorder: 'rgba(0,95,204,0.3)',
  accentTint: 'rgba(0,194,255,0.2)',
  accentTintSubtle: 'rgba(0,194,255,0.15)',
  secondaryTint: 'rgba(47,128,237,0.08)',
  secondaryTintStrong: 'rgba(47,128,237,0.5)',

  authScrim: 'rgba(15,42,74,0.45)',
  textShadowBrand: 'rgba(0,60,160,0.4)',
  sheet: 'rgba(248,251,255,0.98)',
  iconInactive: '#999999',

  statusBarStyle: 'light',
  blurTint: 'dark',
};

/**
 * Dark palette.
 *
 * Design intent: the app's identity is its blue gradient, so dark mode is
 * deep navy / near-black *blue* — never neutral grey on black. Brand blues
 * brighten (they sit on dark ground now, not light); the "on light surface"
 * text tokens invert, because those surfaces are dark cards here.
 */
export const darkPalette: Palette = {
  background: '#071426',
  primary: '#1E6FD6',
  primaryDark: '#1857AC',
  primaryOnSurface: '#4D9BFF',
  accent: '#3DD5FF',
  secondary: '#4D9BFF',
  tertiary: '#5FD3F5',
  accentBright: '#3FE8FF',

  // Cards are deep navy panels rather than white sheets.
  surfaceCard: 'rgba(32,52,78,0.96)',
  surfaceRaised: 'rgba(40,63,92,0.96)',
  surfaceInset: '#0E1B2C',
  surfaceNeutral: '#1B2C42',
  surfaceNeutralAlt: '#203247',
  surfaceModal: '#16263B',

  // White glass still reads correctly on navy, just at lower alpha.
  overlayHairline: 'rgba(255,255,255,0.06)',
  overlayFaint: 'rgba(255,255,255,0.08)',
  overlaySubtle: 'rgba(255,255,255,0.12)',
  overlayMedium: 'rgba(255,255,255,0.16)',
  overlayStrong: 'rgba(255,255,255,0.24)',
  // A near-opaque white border would glare on dark; borders go subtle.
  overlayBorder: 'rgba(255,255,255,0.14)',

  // Slightly off-white reduces glare against a near-black ground.
  textPrimary: '#F2F6FB',
  textNear: 'rgba(242,246,251,0.92)',
  textSecondary: 'rgba(242,246,251,0.82)',
  textTertiary: 'rgba(242,246,251,0.74)',
  textMuted: 'rgba(242,246,251,0.62)',
  textFaint: 'rgba(242,246,251,0.52)',
  textGhost: 'rgba(242,246,251,0.48)',

  // These sit on cards, which are dark here — so they invert.
  textOnSurface: '#E8EEF7',
  textOnSurfaceStrong: '#F2F6FB',
  textOnSurfaceSecondary: '#9FB0C6',
  textOnSurfaceMuted: '#93A4BA',
  textOnSurfaceFaint: '#8FA0B6',
  textOnSurfaceSubtle: '#8A9BB1',
  textOnLightBody: '#C2CFDF',
  textOnLightMuted: '#9BAFC7',
  textOnLightHeading: '#E4EDF8',
  textOnLightSubheading: '#B8C9DD',

  success: '#3DDC6B',
  successAlt: '#38D96A',
  successText: '#8FE9AB',
  successSurface: 'rgba(61,220,107,0.16)',
  successTint: 'rgba(61,220,107,0.20)',
  successTintStrong: 'rgba(61,220,107,0.24)',
  successBorder: 'rgba(61,220,107,0.34)',
  successOnDark: '#B7F6C4',
  warning: '#FFB340',
  warningAlt: '#FFD777',
  warningText: '#FFCE8A',
  warningSurface: 'rgba(255,179,64,0.16)',
  warningBorder: 'rgba(255,179,64,0.34)',
  danger: '#FF6F66',
  dangerAlt: '#FF8080',
  dangerStrong: '#FF5A50',
  dangerText: '#FFA8A0',
  dangerSurface: 'rgba(255,98,89,0.16)',
  dangerBorder: 'rgba(255,98,89,0.34)',
  dangerTint: 'rgba(255,98,89,0.24)',
  info: '#6FD4FF',
  infoAlt: '#3D95FF',
  highlight: '#FFE04D',
  highlightTint: 'rgba(255,224,77,0.3)',

  // Shadows must be far deeper to register against a dark ground.
  shadowBase: '#000000',
  shadowSoft: 'rgba(0,0,0,0.40)',
  shadowSoftAlt: 'rgba(0,0,0,0.45)',
  shadowMedium: 'rgba(0,0,0,0.55)',
  shadowStrong: 'rgba(0,0,0,0.65)',
  scrim: 'rgba(0,0,0,0.75)',
  scrimStrong: 'rgba(2,10,20,0.85)',
  shadowBrand: 'rgba(43,133,245,0.28)',
  shadowBrandSoft: 'rgba(43,133,245,0.18)',

  primaryTintHairline: 'rgba(43,133,245,0.10)',
  primaryTintFaint: 'rgba(43,133,245,0.14)',
  primaryTintSubtle: 'rgba(43,133,245,0.16)',
  primaryTintMedium: 'rgba(43,133,245,0.24)',
  primaryTintMediumAlt: 'rgba(43,133,245,0.22)',
  primaryTintStrong: 'rgba(43,133,245,0.44)',
  primaryTintStronger: 'rgba(43,133,245,0.52)',
  primaryTintBorder: 'rgba(43,133,245,0.36)',
  accentTint: 'rgba(61,213,255,0.24)',
  accentTintSubtle: 'rgba(61,213,255,0.18)',
  secondaryTint: 'rgba(77,155,255,0.14)',
  secondaryTintStrong: 'rgba(77,155,255,0.52)',

  authScrim: 'rgba(4,12,24,0.60)',
  textShadowBrand: 'rgba(0,0,0,0.50)',
  sheet: 'rgba(14,26,42,0.98)',
  iconInactive: '#6F8098',

  statusBarStyle: 'light',
  blurTint: 'dark',
};

// ─────────────────────────────────────────────────────────────────────────
// Gradients
// ─────────────────────────────────────────────────────────────────────────

export interface GradientSet {
  /** Full-screen background wash. */
  main: readonly [string, string, string];
  /** Avatar / badge fill. */
  avatar: readonly [string, string];
  /** Avatar fill, reversed direction. */
  avatarReversed: readonly [string, string];
  /** Four-stop variant used by the Faith empty-state badge. */
  badge: readonly [string, string, string];
  /** Translucent white sheen over glass surfaces. */
  glassSheen: readonly [string, string];
  /** Translucent brand sheen. */
  brandSheen: readonly [string, string];
}

export const lightGradients: GradientSet = {
  main: ['#56CCF2', '#2F80ED', '#005FCC'],
  avatar: ['#005FCC', '#00C2FF'],
  avatarReversed: ['#00C2FF', '#005FCC'],
  badge: ['#00C2FF', '#005FCC', '#004AAD'],
  glassSheen: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.08)'],
  brandSheen: ['rgba(0,95,204,0.2)', 'rgba(0,194,255,0.2)'],
};

export const darkGradients: GradientSet = {
  // Same three-stop light→deep sweep, moved into the navy end of the ramp.
  main: ['#1B4A73', '#0E2C4C', '#071426'],
  // Avatars are small accents, so they stay vivid to keep brand recognition.
  avatar: ['#1F6FD0', '#3DD5FF'],
  avatarReversed: ['#3DD5FF', '#1F6FD0'],
  badge: ['#3DD5FF', '#1F6FD0', '#12508F'],
  glassSheen: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'],
  brandSheen: ['rgba(43,133,245,0.24)', 'rgba(61,213,255,0.24)'],
};

/** OCEAN trait gradient pairs. Deduplicated from profile.tsx + results.tsx. */
export interface TraitGradient {
  from: string;
  to: string;
}

export const lightTraitGradients: Record<string, TraitGradient> = {
  Openness: { from: '#005FCC', to: '#00C2FF' },
  Conscientiousness: { from: '#34C759', to: '#30D158' },
  Extraversion: { from: '#FF9F0A', to: '#FECA57' },
  Agreeableness: { from: '#FF3B30', to: '#FF6B6B' },
  Neuroticism: { from: '#5AC8FA', to: '#007AFF' },
};

/** Same five hues, deepened so they read as themselves without glaring. */
export const darkTraitGradients: Record<string, TraitGradient> = {
  Openness: { from: '#2B7FE0', to: '#3DD5FF' },
  Conscientiousness: { from: '#2EB556', to: '#34C95F' },
  Extraversion: { from: '#E08A0A', to: '#E5B44E' },
  Agreeableness: { from: '#E0342A', to: '#E05F5F' },
  Neuroticism: { from: '#4FB0DC', to: '#1F6FD0' },
};

/** Animated wave-background SVG gradient stops. */
export interface WaveStop {
  color: string;
  opacity?: number;
}

export interface WaveGradients {
  base: readonly [WaveStop, WaveStop, WaveStop];
  wave1: readonly [WaveStop, WaveStop, WaveStop];
  wave2: readonly [WaveStop, WaveStop, WaveStop];
  wave3: readonly [WaveStop, WaveStop, WaveStop];
  wave4: readonly [WaveStop, WaveStop, WaveStop];
}

export const lightWaveGradients: WaveGradients = {
  base: [{ color: '#3CB8F0' }, { color: '#0A6FE8' }, { color: '#0035A0' }],
  wave1: [
    { color: '#A8EAFF', opacity: 0.55 },
    { color: '#70D8FF', opacity: 0.35 },
    { color: '#5ED4FF', opacity: 0.05 },
  ],
  wave2: [
    { color: '#6DDDFF', opacity: 0.4 },
    { color: '#44BBFF', opacity: 0.25 },
    { color: '#1A90FF', opacity: 0.05 },
  ],
  wave3: [
    { color: '#50C8FF', opacity: 0.35 },
    { color: '#2AA0F0', opacity: 0.2 },
    { color: '#0A6FE8', opacity: 0.05 },
  ],
  wave4: [
    { color: '#1A5FAA', opacity: 0.4 },
    { color: '#0D4080', opacity: 0.25 },
    { color: '#003070', opacity: 0.05 },
  ],
};

/**
 * Dark waves. Opacities drop roughly by half: the light palette's waves are
 * pale highlights over saturated blue, whereas here they are subtle lifts
 * over near-black — the same alphas would read as milky banding.
 */
export const darkWaveGradients: WaveGradients = {
  base: [{ color: '#0D2440' }, { color: '#081A30' }, { color: '#040E1C' }],
  wave1: [
    { color: '#4FA8D8', opacity: 0.22 },
    { color: '#3C86B8', opacity: 0.14 },
    { color: '#2E6B96', opacity: 0.03 },
  ],
  wave2: [
    { color: '#3E8FC4', opacity: 0.18 },
    { color: '#2E76A8', opacity: 0.12 },
    { color: '#1F5C8C', opacity: 0.03 },
  ],
  wave3: [
    { color: '#3782B4', opacity: 0.16 },
    { color: '#256A98', opacity: 0.1 },
    { color: '#144E7C', opacity: 0.03 },
  ],
  wave4: [
    { color: '#123E68', opacity: 0.22 },
    { color: '#0A2C4E', opacity: 0.14 },
    { color: '#04162C', opacity: 0.03 },
  ],
};

/**
 * Third-party brand marks (Google / Microsoft logo swatches). Fixed by each
 * provider's brand guidelines — these must NOT change with the theme.
 */
export const brandColors = {
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EA4335',
  microsoftRed: '#F25022',
  microsoftGreen: '#7FBA00',
  microsoftBlue: '#00A4EF',
  microsoftYellow: '#FFB900',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Non-colour tokens (theme-independent)
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// Typography
// ─────────────────────────────────────────────────────────────────────────

/**
 * Base font sizes at the Medium text-size setting. Semantic, role-based
 * names; every distinct size the app renders has a token so that
 * consolidating literals onto these is a visual no-op at Medium. Read
 * them through `useTheme().type` — never import these raw maps into a
 * component, or the user's text-size preference won't apply.
 */
export const fontSizes = {
  micro: 9,
  tiny: 10,
  captionSmall: 11,
  caption: 12,
  bodySmall: 13,
  bodyCompact: 14,
  body: 15,
  bodyLarge: 16,
  subtitle: 17,
  labelLarge: 18,
  title: 20,
  titleLarge: 22,
  heading: 24,
  headingLarge: 26,
  headline: 28,
  displaySmall: 32,
  display: 34,
  displayHero: 52,
} as const;

/** Base line heights at Medium. Scaled with the same factor as `fontSizes`. */
export const lineHeights = {
  compact: 18,
  body: 20,
  relaxed: 22,
  loose: 24,
  headline: 32,
  display: 34,
} as const;

export type FontSizeToken = keyof typeof fontSizes;
export type LineHeightToken = keyof typeof lineHeights;
export type Typography = Record<FontSizeToken, number>;
export type LineHeightScale = Record<LineHeightToken, number>;

export type TextScale = 'Small' | 'Medium' | 'Large';

/**
 * In-app text-size multipliers. These compose with (do not replace) the OS
 * accessibility font scale, which RN applies on top via `allowFontScaling`.
 * Large is kept modest for that reason: OS 1.3 x Large 1.15 is already ~1.5x.
 */
export const TEXT_SCALE_FACTORS: Record<TextScale, number> = {
  Small: 0.9,
  Medium: 1,
  Large: 1.15,
};

/**
 * Multiply every size/line-height token by `factor`, rounding to whole
 * pixels. `factor === 1` returns the base values unchanged, which is what
 * guarantees Medium is byte-identical to the pre-token literals.
 */
export function scaleTypography(factor: number): { type: Typography; line: LineHeightScale } {
  const type = Object.fromEntries(
    Object.entries(fontSizes).map(([k, v]) => [k, Math.round(v * factor)])
  ) as Typography;
  const line = Object.fromEntries(
    Object.entries(lineHeights).map(([k, v]) => [k, Math.round(v * factor)])
  ) as LineHeightScale;
  return { type, line };
}

/** The complete theme object handed to components by `useTheme()`. */
export interface Theme extends Palette {
  gradients: GradientSet;
  traitGradients: Record<string, TraitGradient>;
  waves: WaveGradients;
  isDark: boolean;
  /** Font sizes, already scaled by the user's text-size preference. */
  type: Typography;
  /** Line heights, scaled by the same factor as `type`. */
  line: LineHeightScale;
  /** The active multiplier (1 at Medium). */
  textScale: number;
}

const baseTypography = scaleTypography(1);

export const lightTheme: Theme = {
  ...lightPalette,
  gradients: lightGradients,
  traitGradients: lightTraitGradients,
  waves: lightWaveGradients,
  isDark: false,
  ...baseTypography,
  textScale: 1,
};

export const darkTheme: Theme = {
  ...darkPalette,
  gradients: darkGradients,
  traitGradients: darkTraitGradients,
  waves: darkWaveGradients,
  isDark: true,
  ...baseTypography,
  textScale: 1,
};
