/**
 * ATLAS Tenant Isolation — row-level access control
 *
 * Verifies that the domain ATLAS routes pass the authenticated user's
 * tenantId (derived from req.user.orgs[0].orgId) into the engine read
 * functions so cross-tenant data is never returned.
 */

import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Engine mock — record calls and return tenant-scoped fixtures
// ---------------------------------------------------------------------------

type SignalRow = { id: string; domain: string; tenantId: string; title: string };
type EvidenceRow = { id: string; domain: string; workflowId: string; tenantId?: string };
type OutcomeRow = { id: string; domain: string; tenantId?: string };
type HookRow = {
  id: string;
  domain: string;
  workflowId: string;
  workflowName: string;
  replayable: boolean;
  tenantId?: string;
  signalSnapshot: unknown[];
  runSnapshot: Record<string, unknown>;
  snapshotAt: string;
  benchmarkMetrics?: Record<string, unknown>;
};

const SIGNALS: SignalRow[] = [
  { id: 's-tenant-a', domain: 'aegis', tenantId: '10', title: 'Tenant A signal' },
  { id: 's-tenant-b', domain: 'aegis', tenantId: '20', title: 'Tenant B signal' },
  { id: 's-tenant-default', domain: 'aegis', tenantId: 'default', title: 'Default signal' },
];

const EVIDENCE: EvidenceRow[] = [
  { id: 'e-a', domain: 'aegis', workflowId: 'wf-a', tenantId: '10' },
  { id: 'e-b', domain: 'aegis', workflowId: 'wf-b', tenantId: '20' },
];

const OUTCOMES: OutcomeRow[] = [
  { id: 'o-a', domain: 'aegis', tenantId: '10' },
  { id: 'o-b', domain: 'aegis', tenantId: '20' },
];

const HOOKS: HookRow[] = [
  {
    id: 'h-a',
    domain: 'aegis',
    workflowId: 'wf-a',
    workflowName: 'A',
    replayable: true,
    tenantId: '10',
    signalSnapshot: [],
    runSnapshot: {},
    snapshotAt: new Date().toISOString(),
  },
  {
    id: 'h-b',
    domain: 'aegis',
    workflowId: 'wf-b',
    workflowName: 'B',
    replayable: true,
    tenantId: '20',
    signalSnapshot: [],
    runSnapshot: {},
    snapshotAt: new Date().toISOString(),
  },
];

const calls = {
  getSignals: [] as Array<[string, number?, string?]>,
  getEvidence: [] as Array<[string, string?, string?]>,
  getOutcomes: [] as Array<[string, number?, string?]>,
  getEvaluationHooks: [] as Array<[string, string?]>,
  getEvaluationHookById: [] as Array<[string, string?]>,
  captureEvidence: [] as Array<Record<string, unknown>>,
  recordOutcome: [] as Array<Record<string, unknown>>,
};

vi.mock('../lib/atlas-execution-engine.js', () => ({
  initializeAtlasExecutionEngine: vi.fn(),
  DOMAIN_WORKFLOWS: {
    'aegis-incident-response': {
      id: 'aegis-incident-response',
      name: 'Aegis',
      domain: 'aegis',
      steps: [],
    },
  },
  ingestSignal: vi.fn().mockImplementation(async (r: Record<string, unknown>) => ({
    ...r,
    id: 'new',
    createdAt: '',
    updatedAt: '',
  })),
  getSignals: vi
    .fn()
    .mockImplementation(async (domain: string, limit?: number, tenantId?: string) => {
      calls.getSignals.push([domain, limit, tenantId]);
      return SIGNALS.filter(
        (s) => s.domain === domain && (tenantId == null || s.tenantId === tenantId),
      );
    }),
  updateSignalStatus: vi.fn().mockResolvedValue(true),
  captureEvidence: vi.fn().mockImplementation(async (r: Record<string, unknown>) => {
    calls.captureEvidence.push(r);
    return { ...r, id: 'new-ev', capturedAt: '' };
  }),
  getEvidence: vi
    .fn()
    .mockImplementation(async (domain: string, workflowId?: string, tenantId?: string) => {
      calls.getEvidence.push([domain, workflowId, tenantId]);
      return EVIDENCE.filter(
        (e) =>
          e.domain === domain &&
          (workflowId == null || e.workflowId === workflowId) &&
          (tenantId == null || e.tenantId === tenantId),
      );
    }),
  recordOutcome: vi.fn().mockImplementation(async (r: Record<string, unknown>) => {
    calls.recordOutcome.push(r);
    return { ...r, id: 'new-out', recordedAt: '' };
  }),
  getOutcomes: vi
    .fn()
    .mockImplementation(async (domain: string, limit?: number, tenantId?: string) => {
      calls.getOutcomes.push([domain, limit, tenantId]);
      return OUTCOMES.filter(
        (o) => o.domain === domain && (tenantId == null || o.tenantId === tenantId),
      );
    }),
  getEvaluationHooks: vi.fn().mockImplementation(async (domain: string, tenantId?: string) => {
    calls.getEvaluationHooks.push([domain, tenantId]);
    return HOOKS.filter(
      (h) => h.domain === domain && (tenantId == null || h.tenantId === tenantId),
    );
  }),
  getEvaluationHookById: vi.fn().mockImplementation(async (hookId: string, tenantId?: string) => {
    calls.getEvaluationHookById.push([hookId, tenantId]);
    const hook = HOOKS.find((h) => h.id === hookId);
    if (!hook) return undefined;
    if (tenantId != null && hook.tenantId !== tenantId) return undefined;
    return hook;
  }),
  registerEvaluationHook: vi.fn().mockResolvedValue({ id: 'new-hook', snapshotAt: '' }),
  evaluateSignalsForDomain: vi.fn().mockResolvedValue([]),
  checkDomainPolicy: vi.fn().mockReturnValue({ allowed: true, effect: 'allow', matchedRules: [] }),
  executedomainWorkflow: vi.fn().mockResolvedValue({
    run: { runId: 'r', status: 'completed', steps: [] },
    requiresApproval: false,
  }),
}));

vi.mock('../lib/decisioning-store.js', () => ({
  dbListRuns: vi.fn().mockResolvedValue({ runs: [], total: 0 }),
  dbGetRunById: vi.fn().mockResolvedValue(null),
  dbCancelRun: vi.fn().mockResolvedValue(true),
  dbApproveRun: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Auth middleware mock — emulates a logged-in user with a single org membership.
let currentUser: {
  id: number;
  roles: string[];
  orgs: Array<{ orgId: number; orgSlug: string }>;
} | null = null;
let isInternalAgent = false;

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware:
    (options: { required?: boolean } = {}) =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (isInternalAgent) {
        (req as Request & { user: typeof currentUser; isInternalAgent: boolean }).user = {
          id: 0,
          roles: ['super_admin'],
          orgs: [],
        } as typeof currentUser;
        (req as Request & { isInternalAgent: boolean }).isInternalAgent = true;
        next();
        return;
      }
      if (currentUser) {
        (req as Request & { user: typeof currentUser }).user = currentUser;
        next();
        return;
      }
      if (options.required === false) {
        next();
        return;
      }
      res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    },
}));

const domainAtlasRouter = (await import('../routes/domain-atlas-execution.js')).default;

function buildApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use(domainAtlasRouter);
  return app;
}

beforeEach(() => {
  calls.getSignals = [];
  calls.getEvidence = [];
  calls.getOutcomes = [];
  calls.getEvaluationHooks = [];
  calls.getEvaluationHookById = [];
  calls.captureEvidence = [];
  calls.recordOutcome = [];
  currentUser = null;
  isInternalAgent = false;
});

describe('ATLAS row-level tenant isolation — read endpoints', () => {
  it("GET /signals scopes to the caller's tenant and never leaks other tenants", async () => {
    const app = buildApp();
    currentUser = { id: 1, roles: ['operator'], orgs: [{ orgId: 10, orgSlug: 'tenant-a' }] };
    const resA = await request(app).get('/aegis/atlas/signals');
    expect(resA.status).toBe(200);
    expect(resA.body.signals.map((s: SignalRow) => s.id)).toEqual(['s-tenant-a']);

    currentUser = { id: 2, roles: ['operator'], orgs: [{ orgId: 20, orgSlug: 'tenant-b' }] };
    const resB = await request(app).get('/aegis/atlas/signals');
    expect(resB.status).toBe(200);
    expect(resB.body.signals.map((s: SignalRow) => s.id)).toEqual(['s-tenant-b']);

    expect(calls.getSignals).toEqual([
      ['aegis', 50, '10'],
      ['aegis', 50, '20'],
    ]);
  });

  it("GET /evidence scopes to the caller's tenant", async () => {
    const app = buildApp();
    currentUser = { id: 1, roles: ['operator'], orgs: [{ orgId: 10, orgSlug: 'tenant-a' }] };
    const res = await request(app).get('/aegis/atlas/evidence');
    expect(res.status).toBe(200);
    expect(res.body.evidence.map((e: EvidenceRow) => e.id)).toEqual(['e-a']);
    expect(calls.getEvidence[0]).toEqual(['aegis', undefined, '10']);
  });

  it("GET /outcomes scopes to the caller's tenant", async () => {
    const app = buildApp();
    currentUser = { id: 2, roles: ['operator'], orgs: [{ orgId: 20, orgSlug: 'tenant-b' }] };
    const res = await request(app).get('/aegis/atlas/outcomes');
    expect(res.status).toBe(200);
    expect(res.body.outcomes.map((o: OutcomeRow) => o.id)).toEqual(['o-b']);
    expect(calls.getOutcomes[0]).toEqual(['aegis', 50, '20']);
  });

  it("GET /evaluation-hooks scopes to the caller's tenant", async () => {
    const app = buildApp();
    currentUser = { id: 1, roles: ['operator'], orgs: [{ orgId: 10, orgSlug: 'tenant-a' }] };
    const res = await request(app).get('/aegis/atlas/evaluation-hooks');
    expect(res.status).toBe(200);
    expect(res.body.hooks.map((h: HookRow) => h.id)).toEqual(['h-a']);
    expect(calls.getEvaluationHooks[0]).toEqual(['aegis', '10']);
  });

  it('replay denies access to a hook owned by another tenant (returns 404, not the foreign hook)', async () => {
    const app = buildApp();
    currentUser = { id: 1, roles: ['operator'], orgs: [{ orgId: 10, orgSlug: 'tenant-a' }] };
    // h-b belongs to tenant 20; tenant 10 must NOT be able to replay it.
    const res = await request(app)
      .post('/aegis/atlas/evaluation-hooks/replay')
      .send({ hookId: 'h-b' });
    expect(res.status).toBe(404);
    expect(calls.getEvaluationHookById[0]).toEqual(['h-b', '10']);
  });

  it('anonymous request is rejected with 401 — no silent cross-tenant exposure', async () => {
    const app = buildApp();
    currentUser = null;
    const res = await request(app).get('/aegis/atlas/signals');
    expect(res.status).toBe(401);
    expect(calls.getSignals).toEqual([]);
  });

  it('authenticated user with no org membership is rejected with 403 (fail-closed)', async () => {
    const app = buildApp();
    currentUser = { id: 99, roles: ['operator'], orgs: [] };
    const res = await request(app).get('/aegis/atlas/signals');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TENANT_REQUIRED');
    expect(calls.getSignals).toEqual([]);
  });

  it('internal agent (server-to-server) bypasses tenant scoping with undefined tenantId', async () => {
    const app = buildApp();
    isInternalAgent = true;
    const res = await request(app).get('/aegis/atlas/signals');
    expect(res.status).toBe(200);
    // Internal agent sees domain-wide rows; that is the trusted path.
    expect(res.body.signals.map((s: SignalRow) => s.id).sort()).toEqual([
      's-tenant-a',
      's-tenant-b',
      's-tenant-default',
    ]);
    expect(calls.getSignals[0]).toEqual(['aegis', 50, undefined]);
  });
});

describe('ATLAS row-level tenant isolation — write endpoints persist tenant', () => {
  it("POST /evidence stamps the caller's tenantId on the persisted record", async () => {
    const app = buildApp();
    currentUser = { id: 1, roles: ['operator'], orgs: [{ orgId: 10, orgSlug: 'tenant-a' }] };
    const res = await request(app).post('/aegis/atlas/evidence').send({
      workflowId: 'wf-1',
      label: 'test',
      value: 'v',
    });
    expect(res.status).toBe(201);
    expect(calls.captureEvidence[0]).toMatchObject({ tenantId: '10', workflowId: 'wf-1' });
  });

  it("POST /outcome stamps the caller's tenantId on the persisted record", async () => {
    const app = buildApp();
    currentUser = { id: 2, roles: ['operator'], orgs: [{ orgId: 20, orgSlug: 'tenant-b' }] };
    const res = await request(app).post('/aegis/atlas/outcome').send({
      workflowId: 'wf-2',
      title: 't',
      summary: 's',
      status: 'success',
    });
    expect(res.status).toBe(201);
    expect(calls.recordOutcome[0]).toMatchObject({ tenantId: '20', workflowId: 'wf-2' });
  });
});
