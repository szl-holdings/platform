import { z } from "zod";

export const AutonomyModeSchema = z.enum([
  "observe",
  "recommend",
  "draft",
  "ask-to-act",
  "approved-act",
]);
export type AutonomyMode = z.infer<typeof AutonomyModeSchema>;

export const EvidenceKindSchema = z.enum([
  "signal",
  "memory",
  "document",
  "metric",
  "observation",
  "attestation",
  "policy",
  "trace",
]);
export type EvidenceKind = z.infer<typeof EvidenceKindSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  kind: EvidenceKindSchema,
  label: z.string(),
  value: z.string(),
  source: z.string(),
  sourceId: z.string().optional(),
  freshness: z.object({
    capturedAt: z.string().datetime(),
    isStale: z.boolean().default(false),
    maxAgeMs: z.number().positive().optional(),
  }),
  confidence: z.number().min(0).max(1),
  weight: z.number().min(0).max(1).default(1),
  metadata: z.record(z.unknown()).default({}),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const PolicyStateSchema = z.enum([
  "unchecked",
  "allowed",
  "requires_approval",
  "blocked",
]);
export type PolicyState = z.infer<typeof PolicyStateSchema>;

export const ApprovalModeSchema = z.enum([
  "none",
  "pending",
  "approved",
  "rejected",
  "escalated",
]);
export type ApprovalMode = z.infer<typeof ApprovalModeSchema>;

export const PolicyDecisionSchema = z.object({
  allowed: z.boolean(),
  policyState: PolicyStateSchema,
  requiresApproval: z.boolean(),
  requiredApproverRole: z.string().optional(),
  escalationTarget: z.string().optional(),
  matchedPolicies: z.array(z.object({
    policyId: z.string(),
    ruleName: z.string(),
    effect: z.string(),
  })),
  violations: z.array(z.object({
    policyId: z.string(),
    policyName: z.string(),
    reason: z.string(),
  })),
  reasoning: z.string(),
  evaluatedAt: z.number(),
});
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

export const RunTraceSchema = z.object({
  traceId: z.string(),
  runId: z.string(),
  workflowId: z.string().optional(),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  objective: z.string().optional(),
  autonomyMode: AutonomyModeSchema,
  status: z.enum(["pending", "running", "paused", "awaiting-approval", "completed", "failed", "rolled-back"]),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  totalLatencyMs: z.number().optional(),
  totalCostUsd: z.number().optional(),
  toolCallCount: z.number().int().default(0),
  approvalCount: z.number().int().default(0),
  evidenceIds: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});
export type RunTrace = z.infer<typeof RunTraceSchema>;

export const RecommendationResultSchema = z.object({
  id: z.string(),
  runId: z.string(),
  traceId: z.string(),
  value: z.unknown(),
  title: z.string(),
  summary: z.string(),
  reasoning: z.string(),
  domain: z.string(),
  confidence: z.number().min(0).max(1),
  supportingEvidenceIds: z.array(z.string()).default([]),
  contradictingEvidenceIds: z.array(z.string()).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  freshness: z.object({
    generatedAt: z.string().datetime(),
    isStale: z.boolean().default(false),
    validUntil: z.string().datetime().optional(),
  }),
  policyState: PolicyStateSchema,
  policyDecision: PolicyDecisionSchema.optional(),
  approvalMode: ApprovalModeSchema,
  autonomyMode: AutonomyModeSchema,
  urgency: z.enum(["routine", "moderate", "urgent", "critical"]),
  suggestedAction: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type RecommendationResult = z.infer<typeof RecommendationResultSchema>;

export const AlloyRunSessionSchema = z.object({
  runId: z.string(),
  traceId: z.string(),
  tenantOrgId: z.number().int().nullable().default(null),
  autonomyMode: AutonomyModeSchema,
  status: z.enum(["open", "closed", "failed"]),
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().optional(),
  handoffs: z.array(z.object({
    fromAgent: z.string(),
    toAgent: z.string(),
    reason: z.string(),
    at: z.string().datetime(),
  })).default([]),
  approvals: z.array(z.object({
    approvalId: z.string(),
    stepId: z.string(),
    decision: z.enum(["pending", "approved", "rejected", "escalated"]),
    decidedAt: z.string().datetime().optional(),
  })).default([]),
  toolCalls: z.array(z.object({
    toolId: z.string(),
    toolName: z.string(),
    success: z.boolean(),
    latencyMs: z.number().optional(),
  })).default([]),
  outcome: z.unknown().optional(),
  evidenceIds: z.array(z.string()).default([]),
});
export type AlloyRunSession = z.infer<typeof AlloyRunSessionSchema>;

export const ALLOY_RUNTIME_VERSION = "1.0.0" as const;
