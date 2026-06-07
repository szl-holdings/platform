/**
 * CSS custom-property variable names for AEEP v2 tokens.
 *
 * Use these in component inline styles instead of raw hex values.
 * The gi-tokens.css must be imported for these to resolve.
 *
 * @example
 * import { v } from "../tokens/vars.js";
 * <div style={{ background: v.bgBase, color: v.textPrimary }} />
 */

export const v = {
  /* ── Backgrounds ────────────────────────────────── */
  bgBase:    'var(--gi-bg-base)',
  bgSurface: 'var(--gi-bg-surface)',
  bgOverlay: 'var(--gi-bg-overlay)',
  bgRaised:  'var(--gi-bg-raised)',
  bgHover:   'var(--gi-bg-hover)',
  bgActive:  'var(--gi-bg-active)',

  /* ── Borders ─────────────────────────────────────── */
  borderSubtle:  'var(--gi-border-subtle)',
  borderDefault: 'var(--gi-border-default)',
  borderStrong:  'var(--gi-border-strong)',
  borderFocus:   'var(--gi-border-focus)',

  /* ── Text ────────────────────────────────────────── */
  textPrimary:     'var(--gi-text-primary)',
  textSecondary:   'var(--gi-text-secondary)',
  textMuted:       'var(--gi-text-muted)',
  textInverse:     'var(--gi-text-inverse)',
  textLink:        'var(--gi-text-link)',
  textPlaceholder: 'var(--gi-text-placeholder)',

  /* ── Accent family ───────────────────────────────── */
  accentBlue:   'var(--gi-accent-blue)',
  accentTeal:   'var(--gi-accent-teal)',
  accentGreen:  'var(--gi-accent-green)',
  accentAmber:  'var(--gi-accent-amber)',
  accentRed:    'var(--gi-accent-red)',
  accentViolet: 'var(--gi-accent-violet)',
  accentSlate:  'var(--gi-accent-slate)',

  /* ── Semantic state ──────────────────────────────── */
  stateAllowed:          'var(--gi-state-allowed)',
  stateRequiresApproval: 'var(--gi-state-requires-approval)',
  stateBlocked:          'var(--gi-state-blocked)',

  /* ── Semantic status ─────────────────────────────── */
  successText:   'var(--gi-success-text)',
  successBg:     'var(--gi-success-bg)',
  successBorder: 'var(--gi-success-border)',
  warningText:   'var(--gi-warning-text)',
  warningBg:     'var(--gi-warning-bg)',
  warningBorder: 'var(--gi-warning-border)',
  errorText:     'var(--gi-error-text)',
  errorBg:       'var(--gi-error-bg)',
  errorBorder:   'var(--gi-error-border)',
  infoText:      'var(--gi-info-text)',
  infoBg:        'var(--gi-info-bg)',
  infoBorder:    'var(--gi-info-border)',
  neutralText:   'var(--gi-neutral-text)',
  neutralBg:     'var(--gi-neutral-bg)',
  neutralBorder: 'var(--gi-neutral-border)',

  /* ── Confidence ──────────────────────────────────── */
  confidenceHigh:          'var(--gi-confidence-high)',
  confidenceMedium:        'var(--gi-confidence-medium)',
  confidenceLow:           'var(--gi-confidence-low)',
  confidenceContradiction: 'var(--gi-confidence-contradiction)',

  /* ── Chart ───────────────────────────────────────── */
  chart1:          'var(--gi-chart-1)',
  chart2:          'var(--gi-chart-2)',
  chart3:          'var(--gi-chart-3)',
  chart4:          'var(--gi-chart-4)',
  chart5:          'var(--gi-chart-5)',
  chart6:          'var(--gi-chart-6)',
  chartGrid:       'var(--gi-chart-grid)',
  chartAxis:       'var(--gi-chart-axis)',
  chartTooltipBg:  'var(--gi-chart-tooltip-bg)',

  /* ── Elevation / Shadow ──────────────────────────── */
  shadow0: 'var(--gi-shadow-0)',
  shadow1: 'var(--gi-shadow-1)',
  shadow2: 'var(--gi-shadow-2)',
  shadow3: 'var(--gi-shadow-3)',
  shadow4: 'var(--gi-shadow-4)',

  /* ── Typography — families ───────────────────────── */
  fontSans:    'var(--gi-font-sans)',
  fontDisplay: 'var(--gi-font-display)',
  fontMono:    'var(--gi-font-mono)',

  /* ── Density ─────────────────────────────────────── */
  densityPagePadding:  'var(--gi-density-page-padding)',
  densitySectionGap:   'var(--gi-density-section-gap)',
  densityCardPadding:  'var(--gi-density-card-padding)',
  densityRowHeight:    'var(--gi-density-row-height)',
  densityInputHeight:  'var(--gi-density-input-height)',
  densityIconSize:     'var(--gi-density-icon-size)',
  densityFontSize:     'var(--gi-density-font-size)',

  /* ── Motion ──────────────────────────────────────── */
  durationFast:    'var(--gi-duration-fast)',
  durationNormal:  'var(--gi-duration-normal)',
  durationSlow:    'var(--gi-duration-slow)',
  easeStandard:    'var(--gi-ease-standard)',
  easeDecelerate:  'var(--gi-ease-decelerate)',
  easeAccelerate:  'var(--gi-ease-accelerate)',
} as const;
