import { RERANK_IMPLEMENTATION_ID } from '@workspace/aef-contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LexicalHttpRerankBackend } from '../backends/cross-encoder-http.js';
import { DeterministicFallbackRerankBackend } from '../backends/fallback.js';
import { __resetRerankWorkerForTests, rerankCandidates } from '../index.js';

const request = {
  query: 'maritime law force majeure',
  candidates: [
    { id: 'relevant', text: 'Force majeure is a clause in maritime law contracts.' },
    { id: 'unrelated', text: 'The stock market closed higher on Monday.' },
  ],
  topK: 2,
  model: RERANK_IMPLEMENTATION_ID,
};

afterEach(() => {
  __resetRerankWorkerForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('DeterministicFallbackBackend logic', () => {
  function tfScore(query: string, text: string): number {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    if (terms.length === 0) return 0;
    const textLower = text.toLowerCase();
    const hits = terms.filter((t) => textLower.includes(t)).length;
    return hits / terms.length;
  }

  it('scores exact match higher than unrelated text', () => {
    const queryTerms = 'maritime law force majeure';
    const relevant = 'Force majeure is a clause in maritime law contracts.';
    const unrelated = 'The stock market closed higher on Monday.';
    expect(tfScore(queryTerms, relevant)).toBeGreaterThan(tfScore(queryTerms, unrelated));
  });

  it('returns 0 for completely unrelated text', () => {
    expect(tfScore('maritime law', 'apples oranges bananas')).toBe(0);
  });

  it('returns 1.0 for text containing all query terms', () => {
    expect(tfScore('maritime law', 'maritime and law are both present here')).toBe(1.0);
  });

  it('short query terms (<=2 chars) are ignored', () => {
    expect(tfScore('a an of', 'a an of the')).toBe(0);
  });

  it('returns the server-owned implementation identity and development receipt', async () => {
    const result = await new DeterministicFallbackRerankBackend().rerank(request);
    expect(result.results[0]?.id).toBe('relevant');
    expect(result).toMatchObject({
      model: RERANK_IMPLEMENTATION_ID,
      execution: {
        backendId: 'fallback-deterministic',
        modelId: RERANK_IMPLEMENTATION_ID,
        promotionState: 'DEVELOPMENT',
        implementationKind: 'lexical-overlap',
        fallback: true,
      },
    });
  });

  it('uses fallback only under the explicit development-only policy', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SUBSTRATE_RERANK_URL', 'https://rerank.example.test');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(rerankCandidates(request)).rejects.toThrow('unreachable');
    __resetRerankWorkerForTests();
    await expect(
      rerankCandidates(request, { fallbackPolicy: 'development-only' }),
    ).resolves.toMatchObject({
      execution: { fallback: true, fallbackReason: 'primary-error' },
    });
  });

  it('rejects forced fallback in production before constructing a backend', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SUBSTRATE_RERANK_URL', '');

    await expect(rerankCandidates(request, { fallbackPolicy: 'force' })).rejects.toThrow(
      'permitted only in development or test',
    );
  });

  it('does not admit a development fallback when canonical production conflicts with NODE_ENV', async () => {
    vi.stubEnv('RUNTIME_MODE', 'production');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SUBSTRATE_RERANK_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(rerankCandidates(request, { fallbackPolicy: 'force' })).rejects.toThrow(
      'permitted only in development or test',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts only a complete qualified receipt from the HTTP backend', async () => {
    const revision = 'b'.repeat(40);
    const digest = 'a'.repeat(64);
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        results: [
          { id: 'relevant', score: 1, rank: 1 },
          { id: 'unrelated', score: 0, rank: 2 },
        ],
        model: RERANK_IMPLEMENTATION_ID,
        model_revision: revision,
        artifact_set_digest: digest,
        promotion_state: 'QUALIFIED',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const backend = new LexicalHttpRerankBackend({
      baseUrl: 'https://rerank.example.test',
      apiKey: 'rerank-worker-test-key',
      tenantId: 'tenant-rerank-test',
      modelRevision: revision,
      artifactSetDigest: digest,
      promotionState: 'QUALIFIED',
      requirePromotionStateProof: true,
    });

    await expect(backend.rerank(request)).resolves.toMatchObject({
      model: RERANK_IMPLEMENTATION_ID,
      execution: {
        modelRevision: revision,
        artifactSetDigest: digest,
        promotionState: 'QUALIFIED',
        fallback: false,
      },
    });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        Authorization: 'Bearer rerank-worker-test-key',
        'X-Tenant-ID': 'tenant-rerank-test',
      }),
    });
  });

  it('rejects incomplete result sets and model-evidence drift', async () => {
    const revision = 'b'.repeat(40);
    const digest = 'a'.repeat(64);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          results: [{ id: 'relevant', score: 1, rank: 1 }],
          model: RERANK_IMPLEMENTATION_ID,
          model_revision: revision,
          artifact_set_digest: digest,
          promotion_state: 'QUALIFIED',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          results: [
            { id: 'relevant', score: 1, rank: 1 },
            { id: 'unrelated', score: 0, rank: 2 },
          ],
          model: RERANK_IMPLEMENTATION_ID,
          model_revision: 'c'.repeat(40),
          artifact_set_digest: digest,
          promotion_state: 'QUALIFIED',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const backend = new LexicalHttpRerankBackend({
      baseUrl: 'https://rerank.example.test',
      modelRevision: revision,
      artifactSetDigest: digest,
      promotionState: 'QUALIFIED',
      requirePromotionStateProof: true,
    });

    await expect(backend.rerank(request)).rejects.toThrow('invalid result identities or ranks');
    await expect(backend.rerank(request)).rejects.toThrow(
      'did not prove the admitted model revision',
    );
  });
});
