import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExternalHttpEmbeddingBackend } from '../backends/external-http.js';
import { buildExternalHttpBackend } from '../index.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('ExternalHttpEmbeddingBackend', () => {
  it('fails closed without internal auth for a production substrate endpoint', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SUBSTRATE_EMBED_URL', 'https://embed.internal');
    vi.stubEnv('SUBSTRATE_EMBED_API_KEY', '');
    vi.stubEnv('SUBSTRATE_EMBED_TENANT_ID', '');
    vi.stubEnv('SUBSTRATE_PYTHON_WORKER_API_KEY', '');
    vi.stubEnv('SUBSTRATE_PYTHON_WORKER_TENANT_ID', '');

    expect(() => buildExternalHttpBackend()).toThrow(/SUBSTRATE_EMBED_API_KEY is required/);
    vi.stubEnv('SUBSTRATE_EMBED_API_KEY', 'worker-shared-key');
    expect(() => buildExternalHttpBackend()).toThrow(/SUBSTRATE_EMBED_TENANT_ID is required/);
    vi.stubEnv('SUBSTRATE_EMBED_TENANT_ID', 'worker-bound-tenant');
    expect(buildExternalHttpBackend()).toBeInstanceOf(ExternalHttpEmbeddingBackend);
  });

  it('lets canonical production mode dominate NODE_ENV=test before any network access', () => {
    vi.stubEnv('RUNTIME_MODE', 'production');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SUBSTRATE_EMBED_URL', 'https://embed.internal');
    vi.stubEnv('SUBSTRATE_EMBED_API_KEY', '');
    vi.stubEnv('SUBSTRATE_PYTHON_WORKER_API_KEY', '');
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    expect(() => buildExternalHttpBackend()).toThrow(/SUBSTRATE_EMBED_API_KEY is required/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserves exact model identity in the execution receipt', async () => {
    globalThis.fetch = vi.fn(
      async () =>
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

  it('forwards the internal bearer credential and bound tenant', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        vectors: [[1, 0, 0]],
        model: 'example/model',
        dimensions: 3,
        normalized: true,
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const backend = new ExternalHttpEmbeddingBackend({
      backendId: 'external-http',
      displayName: 'Example',
      baseUrl: 'https://embed.internal',
      apiKey: 'worker-shared-key',
      tenantId: 'worker-bound-tenant',
      model: 'example/model',
      dimensions: 3,
      maxTokens: 128,
    });

    await backend.embed({
      texts: ['hello'],
      model: 'example/model',
      pooling: 'mean',
      normalize: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://embed.internal/embed',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer worker-shared-key',
          'X-Tenant-ID': 'worker-bound-tenant',
        }),
      }),
    );
  });

  it('fails closed on response identity drift without exposing the response body', async () => {
    globalThis.fetch = vi.fn(
      async () =>
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
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ vectors: [[1, 0]], model: 'example/model', dimensions: 3 }), {
          status: 200,
        }),
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

  it('numerically rejects zero and non-unit vectors labelled normalized', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          vectors: [[0, 0, 0]],
          model: 'example/model',
          dimensions: 3,
          normalized: true,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          vectors: [[1, 1, 1]],
          model: 'example/model',
          dimensions: 3,
          normalized: true,
        }),
      );
    globalThis.fetch = fetchMock as typeof fetch;

    const backend = new ExternalHttpEmbeddingBackend({
      backendId: 'external-http',
      displayName: 'Example',
      baseUrl: 'https://embed.internal',
      model: 'example/model',
      dimensions: 3,
      maxTokens: 128,
    });
    const request = {
      texts: ['hello'],
      model: 'example/model',
      pooling: 'mean' as const,
      normalize: true,
    };

    await expect(backend.embed(request)).rejects.toThrow('outside the unit-norm tolerance');
    await expect(backend.embed(request)).rejects.toThrow('outside the unit-norm tolerance');
  });
});
