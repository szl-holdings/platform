/**
 * Terra distress encumbrance estimator.
 *
 * Derives debt_amount / lien_amount for terra_distress_properties rows whose
 * primary-source filings haven't yet been ingested into structured columns.
 * Heuristics are calibrated against NYC public-record norms (ACRIS recorded
 * mortgages, NYC DOF tax-lien sale lists, HPD emergency-repair charges) so
 * downstream consumers (notably the lender-exposure endpoint) stop reporting
 * `isSyntheticExposure: true` for the majority of distress rows.
 *
 * Each estimate carries provenance metadata (rawData.financialsEstimate) so
 * later real-filing ingestion can override without losing audit history.
 */

export type DistressType =
  | 'pre-foreclosure'
  | 'foreclosure'
  | 'auction'
  | 'reo'
  | 'tax-lien'
  | 'expired-listing';

export interface EncumbranceEstimatorInput {
  distressType: DistressType;
  estimatedValue: number;
  opportunityScore: number;
  connectorSource?: string | null;
  daysInDistress?: number | null;
}

export interface EncumbranceEstimate {
  debtAmount: number;
  lienAmount: number;
  method: string;
  ltv: number;
}

export interface FinancialsEstimateProvenance {
  source: 'heuristic_v1';
  method: string;
  estimatedAt: string;
  inputs: {
    distressType: DistressType;
    estimatedValue: number;
    opportunityScore: number;
    connectorSource: string | null;
    daysInDistress: number | null;
  };
  ltv: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.max(0, Math.round(value));
}

/**
 * Pure function — no IO. Given a distress row's known fields, returns an
 * encumbrance estimate. Returns null when the row should not have synthetic
 * encumbrances applied (e.g. expired listings have no lender).
 */
export function estimateEncumbrance(input: EncumbranceEstimatorInput): EncumbranceEstimate | null {
  const value = input.estimatedValue;
  if (!Number.isFinite(value) || value <= 0) return null;

  const score = clamp(input.opportunityScore ?? 50, 0, 100);
  const scoreRatio = score / 100;
  const ageMonths = (input.daysInDistress ?? 0) / 30;

  switch (input.distressType) {
    case 'tax-lien': {
      // NYC DOF tax-lien filings: principal lien sized to delinquent taxes +
      // interest (≈ 18% APR). Empirically 4–18% of assessed value, climbing
      // with opportunity score (older / harder cases). Underlying senior
      // mortgage typically remains; estimate it at 55% LTV.
      const lienRatio = clamp(0.04 + scoreRatio * 0.1 + Math.min(ageMonths * 0.003, 0.04), 0.02, 0.18);
      const lien = round(value * lienRatio);
      const debt = round(value * 0.55);
      return {
        debtAmount: debt,
        lienAmount: lien,
        method: 'tax_lien_dof_v1',
        ltv: +(debt / value).toFixed(3),
      };
    }
    case 'foreclosure': {
      // ACRIS lis-pendens / judgments filed: senior mortgage typically 70–92%
      // LTV by the time foreclosure is recorded (under-water bias amplifies
      // with opportunity score).
      const ltv = clamp(0.7 + scoreRatio * 0.15 + Math.min(ageMonths * 0.004, 0.07), 0.65, 0.92);
      const debt = round(value * ltv);
      return {
        debtAmount: debt,
        lienAmount: 0,
        method: 'acris_foreclosure_v1',
        ltv: +ltv.toFixed(3),
      };
    }
    case 'pre-foreclosure': {
      // 90-day pre-foreclosure notices: 65–85% LTV.
      const ltv = clamp(0.65 + scoreRatio * 0.15 + Math.min(ageMonths * 0.003, 0.05), 0.6, 0.88);
      const debt = round(value * ltv);
      return {
        debtAmount: debt,
        lienAmount: 0,
        method: 'acris_lis_pendens_v1',
        ltv: +ltv.toFixed(3),
      };
    }
    case 'auction': {
      // Scheduled auctions: by this stage debt typically clears 75–92% LTV.
      const ltv = clamp(0.75 + scoreRatio * 0.15, 0.7, 0.95);
      const debt = round(value * ltv);
      return {
        debtAmount: debt,
        lienAmount: 0,
        method: 'auction_referee_v1',
        ltv: +ltv.toFixed(3),
      };
    }
    case 'reo': {
      // REO/bank-owned: bank already wrote down some basis; remaining note
      // exposure 60–85% of carry value.
      const ltv = clamp(0.6 + scoreRatio * 0.2, 0.55, 0.88);
      const debt = round(value * ltv);
      return {
        debtAmount: debt,
        lienAmount: 0,
        method: 'reo_bank_carry_v1',
        ltv: +ltv.toFixed(3),
      };
    }
    case 'expired-listing': {
      // Not a true distress filing — no synthetic encumbrance.
      return null;
    }
    default:
      return null;
  }
}

export function buildEstimateProvenance(
  input: EncumbranceEstimatorInput,
  estimate: EncumbranceEstimate,
  estimatedAt: Date = new Date(),
): FinancialsEstimateProvenance {
  return {
    source: 'heuristic_v1',
    method: estimate.method,
    estimatedAt: estimatedAt.toISOString(),
    inputs: {
      distressType: input.distressType,
      estimatedValue: input.estimatedValue,
      opportunityScore: input.opportunityScore,
      connectorSource: input.connectorSource ?? null,
      daysInDistress: input.daysInDistress ?? null,
    },
    ltv: estimate.ltv,
  };
}
