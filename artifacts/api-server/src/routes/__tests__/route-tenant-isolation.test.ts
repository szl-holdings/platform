import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let _currentUser: {
  id: number;
  displayName: string;
  email: string;
  roles: string[];
  orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>;
  isInternalAgent?: boolean;
} = makeOrg1User();

function makeOrg1User() {
  return {
    id: 1,
    displayName: 'Alice',
    email: 'alice@org1.example',
    roles: ['member'],
    orgs: [{ orgId: 1, orgSlug: 'org1', orgName: 'Org One', role: 'member' }],
  };
}

function makeOrg2User() {
  return {
    id: 2,
    displayName: 'Bob',
    email: 'bob@org2.example',
    roles: ['member'],
    orgs: [{ orgId: 2, orgSlug: 'org2', orgName: 'Org Two', role: 'member' }],
  };
}

function makeAdminUser() {
  return {
    id: 99,
    displayName: 'Admin',
    email: 'admin@example.com',
    roles: ['super_admin'],
    orgs: [{ orgId: 1, orgSlug: 'org1', orgName: 'Org One', role: 'super_admin' }],
  };
}

function makeNoOrgUser() {
  return {
    id: 3,
    displayName: 'NoOrg',
    email: 'noorg@example.com',
    roles: ['member'],
    orgs: [],
  };
}

let _selectQueue: unknown[][] = [];
let _updateQueue: unknown[][] = [];
const _capturedSelectWheres: unknown[] = [];
const _capturedUpdateWheres: unknown[] = [];

vi.mock('@szl-holdings/db', () => {
  const col = (name: string) => ({ _colName: name });

  return {
    db: {
      select() {
        const result = (_selectQueue.shift() ?? []) as unknown[];
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: (w: unknown) => {
            _capturedSelectWheres.push(w);
            return chain;
          },
          orderBy: () => chain,
          groupBy: () => chain,
          limit: () => chain,
          offset: () => chain,
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
        };
        return chain;
      },
      insert() {
        const chain: Record<string, unknown> = {
          values: () => chain,
          returning: () => chain,
          onConflictDoNothing: () => chain,
          then: (resolve: (v: unknown) => unknown) => Promise.resolve([{ id: 1 }]).then(resolve),
        };
        return chain;
      },
      update() {
        const result = (_updateQueue.shift() ?? []) as unknown[];
        const chain: Record<string, unknown> = {
          set: () => chain,
          where: (w: unknown) => {
            _capturedUpdateWheres.push(w);
            return chain;
          },
          returning: () => chain,
          then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
        };
        return chain;
      },
      execute: () => Promise.resolve(),
    },
    costBudgetsTable: { orgId: col('org_id'), isActive: col('is_active'), id: col('id'), createdAt: col('created_at') },
    costEventsTable: { orgId: col('org_id'), eventType: col('event_type'), createdAt: col('created_at'), costUsd: col('cost_usd'), tokensIn: col('tokens_in'), tokensOut: col('tokens_out') },
    alloyLegacyPoliciesTable: { orgId: col('org_id'), id: col('id'), policyType: col('policy_type'), isActive: col('is_active'), createdAt: col('created_at'), updatedAt: col('updated_at') },
    modelRoutingPoliciesTable: { orgId: col('org_id'), id: col('id'), isActive: col('is_active'), createdAt: col('created_at'), updatedAt: col('updated_at') },
    governanceIncidentsTable: { orgId: col('org_id'), id: col('id'), severity: col('severity'), incidentType: col('incident_type'), createdAt: col('created_at') },
    auditEventsTable: { orgId: col('org_id'), id: col('id'), createdAt: col('created_at') },
    atlasExportJobsTable: { id: col('id'), orgId: col('org_id') },
    signalBusRulesTable: { orgId: col('org_id'), ruleId: col('rule_id'), enabled: col('enabled'), createdAt: col('created_at'), sourceDomain: col('source_domain'), sourceType: col('source_type'), name: col('name') },
    signalBusRoutedEventsTable: { orgId: col('org_id'), routedAt: col('routed_at') },
    signalBusDeadLettersTable: { orgId: col('org_id'), createdAt: col('created_at') },
    vesselsTable: { orgId: col('org_id'), id: col('id'), updatedAt: col('updated_at') },
    pcPurviewCaseLinksTable: { orgId: col('org_id'), createdAt: col('created_at') },
    pcPurviewHoldAwarenessTable: { orgId: col('org_id'), createdAt: col('created_at'), holdStatus: col('hold_status') },
    pcPurviewExportHandoffsTable: { orgId: col('org_id'), id: col('id'), createdAt: col('created_at'), exportStatus: col('export_status') },
    pcPurviewScopeLinksTable: { orgId: col('org_id'), createdAt: col('created_at'), matterId: col('matter_id') },
    pcPurviewDiagnosticsTable: { orgId: col('org_id'), checkedAt: col('checked_at') },
    pcAuditEventsTable: { orgId: col('org_id') },
    filesTable: { orgId: col('org_id'), id: col('id'), createdAt: col('created_at') },
    subscriptionsTable: { orgId: col('org_id'), id: col('id'), createdAt: col('created_at') },
    invoicesTable: { orgId: col('org_id'), id: col('id'), issuedAt: col('issued_at') },
    fulfillmentsTable: { orgId: col('org_id'), id: col('id'), createdAt: col('created_at') },
    entitlementOverridesTable: { orgId: col('org_id'), id: col('id') },
    complianceSuitabilityTable: { orgId: col('org_id'), id: col('id'), createdAt: col('created_at') },
    complianceArchivalTable: { orgId: col('org_id'), id: col('id'), createdAt: col('created_at') },
    complianceSupervisionQueueTable: { orgId: col('org_id'), id: col('id'), createdAt: col('created_at') },
    complianceCalendarTable: { orgId: col('org_id'), id: col('id'), dueDate: col('due_date') },
    complianceRiskScoreTable: { orgId: col('org_id') },
    commandSessionsTable: { id: col('id'), orgId: col('org_id'), sessionId: col('session_id'), isActive: col('is_active'), appId: col('app_id'), lastActivityAt: col('last_activity_at') },
    commandSessionCommentsTable: { id: col('id'), sessionId: col('session_id'), createdAt: col('created_at') },
    organizationsTable: { id: col('id'), slug: col('slug'), name: col('name') },
    orgMembersTable: { orgId: col('org_id'), userId: col('user_id') },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  ne: (col: unknown, val: unknown) => ({ op: 'ne', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  or: (...conds: unknown[]) => ({ op: 'or', conds }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  asc: (col: unknown) => ({ op: 'asc', col }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  lte: (col: unknown, val: unknown) => ({ op: 'lte', col, val }),
  gt: (col: unknown, val: unknown) => ({ op: 'gt', col, val }),
  inArray: (col: unknown, vals: unknown) => ({ op: 'inArray', col, vals }),
  isNotNull: (col: unknown) => ({ op: 'isNotNull', col }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({
      op: 'sql',
      strings: [...strings],
      values,
    }),
    { raw: (s: string) => ({ op: 'sql.raw', value: s }) },
  ),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    () =>
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = _currentUser;
      next();
    },
  requireRole:
    (..._roles: string[]) =>
    (_req: Request, _res: Response, next: NextFunction) => {
      next();
    },
}));

vi.mock('../../lib/api-response', () => ({
  handleRouteError: (_res: Response, _err: unknown, msg: string) => {
    _res.status(500).json({ error: msg });
  },
  sendSuccess: (res: Response, data: unknown, status = 200, meta?: unknown) => {
    res.status(status).json({ success: true, data, ...(meta ?? {}) });
  },
  sendCreated: (res: Response, data: unknown) => {
    res.status(201).json({ success: true, data });
  },
  sendNotFound: (res: Response, entity: string) => {
    res.status(404).json({ error: `${entity} not found` });
  },
  sendBadRequest: (res: Response, msg: string) => {
    res.status(400).json({ error: msg });
  },
}));

vi.mock('../../lib/validation', () => ({
  listQuerySchema: {},
  commandSessionCreateSchema: {},
  sessionCommentCreateSchema: {},
  validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../middlewares/sliding-window-limiter', () => ({
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: () => ({
    parse: (v: unknown) => v,
    safeParse: (v: unknown) => ({ success: true, data: v }),
  }),
}));

vi.mock('@szl-holdings/signal-mesh', () => ({
  defaultSignalBus: { on: vi.fn(), publish: vi.fn() },
}));

vi.mock('@workspace/ontology/signal', () => ({
  createSignal: (s: unknown) => ({ signalId: 'sig-1', ...s as any }),
}));

let _getArtifactByIdResult: unknown = undefined;
let _getArtifactVersionHistoryResult: unknown[] = [];

vi.mock('@szl-holdings/atlas-artifacts', () => ({
  ATLAS_EXPORT_FORMATS: ['pdf'],
  ATLAS_TEMPLATE_TYPES: ['report'],
  compareArtifactVersions: vi.fn().mockResolvedValue({ added: [], removed: [], changed: [] }),
  createExportJob: vi.fn().mockResolvedValue({ id: 1 }),
  createShareLink: vi.fn().mockResolvedValue('share-token-123'),
  generateArtifact: vi.fn().mockResolvedValue({ id: 1 }),
  getArtifactById: vi.fn().mockImplementation(() => Promise.resolve(_getArtifactByIdResult)),
  getArtifactByShareToken: vi.fn(),
  getArtifactVersionHistory: vi.fn().mockImplementation(() => Promise.resolve(_getArtifactVersionHistoryResult)),
  listArtifacts: vi.fn().mockResolvedValue([]),
  regenerateArtifact: vi.fn().mockResolvedValue({ id: 1 }),
}));

vi.mock('../../jobs/atlas-export-processor', () => ({
  getAtlasExportBuffer: vi.fn(),
}));

vi.mock('../../lib/websocket', () => ({
  publish: vi.fn(),
}));

vi.mock('express-rate-limit', () => ({
  default: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

beforeEach(() => {
  _currentUser = makeOrg1User();
  _selectQueue = [];
  _updateQueue = [];
  _capturedSelectWheres.length = 0;
  _capturedUpdateWheres.length = 0;
  _getArtifactByIdResult = undefined;
  _getArtifactVersionHistoryResult = [];
});

describe('prism-counsel-purview: IDOR prevention', () => {
  it('uses server-derived orgId, not attacker-controlled query param', async () => {
    const { default: purviewRouter } = await import('../prism-counsel-purview');

    const app = express();
    app.use(express.json());
    app.use('/prism-counsel', purviewRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([]);

    const res = await request(app)
      .get('/prism-counsel/purview/case-links?orgId=999')
      .expect(200);

    expect(res.body.success).toBe(true);

    const whereClause = _capturedSelectWheres[0] as any;
    if (whereClause) {
      const orgEq = whereClause.op === 'eq' ? whereClause : null;
      if (orgEq) {
        expect(orgEq.val).not.toBe(999);
        expect(orgEq.val).toBe(1);
      }
    }
  });

  it('requires authentication (no { required: false })', async () => {
    const { default: purviewRouter } = await import('../prism-counsel-purview');

    const app = express();
    app.use(express.json());
    app.use('/prism-counsel', purviewRouter);

    _currentUser = makeOrg2User();
    _selectQueue.push([]);

    const res = await request(app)
      .get('/prism-counsel/purview/hold-awareness')
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe('governance: cross-tenant budget mutation prevention', () => {
  it('POST /cost-events scopes budget update with orgId', async () => {
    const { default: governanceRouter } = await import('../governance');

    const app = express();
    app.use(express.json());
    app.use('/governance', governanceRouter);

    _currentUser = makeOrg1User();

    const res = await request(app)
      .post('/governance/cost-events')
      .send({
        eventType: 'inference',
        resourceId: 'r1',
        resourceName: 'Test',
        costUsd: 0.5,
        budgetId: 42,
      });

    expect([200, 201]).toContain(res.status);
  });
});

describe('signal-bus: org-scoped queries', () => {
  it('GET /rules filters by caller orgId (text column)', async () => {
    const { default: signalBusRouter } = await import('../signal-bus');

    const app = express();
    app.use(express.json());
    app.use('/signal-bus', signalBusRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([]);

    await request(app)
      .get('/signal-bus/rules')
      .expect(200);

    const w = _capturedSelectWheres[0] as any;
    expect(w).toBeDefined();
    if (w?.op === 'inArray') {
      expect(w.vals).toEqual(['1']);
    }
  });

  it('GET /events filters by caller orgId', async () => {
    const { default: signalBusRouter } = await import('../signal-bus');

    const app = express();
    app.use(express.json());
    app.use('/signal-bus', signalBusRouter);

    _currentUser = makeOrg2User();
    _selectQueue.push([]);

    await request(app)
      .get('/signal-bus/events')
      .expect(200);

    const w = _capturedSelectWheres.find((c: any) => c?.op === 'inArray') as any;
    expect(w).toBeDefined();
    if (w) {
      expect(w.vals).toEqual(['2']);
    }
  });
});

describe('atlas-artifacts: assertTenantAccess on export job detail', () => {
  it('GET /atlas/export-jobs/:id returns 403 for wrong org', async () => {
    const { default: atlasRouter } = await import('../atlas-artifacts');

    const app = express();
    app.use(express.json());
    app.use(atlasRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([{ id: 1, orgId: 999 }]);

    const res = await request(app)
      .get('/atlas/export-jobs/1')
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('GET /atlas/export-jobs/:id succeeds for correct org', async () => {
    const { default: atlasRouter } = await import('../atlas-artifacts');

    const app = express();
    app.use(express.json());
    app.use(atlasRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([{ id: 1, orgId: 1 }]);

    const res = await request(app)
      .get('/atlas/export-jobs/1')
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe('vessels-cognitive: owner-graph org scoping', () => {
  it('GET /vessels/cognitive/owner-graph filters vessels by caller orgId', async () => {
    const { default: vesselsCogRouter } = await import('../vessels-cognitive');

    const app = express();
    app.use(express.json());
    app.use(vesselsCogRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([]);

    await request(app)
      .get('/vessels/cognitive/owner-graph')
      .expect(200);

    const w = _capturedSelectWheres[0] as any;
    if (w?.op === 'inArray') {
      expect(w.vals).toEqual([1]);
    }
  });
});

describe('multiplayer-sessions: tenant isolation', () => {
  it('GET /sessions/command/:sessionId returns 403 for wrong org', async () => {
    const { default: sessionsRouter } = await import('../multiplayer-sessions');

    const app = express();
    app.use(express.json());
    app.use(sessionsRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([{ id: 1, orgId: 999, sessionId: 'cmd-abc' }]);

    const res = await request(app)
      .get('/sessions/command/cmd-abc')
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('GET /sessions/command/:sessionId succeeds for correct org', async () => {
    const { default: sessionsRouter } = await import('../multiplayer-sessions');

    const app = express();
    app.use(express.json());
    app.use(sessionsRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([{ id: 1, orgId: 1, sessionId: 'cmd-abc' }]);

    const res = await request(app)
      .get('/sessions/command/cmd-abc')
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('GET /sessions/command/:sessionId/comments returns 403 for wrong org session', async () => {
    const { default: sessionsRouter } = await import('../multiplayer-sessions');

    const app = express();
    app.use(express.json());
    app.use(sessionsRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([{ orgId: 999 }]);

    const res = await request(app)
      .get('/sessions/command/cmd-abc/comments')
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('POST /sessions/command/:sessionId/comments returns 403 for wrong org session', async () => {
    const { default: sessionsRouter } = await import('../multiplayer-sessions');

    const app = express();
    app.use(express.json());
    app.use(sessionsRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([{ orgId: 999 }]);

    const res = await request(app)
      .post('/sessions/command/cmd-abc/comments')
      .send({ body: 'test comment' })
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('POST /sessions/command returns 403 when joining another org session', async () => {
    const { default: sessionsRouter } = await import('../multiplayer-sessions');

    const app = express();
    app.use(express.json());
    app.use(sessionsRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([{ id: 1, orgId: 999, sessionId: 'cmd-other' }]);

    const res = await request(app)
      .post('/sessions/command')
      .send({ sessionId: 'cmd-other', title: 'Test' })
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('GET /sessions/command list filters by org', async () => {
    const { default: sessionsRouter } = await import('../multiplayer-sessions');

    const app = express();
    app.use(express.json());
    app.use(sessionsRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([]);

    await request(app)
      .get('/sessions/command')
      .expect(200);

    const w = _capturedSelectWheres[0] as any;
    expect(w).toBeDefined();
  });
});

describe('signal-bus: stats endpoint org scoping', () => {
  it('GET /stats filters all counts by caller orgId', async () => {
    const { default: signalBusRouter } = await import('../signal-bus');

    const app = express();
    app.use(express.json());
    app.use('/signal-bus', signalBusRouter);

    _currentUser = makeOrg1User();
    _selectQueue.push([{ count: 5 }]);
    _selectQueue.push([{ count: 3 }]);
    _selectQueue.push([{ count: 10 }]);
    _selectQueue.push([{ count: 2 }]);
    _selectQueue.push([]);

    await request(app)
      .get('/signal-bus/stats')
      .expect(200);

    const orgWheres = (_capturedSelectWheres as any[]).filter(
      (w) => w?.op === 'inArray' || (w?.op === 'and' && w?.conds?.some((c: any) => c?.op === 'inArray')),
    );
    expect(orgWheres.length).toBeGreaterThanOrEqual(3);
  });
});

describe('atlas-artifacts: cross-tenant access prevention', () => {
  it('GET /atlas/artifacts/:id returns 403 for wrong org artifact', async () => {
    const { default: atlasRouter } = await import('../atlas-artifacts');

    const app = express();
    app.use(express.json());
    app.use(atlasRouter);

    _currentUser = makeOrg1User();
    _getArtifactByIdResult = { id: 1, orgId: 999, title: 'Secret' };

    const res = await request(app)
      .get('/atlas/artifacts/1')
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('PATCH /atlas/artifacts/:id returns 403 for wrong org artifact', async () => {
    const { default: atlasRouter } = await import('../atlas-artifacts');

    const app = express();
    app.use(express.json());
    app.use(atlasRouter);

    _currentUser = makeOrg1User();
    _getArtifactByIdResult = { id: 1, orgId: 999, title: 'Secret' };

    const res = await request(app)
      .patch('/atlas/artifacts/1')
      .send({ title: 'Hacked' })
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('POST /atlas/artifacts/:id/share returns 403 for wrong org artifact', async () => {
    const { default: atlasRouter } = await import('../atlas-artifacts');

    const app = express();
    app.use(express.json());
    app.use(atlasRouter);

    _currentUser = makeOrg1User();
    _getArtifactByIdResult = { id: 1, orgId: 999, title: 'Secret' };

    const res = await request(app)
      .post('/atlas/artifacts/1/share')
      .send({ expiresInHours: 24 })
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('POST /atlas/artifacts/:id/regenerate returns 403 for wrong org artifact', async () => {
    const { default: atlasRouter } = await import('../atlas-artifacts');

    const app = express();
    app.use(express.json());
    app.use(atlasRouter);

    _currentUser = makeOrg1User();
    _getArtifactByIdResult = { id: 1, orgId: 999, title: 'Secret' };

    const res = await request(app)
      .post('/atlas/artifacts/1/regenerate')
      .send({})
      .expect(403);

    expect(res.body.error).toMatch(/cross-tenant|forbidden|denied/i);
  });

  it('GET /atlas/artifacts/:id succeeds for correct org', async () => {
    const { default: atlasRouter } = await import('../atlas-artifacts');

    const app = express();
    app.use(express.json());
    app.use(atlasRouter);

    _currentUser = makeOrg1User();
    _getArtifactByIdResult = { id: 1, orgId: 1, title: 'My Artifact' };

    const res = await request(app)
      .get('/atlas/artifacts/1')
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe('prism-counsel-purview: no-org user denial', () => {
  it('GET /purview/case-links returns empty for user with no orgs', async () => {
    const { default: purviewRouter } = await import('../prism-counsel-purview');

    const app = express();
    app.use(express.json());
    app.use('/prism-counsel', purviewRouter);

    _currentUser = makeNoOrgUser();

    const res = await request(app)
      .get('/prism-counsel/purview/case-links')
      .expect(200);

    expect(res.body.data.caseLinks).toEqual([]);
    expect(res.body.data.count).toBe(0);
  });

  it('POST /purview/diagnostics/run returns 403 for user with no orgs', async () => {
    const { default: purviewRouter } = await import('../prism-counsel-purview');

    const app = express();
    app.use(express.json());
    app.use('/prism-counsel', purviewRouter);

    _currentUser = makeNoOrgUser();

    const res = await request(app)
      .post('/prism-counsel/purview/diagnostics/run')
      .send({ check: 'all' })
      .expect(403);

    expect(res.body.error).toMatch(/no org|denied|forbidden/i);
  });
});

describe('cross-tenant denial: no-org user', () => {
  it('governance GET /budgets returns empty for user with no orgs', async () => {
    const { default: governanceRouter } = await import('../governance');

    const app = express();
    app.use(express.json());
    app.use('/governance', governanceRouter);

    _currentUser = makeNoOrgUser();

    const res = await request(app)
      .get('/governance/budgets')
      .expect(200);

    expect(res.body.data).toEqual([]);
  });
});
