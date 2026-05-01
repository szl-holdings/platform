/**
 * Cognitive Reflexivity Engine — typed contracts.
 *
 * The cognitive-reflexive signal is a typed payload carried inside the
 * universal Signal envelope (type='cognitive-reflexive'). It feeds the
 * reflexivity loop:
 *
 *   telemetry → CognitiveReflexiveSignal → InnerMonologue (dialectical) →
 *   StrategyProposal → Guardian-tier classification → (auto-apply | approve) →
 *   Self-Model.learnedStrategies → Model Router adapts → Memory Fabric
 *   consolidates → CognitiveHealthScore.
 *
 * Every Strategy carries a Provenance chain back to the originating
 * signals, monologue thread, and dialectical trace that produced it.
 */

import { z } from 'zod';

// ---------- Cognitive Reflexive Signal ----------

export const CognitiveSubtypeSchema = z.enum([
  // Router / model layer
  'router.lane_drift',
  'router.cost_spike',
  'router.confidence_floor_breach',
  'router.retrieval_depth_recommendation',
  // Detection / cyber layer (Sentra)
  'detection.fp_spike',
  'detection.coverage_gap',
  'detection.true_positive_confirmed',
  // Sync / data layer (Conduit)
  'sync.success',
  'sync.failed',
  'sync.schema_drift',
  // Partial-success runs with elevated row-failure rate
  'sync.degraded',
  // Successful runs whose duration exceeded the SLA baseline
  'sync.slow',
  // Cognition layer (self)
  'cognition.dialectic_disagreement',
  'cognition.strategy_promoted',
  'cognition.strategy_retired',
  'cognition.consolidation_cycle',
  // Memory / consolidation
  'memory.working_full',
  'memory.episode_promoted',
  'memory.semantic_pattern_detected',
  // Telemetry-bridged subtypes — auto-emitted by telemetry-bridge.ts
  // when raw cognitive metrics breach their targets.
  'telemetry.hallucination_rate_breach',
  'telemetry.retrieval_quality_drop',
  'telemetry.citation_coverage_drop',
  'telemetry.confidence_anomaly',
  'telemetry.governance_bottleneck',
  'telemetry.value_at_risk_spike',
]);
export type CognitiveSubtype = z.infer<typeof CognitiveSubtypeSchema>;

export const CognitiveReflexivePayloadSchema = z.object({
  subtype: CognitiveSubtypeSchema,
  // What the signal is asking the cognition to consider
  observation: z.string(),
  // 0..1 — how strongly the emitter believes this is actionable
  intensity: z.number().min(0).max(1),
  // Optional pointers to richer evidence
  evidenceRefs: z.array(z.string()).default([]),
  // Optional: which agent/runtime this is about
  agentId: z.string().optional(),
  // Optional: hints for what dimension to consider adapting
  affectedDimension: z
    .enum(['lane', 'model', 'retrieval-depth', 'confidence-floor', 'detection-tuning', 'sync-retry', 'memory-tier'])
    .optional(),
  // Free-form structured data
  data: z.record(z.unknown()).default({}),
});
export type CognitiveReflexivePayload = z.infer<typeof CognitiveReflexivePayloadSchema>;

// ---------- Strategy Provenance ----------

export const StrategyTierSchema = z.enum([
  // Free to apply, audit only
  'advisory',
  // Single human approval
  'supervised',
  // Operator approval required
  'operator-approved',
  // Two-person approval required
  'dual-approved',
]);
export type StrategyTier = z.infer<typeof StrategyTierSchema>;

export const StrategyClassSchema = z.enum([
  // Advice the router CAN consider
  'router.advisory',
  // Hard constraint the router MUST apply (lane / model / floor)
  'router.constraint',
  // A retrieval-depth bias
  'router.retrieval-bias',
  // Detection rule confidence-floor adjustment (Sentra)
  'detection.confidence-floor',
  // Sync retry/backoff strategy (Conduit)
  'sync.retry-policy',
  // Memory consolidation hint
  'memory.consolidation-hint',
]);
export type StrategyClass = z.infer<typeof StrategyClassSchema>;

export const StrategyStatusSchema = z.enum([
  'proposed',
  'approved',
  'active',
  'retired',
  'rejected',
]);
export type StrategyStatus = z.infer<typeof StrategyStatusSchema>;

export const ProvenanceChainSchema = z.object({
  // Signals that triggered the dialectical reasoning
  originatingSignalIds: z.array(z.string()).default([]),
  // The monologue entries that produced this strategy
  monologueThreadIds: z.array(z.string()).default([]),
  // Dialectical thesis/antithesis/synthesis hash or brief
  dialecticalTrace: z
    .object({
      thesis: z.string(),
      antithesis: z.string(),
      synthesis: z.string(),
      confidence: z.number().min(0).max(1),
    })
    .optional(),
  // The agent/runtime that proposed this strategy
  proposedBy: z.string(),
  proposedAt: z.string().datetime(),
});
export type ProvenanceChain = z.infer<typeof ProvenanceChainSchema>;

export const ReflexiveStrategySchema = z.object({
  strategyId: z.string(),
  // What dimension this strategy adapts
  class: StrategyClassSchema,
  description: z.string(),
  // Concrete parameters the consumer applies
  // (e.g. {lane:'reasoning', minConfidence:0.7})
  params: z.record(z.unknown()),
  // Where this strategy applies
  applicableContexts: z.array(z.string()).default([]),
  // Confidence the engine has in this strategy (0..1)
  confidence: z.number().min(0).max(1),
  // Governance tier — derived from class + confidence
  tier: StrategyTierSchema,
  status: StrategyStatusSchema,
  // Full causal chain
  provenance: ProvenanceChainSchema,
  // How many times applied successfully so far
  reinforcedCount: z.number().int().nonnegative().default(0),
  successRate: z.number().min(0).max(1).optional(),
  // Lifecycle
  createdAt: z.string().datetime(),
  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().optional(),
  // For dual-approved tier strategies: first signature recorded when
  // status flips proposed→approved. Activation requires a second,
  // distinct operator. Persisted so the audit trail names both humans
  // who authorized a high-impact self-modification.
  firstApprovedBy: z.string().optional(),
  firstApprovedAt: z.string().datetime().optional(),
  retiredAt: z.string().datetime().optional(),
  // Free-form note explaining why an operator rejected the strategy.
  // Persisted for audit; not consumed by the router.
  rejectionReason: z.string().max(2000).optional(),
});
export type ReflexiveStrategy = z.infer<typeof ReflexiveStrategySchema>;

// ---------- Strategy decision trace (router uses it) ----------

export const StrategyDecisionTraceSchema = z.object({
  decisionId: z.string(),
  agentId: z.string().optional(),
  appliedStrategyIds: z.array(z.string()).default([]),
  // What dimension the strategy influenced
  influencedDimensions: z
    .array(z.enum(['lane', 'model', 'retrieval-depth', 'confidence-floor']))
    .default([]),
  // The actual values applied
  resolved: z.record(z.unknown()).default({}),
  occurredAt: z.string().datetime(),
});
export type StrategyDecisionTrace = z.infer<typeof StrategyDecisionTraceSchema>;

// ---------- Cognitive Health Score ----------

export const CognitiveHealthScoreSchema = z.object({
  score: z.number().min(0).max(100),
  tier: z.enum(['critical', 'at_risk', 'healthy', 'flourishing']),
  /**
   * Loop-mechanics dimensions: how the reflexivity loop itself is
   * functioning (does it reflect? do strategies promote? do operators
   * trust them?). Preserved for back-compat with existing dashboards.
   */
  components: z.object({
    monologueCadence: z.number().min(0).max(1),
    strategyPromotionRate: z.number().min(0).max(1),
    dialecticAgreement: z.number().min(0).max(1),
    memoryConsolidationHealth: z.number().min(0).max(1),
    governanceGoodStanding: z.number().min(0).max(1),
  }),
  /**
   * Cognitive-quality composite dimensions: what the loop is actually
   * delivering for the user. These are the four dimensions called out
   * by the validator and govern the headline tier when telemetry is
   * present.
   *
   *   hallucinationTrend          — 1.0 = falling/low hallucination
   *                                 rate over window; 0.0 = climbing/high.
   *   strategyEffectiveness       — fraction of active strategies whose
   *                                 application correlated with an
   *                                 *improvement* in downstream metrics.
   *   confidenceCalibration       — how well stated confidence matches
   *                                 observed accuracy / citation
   *                                 coverage (Brier-style).
   *   memoryRetrievalPrecision    — fraction of retrievals that returned
   *                                 the actually-used citation.
   */
  composite: z
    .object({
      hallucinationTrend: z.number().min(0).max(1),
      strategyEffectiveness: z.number().min(0).max(1),
      confidenceCalibration: z.number().min(0).max(1),
      memoryRetrievalPrecision: z.number().min(0).max(1),
    })
    .optional(),
  computedAt: z.string().datetime(),
  windowMinutes: z.number().int().positive(),
});
export type CognitiveHealthScore = z.infer<typeof CognitiveHealthScoreSchema>;

// ---------- Helpers ----------

/**
 * Classify a strategy into a Guardian tier from its class.
 *
 * The mapping is intentionally class-driven (not confidence-driven) so it
 * mirrors the documented governance contract used by the Guardian engine:
 *
 *   advisory             (T0)  — auto-applies, audit-only.
 *                                  router.advisory, memory.consolidation-hint
 *
 *   operator-approved    (T2)  — single human approves before activation.
 *                                  router.constraint, router.retrieval-bias,
 *                                  sync.retry-policy
 *
 *   dual-approved        (T3)  — two-person rule before activation.
 *                                  detection.confidence-floor (changing a
 *                                  detection threshold is high-stakes; it
 *                                  changes what the SOC sees).
 *
 * `confidence` is no longer an input: a low-confidence strategy proposal
 * still needs the same governance gate as a high-confidence one — operator
 * judgment is the gate, not engine self-confidence. Confidence is still
 * surfaced on the strategy for operator visibility.
 */
export function classifyTier(klass: StrategyClass, confidence?: number): StrategyTier {
  switch (klass) {
    case 'router.advisory':
    case 'memory.consolidation-hint':
      return 'advisory';
    case 'router.retrieval-bias':
    case 'sync.retry-policy':
      return 'operator-approved';
    // High-impact threshold mutations: minConfidence change on the
    // router constraint or any detection floor change requires two
    // distinct operators (architect-flagged dual-approval gate).
    // Low-confidence proposals on router.constraint also dual-approve
    // because confidence < 0.6 means the engine itself is uncertain.
    case 'router.constraint':
      return confidence !== undefined && confidence >= 0.6 ? 'operator-approved' : 'dual-approved';
    case 'detection.confidence-floor':
      return 'dual-approved';
    default:
      // Unknown class — be conservative.
      return 'operator-approved';
  }
}
