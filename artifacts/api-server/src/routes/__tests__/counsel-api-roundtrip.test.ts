/**
 * Counsel API Round-Trip Tests
 *
 * Tests the real counsel Express router via supertest with a mocked DB layer.
 * Validation middleware is NOT mocked, so Zod schemas are exercised for real.
 *
 * Covers:
 *   - GET /counsel/matters — returns matters + provenance field
 *   - POST /counsel/matters — full contract + CSRF enforcement + Zod validation
 *   - PATCH /counsel/obligations/:id — snooze (status:pending) + resolve (status:complete)
 *   - Bearer token bypasses CSRF middleware
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let _selectQueue: unknown[][] = [];
let _insertValues: unknown[] = [];
let _updateSetArgs: unknown[] = [];

vi.mock('@szl-holdings/db', () => ({
  db: {
    select() {
      const result = (_selectQueue.shift() ?? []) as unknown[];
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: () => chain,
        orderBy: () => Promise.resolve(result),
        limit: () => Promise.resolve(result),
        then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return chain;
    },
    insert() {
      const chain: Record<string, unknown> = {
        values: (vals: unknown) => {
          _insertValues.push(vals);
          return chain;
        },
        onConflictDoNothing: () => Promise.resolve(),
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
      const result = (_selectQueue.shift() ?? []) as unknown[];
      const chain: Record<string, unknown> = {
        where: () => chain,
        returning: () => Promise.resolve(result),
      };
      return chain;
    },
  },
  pcGcMattersTable: { id: 'id', orgId: 'org_id' },
  pcGcObligationsTable: { id: 'id', matterId: 'matter_id', sortOrder: 'sort_order' },
  pcGcAuditEntriesTable: { id: 'id', matterId: 'matter_id', timestamp: 'timestamp' },
  pcGcProofChainEntriesTable: { id: 'id', matterId: 'matter_id', timestamp: 'timestamp' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  asc: (_col: unknown) => ({ op: 'asc' }),
  inArray: (_col: unknown, _vals: unknown) => ({ op: 'inArray' }),
}));

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const TEST_CSRF_TOKEN = 'test-csrf-token-abc123';

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

function makeMatter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'matter-001',
    orgId: 1,
    name: 'Apex Capital — Series C Acquisition',
    clientName: 'Apex Capital Partners LP',
    matterNumber: '2026-LIT-001',
    type: 'transaction',
    status: 'active',
    privilegeLevel: 'attorney-client',
    pressureScore: 62,
    complexityScore: 75,
    leadCounsel: 'M. Farooq',
    jurisdiction: 'Delaware / Federal',
    summary: 'Acquisition matter.',
    openedDate: '2025-01-01',
    nextDeadline: '2026-06-01',
    nextDeadlineLabel: 'HSR Filing',
    estimatedExposure: '5000000',
    ...overrides,
  };
}

function makeObligation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'obl-001',
    matterId: 'matter-001',
    title: 'HSR Antitrust Filing',
    description: 'File HSR pre-merger notification.',
    status: 'overdue',
    privilegeLevel: 'attorney-client',
    sortOrder: 1,
    dueDate: '2026-01-15',
    assignee: 'M. Farooq',
    dependencies: [],
    filingRequired: true,
    courtId: null,
    consequence: 'Statutory penalty of $50k/day',
    completedDate: null,
    ...overrides,
  };
}

function makeOrgUser() {
  return {
    id: 10,
    displayName: 'Alice',
    email: 'alice@org.example',
    roles: ['member'] as string[],
    orgs: [{ orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'member' }],
  };
}

function injectUser(user: ReturnType<typeof makeOrgUser> | null) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (user) (req as unknown as { user: unknown }).user = user;
    next();
  };
}

async function buildApp(opts: { withCsrf?: boolean; user?: ReturnType<typeof makeOrgUser> | null } = {}) {
  const { withCsrf = false, user = makeOrgUser() } = opts;
  const { default: router } = await import('../counsel');
  const app = express();
  app.use(express.json());
  if (withCsrf) app.use(csrfCheckMiddleware);
  app.use(injectUser(user));
  app.use(router);
  return app;
}

const validNewMatter = {
  name: 'New Test Matter',
  matterNumber: '2026-TST-001',
  clientName: 'Test Client Corp',
  leadCounsel: 'J. Smith',
  jurisdiction: 'New York',
  summary: 'A test matter for validation.',
};

describe('GET /counsel/matters — response contract & provenance', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertValues = [];
    _updateSetArgs = [];
    vi.resetModules();
  });

  it('returns 403 when user has no org membership', async () => {
    const app = await buildApp({ user: null });
    _selectQueue = [[]];
    const res = await request(app).get('/counsel/matters');
    expect(res.status).toBe(403);
  });

  it('returns 200 with matters array and provenance field', async () => {
    const app = await buildApp();
    _selectQueue = [
      [],
      [],
      [],
    ];
    const res = await request(app).get('/counsel/matters');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('matters');
    expect(res.body).toHaveProperty('provenance');
    expect(['seeded', 'live']).toContain(res.body.provenance);
    expect(Array.isArray(res.body.matters)).toBe(true);
  });

  it('returns provenance:seeded when org was empty before this request', async () => {
    const app = await buildApp();
    _selectQueue = [
      [],
      [],
      [],
    ];
    const res = await request(app).get('/counsel/matters');
    expect(res.status).toBe(200);
    expect(res.body.provenance).toBe('seeded');
    expect(Array.isArray(res.body.matters)).toBe(true);
  });

  it('returns provenance:live when org already had matters before request', async () => {
    const app = await buildApp();
    const matter = makeMatter();
    _selectQueue = [
      [{ id: matter.id }],
      [{ id: matter.id }],
      [{ id: matter.id }],
      [matter],
      [],
      [],
      [],
    ];
    const res = await request(app).get('/counsel/matters');
    expect(res.status).toBe(200);
    expect(res.body.provenance).toBe('live');
  });
});

describe('POST /counsel/matters — CSRF enforcement and response contract', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertValues = [];
    _updateSetArgs = [];
    vi.resetModules();
  });

  it('returns 403 when no CSRF token provided in cookie-session mode', async () => {
    const app = await buildApp({ withCsrf: true });
    const res = await request(app)
      .post('/counsel/matters')
      .set('Content-Type', 'application/json')
      .send(validNewMatter);
    expect(res.status).toBe(403);
    expect(res.body.code).toMatch(/CSRF/i);
  });

  it('accepts POST with matching csrf_token cookie and x-csrf-token header', async () => {
    const app = await buildApp({ withCsrf: true });
    const insertedMatter = makeMatter({ name: validNewMatter.name });
    _selectQueue = [[], [insertedMatter], [], [], []];
    const res = await request(app)
      .post('/counsel/matters')
      .set('Content-Type', 'application/json')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send(validNewMatter);
    expect([200, 201]).toContain(res.status);
  });

  it('accepts POST with Bearer token — CSRF middleware bypassed', async () => {
    const app = await buildApp({ withCsrf: true });
    const insertedMatter = makeMatter({ name: validNewMatter.name });
    _selectQueue = [[], [insertedMatter], [], [], []];
    const res = await request(app)
      .post('/counsel/matters')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer fake-jwt-for-csrf-bypass-test')
      .send(validNewMatter);
    expect([200, 201]).toContain(res.status);
  });

  it('returns 400 when required field "name" is missing', async () => {
    const app = await buildApp();
    const res = await request(app)
      .post('/counsel/matters')
      .set('Content-Type', 'application/json')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send({ matterNumber: '2026-TST-002' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when required field "matterNumber" is missing', async () => {
    const app = await buildApp();
    const res = await request(app)
      .post('/counsel/matters')
      .set('Content-Type', 'application/json')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send({ name: 'Only Name Matter' });
    expect(res.status).toBe(400);
  });

  it('returns matter with required fields (id, name) in response', async () => {
    const app = await buildApp();
    const insertedMatter = makeMatter({ name: validNewMatter.name });
    _selectQueue = [[], [insertedMatter], [], [], []];
    const res = await request(app)
      .post('/counsel/matters')
      .set('Content-Type', 'application/json')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send(validNewMatter);
    expect([200, 201]).toContain(res.status);
    const matter = res.body.data ?? res.body;
    expect(matter).toHaveProperty('id');
    expect(matter).toHaveProperty('name');
  });

  it('accepts numeric estimatedExposure in request body', async () => {
    const app = await buildApp();
    const insertedMatter = makeMatter({ name: validNewMatter.name, estimatedExposure: '5000000' });
    _selectQueue = [[], [insertedMatter], [], [], []];
    const res = await request(app)
      .post('/counsel/matters')
      .set('Content-Type', 'application/json')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send({ ...validNewMatter, estimatedExposure: 5000000 });
    expect([200, 201]).toContain(res.status);
  });
});

describe('PATCH /counsel/obligations/:id — snooze and resolve mutations', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertValues = [];
    _updateSetArgs = [];
    vi.resetModules();
  });

  it('snooze: sends status:pending and DB receives correct update', async () => {
    const app = await buildApp();
    const obl = makeObligation({ status: 'overdue' });
    const matter = makeMatter();
    _selectQueue = [
      [matter],
      [{ ...obl, status: 'pending' }],
    ];
    const res = await request(app)
      .patch(`/counsel/obligations/${obl.id}`)
      .set('Content-Type', 'application/json')
      .send({ matterId: 'matter-001', status: 'pending' });
    expect([200, 201]).toContain(res.status);
    expect(_updateSetArgs.length).toBeGreaterThan(0);
    const updateArg = _updateSetArgs[0] as Record<string, unknown>;
    expect(updateArg.status).toBe('pending');
  });

  it('resolve: sends status:complete + completedDate and DB receives correct update', async () => {
    const app = await buildApp();
    const obl = makeObligation({ status: 'in-progress' });
    const matter = makeMatter();
    const today = new Date().toISOString().split('T')[0]!;
    _selectQueue = [
      [matter],
      [{ ...obl, status: 'complete', completedDate: today }],
    ];
    const res = await request(app)
      .patch(`/counsel/obligations/${obl.id}`)
      .set('Content-Type', 'application/json')
      .send({ matterId: 'matter-001', status: 'complete', completedDate: today });
    expect([200, 201]).toContain(res.status);
    expect(_updateSetArgs.length).toBeGreaterThan(0);
    const updateArg = _updateSetArgs[0] as Record<string, unknown>;
    expect(updateArg.status).toBe('complete');
    expect(updateArg.completedDate).toBe(today);
  });

  it('returns 403 when user has no org membership', async () => {
    const app = await buildApp({ user: null });
    const res = await request(app)
      .patch('/counsel/obligations/obl-001')
      .set('Content-Type', 'application/json')
      .send({ matterId: 'matter-001', status: 'pending' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when matterId is missing from body', async () => {
    const app = await buildApp();
    const res = await request(app)
      .patch('/counsel/obligations/obl-001')
      .set('Content-Type', 'application/json')
      .send({ status: 'pending' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when matter is not found for org', async () => {
    const app = await buildApp();
    _selectQueue = [[]];
    const res = await request(app)
      .patch('/counsel/obligations/obl-001')
      .set('Content-Type', 'application/json')
      .send({ matterId: 'nonexistent-matter', status: 'pending' });
    expect(res.status).toBe(404);
  });

  it('rejects invalid status value via Zod validation', async () => {
    const app = await buildApp();
    const res = await request(app)
      .patch('/counsel/obligations/obl-001')
      .set('Content-Type', 'application/json')
      .send({ matterId: 'matter-001', status: 'invalid-status' });
    expect(res.status).toBe(400);
  });
});
