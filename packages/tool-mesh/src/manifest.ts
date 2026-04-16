import { z } from "zod";

export const ToolDomainTagSchema = z.enum([
  "graph",
  "documents",
  "data",
  "communication",
  "finance",
  "legal",
  "security",
  "infrastructure",
  "analytics",
  "custom",
]);

export const ToolPolicyTierSchema = z.enum([
  "advisory-only",
  "internal-workflow",
  "operator-assisted",
  "executive-facing",
  "regulated-workflow",
  "external-client-facing",
  "autonomous-reversible",
  "human-approval-mandatory",
]);

export const FailureModeSchema = z.object({
  type: z.enum(["error", "timeout", "rate-limit", "policy-block", "unavailable"]),
  fallbackToolId: z.string().optional(),
  retryable: z.boolean().default(true),
  maxRetries: z.number().int().default(3),
});

export const ToolManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().default("1.0.0"),
  description: z.string(),
  domainTags: z.array(ToolDomainTagSchema).default([]),
  policyTier: ToolPolicyTierSchema,
  allowedEnvironments: z.array(z.enum(["development", "staging", "production"])).default(["development", "staging", "production"]),
  inputSchema: z.record(z.unknown()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  rateLimits: z.object({
    requestsPerMinute: z.number().positive().optional(),
    requestsPerHour: z.number().positive().optional(),
    concurrency: z.number().positive().optional(),
  }).default({}),
  timeoutMs: z.number().positive().default(30000),
  failureModes: z.array(FailureModeSchema).default([]),
  approvalRequired: z.boolean().default(false),
  owner: z.string().optional(),
  observabilityHooks: z.object({
    emitTrace: z.boolean().default(true),
    emitMetrics: z.boolean().default(true),
    sensitiveFields: z.array(z.string()).default([]),
  }).default({}),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type ToolDomainTag = z.infer<typeof ToolDomainTagSchema>;
export type ToolPolicyTier = z.infer<typeof ToolPolicyTierSchema>;
export type FailureMode = z.infer<typeof FailureModeSchema>;
export type ToolManifest = z.infer<typeof ToolManifestSchema>;
