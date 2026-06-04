import { z } from 'zod';
import { TenantIdSchema } from './tenant.js';

export const RerankCandidateSchema = z.object({
  id: z.string(),
  text: z.string(),
  score: z.number().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type RerankCandidate = z.infer<typeof RerankCandidateSchema>;

export const RerankRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  query: z.string().min(1),
  candidates: z.array(RerankCandidateSchema).min(1).max(512),
  topK: z.number().int().positive().default(10),
  model: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type RerankRequest = z.infer<typeof RerankRequestSchema>;

export const RerankResultSchema = z.object({
  id: z.string(),
  score: z.number(),
  rank: z.number().int().nonnegative(),
  text: z.string(),
  metadata: z.record(z.unknown()).default({}),
});
export type RerankResult = z.infer<typeof RerankResultSchema>;

export const RerankResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  model: z.string(),
  results: z.array(RerankResultSchema),
  processingMs: z.number().nonnegative().optional(),
});
export type RerankResponse = z.infer<typeof RerankResponseSchema>;
