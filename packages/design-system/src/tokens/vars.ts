/**
 * CSS custom-property variable names for AEEP tokens.
 *
 * Use these in component inline styles instead of raw hex values.
 * The `injectTokens()` function must be called at the app root to populate them.
 *
 * @example
 * import { v } from "../tokens/vars.js";
 * <div style={{ background: v.bgBase, color: v.textPrimary }} />
 */

export const v = {
  bgBase:       "var(--gi-bg-base)",
  bgSurface:    "var(--gi-bg-surface)",
  bgOverlay:    "var(--gi-bg-overlay)",
  bgRaised:     "var(--gi-bg-raised)",
  bgHover:      "var(--gi-bg-hover)",
  bgActive:     "var(--gi-bg-active)",

  borderSubtle:  "var(--gi-border-subtle)",
  borderDefault: "var(--gi-border-default)",
  borderStrong:  "var(--gi-border-strong)",
  borderFocus:   "var(--gi-border-focus)",

  textPrimary:   "var(--gi-text-primary)",
  textSecondary: "var(--gi-text-secondary)",
  textMuted:     "var(--gi-text-muted)",
  textInverse:   "var(--gi-text-inverse)",
  textLink:      "var(--gi-text-link)",
  textPlaceholder: "var(--gi-text-placeholder)",

  accentBlue:   "var(--gi-accent-blue)",
  accentTeal:   "var(--gi-accent-teal)",
  accentGreen:  "var(--gi-accent-green)",
  accentAmber:  "var(--gi-accent-amber)",
  accentRed:    "var(--gi-accent-red)",
  accentViolet: "var(--gi-accent-violet)",
  accentSlate:  "var(--gi-accent-slate)",

  stateAllowed:          "var(--gi-state-allowed)",
  stateRequiresApproval: "var(--gi-state-requires-approval)",
  stateBlocked:          "var(--gi-state-blocked)",

  confidenceHigh:         "var(--gi-confidence-high)",
  confidenceMedium:       "var(--gi-confidence-medium)",
  confidenceLow:          "var(--gi-confidence-low)",
  confidenceContradiction: "var(--gi-confidence-contradiction)",
} as const;
