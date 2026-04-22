/**
 * Validation & Pagination Integration Tests
 *
 * Verifies two categories of API contract invariants:
 *
 *  (A) Validation — mutation routes reject missing/invalid required fields
 *      with HTTP 400 and an { error, code, requestId } error shape.
 *
 *  (B) Pagination — list endpoints return a paginated envelope:
 *      { data: [...], meta: { page, limit, offset } }
 *
 * Routes under test:
 *   POST /billing/checkout            (billingCheckoutSchema)
 *   POST /auth/login-password         (loginPasswordSchema)
 *   POST /admin/tenants               (tenantCreateSchema)
 *   GET  /notifications               (pagination metadata)
 *   GET  /billing/subscriptions       (pagination metadata)
 *   GET  /billing/invoices            (pagination metadata)
 *   GET  /auth/users                  (pagination metadata)
 *   GET  /admin/tenants               (list-shape contract)
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — declared before any dynamic imports (Vitest hoists these)
// ---------------------------------------------------------------------------

vi.mock('drizzle-orm', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createDrizzleOrmMock();
});

vi.mock('@szl-holdings/observability', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createObservabilityMock();
});

vi.mock('@szl-holdings/db', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createDbMock();
});

vi.mock('@szl-holdings/services', () => ({
  services: {
    stripe: {
      createCheckoutSession: vi.fn(async () => ({ url: 'https://checkout.stripe.com/test' })),
      getCustomerByEmail: vi.fn(async () => null),
      listProducts: vi.fn(async () => []),
      createBillingPortalSession: vi.fn(async () => ({ url: 'https://portal.stripe.com/test' })),
      createSubscription: vi.fn(async () => ({ id: 'sub_test' })),
    },
  },
}));

vi.mock('@szl-holdings/auth', () => ({
  createAuthService: () => ({
    verifyIdentity: vi.fn(async () => null),
  }),
}));

vi.mock('@szl-holdings/forge-runtime', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createForgeRuntimeMock();
});

vi.mock('@szl-holdings/config', () => ({
  config: {},
  getConfig: () => ({}),
}));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../lib/activity-logger.js', () => ({
  logActivity: vi.fn(async () => undefined),
}));

vi.mock('../lib/auth.js', () => ({
  getSessionToken: vi.fn(() => null),
  getSessionUser: vi.fn(async () => null),
}));

vi.mock('../lib/websocket.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createWebsocketMock();
});

vi.mock('../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn(() => false),
}));

vi.mock('../lib/platform-jobs.js', () => ({
  PLATFORM_JOB_TYPES: {
    NOTIFICATION_DISPATCH: 'notification.dispatch',
  },
}));

vi.mock('../lib/crypto.js', () => ({
  encryptSecret: vi.fn((v: string) => `enc:${v}`),
  decryptSecret: vi.fn((v: string) => v.replace('enc:', '')),
}));

// ---------------------------------------------------------------------------
// authMiddleware mock — injects a valid user so validation fires (not auth)
// ---------------------------------------------------------------------------

vi.mock('../middlewares/auth.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createAuthMiddlewareMock({
    id: 99,
    email: 'tester@example.com',
    roles: ['admin'],
    orgs: [{ orgId: 1, orgSlug: 'test-org', orgName: 'Test Org', role: 'admin' }],
  });
});

// ---------------------------------------------------------------------------
// Dynamic imports (after all mocks are registered)
// ---------------------------------------------------------------------------

const { default: billingRouter } = await import('../routes/billing.js');
const { default: authRouter } = await import('../routes/auth.js');
const { default: notificationsRouter } = await import('../routes/notifications.js');
const { register: registerTenantProvisioning } = await import(
  '../routes/tenant-provisioning/index.js'
);
const tenantProvisioningRouter = express.Router();
registerTenantProvisioning(tenantProvisioningRouter);

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

interface ErrorBody {
  error: string;
  code: string;
  requestId?: string;
}

interface PaginatedBody<T = unknown> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    offset: number;
  };
}

// ---------------------------------------------------------------------------
// Helper: build a minimal Express app (no global auth enforcer).
// authMiddleware is mocked to inject a user so routes proceed to validateBody.
// ---------------------------------------------------------------------------

function buildApp(router: ExpressRouter, mountPrefix = '') {
  const app = express();
  app.use(express.json());
  if (mountPrefix) {
    app.use(mountPrefix, router);
  } else {
    app.use(router);
  }
  return app;
}

// ===========================================================================
// POST /billing/checkout  — Validation (400)
// ===========================================================================

describe('POST /billing/checkout — validation', () => {
  const app = buildApp(billingRouter as unknown as ExpressRouter);

  it('returns 400 with { error, code, requestId } when priceId is missing', async () => {
    const res = await request(app).post('/billing/checkout').send({
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.error).toBeDefined();
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.requestId).toBeDefined();
  });

  it('returns 400 with issues detail when successUrl is not a valid URL', async () => {
    const res = await request(app).post('/billing/checkout').send({
      priceId: 'price_test123',
      successUrl: 'not-a-url',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody & { details?: { issues: unknown[] } };
    expect(body.code).toBe('BAD_REQUEST');
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });

  it('returns 400 when both successUrl and cancelUrl are missing', async () => {
    const res = await request(app).post('/billing/checkout').send({ priceId: 'price_test123' });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.error).toMatch(/Validation error/i);
  });

  it('returns 400 for a completely empty body', async () => {
    const res = await request(app).post('/billing/checkout').send({});

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe('BAD_REQUEST');
  });

  it('passes validation and returns a demo checkout response when live_stripe_billing_enabled flag is OFF', async () => {
    // In the test environment the live_stripe_billing_enabled flag defaults to OFF,
    // so the endpoint returns a demo-mode response instead of creating a real session.
    const res = await request(app).post('/billing/checkout').send({
      priceId: 'price_test123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(res.status).toBe(200);
    const body = res.body as { demo: boolean; sessionId: string; url: null; message: string };
    expect(body.demo).toBe(true);
    expect(typeof body.sessionId).toBe('string');
    expect(body.sessionId.startsWith('demo_session_')).toBe(true);
    expect(body.url).toBeNull();
    expect(typeof body.message).toBe('string');
  });
});

// ===========================================================================
// POST /auth/login-password  — Validation (400)
// ===========================================================================

describe('POST /auth/login-password — validation', () => {
  const app = buildApp(authRouter as unknown as ExpressRouter);

  it('returns 400 with { error, code, requestId } when email is missing', async () => {
    const res = await request(app).post('/auth/login-password').send({ password: 'secret123' });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.error).toBeDefined();
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.requestId).toBeDefined();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/auth/login-password').send({ email: 'user@example.com' });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.error).toMatch(/Validation error/i);
  });

  it('returns 400 when email is not a valid email address', async () => {
    const res = await request(app)
      .post('/auth/login-password')
      .send({ email: 'not-an-email', password: 'secret123' });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody & { details?: { issues: unknown[] } };
    expect(body.code).toBe('BAD_REQUEST');
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });

  it('returns 400 for an empty body', async () => {
    const res = await request(app).post('/auth/login-password').send({});

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe('BAD_REQUEST');
  });
});

// ===========================================================================
// POST /admin/tenants  — Validation (400)
// ===========================================================================

describe('POST /admin/tenants — validation', () => {
  const app = buildApp(tenantProvisioningRouter as unknown as ExpressRouter);

  it('returns 400 with { error, code, requestId } when azureTenantId is missing', async () => {
    const res = await request(app).post('/admin/tenants').send({ displayName: 'Acme Corp' });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.error).toBeDefined();
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.requestId).toBeDefined();
  });

  it('returns 400 when displayName is missing', async () => {
    const res = await request(app)
      .post('/admin/tenants')
      .send({ azureTenantId: '00000000-0000-0000-0000-000000000001' });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.error).toMatch(/Validation error/i);
  });

  it('returns 400 for an empty body', async () => {
    const res = await request(app).post('/admin/tenants').send({});

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 when azureTenantId exceeds max length', async () => {
    const res = await request(app)
      .post('/admin/tenants')
      .send({
        azureTenantId: 'x'.repeat(200),
        displayName: 'Acme Corp',
      });

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody & { details?: { issues: unknown[] } };
    expect(body.code).toBe('BAD_REQUEST');
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });
});

// ===========================================================================
// GET /notifications  — Pagination metadata shape
// ===========================================================================

describe('GET /notifications — pagination metadata', () => {
  const app = buildApp(notificationsRouter as unknown as ExpressRouter);

  it('returns { data, meta: { page, limit, offset } } with default pagination', async () => {
    const res = await request(app).get('/notifications');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.page).toBe('number');
    expect(typeof body.meta.limit).toBe('number');
    expect(typeof body.meta.offset).toBe('number');
  });

  it('reflects custom page and limit in meta', async () => {
    const res = await request(app).get('/notifications?page=2&limit=10');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(10);
    expect(body.meta.offset).toBe(10);
  });

  it('uses default limit of 50 when none is specified', async () => {
    const res = await request(app).get('/notifications');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.limit).toBe(50);
  });

  it('has offset = 0 on page 1', async () => {
    const res = await request(app).get('/notifications?page=1&limit=25');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(1);
    expect(body.meta.offset).toBe(0);
  });
});

// ===========================================================================
// GET /billing/subscriptions  — Pagination metadata shape
// ===========================================================================

describe('GET /billing/subscriptions — pagination metadata', () => {
  const app = buildApp(billingRouter as unknown as ExpressRouter);

  it('returns { data, meta: { page, limit, offset } } with default pagination', async () => {
    const res = await request(app).get('/billing/subscriptions');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.page).toBe('number');
    expect(typeof body.meta.limit).toBe('number');
    expect(typeof body.meta.offset).toBe('number');
  });

  it('reflects custom page and limit in meta', async () => {
    const res = await request(app).get('/billing/subscriptions?page=3&limit=20');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(3);
    expect(body.meta.limit).toBe(20);
    expect(body.meta.offset).toBe(40);
  });

  it('rejects an excessive limit with 400 (enforced by query validation)', async () => {
    const res = await request(app).get('/billing/subscriptions?limit=9999');

    expect(res.status).toBe(400);
    const body = res.body as { error: string; details: { issues: unknown[] } };
    expect(body.error).toBeTruthy();
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });
});

// ===========================================================================
// GET /billing/invoices  — Pagination metadata shape
// ===========================================================================

describe('GET /billing/invoices — pagination metadata', () => {
  const app = buildApp(billingRouter as unknown as ExpressRouter);

  it('returns { data, meta: { page, limit, offset } } with default pagination', async () => {
    const res = await request(app).get('/billing/invoices');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.page).toBe('number');
    expect(typeof body.meta.limit).toBe('number');
    expect(typeof body.meta.offset).toBe('number');
  });

  it('uses default page=1, limit=50, offset=0 when no query is provided', async () => {
    const res = await request(app).get('/billing/invoices');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(50);
    expect(body.meta.offset).toBe(0);
  });

  it('reflects custom page and limit in meta (offset = (page-1) * limit)', async () => {
    const res = await request(app).get('/billing/invoices?page=4&limit=15');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(4);
    expect(body.meta.limit).toBe(15);
    expect(body.meta.offset).toBe(45);
  });

  it('rejects an excessive limit with 400 (enforced by query validation)', async () => {
    const res = await request(app).get('/billing/invoices?limit=9999');

    expect(res.status).toBe(400);
    const body = res.body as { error: string; details: { issues: unknown[] } };
    expect(body.error).toBeTruthy();
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });
});

// ===========================================================================
// GET /auth/users  — Pagination metadata shape
// ===========================================================================

describe('GET /auth/users — pagination metadata', () => {
  const app = buildApp(authRouter as unknown as ExpressRouter);

  it('returns { data, meta: { page, limit, offset } } with default pagination', async () => {
    const res = await request(app).get('/auth/users');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.page).toBe('number');
    expect(typeof body.meta.limit).toBe('number');
    expect(typeof body.meta.offset).toBe('number');
  });

  it('uses default page=1, limit=50, offset=0 when no query is provided', async () => {
    const res = await request(app).get('/auth/users');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(50);
    expect(body.meta.offset).toBe(0);
  });

  it('reflects custom page and limit in meta (offset = (page-1) * limit)', async () => {
    const res = await request(app).get('/auth/users?page=5&limit=10');

    expect(res.status).toBe(200);
    const body = res.body as PaginatedBody;
    expect(body.meta.page).toBe(5);
    expect(body.meta.limit).toBe(10);
    expect(body.meta.offset).toBe(40);
  });

  it('rejects an excessive limit with 400 (enforced by query validation)', async () => {
    const res = await request(app).get('/auth/users?limit=9999');

    expect(res.status).toBe(400);
    const body = res.body as { error: string; details: { issues: unknown[] } };
    expect(body.error).toBeTruthy();
    expect(Array.isArray(body.details?.issues)).toBe(true);
  });
});

// ===========================================================================
// GET /admin/tenants  — List response shape contract
// ---------------------------------------------------------------------------
// NOTE: Unlike the other list endpoints in this file, /admin/tenants does not
// emit { data, meta: { page, limit, offset } }. It returns the legacy shape
// { count, tenants: [...] } that existing admin UIs (AzurePanel, tenant
// branding, SCIM, etc.) consume directly. Tests here lock in the actual
// contract so future refactors don't silently break those frontends.
// ===========================================================================

describe('GET /admin/tenants — list response contract', () => {
  const app = buildApp(tenantProvisioningRouter as unknown as ExpressRouter);

  it('returns 200 with a { count, tenants[] } envelope', async () => {
    const res = await request(app).get('/admin/tenants');

    expect(res.status).toBe(200);
    const body = res.body as { count: number; tenants: unknown[] };
    expect(typeof body.count).toBe('number');
    expect(Array.isArray(body.tenants)).toBe(true);
    expect(body.count).toBe(body.tenants.length);
  });

  it('ignores page/limit query params without erroring (endpoint is unpaginated)', async () => {
    const res = await request(app).get('/admin/tenants?page=2&limit=10');

    expect(res.status).toBe(200);
    const body = res.body as { count: number; tenants: unknown[] };
    expect(Array.isArray(body.tenants)).toBe(true);
    expect(typeof body.count).toBe('number');
  });
});
