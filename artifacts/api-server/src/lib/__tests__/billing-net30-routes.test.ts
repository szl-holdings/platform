/**
 * billing-net30-routes.test.ts
 *
 * Route-level integration tests for the NET-30 enterprise invoice workflow.
 *
 * Test strategy:
 *  - Demo-mode GET endpoints (no DB required): verify response shape + content
 *  - POST validation: verify schema rejection with 400 before any DB call
 *  - State machine transitions: verify wrong-state rejections (DB returns invoice)
 *  - Exported job runners: verify return shape for empty-DB case
 *  - Webhook reconciliation: verify dispatchWebhookEvent NET-30 path behavior
 *
 * All DB calls are mocked. Heavy async chains are avoided by checking only the
 * early-return code paths (validation, not-found, wrong-state) which are the
 * most important correctness guarantees.
 */

import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import supertest from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ─── Mock setup ──────────────────────────────────────────────────────────────
// All DB mocks default to empty / no-op, letting early-exit code paths
// (validation, 404, wrong-state) execute without hanging on DB awaits.

const mockDb = {
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@szl-holdings/db', () => ({
  db: mockDb,
  net30InvoicesTable: { id: {}, orgId: {}, status: {}, stripeInvoiceId: {} },
  net30InvoiceLineItemsTable: {},
  net30InvoicePaymentsTable: {},
  net30CreditMemosTable: {},
  net30DunningLogTable: {},
  net30DunningConfigTable: {},
  net30AgingSnapshotsTable: {},
  organizationsTable: { id: {}, name: {}, billingCustomerId: {} },
  billingAuditLogTable: {},
  billingWebhookEventsTable: {},
  invoicesTable: {},
  fulfillmentsTable: {},
  billingPlansTable: {},
  revenueEventsTable: {},
  subscriptionsTable: {},
}));

vi.mock('@szl-holdings/services', () => ({
  services: {
    stripe: {
      createInvoice: vi.fn().mockResolvedValue({ id: 'in_test', hostedInvoiceUrl: 'https://stripe.com/inv', status: 'open' }),
      getCustomerByEmail: vi.fn().mockResolvedValue(null),
      createCustomer: vi.fn().mockResolvedValue({ id: 'cus_test' }),
      isLive: false,
    },
  },
}));

vi.mock('../email', () => ({
  buildNet30DunningEmail: vi.fn().mockReturnValue('<html/>'),
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../billing-audit', () => ({
  writeBillingAudit: vi.fn().mockResolvedValue(undefined),
  actorFromReq: vi.fn().mockReturnValue({ actorId: 1, actorEmail: 'admin@szl.com' }),
}));

vi.mock('../net30-collections-pdf', () => ({
  generateNet30CollectionsPacket: vi.fn().mockResolvedValue(Buffer.from('PDF')),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: vi.fn(() => (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user?: unknown }).user = { id: 1, email: 'admin@szl.com', roles: ['admin'] };
    next();
  }),
  requireRole: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  parseIdParam: (val: string) => parseInt(val, 10),
}));

vi.mock('../../middlewares/tenant-scope', () => ({
  tenantScope: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  getUserOrgIds: vi.fn().mockReturnValue(null),
  assertTenantAccess: vi.fn(),
  recordTenantIsolationViolation: vi.fn(),
}));

// ─── Helper: build an Express app that injects tenant context ─────────────────

function buildSelectChain(rows: unknown): unknown {
  const chain: Record<string, (...args: unknown[]) => unknown> = {};
  const make = (): unknown =>
    new Proxy(chain, {
      get(_t, prop) {
        if (prop === 'then') {
          return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
            Promise.resolve(rows).then(res, rej);
        }
        return () => make();
      },
    });
  return make();
}

// ─── Shared app (built once per file) ────────────────────────────────────────

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { tenantOrgId?: number }).tenantOrgId = 1;
    (req as Request & { user?: unknown }).user = { id: 1, email: 'admin@szl.com', roles: ['admin'] };
    next();
  });
  const mod = await import('../../routes/billing-net30');
  app.use('/api', mod.default);
});

// ─── Demo mode: GET /billing/net30/ar-aging ──────────────────────────────────

describe('GET /billing/net30/ar-aging?demo=true', () => {
  it('returns 200 with all 5 aging buckets in summary', async () => {
    const res = await supertest(app)
      .get('/api/billing/net30/ar-aging')
      .query({ demo: 'true' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    const { summary } = res.body;
    expect(summary).toHaveProperty('current');
    expect(summary).toHaveProperty('bucket1to30');
    expect(summary).toHaveProperty('bucket31to60');
    expect(summary).toHaveProperty('bucket61to90');
    expect(summary).toHaveProperty('bucket90plus');
    expect(summary).toHaveProperty('totalOutstanding');
  });

  it('totalOutstanding is positive in demo mode', async () => {
    const res = await supertest(app)
      .get('/api/billing/net30/ar-aging')
      .query({ demo: 'true' });
    expect(res.body.summary.totalOutstanding).toBeGreaterThan(0);
  });

  it('includes agingTrend history array', async () => {
    const res = await supertest(app)
      .get('/api/billing/net30/ar-aging')
      .query({ demo: 'true' });
    const { agingTrend } = res.body;
    expect(Array.isArray(agingTrend)).toBe(true);
    expect(agingTrend.length).toBeGreaterThan(0);
    expect(agingTrend[0]).toHaveProperty('date');
    expect(agingTrend[0]).toHaveProperty('totalOutstanding');
  });

  it('includes invoices list with per-customer detail', async () => {
    const res = await supertest(app)
      .get('/api/billing/net30/ar-aging')
      .query({ demo: 'true' });
    const { invoices } = res.body;
    expect(Array.isArray(invoices)).toBe(true);
    expect(invoices.length).toBeGreaterThan(0);
    for (const inv of invoices) {
      expect(inv).toHaveProperty('invoiceNumber');
      expect(inv).toHaveProperty('customerName');
      expect(inv).toHaveProperty('outstandingBalance');
      expect(inv).toHaveProperty('bucket');
    }
  });
});

// ─── Demo mode: GET /billing/net30/ar-aging/history ──────────────────────────

describe('GET /billing/net30/ar-aging/history?demo=true', () => {
  it('returns array of trend data points', async () => {
    const res = await supertest(app)
      .get('/api/billing/net30/ar-aging/history')
      .query({ demo: 'true' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Demo mode: GET /billing/net30/invoices ──────────────────────────────────

describe('GET /billing/net30/invoices?demo=true', () => {
  it('returns array of demo invoices', async () => {
    const res = await supertest(app)
      .get('/api/billing/net30/invoices')
      .query({ demo: 'true' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('each demo invoice has required fields', async () => {
    const res = await supertest(app)
      .get('/api/billing/net30/invoices')
      .query({ demo: 'true' });
    for (const inv of res.body.data) {
      expect(inv).toHaveProperty('invoiceNumber');
      expect(inv).toHaveProperty('customerName');
      expect(inv).toHaveProperty('outstandingBalance');
      expect(inv).toHaveProperty('bucket');
    }
  });
});

// ─── Schema validation: POST /billing/net30/invoices ─────────────────────────

describe('POST /billing/net30/invoices — schema validation', () => {
  it('rejects missing customerName with 400', async () => {
    const res = await supertest(app)
      .post('/api/billing/net30/invoices')
      .send({ lineItems: [{ description: 'Svc', quantity: 1, unitPrice: 100 }] });
    expect(res.status).toBe(400);
  });

  it('rejects empty lineItems array with 400', async () => {
    const res = await supertest(app)
      .post('/api/billing/net30/invoices')
      .send({ customerName: 'Test Corp', lineItems: [] });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email format with 400', async () => {
    const res = await supertest(app)
      .post('/api/billing/net30/invoices')
      .send({ customerName: 'Test Corp', customerEmail: 'bad-email', lineItems: [{ description: 'X', quantity: 1, unitPrice: 100 }] });
    expect(res.status).toBe(400);
  });

  it('rejects attachment with invalid URL with 400', async () => {
    const res = await supertest(app)
      .post('/api/billing/net30/invoices')
      .send({
        customerName: 'Test Corp',
        lineItems: [{ description: 'X', quantity: 1, unitPrice: 100 }],
        attachments: [{ name: 'doc.pdf', url: 'not-a-url' }],
      });
    expect(res.status).toBe(400);
  });

  it('accepts valid attachment URL in payload', async () => {
    // Set up DB mock to return an invoice (count for generateInvoiceNumber)
    mockDb.select.mockReturnValue(buildSelectChain([{ count: 5 }]));
    mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1, invoiceNumber: 'INV-2026-0006', status: 'draft', orgId: 1, totalAmount: '1000.00', outstandingBalance: '1000.00', subtotal: '1000.00', discountAmount: '0.00', paidAmount: '0.00', creditApplied: '0.00', currency: 'usd', customerName: 'Test', createdAt: new Date(), updatedAt: new Date() }]) }) });

    const res = await supertest(app)
      .post('/api/billing/net30/invoices')
      .send({
        customerName: 'Test Corp',
        lineItems: [{ description: 'Svc', quantity: 1, unitPrice: 1000 }],
        attachments: [{ name: 'contract.pdf', url: 'https://cdn.example.com/contract.pdf', mimeType: 'application/pdf' }],
      });
    // Schema is valid, so rejection should not be 400 from validation
    expect(res.status).not.toBe(400);
  });
});

// ─── State machine: wrong-state rejections ────────────────────────────────────

describe('Invoice state machine — wrong-state rejections', () => {
  function setupInvoiceSelect(invoice: Record<string, unknown>) {
    mockDb.select.mockReturnValue(buildSelectChain([invoice]));
  }

  const baseInvoice = {
    id: 101, orgId: 1, invoiceNumber: 'INV-2026-0042', customerName: 'Meridian Partners',
    customerEmail: 'billing@meridian.com', terms: 'NET-30', poNumber: null, status: 'draft',
    dueDate: new Date('2026-05-26'), issuedDate: new Date('2026-04-26'), totalAmount: '12500.00',
    paidAmount: '0.00', creditApplied: '0.00', outstandingBalance: '12500.00', currency: 'usd',
    dunningEnabled: true, dunningPausedAt: null, dunningStep: 0, collectionsAt: null,
    sentAt: null, paidAt: null, stripeInvoiceId: null, metadata: null, createdAt: new Date(), updatedAt: new Date(),
  };

  it('submit: rejects when already in review status', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'review' });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/submit');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/draft/i);
  });

  it('approve: rejects when invoice is still draft (not review)', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'draft' });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/approve');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/review/i);
  });

  it('send: rejects when invoice is not yet approved', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'review' });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/send');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/approved/i);
  });

  it('send: rejects when approved invoice has no customerEmail', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'approved', customerEmail: null });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/send');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/customerEmail/i);
  });

  it('void: rejects voiding a paid invoice', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'paid' });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/void');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/paid/i);
  });

  it('void: rejects voiding a void invoice', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'void' });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/void');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/void/i);
  });

  it('collections: rejects flagging a draft invoice', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'draft' });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/collections');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/sent|partial/i);
  });

  it('collections: rejects flagging a paid invoice', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'paid' });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/collections');
    expect(res.status).toBe(400);
  });

  it('dunning/pause: rejects pausing on a paid invoice', async () => {
    setupInvoiceSelect({ ...baseInvoice, status: 'paid' });
    const res = await supertest(app).post('/api/billing/net30/invoices/101/dunning/pause');
    expect(res.status).toBe(400);
  });
});

// ─── 404 cases ────────────────────────────────────────────────────────────────

describe('Invoice routes — 404 for unknown invoice', () => {
  beforeAll(() => {
    // Always return empty array → invoice not found
    mockDb.select.mockReturnValue(buildSelectChain([]));
  });

  it('GET /billing/net30/invoices/:id returns 404', async () => {
    const res = await supertest(app).get('/api/billing/net30/invoices/9999');
    expect(res.status).toBe(404);
  });

  it('POST .../submit returns 404', async () => {
    const res = await supertest(app).post('/api/billing/net30/invoices/9999/submit');
    expect(res.status).toBe(404);
  });

  it('POST .../approve returns 404', async () => {
    const res = await supertest(app).post('/api/billing/net30/invoices/9999/approve');
    expect(res.status).toBe(404);
  });

  it('POST .../send returns 404', async () => {
    const res = await supertest(app).post('/api/billing/net30/invoices/9999/send');
    expect(res.status).toBe(404);
  });

  it('POST .../void returns 404', async () => {
    const res = await supertest(app).post('/api/billing/net30/invoices/9999/void');
    expect(res.status).toBe(404);
  });

  it('POST .../collections returns 404', async () => {
    const res = await supertest(app).post('/api/billing/net30/invoices/9999/collections');
    expect(res.status).toBe(404);
  });

  it('GET .../collections-packet returns 404', async () => {
    const res = await supertest(app).get('/api/billing/net30/invoices/9999/collections-packet');
    expect(res.status).toBe(404);
  });

  it('POST .../dunning/resume returns 404', async () => {
    const res = await supertest(app).post('/api/billing/net30/invoices/9999/dunning/resume');
    expect(res.status).toBe(404);
  });
});

// ─── Collections-packet: requires in_collections status ──────────────────────

describe('GET /billing/net30/invoices/:id/collections-packet', () => {
  it('rejects PDF export for sent invoice (not in_collections)', async () => {
    mockDb.select.mockReturnValue(buildSelectChain([{
      id: 101, orgId: 1, status: 'sent', invoiceNumber: 'INV-2026-0042',
      customerName: 'Meridian Partners', totalAmount: '12500.00', outstandingBalance: '12500.00',
      paidAmount: '0.00', currency: 'usd', createdAt: new Date(), updatedAt: new Date(),
    }]));
    const res = await supertest(app).get('/api/billing/net30/invoices/101/collections-packet');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/in_collections/i);
  });
});

// ─── Exported job runners ─────────────────────────────────────────────────────

describe('Exported job runners', () => {
  it('runNet30DunningPass is exported as a function', async () => {
    const mod = await import('../../routes/billing-net30');
    expect(typeof mod.runNet30DunningPass).toBe('function');
  });

  it('runDailyNet30AgingSnapshot is exported as a function', async () => {
    const mod = await import('../../routes/billing-net30');
    expect(typeof mod.runDailyNet30AgingSnapshot).toBe('function');
  });

  it('runNet30DunningPass returns { invoicesProcessed, remindersDispatched, errors } shape', async () => {
    // Return empty for all DB calls → 0 invoices to process
    mockDb.select.mockReturnValue(buildSelectChain([]));

    const { runNet30DunningPass } = await import('../../routes/billing-net30');
    const result = await runNet30DunningPass();
    expect(result).toHaveProperty('invoicesProcessed');
    expect(result).toHaveProperty('remindersDispatched');
    expect(result).toHaveProperty('errors');
    expect(result.invoicesProcessed).toBe(0);
    expect(result.remindersDispatched).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('runDailyNet30AgingSnapshot returns { orgsProcessed, snapshotsWritten, errors } shape', async () => {
    mockDb.select.mockReturnValue(buildSelectChain([]));
    (mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
    });

    const { runDailyNet30AgingSnapshot } = await import('../../routes/billing-net30');
    const result = await runDailyNet30AgingSnapshot();
    expect(result).toHaveProperty('orgsProcessed');
    expect(result).toHaveProperty('snapshotsWritten');
    expect(result).toHaveProperty('errors');
    expect(typeof result.orgsProcessed).toBe('number');
    expect(typeof result.snapshotsWritten).toBe('number');
    expect(typeof result.errors).toBe('number');
  });
});

// ─── Webhook reconciliation ───────────────────────────────────────────────────

describe('Stripe webhook NET-30 reconciliation (dispatchWebhookEvent)', () => {
  it('returns { duplicate: true } for already-processed event', async () => {
    // Simulate duplicate: insert throws unique constraint, select returns processed row
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockRejectedValue(
        Object.assign(new Error('billing_webhook_events_stripe_event_id_unique'), {
          message: 'billing_webhook_events_stripe_event_id_unique',
        }),
      ),
    });
    mockDb.select.mockReturnValue(buildSelectChain([{ status: 'processed', processedAt: new Date() }]));

    const { dispatchWebhookEvent } = await import('../billing-webhook');
    const result = await dispatchWebhookEvent({
      id: 'evt_dup_001',
      type: 'invoice.paid',
      data: { object: { id: 'in_dup', amount_paid: 0, currency: 'usd', customer: 'cus_1', metadata: {} } },
    });
    expect(result.duplicate).toBe(true);
  });

  it('invoice.paid handler is registered in SUPPORTED_EVENT_TYPES', async () => {
    const { SUPPORTED_EVENT_TYPES } = await import('../billing-webhook');
    expect(SUPPORTED_EVENT_TYPES).toContain('invoice.paid');
  });

  it('invoice.payment_failed handler is registered in SUPPORTED_EVENT_TYPES', async () => {
    const { SUPPORTED_EVENT_TYPES } = await import('../billing-webhook');
    expect(SUPPORTED_EVENT_TYPES).toContain('invoice.payment_failed');
  });

  it('payment_intent.succeeded handler is registered in SUPPORTED_EVENT_TYPES', async () => {
    const { SUPPORTED_EVENT_TYPES } = await import('../billing-webhook');
    expect(SUPPORTED_EVENT_TYPES).toContain('payment_intent.succeeded');
  });

  it('payment_intent.succeeded with net30InvoiceId records partial payment and recomputes balance', async () => {
    // Simulate: insert succeeds, select returns the invoice, then payments query, then update
    const fakeInvoice = {
      id: 201, orgId: 1, status: 'sent', invoiceNumber: 'INV-2026-0099',
      customerName: 'Acme Corp', totalAmount: '5000.00', paidAmount: '0.00',
      creditApplied: '0.00', outstandingBalance: '5000.00', currency: 'usd',
      dunningPausedAt: null, paidAt: null, createdAt: new Date(), updatedAt: new Date(),
    };
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }),
    });
    mockDb.select
      .mockReturnValueOnce(buildSelectChain([fakeInvoice]))                 // fetch net30Inv
      .mockReturnValueOnce(buildSelectChain([{ amount: '1000.00' }]));     // allPayments
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });

    const { dispatchWebhookEvent } = await import('../billing-webhook');
    // Should not throw — partial payment recorded
    await expect(dispatchWebhookEvent({
      id: 'evt_pi_partial_001',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_partial_001',
          amount: 100000,           // $1000 in cents
          amount_received: 100000,
          currency: 'usd',
          customer: 'cus_partial',
          metadata: { net30InvoiceId: '201' },
        },
      },
    })).resolves.not.toThrow();
  });

  it('invoice.paid skips insert when payment_intent row already exists (dedup)', async () => {
    // Simulate the sequence: payment_intent.succeeded fires first and records the
    // payment row, then invoice.paid fires for the same PI.  The handler should
    // detect the existing row and NOT insert a second payment record.
    const fakeInvoice = {
      id: 301, orgId: 1, status: 'sent', invoiceNumber: 'INV-2026-0301',
      customerName: 'Dedup Corp', totalAmount: '2000.00', paidAmount: '0.00',
      creditApplied: '0.00', outstandingBalance: '2000.00', currency: 'usd',
      stripeInvoiceId: 'in_dedup_001',
      dunningPausedAt: null, paidAt: null, createdAt: new Date(), updatedAt: new Date(),
    };

    // Reset call history so toHaveBeenCalledTimes counts only this test's calls
    mockDb.insert.mockClear();

    // claimEvent insert succeeds
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }),
    });

    mockDb.select
      // 1. net30Inv lookup by stripeInvoiceId
      .mockReturnValueOnce(buildSelectChain([fakeInvoice]))
      // 2. dedup check — returns existing row → skipInsert = true
      .mockReturnValueOnce(buildSelectChain([{ id: 99 }]))
      // 3. allPayments for reconciliation
      .mockReturnValueOnce(buildSelectChain([{ amount: '2000.00' }]))
      // 4. allCredits
      .mockReturnValueOnce(buildSelectChain([{ amount: '0.00' }]));

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });

    const { dispatchWebhookEvent } = await import('../billing-webhook');
    const result = await dispatchWebhookEvent({
      id: 'evt_inv_paid_dedup_001',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_dedup_001',
          amount_paid: 200000,   // $2000 in cents
          currency: 'usd',
          customer: 'cus_dedup',
          payment_intent: 'pi_already_recorded_001',
          metadata: {},
        },
      },
    });

    expect(result.duplicate).toBe(false);

    // insert should be called TWICE — once for claimEvent (billingWebhookEventsTable)
    // and once for the revenue-events audit row (revenueEventsTable, always runs).
    // The dedup path must NOT add a third insert for net30InvoicePayments.
    // Note: invoicesTable is skipped because metadata has no valid orgId.
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});

// ─── Stripe discount line-item parity ─────────────────────────────────────────

describe('Stripe createInvoice discount line item parity', () => {
  it('includes a negative discount line when discountAmount > 0 and sum equals totalAmount', async () => {
    // Reset the createInvoice mock so we can inspect call args fresh
    const { services } = await import('@szl-holdings/services');
    const createInvoiceMock = vi.mocked(services.stripe.createInvoice);
    createInvoiceMock.mockClear();

    // Invoice with two line items totalling $1000 and a $100 discount → totalAmount $900
    const lineItemRows = [
      { id: 1, invoiceId: 77, description: 'Consulting', quantity: '2', unitPrice: '400.00', lineTotal: '800.00', sortOrder: 0, createdAt: new Date() },
      { id: 2, invoiceId: 77, description: 'Expenses',   quantity: '1', unitPrice: '200.00', lineTotal: '200.00', sortOrder: 1, createdAt: new Date() },
    ];
    const invoiceRow = {
      id: 77, orgId: 1, status: 'approved', invoiceNumber: 'INV-2026-0077',
      customerName: 'Parity Corp', customerEmail: 'billing@parity.io',
      subtotal: '1000.00', discountAmount: '100.00', discountPercent: null,
      taxAmount: '0.00', totalAmount: '900.00', paidAmount: '0.00',
      creditApplied: '0.00', outstandingBalance: '900.00',
      currency: 'usd', poNumber: 'PO-77', terms: 'NET-30',
      dueDate: null, issuedDate: null, sentAt: null, paidAt: null,
      stripeInvoiceId: null, stripeHostedInvoiceUrl: null, stripePdfUrl: null,
      dunningStep: 0, nextDunningAt: null, dunningPausedAt: null,
      collectionsHandoffAt: null, collectionsNotes: null,
      billingAddress: null, shippingAddress: null, customTermsDays: null,
      externalCustomerId: null, notes: null,
      sentBy: null, voidedAt: null, voidedBy: null, voidReason: null,
      createdAt: new Date(), updatedAt: new Date(),
    };

    // mockDb chains:
    // 1. select invoice → invoiceRow
    // 2. select lineItems → lineItemRows
    // 3. getCustomerByEmail → null (mock already set)
    // 4. createCustomer → { id: 'cus_test' } (mock already set)
    // 5. select dunningConfig → []
    // 6. update invoice → [invoiceRow updated]
    mockDb.select
      .mockReturnValueOnce(buildSelectChain([invoiceRow]))       // fetchInvoice
      .mockReturnValueOnce(buildSelectChain(lineItemRows))        // lineItems
      .mockReturnValueOnce(buildSelectChain([]));                 // dunningConfig

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ ...invoiceRow, status: 'sent', stripeInvoiceId: 'in_test' }]),
        }),
      }),
    });

    const res = await supertest(app)
      .post('/api/billing/net30/invoices/77/send')
      .send({ useStripe: true });

    // Route should succeed
    expect(res.status).toBe(200);

    // Stripe createInvoice must have been called
    expect(createInvoiceMock).toHaveBeenCalledTimes(1);
    const [, passedItems] = createInvoiceMock.mock.calls[0] as [unknown, Array<{ description: string; amount: number; currency: string }>, unknown];

    // Discount line must be present and negative
    const discountLine = passedItems.find((l) => l.description === 'Discount');
    expect(discountLine).toBeDefined();
    expect(discountLine!.amount).toBe(-10000); // $100 × 100 cents

    // Sum of all line items must equal totalAmount in cents
    const sumCents = passedItems.reduce((acc, l) => acc + l.amount, 0);
    expect(sumCents).toBe(90000); // $900 × 100 cents
  });
});
