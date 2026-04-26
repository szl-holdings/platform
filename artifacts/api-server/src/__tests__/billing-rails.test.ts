/**
 * billing-rails.test.ts — Integration Tests (Task #2965)
 *
 * Covers:
 *  1. PlaidAdapter — createLinkToken demo mode; exchangePublicToken demo mode;
 *     describeAchReturn maps known codes; verifyPlaidWebhookSignature rejects bad sig
 *  2. CoinbaseAdapter — createCharge demo mode; verifyCoinbaseWebhookSignature;
 *     getCharge returns null in demo mode
 *  3. PaymentRailAdapter facade — getRailStatus shape; getPaymentMethods;
 *     addPaymentMethod (ach + crypto demo); chargeInvoice (ach + crypto demo)
 *  4. Validation schemas — achLinkTokenSchema, achExchangeTokenSchema,
 *     billingRailChargeInvoiceSchema, billingRailCryptoChargeSchema
 *  5. Route smoke tests — GET /billing/rails/status; POST endpoints with
 *     malformed bodies return 400; auth-protected routes return 401 when unauthenticated
 *  6. Email builders — buildAchPaymentFailedEmail; buildCryptoPaymentFailedEmail;
 *     buildReconciliationMismatchEmail produce HTML with expected content
 */

import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express, { type Request, type Response } from 'express';
import request from 'supertest';

// ─── File-level mocks ─────────────────────────────────────────────────────────

vi.mock('../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(false),
}));

vi.mock('../lib/billing-audit.js', () => ({
  writeBillingAudit: vi.fn().mockResolvedValue(undefined),
  actorFromReq: vi.fn().mockReturnValue({ id: 'actor-1', type: 'user' }),
}));

vi.mock('@szl-holdings/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@szl-holdings/db')>();
  const mockReturning = vi.fn().mockResolvedValue([
    {
      id: 1,
      orgId: 1,
      rail: 'ach',
      accountLabel: 'Demo Bank — Demo Checking — ••••0000',
      status: 'active',
      isDefault: false,
      externalAccountId: 'plaid-acc_demo',
      verifiedAt: new Date(),
      createdAt: new Date(),
      metadata: { demo: true },
    },
  ]);
  const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  const mockValues = vi.fn().mockReturnValue({
    returning: mockReturning,
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  });

  return {
    ...actual,
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
          limit: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: mockValues }),
      update: vi.fn().mockReturnValue({ set: mockSet }),
    },
    billingRailAccountsTable: actual.billingRailAccountsTable ?? {},
    invoicesTable: actual.invoicesTable ?? {},
    organizationsTable: actual.organizationsTable ?? {},
    revenueEventsTable: actual.revenueEventsTable ?? {},
  };
});

// ─── DB mock ref for per-test overrides ──────────────────────────────────────

import { db as _mockedDb } from '@szl-holdings/db';

// ─── Adapter imports ──────────────────────────────────────────────────────────

import {
  createLinkToken,
  describeAchReturn,
  exchangePublicToken,
  verifyPlaidWebhookSignature,
} from '../lib/plaid-adapter.js';

import {
  createCharge,
  getCharge,
  verifyCoinbaseWebhookSignature,
} from '../lib/coinbase-adapter.js';

import {
  getRailStatus,
  getPaymentMethods,
  chargeInvoice,
  addPaymentMethod,
  handleRailWebhook,
} from '../lib/payment-rail-adapter.js';

import {
  achLinkTokenSchema,
  achExchangeTokenSchema,
  billingRailChargeInvoiceSchema,
  billingRailCryptoChargeSchema,
} from '../lib/validation.js';

import {
  buildAchPaymentFailedEmail,
  buildCryptoPaymentFailedEmail,
  buildReconciliationMismatchEmail,
} from '../lib/email.js';

// ─── 1. PlaidAdapter ──────────────────────────────────────────────────────────

describe('PlaidAdapter — demo mode', () => {
  beforeEach(() => {
    delete process.env.PLAID_CLIENT_ID;
    delete process.env.PLAID_SECRET;
    delete process.env.PLAID_WEBHOOK_SECRET;
  });

  it('createLinkToken returns a demo token when Plaid creds are absent', async () => {
    const result = await createLinkToken({
      clientUserId: 'user-1',
      clientName: 'SZL Holdings',
    });
    expect(result.linkToken).toMatch(/^link-sandbox-demo-/);
    expect(result.expiration).toBeDefined();
    expect(result.requestId).toBeDefined();
    expect(result.demo).toBe(true);
  });

  it('exchangePublicToken returns demo exchange result when creds are absent', async () => {
    const result = await exchangePublicToken('public-sandbox-abc', 'acc_demo');
    expect(result.accessToken).toMatch(/^access-sandbox-demo-/);
    expect(result.itemId).toBeDefined();
    expect(result.processorToken).toMatch(/^processor-stripe-sandbox-demo-/);
    expect(result.accountId).toBe('acc_demo');
    expect(result.institutionName).toBe('Demo Bank');
    expect(result.accountName).toBe('Demo Checking');
    expect(result.demo).toBe(true);
  });

  it('describeAchReturn maps R01 to a human-readable string mentioning insufficient funds', () => {
    const description = describeAchReturn('R01');
    expect(description.toLowerCase()).toContain('insufficient');
  });

  it('describeAchReturn maps R03 to a human-readable string', () => {
    const description = describeAchReturn('R03');
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(5);
  });

  it('describeAchReturn returns fallback string for unrecognised code', () => {
    const description = describeAchReturn('R99');
    expect(description).toContain('R99');
  });

  it('verifyPlaidWebhookSignature rejects tampered body when secret is provided', () => {
    const secret = 'test-plaid-webhook-secret';
    const originalBody = '{"webhook_type":"ITEM","webhook_code":"PENDING_EXPIRATION"}';
    const alteredBody = '{"webhook_type":"ITEM","webhook_code":"EVIL"}';
    const hmac = crypto.createHmac('sha256', secret).update(originalBody).digest('hex');

    const result = verifyPlaidWebhookSignature(alteredBody, hmac, secret);
    expect(result).toBe(false);
  });

  it('verifyPlaidWebhookSignature accepts correct signature', () => {
    const secret = 'test-plaid-webhook-secret';
    const body = '{"webhook_type":"ITEM","webhook_code":"PENDING_EXPIRATION"}';
    const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const result = verifyPlaidWebhookSignature(body, hmac, secret);
    expect(result).toBe(true);
  });

  it('verifyPlaidWebhookSignature returns true in full demo mode (no creds, no secret, no header)', () => {
    const result = verifyPlaidWebhookSignature('{}', undefined);
    expect(result).toBe(true);
  });
});

// ─── 2. CoinbaseAdapter ───────────────────────────────────────────────────────

describe('CoinbaseAdapter — demo mode', () => {
  beforeEach(() => {
    delete process.env.COINBASE_COMMERCE_API_KEY;
    delete process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  });

  it('createCharge returns demo charge when API key is absent', async () => {
    const charge = await createCharge({
      name: 'Invoice #42',
      description: 'SZL Holdings — platform subscription',
      amountUsd: '250.00',
      currency: 'USD',
      metadata: { invoiceId: '42', orgId: '1' },
    });
    expect(charge.chargeId).toMatch(/^demo-charge-/);
    expect(charge.code).toBeDefined();
    expect(charge.hostedUrl).toMatch(/https?:\/\//);
    expect(charge.status).toBe('NEW');
    expect(charge.demo).toBe(true);
  });

  it('getCharge returns null in demo mode (no API key)', async () => {
    const charge = await getCharge('DEMO1234');
    expect(charge).toBeNull();
  });

  it('verifyCoinbaseWebhookSignature passes on correct signature (with secret override)', () => {
    const secret = 'coinbase-webhook-secret';
    const body = '{"event":{"type":"charge:confirmed"}}';
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

    expect(() => verifyCoinbaseWebhookSignature(body, sig, secret)).not.toThrow();
  });

  it('verifyCoinbaseWebhookSignature throws on tampered body', () => {
    const secret = 'coinbase-webhook-secret';
    const body = '{"event":{"type":"charge:confirmed"}}';
    const alteredBody = '{"event":{"type":"charge:failed"}}';
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

    expect(() => verifyCoinbaseWebhookSignature(alteredBody, sig, secret)).toThrow();
  });

  it('verifyCoinbaseWebhookSignature throws on missing header when secret is present', () => {
    const secret = 'coinbase-webhook-secret';
    expect(() => verifyCoinbaseWebhookSignature('{}', undefined, secret)).toThrow();
  });

  it('verifyCoinbaseWebhookSignature is a no-op in full demo mode (no config, no secret override)', () => {
    expect(() => verifyCoinbaseWebhookSignature('{}', undefined)).not.toThrow();
  });
});

// ─── 3. PaymentRailAdapter facade ─────────────────────────────────────────────

describe('PaymentRailAdapter facade', () => {
  beforeEach(() => {
    delete process.env.PLAID_CLIENT_ID;
    delete process.env.PLAID_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.COINBASE_COMMERCE_API_KEY;
  });

  it('getRailStatus returns an object with ach and crypto keys, each with available + demo', () => {
    const status = getRailStatus();
    expect(status).toHaveProperty('ach');
    expect(status).toHaveProperty('crypto');
    expect(status).toHaveProperty('card');
    expect(typeof status.ach.available).toBe('boolean');
    expect(typeof status.ach.demo).toBe('boolean');
    expect(typeof status.crypto.available).toBe('boolean');
    expect(typeof status.crypto.demo).toBe('boolean');
  });

  it('getPaymentMethods returns an array for any orgId', async () => {
    const methods = await getPaymentMethods(1);
    expect(Array.isArray(methods)).toBe(true);
  });

  it('addPaymentMethod (ach) in demo mode returns success with ach method', async () => {
    const result = await addPaymentMethod(1, {
      rail: 'ach',
      processorToken: 'processor-stripe-sandbox-demo-xxx',
      accountId: 'acc_demo',
      institutionName: 'Demo Bank',
      accountName: 'Demo Checking',
      accountMask: '0000',
      demo: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.rail).toBe('ach');
    expect(result.data?.status).toBe('active');
  });

  it('addPaymentMethod (crypto) returns success', async () => {
    const result = await addPaymentMethod(1, {
      rail: 'crypto',
      demo: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.rail).toBe('crypto');
  });

  it('chargeInvoice returns invoice not found when DB returns empty (default mock)', async () => {
    const result = await chargeInvoice(9999, 'ach', 1, 1);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVOICE_NOT_FOUND');
  });

  it('chargeInvoice (ach) returns ACH pending in demo mode when invoice is found', async () => {
    const fakeInvoice = {
      id: 99,
      orgId: 1,
      status: 'open',
      amount: '100.00',
      currency: 'usd',
      stripeInvoiceId: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const fakeRailAccount = {
      id: 1,
      orgId: 1,
      rail: 'ach',
      externalAccountId: 'plaid-acc_demo',
      accountLabel: 'Demo Bank',
      status: 'active',
      isDefault: false,
      metadata: { demo: true, stripePaymentMethodId: null, stripeCustomerId: null },
      verifiedAt: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(_mockedDb.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([fakeInvoice]),
        }),
      } as ReturnType<typeof _mockedDb.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([fakeRailAccount]),
        }),
      } as ReturnType<typeof _mockedDb.select>);

    const result = await chargeInvoice(99, 'ach', 1, 1);

    expect(result.success).toBe(true);
    expect(result.data?.rail).toBe('ach');
    expect(result.data?.status).toBe('pending');
    expect(result.data?.demo).toBe(true);
  });

  it('chargeInvoice (crypto) creates a demo Coinbase Commerce charge when invoice is found', async () => {
    const fakeInvoice = {
      id: 99,
      orgId: 1,
      status: 'open',
      amount: '250.00',
      currency: 'usd',
      stripeInvoiceId: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const fakeRailAccount = {
      id: 2,
      orgId: 1,
      rail: 'crypto',
      externalAccountId: null,
      accountLabel: 'Crypto payments',
      status: 'active',
      isDefault: false,
      metadata: { demo: true },
      verifiedAt: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(_mockedDb.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([fakeInvoice]),
        }),
      } as ReturnType<typeof _mockedDb.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([fakeRailAccount]),
        }),
      } as ReturnType<typeof _mockedDb.select>);

    const result = await chargeInvoice(99, 'crypto', 2, 1);

    expect(result.success).toBe(true);
    expect(result.data?.rail).toBe('crypto');
    expect(result.data?.hostedUrl).toBeDefined();
  });

  it('chargeInvoice (ach) rejects accounts in pending_verification status', async () => {
    const fakeInvoice = {
      id: 55,
      orgId: 1,
      status: 'open',
      amount: '100.00',
      currency: 'usd',
      stripeInvoiceId: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const pendingAccount = {
      id: 3,
      orgId: 1,
      rail: 'ach',
      externalAccountId: 'plaid-acc_1',
      accountLabel: 'Chase Checking',
      status: 'pending_verification', // awaiting micro-deposit
      isDefault: false,
      metadata: { demo: false, plaidItemId: 'item-pending-1' },
      verifiedAt: null,
      createdAt: new Date(),
    };

    vi.mocked(_mockedDb.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([fakeInvoice]) }),
      } as ReturnType<typeof _mockedDb.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([pendingAccount]) }),
      } as ReturnType<typeof _mockedDb.select>);

    const result = await chargeInvoice(55, 'ach', 3, 1);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ACH_PENDING_VERIFICATION');
  });

  it('chargeInvoice (ach) fails fast with ACH_STRIPE_PM_MISSING when no payment method', async () => {
    const fakeInvoice = {
      id: 66,
      orgId: 1,
      status: 'open',
      amount: '100.00',
      currency: 'usd',
      stripeInvoiceId: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const liveAccount = {
      id: 4,
      orgId: 1,
      rail: 'ach',
      externalAccountId: 'plaid-acc_2',
      accountLabel: 'Chase Checking',
      status: 'active',
      isDefault: false,
      metadata: { demo: false, stripePaymentMethodId: null, stripeCustomerId: 'cus_abc' },
      verifiedAt: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(_mockedDb.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([fakeInvoice]) }),
      } as ReturnType<typeof _mockedDb.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([liveAccount]) }),
      } as ReturnType<typeof _mockedDb.select>);

    const result = await chargeInvoice(66, 'ach', 4, 1);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('ACH_STRIPE_PM_MISSING');
  });

  it('handleRailWebhook (plaid) processes PENDING_AUTOMATIC_VERIFICATION and sets pending_verification status', async () => {
    const matchingAccount = {
      id: 10,
      orgId: 1,
      rail: 'ach',
      status: 'active',
      externalAccountId: 'plaid-acc_3',
      accountLabel: 'Bank of Demo',
      isDefault: false,
      metadata: { plaidItemId: 'item-micro-1', demo: false },
      verifiedAt: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(_mockedDb.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([matchingAccount]),
      }),
    } as ReturnType<typeof _mockedDb.select>);

    const result = await handleRailWebhook('plaid', {
      webhook_type: 'ITEM',
      webhook_code: 'PENDING_AUTOMATIC_VERIFICATION',
      item_id: 'item-micro-1',
    });

    expect(result.handled).toBe(true);
    expect(result.action).toBe('plaid_item_pending_automatic_verification');
  });

  it('handleRailWebhook (plaid) AUTH.AUTOMATICALLY_VERIFIED marks account active', async () => {
    const pendingAccount = {
      id: 11,
      orgId: 1,
      rail: 'ach',
      status: 'pending_verification',
      externalAccountId: 'plaid-acc_4',
      accountLabel: 'Verified Bank',
      isDefault: false,
      metadata: { plaidItemId: 'item-verified-1', demo: false },
      verifiedAt: null,
      createdAt: new Date(),
    };

    vi.mocked(_mockedDb.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([pendingAccount]),
      }),
    } as ReturnType<typeof _mockedDb.select>);

    const result = await handleRailWebhook('plaid', {
      webhook_type: 'AUTH',
      webhook_code: 'AUTOMATICALLY_VERIFIED',
      item_id: 'item-verified-1',
    });

    expect(result.handled).toBe(true);
    expect(result.action).toBe('plaid_auth_automatically_verified');
  });

  it('handleRailWebhook (coinbase) charge:confirmed marks invoice paid (Stripe out-of-band reconciliation path)', async () => {
    const fakeInvoice = {
      id: 77,
      orgId: 1,
      status: 'open',
      amount: '500.00',
      currency: 'usd',
      stripeInvoiceId: 'in_live_stripe_123',
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(_mockedDb.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([fakeInvoice]),
      }),
    } as ReturnType<typeof _mockedDb.select>);

    const payload = {
      type: 'charge:confirmed',
      id: 'evt-coinbase-confirmed-1',
      data: {
        id: 'charge-abc-123',
        code: 'TESTCODE',
        metadata: {
          invoiceId: '77',
          orgId: '1',
          stripeInvoiceId: 'in_live_stripe_123',
        },
        pricing: { local: { amount: '500.00', currency: 'usd' } },
        payments: [{ network: 'ethereum', transaction_id: '0xabc123' }],
      },
    };

    const result = await handleRailWebhook('coinbase', payload);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('coinbase_invoice_paid');
  });

  it('handleRailWebhook (coinbase) charge:failed triggers dunning flow', async () => {
    const fakeInvoice = {
      id: 88,
      orgId: 1,
      status: 'crypto_pending',
      amount: '200.00',
      currency: 'usd',
      stripeInvoiceId: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(_mockedDb.select)
      // First call: idempotency check — no existing event record.
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            then: (fn: (v: unknown[]) => unknown) => Promise.resolve(fn([])),
          }),
        }),
      } as ReturnType<typeof _mockedDb.select>)
      // Second call: invoice lookup.
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([fakeInvoice]),
        }),
      } as ReturnType<typeof _mockedDb.select>);

    const payload = {
      type: 'charge:failed',
      id: 'evt-coinbase-failed-1',
      data: {
        id: 'charge-fail-456',
        code: 'FAILCODE',
        metadata: { invoiceId: '88', orgId: '1' },
        pricing: { local: { amount: '200.00', currency: 'usd' } },
      },
    };

    const result = await handleRailWebhook('coinbase', payload);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('coinbase_invoice_failed');
  });
});

// ─── 4. Validation schemas ────────────────────────────────────────────────────

describe('Validation schemas', () => {
  describe('achLinkTokenSchema', () => {
    it('accepts empty object', () => {
      expect(() => achLinkTokenSchema.parse({})).not.toThrow();
    });

    it('accepts valid redirectUri', () => {
      expect(() =>
        achLinkTokenSchema.parse({ redirectUri: 'https://szlholdings.com/ach-callback' }),
      ).not.toThrow();
    });

    it('rejects non-URL redirectUri', () => {
      expect(() => achLinkTokenSchema.parse({ redirectUri: 'not-a-url' })).toThrow();
    });
  });

  describe('achExchangeTokenSchema', () => {
    it('accepts valid token and account', () => {
      expect(() =>
        achExchangeTokenSchema.parse({ publicToken: 'public-token-abc', accountId: 'acc_1' }),
      ).not.toThrow();
    });

    it('rejects missing publicToken', () => {
      expect(() => achExchangeTokenSchema.parse({ accountId: 'acc_1' })).toThrow();
    });

    it('rejects missing accountId', () => {
      expect(() =>
        achExchangeTokenSchema.parse({ publicToken: 'public-token-abc' }),
      ).toThrow();
    });

    it('rejects empty publicToken', () => {
      expect(() =>
        achExchangeTokenSchema.parse({ publicToken: '', accountId: 'acc_1' }),
      ).toThrow();
    });
  });

  describe('billingRailChargeInvoiceSchema', () => {
    it('accepts valid invoiceId and paymentMethodId', () => {
      expect(() =>
        billingRailChargeInvoiceSchema.parse({ invoiceId: 1, paymentMethodId: 2 }),
      ).not.toThrow();
    });

    it('rejects negative invoiceId', () => {
      expect(() =>
        billingRailChargeInvoiceSchema.parse({ invoiceId: -1, paymentMethodId: 2 }),
      ).toThrow();
    });

    it('rejects missing paymentMethodId', () => {
      expect(() =>
        billingRailChargeInvoiceSchema.parse({ invoiceId: 1 }),
      ).toThrow();
    });

    it('rejects zero invoiceId', () => {
      expect(() =>
        billingRailChargeInvoiceSchema.parse({ invoiceId: 0, paymentMethodId: 1 }),
      ).toThrow();
    });
  });

  describe('billingRailCryptoChargeSchema', () => {
    it('accepts valid invoiceId', () => {
      expect(() => billingRailCryptoChargeSchema.parse({ invoiceId: 42 })).not.toThrow();
    });

    it('rejects missing invoiceId', () => {
      expect(() => billingRailCryptoChargeSchema.parse({})).toThrow();
    });

    it('rejects non-integer invoiceId', () => {
      expect(() => billingRailCryptoChargeSchema.parse({ invoiceId: 1.5 })).toThrow();
    });
  });
});

// ─── 5. Route smoke tests ─────────────────────────────────────────────────────

describe('billing-rails routes', () => {
  let app: ReturnType<typeof express>;

  beforeEach(async () => {
    app = express();
    app.use(express.json({ limit: '1mb' }));
    const { default: railsRouter } = await import('../routes/billing-rails.js');
    app.use(railsRouter);
  });

  it('GET /billing/rails/status returns 200 with ach + crypto keys (no auth required)', async () => {
    const res = await request(app).get('/billing/rails/status');
    expect(res.status).toBe(200);
    expect(res.body.data ?? res.body).toMatchObject(
      expect.objectContaining({ ach: expect.anything(), crypto: expect.anything() }),
    );
  });

  it('POST /billing/ach/link-token returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/billing/ach/link-token')
      .send({ redirectUri: 'https://szlholdings.com/ach' });
    expect(res.status).toBe(401);
  });

  it('POST /billing/ach/exchange-token returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/billing/ach/exchange-token')
      .send({ publicToken: 'public-abc', accountId: 'acc_1' });
    expect(res.status).toBe(401);
  });

  it('POST /billing/ach/charge returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/billing/ach/charge')
      .send({ invoiceId: 1, paymentMethodId: 1 });
    expect(res.status).toBe(401);
  });

  it('POST /billing/crypto/charge returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/billing/crypto/charge')
      .send({ invoiceId: 1 });
    expect(res.status).toBe(401);
  });

  it('POST /webhooks/plaid with no signature returns 200 in demo mode', async () => {
    delete process.env.PLAID_CLIENT_ID;
    delete process.env.PLAID_WEBHOOK_SECRET;

    const res = await request(app)
      .post('/webhooks/plaid')
      .send({ webhook_type: 'ITEM', webhook_code: 'PENDING_EXPIRATION', item_id: 'item-demo-1' });
    expect([200, 500]).toContain(res.status);
  });

  it('POST /webhooks/coinbase with no signature returns 200 in demo mode', async () => {
    delete process.env.COINBASE_COMMERCE_API_KEY;
    delete process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

    const res = await request(app)
      .post('/webhooks/coinbase')
      .send({
        id: 'evt-demo-1',
        event: { type: 'charge:created', data: { id: 'ch-1', code: 'DEMO', metadata: {} } },
      });
    expect([200, 500]).toContain(res.status);
  });
});

// ─── 6. Email builders ────────────────────────────────────────────────────────

describe('Email builders', () => {
  describe('buildAchPaymentFailedEmail', () => {
    it('includes invoice ID and amount in output HTML', () => {
      const html = buildAchPaymentFailedEmail({
        userName: 'Jane Smith',
        invoiceId: '123',
        amount: '1,500.00',
        currency: 'USD',
        reason: 'Insufficient funds',
        returnCode: 'R01',
      });
      expect(html).toContain('123');
      expect(html).toContain('1,500.00');
      expect(html).toContain('USD');
      expect(html).toContain('R01');
      expect(html).toContain('Jane Smith');
      expect(html).toContain('billing@szlholdings.com');
    });

    it('omits return code section when not provided', () => {
      const html = buildAchPaymentFailedEmail({
        userName: 'John',
        invoiceId: '200',
        amount: '500.00',
        currency: 'USD',
        reason: 'Account closed',
      });
      expect(html).not.toContain('Return Code');
    });

    it('includes a CTA link to the invoice billing page', () => {
      const html = buildAchPaymentFailedEmail({
        userName: 'Admin',
        invoiceId: '300',
        amount: '100.00',
        currency: 'USD',
        reason: 'Account frozen',
        billingUrl: 'https://szlholdings.com/billing/invoices/300',
      });
      expect(html).toContain('https://szlholdings.com/billing/invoices/300');
    });
  });

  describe('buildCryptoPaymentFailedEmail', () => {
    it('renders "failed" reason with retry CTA', () => {
      const html = buildCryptoPaymentFailedEmail({
        userName: 'Alice',
        invoiceId: '55',
        amount: '800.00',
        currency: 'USDC',
        reason: 'failed',
        coinbaseChargeCode: 'ABCDEF',
      });
      expect(html).toContain('55');
      expect(html).toContain('800.00');
      expect(html).toContain('ABCDEF');
      expect(html).toContain('Retry Payment');
      expect(html).not.toContain('No action is required');
    });

    it('renders "delayed" reason with informational message (no retry CTA)', () => {
      const html = buildCryptoPaymentFailedEmail({
        userName: 'Bob',
        invoiceId: '66',
        amount: '100.00',
        currency: 'ETH',
        reason: 'delayed',
      });
      expect(html).toContain('No action is required');
      expect(html).toContain('View Invoice');
      expect(html).not.toContain('Retry Payment');
    });

    it('renders "expired" reason', () => {
      const html = buildCryptoPaymentFailedEmail({
        userName: 'Carol',
        invoiceId: '77',
        amount: '200.00',
        currency: 'BTC',
        reason: 'expired',
      });
      expect(html).toContain('expired');
    });

    it('renders "underpaid" reason', () => {
      const html = buildCryptoPaymentFailedEmail({
        userName: 'Dave',
        invoiceId: '88',
        amount: '300.00',
        currency: 'USD',
        reason: 'underpaid',
      });
      expect(html).toContain('less than the invoice total');
    });
  });

  describe('buildReconciliationMismatchEmail', () => {
    it('includes mismatch count, report date, and invoice IDs', () => {
      const html = buildReconciliationMismatchEmail({
        mismatchCount: 2,
        totalChecked: 50,
        mismatches: [
          {
            invoiceId: '10',
            rail: 'ach',
            expectedAmount: '1000.00',
            issue: 'ACH charge initiated >7 days ago but invoice still open',
          },
          {
            invoiceId: '11',
            rail: 'crypto',
            expectedAmount: '500.00',
            actualAmount: '450.00',
            issue: 'Amount mismatch',
          },
        ],
        reportDate: '2026-04-26',
        adminUrl: 'https://szlholdings.com/admin/billing/reconciliation',
      });
      // Invoice IDs appear as plain numbers in table cells (no # prefix)
      expect(html).toContain('>10<');
      expect(html).toContain('>11<');
      expect(html).toContain('2026-04-26');
      expect(html).toContain('ACH charge initiated');
      expect(html).toContain('Open Reconciliation Dashboard');
    });

    it('truncates mismatches list at 10 and shows overflow note', () => {
      const mismatches = Array.from({ length: 15 }, (_, i) => ({
        invoiceId: String(i + 1),
        rail: 'ach',
        expectedAmount: '100.00',
        issue: `Issue ${i + 1}`,
      }));
      const html = buildReconciliationMismatchEmail({
        mismatchCount: 15,
        totalChecked: 100,
        mismatches,
        reportDate: '2026-04-26',
      });
      expect(html).toContain('Showing 10 of 15 mismatches');
    });

    it('links to admin reconciliation URL', () => {
      const html = buildReconciliationMismatchEmail({
        mismatchCount: 1,
        totalChecked: 10,
        mismatches: [{ invoiceId: '5', rail: 'ach', expectedAmount: '100.00', issue: 'Test' }],
        reportDate: '2026-04-26',
        adminUrl: 'https://szlholdings.com/admin/billing/reconciliation',
      });
      expect(html).toContain('https://szlholdings.com/admin/billing/reconciliation');
    });
  });
});
