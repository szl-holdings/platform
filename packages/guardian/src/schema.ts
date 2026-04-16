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
  "log",
  "redact",
  "escalate",
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
  context: z.record(z.unknown()).default({}),
  requestedAt: z.string().datetime().optional(),
});

export const DecisionResultSchema = z.object({
  requestId: z.string(),
  outcome: z.enum(["allow", "deny", "require-approval"]),
  matchedRuleId: z.string().optional(),
  reason: z.string(),
  requiredApprovers: z.array(z.string()).default([]),
  decidedAt: z.string().datetime(),
});

export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;
export type DecisionResult = z.infer<typeof DecisionResultSchema>;
