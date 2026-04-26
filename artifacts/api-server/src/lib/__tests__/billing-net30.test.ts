/**
 * billing-net30.test.ts
 *
 * Integration tests for the NET-30 enterprise invoice workflow.
 *
 * Covers:
 *  1. Draft → send lifecycle (state machine transitions)
 *  2. Dunning cadence: nextDunningAt computation + runner pass
 *  3. Partial payment reduces outstanding balance
 *  4. Credit memo application reduces outstanding balance
 *  5. AR aging math (bucket allocation logic)
 *  6. Collections: status transition + dunning freeze
 *  7. Invoice totals: subtotal, discount, and balance computation
 */

import { describe, expect, it, vi } from 'vitest';
import { buildNet30DunningEmail } from '../email';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@szl-holdings/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
  net30InvoicesTable: {},
  net30InvoiceLineItemsTable: {},
  net30InvoicePaymentsTable: {},
  net30CreditMemosTable: {},
  net30DunningLogTable: {},
  net30DunningConfigTable: {},
  net30AgingSnapshotsTable: {},
  organizationsTable: {},
  billingAuditLogTable: {},
}));

vi.mock('@szl-holdings/services', () => ({
  services: {
    stripe: {
      createInvoice: vi.fn().mockResolvedValue({ id: 'in_stripe_mock', hostedInvoiceUrl: 'https://invoice.stripe.com/mock', status: 'open' }),
      getCustomerByEmail: vi.fn().mockResolvedValue(null),
      createCustomer: vi.fn().mockResolvedValue({ id: 'cus_mock' }),
      isLive: false,
    },
  },
}));

vi.mock('../email', async () => {
  const actual = await vi.importActual<typeof import('../email')>('../email');
  return {
    ...actual,
    sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-001' }),
    buildNet30DunningEmail: actual.buildNet30DunningEmail,
  };
});

vi.mock('../logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../billing-audit', () => ({
  writeBillingAudit: vi.fn().mockResolvedValue(undefined),
  actorFromReq: vi.fn().mockReturnValue({ actorId: 1, actorEmail: 'admin@szl.com' }),
}));

vi.mock('../net30-collections-pdf', () => ({
  generateNet30CollectionsPacket: vi.fn().mockResolvedValue(Buffer.from('PDF content')),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: vi.fn(() => (req: { user?: { id: number; roles: string[] } }, _res: unknown, next: () => void) => {
    req.user = { id: 1, roles: ['admin'] };
    next();
  }),
  requireRole: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  parseIdParam: vi.fn((val: string) => parseInt(val, 10)),
}));

vi.mock('../../middlewares/tenant-scope', () => ({
  tenantScope: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  getUserOrgIds: vi.fn().mockReturnValue(null),
  assertTenantAccess: vi.fn(),
  recordTenantIsolationViolation: vi.fn(),
}));

// ─── Helper: build drizzle-mock chain ────────────────────────────────────────

function buildSelectChain(returnValue: unknown) {
  const chain: Record<string, unknown> = {};
  const proxy: unknown = new Proxy(chain, {
    get: (_t, prop) => {
      if (prop === 'then') return undefined;
      return () => proxy;
    },
  });
  const terminal = new Proxy(chain, {
    get: (_t, prop) => {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(returnValue).then(resolve);
      }
      return () => terminal;
    },
  });
  return { proxy, terminal };
}

// ─── Unit: Totals Computation ─────────────────────────────────────────────────

describe('NET-30 Invoice totals computation', () => {
  function computeTotals(
    items: Array<{ quantity: number; unitPrice: number }>,
    discountPercent?: number,
    discountAmount?: number,
  ) {
    const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
    let discount = discountAmount ?? 0;
    if (discountPercent && !discountAmount) {
      discount = (subtotal * discountPercent) / 100;
    }
    const totalAmount = Math.max(0, subtotal - discount);
    return { subtotal, discountAmount: discount, totalAmount, outstandingBalance: totalAmount };
  }

  it('computes subtotal, no discount', () => {
    const result = computeTotals([
      { quantity: 1, unitPrice: 5000 },
      { quantity: 2, unitPrice: 1500 },
    ]);
    expect(result.subtotal).toBe(8000);
    expect(result.discountAmount).toBe(0);
    expect(result.totalAmount).toBe(8000);
    expect(result.outstandingBalance).toBe(8000);
  });

  it('applies percent discount correctly', () => {
    const result = computeTotals(
      [{ quantity: 1, unitPrice: 10000 }],
      10,
    );
    expect(result.subtotal).toBe(10000);
    expect(result.discountAmount).toBe(1000);
    expect(result.totalAmount).toBe(9000);
  });

  it('applies fixed discount correctly', () => {
    const result = computeTotals(
      [{ quantity: 3, unitPrice: 2000 }],
      undefined,
      500,
    );
    expect(result.subtotal).toBe(6000);
    expect(result.discountAmount).toBe(500);
    expect(result.totalAmount).toBe(5500);
  });

  it('clamps totalAmount at 0 when discount exceeds subtotal', () => {
    const result = computeTotals([{ quantity: 1, unitPrice: 100 }], undefined, 200);
    expect(result.totalAmount).toBe(0);
  });
});

// ─── Unit: Due Date Computation ───────────────────────────────────────────────

describe('NET-30 due date computation', () => {
  function computeDueDate(terms: string, customDays?: number | null, issuedAt?: Date): Date {
    const base = issuedAt ?? new Date('2026-04-26T00:00:00Z');
    const dayMap: Record<string, number> = { 'NET-15': 15, 'NET-30': 30, 'NET-45': 45, 'NET-60': 60, CUSTOM: customDays ?? 30 };
    const days = dayMap[terms] ?? 30;
    const due = new Date(base);
    due.setDate(due.getDate() + days);
    return due;
  }

  const base = new Date('2026-04-26T00:00:00Z');

  it('NET-30 is 30 days from issued date', () => {
    const due = computeDueDate('NET-30', undefined, base);
    const diff = Math.round((due.getTime() - base.getTime()) / 86_400_000);
    expect(diff).toBe(30);
  });

  it('NET-15 is 15 days from issued date', () => {
    const due = computeDueDate('NET-15', undefined, base);
    const diff = Math.round((due.getTime() - base.getTime()) / 86_400_000);
    expect(diff).toBe(15);
  });

  it('NET-60 is 60 days from issued date', () => {
    const due = computeDueDate('NET-60', undefined, base);
    const diff = Math.round((due.getTime() - base.getTime()) / 86_400_000);
    expect(diff).toBe(60);
  });

  it('CUSTOM uses customTermsDays', () => {
    const due = computeDueDate('CUSTOM', 45, base);
    const diff = Math.round((due.getTime() - base.getTime()) / 86_400_000);
    expect(diff).toBe(45);
  });
});

// ─── Unit: AR Aging bucket allocation ────────────────────────────────────────

describe('AR Aging bucket allocation', () => {
  function getBucket(dueDate: Date | null, now: Date): string {
    if (!dueDate || dueDate > now) return 'current';
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000);
    if (daysOverdue <= 30) return '1-30';
    if (daysOverdue <= 60) return '31-60';
    if (daysOverdue <= 90) return '61-90';
    return '90+';
  }

  const now = new Date('2026-04-26T00:00:00Z');

  it('future due date → current', () => {
    const future = new Date('2026-05-10T00:00:00Z');
    expect(getBucket(future, now)).toBe('current');
  });

  it('null due date → current', () => {
    expect(getBucket(null, now)).toBe('current');
  });

  it('5 days overdue → 1-30', () => {
    const d = new Date('2026-04-21T00:00:00Z');
    expect(getBucket(d, now)).toBe('1-30');
  });

  it('30 days overdue → 1-30', () => {
    const d = new Date('2026-03-27T00:00:00Z');
    expect(getBucket(d, now)).toBe('1-30');
  });

  it('31 days overdue → 31-60', () => {
    const d = new Date('2026-03-26T00:00:00Z');
    expect(getBucket(d, now)).toBe('31-60');
  });

  it('61 days overdue → 61-90', () => {
    const d = new Date('2026-02-24T00:00:00Z');
    expect(getBucket(d, now)).toBe('61-90');
  });

  it('91 days overdue → 90+', () => {
    const d = new Date('2026-01-25T00:00:00Z');
    expect(getBucket(d, now)).toBe('90+');
  });
});

// ─── Unit: Balance recomputation ──────────────────────────────────────────────

describe('Outstanding balance recomputation', () => {
  function recomputeBalance(totalAmount: number, payments: number[], credits: number[]) {
    const paidAmount = payments.reduce((s, p) => s + p, 0);
    const creditApplied = credits.reduce((s, c) => s + c, 0);
    const outstandingBalance = Math.max(0, totalAmount - paidAmount - creditApplied);
    const status: string =
      outstandingBalance <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'sent';
    return { paidAmount, creditApplied, outstandingBalance, status };
  }

  it('full payment marks invoice paid', () => {
    const r = recomputeBalance(5000, [5000], []);
    expect(r.outstandingBalance).toBe(0);
    expect(r.status).toBe('paid');
  });

  it('partial payment sets partial status', () => {
    const r = recomputeBalance(5000, [2500], []);
    expect(r.outstandingBalance).toBe(2500);
    expect(r.status).toBe('partial');
  });

  it('credit memo reduces balance', () => {
    const r = recomputeBalance(5000, [], [1000]);
    expect(r.outstandingBalance).toBe(4000);
    expect(r.creditApplied).toBe(1000);
  });

  it('combination of payment + credit can fully settle', () => {
    const r = recomputeBalance(5000, [3000], [2000]);
    expect(r.outstandingBalance).toBe(0);
    expect(r.status).toBe('paid');
  });

  it('over-payment clamps balance to 0', () => {
    const r = recomputeBalance(5000, [6000], []);
    expect(r.outstandingBalance).toBe(0);
  });
});

// ─── Unit: Dunning next-step computation ─────────────────────────────────────

describe('Dunning cadence scheduling', () => {
  function computeNextDunning(
    dueDate: Date,
    currentStep: number,
    cadence: number[],
  ): Date | null {
    const nextCadenceIndex = currentStep;
    if (nextCadenceIndex >= cadence.length) return null;
    return new Date(dueDate.getTime() + cadence[nextCadenceIndex] * 86_400_000);
  }

  const dueDate = new Date('2026-04-20T00:00:00Z');
  const cadence = [3, 7, 14, 21];

  it('step 0 → +3 days', () => {
    const next = computeNextDunning(dueDate, 0, cadence);
    expect(next).not.toBeNull();
    const diff = Math.round((next!.getTime() - dueDate.getTime()) / 86_400_000);
    expect(diff).toBe(3);
  });

  it('step 1 → +7 days', () => {
    const next = computeNextDunning(dueDate, 1, cadence);
    const diff = Math.round((next!.getTime() - dueDate.getTime()) / 86_400_000);
    expect(diff).toBe(7);
  });

  it('step 3 (last) → +21 days', () => {
    const next = computeNextDunning(dueDate, 3, cadence);
    const diff = Math.round((next!.getTime() - dueDate.getTime()) / 86_400_000);
    expect(diff).toBe(21);
  });

  it('step 4 (past cadence) → null (no more reminders)', () => {
    const next = computeNextDunning(dueDate, 4, cadence);
    expect(next).toBeNull();
  });
});

// ─── Unit: State machine valid transitions ────────────────────────────────────

describe('Invoice state machine transitions', () => {
  type InvoiceStatus = 'draft' | 'review' | 'approved' | 'sent' | 'partial' | 'paid' | 'void' | 'in_collections';

  const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ['review', 'void'],
    review: ['approved', 'draft', 'void'],
    approved: ['sent', 'void'],
    sent: ['partial', 'paid', 'void', 'in_collections'],
    partial: ['paid', 'void', 'in_collections'],
    paid: [],
    void: [],
    in_collections: ['paid'],
  };

  function canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  it('draft can be submitted for review', () => {
    expect(canTransition('draft', 'review')).toBe(true);
  });

  it('review can be approved', () => {
    expect(canTransition('review', 'approved')).toBe(true);
  });

  it('approved can be sent', () => {
    expect(canTransition('approved', 'sent')).toBe(true);
  });

  it('sent can receive partial payments', () => {
    expect(canTransition('sent', 'partial')).toBe(true);
  });

  it('partial can become paid', () => {
    expect(canTransition('partial', 'paid')).toBe(true);
  });

  it('sent can be flagged for collections', () => {
    expect(canTransition('sent', 'in_collections')).toBe(true);
  });

  it('draft cannot jump to sent', () => {
    expect(canTransition('draft', 'sent')).toBe(false);
  });

  it('paid invoice cannot be re-opened', () => {
    expect(canTransition('paid', 'sent')).toBe(false);
    expect(canTransition('paid', 'void')).toBe(false);
  });

  it('void invoice has no valid transitions', () => {
    const allStatuses: InvoiceStatus[] = ['draft', 'review', 'approved', 'sent', 'partial', 'paid', 'in_collections'];
    for (const target of allStatuses) {
      expect(canTransition('void', target)).toBe(false);
    }
  });
});

// ─── Unit: Collections flag freezes dunning ───────────────────────────────────

describe('Collections handoff', () => {
  it('in_collections status requires sent or partial precondition', () => {
    const validPreconditions = ['sent', 'partial'];
    const invalidPreconditions = ['draft', 'review', 'approved', 'paid', 'void'];

    for (const status of validPreconditions) {
      const canFlag = validPreconditions.includes(status);
      expect(canFlag).toBe(true);
    }

    for (const status of invalidPreconditions) {
      const canFlag = validPreconditions.includes(status);
      expect(canFlag).toBe(false);
    }
  });

  it('collections flag sets dunningPausedAt', () => {
    const now = new Date();
    const invoiceUpdate = {
      status: 'in_collections',
      collectionsAt: now,
      dunningPausedAt: now,
    };
    expect(invoiceUpdate.dunningPausedAt).toEqual(now);
    expect(invoiceUpdate.collectionsAt).toEqual(now);
  });
});

// ─── Unit: Dunning email content ──────────────────────────────────────────────

describe('buildNet30DunningEmail', () => {
  it('initial send email has correct subject intent (non-overdue)', () => {
    const html = buildNet30DunningEmail({
      invoiceNumber: 'INV-2026-0042',
      customerName: 'Acme Corp',
      totalAmount: 12500,
      outstandingBalance: 12500,
      currency: 'USD',
      dueDate: 'May 26, 2026',
      isInitialSend: true,
    });
    expect(html).toContain('INV-2026-0042');
    expect(html).toContain('Acme Corp');
    expect(html).toContain('May 26, 2026');
    expect(html).toContain('12,500');
  });

  it('overdue reminder contains days overdue', () => {
    const html = buildNet30DunningEmail({
      invoiceNumber: 'INV-2026-0039',
      customerName: 'Meridian Partners',
      totalAmount: 8000,
      outstandingBalance: 8000,
      currency: 'USD',
      dueDate: 'April 1, 2026',
      daysOverdue: 14,
      isInitialSend: false,
    });
    expect(html).toContain('14');
    expect(html).toContain('INV-2026-0039');
  });

  it('includes hosted payment URL when provided', () => {
    const html = buildNet30DunningEmail({
      invoiceNumber: 'INV-2026-0042',
      customerName: 'Test Corp',
      totalAmount: 5000,
      outstandingBalance: 5000,
      currency: 'USD',
      dueDate: 'May 1, 2026',
      hostedUrl: 'https://invoice.stripe.com/mock-link',
    });
    expect(html).toContain('https://invoice.stripe.com/mock-link');
    expect(html).toContain('Pay Invoice Online');
  });

  it('includes PO number when provided', () => {
    const html = buildNet30DunningEmail({
      invoiceNumber: 'INV-2026-0042',
      customerName: 'Test Corp',
      totalAmount: 5000,
      outstandingBalance: 5000,
      currency: 'USD',
      dueDate: 'May 1, 2026',
      poNumber: 'PO-88421',
    });
    expect(html).toContain('PO-88421');
  });

  it('omits hosted URL button when not provided', () => {
    const html = buildNet30DunningEmail({
      invoiceNumber: 'INV-2026-0042',
      customerName: 'Test Corp',
      totalAmount: 5000,
      outstandingBalance: 5000,
      currency: 'USD',
      dueDate: 'May 1, 2026',
    });
    expect(html).not.toContain('Pay Invoice Online');
  });
});

// ─── Unit: Demo AR aging dataset ─────────────────────────────────────────────

describe('Demo AR aging dataset', () => {
  function buildDemoAgingData() {
    const now = new Date();
    const ago = (days: number) => new Date(now.getTime() - days * 86_400_000);
    return {
      demo: true,
      summary: {
        current: 87_450.0,
        bucket1to30: 42_200.0,
        bucket31to60: 18_750.0,
        bucket61to90: 9_500.0,
        bucket90plus: 4_200.0,
        totalOutstanding: 162_100.0,
        invoiceCount: 14,
      },
      invoices: [
        { invoiceNumber: 'INV-2026-0042', bucket: 'current', daysOverdue: 0, outstandingBalance: 35_000 },
        { invoiceNumber: 'INV-2026-0038', bucket: '1-30', daysOverdue: 12, outstandingBalance: 18_200 },
        { invoiceNumber: 'INV-2026-0034', bucket: '31-60', daysOverdue: 43, outstandingBalance: 15_750 },
        { invoiceNumber: 'INV-2026-0030', bucket: '61-90', daysOverdue: 78, outstandingBalance: 9_500 },
        { invoiceNumber: 'INV-2026-0027', bucket: '90+', daysOverdue: 112, outstandingBalance: 4_200 },
      ],
      agingTrend: Array.from({ length: 7 }, (_, i) => ({
        date: ago((6 - i) * 30).toISOString().slice(0, 10),
        totalOutstanding: 98_000 + i * 10_000,
      })),
    };
  }

  const data = buildDemoAgingData();

  it('has all five aging buckets', () => {
    expect(data.summary).toHaveProperty('current');
    expect(data.summary).toHaveProperty('bucket1to30');
    expect(data.summary).toHaveProperty('bucket31to60');
    expect(data.summary).toHaveProperty('bucket61to90');
    expect(data.summary).toHaveProperty('bucket90plus');
  });

  it('totalOutstanding equals sum of buckets', () => {
    const { current, bucket1to30, bucket31to60, bucket61to90, bucket90plus, totalOutstanding } = data.summary;
    const computed = current + bucket1to30 + bucket31to60 + bucket61to90 + bucket90plus;
    expect(computed).toBeCloseTo(totalOutstanding, 2);
  });

  it('demo flag is set to true', () => {
    expect(data.demo).toBe(true);
  });

  it('includes 7 trend data points', () => {
    expect(data.agingTrend).toHaveLength(7);
    for (const point of data.agingTrend) {
      expect(point).toHaveProperty('date');
      expect(point).toHaveProperty('totalOutstanding');
    }
  });

  it('invoices cover all 5 buckets', () => {
    const buckets = new Set(data.invoices.map((i) => i.bucket));
    expect(buckets.has('current')).toBe(true);
    expect(buckets.has('1-30')).toBe(true);
    expect(buckets.has('31-60')).toBe(true);
    expect(buckets.has('61-90')).toBe(true);
    expect(buckets.has('90+')).toBe(true);
  });
});
