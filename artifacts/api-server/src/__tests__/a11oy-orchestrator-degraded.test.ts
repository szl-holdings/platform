/**
 * A11oy Vertical Orchestrator — degraded-state regression tests (Task #5370).
 *
 * Mounts ONLY the orchestrator router so the test does not pull in the full
 * server's boot sequence. Drives `pool.query` via a controllable mock so we
 * can exercise both the happy path (registry table present and populated)
 * and the uninitialized path (registry table missing — Postgres 42P01).
 *
 * Regression guard
 * ────────────────
 * Before #5370 the routes treated "table doesn't exist" as a fatal fault
 * (GET /packs → 500 INTERNAL_ERROR, GET /status → 503 NOT_READY), which
 * broke the A11oy console on any environment where migration 0163 had not
 * been applied yet. The fix is to:
 *   - /packs:  catch pg code 42P01 and return 200 with an empty list
 *   - /status: probe via to_regclass(...) and return 200 with
 *              ready:false / migrationsApplied:false when the table is
 *              missing, rather than 503.
 * These tests fail loudly if either degradation path regresses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ---------------------------------------------------------------------------
// Controlled pool mock — vi.hoisted so the mock is in scope before the
// orchestrator router (which imports `pool` at module-eval time) is loaded.
// ---------------------------------------------------------------------------

type MockHandler = (sql: string, params?: unknown[]) => unknown;

const { mockPoolQuery, setQueryHandler } = vi.hoisted(() => {
  let handler: MockHandler = () => ({ rows: [] });
  const mockPoolQuery = vi.fn(async (sql: string, params?: unknown[]) => {
    const result = handler(sql, params);
    if (result instanceof Error) throw result;
    return result;
  });
  return {
    mockPoolQuery,
    setQueryHandler: (h: MockHandler) => { handler = h; },
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => ({
  pool: { query: mockPoolQuery },
}));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../middlewares/admin-guard.js', () => ({
  adminGuard: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

class PgError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function undefinedTableError(): PgError {
  // 42P01 = undefined_table. Mirrors what node-postgres throws when a query
  // references a relation that doesn't exist in the current schema.
  return new PgError('42P01', 'relation "domain_packs" does not exist');
}

const SEEDED_ROW = {
  slug: 'counsel',
  name: 'Counsel — Legal Matter Command',
  description: 'Governed decision intelligence for legal matter management.',
  industry: 'Legal',
  ui_shell_template: 'legal',
  lifecycle: 'active',
  activated_at: '2026-01-15T00:00:00Z',
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-04-20T00:00:00Z',
  pack_json: {
    slug: 'counsel',
    name: 'Counsel — Legal Matter Command',
    industry: 'Legal',
    constitution: [{ articleId: 'I', version: 'v4.2.0' }],
  },
};

// ---------------------------------------------------------------------------
// App under test
// ---------------------------------------------------------------------------

let app: express.Express;

beforeEach(async () => {
  mockPoolQuery.mockClear();
  setQueryHandler(() => ({ rows: [] }));
  const router = (await import('../routes/a11oy-vertical-orchestrator')).default;
  app = express();
  app.use(express.json());
  app.use('/api/a11oy/orchestrator', router);
});

// ---------------------------------------------------------------------------
// /packs
// ---------------------------------------------------------------------------

describe('GET /api/a11oy/orchestrator/packs', () => {
  it('returns 200 with the seeded packs when the registry is initialized', async () => {
    setQueryHandler((sql) => {
      if (sql.includes('FROM domain_packs')) return { rows: [SEEDED_ROW] };
      return { rows: [] };
    });

    const res = await request(app).get('/api/a11oy/orchestrator/packs');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.packs).toHaveLength(1);
    expect(res.body.data.packs[0].slug).toBe('counsel');
  });

  it('returns 200 with an empty list when domain_packs table is missing (42P01)', async () => {
    setQueryHandler(() => undefinedTableError());

    const res = await request(app).get('/api/a11oy/orchestrator/packs');

    // Regression guard for Task #5370: must NOT bubble up as 500.
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.packs).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it('still returns 500 INTERNAL_ERROR for unexpected DB faults', async () => {
    // A non-42P01 error (e.g. connection failure) is a real fault and must
    // still surface as 500 so monitoring can alert on it.
    setQueryHandler(() => new Error('connection terminated unexpectedly'));

    const res = await request(app).get('/api/a11oy/orchestrator/packs');

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// /status
// ---------------------------------------------------------------------------

describe('GET /api/a11oy/orchestrator/status', () => {
  it('returns 200 ready:true with pack counts when the registry is initialized', async () => {
    setQueryHandler((sql) => {
      if (sql.includes('to_regclass')) return { rows: [{ exists: true }] };
      if (sql.includes("FILTER (WHERE lifecycle = 'active')")) {
        return { rows: [{ active_packs: 6, draft_packs: 1, pending_packs: 2 }] };
      }
      if (sql.includes('approval_requests')) return { rows: [{ cnt: 3 }] };
      return { rows: [] };
    });

    const res = await request(app).get('/api/a11oy/orchestrator/status');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toMatchObject({
      ready: true,
      migrationsApplied: true,
      registryQueryable: true,
      activePacks: 6,
      draftPacks: 1,
      pendingPacks: 2,
      approvalQueuePending: 3,
    });
  });

  it('returns 200 ready:false when domain_packs table is missing (regression guard)', async () => {
    // Regression guard for Task #5370: must NOT bubble up as 503.
    setQueryHandler((sql) => {
      if (sql.includes('to_regclass')) return { rows: [{ exists: false }] };
      // Any further query should not be reached, but be defensive.
      return { rows: [] };
    });

    const res = await request(app).get('/api/a11oy/orchestrator/status');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toMatchObject({
      ready: false,
      migrationsApplied: false,
      registryQueryable: false,
      activePacks: 0,
      draftPacks: 0,
      pendingPacks: 0,
      approvalQueuePending: 0,
    });
  });

  it('still returns 503 NOT_READY when the readiness probe itself errors', async () => {
    // Connection-level failures must remain a hard outage signal.
    setQueryHandler(() => new Error('connection terminated unexpectedly'));

    const res = await request(app).get('/api/a11oy/orchestrator/status');

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('NOT_READY');
  });
});
