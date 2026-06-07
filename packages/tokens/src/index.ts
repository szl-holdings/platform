/**
 * @workspace/tokens
 *
 * Canonical entry point for the SZL Holdings governed-intelligence design tokens.
 *
 * This package is a thin alias over @szl-holdings/design-system/tokens. The
 * NEXUS tokens-as-code contract mandates the @workspace/* namespace as the
 * single import path that artifacts MUST use; the design-system package
 * remains the implementation source of truth.
 *
 * Usage:
 *   import { color, spacing, motion, type Color } from '@workspace/tokens';
 *
 * Drift policy: any artifact importing tokens from anywhere other than
 * @workspace/tokens (or rendering raw hex/px values inline) will be flagged
 * by scripts/check-design-tokens-drift.ts and surfaced in the NEXUS
 * Tokens Governance dashboard.
 */

export * from '@szl-holdings/design-system/tokens';
// Convenience re-export under a stable governance name.
export { injectTokens as applyTokensToRoot } from '@szl-holdings/design-system/tokens';
