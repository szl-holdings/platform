import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAefRuntimeReady } from '../readiness-runtime.js';
import {
  assertProductionEmbedderConfiguration,
  buildEmbeddingReadinessReport,
  buildRetrievalStoreAdmissionReport,
  EmbedderConfigurationError,
  RetrievalStoreConfigurationError,
  resolveRetrievalStoreBackend,
} from '../retrieval-store.js';

const MODEL_REVISION = 'b'.repeat(40);
const ARTIFACT_SET_DIGEST = 'a'.repeat(64);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('embedding runtime configuration', () => {
  it('fails production startup when the real embedder endpoint is missing or blank', () => {
    expect(() => assertProductionEmbedderConfiguration({ NODE_ENV: 'production' })).toThrowError(
      EmbedderConfigurationError,
    );
    expect(() =>
      assertProductionEmbedderConfiguration({
        NODE_ENV: 'production',
        SUBSTRATE_EMBED_URL: '   ',
        HF_EMBED_URL: '\t',
      }),
    ).toThrowError(/real embedding endpoint is required/i);
  });

  it('rejects malformed, credential-bearing, and non-HTTP production endpoints', () => {
    for (const endpoint of [
      'not-a-url',
      'file:///tmp/embed.sock',
      'https://user:password@example.test',
      'https://example.test?model=mutable',
      'https://example.test#mutable-fragment',
    ]) {
      expect(() =>
        assertProductionEmbedderConfiguration({
          NODE_ENV: 'production',
          SUBSTRATE_EMBED_URL: endpoint,
        }),
      ).toThrowError(EmbedderConfigurationError);
    }
  });

  it('allows the explicit in-process development backend', () => {
    expect(() => assertProductionEmbedderConfiguration({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('requires qualified immutable model evidence in production', () => {
    const valid = {
      NODE_ENV: 'production',
      SUBSTRATE_EMBED_URL: 'https://embed.example.test',
      AEF_EMBED_PROMOTION_STATE: 'QUALIFIED',
      HF_EMBED_MODEL_REVISION: MODEL_REVISION,
      HF_EMBED_ARTIFACT_SET_DIGEST: ARTIFACT_SET_DIGEST,
      SUBSTRATE_EMBED_API_KEY: 'worker-shared-key',
      SUBSTRATE_EMBED_TENANT_ID: 'worker-bound-tenant',
    };
    expect(() => assertProductionEmbedderConfiguration(valid)).not.toThrow();

    for (const invalid of [
      { ...valid, AEF_EMBED_PROMOTION_STATE: 'DEVELOPMENT' },
      { ...valid, HF_EMBED_MODEL_REVISION: 'latest' },
      { ...valid, HF_EMBED_MODEL_REVISION: 'v1' },
      { ...valid, HF_EMBED_MODEL_REVISION: '   ' },
      { ...valid, HF_EMBED_ARTIFACT_SET_DIGEST: 'not-a-sha256' },
    ]) {
      expect(() => assertProductionEmbedderConfiguration(invalid)).toThrowError(
        EmbedderConfigurationError,
      );
    }
  });

  it('requires an internal credential and bound tenant for a production substrate worker', () => {
    const valid = {
      NODE_ENV: 'production',
      SUBSTRATE_EMBED_URL: 'https://embed.example.test',
      AEF_EMBED_PROMOTION_STATE: 'QUALIFIED',
      HF_EMBED_MODEL_REVISION: MODEL_REVISION,
      HF_EMBED_ARTIFACT_SET_DIGEST: ARTIFACT_SET_DIGEST,
      SUBSTRATE_EMBED_API_KEY: 'worker-shared-key',
      SUBSTRATE_EMBED_TENANT_ID: 'worker-bound-tenant',
    };

    expect(() =>
      assertProductionEmbedderConfiguration({ ...valid, SUBSTRATE_EMBED_API_KEY: '' }),
    ).toThrowError(/SUBSTRATE_EMBED_API_KEY is required/);
    expect(() =>
      assertProductionEmbedderConfiguration({ ...valid, SUBSTRATE_EMBED_TENANT_ID: '' }),
    ).toThrowError(/SUBSTRATE_EMBED_TENANT_ID is required/);
    expect(() => assertProductionEmbedderConfiguration(valid)).not.toThrow();
  });
});

describe('embedding backend readiness', () => {
  function configureQualifiedProduction(): void {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SUBSTRATE_EMBED_URL', 'https://embed.example.test');
    vi.stubEnv('HF_EMBED_URL', '');
    vi.stubEnv('SUBSTRATE_EMBED_PATH', '/aef/embed');
    vi.stubEnv('AEF_EMBED_PROMOTION_STATE', 'QUALIFIED');
    vi.stubEnv('HF_EMBED_MODEL_REVISION', MODEL_REVISION);
    vi.stubEnv('HF_EMBED_ARTIFACT_SET_DIGEST', ARTIFACT_SET_DIGEST);
    vi.stubEnv('SUBSTRATE_EMBED_API_KEY', 'worker-shared-key');
    vi.stubEnv('SUBSTRATE_EMBED_TENANT_ID', 'worker-bound-tenant');
  }

  function embedResponse(model = 'BAAI/bge-m3', dimensions = 1024): Response {
    return Response.json({
      vectors: [Array.from({ length: dimensions }, (_value, index) => (index === 0 ? 1 : 0))],
      model,
      dimensions,
      normalized: true,
      model_revision: MODEL_REVISION,
      artifact_set_digest: ARTIFACT_SET_DIGEST,
      promotion_state: 'QUALIFIED',
    });
  }

  it('reports a configured production backend as ready only after a valid inference', async () => {
    configureQualifiedProduction();
    const fetchMock = vi.fn().mockResolvedValue(embedResponse());
    vi.stubGlobal('fetch', fetchMock);

    const report = await buildEmbeddingReadinessReport();

    expect(report).toMatchObject({
      ready: true,
      backendId: 'external-http',
      model: 'BAAI/bge-m3',
      detail: 'inference contract verified',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://embed.example.test/aef/embed',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
        body: expect.stringContaining('BAAI/bge-m3'),
      }),
    );
  });

  it('degrades after the configured production backend becomes unavailable', async () => {
    configureQualifiedProduction();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(embedResponse())
      .mockResolvedValueOnce(new Response('{}', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await buildEmbeddingReadinessReport()).toMatchObject({ ready: true });
    expect(await buildEmbeddingReadinessReport()).toMatchObject({
      ready: false,
      detail: expect.stringContaining('returned HTTP 503'),
    });
  });

  it('rejects a live backend that serves the wrong model contract', async () => {
    configureQualifiedProduction();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(embedResponse('aef-dev-hash')));

    await expect(buildEmbeddingReadinessReport()).resolves.toMatchObject({
      ready: false,
      detail: expect.stringContaining('unexpected model identity'),
    });
  });

  it('rejects a backend that does not prove qualified promotion state', async () => {
    configureQualifiedProduction();
    const response = (await embedResponse().json()) as Record<string, unknown>;
    delete response.promotion_state;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(response)));

    await expect(buildEmbeddingReadinessReport()).resolves.toMatchObject({
      ready: false,
      detail: expect.stringContaining('did not prove the admitted promotion state'),
    });
  });

  it('reports missing production configuration as not ready', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SUBSTRATE_EMBED_URL', '');
    vi.stubEnv('HF_EMBED_URL', '');

    await expect(buildEmbeddingReadinessReport()).resolves.toMatchObject({
      ready: false,
      backendId: 'unconfigured',
    });
  });
});

describe('retrieval storage admission', () => {
  it('rejects an in-memory or missing production store', () => {
    expect(() => resolveRetrievalStoreBackend({ NODE_ENV: 'production' })).toThrowError(
      RetrievalStoreConfigurationError,
    );
    expect(() =>
      resolveRetrievalStoreBackend({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://db.example.test/aef',
        AEF_STORE_BACKEND: 'in-memory',
      }),
    ).toThrowError(/does not admit the in-memory store/);
  });

  it('admits pgvector configuration without claiming live database reachability', () => {
    expect(
      buildRetrievalStoreAdmissionReport({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://db.example.test/aef',
        AEF_STORE_BACKEND: 'pgvector',
      }),
    ).toMatchObject({
      admitted: true,
      backend: 'pgvector',
      admissionState: 'CONFIGURED',
      detail: expect.stringContaining('reachability is verified by requests'),
    });
  });
});

describe('aggregate API readiness', () => {
  const readyComponents = {
    embedding: { ready: true },
    reranker: { ready: true },
    retrieval: { admitted: true },
    evidenceLedger: { ready: true },
    statefulWorkflows: { ready: true },
  };

  it('requires every advertised capability to be admitted', () => {
    expect(isAefRuntimeReady(readyComponents)).toBe(true);

    expect(
      isAefRuntimeReady({
        ...readyComponents,
        retrieval: { admitted: false },
      }),
    ).toBe(false);
    expect(
      isAefRuntimeReady({
        ...readyComponents,
        evidenceLedger: { ready: false },
      }),
    ).toBe(false);
    expect(
      isAefRuntimeReady({
        ...readyComponents,
        statefulWorkflows: { ready: false },
      }),
    ).toBe(false);
  });
});
