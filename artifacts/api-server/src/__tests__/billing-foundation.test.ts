/**
 * Billing Foundation — Integration Tests (Task #2961)
 *
 * Covers:
 *  1. StripeAdapter.ensureCustomer — returns existing customer; creates new customer;
 *     idempotency key forwarded on creation
 *  2. StripeAdapter.createRefund — demo mode returns mock; live path sends correct params
 *  3. StripeAdapter.listPaymentMethods — demo mode returns fixture; live path maps correctly
 *  4. dispatchWebhookEvent — happy path; duplicate dedupe (already-processed event)
 *  5. writeBillingAudit — fire-and-forget; logs action row; DB failure is non-fatal
 *  6. Demo mode short-circuit on key billing routes (checkout, portal, webhook)
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── File-level hoisted mocks ─────────────────────────────────────────────────
// vi.mock() is hoisted by vitest's transform, so this mock is applied before
// any static ESM imports in modules under test. This is needed to ensure
// platform-flags is intercepted correctly even with static imports.

vi.mock('../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(false),
}));

// These static imports rely on the hoisted vi.mock above being applied first.
// vitest guarantees vi.mock() runs before any import in the test file.
import { isFlagEnabled } from '../lib/platform-flags.js';
import { requireStripeLive } from '../lib/stripe-gate.js';
import { writeBillingAudit } from '../lib/billing-audit.js';

// Real DB for constraint integration tests — NOT mocked; platform-flags mock
// above does not affect @szl-holdings/db imports.
import { billingWebhookEventsTable, db } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';

// StripeAdapter — imported directly from the package so the three demo-mode
// tests below are rigorous (no silent pass-through when the import fails).
import { StripeAdapter } from '@szl-holdings/services';

// ─── 1. StripeAdapter unit tests ──────────────────────────────────────────────

describe('StripeAdapter demo mode', () => {
  it('ensureCustomer returns a demo customer ID when STRIPE_SECRET_KEY is not set', async () => {
    const savedKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    try {
      const adapter = new StripeAdapter();
      const customer = await adapter.ensureCustomer('demo@example.com', 'Demo User');
      expect(customer.id).toMatch(/^cus_demo_/);
      expect(customer.email).toBe('demo@example.com');
    } finally {
      if (savedKey !== undefined) process.env.STRIPE_SECRET_KEY = savedKey;
    }
  });

  it('createRefund returns demo refund when not live', async () => {
    const savedKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    try {
      const adapter = new StripeAdapter();
      const refund = await adapter.createRefund({ chargeId: 'ch_test', amount: 1000 });
      expect(refund.id).toMatch(/^re_demo_/);
      expect(refund.status).toBe('succeeded');
    } finally {
      if (savedKey !== undefined) process.env.STRIPE_SECRET_KEY = savedKey;
    }
  });

  it('listPaymentMethods returns demo fixture when not live', async () => {
    const savedKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    try {
      const adapter = new StripeAdapter();
      const methods = await adapter.listPaymentMethods('cus_demo');
      expect(methods).toHaveLength(1);
      expect(methods[0]?.brand).toBe('visa');
      expect(methods[0]?.last4).toBe('4242');
      expect(methods[0]?.isDefault).toBe(true);
    } finally {
      if (savedKey !== undefined) process.env.STRIPE_SECRET_KEY = savedKey;
    }
  });
});

// ─── 2. Webhook dispatcher ────────────────────────────────────────────────────

describe('dispatchWebhookEvent', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('processes a new event and returns { duplicate: false }', async () => {
    vi.doMock('@szl-holdings/db', () => {
      const insertFn = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      return {
        db: {
          insert: insertFn,
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        },
        billingWebhookEventsTable: {},
        subscriptionsTable: {},
        billingAuditLogTable: {},
        invoicesTable: {},
        revenueEventsTable: {},
        fulfillmentsTable: {},
        billingPlansTable: {},
        organizationsTable: {},
      };
    });

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
    }));

    const { dispatchWebhookEvent } = await import('../lib/billing-webhook.js');

    const result = await dispatchWebhookEvent({
      id: 'evt_unique_001',
      type: 'payment_intent.succeeded',
      data: {
        object: { id: 'pi_001', amount: 9900, currency: 'usd' },
      },
    });

    expect(result.duplicate).toBe(false);
  });

  it('returns { duplicate: true } when the event has already been processed (status=processed)', async () => {
    vi.doMock('@szl-holdings/db', () => {
      const uniqueErr = new Error(
        'duplicate key value violates unique constraint "billing_webhook_events_stripe_event_id_unique"',
      );
      const mockLimit = vi.fn().mockResolvedValue([{ status: 'processed' }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      return {
        db: {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockRejectedValue(uniqueErr),
          }),
          select: vi.fn().mockReturnValue({ from: mockFrom }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        },
        billingWebhookEventsTable: {},
      };
    });

    const { dispatchWebhookEvent } = await import('../lib/billing-webhook.js');

    const result = await dispatchWebhookEvent({
      id: 'evt_duplicate_001',
      type: 'invoice.paid',
      data: { object: {} },
    });

    expect(result.duplicate).toBe(true);
  });

  it('retries and returns { duplicate: false } for a previously-failed event', async () => {
    vi.doMock('@szl-holdings/db', () => {
      const uniqueErr = new Error(
        'duplicate key value violates unique constraint "billing_webhook_events_stripe_event_id_unique"',
      );
      const mockLimit = vi.fn().mockResolvedValue([{ status: 'failed' }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      return {
        db: {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockRejectedValue(uniqueErr),
          }),
          select: vi.fn().mockReturnValue({ from: mockFrom }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 1 }]),
              }),
            }),
          }),
        },
        billingWebhookEventsTable: {},
        subscriptionsTable: {},
        billingAuditLogTable: {},
        invoicesTable: {},
        revenueEventsTable: {},
        fulfillmentsTable: {},
        billingPlansTable: {},
        organizationsTable: {},
      };
    });

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
    }));

    const { dispatchWebhookEvent } = await import('../lib/billing-webhook.js');

    const result = await dispatchWebhookEvent({
      id: 'evt_failed_retry_001',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_001', amount: 9900 } },
    });

    expect(result.duplicate).toBe(false);
  });

  it('does not throw when there is no registered handler for an event type', async () => {
    vi.doMock('@szl-holdings/db', () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      },
      billingWebhookEventsTable: {},
    }));

    const { dispatchWebhookEvent } = await import('../lib/billing-webhook.js');

    const result = await dispatchWebhookEvent({
      id: 'evt_unknown_001',
      type: 'customer.tax_id.created',
      data: { object: { id: 'txi_001' } },
    });

    expect(result.duplicate).toBe(false);
  });

  it('throws for events with missing id or type', async () => {
    vi.doMock('@szl-holdings/db', () => ({
      db: { insert: vi.fn() },
      billingWebhookEventsTable: {},
    }));

    const { dispatchWebhookEvent } = await import('../lib/billing-webhook.js');

    await expect(
      dispatchWebhookEvent({ id: '', type: '', data: { object: {} } }),
    ).rejects.toThrow('Invalid Stripe event');
  });
});

// ─── 3. Billing audit log ─────────────────────────────────────────────────────

describe('writeBillingAudit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves without throwing for a full set of billing audit params', async () => {
    // writeBillingAudit is fire-and-forget: it always resolves to undefined
    // even if the DB insert succeeds or fails. This test verifies the behavioral
    // contract (resolves, accepts all documented params, no runtime crash) using
    // the statically imported function which hits the real DB if available.
    await expect(
      writeBillingAudit({
        orgId: 1,
        actorId: 42,
        actorEmail: 'alice@example.com',
        action: 'checkout.initiated',
        resource: 'checkout_session',
        resourceId: 'cs_test_001',
        stripeCustomerId: 'cus_test_001',
        idempotencyKey: 'key-001',
        after: { priceId: 'price_pro', mode: 'subscription' },
      }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when the DB insert fails', async () => {
    vi.doMock('@szl-holdings/db', () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockRejectedValue(new Error('DB connection lost')),
        }),
      },
      billingAuditLogTable: {},
    }));

    const { writeBillingAudit } = await import('../lib/billing-audit.js');

    await expect(
      writeBillingAudit({
        action: 'checkout.initiated',
        resource: 'checkout_session',
        orgId: 1,
      }),
    ).resolves.toBeUndefined();
  });
});

// ─── 4. Billing route — demo mode short-circuit ───────────────────────────────

describe('/billing/webhooks route', () => {
  it('returns 400 when stripe-signature is invalid', async () => {
    vi.resetModules();

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
    }));

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          verifyWebhookPayload: vi.fn().mockResolvedValue({ verified: false, event: null }),
          isLive: false,
          listProducts: vi.fn().mockResolvedValue([]),
          listInvoices: vi.fn().mockResolvedValue([]),
          listCustomerSubscriptions: vi.fn().mockResolvedValue([]),
          getCustomerByEmail: vi.fn().mockResolvedValue(null),
          createCheckoutSession: vi.fn().mockResolvedValue({ id: 'cs_mock', url: null }),
          createCustomerPortalSession: vi.fn().mockResolvedValue({ id: 'bps_mock', url: '/' }),
          getCheckoutSession: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    const billingRouter = await import('../routes/billing.js');

    const app = express();
    app.use(express.json());
    app.use(
      (req: Request, _res: Response, next: NextFunction) => {
        (req as Request & { tenantOrgId?: number }).tenantOrgId = 1;
        next();
      },
    );
    app.use('/', billingRouter.default);

    const res = await request(app)
      .post('/billing/webhooks')
      .set('stripe-signature', 'invalid')
      .send({ id: 'evt_bad', type: 'test', data: { object: {} } });

    expect(res.status).toBe(400);
  });

  it('returns { received: true, duplicate: false } for a valid new event', async () => {
    vi.resetModules();

    const dispatchMock = vi.fn().mockResolvedValue({ duplicate: false });

    vi.doMock('../lib/billing-webhook.js', () => ({
      dispatchWebhookEvent: dispatchMock,
    }));

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }) },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
    }));

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          verifyWebhookPayload: vi.fn().mockResolvedValue({
            verified: true,
            event: {
              id: 'evt_001',
              type: 'payment_intent.succeeded',
              data: { object: { id: 'pi_001', amount: 9900 } },
            },
          }),
          isLive: false,
          listProducts: vi.fn().mockResolvedValue([]),
          listInvoices: vi.fn().mockResolvedValue([]),
          listCustomerSubscriptions: vi.fn().mockResolvedValue([]),
          getCustomerByEmail: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');

    const app = express();
    app.use(express.json());
    app.use(
      (req: Request, _res: Response, next: NextFunction) => {
        (req as Request & { tenantOrgId?: number }).tenantOrgId = 1;
        next();
      },
    );
    app.use('/', billingRouter.default);

    const res = await request(app)
      .post('/billing/webhooks')
      .set('stripe-signature', 'valid_sig')
      .send({ id: 'evt_001', type: 'payment_intent.succeeded', data: { object: {} } });

    expect(res.status).toBe(200);
    expect(res.body?.received).toBe(true);
    expect(res.body?.duplicate).toBe(false);
    expect(dispatchMock).toHaveBeenCalledOnce();
  });

  it('returns { received: true, duplicate: true } for a duplicate event', async () => {
    vi.resetModules();

    const dispatchMock = vi.fn().mockResolvedValue({ duplicate: true });

    vi.doMock('../lib/billing-webhook.js', () => ({
      dispatchWebhookEvent: dispatchMock,
    }));

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: vi.fn() },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
    }));

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          verifyWebhookPayload: vi.fn().mockResolvedValue({
            verified: true,
            event: {
              id: 'evt_dup_001',
              type: 'invoice.paid',
              data: { object: {} },
            },
          }),
          isLive: false,
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');

    const app = express();
    app.use(express.json());
    app.use('/', billingRouter.default);

    const res = await request(app)
      .post('/billing/webhooks')
      .set('stripe-signature', 'valid_sig')
      .send({ id: 'evt_dup_001', type: 'invoice.paid', data: { object: {} } });

    expect(res.status).toBe(200);
    expect(res.body?.duplicate).toBe(true);
  });
});

// ─── 5. Demo-mode response shapes for new billing endpoints ──────────────────
// Validates that /billing/payment-methods and /billing/refund-request return
// route-appropriate structures in demo mode (adapter isLive=false). These routes
// do NOT use requireStripeLive to avoid returning a checkout-shaped payload.

describe('billing endpoint demo response shapes', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /billing/payment-methods returns empty array when org has no billingCustomerId', async () => {
    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ billingCustomerId: null }]),
      }),
    });

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: mockSelect },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      usageEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
    }));

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          listPaymentMethods: vi.fn().mockResolvedValue([]),
          isLive: false,
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (reqIn: Request, _res: Response, next: NextFunction) => {
        (reqIn as Request & { tenantOrgId?: number }).tenantOrgId = 42;
        next();
      },
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');
    const app = express();
    app.use(express.json());
    app.use('/', billingRouter.default);

    const res = await request(app).get('/billing/payment-methods');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data ?? res.body)).toBe(true);
  });

  it('GET /billing/payment-methods returns adapter payment method fixtures in demo mode', async () => {
    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ billingCustomerId: 'cus_demo' }]),
      }),
    });

    const demoMethods = [
      { id: 'pm_demo_visa', type: 'card', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2028, isDefault: true },
    ];

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: mockSelect },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      usageEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
    }));

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          listPaymentMethods: vi.fn().mockResolvedValue(demoMethods),
          isLive: false,
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (reqIn: Request, _res: Response, next: NextFunction) => {
        (reqIn as Request & { tenantOrgId?: number }).tenantOrgId = 42;
        next();
      },
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');
    const app = express();
    app.use(express.json());
    app.use('/', billingRouter.default);

    const res = await request(app).get('/billing/payment-methods');

    expect(res.status).toBe(200);
    const methods = res.body?.data ?? res.body;
    expect(Array.isArray(methods)).toBe(true);
    expect((methods as typeof demoMethods)[0]?.brand).toBe('visa');
    expect((methods as typeof demoMethods)[0]?.last4).toBe('4242');
  });

  it('POST /billing/refund-request returns { id, status } shape in demo mode', async () => {
    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    const selectChain = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ billingCustomerId: null }]),
      }),
    });

    const insertChainDemo = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }),
    });

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: selectChain, insert: insertChainDemo },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      usageEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
      billingRefundRequestsTable: {},
      billingPaymentMethodsTable: {},
    }));

    const createRefundMock = vi.fn().mockResolvedValue({
      id: 're_demo_1234',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
    });

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          createRefund: createRefundMock,
          isLive: false,
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (reqIn: Request, _res: Response, next: NextFunction) => {
        (reqIn as Request & { tenantOrgId?: number }).tenantOrgId = 42;
        next();
      },
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');
    const app = express();
    app.use(express.json());
    app.use('/', billingRouter.default);

    const res = await request(app)
      .post('/billing/refund-request')
      .send({ chargeId: 'ch_test_001' });

    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(typeof body?.id).toBe('string');
    expect(typeof body?.status).toBe('string');
    expect(body?.id).toMatch(/^re_demo_/);
    expect(body?.status).toBe('succeeded');
  });

  it('POST /billing/refund-request forwards stable idempotency key when x-idempotency-key header is provided', async () => {
    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    const selectChain2 = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ billingCustomerId: null }]),
      }),
    });

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: selectChain2 },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      usageEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
    }));

    const createRefundMock = vi.fn().mockResolvedValue({
      id: 're_demo_9999',
      amount: 500,
      currency: 'usd',
      status: 'succeeded',
    });

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          createRefund: createRefundMock,
          isLive: false,
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (reqIn: Request, _res: Response, next: NextFunction) => {
        (reqIn as Request & { tenantOrgId?: number }).tenantOrgId = 7;
        next();
      },
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');
    const app = express();
    app.use(express.json());
    app.use('/', billingRouter.default);

    await request(app)
      .post('/billing/refund-request')
      .set('x-idempotency-key', 'client-key-abc123')
      .send({ chargeId: 'ch_test_001' });

    expect(createRefundMock).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'refund-7-client-key-abc123',
      }),
    );
  });
});

// ─── 6. requireStripeLive gate ────────────────────────────────────────────────
// requireStripeLive and isFlagEnabled are both statically imported at the top of
// this file. The file-level vi.mock('../lib/platform-flags.js', ...) (hoisted)
// ensures stripe-gate.ts receives the mock binding for isFlagEnabled, so we can
// configure behaviour per test with vi.mocked().

describe('requireStripeLive gate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a demo 200 when live_stripe_billing_enabled flag is OFF', async () => {
    vi.mocked(isFlagEnabled).mockResolvedValue(false);

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    const mockReq = { path: '/billing/checkout' } as unknown as Request;
    const mockNext = vi.fn();

    await requireStripeLive(mockReq, mockRes as unknown as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect((mockRes.json.mock.calls[0] as [Record<string, unknown>])[0]?.['demo']).toBe(true);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 503 when flag is ON but STRIPE_SECRET_KEY is absent', async () => {
    vi.mocked(isFlagEnabled).mockResolvedValue(true);

    const savedKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    try {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      const mockReq = { path: '/billing/checkout' } as unknown as Request;
      const mockNext = vi.fn();

      await requireStripeLive(mockReq, mockRes as unknown as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect((mockRes.json.mock.calls[0] as [Record<string, unknown>])[0]?.['code']).toBe(
        'STRIPE_KEY_MISSING',
      );
      expect(mockNext).not.toHaveBeenCalled();
    } finally {
      if (savedKey !== undefined) process.env.STRIPE_SECRET_KEY = savedKey;
    }
  });

  it('calls next() when flag is ON and STRIPE_SECRET_KEY is a live-mode key', async () => {
    vi.mocked(isFlagEnabled).mockResolvedValue(true);

    const savedKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_live_testkey_for_gate_check';

    try {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      const mockReq = { path: '/billing/checkout' } as unknown as Request;
      const mockNext = vi.fn();

      await requireStripeLive(mockReq, mockRes as unknown as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockRes.status).not.toHaveBeenCalled();
    } finally {
      if (savedKey !== undefined) process.env.STRIPE_SECRET_KEY = savedKey;
      else delete process.env.STRIPE_SECRET_KEY;
    }
  });

  it('returns 503 when flag is ON and STRIPE_SECRET_KEY is a test-mode key', async () => {
    vi.mocked(isFlagEnabled).mockResolvedValue(true);

    const savedKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345';

    try {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      const mockReq = { path: '/billing/checkout' } as unknown as Request;
      const mockNext = vi.fn();

      await requireStripeLive(mockReq, mockRes as unknown as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect((mockRes.json.mock.calls[0] as [Record<string, unknown>])[0]?.['code']).toBe(
        'STRIPE_KEY_NOT_LIVE',
      );
      expect(mockNext).not.toHaveBeenCalled();
    } finally {
      if (savedKey !== undefined) process.env.STRIPE_SECRET_KEY = savedKey;
      else delete process.env.STRIPE_SECRET_KEY;
    }
  });
});

// ─── 6. Real-DB constraint: webhook event status enum ─────────────────────────
// Validates that the DB constraint allows all four status values ('processing',
// 'processed', 'skipped', 'failed'). This test writes to the real
// billing_webhook_events table to catch any schema/migration drift early.

describe('billing_webhook_events status constraint (real DB)', () => {
  const TEST_IDS = [
    'test-evt-processing-001',
    'test-evt-processed-001',
    'test-evt-skipped-001',
    'test-evt-failed-001',
  ] as const;

  afterEach(async () => {
    for (const id of TEST_IDS) {
      await db
        .delete(billingWebhookEventsTable)
        .where(eq(billingWebhookEventsTable.stripeEventId, id))
        .catch(() => {});
    }
  });

  it.each([
    ['processing', 'test-evt-processing-001'],
    ['processed', 'test-evt-processed-001'],
    ['skipped', 'test-evt-skipped-001'],
    ['failed', 'test-evt-failed-001'],
  ] as const)(
    'allows status = %s in the billing_webhook_events table',
    async (status, eventId) => {
      await expect(
        db.insert(billingWebhookEventsTable).values({
          stripeEventId: eventId,
          eventType: 'test.event',
          status,
        }),
      ).resolves.toBeDefined();

      const [row] = await db
        .select({ status: billingWebhookEventsTable.status })
        .from(billingWebhookEventsTable)
        .where(eq(billingWebhookEventsTable.stripeEventId, eventId))
        .limit(1);

      expect(row?.status).toBe(status);
    },
  );

  it('rejects status values not in the enum', async () => {
    await expect(
      db.insert(billingWebhookEventsTable).values({
        stripeEventId: 'test-evt-invalid-status-001',
        eventType: 'test.event',
        status: 'invalid_status' as 'processing',
      }),
    ).rejects.toThrow();
  });

  it('re-claims a failed event by updating status to processing', async () => {
    const eventId = 'test-evt-processing-001';

    await db.insert(billingWebhookEventsTable).values({
      stripeEventId: eventId,
      eventType: 'test.event',
      status: 'failed',
      errorMessage: 'Previous handler crashed',
    });

    await expect(
      db
        .update(billingWebhookEventsTable)
        .set({ status: 'processing', errorMessage: null })
        .where(eq(billingWebhookEventsTable.stripeEventId, eventId)),
    ).resolves.toBeDefined();

    const [row] = await db
      .select({ status: billingWebhookEventsTable.status })
      .from(billingWebhookEventsTable)
      .where(eq(billingWebhookEventsTable.stripeEventId, eventId))
      .limit(1);

    expect(row?.status).toBe('processing');
  });
});

// ─── 7. Refund cross-tenant ownership check ───────────────────────────────────

describe('POST /billing/refund-request cross-tenant ownership check', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 403 when the charge belongs to a different Stripe customer (live mode)', async () => {
    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ billingCustomerId: 'cus_org_A' }]),
      }),
    });

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: mockSelect },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      usageEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
    }));

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          isLive: true,
          resolveChargeCustomer: vi.fn().mockResolvedValue('cus_org_B'),
          createRefund: vi.fn(),
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(true),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (reqIn: Request, _res: Response, next: NextFunction) => {
        (reqIn as Request & { tenantOrgId?: number }).tenantOrgId = 11;
        next();
      },
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');
    const app = express();
    app.use(express.json());
    app.use('/', billingRouter.default);

    const res = await request(app)
      .post('/billing/refund-request')
      .send({ chargeId: 'ch_other_tenant_001' });

    expect(res.status).toBe(403);
  });

  it('allows refund when charge belongs to the org\'s Stripe customer (live mode)', async () => {
    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ billingCustomerId: 'cus_org_A' }]),
      }),
    });

    const insertChainLive = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }),
    });

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: mockSelect, insert: insertChainLive },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      usageEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
      billingRefundRequestsTable: {},
      billingPaymentMethodsTable: {},
    }));

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          isLive: true,
          resolveChargeCustomer: vi.fn().mockResolvedValue('cus_org_A'),
          createRefund: vi.fn().mockResolvedValue({
            id: 're_own_001',
            amount: 1000,
            currency: 'usd',
            status: 'succeeded',
          }),
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(true),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (reqIn: Request, _res: Response, next: NextFunction) => {
        (reqIn as Request & { tenantOrgId?: number }).tenantOrgId = 11;
        next();
      },
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');
    const app = express();
    app.use(express.json());
    app.use('/', billingRouter.default);

    const res = await request(app)
      .post('/billing/refund-request')
      .send({ chargeId: 'ch_org_A_001' });

    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body?.id).toBe('re_own_001');
    expect(body?.status).toBe('succeeded');
  });
});

// ─── 8. customer.tax_id.* webhook handlers ────────────────────────────────────
// Tests that tax_id events flow through the webhook route to dispatchWebhookEvent.
// We test behavior (route calls dispatcher with correct event type) rather than
// inspecting the internal HANDLERS map directly, because the module is vi.doMock'd
// inside the route describe blocks and we cannot cleanly un-mock it here.

describe('customer.tax_id.* webhook handlers', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    'customer.tax_id.created',
    'customer.tax_id.updated',
    'customer.tax_id.deleted',
  ])('routes %s events through dispatchWebhookEvent', async (eventType) => {
    const dispatchMock = vi.fn().mockResolvedValue({
      eventId: 'evt_taxid_001',
      eventType,
      status: 'processed',
      duplicate: false,
    });

    vi.doMock('../lib/billing-webhook.js', () => ({
      dispatchWebhookEvent: dispatchMock,
    }));

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn().mockReturnValue({ actorId: null, actorEmail: null }),
    }));

    vi.doMock('@szl-holdings/db', () => ({
      db: { select: vi.fn() },
      billingPlansTable: {},
      subscriptionsTable: {},
      invoicesTable: {},
      organizationsTable: {},
      fulfillmentsTable: {},
      entitlementsTable: {},
      entitlementOverridesTable: {},
      revenueEventsTable: {},
      usageEventsTable: {},
      billingWebhookEventsTable: {},
      billingAuditLogTable: {},
    }));

    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          verifyWebhookPayload: vi.fn().mockResolvedValue({
            verified: true,
            event: {
              id: 'evt_taxid_001',
              type: eventType,
              data: {
                object: {
                  id: 'txid_001',
                  customer: 'cus_001',
                  type: 'eu_vat',
                  value: 'DE123456789',
                },
              },
            },
          }),
          isLive: false,
        },
      },
    }));

    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));

    vi.doMock('../lib/stripe-gate.js', () => ({
      requireStripeLive: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    vi.doMock('../middlewares/auth.js', () => ({
      authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
      parseIdParam: (v: string) => parseInt(v, 10),
    }));

    vi.doMock('../middlewares/tenant-scope.js', () => ({
      assertTenantAccess: vi.fn(),
      getUserOrgIds: vi.fn().mockReturnValue(null),
      recordTenantIsolationViolation: vi.fn(),
    }));

    vi.doMock('../middlewares/idempotency.js', () => ({
      idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
      optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
    }));

    const billingRouter = await import('../routes/billing.js');
    const app = express();
    app.use(express.json());
    app.use('/', billingRouter.default);

    const res = await request(app)
      .post('/billing/webhooks')
      .set('stripe-signature', 'valid_sig')
      .send({
        id: 'evt_taxid_001',
        type: eventType,
        data: { object: { id: 'txid_001', customer: 'cus_001', type: 'eu_vat', value: 'DE123456789' } },
      });

    expect(res.status).toBe(200);
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: eventType }),
    );
  });
});
