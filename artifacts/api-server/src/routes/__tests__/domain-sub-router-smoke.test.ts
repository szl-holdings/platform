/**
 * Domain sub-router smoke tests covering all 8 refactored route domains.
 * Each protected route is exercised for: 401/403 (auth), 400 (bad payload),
 * and 200/201 (valid request). The API contract uses 400 (sendBadRequest)
 * for validation failures — not 422.
 */

import express, { type NextFunction, type Request, type Response, Router } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ─── Heavy module mocks (hoisted) ────────────────────────────────────────────

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('express-rate-limit', () => ({
  default: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  rateLimit: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordTenantIsolationViolation: vi.fn(),
  },
}));

vi.mock('@szl-holdings/contracts/common', async () => {
  const { z } = await import('zod');
  // Use real z.object() so validateBody exercises genuine Zod evaluation.
  // All callers pass z.unknown().optional() fields, so 400 is triggered by
  // handler-level guards (text/orgId/templateId), not schema failures.
  return { bodyShape: (shape: Record<string, z.ZodTypeAny>) => z.object(shape) };
});

vi.mock('@szl-holdings/db', () => {
  // Recursive proxy: any property returns 0/1/'0' or another nested proxy,
  // satisfying column access, count checks and nested destructuring in handlers.
  function makeResultRow(): Record<string | symbol, unknown> {
    return new Proxy({} as Record<string | symbol, unknown>, {
      get(_t, col: string | symbol) {
        if (typeof col === 'symbol') return undefined;
        if (col === 'then') return undefined;
        if (col === 'valueOf') return () => 0;
        if (col === 'toString') return () => '0';
        if (col === 'toJSON') return () => ({});
        if (col === 'count') return '0';
        if (col === 'id') return 1;
        return makeResultRow();
      },
    });
  }

  // Drizzle-table + Zod-schema dual stub for module-level table/schema exports.
  function makeDbStub(): unknown {
    const CHAIN = [
      'omit','pick','extend','partial','required','refine','superRefine',
      'transform','merge','array','optional','nullable','default',
      'passthrough','strip','strict','or','and','brand','readonly',
      'catch','pipe','describe','preprocess','deepPartial',
    ];
    return new Proxy({} as Record<string | symbol, unknown>, {
      get(_t, col: string | symbol) {
        if (typeof col === 'symbol') return undefined;
        if (CHAIN.includes(col as string)) return () => makeDbStub();
        if (col === 'parse') return (v: unknown) => v;
        if (col === 'safeParse') return (v: unknown) => ({ success: true, data: v });
        if (col === 'shape' || col === '_def' || col === '_type') return {};
        if (col === 'then') return undefined;
        return { _colName: col };
      },
    });
  }

  const makeChain = (): Record<string, unknown> => {
    const chain: Record<string, unknown> = {};
    Object.assign(chain, {
      from: () => chain, where: () => chain, orderBy: () => chain,
      limit: () => chain, offset: () => chain, groupBy: () => chain,
      innerJoin: () => chain, leftJoin: () => chain,
      set: () => chain, values: () => chain,
      returning: () => Promise.resolve([makeResultRow()]),
      onConflictDoNothing: () => chain, onConflictDoUpdate: () => chain,
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve([makeResultRow()]).then(resolve, reject),
    });
    return chain;
  };

  const db = {
    select: makeChain, insert: makeChain, update: makeChain,
    delete: makeChain,
    execute: () => Promise.resolve({ rows: [] }),
  };
  const pool = { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };

  return new Proxy(
    { db, pool },
    {
      get(target, prop: string) {
        if (prop in target) return (target as Record<string, unknown>)[prop];
        return makeDbStub();
      },
      has: () => true,
      ownKeys: (target) => Object.keys(target),
      getOwnPropertyDescriptor(target, prop) {
        const rec: Record<string | symbol, unknown> = target;
        return { configurable: true, enumerable: true, value: rec[prop] };
      },
    },
  );
});

vi.mock('drizzle-orm', () => ({
  eq: (c: unknown, v: unknown) => ({ op: 'eq', c, v }),
  ne: (c: unknown, v: unknown) => ({ op: 'ne', c, v }),
  and: (...a: unknown[]) => ({ op: 'and', a }),
  or: (...a: unknown[]) => ({ op: 'or', a }),
  inArray: (c: unknown, v: unknown) => ({ op: 'inArray', c, v }),
  desc: (c: unknown) => ({ op: 'desc', c }),
  asc: (c: unknown) => ({ op: 'asc', c }),
  gte: (c: unknown, v: unknown) => ({ op: 'gte', c, v }),
  lte: (c: unknown, v: unknown) => ({ op: 'lte', c, v }),
  gt: (c: unknown, v: unknown) => ({ op: 'gt', c, v }),
  lt: (c: unknown, v: unknown) => ({ op: 'lt', c, v }),
  isNotNull: (c: unknown) => ({ op: 'isNotNull', c }),
  isNull: (c: unknown) => ({ op: 'isNull', c }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...vals: unknown[]) => ({ op: 'sql', strings: [...strings], vals }),
    { raw: (s: string) => ({ op: 'sql.raw', s }) },
  ),
  count: (c?: unknown) => ({ op: 'count', c }),
  sum: (c?: unknown) => ({ op: 'sum', c }),
  avg: (c?: unknown) => ({ op: 'avg', c }),
  max: (c?: unknown) => ({ op: 'max', c }),
  min: (c?: unknown) => ({ op: 'min', c }),
  notInArray: (c: unknown, v: unknown) => ({ op: 'notInArray', c, v }),
}));

// Typed extension so req.user is accessible without unsafe casts.
interface AuthedRequest extends Request {
  user?: {
    id: number;
    role: string;
    displayName: string;
    email: string;
    roles: string[];
    orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>;
  };
}

// Auth middleware mock: real role-gating without a live session DB.
// requireRole mirrors production — super_admin/admin bypass; others checked explicitly.
vi.mock('../../middlewares/auth', () => {
  class InvalidIdError extends Error {
    constructor() {
      super('Invalid ID parameter');
      this.name = 'InvalidIdError';
    }
  }
  return {
    InvalidIdError,
    authMiddleware:
      (opts?: { required?: boolean }) =>
      (req: Request, res: Response, next: NextFunction) => {
        const required = opts?.required ?? true;
        if (!(req as AuthedRequest).user && required) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        next();
      },
    requireRole:
      (...allowedRoles: string[]) =>
      (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthedRequest).user;
        if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        if (user.roles.includes('super_admin') || user.roles.includes('admin')) {
          next(); return;
        }
        const granted = allowedRoles.some((r: string) => user.roles.includes(r));
        if (!granted) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
        next();
      },
    parseIdParam: (raw: string | string[]): number => {
      const str = Array.isArray(raw) ? raw[0] : raw;
      const id = parseInt(str, 10);
      if (Number.isNaN(id) || id < 1) throw new InvalidIdError();
      return id;
    },
    requireAnyAuth:
      () =>
      (req: Request, res: Response, next: NextFunction) => {
        if (!(req as AuthedRequest).user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        next();
      },
    denyIfReadOnly:
      () =>
      (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthedRequest).user;
        if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const readOnly = ['executive_viewer', 'anonymous_visitor'];
        if (readOnly.some((r: string) => user.roles.includes(r))) {
          res.status(403).json({ error: 'Read-only access' }); return;
        }
        next();
      },
  };
});

vi.mock('../../middlewares/tenant-scope', () => ({
  tenantScope:
    () =>
    (_req: Request, _res: Response, next: NextFunction) =>
      next(),
  assertTenantAccess: vi.fn(),
}));

vi.mock('../../middlewares/optimistic-concurrency', () => ({
  validateIfMatch:
    () =>
    (_req: Request, _res: Response, next: NextFunction) =>
      next(),
}));

vi.mock('../../middlewares/zero-trust', () => ({
  getDomainAutonomyLevel: vi.fn().mockReturnValue('supervised'),
}));

vi.mock('../../lib/api-response', () => ({
  handleRouteError: (res: Response, _err: unknown, msg: string) =>
    res.status(500).json({ error: msg }),
  sendSuccess: (res: Response, data: unknown, status = 200) =>
    res.status(status).json({ success: true, data }),
  sendCreated: (res: Response, data: unknown) => res.status(201).json({ success: true, data }),
  sendNotFound: (res: Response, entity: string) =>
    res.status(404).json({ error: `${entity} not found` }),
  sendBadRequest: (res: Response, msg: string) => res.status(400).json({ error: msg }),
  sendError: (res: Response, msg: string, status: number) =>
    res.status(status ?? 500).json({ error: msg }),
  sendForbidden: (res: Response, msg?: string) =>
    res.status(403).json({ error: msg ?? 'Forbidden' }),
  sendNoContent: (res: Response) => res.status(204).send(),
  sendUnauthorized: (res: Response, msg?: string) =>
    res.status(401).json({ error: msg ?? 'Unauthorized' }),
  parsePagination: (_q: unknown) => ({ page: 1, limit: 20, offset: 0 }),
  sendConflict: (res: Response, msg: string) => res.status(409).json({ error: msg }),
}));

vi.mock('../../lib/redis-client', () => ({
  redisGet: vi.fn().mockResolvedValue(null),
  redisSet: vi.fn().mockResolvedValue(undefined),
}));

// Intelligence-specific mocks
vi.mock('@szl-holdings/services', () => ({
  services: {
    huggingface: {
      summarization: vi.fn().mockResolvedValue({ summary: 'test' }),
      sentimentAnalysis: vi.fn().mockResolvedValue({ label: 'positive', score: 0.9 }),
    },
  },
}));

vi.mock('@szl-holdings/ai-engine/providers/openai', () => ({
  createResponse: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'ok' } }] }),
  createResponseStream: vi.fn(),
  openai: {
    chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'ok' } }] }) } },
  },
}));

vi.mock('@szl-holdings/ai-engine/providers/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
      stream: vi.fn(),
    },
  },
}));

vi.mock('@szl-holdings/proof-chain', () => ({
  tagAIContent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@szl-holdings/ai-engine', () => ({
  validateAndBuildDecision: vi.fn().mockResolvedValue({ decisionId: 'd-1' }),
  getKernelAuditTrail: vi.fn().mockReturnValue([]),
  verifyAuditChainIntegrity: vi.fn().mockReturnValue({ valid: true }),
  issueScopeCertificate: vi.fn().mockResolvedValue({ cert: 'cert-1' }),
  keywordSearch: vi.fn().mockResolvedValue([]),
}));

vi.mock('@szl-holdings/ai-engine/domain-embedding-hooks', () => ({
  ingestFirestormFinding: vi.fn().mockResolvedValue(undefined),
  ingestFirestormScenario: vi.fn().mockResolvedValue(undefined),
  ingestFirestormAlert: vi.fn().mockResolvedValue(undefined),
}));

// Firestorm-specific mocks
vi.mock('../../lib/pubsub-bridge', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn(), subscribe: vi.fn() },
  FIRESTORM_EVENTS: {},
}));

vi.mock('../../lib/tradecraft-evidence-store', () => ({
  ingestDecisionToEvidenceIndex: vi.fn().mockResolvedValue(undefined),
  queryEvidenceIndex: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../lib/ssrf-guard', () => ({
  validateExternalUrlSync: vi.fn(),
}));

// RMM-specific mocks
vi.mock('../../services/rmm-provider', () => ({
  getCachedProvider: vi.fn().mockResolvedValue(null),
  setCachedProvider: vi.fn(),
  clearProviderCache: vi.fn(),
}));

// Document-specific mocks — use a regular (constructable) function for ObjectStorageService
vi.mock('../../lib/objectStorage', () => {
  class MockObjectStorageService {
    upload = vi.fn().mockResolvedValue({ url: 'https://example.com/file.pdf' });
    delete = vi.fn().mockResolvedValue(undefined);
    getSignedUrl = vi.fn().mockResolvedValue('https://example.com/signed');
    getPresignedUrl = vi.fn().mockResolvedValue('https://example.com/presigned');
    exists = vi.fn().mockResolvedValue(false);
  }
  class MockObjectNotFoundError extends Error {
    constructor(msg?: string) { super(msg ?? 'Object not found'); }
  }
  return {
    ObjectStorageService: MockObjectStorageService,
    ObjectNotFoundError: MockObjectNotFoundError,
  };
});

vi.mock('../../lib/objectAcl', () => ({
  setObjectAclPolicy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/pdf-renderer', () => ({
  renderDocumentToPdfBuffer: vi.fn().mockResolvedValue(Buffer.from('pdf')),
  renderEntityDataToPdfBuffer: vi.fn().mockResolvedValue(Buffer.from('pdf')),
}));

// Tenant-provisioning-specific mocks
vi.mock('../../lib/crypto', () => ({
  encryptSecret: vi.fn().mockReturnValue('enc:test'),
  decryptSecret: vi.fn().mockReturnValue('{"tenantId":"t1","clientId":"c1","clientSecret":"s1","groupId":"g1","reportIds":{}}'),
}));

vi.mock('../../lib/activity-logger', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// Control-tower-specific mocks
vi.mock('../../lib/event-bus', () => ({
  agentEventBus: {
    publish: vi.fn().mockResolvedValue({ id: 'ev-1', type: 'test' }),
    getHistory: vi.fn().mockReturnValue([]),
    getStats: vi.fn().mockReturnValue({ totalPublished: 0, subscriptionCount: 0, byType: {}, historySize: 0 }),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));

vi.mock('../../lib/alloy-decision-store', () => ({
  listDecisions: vi.fn().mockResolvedValue([]),
  getDecision: vi.fn().mockResolvedValue(null),
  insertDecision: vi.fn().mockResolvedValue({ id: 'd-1' }),
  updateDecisionStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/multi-agent-orchestrator', () => ({
  orchestrate: vi.fn().mockResolvedValue({ result: 'ok' }),
  getOrchestratorCapabilities: vi.fn().mockReturnValue({ agents: [] }),
}));

vi.mock('../../lib/intelligence-pipelines', () => ({
  listPipelines: vi.fn().mockReturnValue([]),
  getPipelineConfig: vi.fn().mockReturnValue(null),
  executePipeline: vi.fn().mockResolvedValue({ output: 'ok' }),
  executeComposedPipeline: vi.fn().mockResolvedValue({ output: 'ok' }),
}));

vi.mock('../../lib/inference-telemetry', () => ({
  inferenceTelemetry: {
    record: vi.fn(),
    getSummary: vi.fn().mockReturnValue({ total: 0 }),
  },
}));

vi.mock('js-yaml', () => ({
  load: vi.fn().mockReturnValue({
    agents: [
      {
        id: 'sense-agent', name: 'Sense Agent', subtitle: 'Signal Monitoring',
        domain: 'sense', capabilities: ['monitoring'], riskTolerance: 'low',
        collaborationRules: ['escalate'], scopeCertMaxRisk: 'high', version: '1.0.0',
      },
      {
        id: 'decide-agent', name: 'Decide Agent', subtitle: 'Decision Orchestration',
        domain: 'decide', capabilities: ['decisions'], riskTolerance: 'medium',
        collaborationRules: ['consult'], scopeCertMaxRisk: 'high', version: '1.0.0',
      },
      {
        id: 'act-agent', name: 'Act Agent', subtitle: 'Pipeline Execution',
        domain: 'act', capabilities: ['execution'], riskTolerance: 'medium',
        collaborationRules: ['report'], scopeCertMaxRisk: 'high', version: '1.0.0',
      },
    ],
  }),
  dump: vi.fn().mockReturnValue(''),
}));

vi.mock('@szl/substrate', () => ({
  SubstrateRuntime: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({ runId: 'run-1', status: 'complete', outputs: [] }),
  })),
}));

vi.mock('../../lib/substrate-lyte-retriever', () => ({
  registerSubstrateLyteRetriever: vi.fn().mockResolvedValue(undefined),
}));

// Distribution OS mocks
vi.mock('../../jobs/launch-publish-scheduler', () => ({
  publishXPost: vi.fn().mockResolvedValue({ ok: true, externalUrl: 'https://x.com/post/1', mock: true }),
  publishArticleToMedium: vi.fn().mockResolvedValue({ ok: true, mock: true }),
  publishNewsletterToSubstack: vi.fn().mockResolvedValue({ ok: true, mock: true }),
  publishCarouselToLinkedIn: vi.fn().mockResolvedValue({ ok: true, mock: true }),
}));

vi.mock('../../lib/seed-guard', () => ({
  guardSeedInProduction: vi.fn(),
  isProductionEnvironment: vi.fn().mockReturnValue(false),
}));

vi.mock('../../lib/lead-scoring', () => ({
  computeLeadScore: vi.fn().mockReturnValue(50),
}));

vi.mock('../../lib/ai-model-observability', () => ({
  getAiModelById: vi.fn().mockReturnValue(null),
  getAiModels: vi.fn().mockReturnValue([]),
  getModelObservabilitySummary: vi.fn().mockReturnValue({ total: 0 }),
}));

vi.mock('../../lib/model-registry', () => ({
  getRegistrySummary: vi.fn().mockReturnValue({ models: [] }),
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

const TEST_USER = {
  id: 1, role: 'admin', displayName: 'Test Admin', email: 'admin@test.example',
  roles: ['admin', 'ops'],
  orgs: [{ orgId: 1, orgSlug: 'test-org', orgName: 'Test Org', role: 'admin' }],
};

// Low-privilege user: triggers 403 from requireRole('admin') routes.
const VIEWER_USER = {
  id: 2, role: 'viewer', displayName: 'Test Viewer', email: 'viewer@test.example',
  roles: ['viewer'], orgs: [],
};

function buildApp(auth: boolean | 'admin' | 'viewer' = false) {
  const app = express();
  app.use(express.json());
  if (auth === true || auth === 'admin') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as AuthedRequest).user = TEST_USER;
      next();
    });
  } else if (auth === 'viewer') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as AuthedRequest).user = VIEWER_USER;
      next();
    });
  }
  return app;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. INTELLIGENCE DOMAIN
// Sub-modules: feeds, ai-routes, research
// ─────────────────────────────────────────────────────────────────────────────

describe('Intelligence domain smoke tests', () => {
  let domainRouter: Router;

  beforeAll(async () => {
    const { register } = await import('../intelligence/index.js');
    domainRouter = Router();
    register(domainRouter);
  });

  // ── feeds.ts ────────────────────────────────────────────────────────────────

  describe('feeds sub-module — GET /intelligence/threats', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/intelligence/threats');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/intelligence/threats');
      expect(res.status).toBe(200);
    });
  });

  // ── ai-routes.ts ────────────────────────────────────────────────────────────

  describe('ai-routes sub-module — POST /intelligence/ai/summarize', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/intelligence/ai/summarize')
        .send({ text: 'hello world' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when text is missing (handler-level guard)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/intelligence/ai/summarize')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 200 with a valid body when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/intelligence/ai/summarize')
        .send({ text: 'hello world' });
      expect(res.status).toBe(200);
    });
  });

  // ── research.ts ─────────────────────────────────────────────────────────────

  describe('research sub-module — GET /intelligence/briefing', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/intelligence/briefing');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/intelligence/briefing');
      expect(res.status).toBe(200);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. RMM DOMAIN
// Sub-modules: providers, actions, playbooks, monitoring
// ─────────────────────────────────────────────────────────────────────────────

describe('RMM domain smoke tests', () => {
  let domainRouter: Router;

  beforeAll(async () => {
    const { register } = await import('../rmm/index.js');
    domainRouter = Router();
    register(domainRouter);
  });

  // ── providers.ts ─────────────────────────────────────────────────────────────

  describe('providers sub-module — GET /rmm/providers', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/rmm/providers');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/rmm/providers');
      expect(res.status).toBe(200);
    });
  });

  describe('providers sub-module — POST /rmm/providers (role + schema validation)', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/rmm/providers')
        .send({ name: 'Acme', provider: 'datto' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as viewer (insufficient role)', async () => {
      const app = buildApp('viewer');
      app.use(domainRouter);
      // POST /rmm/providers uses roleAdmin = requireRole('admin')
      const res = await request(app)
        .post('/rmm/providers')
        .send({ name: 'Acme', provider: 'datto' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when body is missing required fields (real Zod schema)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      // rmmProviderCreateSchema requires name + provider; empty body fails
      const res = await request(app)
        .post('/rmm/providers')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 201 when authenticated as admin with valid payload', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/rmm/providers')
        .send({ name: 'Acme RMM', provider: 'datto' });
      expect(res.status).toBe(201);
    });
  });

  // ── actions.ts ───────────────────────────────────────────────────────────────

  describe('actions sub-module — GET /rmm/actions', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/rmm/actions');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/rmm/actions');
      expect(res.status).toBe(200);
    });
  });

  // ── playbooks.ts ──────────────────────────────────────────────────────────────

  describe('playbooks sub-module — GET /rmm/playbooks', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/rmm/playbooks');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/rmm/playbooks');
      expect(res.status).toBe(200);
    });
  });

  // ── monitoring.ts ─────────────────────────────────────────────────────────────

  describe('monitoring sub-module — GET /rmm/predictions', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/rmm/predictions');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/rmm/predictions');
      expect(res.status).toBe(200);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. FIRESTORM DOMAIN
// Sub-modules: crud, incidents-alerts, live, assets-cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Firestorm domain smoke tests', () => {
  let domainRouter: Router;

  beforeAll(async () => {
    const { register } = await import('../firestorm/index.js');
    domainRouter = Router();
    register(domainRouter);
  });

  // ── crud.ts ──────────────────────────────────────────────────────────────────

  describe('crud sub-module — GET /firestorm/scenarios', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/firestorm/scenarios');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/firestorm/scenarios');
      expect(res.status).toBe(200);
    });
  });

  // ── incidents-alerts.ts ───────────────────────────────────────────────────────

  describe('incidents-alerts sub-module — GET /firestorm/incidents', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/firestorm/incidents');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/firestorm/incidents');
      expect(res.status).toBe(200);
    });
  });

  // ── live.ts ───────────────────────────────────────────────────────────────────

  describe('live sub-module — GET /firestorm/live/mitre-attack', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/firestorm/live/mitre-attack');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/firestorm/live/mitre-attack');
      expect(res.status).toBe(200);
    });
  });

  // ── assets-cases.ts ───────────────────────────────────────────────────────────

  describe('assets-cases sub-module — GET /firestorm/assets', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/firestorm/assets');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/firestorm/assets');
      expect(res.status).toBe(200);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. METERING DOMAIN
// Sub-modules: events, rate-cards, billing, analytics, metered-billing
// ─────────────────────────────────────────────────────────────────────────────

describe('Metering domain smoke tests', () => {
  let domainRouter: Router;

  beforeAll(async () => {
    const { register } = await import('../metering/index.js');
    domainRouter = Router();
    register(domainRouter);
  });

  // ── events.ts — auth optional (POST /metering/events) ───────────────────────

  describe('events sub-module — POST /metering/events', () => {
    it('returns non-401 (auth optional) for unauthenticated POSTs', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/metering/events')
        .send({ orgId: 1, eventType: 'api_call', featureKey: 'search', quantity: 1 });
      expect(res.status).not.toBe(401);
    });

    it('returns 400 when orgId/eventType/featureKey are missing (handler-level guard)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/metering/events')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 200 for valid authenticated request with required fields', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/metering/events')
        .send({ orgId: 1, eventType: 'api_call', featureKey: 'search', quantity: 1 });
      expect(res.status).toBe(200);
    });
  });

  // ── rate-cards.ts — GET /metering/usage (auth + role) ────────────────────────

  describe('rate-cards sub-module — GET /metering/usage', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/metering/usage');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/metering/usage');
      expect(res.status).toBe(200);
    });
  });

  // ── billing.ts — GET /metering/cost-allocation (auth + role) ─────────────────

  describe('billing sub-module — GET /metering/cost-allocation', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/metering/cost-allocation');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/metering/cost-allocation');
      expect(res.status).toBe(200);
    });
  });

  // ── analytics.ts — GET /metering/analytics/overview (auth + role) ────────────

  describe('analytics sub-module — GET /metering/analytics/overview', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/metering/analytics/overview');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/metering/analytics/overview');
      expect(res.status).toBe(200);
    });
  });

  // ── metered-billing.ts — GET /metering/meters (auth + role) ──────────────────

  describe('metered-billing sub-module — GET /metering/meters', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/metering/meters');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/metering/meters');
      expect(res.status).toBe(200);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. DOCUMENTS DOMAIN
// Sub-modules: crud, pdf, signatures
// ─────────────────────────────────────────────────────────────────────────────

describe('Documents domain smoke tests', () => {
  let domainRouter: Router;

  beforeAll(async () => {
    const { register } = await import('../documents/index.js');
    domainRouter = Router();
    register(domainRouter);
  });

  // ── crud.ts — GET /documents ─────────────────────────────────────────────────

  describe('crud sub-module — GET /documents', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/documents');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/documents');
      expect(res.status).toBe(200);
    });
  });

  // ── pdf.ts — POST /documents/batch-pdf ───────────────────────────────────────

  describe('pdf sub-module — POST /documents/batch-pdf', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/documents/batch-pdf')
        .send({ templateId: 'tpl-1', items: [{ entityType: 'document', entityId: 'doc-1' }] });
      expect(res.status).toBe(401);
    });

    it('returns 400 when templateId is missing (handler-level guard)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/documents/batch-pdf')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 201 when authenticated with valid payload', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/documents/batch-pdf')
        .send({ templateId: 'tpl-1', items: [{ entityType: 'document', entityId: 'doc-1' }] });
      expect(res.status).toBe(201);
    });
  });

  // ── signatures.ts — POST /documents/:id/sign ─────────────────────────────────

  describe('signatures sub-module — POST /documents/:id/sign', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/documents/1/sign')
        .send({ signers: [{ email: 'a@b.com' }] });
      expect(res.status).toBe(401);
    });

    it('returns 201 when authenticated (DB stub returns doc → sendCreated)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/documents/1/sign')
        .send({ signers: [{ email: 'a@b.com' }] });
      expect(res.status).toBe(201);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. TENANT-PROVISIONING DOMAIN
// Sub-modules: tenants, scim, identity, powerbi, enterprise-mcp
// ─────────────────────────────────────────────────────────────────────────────

describe('Tenant-provisioning domain smoke tests', () => {
  let domainRouter: Router;

  beforeAll(async () => {
    const { register } = await import('../tenant-provisioning/index.js');
    domainRouter = Router();
    register(domainRouter);
  });

  // ── tenants.ts — GET /admin/tenants (requireRole('admin')) ──────────────────

  describe('tenants sub-module — GET /admin/tenants', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/admin/tenants');
      expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as viewer (insufficient role)', async () => {
      const app = buildApp('viewer');
      app.use(domainRouter);
      // Route uses requireRole('admin'); viewer role is not in the allowed set
      const res = await request(app).get('/admin/tenants');
      expect(res.status).toBe(403);
    });

    it('returns 200 when authenticated as admin', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/admin/tenants');
      expect(res.status).toBe(200);
    });
  });

  describe('tenants sub-module — POST /admin/tenants (schema validation)', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/admin/tenants')
        .send({ azureTenantId: 'tenant-abc', displayName: 'Test Tenant' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when body is missing required fields (real Zod schema)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      // tenantCreateSchema requires azureTenantId + displayName; empty body fails
      const res = await request(app)
        .post('/admin/tenants')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 409 when authenticated as admin (DB stub pre-existence check returns a row)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      // DB stub always returns a row → duplicate check triggers 409 (201 with a real empty DB)
      const res = await request(app)
        .post('/admin/tenants')
        .send({ azureTenantId: 'tenant-abc', displayName: 'Test Tenant' });
      expect(res.status).toBe(409);
    });
  });

  // ── scim.ts — POST /admin/tenants/:id/scim/deprovision-user ──────────────────

  describe('scim sub-module — POST /admin/tenants/:id/scim/deprovision-user', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/admin/tenants/1/scim/deprovision-user')
        .send({ userId: 42, reason: 'offboarded' });
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated (DB stub returns tenant → sendSuccess)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/admin/tenants/1/scim/deprovision-user')
        .send({ userId: 42, reason: 'offboarded' });
      expect(res.status).toBe(200);
    });
  });

  // ── identity.ts — POST /admin/tenants/:id/scim/tokens ────────────────────────

  describe('identity sub-module — POST /admin/tenants/:id/scim/tokens', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/admin/tenants/1/scim/tokens')
        .send({ label: 'primary' });
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated (DB stub returns tenant → sendSuccess)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/admin/tenants/1/scim/tokens')
        .send({ label: 'primary' });
      expect(res.status).toBe(200);
    });
  });

  // ── powerbi.ts — GET /admin/tenants/:id/powerbi-config ───────────────────────

  describe('powerbi sub-module — GET /admin/tenants/:id/powerbi-config', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/admin/tenants/1/powerbi-config');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated (DB stub returns config → sendSuccess)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/admin/tenants/1/powerbi-config');
      expect(res.status).toBe(200);
    });
  });

  // ── enterprise-mcp.ts — GET /admin/tenants/:id/enterprise-mcp/idps ───────────

  describe('enterprise-mcp sub-module — GET /admin/tenants/:id/enterprise-mcp/idps', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/admin/tenants/1/enterprise-mcp/idps');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/admin/tenants/1/enterprise-mcp/idps');
      expect(res.status).toBe(200);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. CONTROL-TOWER DOMAIN
// Sub-modules: sense, decide, act, govern-evolve, substrate-replay
// Note: index.ts wraps all routes with authMiddleware({ required: true })
// ─────────────────────────────────────────────────────────────────────────────

describe('Control-tower domain smoke tests', () => {
  let domainRouter: Router;

  beforeAll(async () => {
    const { register } = await import('../control-tower/index.js');
    domainRouter = Router();
    register(domainRouter);
  });

  // ── sense.ts — GET /control-tower/sense/signals ───────────────────────────────

  describe('sense sub-module — GET /control-tower/sense/signals', () => {
    it('returns 401 when unauthenticated (index-level auth guard)', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/control-tower/sense/signals');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/control-tower/sense/signals');
      expect(res.status).toBe(200);
    });
  });

  // ── decide.ts — GET /control-tower/decide/agents ─────────────────────────────

  describe('decide sub-module — GET /control-tower/decide/agents', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/control-tower/decide/agents');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/control-tower/decide/agents');
      expect(res.status).toBe(200);
    });
  });

  // ── act.ts — GET /control-tower/act/pipelines ────────────────────────────────

  describe('act sub-module — GET /control-tower/act/pipelines', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/control-tower/act/pipelines');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/control-tower/act/pipelines');
      expect(res.status).toBe(200);
    });
  });

  // ── govern-evolve.ts — GET /control-tower/govern/compliance ──────────────────

  describe('govern-evolve sub-module — GET /control-tower/govern/compliance', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/control-tower/govern/compliance');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/control-tower/govern/compliance');
      expect(res.status).toBe(200);
    });
  });

  // ── substrate-replay.ts — POST /substrate/run ────────────────────────────────

  describe('substrate-replay sub-module — POST /substrate/run', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app)
        .post('/substrate/run')
        .send({ workflowId: 'opportunity-audit', input: {}, mode: 'live' });
      expect(res.status).toBe(401);
    });

    it('returns 404 when authenticated with unknown workflowId', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app)
        .post('/substrate/run')
        .send({ workflowId: 'nonexistent-workflow', mode: 'live' });
      expect(res.status).toBe(404);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. DISTRIBUTION-OS DOMAIN
// Sub-modules: content-crud, publishing, platform-analytics
// ─────────────────────────────────────────────────────────────────────────────

describe('Distribution-OS domain smoke tests', () => {
  let domainRouter: Router;

  beforeAll(async () => {
    const { register } = await import('../distribution-os/index.js');
    domainRouter = Router();
    register(domainRouter);
  });

  // ── content-crud.ts — GET /articles (no auth on GET) ─────────────────────────

  describe('content-crud sub-module — GET /articles', () => {
    it('returns 200 for unauthenticated GET (public read)', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/articles');
      expect(res.status).toBe(200);
    });

    it('returns 200 for authenticated GET', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/articles');
      expect(res.status).toBe(200);
    });
  });

  // ── publishing.ts — POST /x-posts/:id/publish (auth required) ────────────────

  describe('publishing sub-module — POST /x-posts/:id/publish', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).post('/x-posts/1/publish').send({});
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated (DB stub returns x-post + publishXPost mock succeeds)', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).post('/x-posts/1/publish').send({});
      expect(res.status).toBe(200);
    });
  });

  // ── platform-analytics.ts — GET /platform-connections (auth required) ─────────

  describe('platform-analytics sub-module — GET /platform-connections', () => {
    it('returns 401 when unauthenticated', async () => {
      const app = buildApp(false);
      app.use(domainRouter);
      const res = await request(app).get('/platform-connections');
      expect(res.status).toBe(401);
    });

    it('returns 200 when authenticated', async () => {
      const app = buildApp('admin');
      app.use(domainRouter);
      const res = await request(app).get('/platform-connections');
      expect(res.status).toBe(200);
    });
  });
});
