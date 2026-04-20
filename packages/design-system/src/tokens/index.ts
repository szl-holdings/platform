/**
 * Governed-Intelligence Design Language — Token Definitions
 *
 * AEEP Edition — Dark-first. Cool neutral base. Disciplined enterprise accent family.
 * Every AI-driven surface carries its proof envelope.
 *
 * Design constraints:
 *   - No raw hex outside this file and the /tokens/* sub-modules
 *   - No neon/glow/oversaturated palette in authenticated product UX
 *   - Chart palette: executive-quiet (muted, distinguishable series on dark)
 *   - Motion: max 200ms, no decorative animations
 *   - Product headings: max text-2xl in authenticated surfaces
 */

export { v } from './vars.js';

export const color = {
  bg: {
    base: '#060b12',
    surface: '#0d1520',
    overlay: '#111c2a',
    raised: '#162030',
    hover: '#1a2a3a',
    active: '#1e3248',
  },
  border: {
    subtle: '#1a2535',
    default: '#243040',
    strong: '#304055',
    focus: '#4d8fcc',
  },
  text: {
    primary: '#c8d8e8',
    secondary: '#7a99b8',
    muted: '#4a6070',
    inverse: '#060b12',
    link: '#4d8fcc',
    placeholder: '#3a5060',
  },

  /**
   * AEEP enterprise accent family — disciplined, cool-tone.
   * These replace the neon palette for authenticated product surfaces.
   * Neon values are preserved below under `accent.neon.*` for backward compatibility
   * but are deprecated for use in authenticated product UX.
   */
  accent: {
    blue: '#4d8fcc',
    teal: '#3ea89a',
    green: '#5baa8a',
    amber: '#c9a85c',
    red: '#c96070',
    violet: '#9b7cc8',
    slate: '#7a99b8',

    /** @deprecated Use enterprise accent family above in product UX. Neon is for marketing only. */
    neon: {
      cyan: '#00d4ff',
      green: '#00e878',
      amber: '#ffb700',
      red: '#ff4455',
      violet: '#a855f7',
      teal: '#14b8a6',
    },

    /** @deprecated Backward-compatible alias — use `accent.blue` instead */
    cyan: '#4d8fcc',
  },

  state: {
    allowed: '#5baa8a',
    requiresApproval: '#c9a85c',
    blocked: '#c96070',
  },
  confidence: {
    high: '#5baa8a',
    medium: '#c9a85c',
    low: '#c96070',
    contradiction: '#9b7cc8',
  },
  freshness: {
    fresh: '#5baa8a',
    aging: '#c9a85c',
    stale: '#c96070',
    unknown: '#4a6070',
  },
} as const;

export const productAccent = {
  command: color.accent.cyan,
  holdings: color.accent.teal,
  aegis: color.accent.violet,
  vessels: color.accent.cyan,
  terra: color.accent.green,
  pulse: color.accent.amber,
  carlota: color.accent.violet,
} as const;

export const typography = {
  fontFamily: {
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    sans: "'Inter', 'DM Sans', system-ui, sans-serif",
    display: "'DM Sans', 'Inter', system-ui, sans-serif",
  },
  scale: {
    '2xs': '0.625rem',
    xs: '0.75rem',
    sm: '0.8125rem',
    base: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  leading: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

export const spacing = {
  '0': '0px',
  '0.5': '2px',
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
} as const;

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '6px',
  xl: '8px',
  '2xl': '12px',
  full: '9999px',
} as const;

export const elevation = {
  0: 'none',
  1: '0 1px 3px rgba(0,0,0,0.5)',
  2: '0 4px 12px rgba(0,0,0,0.6)',
  3: '0 8px 24px rgba(0,0,0,0.7)',
  4: '0 16px 48px rgba(0,0,0,0.8)',
} as const;

export const motion = {
  duration: {
    instant: '60ms',
    fast: '120ms',
    normal: '200ms',
    slow: '350ms',
    glacial: '600ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
} as const;

/**
 * AEEP density mode configuration.
 * Controls spacing, row heights, and font sizes across the shell.
 */
export const densityConfig = {
  comfortable: {
    pagePadding: '32px',
    sectionGap: '24px',
    cardPadding: '20px',
    rowHeight: '56px',
    inputHeight: '40px',
    iconSize: '20px',
    fontSize: '13px',
  },
  compact: {
    pagePadding: '24px',
    sectionGap: '16px',
    cardPadding: '14px',
    rowHeight: '40px',
    inputHeight: '32px',
    iconSize: '16px',
    fontSize: '12px',
  },
  dense: {
    pagePadding: '16px',
    sectionGap: '12px',
    cardPadding: '10px',
    rowHeight: '32px',
    inputHeight: '28px',
    iconSize: '14px',
    fontSize: '11px',
  },
} as const;

export type DensityMode = keyof typeof densityConfig;

/**
 * Executive-quiet chart palette.
 */
export const chartPalette = {
  series: ['#4d8fcc', '#5baa8a', '#c9a85c', '#9b7cc8', '#c97a64', '#6bb5c2'] as const,
  positive: '#5baa8a',
  negative: '#c96070',
  neutral: '#7a99b8',
  warning: '#c9a85c',
  grid: '#1a2535',
  axis: '#4a6070',
  tooltip: { bg: '#0d1520', border: '#243040', text: '#c8d8e8' },
} as const;

/**
 * Semantic status tokens.
 */
export const semanticColors = {
  success: { text: '#5baa8a', bg: '#0d2a1a', border: '#1a4a2a' },
  warning: { text: '#c9a85c', bg: '#2a2010', border: '#4a3810' },
  error: { text: '#c96070', bg: '#2a0d12', border: '#4a1a22' },
  info: { text: '#4d8fcc', bg: '#0d1a2a', border: '#1a304a' },
  neutral: { text: '#7a99b8', bg: '#111c2a', border: '#243040' },
} as const;

/** CSS custom-property injection helper — call once at root */
export function injectTokens(target: HTMLElement = document.documentElement): void {
  Object.assign(target.style, {
    '--gi-bg-base': color.bg.base,
    '--gi-bg-surface': color.bg.surface,
    '--gi-bg-overlay': color.bg.overlay,
    '--gi-bg-raised': color.bg.raised,
    '--gi-bg-hover': color.bg.hover,
    '--gi-bg-active': color.bg.active,

    '--gi-border-subtle': color.border.subtle,
    '--gi-border-default': color.border.default,
    '--gi-border-strong': color.border.strong,
    '--gi-border-focus': color.border.focus,

    '--gi-text-primary': color.text.primary,
    '--gi-text-secondary': color.text.secondary,
    '--gi-text-muted': color.text.muted,
    '--gi-text-inverse': color.text.inverse,
    '--gi-text-link': color.text.link,
    '--gi-text-placeholder': color.text.placeholder,

    '--gi-accent-blue': color.accent.blue,
    '--gi-accent-teal': color.accent.teal,
    '--gi-accent-green': color.accent.green,
    '--gi-accent-amber': color.accent.amber,
    '--gi-accent-red': color.accent.red,
    '--gi-accent-violet': color.accent.violet,
    '--gi-accent-slate': color.accent.slate,

    '--gi-state-allowed': color.state.allowed,
    '--gi-state-requires-approval': color.state.requiresApproval,
    '--gi-state-blocked': color.state.blocked,

    '--gi-confidence-high': color.confidence.high,
    '--gi-confidence-medium': color.confidence.medium,
    '--gi-confidence-low': color.confidence.low,
    '--gi-confidence-contradiction': color.confidence.contradiction,
  });
}
