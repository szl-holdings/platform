/**
 * LP Portal Data Isolation Tests
 *
 * Uses a smart in-memory repository that genuinely enforces WHERE predicates
 * (via mocked drizzle-orm operators that return predicate functions).
 * Both LP A and LP B are seeded into the store for every test. This proves
 * that each endpoint's scoping correctly excludes cross-LP data: if a WHERE
 * clause is dropped, LP B data surfaces in LP A responses and assertions fail.
 *
 * Coverage:
 *  GET  /lp-portal/lps
 *  GET  /lp-portal/nav-history
 *  GET  /lp-portal/lps/:id/capital-account
 *  GET  /lp-portal/lps/:id/documents
 *  GET  /lp-portal/lps/:id/reports
 *  GET  /lp-portal/lps/:id/messages
 *  POST /lp-portal/lps/:id/messages
 *  GET  /lp-portal/lps/:id/activity
 *  POST /lp-portal/lps/:id/activity
 *  GET  /lp-portal/lps/:id/uploads
 *  POST /lp-portal/lps/:id/uploads
 *  PATCH /lp-portal/uploads/:id/review
 *  POST /lp-portal/reports/publish
 */

import request from 'supertest';
import express, { type Express } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Types ────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;
type Pred = (row: Row) => boolean;

// ─── drizzle-orm mock: operators return predicate functions ───────────────────
// The route calls e.g. eq(table.lpId, lp.id); our mock turns that into a real
// filter function so the in-memory store can enforce it.

vi.mock('drizzle-orm', () => ({
  eq: (col: string, val: unknown): Pred => (row) => row[col] === val,
  ne: (col: string, val: unknown): Pred => (row) => row[col] !== val,
  and: (...preds: Array<Pred | null | undefined>): Pred =>
    (row) => preds.every((p) => typeof p === 'function' ? p(row) : true),
  or: (...preds: Array<Pred | null | undefined>): Pred =>
    (row) => preds.some((p) => typeof p === 'function' ? p(row) : false),
  inArray: (col: string, vals: unknown[]): Pred => (row) => vals.includes(row[col]),
  ilike: (col: string, pattern: string): Pred => {
    const re = new RegExp('^' + pattern.replace(/%/g, '.*') + '$', 'i');
    return (row) => re.test(String(row[col] ?? ''));
  },
  asc: () => null,
  desc: () => null,
  sql: () => null,
  count: () => '__count__',
}));

// ─── In-memory repository ─────────────────────────────────────────────────────

const store = new WeakMap<object, Row[]>();
let _autoId = 0;
const nextId = () => ++_autoId;

function col(dbName: string): string {
  return dbName.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function makeTable(columns: Record<string, string>): Record<string, string> {
  const t: Record<string, string> = {};
  for (const [k, v] of Object.entries(columns)) t[k] = col(v);
  store.set(t, []);
  return t;
}

const getRows = (table: object): Row[] => {
  if (!store.has(table)) store.set(table, []);
  return store.get(table)!;
};

const seedRows = (table: object, rows: Row[]): void => {
  getRows(table).push(...rows);
};

const resetTables = (...tables: object[]): void => {
  for (const t of tables) store.set(t, []);
};

// ─── Table definitions ────────────────────────────────────────────────────────

const fundAccreditedInvestorsTable = makeTable({
  id: 'id', lpName: 'lp_name', lpType: 'lp_type', contactEmail: 'contact_email',
  qualifiedEligiblePerson: 'qualified_eligible_person', verificationStatus: 'verification_status',
  accreditationBasis: 'accreditation_basis', verificationMethod: 'verification_method',
  metadata: 'metadata', createdAt: 'created_at', updatedAt: 'updated_at',
});
const fundLpCapitalAccountsTable = makeTable({
  id: 'id', lpId: 'lp_id', commitmentCents: 'commitment_cents', calledCents: 'called_cents',
  uncalledCents: 'uncalled_cents', distributionsCents: 'distributions_cents',
  currentNavCents: 'current_nav_cents', ownershipPct: 'ownership_pct',
  managementFeesPaidCents: 'management_fees_paid_cents', carriedInterestPaidCents: 'carried_interest_paid_cents',
  vintage: 'vintage', notes: 'notes', metadata: 'metadata', updatedAt: 'updated_at', createdAt: 'created_at',
});
const fundLpMessagesTable = makeTable({
  id: 'id', lpId: 'lp_id', fromRole: 'from_role', authorName: 'author_name',
  body: 'body', isDemo: 'is_demo', metadata: 'metadata', sentAt: 'sent_at',
});
const fundLpActivityEventsTable = makeTable({
  id: 'id', lpId: 'lp_id', action: 'action', target: 'target', documentId: 'document_id',
  reportId: 'report_id', ipAddress: 'ip_address', userAgent: 'user_agent',
  isDemo: 'is_demo', metadata: 'metadata', occurredAt: 'occurred_at',
});
const fundLpDataRoomDocsTable = makeTable({
  id: 'id', name: 'name', folder: 'folder', fileType: 'file_type', sizeLabel: 'size_label',
  uploadedAt: 'uploaded_at', permissionTier: 'permission_tier', watermarked: 'watermarked',
  isDemo: 'is_demo', createdAt: 'created_at',
});
const fundLpReportsTable = makeTable({
  id: 'id', reportType: 'report_type', reportingPeriod: 'reporting_period', status: 'status',
  distributedAt: 'distributed_at', updatedAt: 'updated_at', periodStart: 'period_start',
  periodEnd: 'period_end', netIrr: 'net_irr', tvpi: 'tvpi', dpi: 'dpi', metadata: 'metadata',
});
const fundLpUploadsTable = makeTable({
  id: 'id', lpId: 'lp_id', filename: 'filename', originalName: 'original_name',
  mimeType: 'mime_type', size: 'size', storageKey: 'storage_key', docType: 'doc_type',
  status: 'status', notes: 'notes', isDemo: 'is_demo', uploadedByUserId: 'uploaded_by_user_id',
  reviewedByUserId: 'reviewed_by_user_id', reviewedAt: 'reviewed_at', createdAt: 'created_at',
});
const fundNavRecordsTable = makeTable({
  id: 'id', navDate: 'nav_date', totalNavCents: 'total_nav_cents', distributedCents: 'distributed_cents',
  netIrr: 'net_irr', tvpi: 'tvpi', dpi: 'dpi', metadata: 'metadata',
});

// ─── Smart DB ─────────────────────────────────────────────────────────────────

const db = {
  select: (projection?: unknown) => {
    const isCountQuery =
      projection != null && typeof projection === 'object' &&
      'total' in (projection as object) && (projection as Record<string, unknown>).total === '__count__';
    let rows: Row[] = [];

    const chain = {
      from: (table: object) => { rows = [...getRows(table)]; return chain; },
      where: (pred: unknown) => {
        if (typeof pred === 'function') rows = rows.filter(pred as Pred);
        return chain;
      },
      orderBy: (..._: unknown[]) => chain,
      limit: (n: number) => { rows = rows.slice(0, n); return chain; },
      leftJoin: (_: unknown, __: unknown) => chain,
      innerJoin: (_: unknown, __: unknown) => chain,
      then: (resolve: (v: Row[]) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(isCountQuery ? [{ total: rows.length }] : rows).then(resolve, reject),
    };
    return chain;
  },

  insert: (table: object) => ({
    values: (row: Row) => {
      const newRow: Row = { id: nextId(), ...row };
      getRows(table).push(newRow);
      // Some callers do `.values(...).returning()`; others do `.values(...).catch(...)`.
      // Return a thenable that also exposes `.returning()`.
      const p = Promise.resolve([newRow]);
      return Object.assign(p, { returning: () => p });
    },
  }),

  update: (table: object) => ({
    set: (changes: Row) => ({
      where: (pred: unknown) => ({
        returning: () => {
          const updated: Row[] = [];
          const tableRows = getRows(table);
          for (let i = 0; i < tableRows.length; i++) {
            if (typeof pred === 'function' && (pred as Pred)(tableRows[i])) {
              tableRows[i] = { ...tableRows[i], ...changes };
              updated.push(tableRows[i]);
            }
          }
          return Promise.resolve(updated);
        },
      }),
    }),
  }),
};

// ─── @szl-holdings/db mock ───────────────────────────────────────────────────

vi.mock('@szl-holdings/db', () => ({
  db,
  fundAccreditedInvestorsTable,
  fundLpCapitalAccountsTable,
  fundLpMessagesTable,
  fundLpActivityEventsTable,
  fundLpDataRoomDocsTable,
  fundLpReportsTable,
  fundLpUploadsTable,
  fundNavRecordsTable,
}));

// ─── Other side-effect mocks ──────────────────────────────────────────────────

vi.mock('@szl-holdings/audit', () => ({ hashIp: vi.fn().mockReturnValue('hashed') }));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    startSpan: vi.fn().mockReturnValue({ end: vi.fn(), setStatus: vi.fn() }),
    recordError: vi.fn(), recordAuthFailure: vi.fn(),
  },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/contracts/common', () => ({ bodyShape: (s: unknown) => s }));

vi.mock('../../artifacts/api-server/src/middlewares/auth', () => {
  const authMiddleware = () => (_req: unknown, _res: unknown, next: () => void) => next();
  const requireRole = (...roles: string[]) => (req: unknown, res: unknown, next: () => void) => {
    const user = (req as Record<string, unknown>).user as { roles?: string[] } | undefined;
    const r = res as { status: (n: number) => { json: (b: unknown) => void } };
    if (!user) { r.status(401).json({ error: 'Unauthenticated' }); return; }
    if (!roles.some((role) => user.roles?.includes(role))) { r.status(403).json({ error: 'Forbidden' }); return; }
    next();
  };
  return {
    authMiddleware, requireRole,
    parseIdParam: (id: string) => {
      const n = parseInt(id, 10);
      if (Number.isNaN(n)) throw new Error('InvalidId');
      return n;
    },
    InvalidIdError: class InvalidIdError extends Error {},
  };
});

vi.mock('../../artifacts/api-server/src/lib/email', () => ({
  buildLpGpMessageEmail: vi.fn().mockReturnValue({ subject: '', html: '', text: '' }),
  buildLpReportPublishedEmail: vi.fn().mockReturnValue({ subject: '', html: '', text: '' }),
  generateUnsubscribeToken: vi.fn().mockReturnValue('tok'),
  logNotificationAudit: vi.fn(),
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../../artifacts/api-server/src/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../artifacts/api-server/src/lib/validation', () => ({
  validateBody: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  validateQuery: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  listQuerySchema: {},
}));

vi.mock('../../artifacts/api-server/src/lib/objectStorage', () => ({
  ObjectStorageService: class { getObjectEntityFile = vi.fn().mockResolvedValue({}); },
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
}));

vi.mock('../../artifacts/api-server/src/lib/api-response', async () =>
  vi.importActual('../../artifacts/api-server/src/lib/api-response'),
);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LP_A_ID = 1;
const LP_B_ID = 2;
const LP_A_EMAIL = 'lp-a@alpha.test';
const LP_B_EMAIL = 'lp-b@beta.test';
const GP_EMAIL = 'gp@szl.test';

const LP_A_ROW: Row = {
  id: LP_A_ID, lpName: 'Alpha Capital LLC', contactEmail: LP_A_EMAIL,
  qualifiedEligiblePerson: true, verificationStatus: 'verified',
  metadata: { is_demo: false, join_date: '2023-01-15' },
};
const LP_B_ROW: Row = {
  id: LP_B_ID, lpName: 'Beta Partners Fund', contactEmail: LP_B_EMAIL,
  qualifiedEligiblePerson: false, verificationStatus: 'verified',
  metadata: { is_demo: false, join_date: '2023-06-01' },
};

const ACCT_A: Row = {
  id: 10, lpId: LP_A_ID, commitmentCents: 500_000_000, calledCents: 250_000_000,
  uncalledCents: 250_000_000, distributionsCents: 30_000_000, currentNavCents: 310_000_000,
  ownershipPct: '2.5', managementFeesPaidCents: 5_000_000, carriedInterestPaidCents: 0,
  vintage: '2023', updatedAt: new Date('2024-12-31'), metadata: { units_held: 1000 },
};
const ACCT_B: Row = {
  id: 20, lpId: LP_B_ID, commitmentCents: 100_000_000, calledCents: 50_000_000,
  uncalledCents: 50_000_000, distributionsCents: 0, currentNavCents: 55_000_000,
  ownershipPct: '0.5', managementFeesPaidCents: 1_000_000, carriedInterestPaidCents: 0,
  vintage: '2023', updatedAt: new Date('2024-12-31'), metadata: {},
};

const MSG_A: Row = { id: 10, lpId: LP_A_ID, fromRole: 'gp', authorName: 'GP Team', body: 'LP A update', sentAt: new Date(), isDemo: false };
const MSG_B: Row = { id: 20, lpId: LP_B_ID, fromRole: 'gp', authorName: 'GP Team', body: 'LP B update', sentAt: new Date(), isDemo: false };

const ACT_A: Row = { id: 10, lpId: LP_A_ID, action: 'viewed', target: 'Capital Account', occurredAt: new Date(), isDemo: false };
const ACT_B: Row = { id: 20, lpId: LP_B_ID, action: 'viewed', target: 'Documents', occurredAt: new Date(), isDemo: false };

const UPL_A: Row = { id: 10, lpId: LP_A_ID, originalName: 'wire-a.pdf', mimeType: 'application/pdf', size: 10000, docType: 'wire_confirmation', status: 'received', notes: null, createdAt: new Date(), reviewedAt: null };
const UPL_B: Row = { id: 20, lpId: LP_B_ID, originalName: 'wire-b.pdf', mimeType: 'application/pdf', size: 20000, docType: 'wire_confirmation', status: 'received', notes: null, createdAt: new Date(), reviewedAt: null };

const DOC_1: Row = { id: 1, name: 'Offering Memo.pdf', folder: 'Legal', fileType: 'pdf', sizeLabel: '2 MB', uploadedAt: new Date(), permissionTier: 'all_lps', watermarked: false, isDemo: false, createdAt: new Date() };
const RPT_1: Row = { id: 1, reportingPeriod: 'Q4 2024', reportType: 'quarterly', status: 'distributed', distributedAt: new Date(), updatedAt: new Date(), netIrr: '14.2', tvpi: '1.3', dpi: '0.4', metadata: {} };
const NAV_1: Row = { id: 1, navDate: '2024-12-31', totalNavCents: 1_000_000_000, distributedCents: 50_000_000, netIrr: '14.2', tvpi: '1.3', dpi: '0.4', metadata: { period: 'Q4 2024' } };

const LP_A_USER = { id: 101, displayName: 'Alpha Investor', email: LP_A_EMAIL, roles: ['lp'], orgs: [] };
const LP_B_USER = { id: 102, displayName: 'Beta Investor', email: LP_B_EMAIL, roles: ['lp'], orgs: [] };
const GP_USER = { id: 1, displayName: 'GP Admin', email: GP_EMAIL, roles: ['admin'], orgs: [] };

const ALL_TABLES = [
  fundAccreditedInvestorsTable,
  fundLpCapitalAccountsTable,
  fundLpMessagesTable,
  fundLpActivityEventsTable,
  fundLpDataRoomDocsTable,
  fundLpReportsTable,
  fundLpUploadsTable,
  fundNavRecordsTable,
];

// ─── App builder ──────────────────────────────────────────────────────────────

async function buildApp(user: Record<string, unknown> | null): Promise<Express> {
  const app = express();
  app.use(express.json());
  if (user) {
    app.use((req, _res, next) => {
      (req as unknown as Record<string, unknown>).user = user;
      next();
    });
  }
  const router = (await import('../../artifacts/api-server/src/routes/lp-portal')).default;
  app.use('/api', router);
  return app;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LP Portal — data isolation', () => {
  beforeEach(() => {
    resetTables(...ALL_TABLES);
    // Seed BOTH LP A and LP B so WHERE-predicate enforcement is meaningful:
    // dropping a filter would cause LP B data to appear in LP A responses.
    seedRows(fundAccreditedInvestorsTable, [LP_A_ROW, LP_B_ROW]);
    seedRows(fundLpCapitalAccountsTable, [ACCT_A, ACCT_B]);
    seedRows(fundLpMessagesTable, [MSG_A, MSG_B]);
    seedRows(fundLpActivityEventsTable, [ACT_A, ACT_B]);
    seedRows(fundLpUploadsTable, [UPL_A, UPL_B]);
    seedRows(fundLpDataRoomDocsTable, [DOC_1]);
    seedRows(fundLpReportsTable, [RPT_1]);
    seedRows(fundNavRecordsTable, [NAV_1]);
  });

  // ── 1. LP A reads their own data ────────────────────────────────────────────
  // Both LPs are in the store; WHERE predicates filter to LP A only.

  describe('1 — LP A reads own data (both LPs seeded; LP B absent from all responses)', () => {
    it('GET /lp-portal/lps — roster returns LP A only', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app).get('/api/lp-portal/lps');
      expect(res.status).toBe(200);
      const ids = (res.body.data ?? res.body).map((r: { id: number }) => r.id);
      expect(ids).toContain(LP_A_ID);
      expect(ids).not.toContain(LP_B_ID);
    });

    it('GET /lp-portal/nav-history — public fund NAV history', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app).get('/api/lp-portal/nav-history');
      expect(res.status).toBe(200);
      expect((res.body.data ?? res.body).length).toBeGreaterThan(0);
    });

    it('GET /lp-portal/lps/:id/capital-account — LP A account returned (LP B account excluded)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_A_ID}/capital-account`);
      expect(res.status).toBe(200);
      const body: { lpId: number; commitmentCents: number } = res.body.data ?? res.body;
      expect(body.lpId).toBe(LP_A_ID);
      expect(body.commitmentCents).toBe(ACCT_A.commitmentCents);
    });

    it('GET /lp-portal/lps/:id/messages — only LP A messages (LP B msg id absent)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_A_ID}/messages`);
      expect(res.status).toBe(200);
      const msgs: Array<{ id: number }> = res.body.data ?? res.body;
      expect(msgs.map((m) => m.id)).toContain(MSG_A.id);
      expect(msgs.map((m) => m.id)).not.toContain(MSG_B.id);
    });

    it('GET /lp-portal/lps/:id/activity — only LP A events (LP B event id absent)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_A_ID}/activity`);
      expect(res.status).toBe(200);
      const events: Array<{ id: number }> = res.body.data ?? res.body;
      expect(events.map((e) => e.id)).toContain(ACT_A.id);
      expect(events.map((e) => e.id)).not.toContain(ACT_B.id);
    });

    it('GET /lp-portal/lps/:id/uploads — only LP A uploads (LP B upload id absent)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_A_ID}/uploads`);
      expect(res.status).toBe(200);
      const uploads: Array<{ id: number }> = res.body.data ?? res.body;
      expect(uploads.map((u) => u.id)).toContain(UPL_A.id);
      expect(uploads.map((u) => u.id)).not.toContain(UPL_B.id);
    });

    it('GET /lp-portal/lps/:id/documents — 200 (docs are fund-wide, access gated by loadLp)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_A_ID}/documents`);
      expect(res.status).toBe(200);
    });

    it('GET /lp-portal/lps/:id/reports — 200', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_A_ID}/reports`);
      expect(res.status).toBe(200);
    });

    it('POST /lp-portal/lps/:id/messages — LP A posts own message (201)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app)
        .post(`/api/lp-portal/lps/${LP_A_ID}/messages`)
        .send({ body: 'Question about Q4', from: 'lp' });
      expect(res.status).toBe(201);
    });

    it('POST /lp-portal/lps/:id/activity — LP A logs own event (201)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app)
        .post(`/api/lp-portal/lps/${LP_A_ID}/activity`)
        .send({ action: 'viewed', target: 'Capital Account' });
      expect(res.status).toBe(201);
    });

    it('POST /lp-portal/lps/:id/uploads — LP A submits own upload (201)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app)
        .post(`/api/lp-portal/lps/${LP_A_ID}/uploads`)
        .send({ originalName: 'wire.pdf', mimeType: 'application/pdf', size: 10000, docType: 'wire_confirmation', storageKey: 'uploads/wire.pdf' });
      expect(res.status).toBe(201);
    });
  });

  // ── 2. LP A is blocked from every LP B endpoint ──────────────────────────────
  // LP B is in the store with id=LP_B_ID. loadLp(LP_B_ID, scope) fetches LP_B
  // from store; scope.selfLpId=LP_A_ID ≠ lp.id=LP_B_ID → null → 403.

  describe('2 — LP A cannot access any LP B endpoint (403 for all nine routes)', () => {
    const blocked = async (method: 'get' | 'post', path: string, body?: object) => {
      const app = await buildApp(LP_A_USER);
      const req = request(app)[method](`/api${path}`);
      if (body) req.send(body);
      return req;
    };

    it('GET  capital-account → 403', async () => expect((await blocked('get', `/lp-portal/lps/${LP_B_ID}/capital-account`)).status).toBe(403));
    it('GET  documents       → 403', async () => expect((await blocked('get', `/lp-portal/lps/${LP_B_ID}/documents`)).status).toBe(403));
    it('GET  reports         → 403', async () => expect((await blocked('get', `/lp-portal/lps/${LP_B_ID}/reports`)).status).toBe(403));
    it('GET  messages        → 403', async () => expect((await blocked('get', `/lp-portal/lps/${LP_B_ID}/messages`)).status).toBe(403));
    it('POST messages        → 403', async () => expect((await blocked('post', `/lp-portal/lps/${LP_B_ID}/messages`, { body: 'Hi', from: 'lp' })).status).toBe(403));
    it('GET  activity        → 403', async () => expect((await blocked('get', `/lp-portal/lps/${LP_B_ID}/activity`)).status).toBe(403));
    it('POST activity        → 403', async () => expect((await blocked('post', `/lp-portal/lps/${LP_B_ID}/activity`, { action: 'viewed', target: 'Doc' })).status).toBe(403));
    it('GET  uploads         → 403', async () => expect((await blocked('get', `/lp-portal/lps/${LP_B_ID}/uploads`)).status).toBe(403));
    it('POST uploads         → 403', async () => expect((await blocked('post', `/lp-portal/lps/${LP_B_ID}/uploads`, { originalName: 'x.pdf' })).status).toBe(403));

    it('cross-check: LP B cannot access LP A endpoints', async () => {
      const app = await buildApp(LP_B_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_A_ID}/capital-account`);
      expect(res.status).toBe(403);
    });
  });

  // ── 3. loadLp() validates the store-returned record's id ─────────────────────
  // Authenticated as LP A (selfLpId=LP_A_ID). Request targets LP_B_ID.
  // loadLp fetches the LP_B row from the store; scope check 1 ≠ 2 → null → 403.

  describe('3 — loadLp() validates record identity against resolved scope', () => {
    it('returns 403 when requesting LP B id while authenticated as LP A', async () => {
      const app = await buildApp(LP_A_USER);
      // beforeEach already seeds both LPs; LP_B is in the store with id=LP_B_ID.
      // resolveScope: email=LP_A_EMAIL → selfLpId=LP_A_ID(1).
      // loadLp(LP_B_ID=2): fetches row with id=2 → scope.selfLpId=1 ≠ 2 → 403.
      const res = await request(app).get(`/api/lp-portal/lps/${LP_B_ID}/capital-account`);
      expect(res.status).toBe(403);
    });
  });

  // ── 4. GP user has full access ────────────────────────────────────────────────

  describe('4 — GP user sees all LP data without restriction', () => {
    it('GET /lp-portal/lps — roster contains both LP A and LP B', async () => {
      const app = await buildApp(GP_USER);
      const res = await request(app).get('/api/lp-portal/lps');
      expect(res.status).toBe(200);
      const ids = (res.body.data ?? res.body).map((r: { id: number }) => r.id);
      expect(ids).toContain(LP_A_ID);
      expect(ids).toContain(LP_B_ID);
    });

    it('GET /lp-portal/lps/:id/capital-account — GP reads LP A (200)', async () => {
      const app = await buildApp(GP_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_A_ID}/capital-account`);
      expect(res.status).toBe(200);
      expect((res.body.data ?? res.body).lpId).toBe(LP_A_ID);
    });

    it('GET /lp-portal/lps/:id/capital-account — GP reads LP B (200)', async () => {
      const app = await buildApp(GP_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_B_ID}/capital-account`);
      expect(res.status).toBe(200);
      expect((res.body.data ?? res.body).lpId).toBe(LP_B_ID);
    });

    it('GET /lp-portal/lps/:id/messages — GP reads LP B messages', async () => {
      const app = await buildApp(GP_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_B_ID}/messages`);
      expect(res.status).toBe(200);
      const ids = (res.body.data ?? res.body).map((m: { id: number }) => m.id);
      expect(ids).toContain(Number(MSG_B.id));
    });

    it('GET /lp-portal/lps/:id/uploads — GP reads LP B uploads', async () => {
      const app = await buildApp(GP_USER);
      const res = await request(app).get(`/api/lp-portal/lps/${LP_B_ID}/uploads`);
      expect(res.status).toBe(200);
      expect((res.body.data ?? res.body)[0].id).toBe(UPL_B.id);
    });

    it('PATCH /lp-portal/uploads/:id/review — GP approves upload (200)', async () => {
      const app = await buildApp(GP_USER);
      const res = await request(app)
        .patch(`/api/lp-portal/uploads/${UPL_A.id}/review`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(200);
      expect((res.body.data ?? res.body).status).toBe('accepted');
    });

    it('PATCH /lp-portal/uploads/:id/review — LP role is denied (403)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app)
        .patch(`/api/lp-portal/uploads/${UPL_A.id}/review`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(403);
    });

    it('POST /lp-portal/reports/publish — GP publishes report (201)', async () => {
      const app = await buildApp(GP_USER);
      const res = await request(app)
        .post('/api/lp-portal/reports/publish')
        .send({ reportingPeriod: 'Q4 2024' });
      expect(res.status).toBe(201);
    });

    it('POST /lp-portal/reports/publish — LP role is denied (403)', async () => {
      const app = await buildApp(LP_A_USER);
      const res = await request(app)
        .post('/api/lp-portal/reports/publish')
        .send({ reportingPeriod: 'Q4 2024' });
      expect(res.status).toBe(403);
    });
  });

  // ── 5. Unauthenticated callers see only demo rows ─────────────────────────────

  describe('5 — Unauthenticated callers scoped to is_demo=true', () => {
    it('GET /lp-portal/lps — demo filter applied; real LP B absent from response', async () => {
      const app = await buildApp(null);
      // Add a demo LP alongside the real LP_B seeded in beforeEach
      seedRows(fundAccreditedInvestorsTable, [
        { id: 99, lpName: 'Demo LP', contactEmail: 'demo@szl.test', qualifiedEligiblePerson: false, metadata: { is_demo: true } },
      ]);

      const res = await request(app).get('/api/lp-portal/lps');

      expect(res.status).toBe(200);
      const rows: Array<{ id: number; isDemo: boolean }> = res.body.data ?? res.body;
      // Application-level is_demo filter must exclude LP_A and LP_B
      expect(rows.every((r) => r.isDemo)).toBe(true);
      expect(rows.map((r) => r.id)).not.toContain(LP_A_ID);
      expect(rows.map((r) => r.id)).not.toContain(LP_B_ID);
    });

    it('GET /lp-portal/lps/:id/capital-account — 403 for a non-demo LP', async () => {
      const app = await buildApp(null);
      // isDemoOnly=true; LP_B.metadata.is_demo=false → loadLp returns null → 403
      const res = await request(app).get(`/api/lp-portal/lps/${LP_B_ID}/capital-account`);
      expect(res.status).toBe(403);
    });
  });
});
