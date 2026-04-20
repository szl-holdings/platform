/**
 * Onboarding & Wizard Integration Tests
 *
 * Coverage:
 *  - POST /onboarding/org — org creation, duplicate slug rejection
 *  - GET  /onboarding/wizard/:orgSlug — wizard state retrieval, RBAC
 *  - PUT  /onboarding/wizard/:orgSlug — step progression (profile → team → notifications → integrations)
 *  - POST /onboarding/wizard/:orgSlug/complete — marks onboarding complete
 *  - POST /onboarding/resend-invite/:orgSlug — invite creation
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mutable state
// ---------------------------------------------------------------------------

let _currentUser = makeAdminUser();

function makeAdminUser() {
  return {
    id: 10,
    displayName: 'Admin Alice',
    email: 'alice@test.example',
    roles: ['admin'],
    orgs: [{ orgId: 5, orgSlug: 'test-org', orgName: 'Test Org', role: 'owner' }],
  };
}

function makeMemberUser() {
  return {
    id: 20,
    displayName: 'Bob Member',
    email: 'bob@test.example',
    roles: ['member'],
    orgs: [{ orgId: 5, orgSlug: 'test-org', orgName: 'Test Org', role: 'member' }],
  };
}

let _selectQueue: unknown[][] = [];
let _insertReturnQueue: unknown[][] = [];
let _updateReturnQueue: unknown[][] = [];
let _poolQueryQueue: { rows: unknown[] }[] = [];

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  const col = (name: string) => ({ _colName: name });

  const poolMock = {
    query: vi.fn(() => {
      const next = _poolQueryQueue.shift();
      return Promise.resolve(next ?? { rows: [] });
    }),
  };

  return {
    db: {
      select(_fields?: unknown) {
        const result = (_selectQueue.shift() ?? []) as unknown[];
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: () => chain,
          innerJoin: () => chain,
          orderBy: () => chain,
          groupBy: () => chain,
          limit: () => Promise.resolve(result),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
        };
        return chain;
      },
      insert(_table: unknown) {
        return {
          values: () => ({
            returning: () => Promise.resolve(_insertReturnQueue.shift() ?? []),
          }),
        };
      },
      update(_table: unknown) {
        const chain: Record<string, unknown> = {
          set: () => chain,
          where: () => ({
            returning: () => Promise.resolve(_updateReturnQueue.shift() ?? []),
          }),
        };
        return chain;
      },
      delete(_table: unknown) {
        return { where: () => Promise.resolve() };
      },
    },
    pool: poolMock,
    organizationsTable: {
      id: col('id'),
      name: col('name'),
      slug: col('slug'),
      domain: col('domain'),
      logoUrl: col('logo_url'),
      orgType: col('org_type'),
      plan: col('plan'),
      status: col('status'),
      isActive: col('is_active'),
      createdAt: col('created_at'),
      updatedAt: col('updated_at'),
    },
    orgMembersTable: {
      id: col('id'),
      orgId: col('org_id'),
      userId: col('user_id'),
      role: col('role'),
      joinedAt: col('joined_at'),
    },
    orgInvitationsTable: {
      id: col('id'),
      orgId: col('org_id'),
      invitedByUserId: col('invited_by_user_id'),
      email: col('email'),
      role: col('role'),
      token: col('token'),
      status: col('status'),
      expiresAt: col('expires_at'),
    },
    usersTable: {
      id: col('id'),
      displayName: col('display_name'),
      email: col('email'),
      avatarUrl: col('avatar_url'),
    },
    auditEventsTable: {
      userId: col('user_id'),
      action: col('action'),
      entityType: col('entity_type'),
      entityId: col('entity_id'),
      ipAddress: col('ip_address'),
      newValues: col('new_values'),
    },
    notificationsTable: {
      userId: col('user_id'),
      type: col('type'),
      channel: col('channel'),
      title: col('title'),
      message: col('message'),
      actionUrl: col('action_url'),
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  gt: (col: unknown, val: unknown) => ({ op: 'gt', col, val }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  lte: (col: unknown, val: unknown) => ({ op: 'lte', col, val }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  ne: (col: unknown, val: unknown) => ({ op: 'ne', col, val }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ op: 'sql', strings, values }),
    { raw: (s: string) => s },
  ),
  count: () => ({ op: 'count' }),
  sum: (col: unknown) => ({ op: 'sum', col }),
  inArray: (col: unknown, vals: unknown) => ({ op: 'inArray', col, vals }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = _currentUser;
    next();
  },
  isElevatedUser: (user: { roles: string[] }) =>
    user.roles.includes('super_admin') || user.roles.includes('admin'),
}));

vi.mock('../../middlewares/rate-limiters', () => ({
  writeLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  readLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@szl-holdings/audit', () => ({
  hashIp: () => 'hashed-ip',
}));

vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve({ success: true })),
  buildOrgInviteEmail: vi.fn(() => '<html>invite</html>'),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// App builder
// ---------------------------------------------------------------------------

let _app: express.Application | null = null;

async function getApp(): Promise<express.Application> {
  if (_app) return _app;
  const { default: onboardingRouter } = await import('../onboarding.js');
  _app = express();
  _app.use(express.json());
  _app.use(onboardingRouter);
  return _app;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG = {
  id: 5,
  name: 'Test Org',
  slug: 'test-org',
  domain: null,
  orgType: null,
  plan: 'free',
  status: 'active',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const OWNER_MEMBERSHIP = {
  id: 1,
  orgId: 5,
  userId: 10,
  role: 'owner',
  joinedAt: new Date('2026-01-01'),
};

const MEMBER_MEMBERSHIP = {
  id: 2,
  orgId: 5,
  userId: 20,
  role: 'member',
  joinedAt: new Date('2026-01-01'),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wizardStateRows(
  overrides: Partial<{
    current_step: string;
    completed_steps: string[];
    step_data: Record<string, unknown>;
    completed_at: string | null;
  }> = {},
) {
  return [
    {
      current_step: 'profile',
      completed_steps: [],
      step_data: { profile: {}, team: {}, notifications: {}, integrations: {} },
      completed_at: null,
      ...overrides,
    },
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /onboarding/org — create organization', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _poolQueryQueue = [];
    _currentUser = makeAdminUser();
  });

  it('returns 201 and the new org when slug is unique', async () => {
    _selectQueue = [[]];
    _insertReturnQueue = [[{ ...ORG, id: 99, name: 'New Co', slug: 'new-co' }], [], [], []];
    _poolQueryQueue = [{ rows: [] }];

    const app = await getApp();
    const res = await request(app)
      .post('/onboarding/org')
      .send({ name: 'New Co', slug: 'new-co', plan: 'free' });

    expect(res.status).toBe(201);
    expect(res.body.org.slug).toBe('new-co');
    expect(res.body.nextStep).toBe('profile');
  });

  it('returns 400 when the slug already exists', async () => {
    _selectQueue = [[ORG]];

    const app = await getApp();
    const res = await request(app)
      .post('/onboarding/org')
      .send({ name: 'Test Org', slug: 'test-org', plan: 'free' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/slug already exists/i);
  });

  it('returns 400 when slug contains uppercase letters (schema validation)', async () => {
    const app = await getApp();
    const res = await request(app)
      .post('/onboarding/org')
      .send({ name: 'Bad Slug', slug: 'Bad-Slug', plan: 'free' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is too short', async () => {
    const app = await getApp();
    const res = await request(app)
      .post('/onboarding/org')
      .send({ name: 'A', slug: 'a', plan: 'free' });

    expect(res.status).toBe(400);
  });

  it('accepts optional domain and orgType fields', async () => {
    _selectQueue = [[]];
    _insertReturnQueue = [
      [{ ...ORG, id: 100, slug: 'enterprise-co', domain: 'enterprise.co', orgType: 'enterprise' }],
      [],
      [],
      [],
    ];
    _poolQueryQueue = [{ rows: [] }];

    const app = await getApp();
    const res = await request(app).post('/onboarding/org').send({
      name: 'Enterprise Co',
      slug: 'enterprise-co',
      domain: 'enterprise.co',
      orgType: 'enterprise',
    });

    expect(res.status).toBe(201);
    expect(res.body.org.domain).toBe('enterprise.co');
  });
});

describe('GET /onboarding/wizard/:orgSlug — wizard state', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _poolQueryQueue = [];
    _currentUser = makeAdminUser();
  });

  it('returns wizard state for an org admin', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [{ rows: wizardStateRows() }];

    const app = await getApp();
    const res = await request(app).get('/onboarding/wizard/test-org');

    expect(res.status).toBe(200);
    expect(res.body.wizard).toBeDefined();
    expect(res.body.wizard.currentStep).toBe('profile');
    expect(Array.isArray(res.body.wizard.steps)).toBe(true);
    expect(res.body.wizard.steps).toHaveLength(4);
    expect(res.body.wizard.isComplete).toBe(false);
    expect(res.body.wizard.progress).toBe(0);
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).get('/onboarding/wizard/nonexistent');

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is a non-admin member', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [[ORG], [MEMBER_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app).get('/onboarding/wizard/test-org');

    expect(res.status).toBe(403);
  });

  it('reflects completed steps and correct progress percentage', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: wizardStateRows({
          current_step: 'notifications',
          completed_steps: ['profile', 'team'],
        }),
      },
    ];

    const app = await getApp();
    const res = await request(app).get('/onboarding/wizard/test-org');

    expect(res.status).toBe(200);
    expect(res.body.wizard.progress).toBe(50);
    const completedSteps = res.body.wizard.steps.filter((s: { completed: boolean }) => s.completed);
    expect(completedSteps).toHaveLength(2);
  });

  it('shows wizard as complete when completedAt is set', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: wizardStateRows({
          current_step: 'complete',
          completed_steps: ['profile', 'team', 'notifications', 'integrations'],
          completed_at: '2026-04-01T00:00:00Z',
        }),
      },
    ];

    const app = await getApp();
    const res = await request(app).get('/onboarding/wizard/test-org');

    expect(res.status).toBe(200);
    expect(res.body.wizard.isComplete).toBe(true);
    expect(res.body.wizard.progress).toBe(100);
  });

  it('super_admin can access wizard without org membership', async () => {
    _currentUser = { ..._currentUser, roles: ['super_admin'], orgs: [] } as any;
    _selectQueue = [[ORG]];
    _poolQueryQueue = [{ rows: wizardStateRows() }];

    const app = await getApp();
    const res = await request(app).get('/onboarding/wizard/test-org');

    expect(res.status).toBe(200);
  });
});

describe('PUT /onboarding/wizard/:orgSlug — wizard step progression', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _poolQueryQueue = [];
    _currentUser = makeAdminUser();
  });

  it('completes the profile step and advances currentStep to team', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [{ rows: wizardStateRows() }, { rows: [] }];

    const app = await getApp();
    const res = await request(app)
      .put('/onboarding/wizard/test-org')
      .send({ step: 'profile', data: { name: 'Updated Org Name', industry: 'Tech' } });

    expect(res.status).toBe(200);
    expect(res.body.step).toBe('profile');
    expect(res.body.completedSteps).toContain('profile');
    expect(res.body.currentStep).toBe('team');
    expect(res.body.progress).toBe(25);
  });

  it('completes the team step and advances currentStep to notifications', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [
      { rows: wizardStateRows({ completed_steps: ['profile'], current_step: 'team' }) },
      { rows: [] },
    ];

    const app = await getApp();
    const res = await request(app)
      .put('/onboarding/wizard/test-org')
      .send({ step: 'team', data: { members: [] } });

    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe('notifications');
    expect(res.body.completedSteps).toContain('team');
  });

  it('completes the notifications step and advances to integrations', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: wizardStateRows({
          completed_steps: ['profile', 'team'],
          current_step: 'notifications',
        }),
      },
      { rows: [] },
    ];

    const app = await getApp();
    const res = await request(app)
      .put('/onboarding/wizard/test-org')
      .send({ step: 'notifications', data: { emailEnabled: true } });

    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe('integrations');
  });

  it('completes the integrations step and sets currentStep to complete', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: wizardStateRows({
          completed_steps: ['profile', 'team', 'notifications'],
          current_step: 'integrations',
        }),
      },
      { rows: [] },
    ];

    const app = await getApp();
    const res = await request(app)
      .put('/onboarding/wizard/test-org')
      .send({ step: 'integrations', data: {} });

    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe('complete');
    expect(res.body.progress).toBe(100);
  });

  it('does not duplicate already-completed steps', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [
      { rows: wizardStateRows({ completed_steps: ['profile'], current_step: 'team' }) },
      { rows: [] },
    ];

    const app = await getApp();
    const res = await request(app)
      .put('/onboarding/wizard/test-org')
      .send({ step: 'profile', data: {} });

    expect(res.status).toBe(200);
    const profileCount = res.body.completedSteps.filter((s: string) => s === 'profile').length;
    expect(profileCount).toBe(1);
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .put('/onboarding/wizard/not-a-real-org')
      .send({ step: 'profile', data: {} });

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid step value', async () => {
    const app = await getApp();
    const res = await request(app)
      .put('/onboarding/wizard/test-org')
      .send({ step: 'billing', data: {} });

    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-admin member tries to update the wizard', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [[ORG], [MEMBER_MEMBERSHIP]];
    _poolQueryQueue = [{ rows: wizardStateRows() }];

    const app = await getApp();
    const res = await request(app)
      .put('/onboarding/wizard/test-org')
      .send({ step: 'profile', data: {} });

    expect(res.status).toBe(403);
  });
});

describe('POST /onboarding/wizard/:orgSlug/complete — mark onboarding complete', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _poolQueryQueue = [];
    _currentUser = makeAdminUser();
  });

  it('returns 200 and marks onboarding complete', async () => {
    _selectQueue = [[ORG], [OWNER_MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: wizardStateRows({
          completed_steps: ['profile', 'team', 'notifications', 'integrations'],
        }),
      },
      { rows: [] },
    ];
    _insertReturnQueue = [[], []];

    const app = await getApp();
    const res = await request(app).post('/onboarding/wizard/test-org/complete').send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/complete/i);
    expect(res.body.completedAt).toBeTruthy();
  });

  it('returns 404 for a nonexistent org', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).post('/onboarding/wizard/ghost-org/complete').send({});

    expect(res.status).toBe(404);
  });

  it('returns 403 when caller is not an org admin', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [[ORG], [MEMBER_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app).post('/onboarding/wizard/test-org/complete').send({});

    expect(res.status).toBe(403);
  });
});

describe('POST /onboarding/resend-invite/:orgSlug — send/resend invite', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _poolQueryQueue = [];
    _currentUser = makeAdminUser();
  });

  it('creates and returns a pending invitation', async () => {
    _selectQueue = [
      [ORG],
      [OWNER_MEMBERSHIP],
      [{ displayName: 'Alice', email: 'alice@test.example' }],
    ];
    _updateReturnQueue = [[]];
    _insertReturnQueue = [
      [
        {
          id: 77,
          email: 'newmember@test.example',
          role: 'member',
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ],
    ];

    const app = await getApp();
    const res = await request(app)
      .post('/onboarding/resend-invite/test-org')
      .send({ email: 'newmember@test.example', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('newmember@test.example');
    expect(res.body.role).toBe('member');
    expect(res.body.inviteUrl).toMatch(/accept-invite/);
  });

  it('returns 400 for an invalid email address', async () => {
    const app = await getApp();
    const res = await request(app)
      .post('/onboarding/resend-invite/test-org')
      .send({ email: 'not-an-email', role: 'member' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for a nonexistent org', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .post('/onboarding/resend-invite/unknown-org')
      .send({ email: 'someone@test.example', role: 'member' });

    expect(res.status).toBe(404);
  });

  it('returns 403 when a regular member tries to invite', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [[ORG], [MEMBER_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app)
      .post('/onboarding/resend-invite/test-org')
      .send({ email: 'new@test.example', role: 'member' });

    expect(res.status).toBe(403);
  });
});
