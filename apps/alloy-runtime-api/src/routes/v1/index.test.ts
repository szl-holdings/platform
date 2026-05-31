/**
 * Tests for /v1/index/rebuild and /v1/index/verify envelopes.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import indexRouter from './index.js';
import { mountRouter, type TestClient } from '../__testkit.js';

let client: TestClient;
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOY_API_KEY;
  client = await mountRouter('/v1/index', indexRouter);
});
afterAll(() => client?.close());

describe('POST /v1/index/rebuild', () => {
  it('queues a rebuild with defaults', async () => {
    const res = await client.req('POST', '/v1/index/rebuild', { body: {} });
    expect(res.status).toBe(202);
    expect(res.json.status).toBe('queued');
    expect(res.json.domains).toEqual(['*']);
    expect(res.json.dryRun).toBe(false);
    expect(res.json.jobId).toMatch(/^rebuild_/);
  });

  it('echoes provided domains and flags', async () => {
    const res = await client.req('POST', '/v1/index/rebuild', {
      body: { domains: ['legal', 'maritime'], dryRun: true, force: true },
    });
    expect(res.json.domains).toEqual(['legal', 'maritime']);
    expect(res.json.dryRun).toBe(true);
    expect(res.json.force).toBe(true);
  });
});

describe('GET /v1/index/verify', () => {
  it('returns a health envelope and reflects jobId', async () => {
    const res = await client.req('GET', '/v1/index/verify?jobId=rebuild_123');
    expect(res.status).toBe(200);
    expect(res.json.jobId).toBe('rebuild_123');
    expect(res.json.integrityCheckPassed).toBe(true);
    expect(Array.isArray(res.json.shards)).toBe(true);
  });
});
