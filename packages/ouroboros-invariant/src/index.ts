/**
 * @workspace/ouroboros-invariant — the Lutar Invariant.
 *
 * The single closed-form scalar in [0,1] that compounds runtime-trust axes
 * into one auditable number, with Egyptian-inspectable weights and a
 * provable bound.
 *
 * Exports:
 *   - Lutar Invariant (4-axis original)
 *   - Lutar Invariant 6-9 (extended axes: Gauss, Invariance, Moral, Being, Non-measurability)
 *   - 9-Axis Evaluator pipeline (feeds philosopher packages into the formal invariant)
 */

export * from "./lutar-invariant.js";

export {
  lutarInvariant6,
  lutarInvariant7,
  lutarInvariant8,
  lutarInvariant9,
  verifyLutarBoundN,
} from "./lutar-invariant-9.js";
export type {
  LutarAxes6,
  LutarAxes7,
  LutarAxes8,
  LutarAxes9,
  LutarReportN,
} from "./lutar-invariant-9.js";

export {
  evaluateAxes9,
  evaluateAxesFromReceipt,
} from "./axis-evaluator.js";
export type {
  AxisEvaluatorInput,
  AxisEvaluatorReport,
} from "./axis-evaluator.js";

export {
  ARTIFACT_DIMENSIONS,
  lutarV10Audit,
  fullArtifactRow,
  partialArtifactRow,
} from "./lutar-v10-audit.js";
export type {
  ArtifactDimension,
  LutarLayerArtifacts,
  MissingArtifact,
  LutarV10AuditReport,
} from "./lutar-v10-audit.js";
