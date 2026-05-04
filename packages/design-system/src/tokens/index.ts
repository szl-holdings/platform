/**
 * Governed-Intelligence Design Language — Token Definitions
 *
 * v3 — Warm-light default. Gold (#c9b787) primary accent.
 * Cool-slate secondaries. No blue in the primary accent family.
 *
 * Design constraints:
 *   - No raw hex outside this file and the /tokens/* sub-modules
 *   - Gold is the primary accent; slate replaces blue
 *   - Chart palette: warm-executive (muted, distinguishable series on light)
 *   - Motion: max 200ms, no decorative animations
 *   - Product headings: max text-2xl in authenticated surfaces
 */

export { v } from './vars.js';

export const color = {
  bg: {
    base: '#FAF7F2',
    surface: '#FFFFFF',
    overlay: '#F5F0E8',
    raised: '#EDE8DF',
    hover: '#E8E2D8',
    active: '#DED7CC',
  },
  border: {
    subtle: '#E8E2D8',
    default: '#D4CCC0',
    strong: '#B8AFA3',
    focus: '#c9b787',
  },
  text: {
    primary: '#1A1814',
    secondary: '#5C564E',
    muted: '#8A8279',
    inverse: '#FAF7F2',
    link: '#b5a070',
    placeholder: '#B8AFA3',
  },

  accent: {
    gold: '#c9b787',
    slate: '#6B7280',
    green: '#5a8a6e',
    amber: '#b5973a',
    red: '#b85450',
    violet: '#7e6aad',
    teal: '#4a8a80',

    /** @deprecated Use accent.slate. Blue alias kept for backward compatibility. */
    blue: '#6B7280',

    /** @deprecated Use enterprise accent family above in product UX. Neon is for marketing only. */
    neon: {
      cyan: '#00d4ff',
      green: '#00e878',
      amber: '#ffb700',
      red: '#ff4455',
      violet: '#a855f7',
      teal: '#14b8a6',
    },

    /** @deprecated Backward-compatible alias — use `accent.gold` instead */
    cyan: '#6B7280',
  },

  state: {
    allowed: '#5a8a6e',
    requiresApproval: '#b5973a',
    blocked: '#b85450',
  },
  confidence: {
    high: '#5a8a6e',
    medium: '#b5973a',
    low: '#b85450',
    contradiction: '#7e6aad',
  },
  freshness: {
    fresh: '#5a8a6e',
    aging: '#b5973a',
    stale: '#b85450',
    unknown: '#8A8279',
  },
} as const;

export const productAccent = {
  command: color.accent.gold,
  holdings: color.accent.teal,
  sentra: color.accent.red,
  counsel: color.accent.violet,
  aegis: color.accent.violet,
  vessels: color.accent.slate,
  terra: color.accent.green,
  pulse: color.accent.amber,
  lyte: color.accent.amber,
  carlota: color.accent.violet,
} as const;

export const typography = {
  fontFamily: {
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
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
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '14px',
  full: '9999px',
} as const;

export const elevation = {
  0: 'none',
  1: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  2: '0 4px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)',
  3: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
  4: '0 16px 48px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05)',
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

export const densityConfig = {
  comfortable: {
    pagePadding: '32px',
    sectionGap: '24px',
    cardPadding: '20px',
    rowHeight: '56px',
    inputHeight: '40px',
    iconSize: '20px',
    fontSize: '14px',
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

export const chartPalette = {
  series: ['#c9b787', '#5a8a6e', '#6B7280', '#7e6aad', '#b87a5a', '#4a8a80'] as const,
  positive: '#5a8a6e',
  negative: '#b85450',
  neutral: '#6B7280',
  warning: '#b5973a',
  grid: '#E8E2D8',
  axis: '#8A8279',
  tooltip: { bg: '#FFFFFF', border: '#D4CCC0', text: '#1A1814' },
} as const;

export const semanticColors = {
  success: { text: '#4a7a5e', bg: '#f2f8f4', border: '#c5ddc9' },
  warning: { text: '#96802e', bg: '#fdf8ee', border: '#e5d6a8' },
  error: { text: '#a04440', bg: '#fdf4f3', border: '#e5bbb8' },
  info: { text: '#5C564E', bg: '#F5F0E8', border: '#D4CCC0' },
  neutral: { text: '#5C564E', bg: '#F5F0E8', border: '#D4CCC0' },
} as const;

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

    '--gi-accent-gold': color.accent.gold,
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
