/**
 * Tests for /v1/evals/run validation and async/sync envelopes.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import evalsRouter from './evals.js';
import { mountRouter, type TestClient } from '../__testkit.js';

let client: TestClient;
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOY_API_KEY;
  client = await mountRouter('/v1/evals', evalsRouter);
});
afterAll(() => client?.close());

describe('POST /v1/evals/run', () => {
  it('rejects an unknown metric', async () => {
    const res = await client.req('POST', '/v1/evals/run', {
      body: { suiteId: 's1', metrics: ['not_a_metric'] },
    });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe('Validation failed');
  });

  it('rejects an empty metrics array', async () => {
    const res = await client.req('POST', '/v1/evals/run', {
      body: { suiteId: 's1', metrics: [] },
    });
    expect(res.status).toBe(400);
  });

  it('returns 202 queued for an async run (default)', async () => {
    const res = await client.req('POST', '/v1/evals/run', {
      body: { suiteId: 's1', metrics: ['faithfulness', 'hallucination_rate'] },
    });
    expect(res.status).toBe(202);
    expect(res.json.status).toBe('queued');
    expect(res.json.results).toBeNull();
    expect(res.json.statusUrl).toContain('/v1/evals/');
    expect(res.json.evalRunId).toMatch(/^eval_/);
  });

  it('returns 200 completed with score keys for a sync run', async () => {
    const res = await client.req('POST', '/v1/evals/run', {
      body: { suiteId: 's2', metrics: ['answer_relevancy'], async: false },
    });
    expect(res.status).toBe(200);
    expect(res.json.status).toBe('completed');
    expect(res.json.results).not.toBeNull();
    expect(Object.keys(res.json.results.scores)).toEqual(['answer_relevancy']);
  });
});
