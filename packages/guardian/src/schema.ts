import { z } from "zod";
import { PolicyTierSchema } from "./tiers.js";

export const RuleConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "neq", "in", "nin", "gt", "lt", "gte", "lte", "matches", "exists"]),
  value: z.unknown(),
});

export const RuleActionSchema = z.enum([
  "allow",
  "deny",
  "require-approval",
  "require-dual-approval",
  "log",
  "redact",
  "escalate",
  "block",
]);

export const GuardianRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tier: PolicyTierSchema,
  conditions: z.array(RuleConditionSchema).default([]),
  action: RuleActionSchema,
  priority: z.number().int().default(100),
  enabled: z.boolean().default(true),
  owner: z.string().optional(),
  tags: z.array(z.string()).default([]),
  allowedModels: z.array(z.string()).optional(),
  allowedTools: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type RuleCondition = z.infer<typeof RuleConditionSchema>;
export type RuleAction = z.infer<typeof RuleActionSchema>;
export type GuardianRule = z.infer<typeof GuardianRuleSchema>;

export const DecisionRequestSchema = z.object({
  requestId: z.string(),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  workflowId: z.string().optional(),
  action: z.string(),
  domain: z.string().optional(),
  tier: PolicyTierSchema.optional(),
  model: z.string().optional(),
  toolId: z.string().optional(),
  actionCount: z.number().int().nonnegative().optional(),
  environment: z.string().optional(),
  memoryScope: z.string().optional(),
  isExternalComms: z.boolean().optional(),
  context: z.record(z.unknown()).default({}),
  requestedAt: z.string().datetime().optional(),
});

export const EvaluateOutcomeSchema = z.enum([
  "allow",
  "require-approval",
  "require-dual-approval",
  "block",
]);

export type EvaluateOutcome = z.infer<typeof EvaluateOutcomeSchema>;

export const DecisionResultSchema = z.object({
  requestId: z.string(),
  outcome: z.enum(["allow", "deny", "require-approval", "require-dual-approval"]),
  matchedRuleId: z.string().optional(),
  reason: z.string(),
  requiredApprovers: z.array(z.string()).default([]),
  decidedAt: z.string().datetime(),
});

export const EvaluateResultSchema = z.object({
  requestId: z.string(),
  outcome: EvaluateOutcomeSchema,
  matchedRuleId: z.string().optional(),
  reason: z.string(),
  requiredApprovers: z.array(z.string()).default([]),
  rollbackRequired: z.boolean().default(false),
  redactApplied: z.boolean().default(false),
  controlViolations: z.array(z.string()).default([]),
  decidedAt: z.string().datetime(),
});

export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;
export type DecisionResult = z.infer<typeof DecisionResultSchema>;
export type EvaluateResult = z.infer<typeof EvaluateResultSchema>;

export const ActionRecordSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  workflowId: z.string().optional(),
  tier: PolicyTierSchema,
  action: z.string(),
  toolId: z.string().optional(),
  model: z.string().optional(),
  outcome: EvaluateOutcomeSchema,
  matchedRuleId: z.string().optional(),
  reason: z.string(),
  rollbackRequired: z.boolean().default(false),
  rollbackToken: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  decidedAt: z.string().datetime(),
  executedAt: z.string().datetime().optional(),
  rolledBackAt: z.string().datetime().optional(),
});

export type ActionRecord = z.infer<typeof ActionRecordSchema>;

export const RollbackEventSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  requestId: z.string(),
  agentId: z.string().optional(),
  tier: PolicyTierSchema,
  triggeredBy: z.string(),
  reason: z.string(),
  status: z.enum(["pending", "in-progress", "completed", "failed"]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export type RollbackEvent = z.infer<typeof RollbackEventSchema>;

export const ApprovalRequestSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  agentId: z.string().optional(),
  tier: PolicyTierSchema,
  action: z.string(),
  toolId: z.string().optional(),
  approvalType: z.enum(["single", "dual"]),
  status: z.enum(["pending", "approved", "rejected", "expired", "cancelled"]),
  requiredApprovers: z.array(z.string()).default([]),
  approvals: z.array(z.object({
    approverId: z.string(),
    approverRole: z.string().optional(),
    decision: z.enum(["approved", "rejected"]),
    note: z.string().optional(),
    decidedAt: z.string().datetime(),
  })).default([]),
  payload: z.record(z.unknown()).default({}),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;
