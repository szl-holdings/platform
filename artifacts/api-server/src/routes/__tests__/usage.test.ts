/**
 * Usage Dashboard Integration Tests
 *
 * Coverage:
 *  - GET  /orgs/:orgSlug/usage         — summary with seeded usage data, RBAC
 *  - GET  /orgs/:orgSlug/usage/history — time-series with seeded data
 *  - POST /orgs/:orgSlug/usage/events  — record usage event (validation, RBAC)
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mutable state
// ---------------------------------------------------------------------------

let _currentUser = makeAdminUser();

function makeAdminUser() {
  return {
    id: 10,
    displayName: 'Admin Alice',
    email: 'alice@test.example',
    roles: ['admin'],
    orgs: [{ orgId: 5, orgSlug: 'acme-corp', orgName: 'Acme Corp', role: 'admin' }],
  };
}

function makeOutsiderUser() {
  return {
    id: 99,
    displayName: 'Outsider Oscar',
    email: 'oscar@other.example',
    roles: ['member'],
    orgs: [],
  };
}

let _selectQueue: unknown[][] = [];
let _insertReturnQueue: unknown[][] = [];
let _poolQueryQueue: { rows: unknown[] }[] = [];

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  const col = (name: string) => ({ _colName: name });

  const poolMock = {
    query: vi.fn(() => {
      const next = _poolQueryQueue.shift();
      return Promise.resolve(next ?? { rows: [] });
    }),
  };

  return {
    db: {
      select(_fields?: unknown) {
        const result = (_selectQueue.shift() ?? []) as unknown[];
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: () => chain,
          innerJoin: () => chain,
          orderBy: () => chain,
          groupBy: () => chain,
          limit: () => Promise.resolve(result),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
        };
        return chain;
      },
      insert(_table: unknown) {
        return {
          values: (_vals: unknown) => ({
            returning: () => Promise.resolve(_insertReturnQueue.shift() ?? []),
          }),
        };
      },
    },
    pool: poolMock,
    organizationsTable: {
      id: col('id'),
      name: col('name'),
      slug: col('slug'),
      plan: col('plan'),
      isActive: col('is_active'),
    },
    orgMembersTable: {
      id: col('id'),
      orgId: col('org_id'),
      userId: col('user_id'),
      role: col('role'),
    },
    usageEventsTable: {
      id: col('id'),
      orgId: col('org_id'),
      featureKey: col('feature_key'),
      quantity: col('quantity'),
      metadata: col('metadata'),
      recordedAt: col('recorded_at'),
    },
    usersTable: {
      id: col('id'),
      isActive: col('is_active'),
      lastLoginAt: col('last_login_at'),
    },
    sessionsTable: {
      id: col('id'),
      orgId: col('org_id'),
      userId: col('user_id'),
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  lte: (col: unknown, val: unknown) => ({ op: 'lte', col, val }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ op: 'sql', strings, values }),
    { raw: (s: string) => s },
  ),
  count: () => ({ op: 'count' }),
  sum: (col: unknown) => ({ op: 'sum', col }),
  inArray: (col: unknown, vals: unknown) => ({ op: 'inArray', col, vals }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = _currentUser;
    next();
  },
}));

vi.mock('../../middlewares/rate-limiters', () => ({
  writeLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  readLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// App builder
// ---------------------------------------------------------------------------

let _app: express.Application | null = null;

async function getApp(): Promise<express.Application> {
  if (_app) return _app;
  const { default: usageRouter } = await import('../usage.js');
  _app = express();
  _app.use(express.json());
  _app.use(usageRouter);
  return _app;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG = {
  id: 5,
  name: 'Acme Corp',
  slug: 'acme-corp',
  plan: 'professional',
  isActive: true,
};

const MEMBERSHIP = {
  id: 1,
  orgId: 5,
  userId: 10,
  role: 'admin',
};

// Seeded usage event rows
function featureRows(overrides: unknown[] = []) {
  const defaults = [
    { featureKey: 'api.query', totalQuantity: 150, eventCount: 30 },
    { featureKey: 'api.export', totalQuantity: 20, eventCount: 5 },
    { featureKey: 'dashboard.view', totalQuantity: 200, eventCount: 200 },
  ];
  return overrides.length > 0 ? overrides : defaults;
}

// ---------------------------------------------------------------------------
// GET /orgs/:orgSlug/usage — usage summary
// ---------------------------------------------------------------------------

describe('GET /orgs/:orgSlug/usage — usage summary with seeded data', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _poolQueryQueue = [];
    _currentUser = makeAdminUser();
  });

  it('returns a well-structured summary with member counts and feature utilization', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP], [{ count: 4 }], [{ count: 2 }], featureRows()];
    _poolQueryQueue = [{ rows: [{ total: 1048576 }] }];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage');

    expect(res.status).toBe(200);
    expect(res.body.org.slug).toBe('acme-corp');
    expect(res.body.summary.totalMembers).toBe(4);
    expect(res.body.summary.activeUsers).toBe(2);
    expect(res.body.summary.apiCalls).toBe(170);
    expect(res.body.summary.storageMB).toBe(1);
    expect(Array.isArray(res.body.featureUtilization)).toBe(true);
    expect(res.body.featureUtilization).toHaveLength(3);
    expect(res.body.period.from).toBeDefined();
    expect(res.body.period.to).toBeDefined();
  });

  it('returns zero apiCalls when there are no api.* events', async () => {
    _selectQueue = [
      [ORG],
      [MEMBERSHIP],
      [{ count: 2 }],
      [{ count: 1 }],
      [{ featureKey: 'dashboard.view', totalQuantity: 50, eventCount: 50 }],
    ];
    _poolQueryQueue = [{ rows: [{ total: 0 }] }];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage');

    expect(res.status).toBe(200);
    expect(res.body.summary.apiCalls).toBe(0);
  });

  it('returns empty featureUtilization when no usage events recorded', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP], [{ count: 1 }], [{ count: 0 }], []];
    _poolQueryQueue = [{ rows: [{ total: 0 }] }];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage');

    expect(res.status).toBe(200);
    expect(res.body.featureUtilization).toHaveLength(0);
    expect(res.body.summary.apiCalls).toBe(0);
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).get('/orgs/ghost-org/usage');

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not an org member', async () => {
    _currentUser = makeOutsiderUser();
    _selectQueue = [[ORG], []];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage');

    expect(res.status).toBe(403);
  });

  it('accepts optional from/to query params without error', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP], [{ count: 3 }], [{ count: 1 }], featureRows()];
    _poolQueryQueue = [{ rows: [{ total: 512000 }] }];

    const app = await getApp();
    const res = await request(app).get(
      '/orgs/acme-corp/usage?from=2026-01-01T00:00:00Z&to=2026-04-01T00:00:00Z',
    );

    expect(res.status).toBe(200);
    expect(res.body.period.from).toContain('2026-01-01');
  });

  it('marks storageDataAvailable as false when files table query fails', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP], [{ count: 2 }], [{ count: 1 }], []];
    _poolQueryQueue = [{ rows: [] }];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage');

    expect(res.status).toBe(200);
    expect(res.body.summary.storageDataAvailable).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /orgs/:orgSlug/usage/history — time-series data
// ---------------------------------------------------------------------------

describe('GET /orgs/:orgSlug/usage/history — time-series with seeded data', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _poolQueryQueue = [];
    _currentUser = makeAdminUser();
  });

  it('returns usageByDay and activeUsersByDay arrays', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: [
          { date: '2026-04-16', feature_key: 'api.query', total_quantity: 50, event_count: 10 },
          {
            date: '2026-04-15',
            feature_key: 'dashboard.view',
            total_quantity: 80,
            event_count: 80,
          },
        ],
      },
      {
        rows: [
          { date: '2026-04-16', active_users: 3 },
          { date: '2026-04-15', active_users: 2 },
        ],
      },
    ];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage/history');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.usageByDay)).toBe(true);
    expect(Array.isArray(res.body.activeUsersByDay)).toBe(true);
    expect(res.body.usageByDay).toHaveLength(2);
    expect(res.body.activeUsersByDay).toHaveLength(2);
    expect(res.body.period.days).toBe(30);
  });

  it('accepts a custom days param (up to 90)', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP]];
    _poolQueryQueue = [{ rows: [] }, { rows: [] }];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage/history?days=60');

    expect(res.status).toBe(200);
    expect(res.body.period.days).toBe(60);
  });

  it('caps days at 90 even when larger value is given', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP]];
    _poolQueryQueue = [{ rows: [] }, { rows: [] }];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage/history?days=180');

    expect(res.status).toBe(200);
    expect(res.body.period.days).toBe(90);
  });

  it('returns empty arrays when no history exists', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP]];
    _poolQueryQueue = [{ rows: [] }, { rows: [] }];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage/history');

    expect(res.status).toBe(200);
    expect(res.body.usageByDay).toHaveLength(0);
    expect(res.body.activeUsersByDay).toHaveLength(0);
  });

  it('returns 404 for a nonexistent org', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).get('/orgs/nonexistent/usage/history');

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not an org member', async () => {
    _currentUser = makeOutsiderUser();
    _selectQueue = [[ORG], []];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/usage/history');

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /orgs/:orgSlug/usage/events — record usage event
// ---------------------------------------------------------------------------

describe('POST /orgs/:orgSlug/usage/events — record usage event', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _poolQueryQueue = [];
    _currentUser = makeAdminUser();
  });

  it('records a usage event and returns confirmation', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP]];
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .post('/orgs/acme-corp/usage/events')
      .send({ featureKey: 'dashboard.view', quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.recorded).toBe(true);
    expect(res.body.featureKey).toBe('dashboard.view');
    expect(res.body.quantity).toBe(1);
  });

  it('records a usage event with metadata', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP]];
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .post('/orgs/acme-corp/usage/events')
      .send({ featureKey: 'api.export', quantity: 5, metadata: { format: 'csv', rows: 1000 } });

    expect(res.status).toBe(200);
    expect(res.body.recorded).toBe(true);
    expect(res.body.quantity).toBe(5);
  });

  it('returns 400 when featureKey is missing', async () => {
    const app = await getApp();
    const res = await request(app).post('/orgs/acme-corp/usage/events').send({ quantity: 1 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when quantity is zero (must be positive integer)', async () => {
    const app = await getApp();
    const res = await request(app)
      .post('/orgs/acme-corp/usage/events')
      .send({ featureKey: 'api.query', quantity: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when quantity is negative', async () => {
    const app = await getApp();
    const res = await request(app)
      .post('/orgs/acme-corp/usage/events')
      .send({ featureKey: 'api.query', quantity: -5 });

    expect(res.status).toBe(400);
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .post('/orgs/ghost-org/usage/events')
      .send({ featureKey: 'api.query', quantity: 1 });

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not an org member', async () => {
    _currentUser = makeOutsiderUser();
    _selectQueue = [[ORG], []];

    const app = await getApp();
    const res = await request(app)
      .post('/orgs/acme-corp/usage/events')
      .send({ featureKey: 'api.query', quantity: 1 });

    expect(res.status).toBe(403);
  });

  it('defaults quantity to 1 when not provided', async () => {
    _selectQueue = [[ORG], [MEMBERSHIP]];
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .post('/orgs/acme-corp/usage/events')
      .send({ featureKey: 'feature.login' });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(1);
  });
});
