/**
 * Stripe Live-Mode Gate — Contract Tests
 *
 * Verifies that every Stripe-mutating route uniformly enforces the
 * live_stripe_billing_enabled flag + sk_live_* key contract via the
 * requireStripeLive middleware:
 *
 *  Scenario A — flag OFF → 200 demo response  { demo: true, url: null }
 *  Scenario B — flag ON, key missing → 503 STRIPE_KEY_MISSING
 *  Scenario C — flag ON, test key   → 503 STRIPE_KEY_NOT_LIVE
 *  Scenario D — unauthenticated     → 401 on all auth-required routes (flag OFF or ON)
 *
 * Routes under test (representative sample covering all billing files):
 *   POST /billing/checkout
 *   POST /stripe/checkout
 *   POST /billing/command/subscribe
 *   POST /billing/terra/subscribe
 *   POST /billing/cancel-subscription
 *   POST /billing/update-subscription
 *   POST /lyte/billing/pilot-checkout
 *   POST /lyte/billing/create-invoice
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist mocks — must be declared before any dynamic imports
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
      createCheckoutSession: vi.fn(async () => ({
        id: 'cs_live_test',
        url: 'https://checkout.stripe.com/live_test',
      })),
      createCustomer: vi.fn(async () => ({ id: 'cus_test', email: 'test@example.com' })),
      createCustomerPortalSession: vi.fn(async () => ({
        url: 'https://billing.stripe.com/portal/test',
      })),
      getCustomerByEmail: vi.fn(async () => null),
      createInvoice: vi.fn(async () => ({
        id: 'in_test',
        status: 'open',
        hostedInvoiceUrl: 'https://invoice.stripe.com/test',
        invoicePdf: null,
      })),
      cancelSubscription: vi.fn(async () => ({
        status: 'canceled',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: 0,
      })),
      updateSubscriptionPlan: vi.fn(async () => ({
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: 0,
      })),
      syncPlans: vi.fn(async () => []),
      isLive: true,
    },
    email: { sendEmail: vi.fn(async () => ({ success: true })) },
  },
}));

// Controllable auth mock — default: inject user + pass. Tests can override
// authBehavior to simulate unauthenticated / forbidden requests.
type AuthBehavior = 'pass' | 'unauthenticated' | 'forbidden';
let authBehavior: AuthBehavior = 'pass';

vi.mock('../middlewares/auth', async () => {
  const m = await import('./helpers/mocks.js');
  const base = m.createAuthMiddlewareMock();
  return {
    ...base,
    authMiddleware:
      (opts?: { required?: boolean }) => (req: Request, res: Response, next: NextFunction) => {
        if (authBehavior === 'unauthenticated') {
          if (opts?.required === false) {
            // Optional auth — still allow through without user
            return next();
          }
          res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
          return;
        }
        if (authBehavior === 'forbidden') {
          res.status(403).json({ error: 'Insufficient role', code: 'FORBIDDEN' });
          return;
        }
        // "pass" — inject default user
        base.authMiddleware(opts)(req, res, next);
      },
  };
});

vi.mock('../lib/logger', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../lib/activity-logger', () => ({ logActivity: vi.fn() }));
vi.mock('../lib/websocket.js', () => ({ issueWsTicket: vi.fn() }));
vi.mock('../lib/redis-client.js', () => ({
  redisGet: vi.fn(async () => null),
  redisSet: vi.fn(async () => {}),
  redisDel: vi.fn(async () => {}),
  isRedisAvailable: vi.fn(() => false),
}));
vi.mock('@szl-holdings/audit', () => ({ hashIp: vi.fn((ip: string) => ip) }));
vi.mock('../lib/auth', () => ({ getSessionToken: vi.fn(), getSessionUser: vi.fn() }));

// ---------------------------------------------------------------------------
// Controllable platform-flags mock
// ---------------------------------------------------------------------------

const mockIsFlagEnabled = vi.fn(async (_key: string) => false);

vi.mock('../lib/platform-flags', () => ({
  isFlagEnabled: (...args: unknown[]) => mockIsFlagEnabled(...args),
  ensurePlatformFlags: vi.fn(async () => {}),
}));

// ---------------------------------------------------------------------------
// App builders
// ---------------------------------------------------------------------------

function buildApp(router: ExpressRouter) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

let billingApp: ReturnType<typeof buildApp>;
let lyteApp: ReturnType<typeof buildApp>;

beforeAll(async () => {
  const { default: billingRouter } = await import('../routes/billing.js');
  const { default: lyteRouter } = await import('../routes/lyte-billing.js');
  billingApp = buildApp(billingRouter as unknown as ExpressRouter);
  lyteApp = buildApp(lyteRouter as unknown as ExpressRouter);
});

beforeEach(() => {
  mockIsFlagEnabled.mockReset();
  mockIsFlagEnabled.mockResolvedValue(false); // default: flag OFF
  delete process.env.STRIPE_SECRET_KEY;
  authBehavior = 'pass'; // reset auth to default passing state
});

afterAll(() => {
  delete process.env.STRIPE_SECRET_KEY;
});

// ---------------------------------------------------------------------------
// Helper: validate demo-mode response shape
// ---------------------------------------------------------------------------
function expectDemoResponse(body: unknown) {
  expect((body as Record<string, unknown>).demo).toBe(true);
  expect((body as Record<string, unknown>).url).toBeNull();
  expect(typeof (body as Record<string, unknown>).sessionId).toBe('string');
  expect(typeof (body as Record<string, unknown>).message).toBe('string');
}

// ===========================================================================
// Scenario A — flag OFF → all routes return 200 demo response
// ===========================================================================

describe('Scenario A: live_stripe_billing_enabled flag is OFF', () => {
  it('POST /billing/checkout → 200 demo response', async () => {
    const res = await request(billingApp).post('/billing/checkout').send({
      priceId: 'price_test123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });

  it('POST /stripe/checkout → 200 demo response', async () => {
    const res = await request(billingApp).post('/stripe/checkout').send({
      tierId: 'strategy-session',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });

  it('POST /billing/command/subscribe → 200 demo response', async () => {
    const res = await request(billingApp).post('/billing/command/subscribe').send({
      planId: 'command-pro-monthly',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });

  it('POST /billing/terra/subscribe → 200 demo response', async () => {
    const res = await request(billingApp).post('/billing/terra/subscribe').send({
      planId: 'terra-starter-monthly',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });

  it('POST /billing/cancel-subscription → 200 demo response', async () => {
    const res = await request(billingApp).post('/billing/cancel-subscription').send({
      subscriptionId: 'sub_test123',
    });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });

  it('POST /billing/update-subscription → 200 demo response', async () => {
    const res = await request(billingApp).post('/billing/update-subscription').send({
      subscriptionId: 'sub_test123',
      newPriceId: 'price_new123',
    });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });

  it('POST /lyte/billing/pilot-checkout → 200 demo response', async () => {
    const res = await request(lyteApp).post('/lyte/billing/pilot-checkout').send({
      planId: 'lyte-pilot-monthly',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });

  it('POST /lyte/billing/create-invoice → 200 demo response', async () => {
    const res = await request(lyteApp)
      .post('/lyte/billing/create-invoice')
      .send({
        email: 'user@example.com',
        lineItems: [{ description: 'Test item', amount: 100_00, currency: 'usd' }],
      });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });

  it('POST /billing/aegis/enterprise-quote → 200 demo response (UX contract preserved)', async () => {
    // Regression guard: enterprise-quote must still return the disabled/demo contract
    // when the Stripe flag is OFF, even after auth middleware is reordered before gate.
    const res = await request(billingApp).post('/billing/aegis/enterprise-quote').send({
      companyName: 'Acme Corp',
      contactEmail: 'cto@acme.com',
      useCase: 'Cyber insurance',
    });
    expect(res.status).toBe(200);
    expectDemoResponse(res.body);
  });
});

// ===========================================================================
// Scenario B — flag ON, no STRIPE_SECRET_KEY → 503 STRIPE_KEY_MISSING
// ===========================================================================

describe('Scenario B: flag ON but STRIPE_SECRET_KEY not set', () => {
  beforeEach(() => {
    mockIsFlagEnabled.mockResolvedValue(true);
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('POST /billing/checkout → 503 STRIPE_KEY_MISSING', async () => {
    const res = await request(billingApp).post('/billing/checkout').send({
      priceId: 'price_test123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(503);
    expect((res.body as Record<string, unknown>).code).toBe('STRIPE_KEY_MISSING');
  });

  it('POST /stripe/checkout → 503 STRIPE_KEY_MISSING', async () => {
    const res = await request(billingApp).post('/stripe/checkout').send({
      tierId: 'strategy-session',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(503);
    expect((res.body as Record<string, unknown>).code).toBe('STRIPE_KEY_MISSING');
  });

  it('POST /billing/command/subscribe → 503 STRIPE_KEY_MISSING', async () => {
    const res = await request(billingApp).post('/billing/command/subscribe').send({
      planId: 'command-pro-monthly',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(503);
    expect((res.body as Record<string, unknown>).code).toBe('STRIPE_KEY_MISSING');
  });

  it('POST /lyte/billing/pilot-checkout → 503 STRIPE_KEY_MISSING', async () => {
    const res = await request(lyteApp).post('/lyte/billing/pilot-checkout').send({
      planId: 'lyte-pilot-monthly',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(503);
    expect((res.body as Record<string, unknown>).code).toBe('STRIPE_KEY_MISSING');
  });
});

// ===========================================================================
// Scenario C — flag ON, test-mode key → 503 STRIPE_KEY_NOT_LIVE
// ===========================================================================

describe('Scenario C: flag ON but STRIPE_SECRET_KEY is a test-mode key', () => {
  beforeEach(() => {
    mockIsFlagEnabled.mockResolvedValue(true);
    process.env.STRIPE_SECRET_KEY = 'sk_test_FAKE_TEST_KEY_DO_NOT_USE';
  });

  it('POST /billing/checkout → 503 STRIPE_KEY_NOT_LIVE', async () => {
    const res = await request(billingApp).post('/billing/checkout').send({
      priceId: 'price_test123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(503);
    expect((res.body as Record<string, unknown>).code).toBe('STRIPE_KEY_NOT_LIVE');
  });

  it('POST /stripe/checkout → 503 STRIPE_KEY_NOT_LIVE', async () => {
    const res = await request(billingApp).post('/stripe/checkout').send({
      tierId: 'strategy-session',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(503);
    expect((res.body as Record<string, unknown>).code).toBe('STRIPE_KEY_NOT_LIVE');
  });

  it('POST /billing/terra/subscribe → 503 STRIPE_KEY_NOT_LIVE', async () => {
    const res = await request(billingApp).post('/billing/terra/subscribe').send({
      planId: 'terra-starter-monthly',
      email: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(res.status).toBe(503);
    expect((res.body as Record<string, unknown>).code).toBe('STRIPE_KEY_NOT_LIVE');
  });

  it('POST /lyte/billing/create-invoice → 503 STRIPE_KEY_NOT_LIVE', async () => {
    const res = await request(lyteApp)
      .post('/lyte/billing/create-invoice')
      .send({
        email: 'user@example.com',
        lineItems: [{ description: 'Test item', amount: 100_00, currency: 'usd' }],
      });
    expect(res.status).toBe(503);
    expect((res.body as Record<string, unknown>).code).toBe('STRIPE_KEY_NOT_LIVE');
  });
});

// ===========================================================================
// Scenario D — unauthenticated → 401 on privileged routes (flag OFF or ON)
// Auth must gate before Stripe flag on routes that require identity.
// ===========================================================================

describe('Scenario D: unauthenticated requests to privileged billing routes', () => {
  beforeEach(() => {
    authBehavior = 'unauthenticated';
  });

  it('POST /billing/portal-session → 401 when unauthenticated (flag OFF)', async () => {
    const res = await request(billingApp).post('/billing/portal-session').send({});
    expect(res.status).toBe(401);
  });

  it('POST /billing/terra/metered-usage → 401 when unauthenticated (flag OFF)', async () => {
    const res = await request(billingApp).post('/billing/terra/metered-usage').send({
      subscriptionItemId: 'si_test',
      quantity: 10,
    });
    expect(res.status).toBe(401);
  });

  it('POST /billing/cancel-subscription → 401 when unauthenticated (flag OFF)', async () => {
    const res = await request(billingApp).post('/billing/cancel-subscription').send({
      subscriptionId: 'sub_test123',
    });
    expect(res.status).toBe(401);
  });

  it('POST /billing/update-subscription → 401 when unauthenticated (flag OFF)', async () => {
    const res = await request(billingApp).post('/billing/update-subscription').send({
      subscriptionId: 'sub_test123',
      newPriceId: 'price_new123',
    });
    expect(res.status).toBe(401);
  });

  it('POST /billing/aegis/invoice → 401 when unauthenticated (flag OFF)', async () => {
    const res = await request(billingApp)
      .post('/billing/aegis/invoice')
      .send({
        customerId: 'cus_test',
        lineItems: [{ description: 'Consulting', amount: 5000_00 }],
      });
    expect(res.status).toBe(401);
  });

  it('POST /lyte/billing/create-invoice → 401 when unauthenticated (flag OFF)', async () => {
    const res = await request(lyteApp)
      .post('/lyte/billing/create-invoice')
      .send({
        email: 'user@example.com',
        lineItems: [{ description: 'Pilot fee', amount: 2500_00 }],
      });
    expect(res.status).toBe(401);
  });

  it('POST /billing/portal-session → 401 when unauthenticated (flag ON, live key)', async () => {
    mockIsFlagEnabled.mockResolvedValue(true);
    process.env.STRIPE_SECRET_KEY = 'sk_live_FAKE_LIVE_KEY_DO_NOT_USE';
    const res = await request(billingApp).post('/billing/portal-session').send({});
    expect(res.status).toBe(401);
  });

  it('POST /billing/cancel-subscription → 401 when unauthenticated (flag ON, live key)', async () => {
    mockIsFlagEnabled.mockResolvedValue(true);
    process.env.STRIPE_SECRET_KEY = 'sk_live_FAKE_LIVE_KEY_DO_NOT_USE';
    const res = await request(billingApp).post('/billing/cancel-subscription').send({
      subscriptionId: 'sub_test123',
    });
    expect(res.status).toBe(401);
  });
});
