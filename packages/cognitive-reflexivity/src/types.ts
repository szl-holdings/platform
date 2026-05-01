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
  components: z.object({
    monologueCadence: z.number().min(0).max(1),
    strategyPromotionRate: z.number().min(0).max(1),
    dialecticAgreement: z.number().min(0).max(1),
    memoryConsolidationHealth: z.number().min(0).max(1),
    governanceGoodStanding: z.number().min(0).max(1),
  }),
  computedAt: z.string().datetime(),
  windowMinutes: z.number().int().positive(),
});
export type CognitiveHealthScore = z.infer<typeof CognitiveHealthScoreSchema>;

// ---------- Helpers ----------

/**
 * Classify a strategy into a Guardian tier given its class and confidence.
 * Advisory class always lands in 'advisory'. Hard constraints require human
 * approval at higher confidence demands.
 */
export function classifyTier(
  klass: StrategyClass,
  confidence: number,
): StrategyTier {
  if (klass === 'router.advisory' || klass === 'memory.consolidation-hint') {
    return 'advisory';
  }
  if (klass === 'detection.confidence-floor' || klass === 'sync.retry-policy') {
    return confidence >= 0.85 ? 'supervised' : 'operator-approved';
  }
  if (klass === 'router.retrieval-bias') {
    return confidence >= 0.8 ? 'advisory' : 'supervised';
  }
  // router.constraint — high impact, never auto-apply
  return confidence >= 0.9 ? 'operator-approved' : 'dual-approved';
}
