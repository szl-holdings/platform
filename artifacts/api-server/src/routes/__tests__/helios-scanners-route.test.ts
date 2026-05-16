/**
 * Helios Scanner Admin route integration test.
 *
 * Locks the behaviour the Scanner Admin + Signal Feed UI depends on:
 *   - GET /scanners returns the seeded scanner list (UI is never blank).
 *   - After ingestSignals(), GET /scanners reflects real lastRun,
 *     signalsToday, and totalSignals (the regression that previously
 *     reported signalsToday=0 because of the scanner-id vs. signal-tag
 *     mismatch).
 *   - GET /signals?kind=capability surfaces newly-ingested live signals
 *     with the correct sourceName / sourceUrl.
 *   - PATCH /scanners/:id/toggle flips enabled/status.
 */

import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/ai-engine', () => ({
  a2aTaskManager: { createTask: vi.fn(), getTask: vi.fn() },
}));

vi.mock('@szl-holdings/ai-engine/providers/anthropic', () => ({
  anthropic: { messages: { create: vi.fn() } },
}));

vi.mock('../../services/ai/call-model', () => ({
  callModel: vi.fn(),
}));

vi.mock('@szl-holdings/db', () => ({
  pool: { query: vi.fn(async () => ({ rows: [] })) },
}));

async function buildApp() {
  const router = (await import('../helios/index')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/helios', router);
  return app;
}

describe('Helios scanners route', () => {
  it('returns the seeded scanner list out of the box', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/helios/scanners');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.scanners)).toBe(true);
    expect(res.body.scanners.length).toBeGreaterThan(0);
    const ids = res.body.scanners.map((s: { id: string }) => s.id);
    expect(ids).toContain('scanner-arxiv');
    expect(ids).toContain('scanner-github');
  });

  it('reflects real lastRun + signalsToday + totalSignals after ingest', async () => {
    const { ingestSignals } = await import('../helios/live-store');
    const app = await buildApp();

    const before = await request(app).get('/api/helios/scanners');
    const beforeArxiv = before.body.scanners.find((s: { id: string }) => s.id === 'scanner-arxiv');
    const baseTotal = beforeArxiv.totalSignals as number;

    const now = new Date().toISOString();
    ingestSignals('scanner-arxiv', [
      {
        id: 'sig-route-test-arxiv-1',
        kind: 'capability',
        scanner: 'arxiv',
        title: 'Integration test signal A',
        summary: 'route test',
        soWhat: 'n/a',
        sourceUrl: 'https://arxiv.org/abs/route.test.1',
        sourceName: 'arXiv cs.AI',
        confidence: 0.7,
        impactScore: 0.6,
        entities: [],
        claims: [],
        affectedAgents: [],
        createdAt: now,
      },
      {
        id: 'sig-route-test-arxiv-2',
        kind: 'capability',
        scanner: 'arxiv',
        title: 'Integration test signal B',
        summary: 'route test',
        soWhat: 'n/a',
        sourceUrl: 'https://arxiv.org/abs/route.test.2',
        sourceName: 'arXiv cs.AI',
        confidence: 0.7,
        impactScore: 0.6,
        entities: [],
        claims: [],
        affectedAgents: [],
        createdAt: now,
      },
    ]);

    const after = await request(app).get('/api/helios/scanners');
    const afterArxiv = after.body.scanners.find((s: { id: string }) => s.id === 'scanner-arxiv');
    expect(afterArxiv.lastRun).toBeTruthy();
    expect(afterArxiv.totalSignals).toBe(baseTotal + 2);
    // Regression: this was 0 before the scanner-id vs signal-tag fix.
    expect(afterArxiv.signalsToday).toBeGreaterThanOrEqual(2);
    expect(afterArxiv.status).toBe('healthy');

    const signalsRes = await request(app).get('/api/helios/signals?q=Integration%20test');
    expect(signalsRes.status).toBe(200);
    const fetched = signalsRes.body.signals as Array<{ id: string; sourceName: string; sourceUrl: string }>;
    expect(fetched.find(s => s.id === 'sig-route-test-arxiv-1')).toBeDefined();
    expect(fetched.find(s => s.id === 'sig-route-test-arxiv-1')?.sourceName).toBe('arXiv cs.AI');
    expect(fetched.find(s => s.id === 'sig-route-test-arxiv-1')?.sourceUrl).toBe('https://arxiv.org/abs/route.test.1');
  });

  it('PATCH /scanners/:id/toggle flips enabled + status', async () => {
    const app = await buildApp();
    const off = await request(app)
      .patch('/api/helios/scanners/scanner-mena/toggle')
      .send({ enabled: false });
    expect(off.status).toBe(200);
    expect(off.body.scanner.enabled).toBe(false);
    expect(off.body.scanner.status).toBe('idle');

    const on = await request(app)
      .patch('/api/helios/scanners/scanner-mena/toggle')
      .send({ enabled: true });
    expect(on.status).toBe(200);
    expect(on.body.scanner.enabled).toBe(true);
    expect(on.body.scanner.status).toBe('healthy');
  });
});
