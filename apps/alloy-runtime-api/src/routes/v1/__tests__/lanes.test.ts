/**
 * Vitest specs for the embed, rerank, and evals runtime lanes.
 *
 * Covers:
 * - Non-zero vector return for embed
 * - Deterministic embed (same input → same vector)
 * - Embed round-trip retrievable via /v1/memory/query
 * - Rerank actually reorders vs input order
 * - Eval run (sync) returns sampleCount > 0 and at least one metric > 0
 * - Eval run async then GET /v1/evals/:evalRunId returns persisted run
 * - Tenant isolation across all three lanes
 */

import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import type { Express } from 'express';
import { createRouter } from '../../../router.js';

process.env['ALLOY_API_KEY'] = 'test-key';

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(createRouter());
  return app;
}

function makeHeaders(tenantId = 'tenant-a'): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': 'test-key',
    'X-Tenant-Id': tenantId,
  };
}

async function post(
  app: Express,
  path: string,
  body: unknown,
  tenantId = 'tenant-a',
): Promise<{ status: number; body: Record<string, unknown> }> {
  const { default: supertest } = await import('supertest');
  const res = await supertest(app)
    .post(path)
    .set(makeHeaders(tenantId))
    .send(body as object);
  return { status: res.status, body: res.body as Record<string, unknown> };
}

async function getReq(
  app: Express,
  path: string,
  tenantId = 'tenant-a',
): Promise<{ status: number; body: Record<string, unknown> }> {
  const { default: supertest } = await import('supertest');
  const res = await supertest(app)
    .get(path)
    .set(makeHeaders(tenantId));
  return { status: res.status, body: res.body as Record<string, unknown> };
}

let app: Express;

beforeAll(() => {
  app = buildApp();
});

describe('POST /v1/embed', () => {
  it('rejects unsupported backend with 400', async () => {
    const { status, body } = await post(app, '/v1/embed', {
      texts: ['test'],
      backend: 'external-http',
    });
    expect(status).toBe(400);
    expect(body['error']).toBeDefined();
  });

  it('returns non-zero vectors with correct shape', async () => {
    const { status, body } = await post(app, '/v1/embed', {
      texts: ['quantum retrieval augmented generation', 'investor demo test'],
    });

    expect(status).toBe(200);
    const embeddings = body['embeddings'] as Array<Record<string, unknown>>;
    expect(embeddings).toHaveLength(2);

    for (const emb of embeddings) {
      const vec = emb['vector'] as number[];
      expect(Array.isArray(vec)).toBe(true);
      expect(vec.length).toBeGreaterThan(0);
      expect(vec.some((v) => v !== 0)).toBe(true);
      expect(Number(emb['dimensions'])).toBeGreaterThan(0);
    }

    expect(typeof body['requestId']).toBe('string');
    expect(typeof body['traceId']).toBe('string');
    expect(typeof body['processingMs']).toBe('number');
    expect(Array.isArray(body['embeddingPath'])).toBe(true);
    expect((body['embeddingPath'] as string[]).length).toBeGreaterThan(0);
  });

  it('is deterministic — same input returns identical vector', async () => {
    const text = 'deterministic-embedding-test-input-42';
    const [r1, r2] = await Promise.all([
      post(app, '/v1/embed', { texts: [text] }),
      post(app, '/v1/embed', { texts: [text] }),
    ]);

    const v1 = ((r1.body['embeddings'] as Array<Record<string, unknown>>)[0]?.['vector'] as number[]);
    const v2 = ((r2.body['embeddings'] as Array<Record<string, unknown>>)[0]?.['vector'] as number[]);

    expect(v1).toBeDefined();
    expect(v2).toBeDefined();
    expect(v1).toHaveLength(v2.length);
    v1.forEach((val, i) => expect(Math.abs(val - v2[i]!)).toBeLessThan(1e-9));
  });

  it('persists embedding to memory store, retrievable via /v1/memory/query', async () => {
    const { body: embedBody } = await post(app, '/v1/embed', {
      texts: ['memory-round-trip-probe'],
    });

    const requestId = String(embedBody['requestId']);
    expect(requestId).toBeTruthy();

    const { status, body: memBody } = await post(
      app,
      '/v1/memory/query',
      { scope: 'episodic', keyPrefix: `embed:${requestId}` },
    );

    expect(status).toBe(200);
    const entries = memBody['entries'] as unknown[];
    expect(entries.length).toBeGreaterThan(0);
  });
});

describe('POST /v1/rerank', () => {
  it('reorders passages vs input order by real score', async () => {
    const passages = [
      'Dolphins are intelligent marine mammals that live in oceans.',
      'The antitrust merger agreement includes indemnification and competition clauses.',
      'Antitrust law governs competitive market conduct between businesses.',
      'Stock price movements reflect quarterly earnings announcements.',
    ];

    const { status, body } = await post(app, '/v1/rerank', {
      query: 'antitrust merger competition',
      passages,
      topN: 4,
    });

    expect(status).toBe(200);
    const reranked = body['reranked'] as Array<Record<string, unknown>>;
    expect(reranked.length).toBeGreaterThan(0);

    const scores = reranked.map((r) => Number(r['rerankerScore']));
    expect(scores.some((s) => s > 0)).toBe(true);

    const originalRanks = reranked.map((r) => Number(r['originalRank']));
    const sortedByOriginal = [...originalRanks].sort((a, b) => a - b);
    expect(originalRanks.join(',')).not.toBe(sortedByOriginal.join(','));

    expect(typeof body['traceId']).toBe('string');
    expect(typeof body['processingMs']).toBe('number');
    expect(Array.isArray(body['rerankPath'])).toBe(true);
  });
});

describe('POST /v1/evals/run', () => {
  it('sync mode returns sampleCount > 0 and at least one metric > 0', async () => {
    const { status, body } = await post(app, '/v1/evals/run', {
      suiteId: 'prism_legal_matter',
      metrics: ['context_recall', 'context_precision', 'faithfulness', 'answer_relevancy'],
      async: false,
    });

    expect(status).toBe(200);
    expect(body['status']).toBe('completed');

    const results = body['results'] as Record<string, unknown>;
    expect(results).toBeDefined();
    expect(Number(results['sampleCount'])).toBeGreaterThan(0);

    const scores = results['scores'] as Record<string, number | null>;
    const values = Object.values(scores).filter((v) => v !== null) as number[];
    expect(values.length).toBeGreaterThan(0);
    expect(values.some((v) => v > 0)).toBe(true);

    expect(typeof body['traceId']).toBe('string');
    expect(typeof body['processingMs']).toBe('number');
    expect(Array.isArray(body['evalPath'])).toBe(true);
  });

  it('async mode stores run and GET returns persisted state', async () => {
    const { status: postStatus, body: postBody } = await post(app, '/v1/evals/run', {
      suiteId: 'prism_legal_matter',
      metrics: ['context_recall'],
      async: true,
    });

    expect(postStatus).toBe(202);
    expect(postBody['status']).toBe('queued');
    const evalRunId = String(postBody['evalRunId']);
    expect(evalRunId).toBeTruthy();

    await new Promise((r) => setTimeout(r, 500));

    const { status: getStatus, body: getBody } = await getReq(
      app,
      `/v1/evals/${evalRunId}`,
    );

    expect(getStatus).toBe(200);
    expect(getBody['evalRunId']).toBe(evalRunId);
    expect(['queued', 'running', 'completed']).toContain(getBody['status']);
    expect(getBody['tenantId']).toBe('tenant-a');
  });

  it('GET /v1/evals/:id returns 404 for unknown evalRunId', async () => {
    const { status } = await getReq(app, '/v1/evals/nonexistent-run-id-xyz');
    expect(status).toBe(404);
  });

  it('omitting suiteId uses default suite and still returns real metrics', async () => {
    const { status, body } = await post(app, '/v1/evals/run', {
      metrics: ['context_recall', 'context_precision'],
      async: false,
    });

    expect(status).toBe(200);
    expect(body['status']).toBe('completed');

    const results = body['results'] as Record<string, unknown>;
    expect(Number(results['sampleCount'])).toBeGreaterThan(0);

    const scores = results['scores'] as Record<string, number | null>;
    const values = Object.values(scores).filter((v) => v !== null) as number[];
    expect(values.some((v) => v > 0)).toBe(true);
  });

  it('async 202 response includes processingMs envelope field', async () => {
    const { status, body } = await post(app, '/v1/evals/run', {
      metrics: ['context_recall'],
      async: true,
    });

    expect(status).toBe(202);
    expect(typeof body['processingMs']).toBe('number');
    expect(body['processingMs']).toBeGreaterThanOrEqual(0);
  });
});

describe('Tenant isolation', () => {
  it('embed: tenant-b cannot read tenant-a embeddings from memory', async () => {
    const { body: embedBody } = await post(app, '/v1/embed', {
      texts: ['isolation-test-embed'],
    }, 'tenant-isolation-a');

    const requestId = String(embedBody['requestId']);

    const { body: memBody } = await post(
      app,
      '/v1/memory/query',
      { scope: 'episodic', keyPrefix: `embed:${requestId}` },
      'tenant-isolation-b',
    );

    const entries = memBody['entries'] as unknown[];
    expect(entries).toHaveLength(0);
  });

  it('evals: tenant-b cannot retrieve tenant-a eval run', async () => {
    const { body: postBody } = await post(app, '/v1/evals/run', {
      suiteId: 'prism_legal_matter',
      metrics: ['context_recall'],
      async: true,
    }, 'tenant-eval-a');

    const evalRunId = String(postBody['evalRunId']);
    await new Promise((r) => setTimeout(r, 100));

    const { status } = await getReq(app, `/v1/evals/${evalRunId}`, 'tenant-eval-b');
    expect(status).toBe(404);
  });

  it('rerank: returns consistent response regardless of tenant (stateless)', async () => {
    const body = {
      query: 'maritime vessel incident',
      passages: ['vessel cargo manifest', 'unrelated weather report', 'vessel incident log'],
    };
    const [r1, r2] = await Promise.all([
      post(app, '/v1/rerank', body, 'tenant-rerank-a'),
      post(app, '/v1/rerank', body, 'tenant-rerank-b'),
    ]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const ranks1 = (r1.body['reranked'] as Array<Record<string, unknown>>).map((r) => r['rank']);
    const ranks2 = (r2.body['reranked'] as Array<Record<string, unknown>>).map((r) => r['rank']);
    expect(ranks1).toEqual(ranks2);
  });
});
