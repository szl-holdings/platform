import { z } from 'zod';

export const PolicyRuleActionSchema = z.enum(['allow', 'deny', 'redact']);
export type PolicyRuleAction = z.infer<typeof PolicyRuleActionSchema>;

export const PolicyRuleSchema = z.object({
  ruleId: z.string().min(1),
  description: z.string().optional(),
  action: PolicyRuleActionSchema,
  priority: z.number().int().default(0),
  tenantIds: z.array(z.string()).optional(),
  allowedProfiles: z.array(z.string()).optional(),
  requireProvenance: z.boolean().default(false),
  redactFields: z.array(z.string()).default([]),
  condition: z.string().optional(),
});
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export const RetentionPolicySchema = z.object({
  tenantId: z.string().min(1),
  defaultRetentionDays: z.number().int().positive().default(90),
  profileOverrides: z.record(z.number().int().positive()).default({}),
  deletionRequired: z.boolean().default(false),
});
export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>;

export interface PolicyContext {
  requestId: string;
  tenantId: string;
  profileId?: string;
  hasProvenance: boolean;
  metadata?: Record<string, unknown>;
}

export interface PolicyDecision {
  allow: boolean;
  reasons: string[];
  redactions: string[];
  retentionOverrideDays?: number;
  appliedRuleIds: string[];
}
