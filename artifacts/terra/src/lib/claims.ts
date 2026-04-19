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
  makeClaimResolver,
  metricDisplay,
  type ClaimValue,
} from "@szl-holdings/domain-claims";

export type { ClaimValue };
export { metricDisplay };

const resolveClaim = makeClaimResolver("terra/claims");

export const TERRA_PORTFOLIO_AUM = resolveClaim(
  "terra-portfolio-aum",
  "$4.2B+ assets under analysis"
);
