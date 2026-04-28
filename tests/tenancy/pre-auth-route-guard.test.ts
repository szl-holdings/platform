/**
 * Pre-Auth Route Guard Integration Tests
 *
 * Verifies that routes behind tenantScope({ required: false }) — /orgs, /user,
 * /onboarding — cannot leak data to unauthenticated callers.
 *
 * Background: platform.ts uses tenantScope({ required: false }) for these three
 * prefixes so that pre-membership flows (invitation acceptance, password reset,
 * onboarding wizard) can reach the server before an org context exists. The
 * tenantScope middleware intentionally passes unauthenticated requests through;
 * each mounted router is expected to apply its own authMiddleware() guards at
 * the handler level.
 *
 * These tests mount the REAL route handlers (org-settings, invitations,
 * onboarding) behind the real tenantScope({ required: false }) middleware, send
 * requests without any session cookie or Authorization header, and confirm that
 * every authenticated endpoint returns 401 — not 200 with user data.
 *
 * For the intentionally public endpoints (password-reset, accept-invite GET),
 * the tests verify that the response is safe (generic message / validation
 * error) and does not expose user records.
 *
 * Related:
 *  - artifacts/api-server/src/routes/groups/platform.ts (wiring under test)
 *  - tests/tenancy/api-tenant-scope.test.ts (tenantScope middleware-only tests)
 */

import express from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ── Mocks — hoisted before any module imports ─────────────────────────────────
// These stubs allow the real route handler modules to *load* without a live
// database, email transport, or telemetry backend. For unauthenticated requests
// the actual DB/email code paths are never reached — authMiddleware returns 401
// before any handler executes.


vi.mock('@szl-holdings/db', () => {
  const table = (n: string) => new Proxy({}, { get: (_t, prop) => `${n}.${String(prop)}` });
  return {
    db: {
      select: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.from = () => chain;
        chain.where = () => chain;
        chain.innerJoin = () => chain;
        chain.leftJoin = () => chain;
        chain.limit = () => Promise.resolve([]);
        chain.orderBy = () => chain;
        chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve([]).then(resolve);
        return chain;
      }),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([])), then: (r: (v: unknown) => unknown) => Promise.resolve([]).then(r) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([])) })) })) })),
      delete: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
    },
    pool: { query: vi.fn(async () => ({ rows: [] })) },
    usersTable: table('users'),
    sessionsTable: table('sessions'),
    organizationsTable: table('organizations'),
    orgMembersTable: table('org_members'),
    orgInvitationsTable: table('org_invitations'),
    auditEventsTable: table('audit_events'),
    notificationsTable: table('notifications'),
    notificationPreferencesTable: table('notification_preferences'),
    tenantSettingsTable: table('tenant_settings'),
    rolesTable: table('roles'),
    userRolesTable: table('user_roles'),
    apiKeysTable: table('api_keys'),
    oauthClientsTable: table('oauth_clients'),
    azureTenantsTable: table('azure_tenants'),
    platformFlagsTable: table('platform_flags'),
    ROLE_HIERARCHY: {} as Record<string, string[]>,
    isReadOnlyRole: () => false,
    toCanonicalRole: () => null,
  };
});

vi.mock('@szl-holdings/audit', () => ({ hashIp: vi.fn(() => 'hashed-ip') }));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordTenantIsolationViolation: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
  },
}));

vi.mock('@szl-holdings/auth-shared', () => ({}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => ({ op: 'eq' })),
  and: vi.fn((..._conds: unknown[]) => ({ op: 'and' })),
  gt: vi.fn((_col: unknown, _val: unknown) => ({ op: 'gt' })),
  isNull: vi.fn((_col: unknown) => ({ op: 'isNull' })),
  sql: vi.fn(),
  inArray: vi.fn((_col: unknown, _vals: unknown) => ({ op: 'inArray' })),
}));

vi.mock('openid-client', () => ({
  discovery: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: vi.fn() })) },
  createTransport: vi.fn(() => ({ sendMail: vi.fn() })),
}));

vi.mock('../../artifacts/api-server/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    })),
  },
}));

vi.mock('../../artifacts/api-server/src/lib/email', () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
  buildPasswordResetEmail: vi.fn(() => '<html>reset</html>'),
  buildOrgInviteEmail: vi.fn(() => '<html>invite</html>'),
}));

vi.mock('../../artifacts/api-server/src/lib/invitation-service', () => ({
  createOrgInvitation: vi.fn(async () => ({
    conflict: false,
    invitation: { id: 1, email: 'test@test.com', role: 'member', expiresAt: new Date(), inviteUrl: '/invite' },
  })),
}));

vi.mock('../../artifacts/api-server/src/lib/platform-flags', () => ({
  isFlagEnabled: vi.fn(() => false),
  isFlagEnabledForOrg: vi.fn(() => false),
  getFlag: vi.fn(() => null),
}));

vi.mock('../../artifacts/api-server/src/middlewares/global-auth-enforcer', () => ({
  isAllowlistedPublicPath: () => false,
  fullApiPath: (req: express.Request) => req.originalUrl ?? req.path,
}));

vi.mock('../../artifacts/api-server/src/middlewares/rate-limiters', () => {
  const pt = (_req: unknown, _res: unknown, next: () => void) => next();
  return { readLimiter: pt, writeLimiter: pt };
});

vi.mock('../../artifacts/api-server/src/middlewares/sliding-window-limiter', () => {
  const pt = (_req: unknown, _res: unknown, next: () => void) => next();
  return {
    createSlidingWindowLimiter: () => pt,
    perUserApiSlidingLimiter: pt,
    perUserWriteSlidingLimiter: pt,
  };
});

vi.mock('../../artifacts/api-server/src/middlewares/session-policy', () => ({
  getSessionMinCreatedAt: vi.fn(() => null),
  revokeUserSessionsOnRoleChange: vi.fn(async () => {}),
}));

// ── Real imports — loaded after all vi.mock() calls ───────────────────────────

import orgSettingsRouter from '../../artifacts/api-server/src/routes/org-settings.js';
import onboardingRouter from '../../artifacts/api-server/src/routes/onboarding.js';
import invitationsRouter from '../../artifacts/api-server/src/routes/invitations.js';
import { tenantScope } from '../../artifacts/api-server/src/middlewares/tenant-scope.js';

// ── App factory ───────────────────────────────────────────────────────────────

function buildPreAuthApp(): express.Express {
  const app = express();
  app.use(express.json());

  app.use('/orgs', tenantScope({ required: false }) as express.RequestHandler);
  app.use('/user', tenantScope({ required: false }) as express.RequestHandler);
  app.use('/onboarding', tenantScope({ required: false }) as express.RequestHandler);

  app.use(orgSettingsRouter as express.RequestHandler);
  app.use(invitationsRouter as express.RequestHandler);
  app.use(onboardingRouter as express.RequestHandler);

  return app;
}

let app: express.Express;

beforeAll(() => {
  app = buildPreAuthApp();
});

// ── /orgs — org-settings routes ───────────────────────────────────────────────

describe('pre-auth guard — /orgs (org-settings)', () => {
  it('GET /orgs/:orgSlug/profile without session → 401', async () => {
    const res = await request(app).get('/orgs/test-org/profile');
    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('data');
  });

  it('PUT /orgs/:orgSlug/profile without session → 401', async () => {
    const res = await request(app)
      .put('/orgs/test-org/profile')
      .send({ name: 'Hacked Org' });
    expect(res.status).toBe(401);
  });

  it('PATCH /orgs/:orgSlug/mfa-required without session → 401', async () => {
    const res = await request(app)
      .patch('/orgs/test-org/mfa-required')
      .send({ mfaRequired: true });
    expect(res.status).toBe(401);
  });

  it('PATCH /orgs/:orgSlug without session → 401', async () => {
    const res = await request(app)
      .patch('/orgs/test-org')
      .send({ mfaRequired: false });
    expect(res.status).toBe(401);
  });

  it('GET /orgs/:orgSlug/members without session → 401', async () => {
    const res = await request(app).get('/orgs/test-org/members');
    expect(res.status).toBe(401);
  });

  it('DELETE /orgs/:orgSlug/members/:userId without session → 401', async () => {
    const res = await request(app)
      .delete('/orgs/test-org/members/42')
      .send({});
    expect(res.status).toBe(401);
  });

  it('PUT /orgs/:orgSlug/members/:userId/role without session → 401', async () => {
    const res = await request(app)
      .put('/orgs/test-org/members/42/role')
      .send({ role: 'admin' });
    expect(res.status).toBe(401);
  });

  it('GET /orgs/:orgSlug/notification-prefs without session → 401', async () => {
    const res = await request(app).get('/orgs/test-org/notification-prefs');
    expect(res.status).toBe(401);
  });

  it('PUT /orgs/:orgSlug/notification-prefs without session → 401', async () => {
    const res = await request(app)
      .put('/orgs/test-org/notification-prefs')
      .send({ emailEnabled: true });
    expect(res.status).toBe(401);
  });

  it('GET /orgs/:orgSlug/support-settings without session → 401', async () => {
    const res = await request(app).get('/orgs/test-org/support-settings');
    expect(res.status).toBe(401);
  });

  it('PUT /orgs/:orgSlug/support-settings without session → 401', async () => {
    const res = await request(app)
      .put('/orgs/test-org/support-settings')
      .send({ notificationEmail: 'attacker@evil.com' });
    expect(res.status).toBe(401);
  });
});

// ── /orgs — invitation routes ─────────────────────────────────────────────────

describe('pre-auth guard — /orgs (invitations)', () => {
  it('POST /orgs/:orgSlug/invite without session → 401', async () => {
    const res = await request(app)
      .post('/orgs/test-org/invite')
      .send({ email: 'attacker@evil.com', role: 'admin' });
    expect(res.status).toBe(401);
  });

  it('POST /orgs/accept-invite without session → 401', async () => {
    const res = await request(app)
      .post('/orgs/accept-invite')
      .send({ token: 'stolen-token' });
    expect(res.status).toBe(401);
  });

  it('DELETE /orgs/:orgSlug/invitations/:id without session → 401', async () => {
    const res = await request(app)
      .delete('/orgs/test-org/invitations/1')
      .send({});
    expect(res.status).toBe(401);
  });

  it('GET /orgs/:orgSlug/invitations without session → 401', async () => {
    const res = await request(app).get('/orgs/test-org/invitations');
    expect(res.status).toBe(401);
  });
});

// ── /user — user routes ───────────────────────────────────────────────────────

describe('pre-auth guard — /user', () => {
  it('GET /user/profile without session → 401', async () => {
    const res = await request(app).get('/user/profile');
    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('displayName');
  });

  it('PUT /user/profile without session → 401', async () => {
    const res = await request(app)
      .put('/user/profile')
      .send({ displayName: 'Hacker' });
    expect(res.status).toBe(401);
  });

  it('POST /user/deactivate without session → 401', async () => {
    const res = await request(app)
      .post('/user/deactivate')
      .send({});
    expect(res.status).toBe(401);
  });

  it('GET /user/notification-preferences without session → 401', async () => {
    const res = await request(app).get('/user/notification-preferences');
    expect(res.status).toBe(401);
  });

  it('PUT /user/notification-preferences without session → 401', async () => {
    const res = await request(app)
      .put('/user/notification-preferences')
      .send({ emailEnabled: false });
    expect(res.status).toBe(401);
  });
});

// ── /onboarding ───────────────────────────────────────────────────────────────

describe('pre-auth guard — /onboarding', () => {
  it('POST /onboarding/org without session → 401', async () => {
    const res = await request(app)
      .post('/onboarding/org')
      .send({ name: 'Evil Corp', slug: 'evil-corp' });
    expect(res.status).toBe(401);
  });

  it('GET /onboarding/wizard/:orgSlug without session → 401', async () => {
    const res = await request(app).get('/onboarding/wizard/test-org');
    expect(res.status).toBe(401);
  });

  it('PUT /onboarding/wizard/:orgSlug without session → 401', async () => {
    const res = await request(app)
      .put('/onboarding/wizard/test-org')
      .send({ step: 'profile', data: {} });
    expect(res.status).toBe(401);
  });

  it('POST /onboarding/wizard/:orgSlug/complete without session → 401', async () => {
    const res = await request(app)
      .post('/onboarding/wizard/test-org/complete')
      .send({});
    expect(res.status).toBe(401);
  });

  it('POST /onboarding/wizard/:orgSlug/reset without session → 401', async () => {
    const res = await request(app)
      .post('/onboarding/wizard/test-org/reset')
      .send({});
    expect(res.status).toBe(401);
  });

  it('POST /onboarding/resend-invite/:orgSlug without session → 401', async () => {
    const res = await request(app)
      .post('/onboarding/resend-invite/test-org')
      .send({ email: 'attacker@evil.com', role: 'admin' });
    expect(res.status).toBe(401);
  });
});

// ── Intentionally public routes — verify no data leak ─────────────────────────
// These routes are deliberately reachable without a session (password-reset and
// invitation token validation). The tests confirm they don't expose user
// records even when the tenantScope gate is open.

describe('pre-auth public routes — no data leak', () => {
  it('POST /user/password-reset returns generic message, not user data', async () => {
    const res = await request(app)
      .post('/user/password-reset')
      .send({ email: 'victim@example.com' });
    expect([200, 400]).toContain(res.status);
    expect(res.body).not.toHaveProperty('id');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('roles');
    if (res.status === 200) {
      expect(JSON.stringify(res.body)).toContain('reset link');
    }
  });

  it('POST /user/password-reset/confirm with no token returns validation error, not user data', async () => {
    const res = await request(app)
      .post('/user/password-reset/confirm')
      .send({ token: '', newPassword: '' });
    expect([400, 401]).toContain(res.status);
    expect(res.body).not.toHaveProperty('id');
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /orgs/accept-invite without token query returns 400, not user data', async () => {
    const res = await request(app).get('/orgs/accept-invite');
    expect([400, 404]).toContain(res.status);
    expect(res.body).not.toHaveProperty('members');
    expect(res.body).not.toHaveProperty('userId');
  });

  it('GET /orgs/accept-invite with invalid token returns 404, not user data', async () => {
    const res = await request(app).get('/orgs/accept-invite?token=invalid-token-12345');
    expect([400, 404]).toContain(res.status);
    expect(res.body).not.toHaveProperty('members');
    expect(res.body).not.toHaveProperty('userId');
  });
});

// ── Cross-check: tenantScope alone does not protect these routes ───────────────
// This section demonstrates that tenantScope({ required: false }) is NOT
// sufficient to block unauthenticated access — it's the handler-level
// authMiddleware that provides the 401. This confirms the documented contract
// in platform.ts.

describe('tenantScope({ required: false }) alone is not a gate', () => {
  it('tenantScope passes unauthenticated request through (required: false)', async () => {
    const probeApp = express();
    probeApp.use(express.json());
    probeApp.use(
      '/orgs',
      tenantScope({ required: false }) as express.RequestHandler,
    );
    probeApp.use('/orgs', ((_req, res) => {
      res.status(200).json({ leaked: true });
    }) as express.RequestHandler);

    const res = await request(probeApp).get('/orgs/anything');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ leaked: true });
  });

  it('tenantScope blocks unauthenticated request when required: true', async () => {
    const probeApp = express();
    probeApp.use(express.json());
    probeApp.use(
      '/orgs',
      tenantScope({ required: true }) as express.RequestHandler,
    );
    probeApp.use('/orgs', ((_req, res) => {
      res.status(200).json({ leaked: true });
    }) as express.RequestHandler);

    const res = await request(probeApp).get('/orgs/anything');
    expect(res.status).toBe(401);
  });
});
