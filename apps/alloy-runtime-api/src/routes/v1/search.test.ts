/**
 * Tests for /v1/search/hybrid — the real BM25 keyword pipeline over the
 * tenant-scoped run corpus, including tenant isolation and the AEF response
 * envelope shape.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import searchRouter from './search.js';
import { runStore } from '../../store.js';
import { mountRouter, type TestClient } from '../__testkit.js';

let client: TestClient;
const savedKey = process.env.ALLOY_API_KEY;

const ACME = { 'x-api-key': 'k', 'x-tenant-id': 'acme' };
const GLOBEX = { 'x-api-key': 'k', 'x-tenant-id': 'globex' };

function seedRun(runId: string, state: string, stepNames: string[], tenant: string): void {
  const run = {
    runId,
    workflowId: 'wf',
    state,
    startedAt: new Date().toISOString(),
    steps: stepNames.map((name) => ({ name, state: 'completed' })),
  } as unknown as Parameters<typeof runStore.set>[0];
  runStore.set(run, tenant);
}

beforeAll(async () => {
  process.env.ALLOY_API_KEY = 'k';
  process.env.NODE_ENV = 'test';
  client = await mountRouter('/v1/search', searchRouter);
  // Seed a small corpus per tenant.
  seedRun('run-maritime-alpha', 'completed', ['analyse vessel signal', 'maritime policy gate'], 'acme');
  seedRun('run-legal-beta', 'completed', ['legal contract review', 'sanctions screening'], 'acme');
  seedRun('globex-secret-run', 'completed', ['maritime intelligence sweep'], 'globex');
});

afterAll(() => {
  client?.close();
  if (savedKey === undefined) delete process.env.ALLOY_API_KEY;
  else process.env.ALLOY_API_KEY = savedKey;
});

describe('POST /v1/search/hybrid', () => {
  it('rejects a missing query', async () => {
    const res = await client.req('POST', '/v1/search/hybrid', { headers: ACME, body: {} });
    expect(res.status).toBe(400);
  });

  it('returns BM25-ranked hits in the AEF envelope', async () => {
    const res = await client.req('POST', '/v1/search/hybrid', {
      headers: ACME,
      body: { query: 'maritime vessel signal' },
    });
    expect(res.status).toBe(200);
    // AEF envelope fields.
    expect(res.json).toHaveProperty('requestId');
    expect(res.json).toHaveProperty('traceId');
    expect(res.json).toHaveProperty('retrievalPath');
    expect(typeof res.json.processingMs).toBe('number');
    expect(res.json.tenantId).toBe('acme');
    // The maritime run should rank above the legal-themed run for this query.
    expect(res.json.hits.length).toBeGreaterThan(0);
    expect(res.json.hits[0].chunkId).toBe('run-maritime-alpha');
    // Per-hit AEF fields.
    const hit = res.json.hits[0];
    expect(hit).toHaveProperty('keywordScore');
    expect(hit).toHaveProperty('fusedScore');
    expect(hit).toHaveProperty('finalScore');
    expect(hit.fusedScore).toBeGreaterThan(0);
  });

  it('respects topK', async () => {
    const res = await client.req('POST', '/v1/search/hybrid', {
      headers: ACME,
      body: { query: 'maritime legal', topK: 1 },
    });
    expect(res.json.hits.length).toBeLessThanOrEqual(1);
  });

  it('does not return another tenant runs (isolation)', async () => {
    const res = await client.req('POST', '/v1/search/hybrid', {
      headers: GLOBEX,
      body: { query: 'maritime vessel signal legal' },
    });
    expect(res.json.tenantId).toBe('globex');
    const ids = res.json.hits.map((h: any) => h.chunkId);
    expect(ids).not.toContain('run-maritime-alpha');
    expect(ids).not.toContain('run-legal-beta');
    // Globex sees just its own run.
    for (const id of ids) expect(id).toBe('globex-secret-run');
  });
});
