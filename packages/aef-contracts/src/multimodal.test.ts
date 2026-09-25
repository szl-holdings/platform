import { describe, expect, it } from 'vitest';
import {
  EmbeddingExecutionReceiptSchema,
  MultimodalEmbedRequestSchema,
  MultimodalEmbedResponseSchema,
} from './index.js';

const DIGEST = 'a'.repeat(64);
const REVISION = '08547b8479edc10edc9878597438ebd076f74dff';

describe('multimodal embedding contracts', () => {
  it('accepts an exact-revision request with immutable CAS media', () => {
    const parsed = MultimodalEmbedRequestSchema.parse({
      requestId: 'req-1',
      tenantId: 'tenant-1',
      modelId: 'ATH-MaaS/Ovis-Omni-Embedding-3B',
      modelRevision: REVISION,
      items: [
        {
          itemId: 'item-1',
          instruction: 'Retrieve evidence relevant to this image.',
          segments: [
            { kind: 'text', text: 'bridge inspection' },
            {
              kind: 'asset',
              asset: {
                assetId: 'asset-1',
                uri: `cas://sha256/${DIGEST}`,
                sha256: DIGEST,
                mediaType: 'image/png',
                byteLength: 123,
                modality: 'image',
              },
            },
          ],
        },
      ],
    });

    expect(parsed.dimensions).toBe(2048);
    expect(parsed.normalize).toBe(true);
  });

  it('rejects mutable media URLs and mismatched CAS identities', () => {
    const base = {
      requestId: 'req-1',
      tenantId: 'tenant-1',
      modelId: 'ATH-MaaS/Ovis-Omni-Embedding-3B',
      modelRevision: REVISION,
      items: [
        {
          itemId: 'item-1',
          instruction: 'Embed this evidence.',
          segments: [
            {
              kind: 'asset',
              asset: {
                assetId: 'asset-1',
                uri: 'https://example.com/mutable.png',
                sha256: DIGEST,
                mediaType: 'image/png',
                byteLength: 123,
                modality: 'image',
              },
            },
          ],
        },
      ],
    };
    expect(MultimodalEmbedRequestSchema.safeParse(base).success).toBe(false);

    const mismatch = structuredClone(base);
    mismatch.items[0].segments[0].asset.uri = `cas://sha256/${'b'.repeat(64)}`;
    expect(MultimodalEmbedRequestSchema.safeParse(mismatch).success).toBe(false);
  });

  it('binds response vectors to an execution receipt', () => {
    const execution = EmbeddingExecutionReceiptSchema.parse({
      backendId: 'ovis-omni-python',
      modelId: 'ATH-MaaS/Ovis-Omni-Embedding-3B',
      modelRevision: REVISION,
      artifactSetDigest: '4ea7bf104aaf758eb648ea5f954b0aa19575f4e28d286f59103dfe223f4b4926',
      processorRevision: REVISION,
      runtimeId: 'substrate-py-workers/ovis-omni',
      runtimeVersion: '1.0.0',
      dimensions: 2048,
      normalized: true,
      promotionState: 'EVALUATION_HOLD',
      supportedModalities: ['text', 'image', 'audio', 'video', 'visual_document', 'interleaved'],
    });

    const response = MultimodalEmbedResponseSchema.parse({
      requestId: 'req-1',
      tenantId: 'tenant-1',
      modelId: execution.modelId,
      modelRevision: execution.modelRevision,
      dimensions: 2048,
      vectors: [
        {
          itemId: 'item-1',
          vector: Array.from({ length: 2048 }, () => 0),
          inputDigest: DIGEST,
          modalities: ['text'],
        },
      ],
      execution,
    });

    expect(response.execution.promotionState).toBe('EVALUATION_HOLD');
  });
});
