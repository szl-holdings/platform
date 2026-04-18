/**
 * Governed-Intelligence Design Language — Token Definitions
 *
 * Dark-first. Muted neutrals. Restrained per-product accents.
 * Every AI-driven surface carries its proof envelope.
 */

export const color = {
  bg: {
    base:    "#060b12",
    surface: "#0d1520",
    overlay: "#111c2a",
    raised:  "#162030",
  },
  border: {
    subtle:  "#1a2535",
    default: "#243040",
    strong:  "#304055",
  },
  text: {
    primary:   "#c8d8e8",
    secondary:  "#7a99b8",
    muted:      "#4a6070",
    inverse:    "#060b12",
  },
  accent: {
    cyan:   "#00d4ff",
    green:  "#00e878",
    amber:  "#ffb700",
    red:    "#ff4455",
    violet: "#a855f7",
    teal:   "#14b8a6",
  },
  state: {
    allowed:          "#00e878",
    requiresApproval: "#ffb700",
    blocked:          "#ff4455",
  },
  confidence: {
    high:         "#00e878",
    medium:       "#ffb700",
    low:          "#ff4455",
    contradiction:"#a855f7",
  },
  freshness: {
    fresh:   "#00e878",
    aging:   "#ffb700",
    stale:   "#ff4455",
    unknown: "#4a6070",
  },
} as const;

export const productAccent = {
  command:  color.accent.cyan,
  holdings: color.accent.teal,
  aegis:    color.accent.violet,
  vessels:  color.accent.cyan,
  terra:    color.accent.green,
  pulse:    color.accent.amber,
  carlota:  color.accent.violet,
} as const;

export const typography = {
  fontFamily: {
    mono:  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    sans:  "'Inter', 'DM Sans', system-ui, sans-serif",
    display: "'DM Sans', 'Inter', system-ui, sans-serif",
  },
  scale: {
    "2xs":  "0.625rem",
    xs:     "0.75rem",
    sm:     "0.8125rem",
    base:   "0.875rem",
    md:     "1rem",
    lg:     "1.125rem",
    xl:     "1.25rem",
    "2xl":  "1.5rem",
    "3xl":  "1.875rem",
    "4xl":  "2.25rem",
  },
  weight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },
  leading: {
    tight:  1.2,
    snug:   1.375,
    normal: 1.5,
    relaxed:1.625,
  },
} as const;

export const spacing = {
  "0":    "0px",
  "0.5":  "2px",
  "1":    "4px",
  "1.5":  "6px",
  "2":    "8px",
  "3":    "12px",
  "4":    "16px",
  "5":    "20px",
  "6":    "24px",
  "8":    "32px",
  "10":   "40px",
  "12":   "48px",
  "16":   "64px",
  "20":   "80px",
  "24":   "96px",
} as const;

export const radius = {
  none:  "0px",
  sm:    "2px",
  md:    "4px",
  lg:    "6px",
  xl:    "8px",
  "2xl": "12px",
  full:  "9999px",
} as const;

export const elevation = {
  0: "none",
  1: "0 1px 3px rgba(0,0,0,0.5)",
  2: "0 4px 12px rgba(0,0,0,0.6)",
  3: "0 8px 24px rgba(0,0,0,0.7)",
  4: "0 16px 48px rgba(0,0,0,0.8)",
} as const;

export const motion = {
  duration: {
    instant:  "60ms",
    fast:     "120ms",
    normal:   "200ms",
    slow:     "350ms",
    glacial:  "600ms",
  },
  easing: {
    standard:   "cubic-bezier(0.4, 0, 0.2, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)",
    accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    sharp:      "cubic-bezier(0.4, 0, 0.6, 1)",
  },
} as const;

/** CSS custom-property injection helper — call once at root */
export function injectTokens(target: HTMLElement = document.documentElement): void {
  Object.assign(target.style, {
    "--gi-bg-base":    color.bg.base,
    "--gi-bg-surface": color.bg.surface,
    "--gi-bg-overlay": color.bg.overlay,
    "--gi-bg-raised":  color.bg.raised,
    "--gi-border-subtle":  color.border.subtle,
    "--gi-border-default": color.border.default,
    "--gi-text-primary":   color.text.primary,
    "--gi-text-secondary": color.text.secondary,
    "--gi-text-muted":     color.text.muted,
    "--gi-accent-cyan":    color.accent.cyan,
    "--gi-accent-green":   color.accent.green,
    "--gi-accent-amber":   color.accent.amber,
    "--gi-accent-red":     color.accent.red,
    "--gi-accent-violet":  color.accent.violet,
  });
}
