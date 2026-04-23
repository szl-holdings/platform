/**
 * lp-portal — email notification tests
 *
 * Covers the three outbound email triggers in the LP portal:
 *   1. Report publish fan-out  (POST /lp-portal/reports/publish)
 *   2. GP message notification  (POST /lp-portal/lps/:id/messages)
 *   3. Document publish fan-out (POST /lp-portal/documents/publish)
 *
 * Also covers the notification-preference GET/PATCH endpoints.
 *
 * All external I/O (DB, email, audit, object storage) is mocked so tests run
 * in isolation with no real network or database access.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared LP fixtures
// ---------------------------------------------------------------------------

const mockLpSubscribed = {
  id: 1,
  lpName: 'Apex Capital LP',
  contactEmail: 'apex@example.com',
  qualifiedEligiblePerson: true,
  metadata: { is_demo: false, join_date: '2023-01-01' },
};

const mockLpOptedOut = {
  id: 2,
  lpName: 'Beta Fund LP',
  contactEmail: 'beta@example.com',
  qualifiedEligiblePerson: false,
  metadata: {
    is_demo: false,
    notification_prefs: { reports: false, documents: false, messages: false },
  },
};

const mockLpDemo = {
  id: 3,
  lpName: 'Demo LP',
  contactEmail: 'demo@example.com',
  qualifiedEligiblePerson: false,
  metadata: { is_demo: true },
};

const mockReport = {
  id: 42,
  reportingPeriod: 'Q3 2025',
  reportType: 'quarterly',
  status: 'distributed',
  distributedAt: new Date(),
  periodStart: '2025-07-01',
  periodEnd: '2025-09-30',
  netIrr: null,
  tvpi: null,
  dpi: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDoc = {
  id: 77,
  name: 'Q3 2025 Board Update.pdf',
  folder: 'Governance',
  fileType: 'pdf',
  sizeLabel: '2.4 MB',
  uploadedAt: 'Oct 15, 2025',
  permissionTier: 'all_lp',
  watermarked: false,
  sourceUri: null,
  uploadedBy: 'gp-user@szlholdings.com',
  isDemo: false,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMessage = {
  id: 99,
  lpId: 1,
  fromRole: 'gp',
  authorName: 'SZL GP Team',
  body: 'Q3 distributions have been processed.',
  isDemo: false,
  sentAt: new Date(),
};

// ---------------------------------------------------------------------------
// Stateful DB mock
//
// selectQueue: responses returned sequentially for each awaited db.select(...)
//              chain (using .then / implicit thenability).
// insertQueue: responses returned sequentially for each db.insert(...).returning().
// updateReturnValue: returned by db.update(...).returning().
// ---------------------------------------------------------------------------

const dbMock = {
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  updateReturnValue: [] as unknown[],
  selectCallIdx: 0,
  insertCallIdx: 0,

  reset() {
    this.selectQueue = [];
    this.insertQueue = [];
    this.updateReturnValue = [];
    this.selectCallIdx = 0;
    this.insertCallIdx = 0;
  },

  nextSelect(): unknown[] {
    return this.selectQueue[this.selectCallIdx++] ?? [];
  },

  nextInsert(): unknown[] {
    return this.insertQueue[this.insertCallIdx++] ?? [];
  },
};

vi.mock('@szl-holdings/db', () => {
  const makeSelectChain = () => {
    const chain: Record<string, unknown> = {};
    Object.assign(chain, {
      from: () => chain,
      where: () => chain,
      innerJoin: () => chain,
      leftJoin: () => chain,
      orderBy: () => chain,
      limit: () => Promise.resolve(dbMock.nextSelect()),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(dbMock.nextSelect()).then(resolve, reject),
    });
    return chain;
  };

  const makeInsertChain = () => {
    const chain: Record<string, unknown> = {};
    Object.assign(chain, {
      values: () => chain,
      returning: () => Promise.resolve(dbMock.nextInsert()),
    });
    return chain;
  };

  const makeUpdateChain = () => {
    const chain: Record<string, unknown> = {};
    Object.assign(chain, {
      set: () => chain,
      where: () => chain,
      returning: () => Promise.resolve(dbMock.updateReturnValue),
    });
    return chain;
  };

  return {
    db: {
      select: makeSelectChain,
      insert: makeInsertChain,
      update: makeUpdateChain,
    },
    fundAccreditedInvestorsTable: {
      id: 'id',
      contactEmail: 'contact_email',
      metadata: 'metadata',
      lpName: 'lp_name',
      qualifiedEligiblePerson: 'qualified_eligible_person',
    },
    fundLpReportsTable: {},
    fundLpDataRoomDocsTable: {},
    fundLpMessagesTable: {},
    fundLpActivityEventsTable: {},
    fundLpCapitalAccountsTable: {},
    fundLpUploadsTable: {},
    fundNavRecordsTable: {},
  };
});

// ---------------------------------------------------------------------------
// Mock: drizzle-orm operators
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
// Mock: email — spy on sendEmail; stub LP email builders
// ---------------------------------------------------------------------------

const sendEmailMock = vi.fn().mockResolvedValue({ success: true, messageId: 'msg-test', provider: 'test' });
const logNotificationAuditMock = vi.fn().mockResolvedValue(undefined);
const generateUnsubscribeTokenMock = vi.fn().mockReturnValue('unsub-token-abc');

vi.mock('../../lib/email', () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
  logNotificationAudit: (...args: unknown[]) => logNotificationAuditMock(...args),
  generateUnsubscribeToken: (...args: unknown[]) => generateUnsubscribeTokenMock(...args),
  buildLpReportPublishedEmail: vi.fn().mockReturnValue({
    subject: 'New report: Q3 2025',
    html: '<p>report html</p>',
    text: 'report text',
  }),
  buildLpGpMessageEmail: vi.fn().mockReturnValue({
    subject: 'New message from your GP',
    html: '<p>message html</p>',
    text: 'message text',
  }),
  buildLpDataRoomDocEmail: vi.fn().mockReturnValue({
    subject: 'New document: Q3 2025 Board Update.pdf',
    html: '<p>doc html</p>',
    text: 'doc text',
  }),
}));

// ---------------------------------------------------------------------------
// Mock: audit (hashIp)
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/audit', () => ({
  hashIp: (_ip: unknown) => 'hashed-ip',
}));

// ---------------------------------------------------------------------------
// Mock: object storage
// ---------------------------------------------------------------------------

vi.mock('../../lib/objectStorage', () => ({
  ObjectStorageService: class {
    getObjectEntityFile = vi.fn().mockResolvedValue({});
    uploadBuffer = vi.fn().mockResolvedValue('/objects/test/file');
  },
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
}));

// ---------------------------------------------------------------------------
// Mock: logger
// ---------------------------------------------------------------------------

const warnMock = vi.fn();
vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: warnMock, error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Mock: contracts/common
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (_shape: unknown) => ({ parse: (v: unknown) => v }),
}));

// ---------------------------------------------------------------------------
// Mock: validation middleware — pass-through in tests
// ---------------------------------------------------------------------------

vi.mock('../../lib/validation', () => ({
  validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  listQuerySchema: {},
}));

// ---------------------------------------------------------------------------
// Mock: api-response helpers
// ---------------------------------------------------------------------------

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
// Mock: middlewares/auth
//
// authMiddleware({ required: true }) → GP user by default (can be overridden per test)
// authMiddleware({ required: false }) → same GP user (optional)
// requireRole → pass-through
// parseIdParam → parseInt
// ---------------------------------------------------------------------------

type MockUser = { id: number; email: string; roles: string[] };
let currentUser: MockUser | null = {
  id: 10,
  email: 'gp@szlholdings.com',
  roles: ['admin'],
};

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
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (s: string) => parseInt(s, 10),
}));

// ---------------------------------------------------------------------------
// Import the real router (after all mocks are set up)
// ---------------------------------------------------------------------------

const { default: lpPortalRouter } = await import('../lp-portal.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(lpPortalRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LP portal — notification emails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmailMock.mockResolvedValue({ success: true, messageId: 'msg-test', provider: 'test' });
    dbMock.reset();
    currentUser = { id: 10, email: 'gp@szlholdings.com', roles: ['admin'] };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Report publish fan-out ────────────────────────────────────────────

  describe('POST /lp-portal/reports/publish — email fan-out', () => {
    it('sends one email per subscribed non-demo LP when a report is published', async () => {
      dbMock.insertQueue.push([mockReport]);
      // LP list query: subscribed LP, opted-out LP, demo LP
      dbMock.selectQueue.push([mockLpSubscribed, mockLpOptedOut, mockLpDemo]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/reports/publish')
        .send({ reportingPeriod: 'Q3 2025', reportType: 'quarterly' });

      expect(res.status).toBe(201);

      // Let background email tasks settle
      await new Promise((resolve) => setImmediate(resolve));

      // Only the subscribed non-demo LP should receive an email
      expect(sendEmailMock).toHaveBeenCalledOnce();
      const [opts] = sendEmailMock.mock.calls[0] as [{ to: string }];
      expect(opts.to).toBe(mockLpSubscribed.contactEmail);
    });

    it('skips LPs that have opted out of report notifications', async () => {
      dbMock.insertQueue.push([mockReport]);
      // Only opted-out LP
      dbMock.selectQueue.push([mockLpOptedOut]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/reports/publish')
        .send({ reportingPeriod: 'Q3 2025' });

      expect(res.status).toBe(201);
      await new Promise((resolve) => setImmediate(resolve));

      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('skips demo LPs regardless of their opt-in status', async () => {
      dbMock.insertQueue.push([mockReport]);
      dbMock.selectQueue.push([mockLpDemo]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/reports/publish')
        .send({ reportingPeriod: 'Q3 2025' });

      expect(res.status).toBe(201);
      await new Promise((resolve) => setImmediate(resolve));

      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('returns notified and skipped counts in the response', async () => {
      dbMock.insertQueue.push([mockReport]);
      dbMock.selectQueue.push([mockLpSubscribed, mockLpOptedOut, mockLpDemo]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/reports/publish')
        .send({ reportingPeriod: 'Q3 2025' });

      expect(res.status).toBe(201);
      expect(res.body.notified).toBe(1);
      expect(res.body.skipped).toBe(2);
    });

    it('still returns 201 even when email delivery fails', async () => {
      sendEmailMock.mockRejectedValue(new Error('SMTP timeout'));
      dbMock.insertQueue.push([mockReport]);
      dbMock.selectQueue.push([mockLpSubscribed]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/reports/publish')
        .send({ reportingPeriod: 'Q3 2025' });

      expect(res.status).toBe(201);
      await new Promise((resolve) => setImmediate(resolve));
      expect(warnMock).toHaveBeenCalledOnce();
    });
  });

  // ── 2. GP message → LP email notification ───────────────────────────────

  describe('POST /lp-portal/lps/:id/messages — GP reply notification', () => {
    beforeEach(() => {
      // resolveScope: GP user not in LP table → [] (no selfLpId)
      // loadLp: returns mockLpSubscribed
      // insert message, insert activity
      dbMock.selectQueue.push([]); // resolveScope: LP email lookup → not found
      dbMock.selectQueue.push([mockLpSubscribed]); // loadLp
      dbMock.insertQueue.push([mockMessage]); // insert message
      dbMock.insertQueue.push([]); // insert activity (fire-and-forget)
    });

    it('sends email to the LP when the GP posts a message and LP has messages pref enabled', async () => {
      const app = buildApp();
      await request(app)
        .post('/lp-portal/lps/1/messages')
        .send({ body: 'Q3 distributions have been processed.', from: 'gp' });

      await new Promise((resolve) => setImmediate(resolve));

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const [opts] = sendEmailMock.mock.calls[0] as [{ to: string }];
      expect(opts.to).toBe(mockLpSubscribed.contactEmail);
    });

    it('does NOT send email when the LP has opted out of message notifications', async () => {
      dbMock.reset();
      dbMock.selectQueue.push([]); // resolveScope
      dbMock.selectQueue.push([mockLpOptedOut]); // loadLp
      dbMock.insertQueue.push([{ ...mockMessage, lpId: 2 }]); // insert message
      dbMock.insertQueue.push([]); // insert activity

      const app = buildApp();
      await request(app)
        .post('/lp-portal/lps/2/messages')
        .send({ body: 'Q3 update.', from: 'gp' });

      await new Promise((resolve) => setImmediate(resolve));

      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('does NOT send email when the message is posted as lp (not gp)', async () => {
      dbMock.reset();
      dbMock.selectQueue.push([]); // resolveScope
      dbMock.selectQueue.push([mockLpSubscribed]); // loadLp
      dbMock.insertQueue.push([{ ...mockMessage, fromRole: 'lp' }]);
      dbMock.insertQueue.push([]);

      // For LP-originated message scope: user is not GP
      currentUser = { id: 1, email: 'apex@example.com', roles: ['lp'] };

      const app = buildApp();
      await request(app)
        .post('/lp-portal/lps/1/messages')
        .send({ body: 'Hello GP, quick question.', from: 'lp' });

      await new Promise((resolve) => setImmediate(resolve));

      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('GP message email includes the portal URL', async () => {
      dbMock.reset();
      dbMock.selectQueue.push([]);
      dbMock.selectQueue.push([mockLpSubscribed]);
      dbMock.insertQueue.push([mockMessage]);
      dbMock.insertQueue.push([]);

      const { buildLpGpMessageEmail } = await import('../../lib/email.js');

      const app = buildApp();
      await request(app)
        .post('/lp-portal/lps/1/messages')
        .send({ body: 'Distributions processed.', from: 'gp' });

      await new Promise((resolve) => setImmediate(resolve));

      expect(buildLpGpMessageEmail).toHaveBeenCalledOnce();
      const [opts] = (buildLpGpMessageEmail as ReturnType<typeof vi.fn>).mock.calls[0] as [
        { portalUrl: string; lpName: string; messagePreview: string },
      ];
      expect(opts.portalUrl).toContain('/fund/lp-portal');
      expect(opts.lpName).toBe(mockLpSubscribed.lpName);
    });
  });

  // ── 3. Document publish fan-out ──────────────────────────────────────────

  describe('POST /lp-portal/documents/publish — email fan-out', () => {
    it('sends email to subscribed LP with eligible tier when a document is published', async () => {
      dbMock.insertQueue.push([mockDoc]);
      // LP list: subscribed (qualified_lp tier, eligible for all_lp doc), opted-out, demo
      dbMock.selectQueue.push([mockLpSubscribed, mockLpOptedOut, mockLpDemo]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/documents/publish')
        .send({
          name: 'Q3 2025 Board Update.pdf',
          folder: 'Governance',
          permissionTier: 'all_lp',
        });

      expect(res.status).toBe(201);
      await new Promise((resolve) => setImmediate(resolve));

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const [opts] = sendEmailMock.mock.calls[0] as [{ to: string }];
      expect(opts.to).toBe(mockLpSubscribed.contactEmail);
    });

    it('skips LPs that have opted out of document notifications', async () => {
      dbMock.insertQueue.push([mockDoc]);
      dbMock.selectQueue.push([mockLpOptedOut]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/documents/publish')
        .send({ name: 'Update.pdf', folder: 'Legal', permissionTier: 'all_lp' });

      expect(res.status).toBe(201);
      await new Promise((resolve) => setImmediate(resolve));

      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('does not fan out emails for gp_only documents', async () => {
      dbMock.insertQueue.push([{ ...mockDoc, permissionTier: 'gp_only' }]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/documents/publish')
        .send({ name: 'GP Only.pdf', folder: 'Internal', permissionTier: 'gp_only' });

      expect(res.status).toBe(201);
      await new Promise((resolve) => setImmediate(resolve));

      // gp_only → no LP tier is eligible → no DB query, no emails
      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('only notifies qualified_lp tier LPs for qualified_lp documents', async () => {
      dbMock.insertQueue.push([{ ...mockDoc, permissionTier: 'qualified_lp' }]);
      // mockLpSubscribed is qualifiedEligiblePerson=true; mockLpOptedOut is false
      dbMock.selectQueue.push([mockLpSubscribed, { ...mockLpOptedOut, metadata: { is_demo: false } }]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/documents/publish')
        .send({ name: 'QEP Memo.pdf', folder: 'Legal', permissionTier: 'qualified_lp' });

      expect(res.status).toBe(201);
      await new Promise((resolve) => setImmediate(resolve));

      // Only the qualified LP (subscribed) should receive the email
      expect(sendEmailMock).toHaveBeenCalledOnce();
      const [opts] = sendEmailMock.mock.calls[0] as [{ to: string }];
      expect(opts.to).toBe(mockLpSubscribed.contactEmail);
    });

    it('returns notified and skipped counts in the response', async () => {
      dbMock.insertQueue.push([mockDoc]);
      dbMock.selectQueue.push([mockLpSubscribed, mockLpOptedOut, mockLpDemo]);

      const app = buildApp();
      const res = await request(app)
        .post('/lp-portal/documents/publish')
        .send({ name: 'Update.pdf', folder: 'Governance', permissionTier: 'all_lp' });

      expect(res.status).toBe(201);
      expect(res.body.notified).toBe(1);
      expect(res.body.skipped).toBe(2);
    });
  });

  // ── 4. Notification preferences GET / PATCH ──────────────────────────────

  describe('GET /lp-portal/lps/:id/notification-preferences', () => {
    it('returns all-enabled defaults when LP has no stored preferences', async () => {
      // resolveScope: not GP (unauthenticated), then loadLp with demo check
      currentUser = null;
      dbMock.selectQueue.push([
        { ...mockLpDemo, id: 1 }, // loadLp returns demo LP (scope allows demo access)
      ]);

      const app = buildApp();
      const res = await request(app).get('/lp-portal/lps/1/notification-preferences');

      // LP with is_demo=true and no notification_prefs → all defaults true
      // (demo LPs are accessible to unauthenticated scope, but returns the LP)
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ reports: true, documents: true, messages: true });
    });

    it('returns stored preferences when the LP has opted out of some channels', async () => {
      dbMock.selectQueue.push([]); // resolveScope: GP user email lookup
      dbMock.selectQueue.push([mockLpOptedOut]); // loadLp

      const app = buildApp();
      const res = await request(app).get('/lp-portal/lps/2/notification-preferences');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ reports: false, documents: false, messages: false });
    });
  });

  describe('PATCH /lp-portal/lps/:id/notification-preferences', () => {
    it('updates a single channel preference and returns the merged result', async () => {
      // loadLp returns subscribed LP with all prefs enabled
      dbMock.selectQueue.push([]); // resolveScope
      dbMock.selectQueue.push([mockLpSubscribed]); // loadLp
      // update returns LP with reports=false, others remain true
      const updatedLp = {
        ...mockLpSubscribed,
        metadata: {
          ...mockLpSubscribed.metadata,
          notification_prefs: { reports: false, documents: true, messages: true },
        },
      };
      dbMock.updateReturnValue = [updatedLp];

      const app = buildApp();
      const res = await request(app)
        .patch('/lp-portal/lps/1/notification-preferences')
        .send({ reports: false });

      expect(res.status).toBe(200);
      expect(res.body.reports).toBe(false);
      expect(res.body.documents).toBe(true);
      expect(res.body.messages).toBe(true);
    });

    it('returns 403 when the LP cannot be found for the scope', async () => {
      dbMock.selectQueue.push([]); // resolveScope → no selfLpId, not GP
      dbMock.selectQueue.push([]); // loadLp → not found
      currentUser = null; // unauthenticated

      const app = buildApp();
      // LP id 999 exists but is not demo; unauthenticated scope sees only demo rows
      const res = await request(app)
        .patch('/lp-portal/lps/999/notification-preferences')
        .send({ messages: false });

      expect(res.status).toBe(403);
    });
  });
});
