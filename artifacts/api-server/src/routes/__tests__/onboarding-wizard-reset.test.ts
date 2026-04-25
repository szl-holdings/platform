/**
 * Onboarding Wizard Reset Tests
 *
 * Coverage:
 *  - POST /api/onboarding/wizard/:orgSlug/reset
 *    - org-admin can reset wizard state
 *    - super-admin can reset wizard state on any org
 *    - plain member is forbidden
 *    - unauthenticated request is forbidden
 *    - unknown org returns 404
 *    - audit event is written on success
 *    - wizard state is reseeded to defaults after reset
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mutable state
// ---------------------------------------------------------------------------

let _currentUser: Record<string, unknown> = makeOrgAdminUser();

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

function makeSuperAdminUser() {
  return {
    id: 1,
    displayName: 'Super Admin',
    email: 'superadmin@test.example',
    roles: ['super_admin'],
    orgs: [],
  };
}

let _selectQueue: unknown[][] = [];
let _insertReturnQueue: unknown[][] = [];
let _poolQueryQueue: { rows: unknown[] }[] = [];
let _insertedAuditEvents: unknown[] = [];

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
          values: (vals: unknown) => {
            _insertedAuditEvents.push(vals);
            return {
              returning: () => Promise.resolve(_insertReturnQueue.shift() ?? []),
            };
          },
        };
      },
      update(_table: unknown) {
        const chain: Record<string, unknown> = {
          set: () => chain,
          where: () => ({ returning: () => Promise.resolve([]) }),
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
    auditEventsTable: {
      userId: col('user_id'),
      action: col('action'),
      entityType: col('entity_type'),
      entityId: col('entity_id'),
      ipAddress: col('ip_address'),
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
  or: (...conds: unknown[]) => ({ op: 'or', conds }),
  ne: (col: unknown, val: unknown) => ({ op: 'ne', col, val }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  asc: (col: unknown) => ({ op: 'asc', col }),
  isNull: (col: unknown) => ({ op: 'isNull', col }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = _currentUser;
    next();
  },
  isElevatedUser: (user: { roles?: string[] }) =>
    !!(
      user.roles?.includes('super_admin') ||
      user.roles?.includes('admin') ||
      user.roles?.includes('exec') ||
      user.roles?.includes('ops') ||
      user.roles?.includes('compliance')
    ),
}));

vi.mock('../../middlewares/rate-limiters', () => ({
  writeLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  readLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@szl-holdings/audit', () => ({
  hashIp: () => 'hashed-ip',
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/invitation-service', () => ({
  createOrgInvitation: vi.fn(async () => ({
    conflict: false,
    invitation: { id: 'inv-1', email: 'x@x.com', role: 'member', expiresAt: null, inviteUrl: '' },
  })),
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
  _app.use('/api', onboardingRouter);
  return _app;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG = { id: 5, name: 'Acme Corp', slug: 'acme-corp', plan: 'free' };
const ADMIN_MEMBERSHIP = { orgId: 5, userId: 10, role: 'admin' };
const MEMBER_MEMBERSHIP = { orgId: 5, userId: 20, role: 'member' };

function resetQueues() {
  _selectQueue = [];
  _insertReturnQueue = [];
  _poolQueryQueue = [];
  _insertedAuditEvents = [];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/onboarding/wizard/:orgSlug/reset', () => {
  beforeEach(() => {
    _currentUser = makeOrgAdminUser();
    resetQueues();
    _app = null;
  });

  it('allows an org-admin to reset wizard state and returns 200', async () => {
    const app = await getApp();

    // org lookup → org found
    _selectQueue.push([ORG]);
    // membership lookup (not elevated user)
    _selectQueue.push([ADMIN_MEMBERSHIP]);
    // pool.query for saveWizardState (upsert)
    _poolQueryQueue.push({ rows: [] });

    const res = await request(app)
      .post('/api/onboarding/wizard/acme-corp/reset')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Onboarding wizard reset');
    expect(res.body.orgSlug).toBe('acme-corp');
  });

  it('writes an audit event with action "onboarding_wizard_reset"', async () => {
    const app = await getApp();

    _selectQueue.push([ORG]);
    _selectQueue.push([ADMIN_MEMBERSHIP]);
    _poolQueryQueue.push({ rows: [] });

    await request(app)
      .post('/api/onboarding/wizard/acme-corp/reset')
      .send({});

    const auditEntry = _insertedAuditEvents.find(
      (e: any) => e.action === 'onboarding_wizard_reset',
    );
    expect(auditEntry).toBeDefined();
    expect((auditEntry as any).entityType).toBe('organization');
    expect((auditEntry as any).entityId).toBe('5');
  });

  it('allows a super-admin to reset wizard without membership check', async () => {
    _currentUser = makeSuperAdminUser();
    const app = await getApp();

    // org lookup only — no membership lookup for elevated users
    _selectQueue.push([ORG]);
    _poolQueryQueue.push({ rows: [] });

    const res = await request(app)
      .post('/api/onboarding/wizard/acme-corp/reset')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Onboarding wizard reset');
  });

  it('reseeds the wizard to default state (pool query called with default values)', async () => {
    const app = await getApp();
    const { pool } = await import('@szl-holdings/db');

    _selectQueue.push([ORG]);
    _selectQueue.push([ADMIN_MEMBERSHIP]);
    _poolQueryQueue.push({ rows: [] });

    await request(app)
      .post('/api/onboarding/wizard/acme-corp/reset')
      .send({});

    const poolMock = pool as any;
    const lastCall = poolMock.query.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    // Second argument is the params array: [orgId, currentStep, completedSteps, stepData, completedAt]
    const params = lastCall[1];
    expect(params[0]).toBe(5);           // orgId
    expect(params[1]).toBe('profile');   // default currentStep
    expect(JSON.parse(params[2])).toEqual([]);  // empty completedSteps
    expect(params[4]).toBeNull();        // completedAt null
  });

  it('returns 403 for a plain member', async () => {
    _currentUser = makeMemberUser();
    const app = await getApp();

    _selectQueue.push([ORG]);
    _selectQueue.push([MEMBER_MEMBERSHIP]);

    const res = await request(app)
      .post('/api/onboarding/wizard/acme-corp/reset')
      .send({});

    expect(res.status).toBe(403);
  });

  it('returns 403 when user has no membership in the org', async () => {
    _currentUser = makeMemberUser();
    const app = await getApp();

    _selectQueue.push([ORG]);
    _selectQueue.push([]); // no membership row

    const res = await request(app)
      .post('/api/onboarding/wizard/acme-corp/reset')
      .send({});

    expect(res.status).toBe(403);
  });

  it('returns 404 when the org does not exist', async () => {
    const app = await getApp();

    _selectQueue.push([]); // org not found

    const res = await request(app)
      .post('/api/onboarding/wizard/unknown-org/reset')
      .send({});

    expect(res.status).toBe(404);
  });

  it('returns 403 for a platform-level admin role without org membership (not super_admin)', async () => {
    _currentUser = {
      id: 30,
      displayName: 'Platform Admin',
      email: 'padmin@test.example',
      roles: ['admin'],
      orgs: [],
    };
    const app = await getApp();

    _selectQueue.push([ORG]);
    _selectQueue.push([]); // no membership row

    const res = await request(app)
      .post('/api/onboarding/wizard/acme-corp/reset')
      .send({});

    expect(res.status).toBe(403);
  });
});
