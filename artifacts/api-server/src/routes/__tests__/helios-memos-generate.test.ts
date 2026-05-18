// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
/**
 * Helios Recalibration Memo Generation
 *
 * POST /memos/generate
 *
 * Verifies:
 *   (a) Selects top signals by impact score within lookback window.
 *   (b) Persists generated memo to helios_recalibration_memos via pool.query.
 *   (c) Returned memo is marked status='draft' and generated=true.
 *   (d) GET /memos surfaces the persisted draft (reload behaviour).
 *   (e) Falls back to deterministic templated synthesis when AI key absent.
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/ai-engine', () => ({
  a2aTaskManager: { createTask: vi.fn(), getTask: vi.fn() },
}));

vi.mock('@szl-holdings/ai-engine/providers/anthropic', () => ({
  anthropic: { messages: { create: vi.fn() } },
}));

vi.mock('../../services/ai/call-model', () => ({
  callModel: vi.fn(),
}));

const storedRows: Array<Record<string, unknown>> = [];
const queryMock = vi.fn(async (sql: string, params?: unknown[]) => {
  if (/CREATE TABLE/i.test(sql)) return { rows: [] };
  if (/^INSERT INTO helios_recalibration_memos/i.test(sql.trim())) {
    const p = params as unknown[];
    storedRows.unshift({
      id: p[0], week_of: p[1], title: p[2], audit: p[3], blueprint: p[4], roadmap: p[5],
      signal_count: p[6], proposal_count: p[7], status: p[8], generated: p[9],
      source_signals: JSON.parse(p[10] as string),
      created_at: new Date(p[11] as string),
    });
    return { rows: [] };
  }
  if (/SELECT \* FROM helios_recalibration_memos/i.test(sql)) {
    return { rows: storedRows };
  }
  return { rows: [] };
});

vi.mock('@szl-holdings/db', () => ({
  pool: { query: queryMock },
  db: {},
}));

// Mock seeded signals — give them recent createdAt within lookback window.
vi.mock('../helios/data', () => {
  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString();
  return {
    SIGNALS: [
      { id: 'sig-A', kind: 'capability', title: 'High impact capability', summary: '', soWhat: 'Close gap',
        sourceUrl: '', sourceName: '', confidence: 0.9, impactScore: 0.95,
        entities: [], claims: [], affectedAgents: ['Sentra'], createdAt: iso(86_400_000), scanner: 'arxiv' },
      { id: 'sig-B', kind: 'regulation', title: 'Reg pressure', summary: '', soWhat: 'Comply now',
        sourceUrl: '', sourceName: '', confidence: 0.8, impactScore: 0.85,
        entities: [], claims: [], affectedAgents: ['Counsel'], createdAt: iso(2 * 86_400_000), scanner: 'gov' },
      { id: 'sig-C', kind: 'market', title: 'Vendor move', summary: '', soWhat: 'Track competitor',
        sourceUrl: '', sourceName: '', confidence: 0.7, impactScore: 0.6,
        entities: [], claims: [], affectedAgents: [], createdAt: iso(3 * 86_400_000), scanner: 'market' },
      { id: 'sig-OLD', kind: 'capability', title: 'Old signal', summary: '', soWhat: 'Stale',
        sourceUrl: '', sourceName: '', confidence: 0.9, impactScore: 0.99,
        entities: [], claims: [], affectedAgents: [], createdAt: iso(60 * 86_400_000), scanner: 'arxiv' },
    ],
    PROPOSALS: [],
    SCANNERS: [],
    MYTHOS_NODES: [],
    MYTHOS_EDGES: [],
    BENCHMARK_SCORES: [],
    BENCHMARK_TIME_SERIES: [],
    RECALIBRATION_MEMOS: [],
  };
});

async function buildApp() {
  const router = (await import('../helios/index')).default;
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

beforeEach(() => {
  storedRows.length = 0;
  queryMock.mockClear();
  delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /memos/generate', () => {
  it('(a,c) selects top signals by impact and returns a draft memo', async () => {
    const app = await buildApp();
    const res = await request(app).post('/memos/generate').send({ lookbackDays: 7, topN: 5 });
    expect(res.status).toBe(201);
    expect(res.body.memo.status).toBe('draft');
    expect(res.body.memo.generated).toBe(true);
    expect(res.body.memo.title).toMatch(/^\[DRAFT\]/);
    // sig-OLD is outside lookback; sig-A,B,C are inside, sorted by impact desc
    expect(res.body.sourceSignalIds).toEqual(['sig-A', 'sig-B', 'sig-C']);
    expect(res.body.themeCounts).toEqual({ capability: 1, regulatory: 1, vendor: 1 });
  });

  it('(b) persists the generated memo via pool.query INSERT', async () => {
    const app = await buildApp();
    const res = await request(app).post('/memos/generate').send({ lookbackDays: 7, topN: 5 });
    expect(res.status).toBe(201);
    expect(res.body.persisted).toBe(true);
    const insertCalls = queryMock.mock.calls.filter(c => /^INSERT INTO helios_recalibration_memos/i.test(String(c[0]).trim()));
    expect(insertCalls.length).toBe(1);
    expect(storedRows).toHaveLength(1);
    expect(storedRows[0].source_signals).toEqual(['sig-A', 'sig-B', 'sig-C']);
  });

  it('(d) GET /memos returns the persisted draft after generation', async () => {
    const app = await buildApp();
    const gen = await request(app).post('/memos/generate').send({ lookbackDays: 7, topN: 5 });
    const list = await request(app).get('/memos');
    expect(list.status).toBe(200);
    const ids = (list.body.memos as Array<{ id: string }>).map(m => m.id);
    expect(ids).toContain(gen.body.memo.id);
  });

  it('(e) uses deterministic templated synthesis when ANTHROPIC_API_KEY missing (aiUsed=false)', async () => {
    const app = await buildApp();
    const res = await request(app).post('/memos/generate').send({ lookbackDays: 7, topN: 5 });
    expect(res.body.aiUsed).toBe(false);
    expect(res.body.memo.audit).toContain('Auto-synthesised audit');
    expect(res.body.memo.blueprint).toContain('Recommended capability moves');
    expect(res.body.memo.roadmap).toContain('Week 1');
  });

  it('returns 400 when no signals fall within the lookback window', async () => {
    const app = await buildApp();
    const res = await request(app).post('/memos/generate').send({ lookbackDays: 0.0001, topN: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No signals/);
  });
});
