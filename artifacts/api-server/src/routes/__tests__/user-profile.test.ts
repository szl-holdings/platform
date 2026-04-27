/**
 * User Profile & Account Management Integration Tests
 *
 * Coverage:
 *  - GET    /user/profile                         — returns profile for authenticated user
 *  - PUT    /user/profile                         — full and partial field updates
 *  - POST   /user/deactivate                      — deactivates account and clears session
 *  - POST   /user/password-reset                  — initiates token flow (email-safe response)
 *  - POST   /user/password-reset/confirm          — validates token, sets new password
 *  - GET    /user/notification-preferences        — returns stored or default prefs
 *  - PUT    /user/notification-preferences        — upsert (update existing / insert new)
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mutable state
// ---------------------------------------------------------------------------

let _currentUser = makeAuthUser();

function makeAuthUser() {
  return {
    id: 10,
    displayName: 'Alice Smith',
    email: 'alice@test.example',
    roles: ['member'],
    orgs: [],
  };
}

let _selectQueue: unknown[][] = [];
let _insertReturnQueue: unknown[][] = [];
let _updateReturnQueue: unknown[][] = [];
let _deleteReturns: unknown[] = [];
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
    },
    pool: poolMock,
    organizationsTable: {
      id: col('id'),
      name: col('name'),
      slug: col('slug'),
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

async function getApp(): Promise<express.Application> {
  if (_app) return _app;
  const { default: orgSettingsRouter } = await import('../org-settings.js');
  _app = express();
  _app.use(express.json());
  _app.use(orgSettingsRouter);
  return _app;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_PROFILE = {
  id: 10,
  displayName: 'Alice Smith',
  email: 'alice@test.example',
  avatarUrl: null,
  bio: 'Hello world',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date('2026-01-01'),
};

const USER_PREFS = {
  id: 1,
  userId: 10,
  emailEnabled: true,
  smsEnabled: false,
  slackEnabled: false,
  inAppEnabled: true,
  updatedAt: new Date('2026-04-01'),
};

// ---------------------------------------------------------------------------
// GET /user/profile
// ---------------------------------------------------------------------------

describe('GET /user/profile — get current user profile', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeAuthUser();
  });

  it('returns the profile for the authenticated user', async () => {
    _selectQueue = [[USER_PROFILE]];

    const app = await getApp();
    const res = await request(app).get('/user/profile');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(10);
    expect(res.body.email).toBe('alice@test.example');
    expect(res.body.displayName).toBe('Alice Smith');
    expect(res.body.bio).toBe('Hello world');
  });

  it('returns 404 when the user record does not exist', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).get('/user/profile');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user/i);
  });
});

// ---------------------------------------------------------------------------
// PUT /user/profile
// ---------------------------------------------------------------------------

describe('PUT /user/profile — update current user profile', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeAuthUser();
  });

  it('updates displayName and returns the updated record', async () => {
    const updatedUser = { ...USER_PROFILE, displayName: 'Alice Updated' };
    _updateReturnQueue = [[updatedUser]];

    const app = await getApp();
    const res = await request(app).put('/user/profile').send({ displayName: 'Alice Updated' });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Alice Updated');
  });

  it('updates bio only (partial update)', async () => {
    const updatedUser = { ...USER_PROFILE, bio: 'New bio text' };
    _updateReturnQueue = [[updatedUser]];

    const app = await getApp();
    const res = await request(app).put('/user/profile').send({ bio: 'New bio text' });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe('New bio text');
  });

  it('updates avatarUrl to a valid URL', async () => {
    const updatedUser = { ...USER_PROFILE, avatarUrl: 'https://cdn.example.com/avatar.png' };
    _updateReturnQueue = [[updatedUser]];

    const app = await getApp();
    const res = await request(app)
      .put('/user/profile')
      .send({ avatarUrl: 'https://cdn.example.com/avatar.png' });

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe('https://cdn.example.com/avatar.png');
  });

  it('updates all fields in a single request', async () => {
    const updatedUser = {
      id: 10,
      displayName: 'Alice New Name',
      email: 'alice@test.example',
      avatarUrl: 'https://cdn.example.com/new.png',
      bio: 'Updated bio',
    };
    _updateReturnQueue = [[updatedUser]];

    const app = await getApp();
    const res = await request(app).put('/user/profile').send({
      displayName: 'Alice New Name',
      bio: 'Updated bio',
      avatarUrl: 'https://cdn.example.com/new.png',
    });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Alice New Name');
    expect(res.body.bio).toBe('Updated bio');
    expect(res.body.avatarUrl).toBe('https://cdn.example.com/new.png');
  });

  it('returns 400 when avatarUrl is not a valid URL', async () => {
    const app = await getApp();
    const res = await request(app).put('/user/profile').send({ avatarUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /user/deactivate
// ---------------------------------------------------------------------------

describe('POST /user/deactivate — deactivate user account', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeAuthUser();
  });

  it('returns 200, deactivates account, and clears session cookies', async () => {
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app).post('/user/deactivate').send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('accepts an optional reason field', async () => {
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .post('/user/deactivate')
      .send({ reason: 'No longer needed' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it('records a delete for the session table (clears sessions)', async () => {
    _insertReturnQueue = [[]];

    const app = await getApp();
    await request(app).post('/user/deactivate').send({});

    expect(_deleteReturns.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// POST /user/password-reset
// ---------------------------------------------------------------------------

describe('POST /user/password-reset — initiate password reset token flow', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeAuthUser();
  });

  it('returns 200 with a generic message whether or not the email exists', async () => {
    _selectQueue = [
      [{ id: 10, email: 'alice@test.example' }],
      [{ displayName: 'Alice Smith' }],
    ];
    _poolQueryQueue = [{ rows: [] }];
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .post('/user/password-reset')
      .send({ email: 'alice@test.example' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
  });

  it('returns 200 with the same generic message even when no matching account is found', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app)
      .post('/user/password-reset')
      .send({ email: 'ghost@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account/i);
  });

  it('returns 400 when email field is missing', async () => {
    const app = await getApp();
    const res = await request(app).post('/user/password-reset').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email is required/i);
  });

  it('returns 400 when email is not a string', async () => {
    const app = await getApp();
    const res = await request(app).post('/user/password-reset').send({ email: 42 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email is required/i);
  });
});

// ---------------------------------------------------------------------------
// POST /user/password-reset/confirm
// ---------------------------------------------------------------------------

describe('POST /user/password-reset/confirm — confirm token and set new password', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeAuthUser();
  });

  it('resets the password and returns 200 when token is valid', async () => {
    _poolQueryQueue = [
      { rows: [{ id: 10, email: 'alice@test.example' }] },
      { rows: [] },
      { rows: [] },
    ];
    _insertReturnQueue = [[]];

    const app = await getApp();
    const res = await request(app).post('/user/password-reset/confirm').send({
      token: 'valid-reset-token-abc123',
      newPassword: 'NewSecurePass1',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successfully/i);
  });

  it('returns 400 when token is invalid or expired', async () => {
    _poolQueryQueue = [{ rows: [] }];

    const app = await getApp();
    const res = await request(app).post('/user/password-reset/confirm').send({
      token: 'expired-or-bad-token',
      newPassword: 'NewSecurePass1',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 400 when token field is missing', async () => {
    const app = await getApp();
    const res = await request(app)
      .post('/user/password-reset/confirm')
      .send({ newPassword: 'NewSecurePass1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/token is required/i);
  });

  it('returns 400 when newPassword is too short (less than 8 characters)', async () => {
    const app = await getApp();
    const res = await request(app).post('/user/password-reset/confirm').send({
      token: 'some-token',
      newPassword: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/i);
  });

  it('returns 400 when newPassword is missing', async () => {
    const app = await getApp();
    const res = await request(app)
      .post('/user/password-reset/confirm')
      .send({ token: 'some-token' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/i);
  });

  it('invalidates all sessions after a successful password reset', async () => {
    _poolQueryQueue = [
      { rows: [{ id: 10, email: 'alice@test.example' }] },
      { rows: [] },
      { rows: [] },
    ];
    _insertReturnQueue = [[]];

    const querySpy = (await import('@szl-holdings/db')).pool.query as ReturnType<typeof vi.fn>;
    querySpy.mockClear();

    const app = await getApp();
    await request(app).post('/user/password-reset/confirm').send({
      token: 'valid-token',
      newPassword: 'SecurePass99',
    });

    const calls = querySpy.mock.calls.map((c) => String(c[0]));
    const deletedSessions = calls.some((sql) => /DELETE FROM sessions/i.test(sql));
    expect(deletedSessions).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GET /user/notification-preferences
// ---------------------------------------------------------------------------

describe('GET /user/notification-preferences — get personal notification prefs', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeAuthUser();
  });

  it('returns stored preferences when a record exists', async () => {
    _selectQueue = [[USER_PREFS]];

    const app = await getApp();
    const res = await request(app).get('/user/notification-preferences');

    expect(res.status).toBe(200);
    expect(res.body.emailEnabled).toBe(true);
    expect(res.body.smsEnabled).toBe(false);
    expect(res.body.slackEnabled).toBe(false);
    expect(res.body.inAppEnabled).toBe(true);
  });

  it('returns defaults when no preference record exists', async () => {
    _selectQueue = [[]];

    const app = await getApp();
    const res = await request(app).get('/user/notification-preferences');

    expect(res.status).toBe(200);
    expect(res.body.emailEnabled).toBe(true);
    expect(res.body.smsEnabled).toBe(false);
    expect(res.body.slackEnabled).toBe(false);
    expect(res.body.inAppEnabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PUT /user/notification-preferences
// ---------------------------------------------------------------------------

describe('PUT /user/notification-preferences — upsert personal notification prefs', () => {
  beforeEach(() => {
    _selectQueue = [];
    _insertReturnQueue = [];
    _updateReturnQueue = [];
    _deleteReturns = [];
    _poolQueryQueue = [];
    _currentUser = makeAuthUser();
  });

  it('updates existing preferences and returns the updated record', async () => {
    const updatedPrefs = { ...USER_PREFS, smsEnabled: true };
    _selectQueue = [[USER_PREFS]];
    _updateReturnQueue = [[updatedPrefs]];

    const app = await getApp();
    const res = await request(app)
      .put('/user/notification-preferences')
      .send({ smsEnabled: true });

    expect(res.status).toBe(200);
    expect(res.body.smsEnabled).toBe(true);
  });

  it('inserts new preferences when no record exists and returns the created record', async () => {
    const newPrefs = {
      id: 2,
      userId: 10,
      emailEnabled: true,
      smsEnabled: false,
      slackEnabled: true,
      inAppEnabled: true,
      updatedAt: new Date(),
    };
    _selectQueue = [[]];
    _insertReturnQueue = [[newPrefs]];

    const app = await getApp();
    const res = await request(app)
      .put('/user/notification-preferences')
      .send({ slackEnabled: true });

    expect(res.status).toBe(200);
    expect(res.body.slackEnabled).toBe(true);
  });

  it('updates all preference fields at once', async () => {
    const updatedPrefs = {
      ...USER_PREFS,
      emailEnabled: false,
      smsEnabled: true,
      slackEnabled: true,
      inAppEnabled: false,
    };
    _selectQueue = [[USER_PREFS]];
    _updateReturnQueue = [[updatedPrefs]];

    const app = await getApp();
    const res = await request(app).put('/user/notification-preferences').send({
      emailEnabled: false,
      smsEnabled: true,
      slackEnabled: true,
      inAppEnabled: false,
    });

    expect(res.status).toBe(200);
    expect(res.body.emailEnabled).toBe(false);
    expect(res.body.smsEnabled).toBe(true);
    expect(res.body.slackEnabled).toBe(true);
    expect(res.body.inAppEnabled).toBe(false);
  });

  it('returns 400 when a field is not a boolean', async () => {
    const app = await getApp();
    const res = await request(app)
      .put('/user/notification-preferences')
      .send({ emailEnabled: 'yes' });

    expect(res.status).toBe(400);
  });
});
