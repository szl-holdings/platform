/**
 * Public, unauthenticated `GET /a11oy/frontier/public/models` endpoint.
 *
 * Covers (Task #4943):
 *   - No auth header required — returns 200 to anonymous callers.
 *   - Response shape matches `tools/a11oy-code/src/providers/router.mjs`
 *     (`{ models: [{ id, provider, weight, kind }] }`).
 *   - Only `kind === 'model'` promotions are surfaced; other promoted
 *     kinds (dataset/paper/tool) are filtered out so we don't leak
 *     non-model intelligence to anonymous callers.
 *   - Duplicate promotions (same provider+externalId) collapse to one row.
 *   - Cache-Control + ETag headers are set; matching `If-None-Match`
 *     yields a 304.
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Force express-rate-limit to a permissive ceiling so the test never trips
// the public-model limiter.
vi.mock('express-rate-limit', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('express-rate-limit')>();
  const patched = ((options: Record<string, unknown> = {}) =>
    actual.default({ ...options, max: 10_000 })) as unknown as typeof actual.default;
  return { ...actual, default: patched, rateLimit: patched };
});

// Stub the frontier-ingest module so the route uses our seeded promotions
// without spinning up the DB schema bootstrap.
vi.mock('@workspace/frontier-ingest', () => {
  return {
    ensureFrontierIngestDbSchema: async () => {},
    ensureFrontierIngestSchedule: async () => ({ ok: false, reason: 'test' }),
    ensureFrontierRetentionSchedule: async () => ({ ok: false, reason: 'test' }),
    isFrontierIngestDbEnabled: () => false,
    isWorkerRunning: () => false,
    getStats: () => ({ totalDiscovered: 0, totalPromoted: 0, totalQueued: 0, totalDiscarded: 0, pendingInbox: 0, spend: [], spendCapUsd: 0, capReached: false }),
    getSpendCap: () => 0,
    setSpendCap: () => {},
    getDailySpendHydrated: async () => ({ usd: 0, capUsd: 0, windowStart: new Date().toISOString() }),
    listSources: () => [],
    listInbox: () => [],
    listTimeline: () => [],
    listPromoted: () => [
      {
        artifact: { id: 'a1', provider: 'anthropic', kind: 'model', externalId: 'claude-4.5', title: 'Claude 4.5', url: '', tags: [], discoveredAt: '' },
        target: 'operator_model_registry',
        at: '2026-01-01T00:00:00Z',
        evidence: { artifact: {} as never, score: { composite: 0.92 } as never, decision: 'auto-promote', evaluatedAt: '' },
      },
      // Duplicate of claude-4.5 — should be deduped.
      {
        artifact: { id: 'a1-dup', provider: 'anthropic', kind: 'model', externalId: 'claude-4.5', title: 'Claude 4.5', url: '', tags: [], discoveredAt: '' },
        target: 'operator_model_registry',
        at: '2026-01-02T00:00:00Z',
        evidence: { artifact: {} as never, score: { composite: 0.5 } as never, decision: 'auto-promote', evaluatedAt: '' },
      },
      // Non-model promotion — should be filtered out.
      {
        artifact: { id: 'p1', provider: 'openai', kind: 'paper', externalId: 'gpt-paper', title: 'Paper', url: '', tags: [], discoveredAt: '' },
        target: 'thesis_corpus',
        at: '2026-01-01T00:00:00Z',
        evidence: { artifact: {} as never, score: { composite: 0.7 } as never, decision: 'auto-promote', evaluatedAt: '' },
      },
      // A model promoted to a non-operator target (eval_harness) — should
      // also be filtered out. Only operator_model_registry promotions are
      // exposed publicly.
      {
        artifact: { id: 'e1', provider: 'google', kind: 'model', externalId: 'eval-only-model', title: 'Eval Only', url: '', tags: [], discoveredAt: '' },
        target: 'eval_harness',
        at: '2026-01-01T00:00:00Z',
        evidence: { artifact: {} as never, score: { composite: 0.6 } as never, decision: 'auto-promote', evaluatedAt: '' },
      },
      {
        artifact: { id: 'o1', provider: 'openai', kind: 'model', externalId: 'gpt-5.5', title: 'GPT-5.5', url: '', tags: [], discoveredAt: '' },
        target: 'operator_model_registry',
        at: '2026-01-01T00:00:00Z',
        evidence: { artifact: {} as never, score: { composite: 0.81 } as never, decision: 'auto-promote', evaluatedAt: '' },
      },
    ],
    pullAll: async () => {},
    pullSource: async () => ({ artifacts: [], evidence: [], costUsd: 0 }),
    approveInboxItem: () => undefined,
    approveInboxItemShared: async () => undefined,
    discardInboxItem: () => undefined,
    discardInboxItemShared: async () => undefined,
    dbGetStatsShared: async () => undefined,
    dbListInboxShared: async () => undefined,
    dbListTimelineShared: async () => undefined,
    dbListPromotionsShared: async () => undefined,
    dbListDownstreamShared: async () => undefined,
    dbGetFrontierTableCounts: async () => undefined,
    pruneFrontierRetention: async () => undefined,
    resolveFrontierRetentionConfig: () => ({ timelineDays: 30, discardedInboxDays: 30, intervalMs: 0 }),
    startWorker: () => {},
    stopWorker: () => {},
    _resetForTests: () => {},
  };
});

vi.mock('@workspace/frontier-ingest/adapters', () => ({
  listAllPromotions: () => ({}),
}));

// Auth middleware factory — return a no-op since the public endpoint should
// not invoke it, and the other (auth-gated) handlers in the file don't run
// in this test.
vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Downstream runtime helper — only used by other routes in the file.
vi.mock('../a11oy/runtime/frontier-downstream.js', () => ({
  downstreamCounts: () => ({}),
  listAllDownstream: () => ({}),
  listDownstream: () => [],
}));

import frontierRouter from '../routes/a11oy-frontier';

const app = express();
app.use(express.json());
app.use('/api', frontierRouter);

beforeEach(() => {});
afterEach(() => {});

describe('GET /a11oy/frontier/public/models', () => {
  it('responds 200 without auth, in the router contract shape', async () => {
    const res = await request(app).get('/api/a11oy/frontier/public/models');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.models)).toBe(true);
    expect(typeof res.body.count).toBe('number');
    expect(typeof res.body.generatedAt).toBe('string');
    for (const m of res.body.models as Array<Record<string, unknown>>) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.provider).toBe('string');
      expect(m.kind).toBe('model');
      expect(typeof m.weight).toBe('number');
    }
  });

  it('filters out non-model kinds and dedupes by provider+id', async () => {
    const res = await request(app).get('/api/a11oy/frontier/public/models');
    const ids = (res.body.models as Array<{ id: string; provider: string }>).map(
      (m) => `${m.provider}:${m.id}`,
    );
    expect(ids).toContain('anthropic:claude-4.5');
    expect(ids).toContain('openai:gpt-5.5');
    expect(ids).not.toContain('openai:gpt-paper');
    // Dedup — claude-4.5 appears only once even though two promotions exist.
    expect(ids.filter((k) => k === 'anthropic:claude-4.5').length).toBe(1);
  });

  it('sets Cache-Control + ETag and serves 304 on matching If-None-Match', async () => {
    const first = await request(app).get('/api/a11oy/frontier/public/models');
    expect(first.headers['cache-control']).toMatch(/max-age=\d+/);
    const etag = first.headers['etag'];
    expect(etag).toBeTruthy();

    const second = await request(app)
      .get('/api/a11oy/frontier/public/models')
      .set('If-None-Match', etag);
    expect(second.status).toBe(304);
  });
});
