/**
 * Claims adapter for vessels
 *
 * Public-facing maritime intelligence claims on the vessels surface are sourced
 * from @szl-holdings/config/public-claims so the same numbers appear in every
 * artifact and demo/projected labels are applied consistently.
 *
 * Verified vs. pending status of claims wired through this adapter:
 *   - vessels-count                : aspirational (AIS not subscribed) → [Projected]
 *   - vessels-dark-detection-lead  : demo-data (no live ML model) → [Demo]
 *   - vessels-uptime-sla           : aspirational (target SLA, not measured) → [Target SLA]
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
      `[vessels/claims] Unknown claim id "${claimId}" — fallback "${fallback}".`
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

export const VESSELS_COUNT = resolveClaim("vessels-count", "52,000+");
export const VESSELS_DARK_DETECTION_LEAD = resolveClaim(
  "vessels-dark-detection-lead",
  "34 days pre-designation"
);
export const VESSELS_UPTIME_SLA = resolveClaim(
  "vessels-uptime-sla",
  "99.97% uptime SLA"
);

export function metricDisplay(claimValue: ClaimValue): string {
  return claimValue.displayWithLabel;
}
