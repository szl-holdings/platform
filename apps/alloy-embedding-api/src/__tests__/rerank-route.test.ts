import { TenantIdSchema } from '@workspace/aef-contracts';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import { __resetRerankWorkerForTests } from '@workspace/alloy-rerank-worker';
import express, { type Express } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rerankRouter } from '../routes/rerank.js';

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.traceId = 'trace-rerank-test';
    req.tenantId = TenantIdSchema.parse('tenant-1');
    req.profileId = 'default';
    next();
  });
  app.use('/', rerankRouter as unknown as express.RequestHandler);
  return app;
}

const requestBody = {
  requestId: 'rerank-request-1',
  tenantId: 'tenant-1',
  query: 'governed evidence',
  candidates: [
    { id: 'candidate-1', text: 'governed evidence' },
    { id: 'candidate-2', text: 'unrelated material' },
  ],
  topK: 2,
};

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('AEF_RERANK_ENABLED', 'true');
  vi.stubEnv('SUBSTRATE_RERANK_URL', 'https://rerank.example.test');
  defaultLedgerStore.clear();
  __resetRerankWorkerForTests();
});

afterEach(() => {
  defaultLedgerStore.clear();
  __resetRerankWorkerForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('/v1/rerank governance', () => {
  it('returns a truthful development fallback receipt and persists it as evidence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const response = await request(buildApp()).post('/v1/rerank').send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body.model).toBe('lexical-overlap-v1');
    expect(response.body.execution).toMatchObject({
      backendId: 'fallback-deterministic',
      modelId: 'lexical-overlap-v1',
      promotionState: 'DEVELOPMENT',
      implementationKind: 'lexical-overlap',
      fallback: true,
      fallbackReason: 'primary-error',
    });
    expect(defaultLedgerStore.query({ requestId: requestBody.requestId })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rerankerBackendId: 'fallback-deterministic',
          rerankerModelId: 'lexical-overlap-v1',
          rerankerPromotionState: 'DEVELOPMENT',
          rerankerFallback: true,
        }),
      ]),
    );
  });

  it('returns a clear 503 without executing when reranking is disabled', async () => {
    vi.stubEnv('AEF_RERANK_ENABLED', 'false');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await request(buildApp()).post('/v1/rerank').send(requestBody);

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('RERANKER_DISABLED');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(defaultLedgerStore.query({ requestId: requestBody.requestId })).toHaveLength(0);
  });
});
