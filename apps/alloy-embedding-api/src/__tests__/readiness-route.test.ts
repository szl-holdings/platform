import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAefReadinessHandler } from '../readiness-handler.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('public readiness route', () => {
  it('does not invoke embedding or rerank backends while production admissions are held', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('RUNTIME_MODE', 'production');
    const probeEmbedding = vi.fn();
    const probeReranker = vi.fn();
    const app = express();
    app.get('/readyz', createAefReadinessHandler({ probeEmbedding, probeReranker }));

    const response = await request(app).get('/readyz');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      ready: false,
      embedding: { ready: false, backendId: 'not-probed' },
      reranker: { ready: false, enabled: false },
      evidenceLedger: { ready: false, promotionState: 'EVALUATION_HOLD' },
      statefulWorkflows: { ready: false, promotionState: 'EVALUATION_HOLD' },
    });
    expect(response.body.embedding).not.toHaveProperty('execution');
    expect(response.body.reranker).not.toHaveProperty('execution');
    expect(probeEmbedding).not.toHaveBeenCalled();
    expect(probeReranker).not.toHaveBeenCalled();
  });
});
