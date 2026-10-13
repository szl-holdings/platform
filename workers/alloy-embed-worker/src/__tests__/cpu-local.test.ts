import { afterEach, describe, expect, it, vi } from 'vitest';
import { CpuLocalEmbeddingBackend } from '../backends/cpu-local.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('CpuLocalEmbeddingBackend', () => {
  it('binds the internal request to configured bearer and tenant identity', async () => {
    const vector = Array.from({ length: 384 }, (_, index) => (index === 0 ? 1 : 0));
    const fetchMock = vi.fn<typeof fetch>(
      async (_input, _init) =>
        new Response(
          JSON.stringify({
            vectors: [vector],
            model: 'aef-dev-hash',
            dimensions: 384,
            token_counts: [1],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const backend = new CpuLocalEmbeddingBackend({
      baseUrl: 'http://worker.internal',
      apiKey: 'unit-test-worker-key',
      tenantId: 'tenant-bound',
    });
    const result = await backend.embed({
      texts: ['governed evidence'],
      model: 'aef-dev-hash',
      pooling: 'mean',
      normalize: true,
    });

    expect(result.model).toBe('aef-dev-hash');
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer unit-test-worker-key',
      'X-Tenant-ID': 'tenant-bound',
    });
    expect(init?.redirect).toBe('error');
  });

  it('fails before network access when production identity is incomplete', async () => {
    vi.stubEnv('SUBSTRATE_PYTHON_WORKER_ENV', 'production');
    vi.stubEnv('SUBSTRATE_EMBED_API_KEY', '');
    vi.stubEnv('SUBSTRATE_PYTHON_WORKER_API_KEY', '');
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const backend = new CpuLocalEmbeddingBackend({
      baseUrl: 'http://worker.internal',
      tenantId: 'tenant-bound',
    });

    await expect(
      backend.embed({
        texts: ['governed evidence'],
        model: 'aef-dev-hash',
        pooling: 'mean',
        normalize: true,
      }),
    ).rejects.toThrow('SUBSTRATE_EMBED_API_KEY is required in production');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not dispatch the development backend under conflicting production markers', async () => {
    vi.stubEnv('RUNTIME_MODE', 'production');
    vi.stubEnv('NODE_ENV', 'test');
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const backend = new CpuLocalEmbeddingBackend({
      baseUrl: 'http://worker.internal',
      apiKey: 'unit-test-worker-key',
      tenantId: 'tenant-bound',
    });

    await expect(
      backend.embed({
        texts: ['must not dispatch'],
        model: 'aef-dev-hash',
        pooling: 'mean',
        normalize: true,
      }),
    ).rejects.toThrow('development model is not admitted in production');
    expect(fetchMock).not.toHaveBeenCalled();

    await expect(backend.health()).resolves.toMatchObject({ healthy: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an upstream response that relabels the development model', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            vectors: [Array.from({ length: 384 }, (_, index) => (index === 0 ? 1 : 0))],
            model: 'caller-selected-model',
            dimensions: 384,
            token_counts: [1],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    const backend = new CpuLocalEmbeddingBackend({
      baseUrl: 'http://worker.internal',
      apiKey: 'unit-test-worker-key',
      tenantId: 'tenant-bound',
    });

    await expect(
      backend.embed({
        texts: ['governed evidence'],
        model: 'aef-dev-hash',
        pooling: 'mean',
        normalize: true,
      }),
    ).rejects.toThrow('invalid model response');
  });
});
