/**
 * Claims adapter for terra
 *
 * Terra already uses the shared DataProvenance component for its dashboards.
 * This adapter exposes registry-sourced numeric claims (e.g. AUM under
 * analysis) so the same demo/projected labels appear consistently wherever
 * those numbers surface across artifacts.
 *
 * Verified vs. pending status of claims wired through this adapter:
 *   - terra-portfolio-aum : demo-data (seed portfolio) → [Demo]
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
      `[terra/claims] Unknown claim id "${claimId}" — fallback "${fallback}".`
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

export const TERRA_PORTFOLIO_AUM = resolveClaim(
  "terra-portfolio-aum",
  "$4.2B+ assets under analysis"
);

export function metricDisplay(claimValue: ClaimValue): string {
  return claimValue.displayWithLabel;
}
