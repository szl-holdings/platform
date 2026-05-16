/**
 * Terra deal risk scoring.
 *
 * Thin domain wrapper around the canonical `riskScore` from
 * `@szl-holdings/formulas` (docs/thesis/v10-canonical.md §5.2).
 *
 * Do not re-implement the severity·likelihood·value computation here —
 * if the formula needs to change, change it in `lib/formulas/src/risk.ts`
 * so every consumer (Sentra, Counsel, Terra) moves together.
 */
import { riskScore } from '@szl-holdings/formulas';

export interface DealScoreInput {
  severity: number;
  likelihood: number;
  dealValueUsd: number;
  cap?: number;
}

/** Compound deal risk for a Terra real-estate deal. */
export function dealScore({ severity, likelihood, dealValueUsd, cap }: DealScoreInput): number {
  return riskScore(severity, likelihood, dealValueUsd, cap);
}

export { riskScore };
