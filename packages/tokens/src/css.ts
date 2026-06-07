/**
 * CSS variable name registry for the @workspace/tokens contract.
 *
 * These are the only color-bearing CSS custom properties whose use is
 * permitted in artifact stylesheets. The drift detector treats any other
 * raw color literal as a violation.
 */
export const TOKEN_CSS_VARS = [
  '--gi-bg-base',
  '--gi-bg-surface',
  '--gi-bg-overlay',
  '--gi-bg-raised',
  '--gi-bg-hover',
  '--gi-bg-active',
  '--gi-border-subtle',
  '--gi-border-default',
  '--gi-border-strong',
  '--gi-border-focus',
  '--gi-text-primary',
  '--gi-text-secondary',
  '--gi-text-muted',
  '--gi-text-inverse',
  '--gi-text-link',
  '--gi-text-placeholder',
  '--gi-accent-blue',
  '--gi-accent-teal',
  '--gi-accent-green',
  '--gi-accent-amber',
  '--gi-accent-red',
  '--gi-accent-violet',
  '--gi-accent-slate',
  '--gi-state-allowed',
  '--gi-state-requires-approval',
  '--gi-state-blocked',
  '--gi-confidence-high',
  '--gi-confidence-medium',
  '--gi-confidence-low',
  '--gi-confidence-contradiction',
] as const;

export type TokenCssVar = (typeof TOKEN_CSS_VARS)[number];
