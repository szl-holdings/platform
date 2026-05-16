/**
 * Counsel matter risk scoring.
 *
 * Thin domain wrapper around the canonical `riskScore` from
 * `@szl-holdings/formulas` (docs/thesis/v10-canonical.md §5.2).
 *
 * Do not re-implement the severity·likelihood·value computation here —
 * if the formula needs to change, change it in `lib/formulas/src/risk.ts`
 * so every consumer (Sentra, Counsel, Terra) moves together.
 */
import { riskScore, normalizedRiskScore } from '@szl-holdings/formulas';

export interface MatterRiskInput {
  severity: number;
  likelihood: number;
  exposureUsd: number;
  cap?: number;
}

/** Compound risk for a legal matter. */
export function matterRisk({ severity, likelihood, exposureUsd, cap }: MatterRiskInput): number {
  return riskScore(severity, likelihood, exposureUsd, cap);
}

/**
 * Same compound risk as `matterRisk`, normalised to [0, 1] so it can be
 * fed directly into `autonomyGate()` from `@szl-holdings/formulas`.
 */
export function matterRiskNormalized({ severity, likelihood, exposureUsd, cap }: MatterRiskInput): number {
  return normalizedRiskScore(severity, likelihood, exposureUsd, cap);
}

export { riskScore, normalizedRiskScore };
