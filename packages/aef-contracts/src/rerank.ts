import { z } from 'zod';
import { PromotionStateSchema, Sha256Schema } from './model-identity.js';
import { TenantIdSchema } from './tenant.js';

export const RerankCandidateSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  score: z.number().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type RerankCandidate = z.infer<typeof RerankCandidateSchema>;

export const RERANK_IMPLEMENTATION_ID = 'lexical-overlap-v1' as const;

export const RerankExecutionReceiptSchema = z.object({
  backendId: z.string().min(1),
  modelId: z.literal(RERANK_IMPLEMENTATION_ID),
  modelRevision: z.string().min(1).optional(),
  artifactSetDigest: Sha256Schema.optional(),
  promotionState: PromotionStateSchema,
  implementationKind: z.literal('lexical-overlap'),
  fallback: z.boolean(),
  fallbackReason: z.enum(['forced', 'primary-error']).optional(),
});
export type RerankExecutionReceipt = z.infer<typeof RerankExecutionReceiptSchema>;

export const RerankRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  query: z.string().min(1),
  candidates: z
    .array(RerankCandidateSchema)
    .min(1)
    .max(512)
    .refine(
      (candidates) =>
        new Set(candidates.map((candidate) => candidate.id)).size === candidates.length,
      'candidate IDs must be unique',
    ),
  topK: z.number().int().positive().default(10),
  model: z.literal(RERANK_IMPLEMENTATION_ID).optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type RerankRequest = z.infer<typeof RerankRequestSchema>;

export const RerankResultSchema = z.object({
  id: z.string(),
  score: z.number(),
  rank: z.number().int().positive(),
  text: z.string(),
  metadata: z.record(z.unknown()).default({}),
});
export type RerankResult = z.infer<typeof RerankResultSchema>;

export const RerankResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  model: z.literal(RERANK_IMPLEMENTATION_ID),
  results: z.array(RerankResultSchema),
  execution: RerankExecutionReceiptSchema,
  processingMs: z.number().nonnegative().optional(),
});
export type RerankResponse = z.infer<typeof RerankResponseSchema>;
