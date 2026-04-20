import { z } from 'zod';
import { TenantIdSchema } from './tenant.js';

export const EmbedRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  texts: z.array(z.string().min(1)).min(1).max(512),
  model: z.string().optional(),
  normalize: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({}),
});
export type EmbedRequest = z.infer<typeof EmbedRequestSchema>;

export const EmbedVectorSchema = z.object({
  index: z.number().int().nonnegative(),
  text: z.string(),
  vector: z.array(z.number()),
  tokenCount: z.number().int().nonnegative().optional(),
});
export type EmbedVector = z.infer<typeof EmbedVectorSchema>;

export const EmbedResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  model: z.string(),
  dimensions: z.number().int().positive(),
  vectors: z.array(EmbedVectorSchema),
  processingMs: z.number().nonnegative().optional(),
});
export type EmbedResponse = z.infer<typeof EmbedResponseSchema>;
