/**
 * Claims adapter for pulse
 *
 * Pulse displays AI-generated executive briefings. When a brief is rendered
 * from a fallback or fixture (rather than a freshly produced live agent
 * response), the renderer must label the content as Synthesized so readers
 * know it is not a live generation.
 *
 * Verified vs. pending status of claims wired through this adapter:
 *   - pulse-fallback-briefing : demo-data → [Synthesized]
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
      `[pulse/claims] Unknown claim id "${claimId}" — fallback "${fallback}".`
    );
    return {
      value: fallback,
      label: "[Synthesized]",
      truthValue: "demo-data",
      displayWithLabel: `${fallback} [Synthesized]`,
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

export const PULSE_FALLBACK_BRIEFING = resolveClaim(
  "pulse-fallback-briefing",
  "Synthesized briefing"
);

/**
 * Convenience constant: the bare label string ("[Synthesized]") to render on
 * any fallback briefing card so the reader sees a clear provenance signal.
 */
export const PULSE_SYNTHESIZED_LABEL =
  PULSE_FALLBACK_BRIEFING.label ?? "[Synthesized]";

export function metricDisplay(claimValue: ClaimValue): string {
  return claimValue.displayWithLabel;
}
