/**
 * Claims adapter for aegis
 *
 * Public-facing defense intelligence claims on the aegis surface (including
 * the investor pitch deck) are sourced from @szl-holdings/config/public-claims.
 *
 * Verified vs. pending status of claims wired through this adapter:
 *   - aegis-simulations       : demo-data (hardcoded count) → [Demo]
 *   - aegis-mitre-coverage    : aspirational (count not measured) → [Projected]
 *   - market-maritime-size    : aspirational (analyst estimate) → [Market estimate]
 *   - market-governed-decision: aspirational (projection) → [Projected market]
 *
 * Audit reference: docs/audit/2026-04/public-claims-registry.md
 * Registry source:  packages/config/src/public-claims.ts
 */

import {
  getClaim,
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
      `[aegis/claims] Unknown claim id "${claimId}" — fallback "${fallback}".`
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

export const AEGIS_SIMULATIONS = resolveClaim("aegis-simulations", "31,200+");
export const AEGIS_MITRE_COVERAGE = resolveClaim(
  "aegis-mitre-coverage",
  "MITRE ATT&CK techniques covered"
);
export const AEGIS_MARKET_MARITIME = resolveClaim(
  "market-maritime-size",
  "$4.2B maritime intelligence market"
);
export const AEGIS_MARKET_GOVERNED_DECISION = resolveClaim(
  "market-governed-decision",
  "$50.1B governed decision infrastructure market by 2030"
);

export function metricDisplay(claimValue: ClaimValue): string {
  return claimValue.displayWithLabel;
}
