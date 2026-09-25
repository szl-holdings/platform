import { z } from 'zod';
import { TenantIdSchema } from './tenant.js';
import {
  EmbeddingExecutionReceiptSchema,
  EmbeddingModalitySchema,
  Sha256Schema,
} from './model-identity.js';

const CasUriSchema = z.string().regex(/^cas:\/\/sha256\/[a-f0-9]{64}$/i, 'expected cas://sha256/<digest>');

/**
 * External media is admitted by immutable content address only. HTTP(S), file,
 * data, and mutable object-store URLs are deliberately rejected at the public
 * contract boundary; the Python worker resolves the digest inside its mounted
 * CAS root and verifies bytes before model execution.
 */
export const MultimodalAssetSchema = z
  .object({
    assetId: z.string().min(1),
    uri: CasUriSchema,
    sha256: Sha256Schema,
    mediaType: z.string().min(1),
    byteLength: z.number().int().nonnegative(),
    modality: z.enum(['image', 'visual_document', 'audio', 'video']),
  })
  .superRefine((asset, ctx) => {
    const uriDigest = asset.uri.slice('cas://sha256/'.length).toLowerCase();
    if (uriDigest !== asset.sha256.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['uri'],
        message: 'CAS URI digest must match sha256',
      });
    }
  });
export type MultimodalAsset = z.infer<typeof MultimodalAssetSchema>;

export const MultimodalTextSegmentSchema = z.object({
  kind: z.literal('text'),
  text: z.string().min(1),
});

export const MultimodalAssetSegmentSchema = z.object({
  kind: z.literal('asset'),
  asset: MultimodalAssetSchema,
});

export const MultimodalSegmentSchema = z.discriminatedUnion('kind', [
  MultimodalTextSegmentSchema,
  MultimodalAssetSegmentSchema,
]);
export type MultimodalSegment = z.infer<typeof MultimodalSegmentSchema>;

export const MultimodalEmbedItemSchema = z.object({
  itemId: z.string().min(1),
  instruction: z.string().min(1).max(4096),
  segments: z.array(MultimodalSegmentSchema).min(1).max(32),
});
export type MultimodalEmbedItem = z.infer<typeof MultimodalEmbedItemSchema>;

export const MultimodalEmbeddingDimensionsSchema = z.union([
  z.literal(2048),
  z.literal(1024),
  z.literal(512),
  z.literal(256),
  z.literal(128),
]);

export const MultimodalEmbedRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  modelId: z.string().min(1),
  modelRevision: z.string().min(1),
  dimensions: MultimodalEmbeddingDimensionsSchema.default(2048),
  normalize: z.literal(true).default(true),
  items: z.array(MultimodalEmbedItemSchema).min(1).max(32),
  metadata: z.record(z.unknown()).default({}),
});
export type MultimodalEmbedRequest = z.infer<typeof MultimodalEmbedRequestSchema>;

export const MultimodalEmbedVectorSchema = z.object({
  itemId: z.string().min(1),
  vector: z.array(z.number()),
  inputDigest: Sha256Schema,
  modalities: z.array(EmbeddingModalitySchema).min(1),
  tokenCount: z.number().int().nonnegative().optional(),
});
export type MultimodalEmbedVector = z.infer<typeof MultimodalEmbedVectorSchema>;

export const MultimodalEmbedResponseSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  modelId: z.string().min(1),
  modelRevision: z.string().min(1),
  dimensions: z.number().int().positive(),
  vectors: z.array(MultimodalEmbedVectorSchema),
  execution: EmbeddingExecutionReceiptSchema,
  processingMs: z.number().nonnegative().optional(),
  traceId: z.string().min(1).optional(),
  evidenceIds: z.array(z.string()).optional(),
});
export type MultimodalEmbedResponse = z.infer<typeof MultimodalEmbedResponseSchema>;
