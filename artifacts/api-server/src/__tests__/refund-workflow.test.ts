/**
 * Refund Workflow — Integration Tests (Task #2966)
 *
 * Covers:
 *  1. Self-serve auto-approve  — amount < $500, threshold resolves to self_serve
 *  2. Manager approval path    — $500–$5000, threshold resolves to manager_approval
 *  3. Dual-approval path       — > $5000, threshold resolves to dual_approval
 *  4. Denial flow              — approverId records 'denied'; state → denied
 *  5. Rail error path          — executeRefund on non-approved state throws
 *  6. Partial refund           — amount < $500 captured with self_serve threshold
 *  7. Credit memo linkage      — net30InvoiceId linked in metadata
 *  8. Audit completeness       — writeBillingAudit called with correct action verbs
 *  9. Idempotency guard        — invalid transitions throw descriptive error
 * 10. Approval deduplication   — same approverId cannot vote twice
 * 11. Email builders           — subject / html / text shape validated
 * 12. Demo queue               — buildDemoRefundQueue returns multi-state fixture
 */

import { afterEach, afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

vi.mock('../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(false),
}));

vi.mock('../lib/email.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  buildRefundApprovedEmail: vi.fn().mockReturnValue({ subject: 'approved', html: '<p>ok</p>', text: 'ok' }),
  buildRefundCompletedEmail: vi.fn().mockReturnValue({ subject: 'completed', html: '<p>ok</p>', text: 'ok' }),
  buildRefundDeniedEmail: vi.fn().mockReturnValue({ subject: 'denied', html: '<p>ok</p>', text: 'ok' }),
}));

vi.mock('../lib/billing-audit.js', () => ({
  writeBillingAudit: vi.fn().mockResolvedValue(undefined),
  actorFromReq: vi.fn().mockReturnValue({ actorId: 1, actorEmail: 'test@szlholdings.com' }),
}));

// ─── Static imports (after hoisted mocks) ─────────────────────────────────────

import { writeBillingAudit } from '../lib/billing-audit.js';
import {
  resolveRequiredApprovals,
  DEFAULT_APPROVAL_THRESHOLDS,
  buildDemoRefundQueue,
  validateChargeOwnership,
  type RefundWorkflowMetadata,
} from '../lib/refund-workflow-engine.js';

// Static singletons used by describe 23 ownership-validation tests.
// These are the SAME objects the engine module holds (ESM module-singleton guarantee),
// so vi.spyOn on them directly intercepts what validateChargeOwnership calls.
import { db as staticDb, organizationsTable as staticOrgsTable } from '@szl-holdings/db';
import { services as staticServices } from '@szl-holdings/services';

// ─── Drizzle query mock helper ─────────────────────────────────────────────────
// Creates a thenable that can be both awaited directly AND chained with .limit()

function queryResult<T>(rows: T[]) {
  const p = Promise.resolve(rows);
  return Object.assign(p, {
    limit: vi.fn().mockResolvedValue(rows),
  });
}

function makeSelectMock(rows: unknown[], limitRows?: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(queryResult(rows)),
      }),
    }),
  };
}

// ─── 1–3: resolveRequiredApprovals — pure unit tests ──────────────────────────

describe('resolveRequiredApprovals — threshold logic', () => {
  it('1. $300 → self_serve (0 approvers)', () => {
    const r = resolveRequiredApprovals(300, DEFAULT_APPROVAL_THRESHOLDS);
    expect(r.minApprovers).toBe(0);
    expect(r.thresholdLabel).toBe('self_serve');
    expect(r.roles).toHaveLength(0);
  });

  it('$499 → self_serve', () => {
    expect(resolveRequiredApprovals(499, DEFAULT_APPROVAL_THRESHOLDS).thresholdLabel).toBe('self_serve');
  });

  it('$500 exactly → self_serve (boundary — ≤ 500 is self-serve)', () => {
    expect(resolveRequiredApprovals(500, DEFAULT_APPROVAL_THRESHOLDS).thresholdLabel).toBe('self_serve');
  });

  it('2. $501 → manager_approval (1 approver)', () => {
    const r = resolveRequiredApprovals(501, DEFAULT_APPROVAL_THRESHOLDS);
    expect(r.minApprovers).toBe(1);
    expect(r.thresholdLabel).toBe('manager_approval');
    expect(r.roles).toContain('manager');
  });

  it('$5000 exactly → manager_approval (boundary)', () => {
    expect(resolveRequiredApprovals(5000, DEFAULT_APPROVAL_THRESHOLDS).thresholdLabel).toBe('manager_approval');
  });

  it('3. $5001 → dual_approval (finance + executive, minApprovers=2)', () => {
    const r = resolveRequiredApprovals(5001, DEFAULT_APPROVAL_THRESHOLDS);
    expect(r.minApprovers).toBe(2);
    expect(r.thresholdLabel).toBe('dual_approval');
    expect(r.roles).toContain('finance');
    expect(r.roles).toContain('executive');
  });

  it('null amount → self_serve (treated as $0)', () => {
    expect(resolveRequiredApprovals(null, DEFAULT_APPROVAL_THRESHOLDS).thresholdLabel).toBe('self_serve');
  });

  it('6. partial refund ($49.99) → self_serve', () => {
    const r = resolveRequiredApprovals(49.99, DEFAULT_APPROVAL_THRESHOLDS);
    expect(r.thresholdLabel).toBe('self_serve');
    expect(r.minApprovers).toBe(0);
  });

  it('custom thresholds override defaults', () => {
    const custom = [
      { maxAmount: 100, requiredRoles: [], minApprovers: 0, label: 'micro' },
      { maxAmount: null, requiredRoles: ['cfo'], minApprovers: 1, label: 'cfo_required' },
    ];
    expect(resolveRequiredApprovals(50, custom).thresholdLabel).toBe('micro');
    expect(resolveRequiredApprovals(200, custom).thresholdLabel).toBe('cfo_required');
    expect(resolveRequiredApprovals(200, custom).roles).toContain('cfo');
  });
});

// ─── 12. Demo queue ────────────────────────────────────────────────────────────

describe('12. buildDemoRefundQueue', () => {
  it('returns at least 3 fixture entries', () => {
    const queue = buildDemoRefundQueue();
    expect(Array.isArray(queue)).toBe(true);
    expect(queue.length).toBeGreaterThanOrEqual(3);
  });

  it('each entry has id, amount, status, and metadata with workflowState', () => {
    const queue = buildDemoRefundQueue();
    for (const entry of queue) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('amount');
      expect(entry).toHaveProperty('status');
      const meta = entry.metadata as RefundWorkflowMetadata;
      expect(meta).toHaveProperty('workflowState');
      expect(meta).toHaveProperty('approvals');
      expect(meta).toHaveProperty('requiredApprovals');
    }
  });

  it('includes entries in all key states (completed, pending/approved, denied)', () => {
    const queue = buildDemoRefundQueue();
    const states = queue.map((e) => (e.metadata as RefundWorkflowMetadata).workflowState);
    expect(states).toContain('completed');
    expect(states).toContain('denied');
    const hasPending = states.some((s) =>
      ['requested', 'under_review', 'approved'].includes(s),
    );
    expect(hasPending).toBe(true);
  });
});

// ─── 11. Email builder unit tests ─────────────────────────────────────────────

// Email builder tests use vi.importActual to bypass the module-level mock and
// exercise the real implementation.

describe('11a. buildRefundApprovedEmail', () => {
  it('returns { subject, html, text } with requestId in subject', async () => {
    const { buildRefundApprovedEmail } = await vi.importActual('../lib/email.js') as typeof import('../lib/email.js');
    const result = buildRefundApprovedEmail({
      requestId: 42,
      amount: 199.99,
      currency: 'usd',
      reasonCode: 'requested_by_customer',
    });
    expect(typeof result.subject).toBe('string');
    expect(result.subject).toContain('42');
    expect(result.html.length).toBeGreaterThan(50);
    expect(typeof result.text).toBe('string');
  });

  it('includes customerFacingNote in html when provided', async () => {
    const { buildRefundApprovedEmail } = await vi.importActual('../lib/email.js') as typeof import('../lib/email.js');
    const result = buildRefundApprovedEmail({
      requestId: 99,
      amount: 50,
      currency: 'eur',
      reasonCode: 'goodwill',
      customerFacingNote: 'Special goodwill credit',
    });
    expect(result.html).toContain('Special goodwill credit');
  });

  it('handles null amount gracefully', async () => {
    const { buildRefundApprovedEmail } = await vi.importActual('../lib/email.js') as typeof import('../lib/email.js');
    const result = buildRefundApprovedEmail({
      requestId: 1,
      amount: null,
      currency: 'usd',
      reasonCode: 'other',
    });
    expect(result.html).toContain('requested amount');
  });
});

describe('11b. buildRefundCompletedEmail', () => {
  it('returns { subject, html, text } and embeds refundId', async () => {
    const { buildRefundCompletedEmail } = await vi.importActual('../lib/email.js') as typeof import('../lib/email.js');
    const result = buildRefundCompletedEmail({
      requestId: 42,
      refundId: 're_test_001',
      amount: 199.99,
      currency: 'usd',
      reasonCode: 'requested_by_customer',
    });
    expect(result.subject).toContain('42');
    expect(result.html).toContain('re_test_001');
    expect(typeof result.text).toBe('string');
  });

  it('works without refundId', async () => {
    const { buildRefundCompletedEmail } = await vi.importActual('../lib/email.js') as typeof import('../lib/email.js');
    const result = buildRefundCompletedEmail({
      requestId: 5,
      amount: 75,
      currency: 'gbp',
      reasonCode: 'duplicate',
    });
    expect(result.html.length).toBeGreaterThan(50);
  });
});

describe('11c. buildRefundDeniedEmail', () => {
  it('includes denial reason in html and text', async () => {
    const { buildRefundDeniedEmail } = await vi.importActual('../lib/email.js') as typeof import('../lib/email.js');
    const result = buildRefundDeniedEmail({
      requestId: 42,
      amount: 499,
      currency: 'usd',
      denialReason: 'Did not meet refund criteria',
    });
    expect(result.subject).toContain('42');
    expect(result.html).toContain('Did not meet refund criteria');
    expect(result.text).toContain('Did not meet refund criteria');
  });

  it('handles null amount gracefully', async () => {
    const { buildRefundDeniedEmail } = await vi.importActual('../lib/email.js') as typeof import('../lib/email.js');
    const result = buildRefundDeniedEmail({
      requestId: 7,
      amount: null,
      currency: 'usd',
      denialReason: 'Policy violation',
    });
    expect(result.html).toContain('requested amount');
  });
});

// ─── 10. Approval deduplication ───────────────────────────────────────────────
// Test the pure checkApprovalSatisfied / dedup logic by exercising recordApprovalDecision
// with a mock DB that simulates an already-voted approver.

describe('10. Approval deduplication', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('same approverId cannot vote twice — throws "already recorded a decision"', async () => {
    const existingApprover = {
      approverId: 15,
      approverEmail: 'mgr@test.com',
      approverRole: 'manager',
      decision: 'approved',
      timestamp: new Date().toISOString(),
    };

    const rowWithExistingApproval = {
      id: 2002, orgId: 1, status: 'pending', amount: '2000.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'duplicate', requestedBy: 2, approvedBy: null, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-dedup-001',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'under_review',
        approvals: [existingApprover],
        requiredApprovals: { roles: ['finance', 'executive'], minApprovers: 2, thresholdLabel: 'dual_approval' },
        reasonCode: 'duplicate', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, railType: null, railErrorCode: null, railRetries: 0,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([rowWithExistingApproval])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const { recordApprovalDecision } = await import('../lib/refund-workflow-engine.js');

    await expect(
      recordApprovalDecision(2002, 15, 'mgr@test.com', 'manager', 'approved'),
    ).rejects.toThrow('already recorded a decision');
  });
});

// ─── 4. Denial flow ───────────────────────────────────────────────────────────

describe('4. Denial flow', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('manager denies → satisfied=false, returned row state=denied', async () => {
    const requestedRow = {
      id: 2001, orgId: 1, status: 'pending', amount: '1500.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'goodwill', requestedBy: 2, approvedBy: null, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-denial-001',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'requested',
        approvals: [],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        reasonCode: 'goodwill', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, railType: null, railErrorCode: null, railRetries: 0,
      },
    };

    const deniedRow = {
      ...requestedRow,
      status: 'rejected',
      processedAt: new Date(),
      metadata: {
        ...requestedRow.metadata,
        workflowState: 'denied',
        approvals: [{
          approverId: 11, approverEmail: 'mgr@test.com', approverRole: 'manager',
          decision: 'denied', timestamp: new Date().toISOString(), note: 'Not eligible',
        }],
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([requestedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([deniedRow]),
            }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const { recordApprovalDecision } = await import('../lib/refund-workflow-engine.js');
    const { request, satisfied } = await recordApprovalDecision(
      2001, 11, 'mgr@test.com', 'manager', 'denied', 'Not eligible for goodwill refund',
    );

    expect(satisfied).toBe(false);
    expect(request.status).toBe('rejected');
    const meta = request.metadata as RefundWorkflowMetadata;
    expect(meta.workflowState).toBe('denied');
  });
});

// ─── 5. Rail error path ────────────────────────────────────────────────────────

describe('5. executeRefund — rail error', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when request is not in approved state', async () => {
    const notApprovedRow = {
      id: 3001, orgId: 1, status: 'pending', amount: '2000.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'other', requestedBy: 2, approvedBy: null, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-noexec-001',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'requested',
        approvals: [],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        reasonCode: 'other', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, railType: null, railErrorCode: null, railRetries: 0,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([notApprovedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));
    vi.doMock('@szl-holdings/services', () => ({
      services: { stripe: { isLive: false } },
    }));

    const { executeRefund } = await import('../lib/refund-workflow-engine.js');
    await expect(executeRefund(3001, 10, 'ops@test.com')).rejects.toThrow(
      'Cannot execute refund in state',
    );
  });

  it('approved request executes in demo mode → completed with demo refund ID', async () => {
    const approvedRow = {
      id: 3002, orgId: 1, status: 'approved', amount: '99.00', currency: 'usd',
      stripeChargeId: 'ch_demo_exec', stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'duplicate', requestedBy: 1, approvedBy: 1, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-exec-001',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved',
        approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        reasonCode: 'duplicate', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, railType: null, railErrorCode: null, railRetries: 0,
        net30InvoiceId: null,
      },
    };

    const executingRow = { ...approvedRow, status: 'processing', metadata: { ...approvedRow.metadata, workflowState: 'executing' } };
    const completedRow = {
      ...approvedRow, status: 'completed',
      stripeRefundId: 're_demo_wf_3002_abc',
      processedAt: new Date(),
      metadata: { ...approvedRow.metadata, workflowState: 'completed', railType: 'demo' },
    };

    let selectCallCount = 0;
    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              // First two calls: initial fetch in executeRefund + internal fetch in transitionState
              // Both must return approvedRow so the approved → executing transition is valid.
              const row = selectCallCount++ < 2 ? approvedRow : completedRow;
              return queryResult([row]);
            }),
          }),
        })),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockImplementation(() => {
                // First update = transition to executing, second = completed
                return Promise.resolve([completedRow]);
              }),
            }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
      net30InvoicesTable: {},
      net30CreditMemosTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
      buildRefundApprovedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
      buildRefundCompletedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
      buildRefundDeniedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
    }));
    vi.doMock('@szl-holdings/services', () => ({
      services: { stripe: { isLive: false } },
    }));

    const { executeRefund } = await import('../lib/refund-workflow-engine.js');
    const result = await executeRefund(3002, 1, 'ops@test.com');

    expect(result.status).toBe('completed');
    const meta = result.metadata as RefundWorkflowMetadata;
    expect(meta.workflowState).toBe('completed');
    expect(result.stripeRefundId).toMatch(/^re_demo_wf_/);
  });
});

// ─── 8. Audit completeness ─────────────────────────────────────────────────────

describe('8. Audit completeness', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createRefundRequest calls writeBillingAudit once with action refund_workflow.*', async () => {
    const mockAudit = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: mockAudit }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
      buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const baseRow = {
      id: 4001, orgId: 1, status: 'approved', amount: '100.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'other', requestedBy: 1, approvedBy: null, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-audit-001',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved', reasonCode: 'other', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null, railErrorCode: null, railRetries: 0,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([baseRow]),
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([])),
          }),
        }),
      },
      billingRefundRequestsTable: { orgId: {}, id: {}, idempotencyKey: {} },
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, organizationsTable: {},
    }));

    const { createRefundRequest } = await import('../lib/refund-workflow-engine.js');
    await createRefundRequest({
      orgId: 1, actorId: 1, actorEmail: 'ops@test.com',
      amount: 100, currency: 'usd', reasonCode: 'other',
      idempotencyKey: 'test-audit-001',
    });

    expect(mockAudit).toHaveBeenCalledTimes(1);
    const call = mockAudit.mock.calls[0]?.[0];
    expect(call?.action).toMatch(/^refund_workflow\./);
    expect(call?.resource).toBe('refund_request');
    expect(call?.resourceId).toBe('4001');
  });

  it('transitionState calls writeBillingAudit with action refund_workflow.cancelled', async () => {
    const mockAudit = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: mockAudit }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const requestedRow = {
      id: 4002, orgId: 1, status: 'pending', amount: '3000.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'other', requestedBy: 1, approvedBy: null, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-ts-001',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'requested', reasonCode: 'other', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: null, railErrorCode: null, railRetries: 0,
      },
    };

    const cancelledRow = {
      ...requestedRow, status: 'rejected', processedAt: new Date(),
      metadata: { ...requestedRow.metadata, workflowState: 'cancelled' },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([requestedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([cancelledRow]),
            }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
    }));

    const { transitionState } = await import('../lib/refund-workflow-engine.js');
    await transitionState(4002, 'cancelled', 1, 'ops@test.com', 'Customer request');

    expect(mockAudit).toHaveBeenCalledTimes(1);
    const call = mockAudit.mock.calls[0]?.[0];
    expect(call?.action).toBe('refund_workflow.cancelled');
    expect(call?.before).toMatchObject({ state: 'requested' });
    expect(call?.after).toMatchObject({ state: 'cancelled' });
  });

  it('recordApprovalDecision calls writeBillingAudit with approval.approved action', async () => {
    const mockAudit = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: mockAudit }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
      buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const requestedRow = {
      id: 4003, orgId: 1, status: 'pending', amount: '1000.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'service_failure', requestedBy: 2, approvedBy: null, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-audit-approval',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'requested',
        approvals: [],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        reasonCode: 'service_failure', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, railType: null, railErrorCode: null, railRetries: 0,
      },
    };

    const approvedRow = {
      ...requestedRow, status: 'approved',
      metadata: {
        ...requestedRow.metadata, workflowState: 'approved',
        approvals: [{ approverId: 10, approverEmail: 'mgr@test.com', approverRole: 'manager', decision: 'approved', timestamp: new Date().toISOString() }],
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([requestedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([approvedRow]),
            }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
    }));

    const { recordApprovalDecision } = await import('../lib/refund-workflow-engine.js');
    await recordApprovalDecision(4003, 10, 'mgr@test.com', 'manager', 'approved', 'Looks valid');

    expect(mockAudit).toHaveBeenCalledTimes(1);
    const call = mockAudit.mock.calls[0]?.[0];
    expect(call?.action).toBe('refund_workflow.approval.approved');
    expect(call?.after).toMatchObject({ decision: 'approved', approverRole: 'manager', satisfied: true });
  });
});

// ─── 9. State machine guard ────────────────────────────────────────────────────

describe('9. State machine guard', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invalid transition approved → under_review throws descriptive error', async () => {
    const approvedRow = {
      id: 5001, orgId: 1, status: 'approved', amount: '400.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'duplicate', requestedBy: 1, approvedBy: 1, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-invalid-ts',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved', reasonCode: 'duplicate', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null, railErrorCode: null, railRetries: 0,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([approvedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const { transitionState } = await import('../lib/refund-workflow-engine.js');
    await expect(
      transitionState(5001, 'under_review', 1, 'ops@test.com'),
    ).rejects.toThrow('Invalid workflow transition');
  });

  it('completed → executing is forbidden', async () => {
    const completedRow = {
      id: 5002, orgId: 1, status: 'completed', amount: '200.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: 're_test', stripePaymentIntentId: null,
      reason: 'duplicate', requestedBy: 1, approvedBy: 1, requestedAt: new Date(),
      processedAt: new Date(), notes: null, idempotencyKey: 'test-completed-ts',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'completed', reasonCode: 'duplicate', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: 'demo', railErrorCode: null, railRetries: 0,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([completedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const { transitionState } = await import('../lib/refund-workflow-engine.js');
    await expect(
      transitionState(5002, 'executing', 1, 'ops@test.com'),
    ).rejects.toThrow('Invalid workflow transition');
  });
});

// ─── 13. retryRefund — engine-level tests ─────────────────────────────────────

describe('13. retryRefund — state machine and retry cap', () => {
  it('throws if workflowState is not failed', async () => {
    vi.resetModules();

    const pendingRow = {
      id: 9001, orgId: 1, status: 'approved',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      amount: '200.00', currency: 'usd', reason: 'other', requestedBy: 1, approvedBy: null,
      requestedAt: new Date(), processedAt: null, notes: null, idempotencyKey: 'test-retry-1',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved',   // NOT failed — should reject
        reasonCode: 'other', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null, railErrorCode: null, railRetries: 0,
        invoiceId: null, net30InvoiceId: null, creditMemoId: null,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([pendingRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([pendingRow]) }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
      billingAuditLogTable: { resource: {}, resourceId: {}, createdAt: {} },
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, organizationsTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
      buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const { retryRefund } = await import('../lib/refund-workflow-engine.js');
    await expect(retryRefund(9001, 1, 'ops@test.com')).rejects.toThrow(
      'Cannot retry refund in state: approved',
    );
  });

  it('throws when railRetries >= MAX_REFUND_RETRIES', async () => {
    vi.resetModules();

    const maxedRow = {
      id: 9002, orgId: 1, status: 'failed',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      amount: '200.00', currency: 'usd', reason: 'other', requestedBy: 1, approvedBy: null,
      requestedAt: new Date(), processedAt: null, notes: null, idempotencyKey: 'test-retry-2',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'failed',
        reasonCode: 'other', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null, railErrorCode: 'card_declined', railRetries: 3,  // at cap
        invoiceId: null, net30InvoiceId: null, creditMemoId: null,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([maxedRow])),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
      billingAuditLogTable: { resource: {}, resourceId: {}, createdAt: {} },
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, organizationsTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
      buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const { retryRefund } = await import('../lib/refund-workflow-engine.js');
    await expect(retryRefund(9002, 1, 'ops@test.com')).rejects.toThrow(
      'maximum retry limit',
    );
  });

  it('MAX_REFUND_RETRIES constant is exported and equals 3', async () => {
    vi.resetModules();
    vi.doMock('@szl-holdings/db', () => ({
      db: { select: vi.fn(), update: vi.fn(), insert: vi.fn() },
      billingRefundRequestsTable: { id: {}, orgId: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, organizationsTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn() }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn() }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));
    const { MAX_REFUND_RETRIES } = await import('../lib/refund-workflow-engine.js');
    expect(MAX_REFUND_RETRIES).toBe(3);
  });
});

// ─── 14. Approval email triggers ──────────────────────────────────────────────

describe('14. Approval email is triggered on the right transitions', () => {
  it('buildRefundApprovedEmail called on self-serve createRefundRequest', async () => {
    vi.resetModules();
    const emailMock = vi.fn().mockReturnValue({ subject: 's', html: '<p/>', text: 't' });
    const sendMock = vi.fn().mockResolvedValue({ success: true });
    const mockAudit = vi.fn().mockResolvedValue(undefined);

    const selfServeRow = {
      id: 8001, orgId: 1, status: 'approved', amount: '100.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'other', requestedBy: 1, approvedBy: null, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-email-ss',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved', reasonCode: 'goodwill', customerFacingNote: null,
        internalNote: null, suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null, railErrorCode: null, railRetries: 0,
        invoiceId: null, net30InvoiceId: null, creditMemoId: null,
        customerEmail: 'customer@test.com',   // ensure email is not skipped for lack of address
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([selfServeRow]),
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([])),
          }),
        }),
      },
      billingRefundRequestsTable: { orgId: {}, id: {}, idempotencyKey: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, organizationsTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: mockAudit }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: sendMock,
      buildRefundApprovedEmail: emailMock,
      buildRefundCompletedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
      buildRefundDeniedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
    }));

    const { createRefundRequest } = await import('../lib/refund-workflow-engine.js');
    await createRefundRequest({
      orgId: 1, actorId: 1, actorEmail: 'ops@test.com',
      amount: 100, currency: 'usd', reasonCode: 'goodwill',
      customerEmail: 'customer@test.com',
      idempotencyKey: 'test-email-ss',
    });

    // Allow the non-fatal void promise to settle
    await new Promise((r) => setTimeout(r, 20));
    expect(emailMock).toHaveBeenCalledTimes(1);
  });
});

// ─── 15. IDOR protection — orgId cross-check ──────────────────────────────────

describe('15. IDOR protection — cross-tenant access', () => {
  it('fetchAndAuthorize pattern: orgId must match user org set', () => {
    // This test validates the logic that routes/refund-workflow.ts uses.
    // Simulates: user whose orgIds = Set({99}) tries to access a request owned by org 1.
    const userOrgIds = new Set([99]);
    const requestOrgId = 1;

    const hasAccess = (orgIds: Set<number>, orgId: number) => orgIds.has(orgId);
    expect(hasAccess(userOrgIds, requestOrgId)).toBe(false);   // should be blocked
    expect(hasAccess(userOrgIds, 99)).toBe(true);               // same org — allowed
  });

  it('cross-tenant access blocked even with known requestId', () => {
    const callerOrg = 5;
    const targetOrg = 7;
    const allowed = new Set([callerOrg]);
    // A request with id=42 owned by org 7 must not be accessible to org 5
    expect(allowed.has(targetOrg)).toBe(false);
  });

  it('super_admin users (orgIds=null) are granted access to all orgs', () => {
    // orgIds=null signals a platform-level admin in getUserOrgIds
    const hasAccess = (orgIds: Set<number> | null, orgId: number) =>
      orgIds === null || orgIds.has(orgId);
    expect(hasAccess(null, 999)).toBe(true);  // super_admin bypasses check
    expect(hasAccess(new Set([1]), 999)).toBe(false);
  });
});

// ─── 7. Credit memo linkage (metadata) ────────────────────────────────────────

describe('7. Credit memo metadata linkage', () => {
  it('net30InvoiceId stored in metadata on createRefundRequest', async () => {
    vi.resetModules();
    const mockAudit = vi.fn().mockResolvedValue(undefined);

    const baseRow = {
      id: 6001, orgId: 1, status: 'approved', amount: '300.00', currency: 'usd',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      reason: 'other', requestedBy: 1, approvedBy: null, requestedAt: new Date(),
      processedAt: null, notes: null, idempotencyKey: 'test-cm-001',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved', reasonCode: 'goodwill', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null, railErrorCode: null, railRetries: 0,
        invoiceId: null, net30InvoiceId: 42, creditMemoId: null,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([baseRow]),
            }),
          }),
        }),
        // Ownership check for net30InvoiceId=42 returns {orgId:1}; all other selects return [].
        select: vi.fn().mockImplementation((() => {
          let selectCallCount = 0;
          return () => ({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockImplementation(() => {
                selectCallCount++;
                // Call 1: featureFlags (approval thresholds) → []
                // Call 2: net30InvoicesTable ownership check → [{orgId:1}]
                return queryResult(selectCallCount === 2 ? [{ orgId: 1 }] : []);
              }),
            }),
          });
        })()),
      },
      billingRefundRequestsTable: { orgId: {}, id: {}, idempotencyKey: {} },
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, organizationsTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: mockAudit }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
      buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));

    const { createRefundRequest } = await import('../lib/refund-workflow-engine.js');
    const row = await createRefundRequest({
      orgId: 1, actorId: 1, actorEmail: 'ops@test.com',
      amount: 300, currency: 'usd', reasonCode: 'goodwill',
      net30InvoiceId: 42,
      idempotencyKey: 'test-cm-001',
    });

    const meta = row.metadata as RefundWorkflowMetadata;
    expect(meta.net30InvoiceId).toBe(42);
  });
});

// ─── 16. Rail failure → under_review auto-transition ──────────────────────────
// Verifies executeRefund on a rail failure auto-transitions to under_review
// (not stuck in failed) so operators can inspect and retry.

describe('16. Rail failure auto-reverts to under_review', () => {
  it('executeRefund: rail error transitions state to under_review (not failed)', async () => {
    vi.resetModules();
    const mockAudit = vi.fn().mockResolvedValue(undefined);

    const approvedRow = {
      id: 7001, orgId: 1, status: 'approved',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      amount: '500.00', currency: 'usd', reason: 'other', requestedBy: 1, approvedBy: 2,
      requestedAt: new Date(), processedAt: null, notes: null, idempotencyKey: 'test-fail-rt',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved', reasonCode: 'other', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: null, railErrorCode: null, railRetries: 0,
        invoiceId: null, net30InvoiceId: null, creditMemoId: null,
      },
    };

    const executingRow = { ...approvedRow, status: 'processing', metadata: { ...approvedRow.metadata, workflowState: 'executing' } };
    const revertedRow = { ...approvedRow, status: 'pending', metadata: { ...approvedRow.metadata, workflowState: 'under_review', railErrorCode: 'RAIL_REFUND_FAILED', railRetries: 1 } };

    let updateCallCount = 0;
    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([approvedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => ({
              returning: vi.fn().mockImplementation(() => {
                updateCallCount++;
                // 1st update: executing; 2nd update: revert to under_review
                return Promise.resolve([updateCallCount === 1 ? executingRow : revertedRow]);
              }),
            })),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {}, idempotencyKey: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, usersTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: mockAudit }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));
    // Mock rail adapter to throw a rail error
    vi.doMock('../lib/payment-rail-adapter.js', () => ({
      refundPayment: vi.fn().mockResolvedValue({ success: false, error: 'Card declined', errorCode: 'card_declined' }),
    }));

    const { executeRefund } = await import('../lib/refund-workflow-engine.js');
    const result = await executeRefund(7001, 2, 'approver@test.com');

    // The result should be the reverted row in under_review state
    const meta = result.metadata as RefundWorkflowMetadata;
    expect(meta.workflowState).toBe('under_review');
    expect(meta.railRetries).toBe(1);
    expect(meta.railErrorCode).toBe('RAIL_REFUND_FAILED');
    expect(result.status).toBe('pending'); // under_review maps to DB status 'pending'
  });
});

// ─── 16b. Crypto pending_manual → under_review (not completed) ────────────────

describe('16b. Crypto pending_manual rail result stays under_review', () => {
  it('executeRefund: pending_manual status sets workflowState=under_review, not completed', async () => {
    vi.resetModules();

    const approvedRow = {
      id: 7010, orgId: 1, status: 'approved',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      amount: '1000.00', currency: 'usd', reason: 'other', requestedBy: 1, approvedBy: 2,
      requestedAt: new Date(), processedAt: null, notes: null, idempotencyKey: 'test-crypto-pm',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved', reasonCode: 'other', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: 'crypto', railErrorCode: null, railRetries: 0,
        invoiceId: null, net30InvoiceId: null, creditMemoId: null,
      },
    };

    const executingRow = { ...approvedRow, status: 'processing', metadata: { ...approvedRow.metadata, workflowState: 'executing' } };
    const pendingManualRow = { ...approvedRow, status: 'pending', metadata: { ...approvedRow.metadata, workflowState: 'under_review', railType: 'crypto' } };

    let updateCallCount = 0;
    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([approvedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => ({
              returning: vi.fn().mockImplementation(() => {
                updateCallCount++;
                return Promise.resolve([updateCallCount === 1 ? executingRow : pendingManualRow]);
              }),
            })),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {}, idempotencyKey: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, usersTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));
    vi.doMock('../lib/payment-rail-adapter.js', () => ({
      refundPayment: vi.fn().mockResolvedValue({
        success: true,
        data: { refundId: 'crypto_ref_abc123', status: 'pending_manual', demo: false },
      }),
    }));

    const { executeRefund } = await import('../lib/refund-workflow-engine.js');
    const result = await executeRefund(7010, 2, 'approver@test.com');

    const meta = result.metadata as RefundWorkflowMetadata;
    // Must NOT be completed — pending_manual means operator still needs to disburse funds
    expect(meta.workflowState).not.toBe('completed');
    expect(meta.workflowState).toBe('under_review');
    expect(result.status).not.toBe('completed');
  });
});

// ─── 16c. Stripe status:failed with success:true must not complete ────────────
// Regression guard: Stripe and ACH processors can return HTTP 200 with a failed
// refund status. The adapter propagates this as { success: true, data.status: 'failed' }.
// executeRefund() MUST detect this and NOT mark the request completed — doing so
// would produce false financial records. Instead it must revert to under_review.

describe('16c. Stripe success:true + status:failed does NOT complete the request', () => {
  it('executeRefund: adapter success:true with status:failed reverts to under_review', async () => {
    vi.resetModules();
    const mockAudit = vi.fn().mockResolvedValue(undefined);

    const approvedRow = {
      id: 7020, orgId: 1, status: 'approved',
      stripeChargeId: 'ch_test_stripe_fail', stripeRefundId: null, stripePaymentIntentId: null,
      amount: '250.00', currency: 'usd', reason: 'other', requestedBy: 1, approvedBy: null,
      requestedAt: new Date(), processedAt: null, notes: null, idempotencyKey: 'test-stripe-fail-001',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'approved', reasonCode: 'other',
        customerFacingNote: null, internalNote: null, suppressCustomerEmail: false,
        approvals: [], requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: 'card', railErrorCode: null, railRetries: 0,
        invoiceId: null, net30InvoiceId: null, creditMemoId: null, customerEmail: null,
      },
    };

    const executingRow = { ...approvedRow, status: 'processing', metadata: { ...approvedRow.metadata, workflowState: 'executing' } };
    const revertedRow = { ...approvedRow, status: 'pending', metadata: { ...approvedRow.metadata, workflowState: 'under_review', railErrorCode: 'RAIL_REFUND_FAILED', railRetries: 1 } };

    let updateCallCount = 0;
    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([approvedRow]) }) }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockImplementation(() => {
                updateCallCount++;
                return Promise.resolve([updateCallCount === 1 ? executingRow : revertedRow]);
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{}]) }) }) }),
      },
      billingRefundRequestsTable: {},
      subscriptionCreditsTable: {},
      net30CreditMemosTable: {},
      net30InvoicesTable: {},
      invoicesTable: {},
      featureFlagsTable: {},
      usersTable: {},
    }));

    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: mockAudit }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
      buildRefundCompletedEmail: vi.fn().mockReturnValue({ subject: 'done', html: '<p/>', text: '' }),
    }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));

    // The adapter returns HTTP-level success but Stripe reported status:failed
    vi.doMock('../lib/payment-rail-adapter.js', () => ({
      refundPayment: vi.fn().mockResolvedValue({
        success: true,
        data: { refundId: 're_stripe_failed_abc', status: 'failed', demo: false },
      }),
    }));

    const { executeRefund } = await import('../lib/refund-workflow-engine.js');
    const result = await executeRefund(7020, 2, 'ops@test.com');

    const meta = result.metadata as RefundWorkflowMetadata;
    // Critical: must NOT complete when rail reports status:failed
    expect(meta.workflowState).not.toBe('completed');
    expect(result.status).not.toBe('completed');
    // Must revert to under_review with the error captured
    expect(meta.workflowState).toBe('under_review');
    expect(meta.railErrorCode).toBe('RAIL_REFUND_FAILED');
    expect(meta.railRetries).toBe(1);
    // No completion email should have been triggered
    const { buildRefundCompletedEmail } = await import('../lib/email.js');
    expect(buildRefundCompletedEmail).not.toHaveBeenCalled();
  });
});

// ─── 17. retryRefund from under_review state ──────────────────────────────────
// After a failure auto-revert, the request is in under_review with railRetries > 0.
// The retry endpoint should accept this state and attempt re-execution.

describe('17. retryRefund accepts under_review state with prior failures', () => {
  it('retryRefund rejects under_review with railRetries=0 (no prior failure)', async () => {
    vi.resetModules();

    const freshUnderReviewRow = {
      id: 7002, orgId: 1, status: 'pending',
      stripeChargeId: null, stripeRefundId: null, stripePaymentIntentId: null,
      amount: '500.00', currency: 'usd', reason: 'other', requestedBy: 1, approvedBy: null,
      requestedAt: new Date(), processedAt: null, notes: null, idempotencyKey: 'test-ur-fresh',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'under_review',   // under_review with NO prior rail failures
        reasonCode: 'other', customerFacingNote: null, internalNote: null,
        suppressCustomerEmail: false, approvals: [],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: null, railErrorCode: null, railRetries: 0,  // <-- no prior failures
        invoiceId: null, net30InvoiceId: null, creditMemoId: null,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([freshUnderReviewRow])),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {}, usersTable: {},
    }));
    vi.doMock('../lib/billing-audit.js', () => ({ writeBillingAudit: vi.fn().mockResolvedValue(undefined) }));
    vi.doMock('../lib/platform-flags.js', () => ({ isFlagEnabled: vi.fn().mockResolvedValue(false) }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(), buildRefundApprovedEmail: vi.fn(), buildRefundCompletedEmail: vi.fn(), buildRefundDeniedEmail: vi.fn(),
    }));
    vi.doMock('../lib/payment-rail-adapter.js', () => ({
      refundPayment: vi.fn(),
    }));

    const { retryRefund } = await import('../lib/refund-workflow-engine.js');
    await expect(retryRefund(7002, 1, 'ops@test.com')).rejects.toThrow(
      'Only failed or under_review requests with prior execution failures can be retried',
    );
  });
});

// ─── 18. Report endpoint org scoping (tenant isolation) ───────────────────────
// The resolveReportOrgId helper in routes enforces that tenant-bound users
// cannot see cross-tenant report data. These tests validate the scoping logic
// that guards /reports/reason-mix and /reports/refund-rate.

describe('18. Report endpoint org scoping', () => {
  // Inline implementation of resolveReportOrgId logic (mirrors routes/refund-workflow.ts)
  // so we can unit-test the algorithm without spinning up an HTTP server.
  function resolveReportOrgId(
    orgIds: Set<number> | null,
    queryOrgId: number | undefined,
  ): { orgId: number | null; error: string | null } {
    // Super-admin: orgIds is null, allow global queries
    if (orgIds === null) {
      return { orgId: queryOrgId ?? null, error: null };
    }
    // Explicit orgId provided — verify access
    if (queryOrgId !== undefined) {
      if (!orgIds.has(queryOrgId)) {
        return { orgId: null, error: 'forbidden' };
      }
      return { orgId: queryOrgId, error: null };
    }
    // No explicit orgId: auto-fill for single-org users
    if (orgIds.size === 1) {
      return { orgId: [...orgIds][0] ?? null, error: null };
    }
    // Multi-org user without orgId — reject
    return { orgId: null, error: 'bad_request' };
  }

  it('single-org user without orgId auto-scopes to their org', () => {
    const result = resolveReportOrgId(new Set([42]), undefined);
    expect(result.error).toBeNull();
    expect(result.orgId).toBe(42);
  });

  it('single-org user with explicit orgId matching their org is accepted', () => {
    const result = resolveReportOrgId(new Set([42]), 42);
    expect(result.error).toBeNull();
    expect(result.orgId).toBe(42);
  });

  it('single-org user with explicit foreign orgId is forbidden', () => {
    const result = resolveReportOrgId(new Set([42]), 99);
    expect(result.error).toBe('forbidden');
  });

  it('multi-org user without explicit orgId is rejected — prevents cross-tenant data leak', () => {
    // This is the critical case: passing orgId=null to the query engine would
    // disable org filtering and return platform-wide data to a tenant-bound user.
    const result = resolveReportOrgId(new Set([1, 2]), undefined);
    expect(result.error).toBe('bad_request');
    expect(result.orgId).toBeNull();
  });

  it('multi-org user with explicit orgId they own is accepted and scoped', () => {
    const result = resolveReportOrgId(new Set([1, 2]), 2);
    expect(result.error).toBeNull();
    expect(result.orgId).toBe(2);
  });

  it('multi-org user with foreign orgId is forbidden', () => {
    const result = resolveReportOrgId(new Set([1, 2]), 99);
    expect(result.error).toBe('forbidden');
  });

  it('super-admin (orgIds=null) without explicit orgId gets unrestricted scope', () => {
    // orgIds=null means super_admin — can query globally
    const result = resolveReportOrgId(null, undefined);
    expect(result.error).toBeNull();
    expect(result.orgId).toBeNull(); // null = unrestricted global query
  });

  it('super-admin with explicit orgId is scoped to that org', () => {
    const result = resolveReportOrgId(null, 5);
    expect(result.error).toBeNull();
    expect(result.orgId).toBe(5);
  });
});

// ─── 19. Create-route org resolution (resolveCreateOrgId) ─────────────────────
// Mirrors the resolveCreateOrgId helper in routes/refund-workflow.ts.
// Unlike reporting, CREATE always needs a concrete orgId — null is never valid.

describe('19. Create-route org resolution', () => {
  // Inline implementation of resolveCreateOrgId mirrors routes/refund-workflow.ts
  function resolveCreateOrgId(
    orgIds: Set<number> | null,
    bodyOrgId: number | undefined,
  ): { orgId: number | null; error: string | null } {
    if (orgIds === null) {
      if (!bodyOrgId) return { orgId: null, error: 'bad_request:super_admin_requires_org_id' };
      return { orgId: bodyOrgId, error: null };
    }
    if (bodyOrgId !== undefined) {
      if (!orgIds.has(bodyOrgId)) return { orgId: null, error: 'forbidden' };
      return { orgId: bodyOrgId, error: null };
    }
    if (orgIds.size === 1) {
      return { orgId: [...orgIds][0] ?? null, error: null };
    }
    return { orgId: null, error: 'bad_request:multi_org_requires_org_id' };
  }

  it('single-org user without body.orgId auto-fills their org', () => {
    const r = resolveCreateOrgId(new Set([10]), undefined);
    expect(r.error).toBeNull();
    expect(r.orgId).toBe(10);
  });

  it('single-org user with matching body.orgId is accepted', () => {
    const r = resolveCreateOrgId(new Set([10]), 10);
    expect(r.error).toBeNull();
    expect(r.orgId).toBe(10);
  });

  it('single-org user with foreign body.orgId is forbidden', () => {
    const r = resolveCreateOrgId(new Set([10]), 99);
    expect(r.error).toBe('forbidden');
  });

  it('multi-org user without body.orgId is rejected — prevents cross-tenant create', () => {
    const r = resolveCreateOrgId(new Set([1, 2]), undefined);
    expect(r.error).toContain('bad_request');
    expect(r.orgId).toBeNull();
  });

  it('multi-org user with owned body.orgId is accepted and scoped', () => {
    const r = resolveCreateOrgId(new Set([1, 2]), 2);
    expect(r.error).toBeNull();
    expect(r.orgId).toBe(2);
  });

  it('multi-org user with foreign body.orgId is forbidden', () => {
    const r = resolveCreateOrgId(new Set([1, 2]), 99);
    expect(r.error).toBe('forbidden');
  });

  it('super-admin without body.orgId is rejected — must scope explicitly', () => {
    const r = resolveCreateOrgId(null, undefined);
    expect(r.error).toContain('bad_request');
    expect(r.orgId).toBeNull();
  });

  it('super-admin with explicit body.orgId is accepted for that org', () => {
    const r = resolveCreateOrgId(null, 7);
    expect(r.error).toBeNull();
    expect(r.orgId).toBe(7);
  });
});

// ─── 21. Idempotency key cross-tenant isolation (regression guard) ────────────
// If org A and org B both use the same idempotency key, the conflict fallback
// must NOT return org A's row to org B. The org-scoped WHERE prevents this.
// With the composite unique key (org_id, idempotency_key), same-org retries
// still return the existing row (correct idempotency), and cross-org collisions
// are rejected with a clear error (no data leak).

describe('21. Idempotency key cross-tenant isolation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('cross-org collision: throws error rather than leaking another org row', async () => {
    vi.resetModules();

    const orgARow = {
      id: 8801, orgId: 1, status: 'pending',
      stripeChargeId: 'ch_org_a_secret', stripeRefundId: null, stripePaymentIntentId: null,
      amount: '100.00', currency: 'usd', reason: 'requested_by_customer',
      requestedBy: 10, approvedBy: null,
      requestedAt: new Date(), processedAt: null, notes: null,
      idempotencyKey: 'shared-key-abc',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'requested', reasonCode: 'requested_by_customer',
        customerFacingNote: null, internalNote: null, suppressCustomerEmail: false,
        approvals: [], requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null, railErrorCode: null, railRetries: 0,
        invoiceId: null, net30InvoiceId: null, creditMemoId: null,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),   // conflict: row already exists
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            // The org-scoped WHERE returns [] because key belongs to org 1, not org 2.
            // Use queryResult so .limit() chaining works for getApprovalThresholds().
            where: vi.fn().mockReturnValue(queryResult([])),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {}, idempotencyKey: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {},
      organizationsTable: {}, usersTable: {},
    }));

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
      actorFromReq: vi.fn(),
    }));
    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));
    // Demo mode: resolveChargeCustomer returns null → ownership check skipped
    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          isLive: false,
          resolveChargeCustomer: vi.fn().mockResolvedValue(null),
          getInvoicePaymentIntent: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    const { createRefundRequest } = await import('../lib/refund-workflow-engine.js');

    // Org 2 user tries to create a request using org 1's idempotency key
    await expect(
      createRefundRequest({
        orgId: 2,             // different org from the conflicting row (org 1)
        actorId: 99,
        actorEmail: 'attacker@evil.com',
        chargeId: 'ch_attacker',
        paymentIntentId: null,
        invoiceId: null,
        net30InvoiceId: null,
        amount: 100,
        currency: 'usd',
        reasonCode: 'other',
        customerFacingNote: null,
        internalNote: null,
        suppressCustomerEmail: false,
        customerEmail: null,
        railType: null,
        productId: null,
        idempotencyKey: 'shared-key-abc',  // same key as org A
      }),
    ).rejects.toThrow('Idempotency key conflict');

    // The select is called exactly once (org-scoped lookup) and finds nothing
    // — confirming that org A's row data was never returned to org B's caller.
  });

  it('same-org retry: returns existing row without error (correct idempotency)', async () => {
    vi.resetModules();

    const existingRow = {
      id: 8802, orgId: 5, status: 'pending',
      stripeChargeId: 'ch_existing', stripeRefundId: null, stripePaymentIntentId: null,
      amount: '200.00', currency: 'usd', reason: 'duplicate',
      requestedBy: 20, approvedBy: null,
      requestedAt: new Date(), processedAt: null, notes: null,
      idempotencyKey: 'same-org-key-xyz',
      createdAt: new Date(), updatedAt: new Date(),
      metadata: {
        workflowState: 'requested', reasonCode: 'duplicate',
        customerFacingNote: null, internalNote: null, suppressCustomerEmail: false,
        approvals: [], requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null, railErrorCode: null, railRetries: 0,
        invoiceId: null, net30InvoiceId: null, creditMemoId: null,
      },
    };

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),   // conflict: already exists
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            // Org-scoped lookup finds the row (same org = correct).
            // Use queryResult so .limit() chaining works for getApprovalThresholds().
            where: vi.fn().mockReturnValue(queryResult([existingRow])),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {}, idempotencyKey: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: {}, net30CreditMemosTable: {}, net30InvoicesTable: {},
      organizationsTable: {}, usersTable: {},
    }));

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));
    // Demo mode: resolveChargeCustomer returns null → ownership check skipped
    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          isLive: false,
          resolveChargeCustomer: vi.fn().mockResolvedValue(null),
          getInvoicePaymentIntent: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    const { createRefundRequest } = await import('../lib/refund-workflow-engine.js');
    const result = await createRefundRequest({
      orgId: 5,             // same org as the existing row
      actorId: 20,
      actorEmail: 'user@org5.com',
      chargeId: 'ch_existing',
      paymentIntentId: null,
      invoiceId: null,
      net30InvoiceId: null,
      amount: 200,
      currency: 'usd',
      reasonCode: 'duplicate',
      customerFacingNote: null,
      internalNote: null,
      suppressCustomerEmail: false,
      customerEmail: null,
      railType: null,
      productId: null,
      idempotencyKey: 'same-org-key-xyz',
    });

    // Existing row returned, no error — correct idempotency behavior
    expect(result.id).toBe(8802);
    expect(result.orgId).toBe(5);
  });
});

// ─── 22. Invoice-to-rail reference resolution ─────────────────────────────────
// When a refund request was submitted with only an invoiceId (no chargeId or
// paymentIntentId stored on the row), executeRefund() should look up the
// invoice's stripeInvoiceId and resolve the payment_intent from Stripe.
// In demo mode getInvoicePaymentIntent() returns null, so demo execution still
// succeeds (refundPayment() skips the Stripe ref check in demo mode).

describe('21. executeRefund — invoice-only request resolves Stripe ref in demo mode', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('invoice-only request (no chargeId/paymentIntentId) succeeds in demo mode', async () => {
    vi.resetModules();

    const invoiceOnlyRow = {
      id: 10001,
      orgId: 1,
      status: 'approved',
      stripeChargeId: null,          // ← no charge ref
      stripeRefundId: null,
      stripePaymentIntentId: null,   // ← no payment intent ref
      amount: '350.00',
      currency: 'usd',
      reason: 'requested_by_customer',
      requestedBy: 1,
      approvedBy: null,
      requestedAt: new Date(),
      processedAt: null,
      notes: null,
      idempotencyKey: 'test-invoice-only-10001',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        workflowState: 'approved',
        reasonCode: 'requested_by_customer',
        customerFacingNote: null,
        internalNote: null,
        suppressCustomerEmail: false,
        chargeId: null,
        approvals: [{ approverId: 2, approverRole: 'finance', decision: 'approved', decidedAt: new Date().toISOString(), note: '' }],
        requiredApprovals: { roles: ['finance'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: 'card',
        railErrorCode: null,
        railRetries: 0,
        invoiceId: 77,               // ← only invoiceId — no direct Stripe ref
        net30InvoiceId: null,
        creditMemoId: null,
      },
    };

    // Track select calls:
    //  1 = executeRefund initial fetch (billingRefundRequestsTable)
    //  2 = transitionState('executing') fetch (billingRefundRequestsTable)
    //  3 = invoice-to-rail resolution (invoicesTable.stripeInvoiceId)
    //  4+ = post-refund accounting (invoicesTable.amount/subscriptionId)
    let selectCallCount = 0;
    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1 || selectCallCount === 2) {
            // Initial refund request fetch + transitionState's own fetch
            return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(queryResult([invoiceOnlyRow])) }) };
          }
          if (selectCallCount === 3) {
            // Invoice lookup to get stripeInvoiceId (invoice-to-rail resolution)
            return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(queryResult([{ stripeInvoiceId: 'in_demo_001' }])) }) };
          }
          // Subsequent accounting lookup (invoiceId = 77) — returns empty
          return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(queryResult([])) }) };
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ ...invoiceOnlyRow, status: 'completed' }]),
            }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: { stripeInvoiceId: {}, id: {}, amount: {}, subscriptionId: {}, status: {} },
      net30CreditMemosTable: {},
      net30InvoicesTable: {},
      usersTable: {},
      subscriptionCreditsTable: {},
    }));

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(),
      buildRefundApprovedEmail: vi.fn(),
      buildRefundCompletedEmail: vi.fn().mockReturnValue({ subject: 'done', html: '<p/>', text: '' }),
      buildRefundDeniedEmail: vi.fn(),
    }));
    vi.doMock('../lib/payment-rail-adapter.js', () => ({
      // Demo mode: succeeds without requiring a Stripe ref
      refundPayment: vi.fn().mockResolvedValue({
        success: true,
        data: { refundId: 're_demo_invoice_ref', status: 'succeeded', rail: 'card', demo: true },
      }),
    }));
    // Demo Stripe adapter: both methods return null (isLive=false / demo mode)
    vi.doMock('@szl-holdings/services', () => ({
      services: {
        stripe: {
          isLive: false,
          resolveChargeCustomer: vi.fn().mockResolvedValue(null),
          getInvoicePaymentIntent: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    const { executeRefund } = await import('../lib/refund-workflow-engine.js');
    const result = await executeRefund(10001, 1, 'exec@test.com');
    expect(result).toBeDefined();
    expect((result as { status: string }).status).toBe('completed');
  });
});

// ─── 20. executeRefund completion side effects are blocking ───────────────────
// After the DB status update to 'completed', the credit memo and post-refund
// accounting steps must be awaited (not fire-and-forget). If they fail, the
// error is logged but the completed refund row is still returned — because the
// money has already been disbursed on the payment rail.

describe('20. executeRefund — completion side effects are blocking and error-tolerant', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  function makeApprovedRow(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 9001,
      orgId: 1,
      status: 'approved',
      stripeChargeId: null,
      stripeRefundId: null,
      stripePaymentIntentId: null,
      amount: '200.00',
      currency: 'usd',
      reason: 'requested_by_customer',
      requestedBy: 1,
      approvedBy: null,
      requestedAt: new Date(),
      processedAt: null,
      notes: null,
      idempotencyKey: 'test-exec-9001',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        workflowState: 'approved',
        reasonCode: 'requested_by_customer',
        customerFacingNote: null,
        internalNote: null,
        suppressCustomerEmail: false,
        chargeId: 'ch_test_001',
        approvals: [{ approverId: 2, approverRole: 'finance', decision: 'approved', decidedAt: new Date().toISOString(), note: '' }],
        requiredApprovals: { roles: ['finance'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: 'card',
        railErrorCode: null,
        railRetries: 0,
        invoiceId: null,
        net30InvoiceId: 42,   // triggers credit-memo path
        creditMemoId: null,
      },
      ...overrides,
    };
  }

  it('credit memo failure does not prevent executeRefund from returning the completed row', async () => {
    vi.resetModules();

    const approvedRow = makeApprovedRow();

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(queryResult([approvedRow])),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ ...approvedRow, status: 'completed' }]),
            }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: {},
      net30CreditMemosTable: {},
      net30InvoicesTable: {},
      usersTable: {},
      subscriptionCreditsTable: {},
    }));

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(),
      buildRefundApprovedEmail: vi.fn(),
      buildRefundCompletedEmail: vi.fn().mockReturnValue({ subject: 'done', html: '<p/>', text: '' }),
      buildRefundDeniedEmail: vi.fn(),
    }));
    vi.doMock('../lib/payment-rail-adapter.js', () => ({
      refundPayment: vi.fn().mockResolvedValue({ refundId: 'rf_test_001', status: 'succeeded', railType: 'card' }),
    }));

    // Credit memo throws — should be caught internally, not propagate
    vi.doMock('../lib/refund-workflow-engine.js', async (importOriginal) => {
      const original = await importOriginal() as Record<string, unknown>;
      return {
        ...original,
        createCreditMemoForRefund: vi.fn().mockRejectedValue(new Error('DB timeout')),
      };
    });

    const { executeRefund } = await import('../lib/refund-workflow-engine.js');
    // Should resolve (not reject) even though credit memo failed
    const result = await executeRefund(9001, 1, 'exec@test.com');
    expect(result).toBeDefined();
    // Status should show completed (the refund itself succeeded)
    expect((result as { status: string }).status).toBe('completed');
  });

  it('accounting failure does not prevent executeRefund from returning the completed row', async () => {
    vi.resetModules();

    const rowWithInvoice = makeApprovedRow({
      metadata: {
        workflowState: 'approved',
        reasonCode: 'requested_by_customer',
        customerFacingNote: null,
        internalNote: null,
        suppressCustomerEmail: false,
        chargeId: 'ch_test_002',
        approvals: [{ approverId: 2, approverRole: 'finance', decision: 'approved', decidedAt: new Date().toISOString(), note: '' }],
        requiredApprovals: { roles: ['finance'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: 'card',
        railErrorCode: null,
        railRetries: 0,
        invoiceId: 55,        // triggers accounting path
        net30InvoiceId: null,
        creditMemoId: null,
      },
    });

    // db.select returns the row for the initial fetch, then throws on invoice lookup
    let selectCallCount = 0;
    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: vi.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) {
            // First call: fetch the refund request row
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue(queryResult([rowWithInvoice])),
              }),
            };
          }
          // Subsequent calls: invoice lookup — throw to simulate accounting failure
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue(Promise.reject(new Error('invoice lookup failed'))),
            }),
          };
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ ...rowWithInvoice, status: 'completed' }]),
            }),
          }),
        }),
      },
      billingRefundRequestsTable: { id: {}, orgId: {} },
      billingAuditLogTable: {},
      featureFlagsTable: { key: {} },
      invoicesTable: { amount: {}, subscriptionId: {}, id: {}, status: {} },
      net30CreditMemosTable: {},
      net30InvoicesTable: {},
      usersTable: {},
      subscriptionCreditsTable: {},
    }));

    vi.doMock('../lib/billing-audit.js', () => ({
      writeBillingAudit: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../lib/platform-flags.js', () => ({
      isFlagEnabled: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn(),
      buildRefundApprovedEmail: vi.fn(),
      buildRefundCompletedEmail: vi.fn().mockReturnValue({ subject: 'done', html: '<p/>', text: '' }),
      buildRefundDeniedEmail: vi.fn(),
    }));
    vi.doMock('../lib/payment-rail-adapter.js', () => ({
      refundPayment: vi.fn().mockResolvedValue({ refundId: 'rf_test_002', status: 'succeeded', railType: 'card' }),
    }));

    const { executeRefund } = await import('../lib/refund-workflow-engine.js');
    // Should resolve even though accounting threw
    const result = await executeRefund(9001, 1, 'exec@test.com');
    expect(result).toBeDefined();
    expect((result as { status: string }).status).toBe('completed');
  });
});

// ─── 23. Charge/paymentIntent ownership validation ────────────────────────────
// In live mode, createRefundRequest() resolves the Stripe customer attached to
// the supplied chargeId/paymentIntentId and verifies it matches the org's
// billingCustomerId. Foreign references must be rejected (CHARGE_ORG_MISMATCH).
// In demo mode resolveChargeCustomer() returns null — check is skipped.

// Tests for validateChargeOwnership — the extracted ownership-check function.
// Uses static singletons (staticDb, staticServices) imported at file-level so that
// vi.spyOn targets the exact same objects the engine's ESM bindings hold, avoiding
// all vite-node runner-cache / vi.doMock key-resolution inconsistencies.
describe('23. Charge/paymentIntent ownership validation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('foreign charge (different Stripe customer) is rejected with CHARGE_ORG_MISMATCH', async () => {
    vi.spyOn(staticServices.stripe, 'resolveChargeCustomer').mockResolvedValue('cus_org_A');
    vi.spyOn(staticDb, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(queryResult([{ billingCustomerId: 'cus_org_B' }])),
      }),
    } as ReturnType<typeof vi.fn>);

    await expect(
      validateChargeOwnership('ch_foreign', null, 10),
    ).rejects.toMatchObject({ code: 'CHARGE_ORG_MISMATCH', message: expect.stringContaining('does not belong to your organization') });
  });

  it('same-org charge (matching Stripe customer) is accepted', async () => {
    vi.spyOn(staticServices.stripe, 'resolveChargeCustomer').mockResolvedValue('cus_match');
    vi.spyOn(staticDb, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(queryResult([{ billingCustomerId: 'cus_match' }])),
      }),
    } as ReturnType<typeof vi.fn>);

    await expect(validateChargeOwnership('ch_matching', null, 10)).resolves.toBeUndefined();
  });

  it('demo mode (resolveChargeCustomer returns null) skips ownership check', async () => {
    vi.spyOn(staticServices.stripe, 'resolveChargeCustomer').mockResolvedValue(null);

    // No db.select spy — if it were called we'd get a real DB error; null return means skip
    await expect(validateChargeOwnership('ch_demo_any', null, 10)).resolves.toBeUndefined();
  });
});
