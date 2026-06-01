import { z } from 'zod';

export const CapabilityStatusSchema = z.enum(['active', 'degraded', 'unavailable', 'unknown']);

export const CapabilitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  status: CapabilityStatusSchema.default('active'),
  version: z.string().optional(),
  lastUsedAt: z.string().optional(),
  successRate: z.number().min(0).max(1).optional(),
  avgLatencyMs: z.number().nonnegative().optional(),
});

export const RiskTierSchema = z.enum([
  'advisory-only',
  'internal-workflow',
  'autonomous-reversible',
  'autonomous-irreversible',
  'regulated-workflow',
  'executive-facing',
  'human-approval-mandatory',
  'classified',
]);

export const ToolAccessSchema = z.object({
  toolId: z.string(),
  name: z.string(),
  permitted: z.boolean(),
  riskTier: RiskTierSchema,
  lastInvokedAt: z.string().optional(),
  invocationCount: z.number().int().nonnegative().optional(),
  errorCount: z.number().int().nonnegative().optional(),
});

export const ActiveObjectiveSchema = z.object({
  objectiveId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(10),
  progress: z.number().min(0).max(1).optional(),
  startedAt: z.string().optional(),
  dueAt: z.string().optional(),
  status: z
    .enum(['pending', 'in-progress', 'blocked', 'completed', 'abandoned'])
    .default('pending'),
});

export const PerformanceRecordSchema = z.object({
  runId: z.string(),
  agentId: z.string(),
  domain: z.string().optional(),
  outcome: z.enum(['success', 'partial', 'failure']),
  summary: z.string().optional(),
  durationMs: z.number().nonnegative().optional(),
  confidenceBefore: z.number().min(0).max(1).optional(),
  confidenceAfter: z.number().min(0).max(1).optional(),
  drift: z.number().optional(),
  errorCode: z.string().optional(),
  occurredAt: z.string(),
});

export const LearnedStrategySchema = z.object({
  strategyId: z.string(),
  description: z.string(),
  applicableContexts: z.array(z.string()).default([]),
  reinforcedCount: z.number().int().nonnegative().default(1),
  successRate: z.number().min(0).max(1).optional(),
  learnedAt: z.string(),
});

export const ConfidenceProfileSchema = z.object({
  overall: z.number().min(0).max(1),
  byDomain: z.record(z.number().min(0).max(1)).default({}),
  byCapability: z.record(z.number().min(0).max(1)).default({}),
  trend: z.enum(['rising', 'stable', 'declining']).default('stable'),
  lastAdjustedAt: z.string(),
});

export const UncertaintyProfileSchema = z.object({
  overall: z.number().min(0).max(1),
  byDomain: z.record(z.number().min(0).max(1)).default({}),
  flaggedAreas: z.array(z.string()).default([]),
  lastReviewedAt: z.string(),
});

export const RoutingPatternSchema = z.object({
  patternId: z.string(),
  description: z.string(),
  preferredFor: z.array(z.string()).default([]),
  avoidFor: z.array(z.string()).default([]),
  successRate: z.number().min(0).max(1).optional(),
});

export const EscalationThresholdSchema = z.object({
  metric: z.string(),
  threshold: z.number(),
  action: z.enum(['request-help', 'pause', 'abort', 'notify']),
  notifyRecipients: z.array(z.string()).default([]),
});

export const HumanDependencySchema = z.object({
  role: z.string(),
  userId: z.string().optional(),
  reason: z.string(),
  escalationLevel: z.enum(['advisory', 'approval-required', 'blocking']),
});

export const DomainProfileSchema = z.object({
  domain: z.string(),
  strength: z.enum(['strong', 'adequate', 'weak', 'unknown']).default('unknown'),
  confidence: z.number().min(0).max(1),
  knowledgeCount: z.number().int().nonnegative().optional(),
  lastActiveAt: z.string().optional(),
});

export const IdentityProfileSchema = z.object({
  runtimeId: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  owner: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production', 'sandbox']).default('production'),
  launchedAt: z.string(),
  primaryDomain: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const PolicyInForceSchema = z.object({
  policyId: z.string(),
  name: z.string(),
  domain: z.string().optional(),
  effect: z.string(),
  priority: z.number().int(),
  appliedAt: z.string(),
});

export const SelfModelStateSchema = z.object({
  runtimeId: z.string(),
  identityProfile: IdentityProfileSchema,
  activeObjectives: z.array(ActiveObjectiveSchema).default([]),
  capabilities: z.array(CapabilitySchema).default([]),
  toolAccess: z.array(ToolAccessSchema).default([]),
  riskTier: RiskTierSchema.default('internal-workflow'),
  policiesInForce: z.array(PolicyInForceSchema).default([]),
  currentEnvironment: z.string().default('production'),
  recentFailures: z.array(PerformanceRecordSchema).default([]),
  recentWins: z.array(PerformanceRecordSchema).default([]),
  learnedStrategies: z.array(LearnedStrategySchema).default([]),
  confidenceProfile: ConfidenceProfileSchema,
  uncertaintyProfile: UncertaintyProfileSchema,
  preferredRoutingPatterns: z.array(RoutingPatternSchema).default([]),
  escalationThresholds: z.array(EscalationThresholdSchema).default([]),
  humanDependencies: z.array(HumanDependencySchema).default([]),
  domainStrengths: z.array(DomainProfileSchema).default([]),
  domainWeaknesses: z.array(DomainProfileSchema).default([]),
  driftScore: z.number().min(0).default(0),
  failurePatternCount: z.number().int().nonnegative().default(0),
  consecutiveFailures: z.number().int().nonnegative().default(0),
  version: z.number().int().positive().default(1),
  updatedAt: z.string(),
});

export const RunOutcomeSchema = z.object({
  runId: z.string(),
  agentId: z.string(),
  domain: z.string().optional(),
  status: z.enum(['success', 'partial', 'failure']),
  summary: z.string().optional(),
  durationMs: z.number().nonnegative().optional(),
  errorCode: z.string().optional(),
  confidenceDelta: z.number().optional(),
});

export const CreateSelfModelSchema = z.object({
  agentId: z.string(),
  identityProfile: IdentityProfileSchema,
  capabilities: z.array(CapabilitySchema).default([]),
  toolAccess: z.array(ToolAccessSchema).default([]),
  riskTier: RiskTierSchema.default('internal-workflow'),
  activeObjectives: z.array(ActiveObjectiveSchema).default([]),
  policiesInForce: z.array(PolicyInForceSchema).default([]),
  currentEnvironment: z.string().default('production'),
  escalationThresholds: z.array(EscalationThresholdSchema).default([]),
  humanDependencies: z.array(HumanDependencySchema).default([]),
  learnedStrategies: z.array(LearnedStrategySchema).default([]),
  preferredRoutingPatterns: z.array(RoutingPatternSchema).default([]),
  domainStrengths: z.array(DomainProfileSchema).default([]),
  domainWeaknesses: z.array(DomainProfileSchema).default([]),
});

export type SelfModelStateInput = z.infer<typeof SelfModelStateSchema>;
export type RunOutcomeInput = z.infer<typeof RunOutcomeSchema>;
export type CreateSelfModelInput = z.infer<typeof CreateSelfModelSchema>;

/**
 * DB row types — match the cognitive_runtime schema in lib/db/src/schema/cognitive_runtime.ts.
 * Re-exported here so consumers of @workspace/self-model/schema can access both
 * Zod validators and the database row shapes without importing from @szl-holdings/db directly.
 */
export interface SelfModelDbRow {
  id: string;
  agentId: string;
  version: number;
  status: 'draft' | 'active' | 'archived' | 'deprecated';
  capabilities: unknown[];
  goals: Record<string, unknown>[];
  constraints: Record<string, unknown>[];
  beliefs: Record<string, unknown>;
  identity: Record<string, unknown>;
  performanceProfile: Record<string, unknown>;
  confidence: number;
  sensitivityTier: 'public' | 'internal' | 'confidential' | 'restricted' | 'top-secret';
  provenanceSource: string;
  provenanceMethod: 'api' | 'manual' | 'agent' | 'import' | 'derived';
  provenanceAuthor: string | null;
  freshnessLastUpdatedAt: Date;
  freshnessTtlSeconds: number | null;
  freshnessIsStale: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SelfModelSnapshotDbRow {
  id: string;
  selfModelId: string;
  agentId: string;
  version: number;
  snapshotData: Record<string, unknown>;
  changeReason: string | null;
  triggeredBy: string | null;
  traceId: string | null;
  confidence: number;
  sensitivityTier: 'public' | 'internal' | 'confidential' | 'restricted' | 'top-secret';
  provenanceSource: string;
  provenanceMethod: 'api' | 'manual' | 'agent' | 'import' | 'derived';
  metadata: Record<string, unknown>;
  createdAt: Date;
}
