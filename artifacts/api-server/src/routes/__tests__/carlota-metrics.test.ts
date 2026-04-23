/**
 * Carlota Jo — Public Metrics Endpoints
 *
 * Covers:
 *   (a) GET /booking/team
 *       — seeds the team from SEED_TEAM when the table is empty and returns rows.
 *       — does NOT re-seed when rows already exist.
 *   (b) GET /booking/engagements-summary
 *       — seeds `eng-seed-*` rows when none are present, even when real engagements exist.
 *       — returns ONLY rows with `external_id LIKE 'eng-seed-%'` (no real-org data leakage).
 *       — does NOT re-seed when `eng-seed-*` rows already exist.
 *   (c) Both endpoints require no auth token (public routes).
 *   (d) DB error returns 500.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Table identity stubs ──────────────────────────────────────────────────────

const carlotaTeamMembersTable = { __t: 'carlotaTeamMembersTable', id: 'id' };
const carlotaEngagementsTable = { __t: 'carlotaEngagementsTable', externalId: 'externalId' };

// ── Mutable state shared across tests ────────────────────────────────────────

let teamRowsInDb: unknown[] = [];
let engRowsInDb: unknown[] = [];
let teamCountInDb = 0;
let seedEngCountInDb = 0;

const insertedTeam: unknown[][] = [];
const insertedEngagements: unknown[][] = [];

function resetState() {
  teamRowsInDb = [];
  engRowsInDb = [];
  teamCountInDb = 0;
  seedEngCountInDb = 0;
  insertedTeam.length = 0;
  insertedEngagements.length = 0;
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@szl-holdings/db', () => {
  // Build a chainable select that handles:
  //   db.select().from(t)                             → resolves count row for team
  //   db.select().from(t).orderBy(...)                → resolves team rows
  //   db.select().from(t).where(...)                  → resolves count row for engagements
  //   db.select().from(t).where(...).orderBy(...)     → resolves engagement rows
  function makeChain(isTeamTable: boolean) {
    const countRow = isTeamTable ? [{ count: teamCountInDb }] : [{ count: seedEngCountInDb }];
    const dataRows = isTeamTable ? teamRowsInDb : engRowsInDb;

    return {
      // For queries with no WHERE (team count & data)
      orderBy: (_col: unknown) => Promise.resolve(dataRows),
      then: (r: (v: unknown) => unknown) => Promise.resolve(countRow).then(r),
      // For queries with WHERE (eng count & data)
      where: (_cond: unknown) => ({
        orderBy: (_col: unknown) => Promise.resolve(engRowsInDb),
        then: (r: (v: unknown) => unknown) =>
          Promise.resolve([{ count: seedEngCountInDb }]).then(r),
      }),
    };
  }

  return {
    db: {
      select: () => ({
        from: (table: unknown) => makeChain(table === carlotaTeamMembersTable),
      }),
      insert: (table: unknown) => ({
        values: (values: unknown) => ({
          onConflictDoNothing: () => {
            if (table === carlotaTeamMembersTable) {
              insertedTeam.push(values as unknown[]);
            } else {
              insertedEngagements.push(values as unknown[]);
            }
            return Promise.resolve();
          },
        }),
      }),
    },
    carlotaTeamMembersTable,
    carlotaEngagementsTable,
  };
});

vi.mock('drizzle-orm', () => {
  const noop = (..._a: unknown[]) => ({});
  return {
    eq: noop,
    and: noop,
    desc: noop,
    like: noop,
    sql: Object.assign(noop, { raw: noop }),
  };
});

vi.mock('../../lib/logger.js', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});
vi.mock('../../lib/logger', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});

// ── App fixture (built once) ──────────────────────────────────────────────────

async function buildApp() {
  const { default: router } = await import('../carlota-metrics.js');
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/booking/team', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetState();
    app = await buildApp();
  });

  it('seeds from SEED_TEAM when table is empty and returns rows', async () => {
    teamCountInDb = 0;
    teamRowsInDb = [{ id: 'm1', name: 'Carlota Jo', utilisation: 90, status: 'optimal' }];

    const res = await request(app).get('/api/booking/team');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(insertedTeam.length).toBe(1);
  });

  it('does not re-seed when rows already exist', async () => {
    teamCountInDb = 3;
    teamRowsInDb = [
      { id: 'm1', name: 'Carlota Jo', utilisation: 90, status: 'optimal' },
      { id: 'm2', name: 'James Webb', utilisation: 70, status: 'under' },
    ];

    const res = await request(app).get('/api/booking/team');

    expect(res.status).toBe(200);
    expect(insertedTeam.length).toBe(0);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /api/booking/engagements-summary', () => {
  let app: express.Express;

  const SEED_ENG = {
    externalId: 'eng-seed-e1',
    client: 'Luminary Brands',
    engagement: 'Growth Strategy Phase 2',
    status: 'active',
    feeType: 'fixed',
    contractedValue: '84000',
    invoiced: '42000',
    collected: '42000',
    costToDate: '38000',
    forecastedCost: '76000',
    marginTarget: 45,
    phase: 'Phase 2 — Delivery',
    rateRealisationPct: 94,
    writeOffs: '0',
    scopeCreepHours: 0,
    startDate: 'Jan 2026',
    endDate: 'Jun 2026',
    alerts: [],
  };

  beforeEach(async () => {
    resetState();
    app = await buildApp();
  });

  it('seeds eng-seed-* rows when none exist and returns them', async () => {
    seedEngCountInDb = 0;
    engRowsInDb = [SEED_ENG];

    const res = await request(app).get('/api/booking/engagements-summary');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(insertedEngagements.length).toBe(1);
  });

  it('does not re-seed when eng-seed-* rows already exist', async () => {
    seedEngCountInDb = 4;
    engRowsInDb = [SEED_ENG];

    const res = await request(app).get('/api/booking/engagements-summary');

    expect(res.status).toBe(200);
    expect(insertedEngagements.length).toBe(0);
    expect(res.body.data[0].id).toBe('eng-seed-e1');
  });

  it('seeds eng-seed-* rows even when real non-seed engagements exist', async () => {
    // seedEngCountInDb = 0 (no seed rows), but the table may have real org data
    seedEngCountInDb = 0;
    engRowsInDb = [SEED_ENG];

    const res = await request(app).get('/api/booking/engagements-summary');

    expect(res.status).toBe(200);
    expect(insertedEngagements.length).toBe(1);
    const ids: string[] = (res.body.data as { id: string }[]).map((e) => e.id);
    expect(ids.every((id) => id.startsWith('eng-seed-'))).toBe(true);
  });
});
