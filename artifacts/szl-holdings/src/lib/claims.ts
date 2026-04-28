/**
 * Claims adapter for szl-holdings
 *
 * All public-facing numbers, taglines, and capability claims on this surface
 * are sourced from @szl-holdings/platform-registry/public-claims. This is the proof-point
 * migration: instead of hardcoded strings in ventures.ts or component files,
 * every claim goes through this adapter so:
 *
 *   1. The truth value is explicit and enforced at the type level.
 *   2. Claims that are not "verified" automatically receive the correct UI label.
 *   3. A smoke test can verify that registry strings appear in rendered HTML.
 *
 * Audit reference: docs/audit/2026-04/public-claims-registry.md
 * Registry source:  packages/config/src/public-claims.ts
 */

import { type ClaimValue, makeClaimResolver, metricDisplay } from '@szl-holdings/domain-claims';
import { FOUNDER_YEARS_EXPERIENCE } from '@szl-holdings/platform-registry/public-claims';

export type { ClaimValue };
export { metricDisplay };

const resolveClaim = makeClaimResolver('szl-holdings/claims');

// ─── KORA / szl-holdings metrics ─────────────────────────────────────────────

export const LYTE_SIGNAL_DETECTION_TIME = resolveClaim('lyte-signal-detection-time', '< 4 min');

export const LYTE_SIGNALS_PER_DAY = resolveClaim('lyte-signals-per-day', '2.4M+');

export const LYTE_FALSE_POSITIVE_RATE = resolveClaim('lyte-false-positive-rate', '< 3%');

// ─── SEXTANT metrics ──────────────────────────────────────────────────────────

export const VESSELS_COUNT = resolveClaim('vessels-count', '52,000+');

export const VESSELS_DARK_DETECTION_LEAD = resolveClaim(
  'vessels-dark-detection-lead',
  '34 days pre-designation',
);

// ─── PARAGON metrics ────────────────────────────────────────────────────────────

export const AEGIS_SIMULATIONS = resolveClaim('aegis-simulations', '31,200+');

export const AEGIS_MITRE_COVERAGE = resolveClaim('aegis-mitre-coverage', '200+ techniques');

// ─── Carlota Jo metrics ───────────────────────────────────────────────────────

export const CARLOTA_JO_RETENTION = resolveClaim('carlota-jo-retention', '98%');

/**
 * Founder years experience is computed from the registered start year, not a
 * hardcoded string. This ensures the claim stays accurate as time passes.
 */
export const CARLOTA_JO_YEARS_EXPERIENCE: ClaimValue = {
  key: 'carlota-jo-years-experience',
  namespace: 'szl-holdings',
  value: `${FOUNDER_YEARS_EXPERIENCE} years`,
  displayLabel: null,
  truthValue: 'verified',
};

// ─── DOMAINE metrics (cross-surface mirror) ─────────────────────────────────────
//
// DOMAINE's portfolio AUM also surfaces on the szl-holdings ventures landing.
// Resolved from the same registry id so the value and [Demo] label stay in
// lockstep with terra/src/lib/claims.ts.

export const TERRA_PORTFOLIO_AUM = resolveClaim('terra-portfolio-aum', '$4.2B+');

// ─── Platform tagline ─────────────────────────────────────────────────────────

export const PLATFORM_TAGLINE = resolveClaim(
  'tagline-governed-decision',
  'Governed decision infrastructure — connecting what is observable to what is executable, with full attribution.',
);
