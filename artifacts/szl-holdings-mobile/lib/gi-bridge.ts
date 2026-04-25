/**
 * GI Token Bridge — React Native
 *
 * Imports canonical color, radius, and motion tokens from the shared
 * @szl-holdings/design-system package and re-exports them as plain JS
 * values compatible with React Native StyleSheet.
 *
 * Usage:
 *   import { giColors, giRadius, giMotion } from '~/lib/gi-bridge';
 *
 * This is the single source of truth for GI design tokens in the mobile app.
 * Do not define brand colors or radius values outside this file.
 */

import { color, productAccent } from '@szl-holdings/design-system/tokens';

export const giColors = {
  bg: {
    base:    color.bg.base,
    surface: color.bg.surface,
    overlay: color.bg.overlay,
    raised:  color.bg.raised,
    hover:   color.bg.hover,
    active:  color.bg.active,
  },
  border: {
    subtle:  color.border.subtle,
    default: color.border.default,
    strong:  color.border.strong,
    focus:   color.border.focus,
  },
  text: {
    primary:     color.text.primary,
    secondary:   color.text.secondary,
    muted:       color.text.muted,
    inverse:     color.text.inverse,
    link:        color.text.link,
    placeholder: color.text.placeholder,
  },
  accent: {
    blue:   color.accent.blue,
    teal:   color.accent.teal,
    green:  color.accent.green,
    amber:  color.accent.amber,
    red:    color.accent.red,
    violet: color.accent.violet,
    slate:  color.accent.slate,
  },
  state: {
    allowed:          color.state.allowed,
    requiresApproval: color.state.requiresApproval,
    blocked:          color.state.blocked,
  },
  confidence: {
    high:          color.confidence.high,
    medium:        color.confidence.medium,
    low:           color.confidence.low,
    contradiction: color.confidence.contradiction,
  },
} as const;

/** Numeric pixel values (parsed from the design-system rem/px strings) */
export const giRadius = {
  none: 0,
  sm:   2,
  md:   4,
  lg:   6,
  xl:   8,
  '2xl': 12,
  full: 9999,
} as const;

/** Motion durations in milliseconds */
export const giMotion = {
  instant: 60,
  fast:    120,
  normal:  200,
  slow:    350,
  glacial: 600,
} as const;

/**
 * GI spacing tokens as numeric pixel values (for React Native).
 * Maps the design-system spacing scale to unitless numbers.
 */
export const giSpacing = {
  0:    0,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  3:    12,
  4:    16,
  5:    20,
  6:    24,
  8:    32,
  10:   40,
  12:   48,
  16:   64,
  20:   80,
  24:   96,
} as const;

/**
 * Semantic status tokens — background and border alpha composites derived
 * from the GI accent family. Use for status banners, badges, and alert surfaces.
 */
export const giSemantic = {
  success: {
    text:   color.accent.green,
    bg:     `${color.accent.green}18`,
    border: `${color.accent.green}30`,
  },
  warning: {
    text:   color.accent.amber,
    bg:     `${color.accent.amber}18`,
    border: `${color.accent.amber}30`,
  },
  error: {
    text:   color.accent.red,
    bg:     `${color.accent.red}18`,
    border: `${color.accent.red}30`,
  },
  info: {
    text:   color.accent.blue,
    bg:     `${color.accent.blue}18`,
    border: `${color.accent.blue}30`,
  },
  neutral: {
    text:   color.text.secondary,
    bg:     `${color.text.muted}18`,
    border: `${color.text.muted}30`,
  },
} as const;

/**
 * Elevation shadow levels as React Native `elevation` (Android) numeric values.
 * Pair with `shadowColor / shadowOffset / shadowRadius` for iOS.
 */
export const giElevation = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 16,
} as const;

/** Product accent map — aligned to web productAccent */
export const giProductAccent = {
  command:  productAccent.command,
  holdings: productAccent.holdings,
  sentra:   productAccent.sentra,
  counsel:  productAccent.counsel,
  aegis:    productAccent.aegis,
  vessels:  productAccent.vessels,
  terra:    productAccent.terra,
  pulse:    productAccent.pulse,
  lyte:     productAccent.lyte,
  carlota:  productAccent.carlota,
} as const;

/** Semantic shortcuts for common usage patterns */
export const palette = {
  critical:  giColors.accent.red,
  high:      giColors.accent.amber,
  medium:    giColors.accent.amber,
  low:       giColors.accent.blue,
  success:   giColors.accent.green,
  info:      giColors.accent.blue,
  surface:   giColors.bg.surface,
  overlay:   giColors.bg.overlay,
  /**
   * High-contrast text for use on colored (accent/badge) backgrounds.
   * Always white — invariant across light and dark themes since it sits
   * on a brightly colored surface, not the app background.
   */
  onAccent:  '#ffffff',
} as const;
