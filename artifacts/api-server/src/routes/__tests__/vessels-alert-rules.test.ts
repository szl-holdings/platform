/**
 * Vessels Alert Rules — Integration Tests
 *
 * Tests the real vessels Express router via supertest with a mocked DB layer.
 * Auth + tenant-scope middleware are mocked (same pattern as audit-events-roles.test.ts).
 * Validation middleware is NOT mocked, so:
 *   - Zod `insertVesselAlertRuleSchema` from @szl-holdings/db is exercised end-to-end
 *   - `validateBody(vesselsResourceMutationSchema)` is exercised end-to-end
 *   - CSRF enforcement is exercised via a custom middleware fixture
 *
 * Covers:
 *   - GET  /vessels/alert-rules/all        — list rules (200) + unauthenticated guard (401)
 *   - POST /vessels/alert-rules            — create rule: success (201) + CSRF guard + Zod rejection
 *   - PUT  /vessels/alert-rules/:id        — update rule: success + 404 when not found + Zod rejection
 *   - DELETE /vessels/alert-rules/:id      — delete rule: success (204) + 404 when not found
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── DB mock — real Zod schemas preserved, only db driver is stubbed ──────────

let _selectQueue: unknown[][] = [];
let _insertValues: unknown[] = [];
let _updateSetArgs: unknown[] = [];
let _deleteResults: unknown[] = [];

vi.mock('@szl-holdings/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@szl-holdings/db')>();

  const stubTable = new Proxy({} as Record<string, unknown>, {
    get: (_, p) => (typeof p === 'string' ? p : undefined),
  });

  const db = {
    select() {
      const result = (_selectQueue.shift() ?? []) as unknown[];
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: () => chain,
        orderBy: () => Promise.resolve(result),
        limit: () => Promise.resolve(result),
        then: (
          resolve: (v: unknown) => unknown,
          reject?: (e: unknown) => unknown,
        ) => Promise.resolve(result).then(resolve, reject),
      };
      return chain;
    },
    insert() {
      const chain: Record<string, unknown> = {
        values: (vals: unknown) => {
          _insertValues.push(vals);
          return chain;
        },
        returning: () => Promise.resolve([_insertValues.at(-1) ?? {}]),
      };
      return chain;
    },
    update() {
      const result = (_selectQueue.shift() ?? []) as unknown[];
      const chain: Record<string, unknown> = {
        set: (args: unknown) => {
          _updateSetArgs.push(args);
          return chain;
        },
        where: () => chain,
        returning: () => Promise.resolve(result),
      };
      return chain;
    },
    delete() {
      const result = (_deleteResults.length > 0
        ? _deleteResults.shift()
        : (_selectQueue.shift() ?? [])) as unknown[];
      const chain: Record<string, unknown> = {
        where: () => chain,
        returning: () => Promise.resolve(result),
      };
      return chain;
    },
  };

  return {
    // Keep ALL real exports (Zod schemas, type exports, etc.)
    ...actual,
    // Override the db driver with the stub
    db,
    // Override table objects with stubs (they're used only as query targets)
    vesselsAlertRulesTable: stubTable,
    vesselsAlertsTable: stubTable,
    vesselsFleetsTable: stubTable,
    vesselsTable: stubTable,
    vesselsEventsTable: stubTable,
    vesselsCommandWorkflowsTable: stubTable,
    vesselsRoutesTable: stubTable,
    vesselsCargoTable: stubTable,
    vesselsPositionsTable: stubTable,
    vesselsSimulationsTable: stubTable,
    vesselsWeatherSnapshotsTable: stubTable,
  };
});

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: (_col: unknown, _val: unknown) => ({ op: 'eq' }),
    and: (..._conds: unknown[]) => ({ op: 'and' }),
    desc: (_col: unknown) => ({ op: 'desc' }),
    asc: (_col: unknown) => ({ op: 'asc' }),
    inArray: (_col: unknown, _vals: unknown) => ({ op: 'inArray' }),
  };
});

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
  },
  initializeOpenTelemetry: () => Promise.resolve(),
}));

vi.mock('@szl-holdings/audit', () => ({ hashIp: (ip: string) => `hashed-${ip}` }));
vi.mock('@szl-holdings/config', () => ({ resolveRuntimeMode: () => 'standard' }));

vi.mock('../../lib/pubsub-bridge', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn() },
  VESSELS_EVENTS: { POSITION_UPDATED: 'positionUpdated' },
}));

vi.mock('../../lib/platform-flags', () => ({
  isFlagEnabled: vi.fn(() => Promise.resolve(false)),
}));

// ─── Auth + tenant-scope mocks ────────────────────────────────────────────────

interface MockUser {
  id: number;
  roles: string[];
  orgs: { orgId: number; orgSlug: string; orgName: string; role: string }[];
  displayName?: string;
  email?: string;
}

let authUser: MockUser | null = null;

class InvalidIdError extends Error {
  constructor() {
    super('Invalid ID parameter');
    this.name = 'InvalidIdError';
  }
}

vi.mock('../../middlewares/auth', () => ({
  InvalidIdError,
  authMiddleware:
    () =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (!authUser) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      (req as Request & { user: MockUser }).user = authUser;
      next();
    },
  requireRole:
    (..._roles: string[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (!(req as Request & { user?: MockUser }).user) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      next();
    },
  parseIdParam: (id: string) => {
    const n = parseInt(id, 10);
    if (!Number.isFinite(n) || n <= 0) {
      throw new InvalidIdError();
    }
    return n;
  },
}));

vi.mock('../../middlewares/tenant-scope', () => ({
  tenantScope:
    () =>
    (req: Request, _res: Response, next: NextFunction): void => {
      (req as Request & { tenantOrgId?: number }).tenantOrgId = 1;
      next();
    },
}));

// ─── CSRF fixture ─────────────────────────────────────────────────────────────

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const TEST_CSRF_TOKEN = 'test-csrf-token-vessels-abc';

function csrfCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
  if (SAFE.has(req.method)) { next(); return; }
  if ((req.headers.authorization ?? '').startsWith('Bearer ')) { next(); return; }
  const rawCookie = req.headers.cookie ?? '';
  const cookieMatch = rawCookie.match(/csrf_token=([^;]+)/);
  const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1]!) : null;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;
  if (!cookieToken || !headerToken) {
    res.status(403).json({ code: 'CSRF_TOKEN_MISSING', message: 'CSRF token missing' });
    return;
  }
  if (cookieToken !== headerToken) {
    res.status(403).json({ code: 'CSRF_TOKEN_MISMATCH', message: 'CSRF token mismatch' });
    return;
  }
  next();
}

// ─── App factory ──────────────────────────────────────────────────────────────

async function buildApp(opts: { withCsrf?: boolean } = {}) {
  const { withCsrf = false } = opts;
  const { default: router } = await import('../vessels');
  const app = express();
  app.use(express.json());
  if (withCsrf) app.use(csrfCheckMiddleware);
  app.use(router);
  return app;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeAdminUser(): MockUser {
  return {
    id: 1,
    roles: ['admin'],
    orgs: [{ orgId: 1, orgSlug: 'test-org', orgName: 'Test Org', role: 'admin' }],
    displayName: 'Admin User',
    email: 'admin@test.example',
  };
}

const validNewRule = {
  name: 'Speed Limit Alert',
  ruleType: 'speed',
  severity: 'high',
  conditions: { maxKnots: 15 },
  isActive: true,
};

function makeAlertRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    orgId: 1,
    name: 'Speed Limit Alert',
    description: null,
    ruleType: 'speed',
    conditions: { maxKnots: 15 },
    severity: 'high',
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

let app: ReturnType<typeof express>;

// ─── GET /vessels/alert-rules/all ─────────────────────────────────────────────

describe('GET /vessels/alert-rules/all — list rules for org', () => {
  beforeEach(async () => {
    _selectQueue = [];
    _insertValues = [];
    _updateSetArgs = [];
    _deleteResults = [];
    authUser = makeAdminUser();
    app = await buildApp();
  });

  it('returns 200 with empty array when no rules exist', async () => {
    _selectQueue = [[]];
    const res = await request(app).get('/vessels/alert-rules/all');
    expect(res.status).toBe(200);
    const data = res.body.data ?? res.body;
    expect(Array.isArray(data)).toBe(true);
  });

  it('returns 200 with rules in array when rules exist for org', async () => {
    _selectQueue = [[makeAlertRule()]];
    const res = await request(app).get('/vessels/alert-rules/all');
    expect(res.status).toBe(200);
  });

  it('returns 401 when user is not authenticated', async () => {
    authUser = null;
    app = await buildApp();
    const res = await request(app).get('/vessels/alert-rules/all');
    expect(res.status).toBe(401);
  });
});

// ─── POST /vessels/alert-rules ────────────────────────────────────────────────

describe('POST /vessels/alert-rules — CSRF enforcement + Zod validation', () => {
  beforeEach(async () => {
    _selectQueue = [];
    _insertValues = [];
    _updateSetArgs = [];
    _deleteResults = [];
    authUser = makeAdminUser();
  });

  it('returns 403 when CSRF token is absent (cookie-session mode)', async () => {
    app = await buildApp({ withCsrf: true });
    const res = await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .send(validNewRule);
    expect(res.status).toBe(403);
    expect(res.body.code).toMatch(/CSRF/i);
  });

  it('accepts POST with matching csrf_token cookie + x-csrf-token header', async () => {
    app = await buildApp({ withCsrf: true });
    const res = await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send(validNewRule);
    expect([200, 201]).toContain(res.status);
  });

  it('accepts POST with Bearer token — CSRF middleware is bypassed', async () => {
    app = await buildApp({ withCsrf: true });
    const res = await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer fake-jwt-for-csrf-bypass-test')
      .send(validNewRule);
    expect([200, 201]).toContain(res.status);
  });

  it('returns 201 with response body containing name and ruleType', async () => {
    app = await buildApp();
    const res = await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .send(validNewRule);
    expect([200, 201]).toContain(res.status);
    const rule = res.body.data ?? res.body;
    expect(rule).toHaveProperty('name', validNewRule.name);
    expect(rule).toHaveProperty('ruleType', validNewRule.ruleType);
  });

  it('writes correct fields to DB insert — name, ruleType, severity captured', async () => {
    app = await buildApp();
    await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .send(validNewRule);
    expect(_insertValues.length).toBeGreaterThan(0);
    const inserted = _insertValues[0] as Record<string, unknown>;
    expect(inserted.name).toBe(validNewRule.name);
    expect(inserted.ruleType).toBe(validNewRule.ruleType);
    expect(inserted.severity).toBe(validNewRule.severity);
  });

  it('returns 400 when name is missing — real insertVesselAlertRuleSchema rejects', async () => {
    app = await buildApp();
    const res = await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .send({ ruleType: 'speed', severity: 'high', conditions: {} });
    expect(res.status).toBe(400);
  });

  it('returns 400 when ruleType is an invalid enum value — Zod rejects', async () => {
    app = await buildApp();
    const res = await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .send({ name: 'Bad Rule', ruleType: 'invalid_type', severity: 'high', conditions: {} });
    expect(res.status).toBe(400);
  });

  it('returns 400 when severity is an invalid enum value — Zod rejects', async () => {
    app = await buildApp();
    const res = await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .send({ name: 'Test Rule', ruleType: 'speed', severity: 'extreme', conditions: {} });
    expect(res.status).toBe(400);
  });

  it('returns 401 when user is unauthenticated — no rule created', async () => {
    authUser = null;
    app = await buildApp();
    const res = await request(app)
      .post('/vessels/alert-rules')
      .set('Content-Type', 'application/json')
      .send(validNewRule);
    expect(res.status).toBe(401);
    expect(_insertValues.length).toBe(0);
  });
});

// ─── PUT /vessels/alert-rules/:id ────────────────────────────────────────────

describe('PUT /vessels/alert-rules/:id — update alert rule', () => {
  beforeEach(async () => {
    _selectQueue = [];
    _insertValues = [];
    _updateSetArgs = [];
    _deleteResults = [];
    authUser = makeAdminUser();
    app = await buildApp();
  });

  it('returns 200 and records correct updated field in DB set call', async () => {
    _selectQueue = [[makeAlertRule({ severity: 'critical' })]];
    const res = await request(app)
      .put('/vessels/alert-rules/42')
      .set('Content-Type', 'application/json')
      .send({ severity: 'critical' });
    expect([200, 201]).toContain(res.status);
    expect(_updateSetArgs.length).toBeGreaterThan(0);
    const arg = _updateSetArgs[0] as Record<string, unknown>;
    expect(arg.severity).toBe('critical');
  });

  it('returns 404 when the rule is not found for org', async () => {
    _selectQueue = [[]];
    const res = await request(app)
      .put('/vessels/alert-rules/9999')
      .set('Content-Type', 'application/json')
      .send({ severity: 'low' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when ruleType is an invalid enum value in update body', async () => {
    const res = await request(app)
      .put('/vessels/alert-rules/42')
      .set('Content-Type', 'application/json')
      .send({ ruleType: 'not_a_valid_type' });
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /vessels/alert-rules/:id ─────────────────────────────────────────

describe('DELETE /vessels/alert-rules/:id — remove alert rule', () => {
  beforeEach(async () => {
    _selectQueue = [];
    _insertValues = [];
    _updateSetArgs = [];
    _deleteResults = [];
    authUser = makeAdminUser();
    app = await buildApp();
  });

  it('returns 204 when the rule exists and is deleted', async () => {
    _deleteResults = [[makeAlertRule()]];
    const res = await request(app)
      .delete('/vessels/alert-rules/42')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(204);
  });

  it('returns 404 when the rule does not exist for org', async () => {
    _deleteResults = [[]];
    const res = await request(app)
      .delete('/vessels/alert-rules/9999')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(404);
  });

  it('returns 401 when user is unauthenticated', async () => {
    authUser = null;
    app = await buildApp();
    const res = await request(app)
      .delete('/vessels/alert-rules/42')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(401);
  });
});
