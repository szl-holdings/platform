/**
 * Claims adapter for carlota-jo
 *
 * All public-facing client retention and founder experience claims on the
 * carlota-jo surface are sourced from @szl-holdings/config/public-claims.
 *
 * Verified vs. pending status of claims wired through this adapter:
 *   - carlota-jo-retention   : pending (no CRM source) → [Demo]
 *   - carlota-jo-experience  : verified (computed from FOUNDER_START_YEAR)
 *
 * Audit reference: docs/audit/2026-04/public-claims-registry.md
 * Registry source:  packages/config/src/public-claims.ts
 */

import {
  getClaim,
  FOUNDER_YEARS_EXPERIENCE,
  type ClaimTruthValue,
} from "@szl-holdings/config/public-claims";

export interface ClaimValue {
  value: string;
  label: string | null;
  truthValue: ClaimTruthValue;
  displayWithLabel: string;
}

function resolveClaim(claimId: string, fallback: string): ClaimValue {
  const claim = getClaim(claimId);
  if (!claim) {
    console.warn(
      `[carlota-jo/claims] Unknown claim id "${claimId}" — fallback "${fallback}".`
    );
    return {
      value: fallback,
      label: "[Demo]",
      truthValue: "pending",
      displayWithLabel: `${fallback} [Demo]`,
    };
  }
  return {
    value: claim.claim,
    label: claim.displayLabel,
    truthValue: claim.truthValue,
    displayWithLabel: claim.displayLabel
      ? `${claim.claim} ${claim.displayLabel}`
      : claim.claim,
  };
}

export const CARLOTA_JO_RETENTION = resolveClaim("carlota-jo-retention", "98%");

/**
 * Founder experience years is computed from the registered start year so the
 * claim auto-updates each year and never drifts from the bio source of truth.
 */
export const CARLOTA_JO_YEARS_EXPERIENCE: ClaimValue = {
  value: `${FOUNDER_YEARS_EXPERIENCE} years`,
  label: null,
  truthValue: "verified",
  displayWithLabel: `${FOUNDER_YEARS_EXPERIENCE} years`,
};

export function metricDisplay(claimValue: ClaimValue): string {
  return claimValue.displayWithLabel;
}
