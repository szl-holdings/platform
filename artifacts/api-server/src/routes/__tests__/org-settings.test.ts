/**
 * Org Settings Integration Tests
 *
 * Coverage:
 *  - GET    /orgs/:orgSlug/members                — list members (RBAC)
 *  - DELETE /orgs/:orgSlug/members/:userId        — remove member (RBAC, owner-protection)
 *  - PUT    /orgs/:orgSlug/members/:userId/role   — update role (RBAC, owner-protection)
 *  - GET    /orgs/:orgSlug/notification-prefs     — get org notification settings
 *  - PUT    /orgs/:orgSlug/notification-prefs     — partial update merges with existing values
 *  - GET    /gdpr/export                          — returns valid JSON user export
 *  - POST   /gdpr/erasure                         — GDPR right-to-erasure (Article 17)
 *  - GET    /gdpr/data-processing-records         — GDPR Article 30 records of processing activities
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mutable state
// ---------------------------------------------------------------------------

let _currentUser = makeOrgAdminUser();

/**
 * Platform member who holds org-level admin membership.
 * roles: ["member"] ensures isElevated() is false and the route
 * falls through to the DB-based membership lookup path.
 */
function makeOrgAdminUser() {
  return {
    id: 10,
    displayName: 'Admin Alice',
    email: 'alice@test.example',
    roles: ['member'],
    orgs: [{ orgId: 5, orgSlug: 'acme-corp', orgName: 'Acme Corp', role: 'admin' }],
  };
}

function makeMemberUser() {
  return {
    id: 20,
    displayName: 'Bob Member',
    email: 'bob@test.example',
    roles: ['member'],
    orgs: [{ orgId: 5, orgSlug: 'acme-corp', orgName: 'Acme Corp', role: 'member' }],
  };
}

function _makePlatformAdminUser() {
  return {
    id: 10,
    displayName: 'Platform Admin',
    email: 'admin@test.example',
    roles: ['admin'],
    orgs: [],
  };
}

let _selectQueue: unknown[][] = [];
let _insertReturnQueue: unknown[][] = [];
let _updateReturnQueue: unknown[][] = [];
let _deleteReturns: unknown[] = [];
let _poolQueryQueue: { rows: unknown[] }[] = [];
let _transactionCalled = false;

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
          limit: () => Promise.resolve(result),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
        };
        return chain;
      },
      insert(_table: unknown) {
        return {
          values: (_vals: unknown) => ({
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
        return {
          where: () => {
            _deleteReturns.push(true);
            return Promise.resolve();
          },
        };
      },
      async transaction(fn: (tx: unknown) => Promise<unknown>) {
        _transactionCalled = true;
        const tx = {
          execute: vi.fn(() => Promise.resolve()),
          delete(_table: unknown) {
            return {
              where: () => {
                _deleteReturns.push(true);
                return Promise.resolve();
              },
            };
          },
        };
        return fn(tx);
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
    usersTable: {
      id: col('id'),
      displayName: col('display_name'),
      email: col('email'),
      avatarUrl: col('avatar_url'),
      bio: col('bio'),
      isActive: col('is_active'),
      lastLoginAt: col('last_login_at'),
      platformRole: col('platform_role'),
      createdAt: col('created_at'),
      updatedAt: col('updated_at'),
    },
    notificationPreferencesTable: {
      id: col('id'),
      userId: col('user_id'),
      emailEnabled: col('email_enabled'),
      smsEnabled: col('sms_enabled'),
      slackEnabled: col('slack_enabled'),
      inAppEnabled: col('in_app_enabled'),
      updatedAt: col('updated_at'),
    },
    auditEventsTable: {
      userId: col('user_id'),
      action: col('action'),
      entityType: col('entity_type'),
      entityId: col('entity_id'),
      ipAddress: col('ip_address'),
      newValues: col('new_values'),
    },
    sessionsTable: {
      id: col('id'),
      userId: col('user_id'),
      createdAt: col('created_at'),
      expiresAt: col('expires_at'),
      ipAddress: col('ip_address'),
      userAgent: col('user_agent'),
    },
    notificationsTable: {
      userId: col('user_id'),
      type: col('type'),
      channel: col('channel'),
      title: col('title'),
      message: col('message'),
    },
    apiKeysTable: {
      id: col('id'),
      userId: col('user_id'),
      name: col('name'),
      createdAt: col('created_at'),
    },
    tenantSettingsTable: {
      id: col('id'),
      orgId: col('org_id'),
      namespace: col('namespace'),
      key: col('key'),
      value: col('value'),
      valueType: col('value_type'),
      label: col('label'),
      category: col('category'),
      createdBy: col('created_by'),
      updatedBy: col('updated_by'),
      createdAt: col('created_at'),
      updatedAt: col('updated_at'),
    },
    exportJobsTable: {
      id: col('id'),
      exportId: col('export_id'),
      name: col('name'),
      dataSource: col('data_source'),
      format: col('format'),
      status: col('status'),
      triggeredByUserId: col('triggered_by_user_id'),
      triggeredByEmail: col('triggered_by_email'),
      filterParams: col('filter_params'),
      downloadToken: col('download_token'),
      expiresAt: col('expires_at'),
      completedAt: col('completed_at'),
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  or: (...conds: unknown[]) => ({ op: 'or', conds }),
  ne: (col: unknown, val: unknown) => ({ op: 'ne', col, val }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  gt: (col: unknown, val: unknown) => ({ op: 'gt', col, val }),
  lt: (col: unknown, val: unknown) => ({ op: 'lt', col, val }),
  lte: (col: unknown, val: unknown) => ({ op: 'lte', col, val }),
  isNull: (col: unknown) => ({ op: 'isNull', col }),
  isNotNull: (col: unknown) => ({ op: 'isNotNull', col }),
  not: (expr: unknown) => ({ op: 'not', expr }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  asc: (col: unknown) => ({ op: 'asc', col }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ op: 'sql', strings, values }),
    { raw: (s: string) => s },
  ),
  count: () => ({ op: 'count' }),
  inArray: (col: unknown, vals: unknown) => ({ op: 'inArray', col, vals }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = _currentUser;
    next();
  },
}));

vi.mock('../../middlewares/rate-limiters', () => ({
  writeLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  readLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  gdprLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@szl-holdings/audit', () => ({
  hashIp: () => 'hashed-ip',
  queryAuditEvents: vi.fn(async () => []),
}));

vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve({ success: true })),
  buildPasswordResetEmail: vi.fn(() => '<html>reset</html>'),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/activity-logger', () => ({
  logActivity: vi.fn(async () => {}),
}));

vi.mock('../contact', () => ({
  hashEmail: (email: string) => `hashed:${email}`,
}));

// ---------------------------------------------------------------------------
// App builder
// ---------------------------------------------------------------------------

let _app: express.Application | null = null;
let _gdprApp: express.Application | null = null;

async function getApp(): Promise<express.Application> {
  if (_app) return _app;
  const { default: orgSettingsRouter } = await import('../org-settings.js');
  _app = express();
  _app.use(express.json());
  _app.use(orgSettingsRouter);
  return _app;
}

async function getGdprApp(): Promise<express.Application> {
  if (_gdprApp) return _gdprApp;
  const { default: gdprRouter } = await import('../gdpr.js');
  _gdprApp = express();
  _gdprApp.use(express.json());
  _gdprApp.use(gdprRouter);
  return _gdprApp;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG = {
  id: 5,
  name: 'Acme Corp',
  slug: 'acme-corp',
  domain: 'acme.example',
  logoUrl: null,
  orgType: 'enterprise',
  plan: 'professional',
  status: 'active',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-04-01'),
};

const ADMIN_MEMBERSHIP = {
  id: 1,
  orgId: 5,
  userId: 10,
  role: 'admin',
  joinedAt: new Date('2026-01-01'),
};

const MEMBER_MEMBERSHIP = {
  id: 2,
  orgId: 5,
  userId: 20,
  role: 'member',
  joinedAt: new Date('2026-02-01'),
};

const OWNER_MEMBERSHIP = {
  id: 3,
  orgId: 5,
  userId: 30,
  role: 'owner',
  joinedAt: new Date('2026-01-01'),
};

// ---------------------------------------------------------------------------
// List Members
// ---------------------------------------------------------------------------

describe('GET /orgs/:orgSlug/members — list members', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeOrgAdminUser();
  });

  it('returns members for an org admin', async () => {
    const memberRow = {
      memberId: 1,
      userId: 10,
      role: 'admin',
      joinedAt: new Date('2026-01-01'),
      displayName: 'Admin Alice',
      email: 'alice@test.example',
      avatarUrl: null,
      isActive: true,
      lastLoginAt: null,
    };

    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP], [memberRow]];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/members');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(res.body.total).toBe(1);
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).get('/orgs/ghost-org/members');

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not an org member', async () => {
    _currentUser = { ..._currentUser, orgs: [] };
    _selectQueue = [[ORG], []];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/members');

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Remove Member
// ---------------------------------------------------------------------------

describe('DELETE /orgs/:orgSlug/members/:userId — remove member', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeOrgAdminUser();
  });

  it('removes a member successfully and returns 204', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP], [MEMBER_MEMBERSHIP]];
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app).delete('/orgs/acme-corp/members/20');

    expect(res.status).toBe(204);
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).delete('/orgs/ghost-org/members/20');

    expect(res.status).toBe(404);
  });

  it('returns 403 when caller is a regular member (non-admin)', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [[ORG], [MEMBER_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app).delete('/orgs/acme-corp/members/30');

    expect(res.status).toBe(403);
  });

  it('returns 400 when caller tries to remove themselves', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app).delete('/orgs/acme-corp/members/10');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot remove yourself/i);
  });

  it('returns 403 when trying to remove the org owner', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP], [OWNER_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app).delete('/orgs/acme-corp/members/30');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cannot remove the organization owner/i);
  });

  it('returns 404 when target user is not a member', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP], []];

    const app = await getApp();
    const res = await request(app).delete('/orgs/acme-corp/members/999');

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid (non-numeric) userId', async () => {
    const app = await getApp();
    const res = await request(app).delete('/orgs/acme-corp/members/not-a-number');

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Update Member Role
// ---------------------------------------------------------------------------

describe('PUT /orgs/:orgSlug/members/:userId/role — update member role', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeOrgAdminUser();
  });

  it('updates a member role to admin and returns updated record', async () => {
    const updatedMembership = { ...MEMBER_MEMBERSHIP, role: 'admin' };
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP], [MEMBER_MEMBERSHIP]];
    _updateReturnQueue = [[updatedMembership]];
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app).put('/orgs/acme-corp/members/20/role').send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('returns 400 for an invalid role value', async () => {
    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/members/20/role')
      .send({ role: 'superuser' });

    expect(res.status).toBe(400);
  });

  it("returns 403 when trying to change the owner's role", async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP], [OWNER_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app).put('/orgs/acme-corp/members/30/role').send({ role: 'member' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cannot change the role of the organization owner/i);
  });

  it('returns 404 when the target user is not a member', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP], []];

    const app = await getApp();
    const res = await request(app).put('/orgs/acme-corp/members/999/role').send({ role: 'viewer' });

    expect(res.status).toBe(404);
  });

  it('returns 403 when a plain member tries to change roles', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [[ORG], [MEMBER_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app).put('/orgs/acme-corp/members/10/role').send({ role: 'viewer' });

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Org Notification Preferences
// ---------------------------------------------------------------------------

describe('GET /orgs/:orgSlug/notification-prefs — get org notification settings', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeOrgAdminUser();
  });

  it('returns stored notification prefs when row exists', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: [
          { email_enabled: true, sms_enabled: true, slack_enabled: false, in_app_enabled: true },
        ],
      },
    ];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/notification-prefs');

    expect(res.status).toBe(200);
    expect(res.body.emailEnabled).toBe(true);
    expect(res.body.smsEnabled).toBe(true);
    expect(res.body.slackEnabled).toBe(false);
    expect(res.body.inAppEnabled).toBe(true);
  });

  it('returns defaults when no notification prefs row exists', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP]];
    _poolQueryQueue = [{ rows: [] }];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/notification-prefs');

    expect(res.status).toBe(200);
    expect(res.body.emailEnabled).toBe(true);
    expect(res.body.smsEnabled).toBe(false);
    expect(res.body.inAppEnabled).toBe(true);
  });

  it('returns 403 when user is not an org member', async () => {
    _currentUser = { ..._currentUser, orgs: [] };
    _selectQueue = [[ORG], []];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/notification-prefs');

    expect(res.status).toBe(403);
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).get('/orgs/ghost-org/notification-prefs');

    expect(res.status).toBe(404);
  });
});

describe('PUT /orgs/:orgSlug/notification-prefs — partial update merges with existing', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeOrgAdminUser();
  });

  it('merges partial update with existing values — only smsEnabled changes', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: [
          { email_enabled: true, sms_enabled: false, slack_enabled: false, in_app_enabled: true },
        ],
      },
      { rows: [] },
    ];

    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/notification-prefs')
      .send({ smsEnabled: true });

    expect(res.status).toBe(200);
    expect(res.body.smsEnabled).toBe(true);
    expect(res.body.emailEnabled).toBe(true);
    expect(res.body.slackEnabled).toBe(false);
    expect(res.body.inAppEnabled).toBe(true);
  });

  it('merges when no existing row — uses defaults for unset fields', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP]];
    _poolQueryQueue = [{ rows: [] }, { rows: [] }];

    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/notification-prefs')
      .send({ slackEnabled: true });

    expect(res.status).toBe(200);
    expect(res.body.slackEnabled).toBe(true);
    expect(res.body.emailEnabled).toBe(true);
    expect(res.body.smsEnabled).toBe(false);
    expect(res.body.inAppEnabled).toBe(true);
  });

  it('allows all fields to be updated at once', async () => {
    _selectQueue = [[ORG], [ADMIN_MEMBERSHIP]];
    _poolQueryQueue = [
      {
        rows: [
          { email_enabled: true, sms_enabled: false, slack_enabled: false, in_app_enabled: true },
        ],
      },
      { rows: [] },
    ];

    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/notification-prefs')
      .send({ emailEnabled: false, smsEnabled: true, slackEnabled: true, inAppEnabled: false });

    expect(res.status).toBe(200);
    expect(res.body.emailEnabled).toBe(false);
    expect(res.body.smsEnabled).toBe(true);
    expect(res.body.slackEnabled).toBe(true);
    expect(res.body.inAppEnabled).toBe(false);
  });

  it('returns 403 when a non-admin member tries to update notification prefs', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [[ORG], [MEMBER_MEMBERSHIP]];

    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/notification-prefs')
      .send({ smsEnabled: true });

    expect(res.status).toBe(403);
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .put('/orgs/unknown-org/notification-prefs')
      .send({ emailEnabled: true });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GDPR Export
// ---------------------------------------------------------------------------

describe('GET /gdpr/export — GDPR data export', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeOrgAdminUser();
  });

  it('returns valid JSON with all required top-level keys', async () => {
    const userRow = {
      id: 10,
      displayName: 'Admin Alice',
      email: 'alice@test.example',
      avatarUrl: null,
      bio: null,
      platformRole: 'member',
      isActive: true,
      createdAt: new Date('2026-01-01'),
      lastLoginAt: null,
    };

    _selectQueue = [[userRow], [], []];

    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/export');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    const body = res.body as Record<string, unknown>;
    expect(body.exportedAt).toBeTruthy();
    expect(body.requestedBy).toBe(10);
    expect(body.dataSubject).toBeDefined();
    expect(Array.isArray(body.sessions)).toBe(true);
    expect(Array.isArray(body.apiKeys)).toBe(true);
    expect(Array.isArray(body.activityLogs)).toBe(true);
    expect(body.dataProcessingBasis).toBeDefined();
  });

  it('response includes a Content-Disposition attachment header', async () => {
    _selectQueue = [[{ id: 10, displayName: 'Alice', email: 'alice@test.example' }], [], []];

    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/export');

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/user-data-export/);
  });

  it('includes dataProcessingBasis with legalBasis field', async () => {
    _selectQueue = [[{ id: 10, displayName: 'Alice', email: 'alice@test.example' }], [], []];

    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/export');

    const basis = (res.body as { dataProcessingBasis: { legalBasis: string } }).dataProcessingBasis;
    expect(basis.legalBasis).toBeDefined();
    expect(typeof basis.legalBasis).toBe('string');
  });

  it('handles missing user gracefully and still returns export structure', async () => {
    _selectQueue = [[], [], []];

    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/export');

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.dataSubject).toBeNull();
    expect(body.dataProcessingBasis).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Support Settings
// ---------------------------------------------------------------------------

describe('GET /orgs/:orgSlug/support-settings — get support notification email', () => {
  beforeEach(() => {
    _currentUser = makeOrgAdminUser();
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
  });

  it('returns the stored notification email when set', async () => {
    _selectQueue = [
      [ORG],
      [ORG],
      [ADMIN_MEMBERSHIP],
      [{ value: 'helpdesk@acme.example' }],
    ];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/support-settings');

    expect(res.status).toBe(200);
    expect(res.body.notificationEmail).toBe('helpdesk@acme.example');
  });

  it('returns null when no setting is stored', async () => {
    _selectQueue = [
      [ORG],
      [ORG],
      [ADMIN_MEMBERSHIP],
      [],
    ];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/support-settings');

    expect(res.status).toBe(200);
    expect(res.body.notificationEmail).toBeNull();
  });

  it('returns 404 when org does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).get('/orgs/no-such-org/support-settings');

    expect(res.status).toBe(404);
  });

  it('returns 403 when caller is a regular member, not an admin', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [
      [ORG],
      [ORG],
      [MEMBER_MEMBERSHIP],
    ];

    const app = await getApp();
    const res = await request(app).get('/orgs/acme-corp/support-settings');

    expect(res.status).toBe(403);
  });
});

describe('PUT /orgs/:orgSlug/support-settings — update support notification email', () => {
  beforeEach(() => {
    _currentUser = makeOrgAdminUser();
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
  });

  it('inserts new setting when none exists and returns the email', async () => {
    _selectQueue = [
      [ORG],
      [ORG],
      [ADMIN_MEMBERSHIP],
      [],
    ];
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/support-settings')
      .send({ notificationEmail: 'helpdesk@acme.example' });

    expect(res.status).toBe(200);
    expect(res.body.notificationEmail).toBe('helpdesk@acme.example');
  });

  it('updates existing setting when one already exists', async () => {
    _selectQueue = [
      [ORG],
      [ORG],
      [ADMIN_MEMBERSHIP],
      [{ id: 99 }],
    ];

    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/support-settings')
      .send({ notificationEmail: 'newdesk@acme.example' });

    expect(res.status).toBe(200);
    expect(res.body.notificationEmail).toBe('newdesk@acme.example');
  });

  it('rejects an invalid email address with 400', async () => {
    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/support-settings')
      .send({ notificationEmail: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('returns 403 when caller is a regular member', async () => {
    _currentUser = makeMemberUser();
    _selectQueue = [
      [ORG],
      [ORG],
      [MEMBER_MEMBERSHIP],
    ];

    const app = await getApp();
    const res = await request(app)
      .put('/orgs/acme-corp/support-settings')
      .send({ notificationEmail: 'helpdesk@acme.example' });

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GDPR Erasure
// ---------------------------------------------------------------------------

describe('POST /gdpr/erasure — GDPR right-to-erasure (Article 17)', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _transactionCalled = false;
    _currentUser = makeOrgAdminUser();
  });

  it('returns 204 when the exact confirmation string is provided', async () => {
    const app = await getGdprApp();
    const res = await request(app)
      .post('/gdpr/erasure')
      .send({ confirmation: 'DELETE MY DATA' });

    expect(res.status).toBe(204);
  });

  it('issues a database transaction on successful erasure', async () => {
    const app = await getGdprApp();
    await request(app)
      .post('/gdpr/erasure')
      .send({ confirmation: 'DELETE MY DATA' });

    expect(_transactionCalled).toBe(true);
  });

  it('records a delete inside the transaction', async () => {
    const app = await getGdprApp();
    await request(app)
      .post('/gdpr/erasure')
      .send({ confirmation: 'DELETE MY DATA' });

    expect(_deleteReturns.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 400 when confirmation string is wrong', async () => {
    const app = await getGdprApp();
    const res = await request(app)
      .post('/gdpr/erasure')
      .send({ confirmation: 'delete my data' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when confirmation string is close but not exact', async () => {
    const app = await getGdprApp();
    const res = await request(app)
      .post('/gdpr/erasure')
      .send({ confirmation: 'DELETE MY DATA ' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when confirmation field is missing entirely', async () => {
    const app = await getGdprApp();
    const res = await request(app)
      .post('/gdpr/erasure')
      .send({ reason: 'no longer need account' });

    expect(res.status).toBe(400);
  });

  it('does not issue a transaction when confirmation is wrong', async () => {
    const app = await getGdprApp();
    await request(app)
      .post('/gdpr/erasure')
      .send({ confirmation: 'WRONG STRING' });

    expect(_transactionCalled).toBe(false);
  });

  it('accepts an optional reason field alongside the correct confirmation', async () => {
    const app = await getGdprApp();
    const res = await request(app)
      .post('/gdpr/erasure')
      .send({ confirmation: 'DELETE MY DATA', reason: 'Closing my account' });

    expect(res.status).toBe(204);
  });
});

// ---------------------------------------------------------------------------
// GDPR Data Processing Records
// ---------------------------------------------------------------------------

describe('GET /gdpr/data-processing-records — Article 30 processing register', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _transactionCalled = false;
    _currentUser = makeOrgAdminUser();
  });

  it('returns 200 with a JSON body', async () => {
    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/data-processing-records');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('response body contains a processingActivities array', async () => {
    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/data-processing-records');

    expect(Array.isArray(res.body.processingActivities)).toBe(true);
    expect(res.body.processingActivities.length).toBeGreaterThan(0);
  });

  it('each processing activity has a legalBasis string', async () => {
    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/data-processing-records');

    for (const activity of res.body.processingActivities as { legalBasis: unknown }[]) {
      expect(typeof activity.legalBasis).toBe('string');
      expect(activity.legalBasis).toBeTruthy();
    }
  });

  it('response includes controller, userRights, and supervisoryAuthority fields', async () => {
    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/data-processing-records');

    const body = res.body as Record<string, unknown>;
    expect(body.controller).toBeDefined();
    expect(Array.isArray(body.userRights)).toBe(true);
    expect(typeof body.supervisoryAuthority).toBe('string');
  });

  it('controller includes name and contact fields', async () => {
    const app = await getGdprApp();
    const res = await request(app).get('/gdpr/data-processing-records');

    const controller = res.body.controller as Record<string, unknown>;
    expect(typeof controller.name).toBe('string');
    expect(typeof controller.contact).toBe('string');
  });
});
