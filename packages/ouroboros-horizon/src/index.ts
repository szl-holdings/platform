/**
 * @workspace/ouroboros-horizon — public API surface.
 *
 * Five primitives, one bridge:
 *   - PageCurveTracker          : information conservation across a loop's lifetime
 *   - NoHairContract            : 5-scalar canonical loop interface
 *   - DualWitness               : internal/external complementarity audit
 *   - EntanglementMetric        : empirical loop-loop coupling graph
 *   - CapacityHorizon           : holographic capacity bound and scheduling signal
 *   - HorizonOtelBridge         : emit all of the above as OpenTelemetry GenAI spans
 *
 * Drop-in usage from any Ouroboros surface (A11oy, Sentra, Amaru):
 *
 *   import {
 *     PageCurveTracker, computeNoHair, WitnessChain, verifyDualWitness,
 *     buildEntanglementGraph, computeCapacityHorizon,
 *     HorizonOtelBridge, attachAllHorizon, asLoopId,
 *   } from "@workspace/ouroboros-horizon";
 */

export type {
  LoopId,
  LoopTick,
  RiskTier,
  NoHairState,
  ObservableSample,
  WitnessLevel,
  WitnessEntry,
  PageCurveResult,
  DualWitnessResult,
} from "./types.js";

export { asLoopId } from "./types.js";

export {
  PageCurveTracker,
  shannonEntropyBits,
  empiricalDistribution,
  mutualInformationBits,
  pageReferenceCurveBits,
  type PageCurveConfig,
} from "./page-curve.js";

export {
  computeNoHair,
  serializeNoHair,
  parseNoHair,
  noHairEquivalent,
} from "./no-hair.js";

export { WitnessChain, verifyDualWitness } from "./dual-witness.js";

export {
  entanglementBits,
  variationOfInformationBits,
  buildEntanglementGraph,
  checkEntanglementGuards,
  type EntanglementEdge,
  type EntanglementGuardConfig,
  type EntanglementViolation,
} from "./entanglement.js";

export {
  computeCapacityHorizon,
  isAboveHorizon,
  horizonMargin,
  recommendFromHorizon,
  type CapacityHorizonConfig,
  type CapacityHorizonReading,
  type HorizonRecommendation,
} from "./horizon.js";

export {
  HorizonOtelBridge,
  attachAllHorizon,
  GenAIOperation,
  type BridgeConfig,
  type GenAIOperationName,
} from "./otel-bridge.js";
