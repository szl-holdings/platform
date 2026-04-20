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

import { type ClaimValue, makeClaimResolver, metricDisplay } from '@szl-holdings/domain-claims';

export type { ClaimValue };
export { metricDisplay };

const resolveClaim = makeClaimResolver('vessels/claims');

export const VESSELS_COUNT = resolveClaim('vessels-count', '52,000+');
export const VESSELS_DARK_DETECTION_LEAD = resolveClaim(
  'vessels-dark-detection-lead',
  '34 days pre-designation',
);
export const VESSELS_UPTIME_SLA = resolveClaim('vessels-uptime-sla', '99.97% uptime SLA');
