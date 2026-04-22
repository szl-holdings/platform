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

import { type ClaimValue, makeClaimResolver, metricDisplay } from '@szl-holdings/domain-claims';

export type { ClaimValue };
export { metricDisplay };

const resolveClaim = makeClaimResolver('pulse/claims');

export const PULSE_FALLBACK_BRIEFING = resolveClaim(
  'pulse-fallback-briefing',
  'Synthesized briefing',
);

/**
 * Convenience constant: the bare label string ("[Synthesized]") to render on
 * any fallback briefing card so the reader sees a clear provenance signal.
 */
export const PULSE_SYNTHESIZED_LABEL = PULSE_FALLBACK_BRIEFING.displayLabel ?? '[Synthesized]';
