/**
 * Precision Evolution Runtime (PER) — Zod schemas and inferred types
 *
 * These schemas mirror the request/response contracts of the PER API routes
 * at /evolution/*. Import from @szl-holdings/api-zod for typed API calls.
 */

import { z } from 'zod';

export const PerPrecisionProfileSchema = z.enum([
  'cpu_safe',
  'cuda_bf16',
  'cuda_fp8_linear',
  'cuda_fp8_linear_kv',
  'remote_accelerated',
  'future_blackwell_path',
]);
export type PerPrecisionProfile = z.infer<typeof PerPrecisionProfileSchema>;

export const PerCandidateStateSchema = z.enum([
  'draft',
  'shadow',
  'review',
  'active',
  'rolled_back',
  'archived',
]);
export type PerCandidateState = z.infer<typeof PerCandidateStateSchema>;

export const PerEvaluationStatusSchema = z.enum([
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
]);
export type PerEvaluationStatus = z.infer<typeof PerEvaluationStatusSchema>;

export const PerPromotionOutcomeSchema = z.enum([
  'pending_review',
  'approved',
  'rejected',
  'rolled_back',
]);
export type PerPromotionOutcome = z.infer<typeof PerPromotionOutcomeSchema>;

export const PerRolloutStatusSchema = z.enum([
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
]);
export type PerRolloutStatus = z.infer<typeof PerRolloutStatusSchema>;

export const RegisterCandidateRequestSchema = z.object({
  displayName: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  baseModelRef: z.string().max(200).optional(),
  candidateModelRef: z.string().max(200).optional(),
  policyVersion: z.string().default('0.1.0'),
  precisionProfile: PerPrecisionProfileSchema.default('cpu_safe'),
  inferenceBackend: z.string().default('local_safe'),
  trainingBackend: z.string().default('local_safe'),
  evaluationBackend: z.string().default('local_safe'),
});
export type RegisterCandidateRequest = z.infer<typeof RegisterCandidateRequestSchema>;

export const LaunchEvaluationRequestSchema = z.object({
  suiteId: z.string().optional(),
  suiteName: z.string().optional(),
  triggeredBy: z.enum(['api', 'scheduled', 'promotion_gate', 'manual', 'simulation']).default('api'),
});
export type LaunchEvaluationRequest = z.infer<typeof LaunchEvaluationRequestSchema>;

export const PromotionRequestSchema = z.object({
  targetState: PerCandidateStateSchema.extract(['shadow', 'review', 'active']).default('review'),
  reason: z.string().max(1000).optional(),
});
export type PromotionRequest = z.infer<typeof PromotionRequestSchema>;

export const ApproveRejectRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().max(1000).optional(),
});
export type ApproveRejectRequest = z.infer<typeof ApproveRejectRequestSchema>;

export const RollbackRequestSchema = z.object({
  reason: z.string().min(1).max(1000),
});
export type RollbackRequest = z.infer<typeof RollbackRequestSchema>;

export const PerCandidateSchema = z.object({
  candidateId: z.string(),
  displayName: z.string(),
  description: z.string().nullable().optional(),
  baseModelRef: z.string().nullable().optional(),
  candidateModelRef: z.string().nullable().optional(),
  policyVersion: z.string(),
  precisionProfile: PerPrecisionProfileSchema,
  inferenceBackend: z.string(),
  trainingBackend: z.string(),
  evaluationBackend: z.string(),
  state: PerCandidateStateSchema,
  activatedAt: z.string().nullable().optional(),
  rolledBackAt: z.string().nullable().optional(),
  rollbackReason: z.string().nullable().optional(),
  simulated: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type PerCandidate = z.infer<typeof PerCandidateSchema>;

export const PerEvaluationRunSchema = z.object({
  runId: z.string(),
  candidateId: z.string(),
  suiteId: z.string().nullable().optional(),
  suiteName: z.string().nullable().optional(),
  status: PerEvaluationStatusSchema,
  triggeredBy: z.string().optional(),
  totalCases: z.number().int(),
  passed: z.number().int(),
  failed: z.number().int(),
  passRate: z.number().nullable().optional(),
  avgScoreTotal: z.number().nullable().optional(),
  avgLatencyMs: z.number().nullable().optional(),
  hasRegression: z.boolean().optional(),
  regressionSeverity: z.string().optional(),
  coverageThresholdMet: z.boolean().optional(),
  simulated: z.boolean(),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});
export type PerEvaluationRun = z.infer<typeof PerEvaluationRunSchema>;

export const PerPromotionDecisionSchema = z.object({
  decisionId: z.string(),
  candidateId: z.string(),
  fromState: z.string(),
  toState: z.string(),
  outcome: PerPromotionOutcomeSchema,
  humanApprovalRequired: z.boolean(),
  rewardScore: z.number(),
  driftScore: z.number(),
  governancePassedAll: z.boolean(),
  coverageThresholdMet: z.boolean(),
  rollbackVerified: z.boolean(),
  evidenceBundle: z.record(z.unknown()).nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  auditChainEventId: z.number().int().nullable().optional(),
  simulated: z.boolean(),
  approvedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type PerPromotionDecision = z.infer<typeof PerPromotionDecisionSchema>;

export const PerDiagnosticsSchema = z.object({
  profile: z.string().optional(),
  precisionProfile: z.string().optional(),
  environmentMode: z.string(),
  cudaAvailable: z.boolean().optional(),
  bf16Supported: z.boolean().optional(),
  fp8Supported: z.boolean().optional(),
  remoteBackendConfigured: z.boolean().optional(),
  remoteBackendHealthy: z.boolean().optional(),
  inferenceBackend: z.string(),
  trainingBackend: z.string(),
  evaluationBackend: z.string(),
  evolutionMode: z.string(),
  promotionMode: z.string(),
  calibrationMode: z.string(),
  driftGuardActive: z.boolean(),
  activeJobCount: z.number().int(),
  queueDepth: z.number().int(),
  simulated: z.boolean(),
});
export type PerDiagnostics = z.infer<typeof PerDiagnosticsSchema>;

export const PerGateResultSchema = z.object({
  candidateId: z.string(),
  eligible: z.boolean(),
  blockers: z.array(z.string()),
  reasons: z.array(z.string()),
  rewardScore: z.number(),
  driftScore: z.number(),
  governancePassedAll: z.boolean(),
  coverageThresholdMet: z.boolean(),
  rollbackVerified: z.boolean(),
});
export type PerGateResult = z.infer<typeof PerGateResultSchema>;

export const PerAuditEventSchema = z.object({
  type: z.string(),
  candidateId: z.string().optional(),
  detail: z.string().optional(),
  decisionId: z.string().optional(),
  domain: z.string().optional(),
  outcome: z.string(),
  riskLevel: z.string(),
  timestamp: z.string().optional(),
  simulated: z.boolean(),
});
export type PerAuditEvent = z.infer<typeof PerAuditEventSchema>;

export const PerPromoteResponseSchema = z.object({
  ok: z.literal(true),
  data: PerPromotionDecisionSchema,
  message: z.string(),
  gateResult: PerGateResultSchema,
  simulated: z.boolean().optional(),
});
export type PerPromoteResponse = z.infer<typeof PerPromoteResponseSchema>;

export const PerGateBlockedResponseSchema = z.object({
  ok: z.literal(false),
  error: z.literal('promotion_gate_failed'),
  message: z.string(),
  blockers: z.array(z.string()),
  reasons: z.array(z.string()),
  rewardScore: z.number(),
  driftScore: z.number(),
});
export type PerGateBlockedResponse = z.infer<typeof PerGateBlockedResponseSchema>;
