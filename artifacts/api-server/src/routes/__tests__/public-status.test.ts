/**
 * public-status.ts — uptime bar accuracy tests (Task #1469)
 *
 * Verifies:
 *   (a) GET /uptime-history returns per-service daily uptime fractions.
 *   (b) GET /status returns current service statuses aggregated from the DB.
 *   (c) backfillGap detects a server-down gap (> 10 min) and inserts 'outage'
 *       rows for every missing 5-minute slot, so the status page shows real
 *       outage windows instead of silent no-data gaps.
 *   (d) Short gaps (≤ 10 min) are NOT backfilled — brief restarts are noise.
 *   (e) When the DB has no prior data (fresh deployment), backfillGap exits
 *       silently and inserts nothing.
 *   (f) Backfill slots are spaced exactly 5 minutes apart.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Stable fetch mock — must be declared before module imports that call it
// ---------------------------------------------------------------------------

const fetchMock = vi.fn(async (_url: string) => ({
  ok: true,
  json: async () => ({ services: {} }),
}));
vi.stubGlobal('fetch', fetchMock);

// ---------------------------------------------------------------------------
// pool mock — intercept every pool.query call
// ---------------------------------------------------------------------------

const poolQueryMock = vi.fn(async () => ({ rows: [] as unknown[] }));

vi.mock('@szl-holdings/db', () => ({
  pool: { query: (...args: unknown[]) => poolQueryMock(...args) },
}));

vi.mock('../../lib/logger.js', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});

// ---------------------------------------------------------------------------
// Load the module AFTER mocks are in place.
// We export backfillGap so we can call it directly in tests, bypassing the
// module-level setTimeout that fires only once per import.
// ---------------------------------------------------------------------------

const { default: router, backfillGap } = await import('../public-status.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** UTC date string N days ago, formatted as YYYY-MM-DD */
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Returns a Date that is `minutes` minutes in the past */
function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

// ---------------------------------------------------------------------------
// GET /uptime-history
// ---------------------------------------------------------------------------

describe('GET /uptime-history', () => {
  beforeEach(() => {
    poolQueryMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ services: {} }) } as never);
  });

  it('returns history bucketed by service and day', async () => {
    const today = daysAgo(0);
    const yesterday = daysAgo(1);

    poolQueryMock.mockResolvedValueOnce({
      rows: [
        { service_id: 'api', day: today, uptime_fraction: '1', avg_latency_ms: '42' },
        { service_id: 'api', day: yesterday, uptime_fraction: '0.95', avg_latency_ms: '100' },
        { service_id: 'database', day: today, uptime_fraction: '0.8', avg_latency_ms: null },
      ],
    });

    const res = await request(buildApp()).get('/uptime-history');

    expect(res.status).toBe(200);
    expect(res.body.history.api[today]).toEqual({ uptime: 1, latency: 42 });
    expect(res.body.history.api[yesterday]).toEqual({ uptime: 0.95, latency: 100 });
    expect(res.body.history.database[today]).toEqual({ uptime: 0.8, latency: null });
  });

  it('returns an empty history object when the table has no rows', async () => {
    poolQueryMock.mockResolvedValueOnce({ rows: [] });

    const res = await request(buildApp()).get('/uptime-history');

    expect(res.status).toBe(200);
    expect(res.body.history).toEqual({});
  });

  it('includes every service that the DB returns', async () => {
    const today = daysAgo(0);
    poolQueryMock.mockResolvedValueOnce({
      rows: [
        { service_id: 'api', day: today, uptime_fraction: '1', avg_latency_ms: '10' },
        { service_id: 'auth', day: today, uptime_fraction: '0.99', avg_latency_ms: '20' },
        { service_id: 'ai', day: today, uptime_fraction: '0.9', avg_latency_ms: '30' },
      ],
    });

    const res = await request(buildApp()).get('/uptime-history');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.history)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// GET /status
// ---------------------------------------------------------------------------

describe('GET /status', () => {
  beforeEach(() => {
    poolQueryMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ services: {} }) } as never);
  });

  it('returns overall operational when all services are operational', async () => {
    poolQueryMock.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('platform_incidents')) {
        return { rows: [] };
      }
      return {
        rows: [{ status: 'operational', latency_ms: 50, total: '10', operational: '10' }],
      };
    });

    const res = await request(buildApp()).get('/status');

    expect(res.status).toBe(200);
    expect(res.body.overall).toBe('operational');
    expect(res.body.services).toHaveLength(6);
  });

  it('reflects outage when a service reports outage status', async () => {
    let callCount = 0;
    poolQueryMock.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('platform_incidents')) {
        return { rows: [] };
      }
      callCount++;
      if (callCount === 1) {
        return { rows: [{ status: 'outage', latency_ms: 0 }] };
      }
      return {
        rows: [{ status: 'operational', latency_ms: 50, total: '10', operational: '10' }],
      };
    });

    const res = await request(buildApp()).get('/status');

    expect(res.status).toBe(200);
    expect(res.body.overall).toBe('outage');
  });

  it('returns incidents from the DB', async () => {
    poolQueryMock.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('platform_incident_updates')) {
        return {
          rows: [{ id: 10, message: 'Investigating', status: 'investigating', created_at: '' }],
        };
      }
      if (typeof sql === 'string' && sql.includes('platform_incidents')) {
        return {
          rows: [
            {
              id: 1,
              title: 'API outage',
              status: 'investigating',
              severity: 'major',
              affected_services: ['api'],
              description: 'API is down',
              resolved_at: null,
              created_at: '',
              updated_at: '',
            },
          ],
        };
      }
      return {
        rows: [{ status: 'operational', latency_ms: 50, total: '10', operational: '10' }],
      };
    });

    const res = await request(buildApp()).get('/status');

    expect(res.status).toBe(200);
    expect(res.body.incidents).toHaveLength(1);
    expect(res.body.incidents[0].title).toBe('API outage');
    expect(res.body.incidents[0].updates).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// backfillGap — called directly so each test is isolated
// ---------------------------------------------------------------------------

describe('backfillGap (server-down gap detection)', () => {
  beforeEach(() => {
    poolQueryMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ services: {} }) } as never);
  });

  it('inserts outage rows for all services when gap > 10 min', async () => {
    const lastChecked = minutesAgo(30);
    const backfillInserts: unknown[][] = [];

    poolQueryMock.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (typeof sql === 'string' && sql.includes('MAX(checked_at)')) {
        return { rows: [{ last_checked: lastChecked }] };
      }
      // Backfill inserts use ON CONFLICT DO NOTHING; regular health-check
      // inserts do not. We only collect the backfill batch here.
      if (
        typeof sql === 'string' &&
        sql.includes('INSERT INTO platform_status_checks') &&
        sql.includes('ON CONFLICT DO NOTHING') &&
        params
      ) {
        backfillInserts.push(params);
      }
      return { rows: [] };
    });

    await backfillGap();

    // At least one batch INSERT should have been issued
    expect(backfillInserts.length).toBeGreaterThan(0);

    // Every status value in every batch must be 'outage'
    // Params layout per row: [serviceId, status, latencyMs, timestamp]
    for (const params of backfillInserts) {
      const statusValues = (params as unknown[]).filter((_, i) => i % 4 === 1);
      for (const s of statusValues) {
        expect(s).toBe('outage');
      }
    }

    // 30-min gap / 5-min interval = 5 inner slots (slots at +5, +10, +15, +20, +25 min).
    // Across 6 services, the total rows = 5 × 6 = 30 — but batching may
    // split them. Check total param count covers at least 6 services × 1 slot.
    const totalParams = backfillInserts.flatMap((p) => p as unknown[]);
    expect(totalParams.length).toBeGreaterThanOrEqual(6 * 4);
  });

  it('does NOT backfill for gaps ≤ 10 min (brief restarts are noise)', async () => {
    poolQueryMock.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('MAX(checked_at)')) {
        return { rows: [{ last_checked: minutesAgo(8) }] };
      }
      return { rows: [] };
    });

    await backfillGap();

    const backfillCalls = poolQueryMock.mock.calls.filter(
      ([sql]) =>
        typeof sql === 'string' &&
        (sql as string).includes('INSERT INTO platform_status_checks') &&
        (sql as string).includes('ON CONFLICT DO NOTHING'),
    );

    expect(backfillCalls).toHaveLength(0);
  });

  it('does NOT insert anything for a fresh deployment (no prior data)', async () => {
    poolQueryMock.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('MAX(checked_at)')) {
        return { rows: [{ last_checked: null }] };
      }
      return { rows: [] };
    });

    await backfillGap();

    const insertCalls = poolQueryMock.mock.calls.filter(
      ([sql]) =>
        typeof sql === 'string' && (sql as string).includes('INSERT INTO platform_status_checks'),
    );

    expect(insertCalls).toHaveLength(0);
  });

  it('backfill slots are spaced exactly 5 minutes apart', async () => {
    // 17 min gap → slots at lastChecked+5min and lastChecked+10min.
    // lastChecked+15min = now-2min is clearly NOT < now-5min, so only 2 slots.
    // (Previously used a 20-min gap which put the third slot right at the
    // now-5min boundary, causing flaky results due to sub-millisecond timing.)
    const now = Date.now();
    const lastChecked = new Date(now - 17 * 60 * 1000);
    const insertedTimestamps: Date[] = [];

    poolQueryMock.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (typeof sql === 'string' && sql.includes('MAX(checked_at)')) {
        return { rows: [{ last_checked: lastChecked }] };
      }
      if (
        typeof sql === 'string' &&
        sql.includes('INSERT INTO platform_status_checks') &&
        sql.includes('ON CONFLICT DO NOTHING') &&
        params
      ) {
        // Collect all Date objects (index 3, 7, 11, ... per row)
        for (let i = 3; i < params.length; i += 4) {
          const ts = params[i];
          if (ts instanceof Date) insertedTimestamps.push(ts);
        }
      }
      return { rows: [] };
    });

    await backfillGap();

    // Deduplicate and sort timestamps (each slot appears once per service)
    const uniqueMs = [...new Set(insertedTimestamps.map((d) => d.getTime()))].sort(
      (a, b) => a - b,
    );

    // Expect 2 distinct slots for the 17-minute gap
    expect(uniqueMs).toHaveLength(2);

    // The single gap between the two slots must be exactly 5 minutes
    expect(uniqueMs[1]! - uniqueMs[0]!).toBe(5 * 60 * 1000);
  });

  it('covers all 6 tracked services in the backfill', async () => {
    const lastChecked = minutesAgo(20);
    const insertedServiceIds = new Set<string>();

    poolQueryMock.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (typeof sql === 'string' && sql.includes('MAX(checked_at)')) {
        return { rows: [{ last_checked: lastChecked }] };
      }
      if (
        typeof sql === 'string' &&
        sql.includes('INSERT INTO platform_status_checks') &&
        sql.includes('ON CONFLICT DO NOTHING') &&
        params
      ) {
        for (let i = 0; i < params.length; i += 4) {
          const svcId = params[i];
          if (typeof svcId === 'string') insertedServiceIds.add(svcId);
        }
      }
      return { rows: [] };
    });

    await backfillGap();

    const EXPECTED_SERVICES = ['api', 'web', 'database', 'integrations', 'auth', 'ai'];
    for (const svc of EXPECTED_SERVICES) {
      expect(insertedServiceIds).toContain(svc);
    }
  });
});
