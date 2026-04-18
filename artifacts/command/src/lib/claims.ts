/**
 * Claims adapter for command
 *
 * All public-facing infrastructure metrics (uptime, SLA, response time) on the
 * Command marketing surface are sourced from @szl-holdings/config/public-claims.
 *
 * Verified vs. pending status of claims wired through this adapter:
 *   - command-uptime-30day  : pending (no live uptime monitor) → [Demo]
 *   - command-uptime-90day  : pending (no live uptime monitor) → [Demo]
 *   - uptime-claim          : pending (no live uptime monitor) → [Demo]
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
      `[command/claims] Unknown claim id "${claimId}" — fallback "${fallback}". ` +
        `Add it to packages/config/src/public-claims.ts.`
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

export const COMMAND_UPTIME_30DAY = resolveClaim("command-uptime-30day", "99.98%");
export const COMMAND_UPTIME_90DAY = resolveClaim("command-uptime-90day", "99.97%");
export const COMMAND_UPTIME_OVERALL = resolveClaim("uptime-claim", "99.98% uptime");

export function metricDisplay(claimValue: ClaimValue): string {
  return claimValue.displayWithLabel;
}
