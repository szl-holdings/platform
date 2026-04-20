import { z } from 'zod';

export const PolicyScopeSchema = z.enum(['tenant', 'domain', 'action']);
export type PolicyScope = z.infer<typeof PolicyScopeSchema>;

export const PolicyEffectSchema = z.enum([
  'allow',
  'require_approval',
  'escalate',
  'block',
  'audit_only',
]);
export type PolicyEffect = z.infer<typeof PolicyEffectSchema>;

export const PolicyConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains', 'matches']),
  value: z.unknown(),
});
export type PolicyCondition = z.infer<typeof PolicyConditionSchema>;

export const PolicyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  conditions: z.array(PolicyConditionSchema).optional(),
  effect: PolicyEffectSchema,
  requiredApproverRole: z.string().optional(),
  escalateTo: z.string().optional(),
  reason: z.string().optional(),
  priority: z.number().int().min(0).max(10000).default(100),
});
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  scope: PolicyScopeSchema,
  tenantId: z.string().optional(),
  domain: z.string().optional(),
  actionTypes: z.array(z.string()).optional(),
  rules: z.array(PolicyRuleSchema),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(10000).default(100),
  complianceFramework: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Policy = z.infer<typeof PolicySchema>;

export const EvaluationRequestSchema = z.object({
  action: z.string(),
  domain: z.string().optional(),
  tenantId: z.string().optional(),
  actionClass: z.string().optional(),
  subject: z.object({
    id: z.string().optional(),
    roles: z.array(z.string()),
    tenantId: z.string().optional(),
  }),
  resource: z.object({
    type: z.string(),
    id: z.string().optional(),
    domain: z.string().optional(),
    attributes: z.record(z.unknown()).optional(),
  }),
  context: z.record(z.unknown()).optional(),
  estimatedCostUsd: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
  urgency: z.string().optional(),
});
export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>;

export interface PolicyEvaluationResult {
  effect: PolicyEffect;
  allowed: boolean;
  requiresApproval: boolean;
  requiredApproverRole?: string;
  escalationTarget?: string;
  matchedPolicies: Array<{ policyId: string; ruleName: string; effect: PolicyEffect }>;
  violations: Array<{ policyId: string; policyName: string; reason: string }>;
  reasoning: string;
  evaluatedAt: number;
}

/**
 * Full PolicyEvaluation that MUST accompany every action-engine draft/execute call.
 * Captures every input used in the evaluation decision so the record is self-contained
 * and can be reproduced, audited, or appealed without external state.
 */
export interface PolicyEvaluation {
  evaluationId: string;
  mode: string;
  action: string;
  actionType?: string;
  product?: string;
  workspace?: string;
  subjectRoles: string[];
  entitySensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  confidence: number;
  freshnessScore: number;
  environment: 'development' | 'staging' | 'production';
  windowValid: boolean;
  projectedCostUsd?: number;
  projectedImpact: string;
  projectedRisk: string;
  evidenceChain: Array<{
    source: string;
    summary: string;
    confidence: number;
    freshness: number;
  }>;
  policyResult: PolicyEvaluationResult;
  blockedReason?: string;
  evaluatedAt: number;
  evaluatedBy?: string;
}

/**
 * Zod schema for runtime validation of PolicyEvaluation shape.
 * Ensures malformed objects (empty {}, partial payloads, type-cast bypasses)
 * are rejected at the action-engine boundary before execution begins.
 */
export const PolicyEvaluationSchema = z.object({
  evaluationId: z.string().min(1),
  mode: z.string().min(1),
  action: z.string().min(1),
  actionType: z.string().optional(),
  product: z.string().optional(),
  workspace: z.string().optional(),
  subjectRoles: z.array(z.string()),
  entitySensitivity: z.enum(['public', 'internal', 'confidential', 'restricted']),
  confidence: z.number().min(0).max(1),
  freshnessScore: z.number().min(0).max(1),
  environment: z.enum(['development', 'staging', 'production']),
  windowValid: z.boolean(),
  projectedCostUsd: z.number().optional(),
  projectedImpact: z.string().min(1),
  projectedRisk: z.string().min(1),
  evidenceChain: z.array(
    z.object({
      source: z.string(),
      summary: z.string(),
      confidence: z.number(),
      freshness: z.number(),
    }),
  ),
  policyResult: z
    .object({
      effect: z.string(),
      allowed: z.boolean(),
    })
    .passthrough(),
  blockedReason: z.string().optional(),
  evaluatedAt: z.number(),
  evaluatedBy: z.string().optional(),
});
