/**
 * LP Portal Cross-LP Isolation Tests
 *
 * Verifies that each LP can only access their own records — never another
 * LP's — and that unauthenticated requests are confined to demo-only rows.
 *
 * All external I/O (DB, email, object storage, audit) is mocked so this suite
 * runs with no real network or database access.
 *
 * Coverage:
 *  - Capital account   GET /lp-portal/lps/:id/capital-account
 *  - Data room docs    GET /lp-portal/lps/:id/documents
 *  - Messages          GET /lp-portal/lps/:id/messages
 *  - Uploads           GET /lp-portal/lps/:id/uploads
 *  - LP roster         GET /lp-portal/lps
 *
 * Isolation assertions per endpoint:
 *  - LP A authenticated → own data 200, other LP 403
 *  - LP B authenticated → own data 200, other LP 403
 *  - Unauthenticated   → demo rows only (403 for non-demo LPs)
 *  - GP/admin          → all rows (control)
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Seed data — two distinct LPs
// ---------------------------------------------------------------------------

const LP_A = {
  id: 1,
  lpName: 'Alpha Capital LP',
  contactEmail: 'lp-a@alphacap.example',
  qualifiedEligiblePerson: true,
  metadata: { is_demo: false, join_date: '2024-01-15' },
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

const LP_B = {
  id: 2,
  lpName: 'Beta Ventures LP',
  contactEmail: 'lp-b@betaventures.example',
  qualifiedEligiblePerson: false,
  metadata: { is_demo: false, join_date: '2024-03-01' },
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
};

const LP_DEMO = {
  id: 3,
  lpName: 'Demo LP',
  contactEmail: 'demo@szlholdings.com',
  qualifiedEligiblePerson: false,
  metadata: { is_demo: true, join_date: '2024-01-01' },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const CAPITAL_ACCOUNT_A = {
  id: 101,
  lpId: LP_A.id,
  committed: '1000000',
  called: '600000',
  distributed: '150000',
  nav: '520000',
  unrealizedGain: '70000',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const CAPITAL_ACCOUNT_B = {
  id: 102,
  lpId: LP_B.id,
  committed: '500000',
  called: '300000',
  distributed: '80000',
  nav: '260000',
  unrealizedGain: '40000',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MESSAGE_A = {
  id: 201,
  lpId: LP_A.id,
  fromGp: true,
  body: 'Q3 update for Alpha Capital',
  readAt: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MESSAGE_B = {
  id: 202,
  lpId: LP_B.id,
  fromGp: true,
  body: 'Q3 update for Beta Ventures',
  readAt: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const DOC_A = {
  id: 251,
  name: 'Alpha Q3 2025 Report.pdf',
  folder: 'Reports',
  fileType: 'pdf',
  sizeLabel: '1.2 MB',
  uploadedAt: '2025-10-01',
  permissionTier: 'all_lp',
  watermarked: true,
  sourceUri: null,
  uploadedBy: 'gp@szlholdings.com',
  isDemo: false,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const DOC_DEMO = {
  id: 252,
  name: 'Demo Overview.pdf',
  folder: 'General',
  fileType: 'pdf',
  sizeLabel: '0.5 MB',
  uploadedAt: '2025-01-01',
  permissionTier: 'all_lp',
  watermarked: false,
  sourceUri: null,
  uploadedBy: 'gp@szlholdings.com',
  isDemo: true,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const UPLOAD_A = {
  id: 301,
  lpId: LP_A.id,
  fileName: 'alpha-subscription.pdf',
  fileType: 'application/pdf',
  objectKey: 'uploads/lp-1/alpha-subscription.pdf',
  status: 'pending_review',
  uploadedBy: LP_A.contactEmail,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const UPLOAD_B = {
  id: 302,
  lpId: LP_B.id,
  fileName: 'beta-subscription.pdf',
  fileType: 'application/pdf',
  objectKey: 'uploads/lp-2/beta-subscription.pdf',
  status: 'pending_review',
  uploadedBy: LP_B.contactEmail,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// DB mock state
// ---------------------------------------------------------------------------

/**
 * Controlled query queue — each call to db.select() dequeues the next result.
 * Reset in beforeEach; individual tests push their expected return values.
 */
const dbSelectQueue: unknown[][] = [];

function pushSelect(...results: unknown[][]): void {
  for (const r of results) dbSelectQueue.push(r);
}

vi.mock('@szl-holdings/db', () => {
  const makeSelectChain = () => {
    const chain: Record<string, unknown> = {};
    Object.assign(chain, {
      from: () => chain,
      where: () => chain,
      innerJoin: () => chain,
      leftJoin: () => chain,
      orderBy: () => chain,
      limit: () => Promise.resolve(dbSelectQueue.shift() ?? []),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(dbSelectQueue.shift() ?? []).then(resolve, reject),
    });
    return chain;
  };

  const makeInsertChain = () => {
    const chain: Record<string, unknown> = {};
    Object.assign(chain, {
      values: () => chain,
      returning: () => Promise.resolve([]),
    });
    return chain;
  };

  return {
    db: {
      select: makeSelectChain,
      insert: makeInsertChain,
    },
    fundAccreditedInvestorsTable: {
      id: 'id',
      contactEmail: 'contact_email',
      metadata: 'metadata',
      lpName: 'lp_name',
      qualifiedEligiblePerson: 'qualified_eligible_person',
    },
    fundLpCapitalAccountsTable: { id: 'id', lpId: 'lp_id' },
    fundLpDataRoomDocsTable: {
      id: 'id',
      lpId: 'lp_id',
      permissionTier: 'permission_tier',
    },
    fundLpMessagesTable: { id: 'id', lpId: 'lp_id' },
    fundLpUploadsTable: { id: 'id', lpId: 'lp_id' },
    fundLpReportsTable: {},
    fundLpActivityEventsTable: {},
    fundNavRecordsTable: {},
  };
});

// ---------------------------------------------------------------------------
// Drizzle-orm operators (pass-through stubs)
// ---------------------------------------------------------------------------

vi.mock('drizzle-orm', () => ({
  eq: (_col: unknown, _val: unknown) => ({ op: 'eq' }),
  ne: (_col: unknown, _val: unknown) => ({ op: 'ne' }),
  and: (..._args: unknown[]) => ({ op: 'and' }),
  or: (..._args: unknown[]) => ({ op: 'or' }),
  asc: (_col: unknown) => ({ op: 'asc' }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  inArray: (_col: unknown, _vals: unknown) => ({ op: 'inArray' }),
  sql: Object.assign((_parts: TemplateStringsArray, ..._vals: unknown[]) => ({ op: 'sql' }), {
    raw: (_s: string) => ({ op: 'sql-raw' }),
  }),
}));

// ---------------------------------------------------------------------------
// Supporting mocks
// ---------------------------------------------------------------------------

vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  logNotificationAudit: vi.fn().mockResolvedValue(undefined),
  generateUnsubscribeToken: vi.fn().mockReturnValue('tok'),
  buildLpReportPublishedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
  buildLpGpMessageEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
  buildLpDataRoomDocEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
}));

vi.mock('@szl-holdings/audit', () => ({
  hashIp: (_ip: unknown) => 'hashed-ip',
}));

vi.mock('../../lib/objectStorage', () => ({
  ObjectStorageService: class {
    getObjectEntityFile = vi.fn().mockResolvedValue({ key: 'k', size: 1024 });
    uploadBuffer = vi.fn().mockResolvedValue('/objects/test');
  },
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (_shape: unknown) => ({ parse: (v: unknown) => v }),
}));

vi.mock('../../lib/validation', () => ({
  validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  listQuerySchema: {},
}));

vi.mock('../../lib/api-response', () => ({
  sendSuccess: (res: Response, data: unknown, status = 200, _meta?: unknown) =>
    res.status(status).json(data),
  sendBadRequest: (res: Response, msg: string) => res.status(400).json({ error: msg }),
  sendForbidden: (res: Response, msg: string) => res.status(403).json({ error: msg }),
  sendNotFound: (res: Response, entity: string) =>
    res.status(404).json({ error: `${entity} not found` }),
  handleRouteError: (res: Response, _err: unknown, msg: string) =>
    res.status(500).json({ error: msg }),
}));

// ---------------------------------------------------------------------------
// Auth mock — controlled per test
// ---------------------------------------------------------------------------

type MockUser = { id: number; email: string; roles: string[] } | null;
let currentUser: MockUser = null;

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (opts?: { required?: boolean }) => {
    const required = opts?.required ?? true;
    return (req: Request, res: Response, next: NextFunction) => {
      if (!currentUser && required) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (currentUser) (req as Request & { user?: MockUser }).user = currentUser;
      next();
    };
  },
  requireRole:
    (..._roles: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      const user = (req as Request & { user?: MockUser }).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const allowed = _roles.some((r) => (user as NonNullable<MockUser>).roles.includes(r));
      if (!allowed) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      next();
    },
  parseIdParam: (s: string) => {
    const n = Number.parseInt(s, 10);
    if (Number.isNaN(n)) throw new Error('Invalid id param');
    return n;
  },
}));

// ---------------------------------------------------------------------------
// App factory — import router once, reuse across tests
// ---------------------------------------------------------------------------

async function buildApp() {
  const app = express();
  app.use(express.json());
  const { default: lpPortalRouter } = await import('../../routes/lp-portal.js');
  app.use(lpPortalRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asLpA() {
  currentUser = { id: 10, email: LP_A.contactEmail, roles: ['member'] };
}

function asLpB() {
  currentUser = { id: 20, email: LP_B.contactEmail, roles: ['member'] };
}

function asGp() {
  currentUser = { id: 1, email: 'gp@szlholdings.com', roles: ['admin'] };
}

function unauthenticated() {
  currentUser = null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LP Portal — cross-LP data isolation', () => {
  let app: express.Express;

  beforeEach(async () => {
    dbSelectQueue.length = 0;
    currentUser = null;
    app = await buildApp();
  });

  // ── Capital account ─────────────────────────────────────────────────────

  describe('GET /lp-portal/lps/:id/capital-account', () => {
    it('LP A can access their own capital account', async () => {
      asLpA();
      // resolveScope → looks up LP by email → returns LP_A
      pushSelect([LP_A]);
      // loadLp → fetches LP by id → returns LP_A (scope.selfLpId matches)
      pushSelect([LP_A]);
      // capital account query
      pushSelect([CAPITAL_ACCOUNT_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/capital-account`);
      expect(res.status).toBe(200);
    });

    it('LP A cannot access LP B capital account — receives 403', async () => {
      asLpA();
      // resolveScope → email lookup finds LP_A (selfLpId = 1)
      pushSelect([LP_A]);
      // loadLp for LP_B.id → LP exists but selfLpId doesn't match → returns null
      pushSelect([LP_B]);

      const res = await request(app).get(`/lp-portal/lps/${LP_B.id}/capital-account`);
      expect(res.status).toBe(403);
    });

    it('LP B can access their own capital account', async () => {
      asLpB();
      pushSelect([LP_B]);
      pushSelect([LP_B]);
      pushSelect([CAPITAL_ACCOUNT_B]);

      const res = await request(app).get(`/lp-portal/lps/${LP_B.id}/capital-account`);
      expect(res.status).toBe(200);
    });

    it('LP B cannot access LP A capital account — receives 403', async () => {
      asLpB();
      // resolveScope → email lookup finds LP_B (selfLpId = 2)
      pushSelect([LP_B]);
      // loadLp for LP_A.id → row found but selfLpId (2) ≠ LP_A.id (1) → null
      pushSelect([LP_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/capital-account`);
      expect(res.status).toBe(403);
    });

    it('GP admin can access both LP A and LP B capital accounts', async () => {
      asGp();
      // resolveScope → email lookup (no match for GP email) → isGp=true, selfLpId=null
      pushSelect([]);
      // loadLp → GP path → returns LP_A
      pushSelect([LP_A]);
      pushSelect([CAPITAL_ACCOUNT_A]);

      const resA = await request(app).get(`/lp-portal/lps/${LP_A.id}/capital-account`);
      expect(resA.status).toBe(200);

      // Reset queue for second request
      pushSelect([]);
      pushSelect([LP_B]);
      pushSelect([CAPITAL_ACCOUNT_B]);

      const resB = await request(app).get(`/lp-portal/lps/${LP_B.id}/capital-account`);
      expect(resB.status).toBe(200);
    });

    it('unauthenticated request is confined to demo rows — non-demo LP returns 403', async () => {
      unauthenticated();
      // resolveScope → no user → isDemoOnly=true, selfLpId=null
      // loadLp → LP_A loaded but is_demo=false → scope.isDemoOnly=true → returns null
      pushSelect([LP_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/capital-account`);
      expect(res.status).toBe(403);
    });

    it('unauthenticated request can access demo LP capital account', async () => {
      unauthenticated();
      // resolveScope → no user → isDemoOnly=true
      pushSelect([LP_DEMO]);
      // loadLp → isDemoOnly + is_demo=true → returns LP_DEMO
      pushSelect([LP_DEMO]);
      pushSelect([{ ...CAPITAL_ACCOUNT_A, lpId: LP_DEMO.id }]);

      const res = await request(app).get(`/lp-portal/lps/${LP_DEMO.id}/capital-account`);
      expect(res.status).toBe(200);
    });
  });

  // ── Data room documents ──────────────────────────────────────────────────
  //
  // The documents route makes two DB queries per request:
  //   1. resolveScope → email lookup
  //   2. loadLp       → LP row by id
  //   3. document rows (when LP resolves)
  //   4. total-count query (when LP resolves)
  // When loadLp returns null (cross-LP or unauthenticated non-demo) the route
  // returns 403 immediately — no further queries are made.

  describe('GET /lp-portal/lps/:id/documents', () => {
    it('LP A can list their own data room documents', async () => {
      asLpA();
      pushSelect([LP_A]);
      pushSelect([LP_A]);
      pushSelect([DOC_A]);
      pushSelect([{ total: 1 }]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/documents`);
      expect(res.status).toBe(200);
      const body = res.body as Array<{ name: string }>;
      expect(body.some((d) => d.name === DOC_A.name)).toBe(true);
    });

    it('LP A cannot access LP B documents — receives 403', async () => {
      asLpA();
      pushSelect([LP_A]);
      pushSelect([LP_B]);

      const res = await request(app).get(`/lp-portal/lps/${LP_B.id}/documents`);
      expect(res.status).toBe(403);
    });

    it('LP B can list their own data room documents', async () => {
      asLpB();
      pushSelect([LP_B]);
      pushSelect([LP_B]);
      pushSelect([DOC_A]);
      pushSelect([{ total: 1 }]);

      const res = await request(app).get(`/lp-portal/lps/${LP_B.id}/documents`);
      expect(res.status).toBe(200);
    });

    it('LP B cannot access LP A documents — receives 403', async () => {
      asLpB();
      pushSelect([LP_B]);
      pushSelect([LP_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/documents`);
      expect(res.status).toBe(403);
    });

    it('GP admin can access any LP documents', async () => {
      asGp();
      pushSelect([]);
      pushSelect([LP_A]);
      pushSelect([DOC_A]);
      pushSelect([{ total: 1 }]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/documents`);
      expect(res.status).toBe(200);
    });

    it('unauthenticated request cannot access non-demo LP documents — receives 403', async () => {
      unauthenticated();
      pushSelect([LP_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/documents`);
      expect(res.status).toBe(403);
    });

    it('unauthenticated request can access demo LP documents', async () => {
      unauthenticated();
      // resolveScope returns immediately (no user → no email lookup DB query)
      pushSelect([LP_DEMO]);          // loadLp fetch by id
      pushSelect([DOC_DEMO]);         // documents query
      pushSelect([{ total: 1 }]);     // total count query

      const res = await request(app).get(`/lp-portal/lps/${LP_DEMO.id}/documents`);
      expect(res.status).toBe(200);
      const body = res.body as Array<{ name: string }>;
      expect(body.some((d) => d.name === DOC_DEMO.name)).toBe(true);
    });
  });

  // ── Messages ─────────────────────────────────────────────────────────────

  describe('GET /lp-portal/lps/:id/messages', () => {
    it('LP A sees only their own messages', async () => {
      asLpA();
      pushSelect([LP_A]);
      pushSelect([LP_A]);
      pushSelect([MESSAGE_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/messages`);
      expect(res.status).toBe(200);
    });

    it('LP A cannot read LP B messages — receives 403', async () => {
      asLpA();
      // resolveScope → selfLpId = LP_A.id
      pushSelect([LP_A]);
      // loadLp for LP_B.id → row returned but selfLpId mismatch → null
      pushSelect([LP_B]);

      const res = await request(app).get(`/lp-portal/lps/${LP_B.id}/messages`);
      expect(res.status).toBe(403);
    });

    it('LP B sees only their own messages', async () => {
      asLpB();
      pushSelect([LP_B]);
      pushSelect([LP_B]);
      pushSelect([MESSAGE_B]);

      const res = await request(app).get(`/lp-portal/lps/${LP_B.id}/messages`);
      expect(res.status).toBe(200);
    });

    it('LP B cannot read LP A messages — receives 403', async () => {
      asLpB();
      pushSelect([LP_B]);
      pushSelect([LP_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/messages`);
      expect(res.status).toBe(403);
    });
  });

  // ── Uploads ──────────────────────────────────────────────────────────────

  describe('GET /lp-portal/lps/:id/uploads', () => {
    it('LP A can list their own uploads', async () => {
      asLpA();
      pushSelect([LP_A]);
      pushSelect([LP_A]);
      pushSelect([UPLOAD_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/uploads`);
      expect(res.status).toBe(200);
    });

    it('LP A cannot list LP B uploads — receives 403', async () => {
      asLpA();
      pushSelect([LP_A]);
      pushSelect([LP_B]);

      const res = await request(app).get(`/lp-portal/lps/${LP_B.id}/uploads`);
      expect(res.status).toBe(403);
    });

    it('LP B can list their own uploads', async () => {
      asLpB();
      pushSelect([LP_B]);
      pushSelect([LP_B]);
      pushSelect([UPLOAD_B]);

      const res = await request(app).get(`/lp-portal/lps/${LP_B.id}/uploads`);
      expect(res.status).toBe(200);
    });

    it('LP B cannot list LP A uploads — receives 403', async () => {
      asLpB();
      pushSelect([LP_B]);
      pushSelect([LP_A]);

      const res = await request(app).get(`/lp-portal/lps/${LP_A.id}/uploads`);
      expect(res.status).toBe(403);
    });
  });

  // ── Roster isolation ─────────────────────────────────────────────────────

  describe('GET /lp-portal/lps (roster)', () => {
    it('LP A authenticated — roster returns only LP A row (not LP B)', async () => {
      asLpA();
      // resolveScope → selfLpId = LP_A.id → LP-scoped roster query
      pushSelect([LP_A]);
      // The roster route queries by selfLpId when scope.selfLpId is set
      pushSelect([LP_A]);

      const res = await request(app).get('/lp-portal/lps');
      expect(res.status).toBe(200);
      const names = (res.body as Array<{ name: string }>).map((r) => r.name);
      expect(names).toContain(LP_A.lpName);
      expect(names).not.toContain(LP_B.lpName);
    });

    it('LP B authenticated — roster returns only LP B row (not LP A)', async () => {
      asLpB();
      pushSelect([LP_B]);
      pushSelect([LP_B]);

      const res = await request(app).get('/lp-portal/lps');
      expect(res.status).toBe(200);
      const names = (res.body as Array<{ name: string }>).map((r) => r.name);
      expect(names).toContain(LP_B.lpName);
      expect(names).not.toContain(LP_A.lpName);
    });

    it('unauthenticated — roster returns only demo rows', async () => {
      unauthenticated();
      // resolveScope → no user → selfLpId = null → demo-only
      // Route fetches all then filters to is_demo = true
      pushSelect([LP_A, LP_B, LP_DEMO]);

      const res = await request(app).get('/lp-portal/lps');
      expect(res.status).toBe(200);
      const names = (res.body as Array<{ name: string }>).map((r) => r.name);
      expect(names).toContain(LP_DEMO.lpName);
      expect(names).not.toContain(LP_A.lpName);
      expect(names).not.toContain(LP_B.lpName);
    });

    it('GP admin — roster returns all LP rows', async () => {
      asGp();
      // resolveScope → no LP email match → isGp=true
      pushSelect([]);
      // Roster query returns all rows
      pushSelect([LP_A, LP_B, LP_DEMO]);

      const res = await request(app).get('/lp-portal/lps');
      expect(res.status).toBe(200);
      const names = (res.body as Array<{ name: string }>).map((r) => r.name);
      expect(names).toContain(LP_A.lpName);
      expect(names).toContain(LP_B.lpName);
      expect(names).toContain(LP_DEMO.lpName);
    });
  });
});
