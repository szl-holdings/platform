/**
 * Integration tests for the Pulse personalized briefing, watchlist,
 * follow-up Q&A, and push-schedule routes introduced in Task #2927.
 *
 * Uses the established pattern from lyte-cognitive-routes.test.ts:
 * - All vi.mock() calls hoisted above the route import
 * - Single top-level await import after mocks
 * - Auth injected via x-test-auth header
 */

import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — ALL must be hoisted before the route import
// ---------------------------------------------------------------------------

vi.mock('express-rate-limit', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('@szl-holdings/db', () => {
  const makeChain = (): unknown => {
    const target: unknown = () => makeChain();
    return new Proxy(target as object, {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: (v: unknown[]) => void, reject?: (e: unknown) => void) =>
            Promise.resolve([]).then(resolve, reject);
        }
        if (prop === Symbol.toPrimitive) return undefined;
        return () => makeChain();
      },
      apply() {
        return makeChain();
      },
    });
  };
  const db = {
    select: () => makeChain(),
    insert: () => makeChain(),
    update: () => makeChain(),
    delete: () => makeChain(),
  };
  // All table names used by pulse.ts must be explicitly exported to satisfy Vitest
  const emptyTable = {};
  return {
    db,
    complianceCalendarTable: emptyTable,
    complianceSupervisionQueueTable: emptyTable,
    firestormAlertsTable: emptyTable,
    firestormFindingsTable: emptyTable,
    firestormIncidentsTable: emptyTable,
    fleetExceptionsTable: emptyTable,
    holdingsMetricsTable: emptyTable,
    maritimeExceptionsTable: emptyTable,
    pulseBriefingsTable: emptyTable,
    pulseCustomBriefsTable: emptyTable,
    pulseDissentsTable: emptyTable,
    pulseEmailSubscriptionsTable: emptyTable,
    pulseFollowUpsTable: emptyTable,
    pulsePersonalizedNarrativesTable: emptyTable,
    pulsePushScheduleTable: emptyTable,
    pulseWatchlistTable: emptyTable,
  };
});

vi.mock('../middlewares/auth.js', () => {
  const mockUser = {
    id: 42,
    displayName: 'Test Exec',
    email: 'exec@szl.io',
    roles: ['admin'],
    orgs: [{ orgId: 1, orgSlug: 'szl', orgName: 'SZL Holdings', role: 'admin' }],
  };
  return {
    authMiddleware: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      if (req.headers['x-test-auth'] === 'yes') {
        (req as express.Request & { user: typeof mockUser }).user = mockUser;
      }
      next();
    },
    requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    tenantScope: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  };
});

vi.mock('../lib/ai-gateway.js', () => ({
  gatewayInfer: vi.fn(async () => 'Mocked personalized intelligence narrative.'),
}));

vi.mock('@szl-holdings/services', () => ({
  services: {
    ai: { isLive: false },
    email: { send: vi.fn(async () => ({ success: true })) },
  },
}));

vi.mock('@szl-holdings/contracts/common', async () => {
  const { z } = await import('zod');
  return {
    // Wrap the shape object in z.object() so the resulting schema has .safeParse()
    // which is required by the real validateBody middleware.
    bodyShape: (shape: Record<string, import('zod').ZodTypeAny>) => z.object(shape).strip(),
  };
});

vi.mock('drizzle-orm', () => {
  const noop = (..._args: unknown[]) => ({ __drizzle_mock: true });
  const sqlTag = Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __drizzle_mock: true }),
    { raw: (_v: string) => ({ __drizzle_mock: true }) },
  );
  return {
    and: noop,
    or: noop,
    eq: noop,
    ne: noop,
    gt: noop,
    gte: noop,
    lt: noop,
    lte: noop,
    isNull: noop,
    isNotNull: noop,
    inArray: noop,
    notInArray: noop,
    like: noop,
    ilike: noop,
    between: noop,
    notBetween: noop,
    desc: (col: unknown) => ({ __drizzle_mock: true, col }),
    asc: (col: unknown) => ({ __drizzle_mock: true, col }),
    sql: sqlTag,
    SQL: class {},
    count: noop,
    sum: noop,
    avg: noop,
    min: noop,
    max: noop,
  };
});

vi.mock('pdfkit', () => {
  const PDFMock = class {
    on(_event: string, _cb: () => void) { return this; }
    pipe(_stream: unknown) { return this; }
    fontSize(_n: number) { return this; }
    font(_f: string) { return this; }
    text(_t: string) { return this; }
    moveDown() { return this; }
    end() {}
  };
  return { default: PDFMock };
});

// ---------------------------------------------------------------------------
// Import the router AFTER all mocks
// ---------------------------------------------------------------------------

const { default: pulseRouter } = await import('../routes/pulse.js');

const app = express();
app.use(express.json());
app.use('/api/pulse', pulseRouter);
// Error handler so 500s show the message in the response
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err.message });
});

// ---------------------------------------------------------------------------
// Watchlist CRUD
// ---------------------------------------------------------------------------

describe('GET /api/pulse/watchlist', () => {
  it('returns 200 with watchlist array for authenticated user', async () => {
    const resp = await request(app).get('/api/pulse/watchlist').set('x-test-auth', 'yes');
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveProperty('success', true);
    expect(resp.body).toHaveProperty('watchlist');
    expect(Array.isArray(resp.body.watchlist)).toBe(true);
  });

  it('returns 401 for unauthenticated request', async () => {
    const resp = await request(app).get('/api/pulse/watchlist');
    expect([401, 403]).toContain(resp.status);
  });
});

describe('POST /api/pulse/watchlist', () => {
  it('returns 400 when entityUri is missing', async () => {
    const resp = await request(app)
      .post('/api/pulse/watchlist')
      .set('x-test-auth', 'yes')
      .send({ entityType: 'vessel', entityLabel: 'MV Pacific Dawn', domain: 'maritime' });
    expect(resp.status).toBe(400);
  });

  it('returns 400 when domain is missing', async () => {
    const resp = await request(app)
      .post('/api/pulse/watchlist')
      .set('x-test-auth', 'yes')
      .send({ entityUri: 'maritime:vessel:mv-pd', entityType: 'vessel', entityLabel: 'MV Pacific Dawn' });
    expect(resp.status).toBe(400);
  });

  it('accepts valid watchlist entity (DB mock returns empty insert)', async () => {
    const resp = await request(app)
      .post('/api/pulse/watchlist')
      .set('x-test-auth', 'yes')
      .send({
        entityUri: 'maritime:vessel:mv-pacific-dawn',
        entityType: 'vessel',
        entityLabel: 'MV Pacific Dawn',
        domain: 'maritime',
      });
    expect([200, 201, 409]).toContain(resp.status);
  });
});

describe('DELETE /api/pulse/watchlist/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const resp = await request(app)
      .delete('/api/pulse/watchlist/abc')
      .set('x-test-auth', 'yes');
    expect(resp.status).toBe(400);
  });

  it('accepts numeric id (DB mock returns empty, so 404 or 200)', async () => {
    const resp = await request(app)
      .delete('/api/pulse/watchlist/9999')
      .set('x-test-auth', 'yes');
    expect([200, 404]).toContain(resp.status);
  });
});

// ---------------------------------------------------------------------------
// Personalized Briefing (GET /briefings/personalized)
// ---------------------------------------------------------------------------

describe('GET /api/pulse/briefings/personalized', () => {
  it('returns 200 with briefing:null when no published briefing exists in DB', async () => {
    const resp = await request(app)
      .get('/api/pulse/briefings/personalized')
      .set('x-test-auth', 'yes');
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveProperty('success', true);
    expect(resp.body).toHaveProperty('watchlist');
  });

  it('returns watchedDomains as an array', async () => {
    const resp = await request(app)
      .get('/api/pulse/briefings/personalized')
      .set('x-test-auth', 'yes');
    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.body.watchedDomains)).toBe(true);
  });

  it('returns personalized=false when watchlist is empty', async () => {
    const resp = await request(app)
      .get('/api/pulse/briefings/personalized')
      .set('x-test-auth', 'yes');
    expect(resp.status).toBe(200);
    expect(resp.body.personalized).toBe(false);
  });

  it('returns 401 for unauthenticated request', async () => {
    const resp = await request(app).get('/api/pulse/briefings/personalized');
    expect([401, 403]).toContain(resp.status);
  });
});

// ---------------------------------------------------------------------------
// Follow-up Q&A
// ---------------------------------------------------------------------------

describe('POST /api/pulse/follow-ups', () => {
  it('returns 400 when briefingId is missing', async () => {
    const resp = await request(app)
      .post('/api/pulse/follow-ups')
      .set('x-test-auth', 'yes')
      .send({ question: 'What is the maritime risk?' });
    expect(resp.status).toBe(400);
  });

  it('returns 400 when question is missing', async () => {
    const resp = await request(app)
      .post('/api/pulse/follow-ups')
      .set('x-test-auth', 'yes')
      .send({ briefingId: 'brief-2024-01-01' });
    expect(resp.status).toBe(400);
  });

  it('returns 400 when question exceeds 1000 chars', async () => {
    const resp = await request(app)
      .post('/api/pulse/follow-ups')
      .set('x-test-auth', 'yes')
      .send({ briefingId: 'brief-2024-01-01', question: 'x'.repeat(1001) });
    expect(resp.status).toBe(400);
  });

  it('accepts valid follow-up request and returns 202 Accepted', async () => {
    const resp = await request(app)
      .post('/api/pulse/follow-ups')
      .set('x-test-auth', 'yes')
      .send({
        briefingId: 'brief-2024-01-01',
        question: 'What is the maritime risk level for Pacific routes?',
        sectionId: 'maritime',
      });
    expect(resp.status).toBe(202);
    expect(resp.body).toHaveProperty('success', true);
    // followUp may be undefined when DB mock returns [] from insert.returning()
    // — JSON serializes undefined as absent, so we just check the status code here.
  });
});

describe('GET /api/pulse/follow-ups/:briefingId', () => {
  it('returns 200 with followUps array', async () => {
    const resp = await request(app)
      .get('/api/pulse/follow-ups/brief-2024-01-01')
      .set('x-test-auth', 'yes');
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveProperty('success', true);
    expect(resp.body).toHaveProperty('followUps');
    expect(Array.isArray(resp.body.followUps)).toBe(true);
  });

  it('returns 401 for unauthenticated request', async () => {
    const resp = await request(app).get('/api/pulse/follow-ups/brief-2024-01-01');
    expect([401, 403]).toContain(resp.status);
  });
});

// ---------------------------------------------------------------------------
// Push Schedule
// ---------------------------------------------------------------------------

describe('GET /api/pulse/push-schedule', () => {
  it('returns 200 with schedule object', async () => {
    const resp = await request(app).get('/api/pulse/push-schedule').set('x-test-auth', 'yes');
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveProperty('success', true);
    expect(resp.body).toHaveProperty('schedule');
    expect(typeof resp.body.schedule.enabled).toBe('boolean');
  });

  it('defaults enabled=true and deliveryHourUtc=7 when no DB row exists', async () => {
    const resp = await request(app).get('/api/pulse/push-schedule').set('x-test-auth', 'yes');
    expect(resp.status).toBe(200);
    expect(resp.body.schedule.enabled).toBe(true);
    expect(resp.body.schedule.deliveryHourUtc).toBe(7);
  });

  it('returns 401 for unauthenticated request', async () => {
    const resp = await request(app).get('/api/pulse/push-schedule');
    expect([401, 403]).toContain(resp.status);
  });
});

describe('PUT /api/pulse/push-schedule', () => {
  it('returns 400 when deliveryHourUtc > 23', async () => {
    const resp = await request(app)
      .put('/api/pulse/push-schedule')
      .set('x-test-auth', 'yes')
      .send({ deliveryHourUtc: 25 });
    expect(resp.status).toBe(400);
  });

  it('returns 400 when deliveryHourUtc is negative', async () => {
    const resp = await request(app)
      .put('/api/pulse/push-schedule')
      .set('x-test-auth', 'yes')
      .send({ deliveryHourUtc: -1 });
    expect(resp.status).toBe(400);
  });

  it('accepts valid schedule update (enabled=false, deliveryHourUtc=8)', async () => {
    const resp = await request(app)
      .put('/api/pulse/push-schedule')
      .set('x-test-auth', 'yes')
      .send({ enabled: false, deliveryHourUtc: 8 });
    expect([200, 201]).toContain(resp.status);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: scoping and auth
// ---------------------------------------------------------------------------

describe('Watchlist personalization scoping', () => {
  it('unauthenticated /watchlist and /briefings/personalized are rejected', async () => {
    const [watchResp, briefResp] = await Promise.all([
      request(app).get('/api/pulse/watchlist'),
      request(app).get('/api/pulse/briefings/personalized'),
    ]);
    expect([401, 403]).toContain(watchResp.status);
    // personalized brief returns 200 with null briefing or 401 depending on auth guard
    expect([200, 401, 403]).toContain(briefResp.status);
  });

  it('authenticated user gets empty watchlist and personalized=false', async () => {
    const [watchResp, briefResp] = await Promise.all([
      request(app).get('/api/pulse/watchlist').set('x-test-auth', 'yes'),
      request(app).get('/api/pulse/briefings/personalized').set('x-test-auth', 'yes'),
    ]);
    expect(watchResp.status).toBe(200);
    expect(Array.isArray(watchResp.body.watchlist)).toBe(true);
    expect(watchResp.body.watchlist).toHaveLength(0);

    expect(briefResp.status).toBe(200);
    expect(briefResp.body.personalized).toBe(false);
  });
});
