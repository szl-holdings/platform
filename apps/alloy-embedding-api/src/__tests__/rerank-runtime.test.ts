import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildRerankerReadinessReport,
  RerankerConfigurationError,
  resolveRerankerConfiguration,
} from '../rerank-runtime.js';

const MODEL_REVISION = 'b'.repeat(40);
const ARTIFACT_SET_DIGEST = 'a'.repeat(64);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureQualifiedProduction(): void {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('AEF_RERANK_ENABLED', 'true');
  vi.stubEnv('SUBSTRATE_RERANK_URL', 'https://rerank.example.test');
  vi.stubEnv('SUBSTRATE_RERANK_PATH', '/aef/rerank');
  vi.stubEnv('AEF_RERANK_MODEL', 'lexical-overlap-v1');
  vi.stubEnv('AEF_RERANK_MODEL_REVISION', MODEL_REVISION);
  vi.stubEnv('AEF_RERANK_ARTIFACT_SET_DIGEST', ARTIFACT_SET_DIGEST);
  vi.stubEnv('AEF_RERANK_PROMOTION_STATE', 'QUALIFIED');
  vi.stubEnv('SUBSTRATE_RERANK_API_KEY', 'rerank-runtime-test-key');
  vi.stubEnv('SUBSTRATE_RERANK_TENANT_ID', 'tenant-rerank-test');
}

function qualifiedResponse(overrides: Record<string, unknown> = {}): Response {
  return Response.json({
    results: [{ id: 'readiness', score: 1, rank: 1 }],
    model: 'lexical-overlap-v1',
    model_revision: MODEL_REVISION,
    artifact_set_digest: ARTIFACT_SET_DIGEST,
    promotion_state: 'QUALIFIED',
    ...overrides,
  });
}

describe('reranker runtime configuration', () => {
  it('defaults production reranking to an explicit disabled state', () => {
    expect(resolveRerankerConfiguration({ NODE_ENV: 'production' })).toMatchObject({
      enabled: false,
      model: 'lexical-overlap-v1',
      promotionState: 'DEVELOPMENT',
    });
  });

  it('requires a qualified immutable production backend when enabled', () => {
    const valid = {
      NODE_ENV: 'production',
      AEF_RERANK_ENABLED: 'true',
      SUBSTRATE_RERANK_URL: 'https://rerank.example.test',
      AEF_RERANK_MODEL: 'lexical-overlap-v1',
      AEF_RERANK_MODEL_REVISION: MODEL_REVISION,
      AEF_RERANK_ARTIFACT_SET_DIGEST: ARTIFACT_SET_DIGEST,
      AEF_RERANK_PROMOTION_STATE: 'QUALIFIED',
      SUBSTRATE_RERANK_API_KEY: 'rerank-runtime-test-key',
      SUBSTRATE_RERANK_TENANT_ID: 'tenant-rerank-test',
    };
    expect(resolveRerankerConfiguration(valid)).toMatchObject({
      enabled: true,
      endpoint: 'https://rerank.example.test',
      modelRevision: MODEL_REVISION,
      artifactSetDigest: ARTIFACT_SET_DIGEST,
      promotionState: 'QUALIFIED',
    });

    for (const invalid of [
      { ...valid, SUBSTRATE_RERANK_URL: '' },
      { ...valid, AEF_RERANK_PROMOTION_STATE: 'DEVELOPMENT' },
      { ...valid, AEF_RERANK_MODEL_REVISION: 'latest' },
      { ...valid, AEF_RERANK_ARTIFACT_SET_DIGEST: 'not-a-digest' },
      { ...valid, AEF_RERANK_MODEL: 'pretend/cross-encoder' },
      { ...valid, AEF_RERANK_TIMEOUT_MS: 'NaN' },
    ]) {
      expect(() => resolveRerankerConfiguration(invalid)).toThrowError(RerankerConfigurationError);
    }
  });
});

describe('reranker readiness', () => {
  it('treats the explicit production-disabled state as ready without probing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AEF_RERANK_ENABLED', 'false');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(buildRerankerReadinessReport()).resolves.toMatchObject({
      ready: true,
      enabled: false,
      detail: 'reranking explicitly disabled',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('proves the configured production model identity with a bounded inference', async () => {
    configureQualifiedProduction();
    const fetchMock = vi.fn().mockResolvedValue(qualifiedResponse());
    vi.stubGlobal('fetch', fetchMock);

    await expect(buildRerankerReadinessReport()).resolves.toMatchObject({
      ready: true,
      enabled: true,
      model: 'lexical-overlap-v1',
      execution: {
        backendId: 'lexical-http',
        modelId: 'lexical-overlap-v1',
        modelRevision: MODEL_REVISION,
        artifactSetDigest: ARTIFACT_SET_DIGEST,
        promotionState: 'QUALIFIED',
        fallback: false,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://rerank.example.test/aef/rerank',
      expect.objectContaining({ method: 'POST', signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        Authorization: 'Bearer rerank-runtime-test-key',
        'X-Tenant-ID': 'tenant-rerank-test',
      }),
    });
  });

  it('degrades when the backend cannot prove the admitted production state', async () => {
    configureQualifiedProduction();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(qualifiedResponse({ promotion_state: 'DEVELOPMENT' })),
    );

    await expect(buildRerankerReadinessReport()).resolves.toMatchObject({
      ready: false,
      enabled: true,
      detail: expect.stringContaining('did not prove the admitted promotion state'),
    });
  });

  it('labels the deterministic fallback as development-only evidence', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('AEF_RERANK_ENABLED', 'true');
    vi.stubEnv('SUBSTRATE_RERANK_URL', 'https://rerank.example.test');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(buildRerankerReadinessReport()).resolves.toMatchObject({
      ready: true,
      enabled: true,
      detail: 'development fallback ready',
      execution: {
        promotionState: 'DEVELOPMENT',
        fallback: true,
        fallbackReason: 'primary-error',
      },
    });
  });
});
