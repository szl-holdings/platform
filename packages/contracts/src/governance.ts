/**
 * Governed Autonomy contracts — ACR approval interrupts & run ledger.
 *
 * These are the wire types shared across cognitive-runtime, approvals-inbox,
 * run-ledger, api-server and the Command UI surface.
 */
import { z } from 'zod';

// ─── Approval Interrupt ───────────────────────────────────────────────────────

export const ApprovalInterruptSpecSchema = z.object({
  /** Human-readable label for the action that needs approval. */
  actionLabel: z.string().min(1).max(256),
  /** Structured payload describing what the action will do. */
  payload: z.record(z.unknown()).default({}),
  /** Policy rule ID or short description of why approval is required. */
  policyReason: z.string().min(1).max(512),
  /** Brief summary of supporting evidence for this decision point. */
  evidenceSummary: z.string().max(1024).default(''),
  /** Operator-facing suggestion: 'approve' | 'deny' | 'escalate'. */
  suggestedDecision: z.enum(['approve', 'deny', 'escalate']).default('approve'),
  /** Unix epoch ms when this approval request expires. */
  expiresAt: z.number().int().positive(),
});
export type ApprovalInterruptSpec = z.infer<typeof ApprovalInterruptSpecSchema>;

// ─── Approval Request ─────────────────────────────────────────────────────────

export const ApprovalRequestSchema = z.object({
  id: z.string().uuid(),
  runId: z.string(),
  traceId: z.string().optional(),
  tenantId: z.string().optional(),
  profileId: z.string().optional(),
  stepId: z.string(),
  stepName: z.string(),
  checkpointRef: z.string().optional(),
  interrupt: ApprovalInterruptSpecSchema,
  status: z.enum(['pending', 'approved', 'denied', 'escalated', 'timed_out']).default('pending'),
  requestedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
  resolvedAt: z.number().int().positive().optional(),
  resolvedBy: z.string().optional(),
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

// ─── Approval Decision ────────────────────────────────────────────────────────

export const ApprovalDecisionSchema = z.object({
  decisionId: z.string().uuid(),
  requestId: z.string().uuid(),
  verdict: z.enum(['approve', 'deny', 'escalate']),
  actor: z.string().min(1),
  reason: z.string().min(1).max(2048),
  decidedAt: z.number().int().positive(),
  /** Ed25519 signature over requestId:verdict:actor:decidedAt, base64url-encoded. */
  signature: z.string().optional(),
  /** SPKI-DER hex-encoded Ed25519 public key used to produce this signature. */
  publicKeyHex: z.string().optional(),
});
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;

// ─── Run Ledger Entry ─────────────────────────────────────────────────────────

export const LedgerToolCallSchema = z.object({
  toolId: z.string(),
  stepId: z.string(),
  latencyMs: z.number().int().nonnegative(),
  outcome: z.enum(['success', 'failure', 'skipped']),
  error: z.string().optional(),
});
export type LedgerToolCall = z.infer<typeof LedgerToolCallSchema>;

export const LedgerSourceSchema = z.object({
  sourceId: z.string(),
  sourceType: z.string(),
  retrievalScore: z.number().min(0).max(1),
  summary: z.string().max(512).optional(),
});
export type LedgerSource = z.infer<typeof LedgerSourceSchema>;

export const LedgerApprovalEventSchema = z.object({
  requestId: z.string(),
  stepId: z.string(),
  verdict: z.enum(['approve', 'deny', 'escalate', 'timed_out', 'pending']),
  actor: z.string().optional(),
  decidedAt: z.number().int().optional(),
});
export type LedgerApprovalEvent = z.infer<typeof LedgerApprovalEventSchema>;

export const LedgerPolicyOutcomeSchema = z.object({
  policyId: z.string(),
  result: z.enum(['pass', 'require-approval', 'block', 'pending']),
  tier: z.string().optional(),
  reason: z.string().optional(),
});
export type LedgerPolicyOutcome = z.infer<typeof LedgerPolicyOutcomeSchema>;

export const LedgerEvalScoreSchema = z.object({
  metric: z.string(),
  score: z.number().min(0).max(1),
  threshold: z.number().min(0).max(1),
  passed: z.boolean(),
});
export type LedgerEvalScore = z.infer<typeof LedgerEvalScoreSchema>;

export const LedgerStagingTimingSchema = z.object({
  phase: z.string(),
  startedAt: z.number().int(),
  durationMs: z.number().int().nonnegative(),
});
export type LedgerStageTiming = z.infer<typeof LedgerStagingTimingSchema>;

export const RunLedgerEntrySchema = z.object({
  ledgerId: z.string().uuid(),
  requestId: z.string(),
  runId: z.string(),
  traceId: z.string().optional(),
  tenantId: z.string().optional(),
  actor: z.string().optional(),
  profileId: z.string().optional(),
  objective: z.string(),
  planSummary: z.string().optional(),
  planStepCount: z.number().int().nonnegative().default(0),
  sourcesConsulted: z.array(LedgerSourceSchema).default([]),
  toolCalls: z.array(LedgerToolCallSchema).default([]),
  approvalEvents: z.array(LedgerApprovalEventSchema).default([]),
  policyOutcomes: z.array(LedgerPolicyOutcomeSchema).default([]),
  finalArtifacts: z.array(z.string()).default([]),
  evalScores: z.array(LedgerEvalScoreSchema).default([]),
  stageTimings: z.array(LedgerStagingTimingSchema).default([]),
  startedAt: z.number().int(),
  completedAt: z.number().int().optional(),
  totalDurationMs: z.number().int().nonnegative().optional(),
  gateStatus: z.enum(['complete', 'degraded', 'blocked', 'pending']).default('pending'),
  gateResult: z.unknown().optional(),
  createdAt: z.number().int(),
});
export type RunLedgerEntry = z.infer<typeof RunLedgerEntrySchema>;

// ─── Quality Gate Result ──────────────────────────────────────────────────────

export const QualityGateFailingGateSchema = z.object({
  gate: z.string(),
  reason: z.string(),
  actual: z.number().optional(),
  threshold: z.number().optional(),
});
export type QualityGateFailingGate = z.infer<typeof QualityGateFailingGateSchema>;

export const QualityGateResultSchema = z.object({
  status: z.enum(['complete', 'degraded', 'blocked']),
  failingGates: z.array(QualityGateFailingGateSchema).default([]),
  recommendedNextAction: z.string(),
  evaluatedAt: z.number().int(),
});
export type QualityGateResult = z.infer<typeof QualityGateResultSchema>;

// ─── API request/response shapes ──────────────────────────────────────────────

export const approvalDecideBodySchema = z.object({
  verdict: z.enum(['approve', 'deny', 'escalate']),
  actor: z.string().min(1).max(128),
  reason: z.string().min(1).max(2048),
  /** Optional caller-supplied idempotency key. When provided, repeated calls
   *  with the same decisionId return the original decision without duplicates. */
  decisionId: z.string().uuid().optional(),
});
export type ApprovalDecideBody = z.infer<typeof approvalDecideBodySchema>;

export const approvalsListQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'denied', 'escalated', 'timed_out']).optional(),
  tenantId: z.string().optional(),
  profileId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});
export type ApprovalsListQuery = z.infer<typeof approvalsListQuerySchema>;

export const runsLedgerQuerySchema = z.object({
  traceId: z.string().optional(),
  tenantId: z.string().optional(),
  gateStatus: z.enum(['complete', 'degraded', 'blocked', 'pending']).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});
export type RunsLedgerQuery = z.infer<typeof runsLedgerQuerySchema>;
