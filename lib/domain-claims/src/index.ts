/**
 * Domain Claims — shared infrastructure for all per-artifact claims adapters.
 *
 * Every artifact that surfaces public-facing numbers, metrics, or compliance
 * claims should import ClaimValue, makeClaimResolver, and metricDisplay from
 * here. Per-artifact claims.ts files keep only their own exported constants.
 *
 * Audit reference: docs/audit/2026-04/public-claims-registry.md
 * Registry source:  packages/config/src/public-claims.ts
 */

import { type ClaimTruthValue, getClaim } from '@szl-holdings/config/public-claims';

export type { ClaimTruthValue };

export interface ClaimValue {
  value: string;
  label: string | null;
  truthValue: ClaimTruthValue;
  displayWithLabel: string;
}

/**
 * Returns a `resolveClaim` function scoped to the given module prefix
 * (used in console.warn messages). Call once at module level:
 *
 *   const resolveClaim = makeClaimResolver("aegis/claims");
 */
export function makeClaimResolver(
  _modulePrefix: string,
): (claimId: string, fallback: string) => ClaimValue {
  return function resolveClaim(claimId: string, fallback: string): ClaimValue {
    const claim = getClaim(claimId);
    if (!claim) {
      return {
        value: fallback,
        label: '[Demo]',
        truthValue: 'pending',
        displayWithLabel: `${fallback} [Demo]`,
      };
    }
    return {
      value: claim.claim,
      label: claim.displayLabel,
      truthValue: claim.truthValue,
      displayWithLabel: claim.displayLabel ? `${claim.claim} ${claim.displayLabel}` : claim.claim,
    };
  };
}

/**
 * Returns the value with its label appended when applicable.
 * Use in component render to get a consistently formatted string.
 */
export function metricDisplay(claimValue: ClaimValue): string {
  return claimValue.displayWithLabel;
}
