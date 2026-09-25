import { z } from 'zod';

export const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i, 'expected a SHA-256 digest');
export type Sha256 = z.infer<typeof Sha256Schema>;

export const PromotionStateSchema = z.enum([
  'DEVELOPMENT',
  'EVALUATION_HOLD',
  'QUALIFIED',
  'REVOKED',
]);
export type PromotionState = z.infer<typeof PromotionStateSchema>;

export const EmbeddingModalitySchema = z.enum([
  'text',
  'image',
  'visual_document',
  'audio',
  'video',
  'interleaved',
]);
export type EmbeddingModality = z.infer<typeof EmbeddingModalitySchema>;

/**
 * Immutable identity and runtime facts for one embedding execution.
 *
 * The receipt is intentionally separate from the vector payload so it can be
 * projected into the Evidence Ledger, Forge evaluation cards, Hugging Face
 * model cards, and a11oy.net without inventing identity after the fact.
 */
export const EmbeddingExecutionReceiptSchema = z.object({
  backendId: z.string().min(1),
  modelId: z.string().min(1),
  modelRevision: z.string().min(1).optional(),
  artifactSetDigest: Sha256Schema.optional(),
  processorRevision: z.string().min(1).optional(),
  runtimeId: z.string().min(1).optional(),
  runtimeVersion: z.string().min(1).optional(),
  dimensions: z.number().int().positive(),
  normalized: z.boolean(),
  promotionState: PromotionStateSchema,
  supportedModalities: z.array(EmbeddingModalitySchema).min(1).optional(),
});
export type EmbeddingExecutionReceipt = z.infer<typeof EmbeddingExecutionReceiptSchema>;
