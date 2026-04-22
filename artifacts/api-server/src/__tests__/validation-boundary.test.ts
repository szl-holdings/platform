/**
 * Validation boundary tests (Task #1358)
 *
 * Verifies that Zod validation middleware on write routes rejects malformed
 * or incomplete payloads with HTTP 400 and accepts well-formed payloads with
 * a 2xx response.
 *
 * Covered surfaces:
 *   - governance.ts  → POST /incidents
 *   - cms.ts         → POST /cms/sections, /cms/ventures, /cms/case-studies
 *   - alloy.ts       → POST /alloy/decisions, /alloy/skills,
 *                       POST /alloy/workflows/:id/run
 *
 * The DB and auth layers are fully mocked so the tests run in any environment
 * without a database connection and without real authentication.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function col(name: string) {
  return { _colName: name, _tag: 'col' };
}

function makeInsertChain(returnVal: unknown = {}) {
  return {
    values: (_data: unknown) => ({
      returning: () => Promise.resolve([returnVal]),
      onConflictDoNothing: () => ({ returning: () => Promise.resolve([returnVal]) }),
      onConflictDoUpdate: (_opts: unknown) => ({
        returning: () => Promise.resolve([returnVal]),
      }),
    }),
  };
}

function makeUpdateChain(returnVal: unknown = {}) {
  const chain: Record<string, unknown> = {
    set: (_d: unknown) => chain,
    where: (_d: unknown) => chain,
    returning: () => Promise.resolve([returnVal]),
  };
  return chain;
}

function _makeSelectChain(rows: unknown[] = []) {
  const chain: Record<string, unknown> = {
    from: (_t: unknown) => chain,
    where: (_d: unknown) => chain,
    orderBy: (_d: unknown) => chain,
    limit: (_n: number) => chain,
    offset: (_n: number) => Promise.resolve(rows),
    innerJoin: (_t: unknown, _on: unknown) => chain,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(rows).then(resolve, reject),
  };
  return chain;
}

// ---------------------------------------------------------------------------
// DB mock — good enough to satisfy all routes under test
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  const mockOrg = { id: 1, name: 'Test Org', slug: 'test-org' };
  const mockWorkflow = {
    id: 1,
    orgId: 1,
    name: 'Test Workflow',
    isActive: true,
    requiresApproval: false,
    runCount: 0,
    approverRole: null,
  };

  const db = {
    insert: (_table: unknown) => makeInsertChain({ id: 1 }),
    update: (_table: unknown) => makeUpdateChain({ id: 1 }),
    select: () => {
      let _resolvedRows: unknown[] = [];
      const chain: Record<string, unknown> = {
        from: (table: { _name?: string }) => {
          if (table && (table as { _name?: string })._name === 'alloy_workflows') {
            _resolvedRows = [mockWorkflow];
          } else if (table && (table as { _name?: string })._name === 'organizations') {
            _resolvedRows = [mockOrg];
          } else {
            _resolvedRows = [{ count: 0 }];
          }
          return chain;
        },
        where: (_d: unknown) => chain,
        orderBy: (_d: unknown) => chain,
        limit: (_n: number) => chain,
        offset: (_n: number) => Promise.resolve(_resolvedRows),
        innerJoin: (_t: unknown, _on: unknown) => chain,
        then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
          Promise.resolve(_resolvedRows).then(resolve, reject),
      };
      return chain;
    },
    execute: (_q: unknown) => Promise.resolve({ rows: [{ count: 0 }] }),
    delete: (_table: unknown) => ({ where: (_d: unknown) => Promise.resolve([]) }),
  };

  return {
    db,
    pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },

    // Tables referenced in governance.ts
    alloyLegacyPoliciesTable: { _name: 'alloy_policies', id: col('id'), isActive: col('is_active'), policyType: col('policy_type'), priority: col('priority'), createdAt: col('created_at') },
    auditEventsTable: { _name: 'audit_events', id: col('id') },
    costBudgetsTable: { _name: 'cost_budgets', id: col('id'), isActive: col('is_active'), createdAt: col('created_at') },
    costEventsTable: { _name: 'cost_events', id: col('id'), eventType: col('event_type'), createdAt: col('created_at') },
    governanceIncidentsTable: { _name: 'governance_incidents', id: col('id'), severity: col('severity'), incidentType: col('incident_type'), createdAt: col('created_at') },
    modelRoutingPoliciesTable: { _name: 'model_routing_policies', id: col('id'), modelProvider: col('model_provider'), priority: col('priority') },

    // Tables referenced in cms.ts
    articlesTable: { _name: 'articles', id: col('id'), status: col('status'), siteId: col('site_id'), updatedAt: col('updated_at'), publishedAt: col('published_at') },
    caseStudiesTable: { _name: 'case_studies', id: col('id'), status: col('status'), siteId: col('site_id'), slug: col('slug'), publishedAt: col('published_at') },
    cmsPostsTable: { _name: 'cms_posts', id: col('id') },
    contactSubmissionsTable: { _name: 'contact_submissions', id: col('id') },
    ctasTable: { _name: 'ctas', id: col('id') },
    downloadsTable: { _name: 'downloads', id: col('id') },
    faqsTable: { _name: 'faqs', id: col('id') },
    featuresTable: { _name: 'features', id: col('id') },
    formsTable: { _name: 'forms', id: col('id') },
    leadStatusTable: { _name: 'lead_status', id: col('id') },
    mediaAssetsTable: { _name: 'media_assets', id: col('id') },
    navigationItemsTable: { _name: 'navigation_items', id: col('id') },
    pagesTable: { _name: 'pages', id: col('id'), status: col('status'), siteId: col('site_id'), updatedAt: col('updated_at') },
    redirectsTable: { _name: 'redirects', id: col('id') },
    roadmapItemsTable: { _name: 'roadmap_items', id: col('id') },
    sectionsTable: { _name: 'sections', id: col('id'), pageId: col('page_id'), sortOrder: col('sort_order') },
    servicesTable: { _name: 'services', id: col('id') },
    siteSettingsTable: { _name: 'site_settings', id: col('id') },
    sitesTable: { _name: 'sites', id: col('id'), slug: col('slug') },
    testimonialsTable: { _name: 'testimonials', id: col('id') },
    updatesTable: { _name: 'updates', id: col('id') },
    useCasesTable: { _name: 'use_cases', id: col('id') },
    venturesTable: { _name: 'ventures', id: col('id'), slug: col('slug'), name: col('name'), sortOrder: col('sort_order') },

    // Tables referenced in alloy.ts
    alloyWorkflowsTable: Object.assign(
      { _name: 'alloy_workflows' },
      {
        id: col('id'), orgId: col('org_id'), name: col('name'), isActive: col('is_active'),
        requiresApproval: col('requires_approval'), runCount: col('run_count'),
        approverRole: col('approver_role'), createdAt: col('created_at'), updatedAt: col('updated_at'),
        lastRunAt: col('last_run_at'), createdBy: col('created_by'),
      },
    ),
    alloySignalsTable: { _name: 'alloy_signals', id: col('id'), orgId: col('org_id') },
    alloyWorkflowRunsTable: { _name: 'alloy_workflow_runs', id: col('id'), workflowId: col('workflow_id'), state: col('state') },
    alloyArtifactsTable: { _name: 'alloy_artifacts', id: col('id'), orgId: col('org_id') },
    alloyApprovalsTable: { _name: 'alloy_approvals', id: col('id') },
    alloyAuditLogTable: { _name: 'alloy_audit_log', id: col('id') },
    featureFlagsTable: { _name: 'feature_flags', id: col('id') },
    alloyDecisions: { _name: 'alloy_decisions', id: col('id') },
    alloySkills: { _name: 'alloy_skills', id: col('id'), category: col('category'), approvalClass: col('approval_class'), usageCount: col('usage_count') },
    alloySkillRuns: { _name: 'alloy_skill_runs', id: col('id'), skillId: col('skill_id'), createdAt: col('created_at') },

    // Insert schemas used inside alloy.ts
    insertAlloyWorkflowSchema: { parse: (v: unknown) => v },
    insertAlloySignalSchema: { parse: (v: unknown) => v },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  or: (...conds: unknown[]) => ({ op: 'or', conds }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  asc: (col: unknown) => ({ op: 'asc', col }),
  isNull: (col: unknown) => ({ op: 'isNull', col }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ op: 'sql', strings, values }),
    { raw: (s: string) => s },
  ),
  inArray: (col: unknown, vals: unknown) => ({ op: 'inArray', col, vals }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  lte: (col: unknown, val: unknown) => ({ op: 'lte', col, val }),
}));

// ---------------------------------------------------------------------------
// Shared auth mock — injects a super_admin user into every request
// ---------------------------------------------------------------------------

const mockUser = {
  id: 1,
  displayName: 'Test Admin',
  email: 'admin@test.example',
  roles: ['super_admin', 'admin', 'editor', 'ops'],
  orgs: [{ orgId: 1, orgSlug: 'test-org', orgName: 'Test Org', role: 'super_admin' }],
};

vi.mock('../middlewares/auth', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user: typeof mockUser }).user = mockUser;
    next();
  },
  requireRole:
    (..._roles: string[]) =>
    (_req: Request, _res: Response, next: NextFunction) =>
      next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (raw: string) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) throw new Error('Invalid id');
    return n;
  },
  InvalidIdError: class InvalidIdError extends Error {},
}));

vi.mock('../middlewares/platform-auth', () => ({
  platformAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
  logPlatformEvent: vi.fn(),
}));

vi.mock('../middlewares/telemetry', () => ({
  withDbSpan: <T>(_req: unknown, fn: () => Promise<T>, _name?: string) => fn(),
}));

vi.mock('../lib/platform-flags', () => ({
  isFlagEnabled: () => false,
}));

vi.mock('../lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn(() => Promise.resolve()) },
  ALLOY_EVENTS: {
    WORKFLOW_RUN_UPDATED: 'ALLOY_WORKFLOW_RUN_UPDATED',
    SIGNAL_CREATED: 'ALLOY_SIGNAL_CREATED',
    APPROVAL_REQUIRED: 'ALLOY_APPROVAL_REQUIRED',
    WORKFLOW_STATUS_CHANGED: 'ALLOY_WORKFLOW_STATUS_CHANGED',
  },
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../lib/autonomy-store', () => ({
  AUTONOMY_MODES: ['observe', 'approve-before-act', 'approved-act'],
  evaluateAutonomyForAction: vi.fn(() =>
    Promise.resolve({ policyState: 'allowed', policyReason: 'allowed' }),
  ),
  getAutonomyMode: vi.fn(() => Promise.resolve(null)),
  listAutonomyModes: vi.fn(() => Promise.resolve([])),
  setAutonomyMode: vi.fn(() => Promise.resolve({ mode: 'approved-act' })),
}));

vi.mock('../lib/alloy-run-failure-notifications', () => ({
  notifyRunFailure: vi.fn(() => Promise.resolve()),
}));

vi.mock('@szl-holdings/services', () => ({
  services: {
    email: { send: vi.fn(() => Promise.resolve()) },
    storage: { upload: vi.fn(() => Promise.resolve({ url: 'https://storage.example/file' })) },
  },
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (shape: unknown) => {
    const { z } = require('zod');
    return z.object(shape as Record<string, unknown>);
  },
}));

// ---------------------------------------------------------------------------
// App builders — lazy-load routers AFTER mocks are registered
// ---------------------------------------------------------------------------

let governanceApp: express.Application | null = null;
let cmsApp: express.Application | null = null;
let alloyApp: express.Application | null = null;

async function getGovernanceApp(): Promise<express.Application> {
  if (governanceApp) return governanceApp;
  const { default: governanceRouter } = await import('../routes/governance.js');
  governanceApp = express();
  governanceApp.use(express.json());
  governanceApp.use(governanceRouter);
  return governanceApp;
}

async function getCmsApp(): Promise<express.Application> {
  if (cmsApp) return cmsApp;
  const { default: cmsRouter } = await import('../routes/cms.js');
  cmsApp = express();
  cmsApp.use(express.json());
  // Patch isAuthenticated onto every request (requireCmsWrite uses it directly)
  cmsApp.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { isAuthenticated: () => boolean }).isAuthenticated = () => true;
    (req as Request & { user: typeof mockUser }).user = mockUser;
    next();
  });
  cmsApp.use(cmsRouter);
  return cmsApp;
}

async function getAlloyApp(): Promise<express.Application> {
  if (alloyApp) return alloyApp;
  const { default: alloyRouter } = await import('../routes/alloy.js');
  alloyApp = express();
  alloyApp.use(express.json());
  alloyApp.use(alloyRouter);
  return alloyApp;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('API validation boundary — bad data returns 400, valid data returns 2xx', () => {
  beforeAll(async () => {
    await getGovernanceApp();
    await getCmsApp();
    await getAlloyApp();
  });

  // ── governance: POST /incidents ───────────────────────────────────────────

  describe('POST /incidents (governance incidents)', () => {
    it('returns 400 when incidentType is missing', async () => {
      const app = await getGovernanceApp();
      const res = await request(app)
        .post('/incidents')
        .send({ title: 'Something bad happened' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when title is missing', async () => {
      const app = await getGovernanceApp();
      const res = await request(app)
        .post('/incidents')
        .send({ incidentType: 'policy_violation' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when body is empty', async () => {
      const app = await getGovernanceApp();
      const res = await request(app).post('/incidents').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when severity is an invalid enum value', async () => {
      const app = await getGovernanceApp();
      const res = await request(app).post('/incidents').send({
        incidentType: 'policy_violation',
        title: 'Bad severity',
        severity: 'catastrophic',
      });
      expect(res.status).toBe(400);
    });

    it('returns 201 with a valid payload', async () => {
      const app = await getGovernanceApp();
      const res = await request(app).post('/incidents').send({
        incidentType: 'policy_violation',
        title: 'Unauthorized model call detected',
        severity: 'high',
        description: 'Agent called a disallowed model endpoint.',
      });
      expect(res.status).toBe(201);
    });
  });

  // ── cms: POST /cms/sections ───────────────────────────────────────────────

  describe('POST /cms/sections', () => {
    it('returns 400 when sectionType is missing', async () => {
      const app = await getCmsApp();
      const res = await request(app)
        .post('/cms/sections')
        .send({ title: 'Hero section' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when body is empty', async () => {
      const app = await getCmsApp();
      const res = await request(app).post('/cms/sections').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when sectionType is an empty string', async () => {
      const app = await getCmsApp();
      const res = await request(app)
        .post('/cms/sections')
        .send({ sectionType: '' });
      expect(res.status).toBe(400);
    });

    it('returns 201 with a valid payload', async () => {
      const app = await getCmsApp();
      const res = await request(app).post('/cms/sections').send({
        sectionType: 'hero',
        title: 'Our Mission',
        isVisible: true,
      });
      expect(res.status).toBe(201);
    });
  });

  // ── cms: POST /cms/ventures ───────────────────────────────────────────────

  describe('POST /cms/ventures', () => {
    it('returns 400 when name is missing', async () => {
      const app = await getCmsApp();
      const res = await request(app)
        .post('/cms/ventures')
        .send({ slug: 'my-venture' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when slug is missing', async () => {
      const app = await getCmsApp();
      const res = await request(app)
        .post('/cms/ventures')
        .send({ name: 'My Venture' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when slug contains invalid characters', async () => {
      const app = await getCmsApp();
      const res = await request(app).post('/cms/ventures').send({
        name: 'My Venture',
        slug: 'my venture!',
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 when body is empty', async () => {
      const app = await getCmsApp();
      const res = await request(app).post('/cms/ventures').send({});
      expect(res.status).toBe(400);
    });

    it('returns 201 with a valid payload', async () => {
      const app = await getCmsApp();
      const res = await request(app).post('/cms/ventures').send({
        name: 'Acme AI',
        slug: 'acme-ai',
        tagline: 'Intelligence at scale',
        status: 'active',
      });
      expect(res.status).toBe(201);
    });
  });

  // ── cms: POST /cms/case-studies ───────────────────────────────────────────

  describe('POST /cms/case-studies', () => {
    it('returns 400 when title is missing', async () => {
      const app = await getCmsApp();
      const res = await request(app)
        .post('/cms/case-studies')
        .send({ slug: 'great-case-study' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when slug is missing', async () => {
      const app = await getCmsApp();
      const res = await request(app)
        .post('/cms/case-studies')
        .send({ title: 'Great Case Study' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when body is empty', async () => {
      const app = await getCmsApp();
      const res = await request(app).post('/cms/case-studies').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when status is an invalid enum value', async () => {
      const app = await getCmsApp();
      const res = await request(app).post('/cms/case-studies').send({
        title: 'Great Case Study',
        slug: 'great-case-study',
        status: 'live',
      });
      expect(res.status).toBe(400);
    });

    it('returns 201 with a valid payload', async () => {
      const app = await getCmsApp();
      const res = await request(app).post('/cms/case-studies').send({
        title: 'How Acme Reduced Costs by 40%',
        slug: 'acme-cost-reduction',
        status: 'published',
        client: 'Acme Corp',
        excerpt: 'A transformational journey.',
      });
      expect(res.status).toBe(201);
    });
  });

  // ── alloy: POST /alloy/decisions ──────────────────────────────────────────

  describe('POST /alloy/decisions', () => {
    it('returns 400 when title is missing', async () => {
      const app = await getAlloyApp();
      const res = await request(app)
        .post('/decisions')
        .send({ summary: 'A decision was made' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when body is empty', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/decisions').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when title is an empty string', async () => {
      const app = await getAlloyApp();
      const res = await request(app)
        .post('/decisions')
        .send({ title: '' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when approvalStatus is an invalid enum value', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/decisions').send({
        title: 'Deploy to production',
        approvalStatus: 'maybe',
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 when confidence is out of range', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/decisions').send({
        title: 'Deploy to production',
        confidence: 1.5,
      });
      expect(res.status).toBe(400);
    });

    it('returns 201 with a valid payload', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/decisions').send({
        title: 'Approve infrastructure scaling',
        summary: 'Scale up GPU cluster to handle demand spike.',
        verdict: 'approve',
        confidence: 0.92,
        approvalStatus: 'propose_only',
        agentName: 'InfraAgent',
      });
      expect(res.status).toBe(201);
    });
  });

  // ── alloy: POST /alloy/skills ─────────────────────────────────────────────

  describe('POST /alloy/skills', () => {
    it('returns 400 when name is missing', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/skills').send({
        slug: 'send-email',
        category: 'communication',
        description: 'Sends an email.',
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when slug is missing', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/skills').send({
        name: 'Send Email',
        category: 'communication',
        description: 'Sends an email.',
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when category is missing', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/skills').send({
        name: 'Send Email',
        slug: 'send-email',
        description: 'Sends an email.',
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when description is missing', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/skills').send({
        name: 'Send Email',
        slug: 'send-email',
        category: 'communication',
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when body is empty', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/skills').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when slug contains invalid characters', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/skills').send({
        name: 'Send Email',
        slug: 'send email!',
        category: 'communication',
        description: 'Sends an email.',
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 when approvalClass is an invalid enum value', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/skills').send({
        name: 'Send Email',
        slug: 'send-email',
        category: 'communication',
        description: 'Sends an email.',
        approvalClass: 'anyone',
      });
      expect(res.status).toBe(400);
    });

    it('returns 201 with a valid payload', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/skills').send({
        name: 'Send Email',
        slug: 'send-email',
        category: 'communication',
        description: 'Sends a transactional email to a specified recipient.',
        approvalClass: 'review',
        dryRunSupported: true,
        tags: ['email', 'outbound'],
      });
      expect(res.status).toBe(201);
    });
  });

  // ── alloy: POST /alloy/workflows/:id/run ──────────────────────────────────

  describe('POST /alloy/workflows/:id/run (workflow run trigger)', () => {
    it('returns 400 when workflowRunSchema receives wrong type for signalId', async () => {
      const app = await getAlloyApp();
      const res = await request(app)
        .post('/alloy/workflows/1/run')
        .send({ signalId: 'not-a-number' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 400 when input is not an object (array passed instead)', async () => {
      const app = await getAlloyApp();
      const res = await request(app)
        .post('/alloy/workflows/1/run')
        .send({ input: ['not', 'an', 'object'] });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('code');
    });

    it('returns 201 with an empty payload (all fields optional)', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/alloy/workflows/1/run').send({});
      expect(res.status).toBe(201);
    });

    it('returns 201 with valid optional fields provided', async () => {
      const app = await getAlloyApp();
      const res = await request(app).post('/alloy/workflows/1/run').send({
        input: { target: 'prod', dryRun: false },
      });
      expect(res.status).toBe(201);
    });
  });
});
