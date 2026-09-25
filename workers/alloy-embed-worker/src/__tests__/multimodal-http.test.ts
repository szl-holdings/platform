import { afterEach, describe, expect, it, vi } from 'vitest';
import { MultimodalHttpEmbeddingClient } from '../multimodal-http.js';
import {
  OVIS_OMNI_ARTIFACT_SET_DIGEST,
  OVIS_OMNI_MODEL_ID,
  OVIS_OMNI_REVISION,
} from '../ovis-omni.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

const request = {
  requestId: 'req-1',
  tenantId: 'tenant-1',
  modelId: OVIS_OMNI_MODEL_ID,
  modelRevision: OVIS_OMNI_REVISION,
  dimensions: 2048 as const,
  normalize: true as const,
  items: [
    {
      itemId: 'item-1',
      instruction: 'Retrieve matching evidence.',
      segments: [{ kind: 'text' as const, text: 'hello' }],
    },
  ],
  metadata: {},
};

function client() {
  return new MultimodalHttpEmbeddingClient({
    baseUrl: 'https://ovis.internal',
    expectedModelId: OVIS_OMNI_MODEL_ID,
    expectedModelRevision: OVIS_OMNI_REVISION,
    expectedArtifactSetDigest: OVIS_OMNI_ARTIFACT_SET_DIGEST,
    expectedDimensions: 2048,
  });
}

describe('MultimodalHttpEmbeddingClient', () => {
  it('accepts an exact, receipt-bound response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          requestId: request.requestId,
          tenantId: request.tenantId,
          modelId: OVIS_OMNI_MODEL_ID,
          modelRevision: OVIS_OMNI_REVISION,
          dimensions: 2048,
          vectors: [
            {
              itemId: 'item-1',
              vector: Array.from({ length: 2048 }, () => 0),
              inputDigest: 'a'.repeat(64),
              modalities: ['text'],
              tokenCount: 1,
            },
          ],
          execution: {
            backendId: 'ovis-omni-python',
            modelId: OVIS_OMNI_MODEL_ID,
            modelRevision: OVIS_OMNI_REVISION,
            artifactSetDigest: OVIS_OMNI_ARTIFACT_SET_DIGEST,
            processorRevision: OVIS_OMNI_REVISION,
            runtimeId: 'substrate-py-workers/ovis-omni',
            runtimeVersion: '1.0.0',
            dimensions: 2048,
            normalized: true,
            promotionState: 'EVALUATION_HOLD',
            supportedModalities: ['text', 'image', 'visual_document', 'audio', 'video', 'interleaved'],
          },
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const result = await client().embed(request);
    expect(result.execution.artifactSetDigest).toBe(OVIS_OMNI_ARTIFACT_SET_DIGEST);
  });

  it('rejects artifact identity drift', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          requestId: request.requestId,
          tenantId: request.tenantId,
          modelId: OVIS_OMNI_MODEL_ID,
          modelRevision: OVIS_OMNI_REVISION,
          dimensions: 2048,
          vectors: [
            {
              itemId: 'item-1',
              vector: Array.from({ length: 2048 }, () => 0),
              inputDigest: 'a'.repeat(64),
              modalities: ['text'],
            },
          ],
          execution: {
            backendId: 'ovis-omni-python',
            modelId: OVIS_OMNI_MODEL_ID,
            modelRevision: OVIS_OMNI_REVISION,
            artifactSetDigest: 'b'.repeat(64),
            dimensions: 2048,
            normalized: true,
            promotionState: 'EVALUATION_HOLD',
          },
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    await expect(client().embed(request)).rejects.toThrow('did not prove the admitted execution identity');
  });
});
