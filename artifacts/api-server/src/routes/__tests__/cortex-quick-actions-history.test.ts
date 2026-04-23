/**
 * GET /cortex/quick-actions/history — integration test
 *
 * Mobile audit-trail view: returns recently resolved (approved/rejected)
 * approval requests for the caller's org, formatted for the Quick Action
 * decision-history screen. Defense-in-depth: callers with no org membership
 * receive an empty list, never another tenant's data.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let _currentUser: {
  id: number;
  displayName: string;
  email: string;
  roles: string[];
  orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>;
} = {
  id: 1,
  displayName: 'Alice',
  email: 'alice@org42.example',
  roles: ['member'],
  orgs: [{ orgId: 42, orgSlug: 'org42', orgName: 'Org 42', role: 'member' }],
};

const listApprovalsMock = vi.fn();

vi.mock('@szl-holdings/covenant-policy', () => ({
  listApprovals: (...args: unknown[]) => listApprovalsMock(...args),
  listPendingApprovals: vi.fn().mockResolvedValue([]),
  reviewApproval: vi.fn(),
  getApprovalById: vi.fn(),
}));

vi.mock('@szl-holdings/db', () => {
  const col = (name: string) => ({ _colName: name });
  return {
    db: {
      select() {
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: () => chain,
          orderBy: () => chain,
          limit: () => chain,
          offset: () => Promise.resolve([]),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve([]).then(resolve, reject),
        };
        return chain;
      },
      insert() {
        return { values: () => ({ returning: () => Promise.resolve([]) }) };
      },
      update() {
        return {
          set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
        };
      },
      delete() {
        return { where: () => Promise.resolve([]) };
      },
    },
    cortexGraphSnapshotsTable: { id: col('id') },
    cortexActionDraftsTable: { id: col('id'), orgId: col('org_id'), status: col('status'), alertId: col('alert_id') },
    dailyBriefingsTable: { briefingDate: col('briefing_date'), generatedAt: col('generated_at') },
    alloyAuditLogTable: {},
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  inArray: (col: unknown, vals: unknown) => ({ op: 'inArray', col, vals }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ op: 'sql', strings, values }),
    { raw: (s: string) => s },
  ),
  gt: (col: unknown, val: unknown) => ({ op: 'gt', col, val }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  lte: (col: unknown, val: unknown) => ({ op: 'lte', col, val }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
      (req as unknown as { user: typeof _currentUser }).user = _currentUser;
      next();
    },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  InvalidIdError: class InvalidIdError extends Error {},
}));

vi.mock('../../middlewares/sliding-window-limiter', () => ({
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/ai-engine', () => ({
  fusionCortex: { getAlerts: () => [], getStats: () => ({}) },
  ontologyEngine: {
    getDomainEntities: async () => [],
    getEntityConnections: async () => ({ outgoing: [], incoming: [] }),
    getGraphStats: async () => ({ totalEntities: 0, totalRelationships: 0 }),
  },
}));

vi.mock('../../lib/multi-agent-orchestrator', () => ({
  orchestrate: async () => ({}),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

vi.mock('../../lib/export-service', () => ({ runExport: vi.fn() }));

vi.mock('../../services/cortex-graph-snapshot', () => ({
  captureGraphSnapshot: vi.fn(),
}));

let _app: express.Application | null = null;
async function getApp(): Promise<express.Application> {
  if (_app) return _app;
  const { default: cortexRouter } = await import('../cortex.js');
  _app = express();
  _app.use(express.json());
  _app.use(cortexRouter);
  return _app;
}

beforeEach(() => {
  listApprovalsMock.mockReset();
});

describe('GET /cortex/quick-actions/history', () => {
  it('returns recently resolved approvals scoped to the caller org', async () => {
    const approvedAt = new Date(Date.now() - 5 * 60_000);
    const rejectedAt = new Date(Date.now() - 90 * 60_000);
    listApprovalsMock.mockResolvedValueOnce([
      {
        id: 101,
        orgId: 42,
        resourceType: 'wire-transfer',
        resourceId: 'WT-42-101',
        title: 'Wire Transfer Authorization · $2.4M',
        description: 'Capital call drawdown for Q2 LP commitments.',
        actionClass: 'authorize',
        priority: 'critical',
        status: 'approved',
        requestedById: 7,
        requestedByRole: 'CFO',
        approvedById: 1,
        approvedAt,
        rejectedById: null,
        rejectedAt: null,
      },
      {
        id: 102,
        orgId: 42,
        resourceType: 'patch-deploy',
        resourceId: 'PT-42-102',
        title: 'Critical CVE Patch Deploy',
        description: 'CVE-2026-1182 — emergency rollout deferred.',
        actionClass: 'acknowledge',
        priority: 'high',
        status: 'rejected',
        requestedById: 9,
        requestedByRole: 'PARAGON SOC',
        approvedById: null,
        approvedAt: null,
        rejectedById: 1,
        rejectedAt,
      },
    ]);

    const app = await getApp();
    const res = await request(app).get('/cortex/quick-actions/history?limit=10');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items).toHaveLength(2);

    expect(listApprovalsMock).toHaveBeenCalledTimes(1);
    const callArg = listApprovalsMock.mock.calls[0]?.[0] as {
      orgId: number;
      statuses: string[];
      limit: number;
    };
    expect(callArg.orgId).toBe(42);
    expect(callArg.statuses).toEqual(['approved', 'rejected']);
    expect(callArg.limit).toBe(10);
    // Decision-history must surface the most recently actioned items first,
    // not the most recently created. Confirm the route requests decided-at
    // ordering from the lib so old-but-late-actioned approvals do not bury
    // fresh decisions.
    expect((callArg as unknown as { orderBy?: string }).orderBy).toBe('decidedAt');
    // Per-user scoping: an executive sees only the decisions THEY made, not
    // every resolved approval in the org. The route must pass the caller's
    // user id through to the lib so the SQL adds `WHERE approved_by = $uid OR
    // rejected_by = $uid`.
    expect((callArg as unknown as { decidedByUserId?: number }).decidedByUserId).toBe(1);

    const [first, second] = res.body.items as Array<Record<string, unknown>>;
    expect(first.id).toBe('101');
    expect(first.decision).toBe('approved');
    expect(first.title).toBe('Wire Transfer Authorization · $2.4M');
    expect(first.requester).toBe('CFO');
    expect(first.decidedAt).toBe(approvedAt.toISOString());
    expect(typeof first.decidedAtRelative).toBe('string');
    expect(first.priority).toBe('critical');

    expect(second.id).toBe('102');
    expect(second.decision).toBe('rejected');
    expect(second.decidedAt).toBe(rejectedAt.toISOString());
  });

  it('returns an empty list when the non-admin caller has no org membership', async () => {
    const previousUser = _currentUser;
    _currentUser = { ...previousUser, orgs: [] };
    try {
      const app = await getApp();
      const res = await request(app).get('/cortex/quick-actions/history');
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.total).toBe(0);
      expect(listApprovalsMock).not.toHaveBeenCalled();
    } finally {
      _currentUser = previousUser;
    }
  });

  it('does not pass an orgId or per-user filter for admin callers (cross-tenant audit)', async () => {
    const previousUser = _currentUser;
    _currentUser = {
      ...previousUser,
      roles: ['super_admin'],
      orgs: [{ orgId: 42, orgSlug: 'org42', orgName: 'Org 42', role: 'admin' }],
    };
    listApprovalsMock.mockResolvedValueOnce([]);
    try {
      const app = await getApp();
      const res = await request(app).get('/cortex/quick-actions/history');
      expect(res.status).toBe(200);
      expect(listApprovalsMock).toHaveBeenCalledTimes(1);
      const callArg = listApprovalsMock.mock.calls[0]?.[0] as {
        orgId?: number;
        statuses: string[];
        decidedByUserId?: number;
      };
      expect(callArg.orgId).toBeUndefined();
      expect(callArg.statuses).toEqual(['approved', 'rejected']);
      // Admins/super-admins intentionally see all decisions for audit review,
      // not just their own — so the per-user filter must NOT be set.
      expect(callArg.decidedByUserId).toBeUndefined();
    } finally {
      _currentUser = previousUser;
    }
  });

  it('clamps the requested limit to a maximum of 100', async () => {
    listApprovalsMock.mockResolvedValueOnce([]);
    const app = await getApp();
    await request(app).get('/cortex/quick-actions/history?limit=500');
    const callArg = listApprovalsMock.mock.calls[0]?.[0] as { limit: number };
    expect(callArg.limit).toBe(100);
  });

  it('rejects an obviously invalid limit query before reaching the lib', async () => {
    const app = await getApp();
    const res = await request(app).get('/cortex/quick-actions/history?limit=not-a-number');
    expect(res.status).toBe(400);
    expect(listApprovalsMock).not.toHaveBeenCalled();
  });

  it('falls back to the default limit of 50 when limit query is omitted', async () => {
    listApprovalsMock.mockResolvedValueOnce([]);
    const app = await getApp();
    const res = await request(app).get('/cortex/quick-actions/history');
    expect(res.status).toBe(200);
    const callArg = listApprovalsMock.mock.calls[0]?.[0] as { limit: number };
    expect(callArg.limit).toBe(50);
  });
});
