import { z } from 'zod';

export const quantTierSchema = z.enum([
  'fp32', 'fp16', 'bf16', 'int8', 'int4', 'gguf-q4', 'gguf-q5', 'gguf-q8', 'hosted',
]);

export const routeClassSchema = z.enum([
  'classification', 'triage', 'reasoning', 'planning', 'tool_calling',
  'vision_understanding', 'background_batch', 'extraction', 'summarization',
]);

export const autonomyTierSchema = z.enum(['read_only', 'advisory', 'supervised', 'autonomous']);

export const lifecycleStateSchema = z.enum([
  'draft', 'proposed', 'approved', 'active', 'deprecated', 'revoked',
]);

export const passportIdentitySchema = z.object({
  id: z.string().min(1).max(128),
  displayName: z.string().min(1).max(256),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  provider: z.string().min(1).max(64),
  providerModelId: z.string().min(1).max(256),
  createdAt: z.string().datetime(),
});

export const passportQuantProfileSchema = z.object({
  tier: quantTierSchema,
  bitsPerWeight: z.number().int().positive().optional(),
  contextWindow: z.number().int().positive(),
  modality: z.array(z.enum(['text', 'vision', 'audio', 'code'])).min(1),
});

export const passportCapabilitySurfaceSchema = z.object({
  lanes: z.array(routeClassSchema).min(1),
  skills: z.array(z.string()),
  supportedTools: z.array(z.string()),
});

export const passportCostProfileSchema = z.object({
  costPer1kTokensUsd: z.number().nonnegative(),
  p50LatencyMs: z.number().int().nonnegative(),
  p95LatencyMs: z.number().int().nonnegative(),
  evalPassRate: z.number().min(0).max(1),
  benchmarks: z.record(z.string(), z.number()).optional(),
});

export const passportPolicyEnvelopeSchema = z.object({
  autonomyTier: autonomyTierSchema,
  allowedDomains: z.array(z.string()),
  piiHandling: z.enum(['blocked', 'redacted', 'allowed']),
  escalationRules: z.array(z.string()),
  jurisdictions: z.array(z.string()),
  maxBudgetUsdPerCall: z.number().positive().optional(),
});

export const passportSignerSchema = z.object({
  keyId: z.string(),
  publicKey: z.string(),
  role: z.string(),
  signedAt: z.string().datetime(),
  signature: z.string(),
});

export const passportRevocationSchema = z.object({
  revokedAt: z.string().datetime(),
  revokedBy: z.string(),
  reason: z.string(),
});

export const passportApprovalsSchema = z.object({
  signers: z.array(passportSignerSchema),
  requiredSigners: z.number().int().positive(),
  revocation: passportRevocationSchema.optional(),
});

export const passportProvenanceSchema = z.object({
  sourceRegistryHash: z.string(),
  promptRegistryPins: z.array(z.string()),
  datasetHashes: z.array(z.string()).optional().default([]),
  evalRunId: z.string().optional(),
  parentPassportId: z.string().optional(),
});

export const evalGatesSchema = z.object({
  minGoldenSetPassRate: z.number().min(0).max(1),
  maxP95LatencyMs: z.number().int().positive(),
  maxCostPerCallUsd: z.number().positive(),
});

export const passportDowngradeEntrySchema = z.object({
  passportId: z.string(),
  displayName: z.string(),
  reason: z.string(),
});

export const modelPassportSchema = z.object({
  schemaVersion: z.literal('1.0'),
  identity: passportIdentitySchema,
  quantProfile: passportQuantProfileSchema,
  capabilitySurface: passportCapabilitySurfaceSchema,
  costProfile: passportCostProfileSchema,
  policyEnvelope: passportPolicyEnvelopeSchema,
  approvals: passportApprovalsSchema,
  provenance: passportProvenanceSchema,
  downgradeTo: z.array(passportDowngradeEntrySchema),
  state: lifecycleStateSchema,
  tenantId: z.number().int().optional(),
  evalGates: evalGatesSchema.optional(),
});

export const signedModelPassportSchema = z.object({
  passport: modelPassportSchema,
  signature: z.string(),
  signerPublicKey: z.string(),
  provenanceHash: z.string(),
  signedAt: z.string().datetime(),
  metadata: z.object({
    pinnedEvalRunId: z.string().optional(),
  }).optional(),
});

export const passportResolverQuerySchema = z.object({
  lane: routeClassSchema,
  budgetUsdPerCall: z.number().positive().optional(),
  slaP95Ms: z.number().int().positive().optional(),
  tenantId: z.number().int().optional(),
  requiredCapabilities: z.array(z.string()).optional(),
});

export function validatePassport(data: unknown): ReturnType<typeof modelPassportSchema.safeParse> {
  return modelPassportSchema.safeParse(data);
}

export function validateSignedPassport(data: unknown): ReturnType<typeof signedModelPassportSchema.safeParse> {
  return signedModelPassportSchema.safeParse(data);
}
