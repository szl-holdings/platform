import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExternalHttpEmbeddingBackend } from '../backends/external-http.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('ExternalHttpEmbeddingBackend', () => {
  it('preserves exact model identity in the execution receipt', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          vectors: [[1, 0, 0]],
          model: 'example/model',
          dimensions: 3,
          model_revision: 'rev-1',
          artifact_set_digest: 'a'.repeat(64),
          runtime_id: 'runtime/example',
          runtime_version: '1.2.3',
          normalized: true,
          promotion_state: 'QUALIFIED',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    ) as typeof fetch;

    const backend = new ExternalHttpEmbeddingBackend({
      backendId: 'external-http',
      displayName: 'Example',
      baseUrl: 'https://embed.internal',
      model: 'example/model',
      modelRevision: 'rev-1',
      artifactSetDigest: 'a'.repeat(64),
      dimensions: 3,
      maxTokens: 128,
    });

    const result = await backend.embed({
      texts: ['hello'],
      model: 'example/model',
      pooling: 'mean',
      normalize: true,
    });

    expect(result.execution).toMatchObject({
      backendId: 'external-http',
      modelId: 'example/model',
      modelRevision: 'rev-1',
      artifactSetDigest: 'a'.repeat(64),
      dimensions: 3,
      normalized: true,
      promotionState: 'QUALIFIED',
    });
  });

  it('fails closed on response identity drift without exposing the response body', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          vectors: [[1, 0, 0]],
          model: 'attacker/model',
          dimensions: 3,
          secret: 'must-not-leak',
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const backend = new ExternalHttpEmbeddingBackend({
      backendId: 'external-http',
      displayName: 'Example',
      baseUrl: 'https://embed.internal',
      model: 'example/model',
      dimensions: 3,
      maxTokens: 128,
    });

    await expect(
      backend.embed({
        texts: ['hello'],
        model: 'example/model',
        pooling: 'mean',
        normalize: true,
      }),
    ).rejects.toThrow('unexpected model identity');

    try {
      await backend.embed({
        texts: ['hello'],
        model: 'example/model',
        pooling: 'mean',
        normalize: true,
      });
    } catch (error) {
      expect(String(error)).not.toContain('must-not-leak');
    }
  });

  it('rejects the wrong vector cardinality and width', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ vectors: [[1, 0]], model: 'example/model', dimensions: 3 }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const backend = new ExternalHttpEmbeddingBackend({
      backendId: 'external-http',
      displayName: 'Example',
      baseUrl: 'https://embed.internal',
      model: 'example/model',
      dimensions: 3,
      maxTokens: 128,
    });

    await expect(
      backend.embed({
        texts: ['hello'],
        model: 'example/model',
        pooling: 'mean',
        normalize: true,
      }),
    ).rejects.toThrow('invalid vector width');
  });
});
