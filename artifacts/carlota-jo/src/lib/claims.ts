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

import { FOUNDER_YEARS_EXPERIENCE } from '@szl-holdings/platform-registry/public-claims';
import { type ClaimValue, makeClaimResolver, metricDisplay } from '@szl-holdings/platform-registry/domain-claims';

export type { ClaimValue };
export { metricDisplay };

const resolveClaim = makeClaimResolver('carlota-jo/claims');

export const CARLOTA_JO_RETENTION = resolveClaim('carlota-jo-retention', '98%');

/**
 * Founder experience years is computed from the registered start year so the
 * claim auto-updates each year and never drifts from the bio source of truth.
 */
export const CARLOTA_JO_YEARS_EXPERIENCE: ClaimValue = {
  key: 'carlota-jo-years-experience',
  namespace: 'carlota-jo',
  value: `${FOUNDER_YEARS_EXPERIENCE} years`,
  displayLabel: null,
  truthValue: 'verified',
};
