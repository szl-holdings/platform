/**
 * refund-workflow-engine.ts
 *
 * Multi-step refund approval workflow engine.
 *
 * State machine:
 *   requested → under_review → approved → executing → completed
 *                                      ↘ failed (retryable → under_review)
 *                           ↘ denied
 *              ↘ cancelled
 *
 * DB mapping (billingRefundRequestsTable.status enum):
 *   requested    → pending   (metadata.workflowState = 'requested')
 *   under_review → pending   (metadata.workflowState = 'under_review')
 *   approved     → approved
 *   executing    → processing
 *   completed    → completed
 *   failed       → failed
 *   denied       → rejected  (metadata.workflowState = 'denied')
 *   cancelled    → rejected  (metadata.workflowState = 'cancelled')
 *
 * Approval thresholds (configurable via feature flag 'refund_approval_rules'):
 *   < $500        : self-serve — ops role auto-approved
 *   $500–$5,000   : single manager approval
 *   > $5,000      : finance + executive (2 approvals required)
 */

import {
  billingRefundRequestsTable,
  db,
  featureFlagsTable,
  invoicesTable,
  net30CreditMemosTable,
  net30InvoicesTable,
  organizationsTable,
  subscriptionCreditsTable,
  usersTable,
} from '@szl-holdings/db';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { writeBillingAudit } from './billing-audit';
import { buildRefundApprovedEmail, buildRefundCompletedEmail, buildRefundDeniedEmail, sendEmail } from './email';
import { logger } from './logger';
import { refundPayment } from './payment-rail-adapter';
import { services } from '@szl-holdings/services';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RefundReasonCode =
  | 'duplicate'
  | 'fraudulent'
  | 'requested_by_customer'
  | 'service_failure'
  | 'goodwill'
  | 'other';

export type WorkflowState =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'denied'
  | 'cancelled';

export interface ApprovalEntry {
  approverId: number;
  approverEmail: string;
  approverRole: string;
  decision: 'approved' | 'denied';
  timestamp: string;
  note?: string;
}

export interface RefundWorkflowMetadata {
  workflowState: WorkflowState;
  reasonCode: RefundReasonCode;
  customerFacingNote?: string | null;
  internalNote?: string | null;
  suppressCustomerEmail: boolean;
  approvals: ApprovalEntry[];
  requiredApprovals: {
    roles: string[];
    minApprovers: number;
    thresholdLabel: string;
  };
  railType?: string | null;
  railErrorCode?: string | null;
  railRetries: number;
  invoiceId?: number | null;
  net30InvoiceId?: number | null;
  creditMemoId?: number | null;
  customerEmail?: string | null;
  /** Product/plan SKU identifier. Stored at request-creation time from the caller's payment
   * context so that reporting can group refunds by product without joining external tables. */
  productId?: string | null;
}

export interface ApprovalThreshold {
  maxAmount: number | null;
  requiredRoles: string[];
  minApprovers: number;
  label: string;
}

export interface CreateRefundRequestParams {
  orgId: number;
  actorId: number;
  actorEmail: string | null;
  chargeId?: string | null;
  paymentIntentId?: string | null;
  invoiceId?: number | null;
  net30InvoiceId?: number | null;
  amount?: number | null;
  currency?: string;
  reasonCode: RefundReasonCode;
  customerFacingNote?: string | null;
  internalNote?: string | null;
  suppressCustomerEmail?: boolean;
  customerEmail?: string | null;
  idempotencyKey: string;
  /** Original payment rail from the source charge — 'card' | 'ach' | 'crypto'. When provided,
   * executeRefund() will always route to this rail instead of inferring from payment metadata. */
  railType?: 'card' | 'ach' | 'crypto' | null;
  /** Product identifier for reporting — links this refund to a specific product/plan SKU. */
  productId?: string | null;
}

// ─── Default approval thresholds ──────────────────────────────────────────────

export const DEFAULT_APPROVAL_THRESHOLDS: ApprovalThreshold[] = [
  {
    maxAmount: 500,
    requiredRoles: [],
    minApprovers: 0,
    label: 'self_serve',
  },
  {
    maxAmount: 5000,
    requiredRoles: ['manager'],
    minApprovers: 1,
    label: 'manager_approval',
  },
  {
    maxAmount: null,
    requiredRoles: ['finance', 'executive'],
    minApprovers: 2,
    label: 'dual_approval',
  },
];

// ─── Approval rule resolution ─────────────────────────────────────────────────

export async function getApprovalThresholds(): Promise<ApprovalThreshold[]> {
  try {
    const [flag] = await db
      .select()
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, 'refund_approval_rules'))
      .limit(1);

    if (flag?.metadata && typeof flag.metadata === 'object') {
      const meta = flag.metadata as Record<string, unknown>;
      if (Array.isArray(meta['thresholds'])) {
        return meta['thresholds'] as ApprovalThreshold[];
      }
    }
  } catch (err) {
    logger.warn({ err }, '[refund-workflow] Failed to load approval rules from flag — using defaults');
  }
  return DEFAULT_APPROVAL_THRESHOLDS;
}

export function resolveRequiredApprovals(
  amount: number | null,
  thresholds: ApprovalThreshold[],
): { roles: string[]; minApprovers: number; thresholdLabel: string } {
  const amountNum = amount ?? 0;
  const sorted = [...thresholds].sort((a, b) => {
    if (a.maxAmount === null) return 1;
    if (b.maxAmount === null) return -1;
    return a.maxAmount - b.maxAmount;
  });

  for (const threshold of sorted) {
    if (threshold.maxAmount === null || amountNum <= threshold.maxAmount) {
      return {
        roles: threshold.requiredRoles,
        minApprovers: threshold.minApprovers,
        thresholdLabel: threshold.label,
      };
    }
  }

  const last = sorted[sorted.length - 1];
  return {
    roles: last?.requiredRoles ?? ['finance', 'executive'],
    minApprovers: last?.minApprovers ?? 2,
    thresholdLabel: last?.label ?? 'dual_approval',
  };
}

// ─── Status mapping helpers ───────────────────────────────────────────────────

function workflowStateToDbStatus(
  state: WorkflowState,
): 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed' {
  switch (state) {
    case 'requested':
    case 'under_review':
      return 'pending';
    case 'approved':
      return 'approved';
    case 'executing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'denied':
    case 'cancelled':
      return 'rejected';
  }
}

function dbStatusToWorkflowState(
  status: string,
  metaState: string | undefined,
): WorkflowState {
  if (metaState) return metaState as WorkflowState;
  switch (status) {
    case 'pending':
      return 'requested';
    case 'approved':
      return 'approved';
    case 'processing':
      return 'executing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'rejected':
      return 'denied';
    default:
      return 'requested';
  }
}

// ─── Charge/paymentIntent ownership validation ────────────────────────────────
// Exported for direct unit testing. Verifies that the supplied chargeId or
// paymentIntentId belongs to the requesting org's Stripe customer.
// In demo mode (resolveChargeCustomer returns null) the check is skipped.

export async function validateChargeOwnership(
  chargeId: string | null,
  paymentIntentId: string | null,
  orgId: number,
): Promise<void> {
  const stripeCustomerOnCharge = await services.stripe.resolveChargeCustomer({
    chargeId: chargeId ?? undefined,
    paymentIntentId: paymentIntentId ?? undefined,
  });

  if (stripeCustomerOnCharge === null) return; // demo/no-key mode — skip

  const [org] = await db
    .select({ billingCustomerId: organizationsTable.billingCustomerId })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, orgId));

  if (!org) {
    throw Object.assign(new Error(`Organization ${orgId} not found`), { code: 'ORG_NOT_FOUND' });
  }

  if (!org.billingCustomerId) {
    throw Object.assign(
      new Error(
        `Organization ${orgId} has no Stripe billing customer. ` +
        'Complete billing setup before submitting charge-linked refund requests.',
      ),
      { code: 'ORG_NO_STRIPE_CUSTOMER' },
    );
  }

  if (stripeCustomerOnCharge !== org.billingCustomerId) {
    throw Object.assign(
      new Error(
        'The provided charge/paymentIntent does not belong to your organization. ' +
        'Verify the payment reference and try again.',
      ),
      { code: 'CHARGE_ORG_MISMATCH' },
    );
  }
}

// ─── Create refund request ────────────────────────────────────────────────────

export async function createRefundRequest(
  params: CreateRefundRequestParams,
): Promise<typeof billingRefundRequestsTable.$inferSelect> {
  const thresholds = await getApprovalThresholds();

  // ─── Resolve effective amount for threshold classification ────────────────────
  // When params.amount is null (caller is requesting a full refund), we must derive
  // the authoritative amount from the linked invoice/net30 invoice so that threshold
  // rules (self_serve / manager_approval / dual_approval) apply correctly.
  // Using amount ?? 0 would silently classify any full-refund as self_serve, allowing
  // large refunds to bypass approvals. Instead:
  //   • invoiceId supplied      → fetch invoice amount (also validates ownership here)
  //   • net30InvoiceId supplied → fetch net30 amount  (also validates ownership here)
  //   • charge/PI only          → amount unknown → force highest threshold (MAX_SAFE_INTEGER)
  //   • nothing supplied        → reject: cannot determine refund value
  let effectiveAmount = params.amount ?? null;
  // Track which linkage rows were already validated so we skip the second check below.
  let invAlreadyValidated = false;
  let n30AlreadyValidated = false;

  if (effectiveAmount === null) {
    if (params.invoiceId) {
      const [inv] = await db
        .select({ orgId: invoicesTable.orgId, amount: invoicesTable.amount })
        .from(invoicesTable)
        .where(eq(invoicesTable.id, params.invoiceId));
      if (!inv) {
        throw Object.assign(new Error(`Invoice ${params.invoiceId} not found`), { code: 'INVOICE_NOT_FOUND' });
      }
      if (inv.orgId !== params.orgId) {
        throw Object.assign(
          new Error(`Invoice ${params.invoiceId} does not belong to org ${params.orgId}`),
          { code: 'INVOICE_ORG_MISMATCH' },
        );
      }
      invAlreadyValidated = true;
      effectiveAmount = inv.amount !== null ? Number(inv.amount) : Number.MAX_SAFE_INTEGER;
    } else if (params.net30InvoiceId) {
      const [n30] = await db
        .select({ orgId: net30InvoicesTable.orgId, amount: net30InvoicesTable.amount })
        .from(net30InvoicesTable)
        .where(eq(net30InvoicesTable.id, params.net30InvoiceId));
      if (!n30) {
        throw Object.assign(new Error(`Net30 invoice ${params.net30InvoiceId} not found`), { code: 'INVOICE_NOT_FOUND' });
      }
      if (n30.orgId !== params.orgId) {
        throw Object.assign(
          new Error(`Net30 invoice ${params.net30InvoiceId} does not belong to org ${params.orgId}`),
          { code: 'INVOICE_ORG_MISMATCH' },
        );
      }
      n30AlreadyValidated = true;
      effectiveAmount = n30.amount !== null ? Number(n30.amount) : Number.MAX_SAFE_INTEGER;
    } else if (params.chargeId || params.paymentIntentId) {
      // Amount unknown for charge/PI-only full refund — use MAX to ensure strictest approval path
      effectiveAmount = Number.MAX_SAFE_INTEGER;
    } else {
      throw Object.assign(
        new Error('amount is required when no invoice or charge reference is provided'),
        { code: 'AMOUNT_REQUIRED' },
      );
    }
  }

  const required = resolveRequiredApprovals(effectiveAmount, thresholds);

  const isSelfServe = required.minApprovers === 0;
  const initialState: WorkflowState = isSelfServe ? 'approved' : 'requested';

  // ─── Linkage ownership validation (skip rows already fetched above) ───────────
  if (params.chargeId || params.paymentIntentId) {
    await validateChargeOwnership(
      params.chargeId ?? null,
      params.paymentIntentId ?? null,
      params.orgId,
    );
  }

  if (params.invoiceId && !invAlreadyValidated) {
    const [inv] = await db
      .select({ orgId: invoicesTable.orgId })
      .from(invoicesTable)
      .where(eq(invoicesTable.id, params.invoiceId));
    if (!inv) {
      throw Object.assign(new Error(`Invoice ${params.invoiceId} not found`), { code: 'INVOICE_NOT_FOUND' });
    }
    if (inv.orgId !== params.orgId) {
      throw Object.assign(
        new Error(`Invoice ${params.invoiceId} does not belong to org ${params.orgId}`),
        { code: 'INVOICE_ORG_MISMATCH' },
      );
    }
  }

  if (params.net30InvoiceId && !n30AlreadyValidated) {
    const [n30] = await db
      .select({ orgId: net30InvoicesTable.orgId })
      .from(net30InvoicesTable)
      .where(eq(net30InvoicesTable.id, params.net30InvoiceId));
    if (!n30) {
      throw Object.assign(new Error(`Net30 invoice ${params.net30InvoiceId} not found`), { code: 'INVOICE_NOT_FOUND' });
    }
    if (n30.orgId !== params.orgId) {
      throw Object.assign(
        new Error(`Net30 invoice ${params.net30InvoiceId} does not belong to org ${params.orgId}`),
        { code: 'INVOICE_ORG_MISMATCH' },
      );
    }
  }

  const wfMeta: RefundWorkflowMetadata = {
    workflowState: initialState,
    reasonCode: params.reasonCode,
    customerFacingNote: params.customerFacingNote ?? null,
    internalNote: params.internalNote ?? null,
    suppressCustomerEmail: params.suppressCustomerEmail ?? false,
    customerEmail: params.customerEmail ?? null,
    approvals: [],
    requiredApprovals: required,
    // Persist caller-supplied rail so executeRefund() routes deterministically without
    // re-inferring from payment identifiers that may not be present at execution time.
    railType: params.railType ?? null,
    railErrorCode: null,
    railRetries: 0,
    invoiceId: params.invoiceId ?? null,
    net30InvoiceId: params.net30InvoiceId ?? null,
    creditMemoId: null,
    productId: params.productId ?? null,
  };

  // Reason code mapping for Stripe (which has a limited set)
  const stripeReason = mapReasonToStripe(params.reasonCode);

  // storedAmount: canonical amount written to the DB row.
  // For invoice/net30-linked full refunds, effectiveAmount holds the resolved
  // invoice amount — persist it so executeRefund and createCreditMemoForRefund
  // can compute isFullRefund and credit-memo value without re-fetching.
  // For charge-only full refunds (effectiveAmount = MAX_SAFE_INTEGER, amount
  // determined at Stripe execution time), store null as before.
  const storedAmount =
    effectiveAmount !== null && effectiveAmount !== Number.MAX_SAFE_INTEGER
      ? effectiveAmount
      : (params.amount ?? null);

  const [row] = await db
    .insert(billingRefundRequestsTable)
    .values({
      orgId: params.orgId,
      stripeChargeId: params.chargeId ?? null,
      stripePaymentIntentId: params.paymentIntentId ?? null,
      amount: storedAmount != null ? String(storedAmount) : null,
      currency: params.currency ?? 'usd',
      reason: stripeReason,
      status: workflowStateToDbStatus(initialState),
      requestedBy: params.actorId,
      notes: params.internalNote ?? null,
      idempotencyKey: params.idempotencyKey,
      metadata: wfMeta as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing()
    .returning();

  if (!row) {
    // Idempotency key conflict — fetch the existing row scoped to the caller's org.
    // The org constraint is critical: without it a user-supplied key could return
    // another tenant's request (broken access control / cross-tenant data leak).
    const [existing] = await db
      .select()
      .from(billingRefundRequestsTable)
      .where(
        and(
          eq(billingRefundRequestsTable.idempotencyKey, params.idempotencyKey),
          eq(billingRefundRequestsTable.orgId, params.orgId),
        ),
      );
    if (!existing) {
      // The key exists but belongs to a different org — do not reveal its data.
      throw new Error(
        'Idempotency key conflict: this key has already been used by another organization. ' +
        'Provide a unique idempotency key for each request.',
      );
    }
    return existing;
  }

  await writeBillingAudit({
    orgId: params.orgId,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: 'refund_workflow.requested',
    resource: 'refund_request',
    resourceId: String(row.id),
    after: {
      state: initialState,
      reasonCode: params.reasonCode,
      amount: storedAmount,
      requiredApprovals: required,
    },
  });

  if (isSelfServe) {
    // Auto-approve self-serve requests — no Stripe execution yet; caller
    // must invoke executeRefund() to actually process the refund.
    logger.info(
      { requestId: row.id, amount: storedAmount },
      '[refund-workflow] Self-serve threshold — auto-approved',
    );
    // Notify customer that the request was approved (non-fatal)
    void sendRefundApprovedEmail(row, wfMeta).catch((err) =>
      logger.warn({ err, requestId: row.id }, '[refund-workflow] Self-serve approval email failed (non-fatal)'),
    );
  }

  return row;
}

// ─── Transition state ─────────────────────────────────────────────────────────

export async function transitionState(
  requestId: number,
  newState: WorkflowState,
  actorId: number,
  actorEmail: string | null,
  reason?: string,
  extraMeta?: Partial<RefundWorkflowMetadata>,
): Promise<typeof billingRefundRequestsTable.$inferSelect> {
  const [current] = await db
    .select()
    .from(billingRefundRequestsTable)
    .where(eq(billingRefundRequestsTable.id, requestId));

  if (!current) throw new Error(`Refund request ${requestId} not found`);

  const currentMeta = (current.metadata ?? {}) as RefundWorkflowMetadata;
  const currentState = currentMeta.workflowState ?? dbStatusToWorkflowState(current.status, undefined);

  validateTransition(currentState, newState);

  const updatedMeta: RefundWorkflowMetadata = {
    ...currentMeta,
    workflowState: newState,
    ...extraMeta,
  };

  const newDbStatus = workflowStateToDbStatus(newState);
  const now = new Date();

  const [updated] = await db
    .update(billingRefundRequestsTable)
    .set({
      status: newDbStatus,
      metadata: updatedMeta as unknown as Record<string, unknown>,
      processedAt: ['completed', 'failed', 'denied', 'cancelled'].includes(newState) ? now : current.processedAt,
      updatedAt: now,
    })
    .where(eq(billingRefundRequestsTable.id, requestId))
    .returning();

  if (!updated) throw new Error('Failed to update refund request state');

  await writeBillingAudit({
    orgId: current.orgId,
    actorId,
    actorEmail,
    action: `refund_workflow.${newState}`,
    resource: 'refund_request',
    resourceId: String(requestId),
    before: { state: currentState },
    after: { state: newState, reason },
  });

  return updated;
}

function validateTransition(from: WorkflowState, to: WorkflowState): void {
  const allowed: Record<WorkflowState, WorkflowState[]> = {
    requested: ['under_review', 'cancelled', 'approved'],
    under_review: ['approved', 'denied', 'cancelled', 'executing'],
    approved: ['executing'],
    executing: ['completed', 'under_review'],
    failed: ['under_review', 'cancelled'],
    completed: [],
    denied: [],
    cancelled: [],
  };

  if (!allowed[from]?.includes(to)) {
    throw new Error(`Invalid workflow transition: ${from} → ${to}`);
  }
}

// ─── Record approval decision ─────────────────────────────────────────────────

export async function recordApprovalDecision(
  requestId: number,
  approverId: number,
  approverEmail: string | null,
  approverRole: string,
  decision: 'approved' | 'denied',
  note?: string,
): Promise<{ request: typeof billingRefundRequestsTable.$inferSelect; satisfied: boolean }> {
  const [current] = await db
    .select()
    .from(billingRefundRequestsTable)
    .where(eq(billingRefundRequestsTable.id, requestId));

  if (!current) throw new Error(`Refund request ${requestId} not found`);

  const meta = (current.metadata ?? {}) as RefundWorkflowMetadata;
  const currentState = meta.workflowState ?? 'requested';

  // Only pending states (requested/under_review) accept new approval decisions.
  // 'approved' is a terminal approval state — it must proceed to execution, not denial.
  // Denying an already-approved request would create an invalid approved→denied transition
  // and contradict any approval work already recorded.
  if (!['requested', 'under_review'].includes(currentState)) {
    if (currentState === 'approved') {
      throw new Error(
        `Refund request ${requestId} is already approved and awaiting execution. ` +
          'Decisions cannot be changed once approval requirements are satisfied.',
      );
    }
    throw new Error(`Cannot record approval on request in state: ${currentState}`);
  }

  // Prevent double-voting by the same approver
  const alreadyVoted = meta.approvals?.some((a) => a.approverId === approverId);
  if (alreadyVoted) {
    throw new Error('Approver has already recorded a decision on this request');
  }

  const approval: ApprovalEntry = {
    approverId,
    approverEmail: approverEmail ?? '',
    approverRole,
    decision,
    timestamp: new Date().toISOString(),
    note,
  };

  const updatedApprovals = [...(meta.approvals ?? []), approval];

  const satisfied = checkApprovalSatisfied(updatedApprovals, meta.requiredApprovals);
  const hasDenial = decision === 'denied';

  const nextState: WorkflowState = hasDenial
    ? 'denied'
    : satisfied
      ? 'approved'
      : (currentState === 'requested' ? 'under_review' : currentState);

  const updatedMeta: RefundWorkflowMetadata = {
    ...meta,
    workflowState: nextState,
    approvals: updatedApprovals,
  };

  const [updated] = await db
    .update(billingRefundRequestsTable)
    .set({
      status: workflowStateToDbStatus(nextState),
      approvedBy: decision === 'approved' ? approverId : current.approvedBy,
      metadata: updatedMeta as unknown as Record<string, unknown>,
      processedAt: hasDenial ? new Date() : current.processedAt,
      updatedAt: new Date(),
    })
    .where(eq(billingRefundRequestsTable.id, requestId))
    .returning();

  if (!updated) throw new Error('Failed to record approval decision');

  await writeBillingAudit({
    orgId: current.orgId,
    actorId: approverId,
    actorEmail: approverEmail,
    action: `refund_workflow.approval.${decision}`,
    resource: 'refund_request',
    resourceId: String(requestId),
    before: { state: currentState, approvalCount: meta.approvals?.length ?? 0 },
    after: {
      state: nextState,
      decision,
      approverRole,
      satisfied,
      note,
    },
  });

  // Send approval email when the request transitions to approved state (non-fatal)
  if (nextState === 'approved' && decision === 'approved') {
    void sendRefundApprovedEmail(updated, updatedMeta).catch((err) =>
      logger.warn({ err, requestId }, '[refund-workflow] Approval email failed (non-fatal)'),
    );
  }

  // Send denial email when denied (non-fatal)
  if (nextState === 'denied') {
    void sendRefundDeniedEmail(updated, updatedMeta, note).catch((err) =>
      logger.warn({ err, requestId }, '[refund-workflow] Denial email failed (non-fatal)'),
    );
  }

  return { request: updated, satisfied };
}

function checkApprovalSatisfied(
  approvals: ApprovalEntry[],
  required: RefundWorkflowMetadata['requiredApprovals'],
): boolean {
  if (!required) return false;
  if (required.minApprovers === 0) return true;

  const positiveApprovals = approvals.filter((a) => a.decision === 'approved');

  if (positiveApprovals.length < required.minApprovers) return false;

  for (const role of required.roles) {
    const hasRole = positiveApprovals.some((a) => a.approverRole === role);
    if (!hasRole) return false;
  }

  return true;
}

// ─── Execute refund via rail ──────────────────────────────────────────────────

export async function executeRefund(
  requestId: number,
  actorId: number,
  actorEmail: string | null,
): Promise<typeof billingRefundRequestsTable.$inferSelect> {
  const [current] = await db
    .select()
    .from(billingRefundRequestsTable)
    .where(eq(billingRefundRequestsTable.id, requestId));

  if (!current) throw new Error(`Refund request ${requestId} not found`);

  const meta = (current.metadata ?? {}) as RefundWorkflowMetadata;
  if (meta.workflowState !== 'approved') {
    throw new Error(`Cannot execute refund in state: ${meta.workflowState}`);
  }

  // Transition to executing
  await transitionState(requestId, 'executing', actorId, actorEmail);

  try {
    let refundId: string;
    let refundStatus: string;
    let railType: string;

    // ─── Rail detection & execution via unified adapter ────────────────────
    // Detect the payment rail from the metadata hint set at request-creation time.
    // All rail execution is routed through refundPayment() so callers never branch
    // on rail type internally — the adapter handles card, ACH, and crypto paths.
    const hintedRail = meta.railType as string | null | undefined;
    const isAchRail = hintedRail === 'ach';
    const isCryptoRail = hintedRail === 'crypto' || hintedRail === 'coinbase';
    const resolvedRail: 'card' | 'ach' | 'crypto' = isCryptoRail ? 'crypto' : isAchRail ? 'ach' : 'card';

    // ─── Invoice-to-rail reference resolution ──────────────────────────────
    // When a refund request was submitted with only an invoiceId (no direct
    // Stripe charge/paymentIntent on the row), we need to derive a Stripe
    // reference before executing in live mode. Look up the invoice's
    // stripeInvoiceId and fetch its payment_intent via the Stripe Invoices API.
    // In demo mode services.stripe.getInvoicePaymentIntent() returns null,
    // which is fine because refundPayment() in demo mode skips the ref check.
    let resolvedChargeId: string | null = current.stripeChargeId;
    let resolvedPaymentIntentId: string | null = current.stripePaymentIntentId;

    if (!resolvedChargeId && !resolvedPaymentIntentId && meta.invoiceId) {
      try {
        const [inv] = await db
          .select({ stripeInvoiceId: invoicesTable.stripeInvoiceId })
          .from(invoicesTable)
          .where(eq(invoicesTable.id, meta.invoiceId));

        if (inv?.stripeInvoiceId) {
          const paymentIntentId = await services.stripe.getInvoicePaymentIntent(inv.stripeInvoiceId);
          if (paymentIntentId) {
            resolvedPaymentIntentId = paymentIntentId;
            logger.info(
              { requestId, invoiceId: meta.invoiceId, stripeInvoiceId: inv.stripeInvoiceId, paymentIntentId },
              '[refund-workflow] Resolved payment intent from invoice for refund execution',
            );
          }
        }
      } catch (resolveErr) {
        // Non-fatal: log and continue — demo mode will still succeed;
        // live mode will fail with MISSING_STRIPE_REF which surfaces the root issue.
        logger.warn(
          { err: resolveErr, requestId, invoiceId: meta.invoiceId },
          '[refund-workflow] Could not resolve Stripe payment intent from invoice',
        );
      }
    }

    const railResult = await refundPayment({
      rail: resolvedRail,
      chargeId: resolvedChargeId,
      paymentIntentId: resolvedPaymentIntentId,
      amount: current.amount ? parseFloat(current.amount) : null,
      reason: mapReasonToStripe(meta.reasonCode),
      idempotencyKey: `rf-exec-${current.idempotencyKey ?? requestId}`,
    });

    if (!railResult.success) {
      throw Object.assign(
        new Error(railResult.error ?? 'Rail refund failed'),
        { code: railResult.errorCode ?? 'RAIL_REFUND_FAILED' },
      );
    }

    refundId = railResult.data?.refundId ?? `re_demo_${resolvedRail}_${requestId}`;
    refundStatus = railResult.data?.status ?? 'succeeded';
    railType = railResult.data?.demo ? `${resolvedRail}_demo` : resolvedRail;

    // ── Rail-reported failure path ────────────────────────────────────────────
    // Stripe and ACH processors can return { status: 'failed' } even for an
    // HTTP-200 response (success: true at transport level). The adapter preserves
    // this as data.status = 'failed'. We must treat it as an execution failure —
    // marking the request 'completed' on a failed rail refund would produce false
    // financial records. Throw here so the catch block handles retry logic.
    if (refundStatus === 'failed') {
      throw Object.assign(
        new Error(`Rail refund returned status:failed for refundId:${refundId}`),
        { code: 'RAIL_REFUND_FAILED' },
      );
    }

    // ── Crypto / manual disbursement path ───────────────────────────────────
    // When the rail returns 'pending_manual' the funds have NOT been released
    // yet — a human operator must complete the transfer (e.g. send USDC on-chain).
    // Marking the request 'completed' before disbursement would be incorrect.
    // Instead, revert to under_review so operators can track the pending item
    // and confirm completion when the transfer is settled.
    if (refundStatus === 'pending_manual') {
      const pendingMeta: RefundWorkflowMetadata = {
        ...meta,
        workflowState: 'under_review',
        railType,
        railErrorCode: null,
      };

      const [pendingRow] = await db
        .update(billingRefundRequestsTable)
        .set({
          status: 'pending',
          stripeRefundId: refundId,
          metadata: pendingMeta as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(billingRefundRequestsTable.id, requestId))
        .returning();

      await writeBillingAudit({
        orgId: current.orgId,
        actorId,
        actorEmail,
        action: 'refund_workflow.pending_manual',
        resource: 'refund_request',
        resourceId: String(requestId),
        before: { state: 'executing' },
        after: { state: 'under_review', refundId, refundStatus, railType, reason: 'crypto_pending_manual_disbursement' },
      });

      logger.warn(
        { requestId, refundId, railType },
        '[refund-workflow] Crypto refund pending manual disbursement — operator action required',
      );

      return pendingRow ?? current;
    }

    // Update with Stripe refund ID
    const updatedMeta: RefundWorkflowMetadata = {
      ...meta,
      workflowState: 'completed',
      railType,
      railErrorCode: null,
    };

    const [completed] = await db
      .update(billingRefundRequestsTable)
      .set({
        status: 'completed',
        stripeRefundId: refundId,
        processedAt: new Date(),
        metadata: updatedMeta as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(billingRefundRequestsTable.id, requestId))
      .returning();

    await writeBillingAudit({
      orgId: current.orgId,
      actorId,
      actorEmail,
      action: 'refund_workflow.completed',
      resource: 'refund_request',
      resourceId: String(requestId),
      before: { state: 'executing' },
      after: { state: 'completed', refundId, refundStatus, railType },
    });

    // ─── Auto-create credit memo (blocking — must complete before returning) ──
    // If credit memo creation fails the refund itself already completed on the
    // payment rail, so we log the error but do not rethrow.
    if (meta.net30InvoiceId && current.orgId) {
      try {
        await createCreditMemoForRefund(completed ?? current, actorId);
      } catch (err) {
        logger.error({ err, requestId }, '[refund-workflow] Credit memo creation failed');
      }
    }

    // ─── Post-refund accounting (blocking — must complete before returning) ───
    // Update linked invoice status and record subscription-level audit entry.
    // Errors are logged at error level but do not roll back the completed refund
    // because the payment has already been disbursed on the rail.
    if (meta.invoiceId) {
      try {
        const [inv] = await db
          .select({ amount: invoicesTable.amount, subscriptionId: invoicesTable.subscriptionId })
          .from(invoicesTable)
          .where(eq(invoicesTable.id, meta.invoiceId!));

        const invoiceAmount = inv ? parseFloat(String(inv.amount)) : null;
        const refundAmount = current.amount ? parseFloat(String(current.amount)) : null;
        const isFullRefund = invoiceAmount !== null && refundAmount !== null
          && Math.abs(refundAmount - invoiceAmount) < 0.01;

        if (isFullRefund) {
          // Full refund: void the invoice so no further collection attempts occur
          await db
            .update(invoicesTable)
            .set({ status: 'void' })
            .where(eq(invoicesTable.id, meta.invoiceId!));

          logger.info(
            { requestId, invoiceId: meta.invoiceId },
            '[refund-workflow] Invoice voided due to full refund',
          );
        } else {
          // Partial refund: record adjustment in audit log
          // (no partial credit field on invoicesTable — tracked via audit trail)
          await writeBillingAudit({
            orgId: current.orgId,
            actorId,
            actorEmail,
            action: 'refund_workflow.partial_refund_applied',
            resource: 'invoice',
            resourceId: String(meta.invoiceId),
            after: { refundAmount, invoiceAmount, refundId, requestId },
          });
        }

        // Write an explicit subscription credit ledger entry for partial refunds.
        // For full refunds the invoice is voided, so no credit row is needed.
        // subscriptionCreditsTable is the authoritative per-subscription credit balance;
        // finance teams can aggregate rows by subscriptionId to get the running total.
        if (inv?.subscriptionId) {
          if (!isFullRefund && refundAmount != null && refundAmount > 0) {
            try {
              await db.insert(subscriptionCreditsTable).values({
                orgId: current.orgId,
                subscriptionId: inv.subscriptionId,
                amount: String(refundAmount),
                currency: current.currency ?? 'usd',
                type: 'refund_partial',
                sourceRefundId: requestId,
                appliedToInvoiceId: meta.invoiceId ?? null,
                createdBy: actorId,
                note: `Partial refund #${requestId} — ${meta.reasonCode}`,
                metadata: { refundId, requestId, invoiceId: meta.invoiceId },
              });
            } catch (creditErr) {
              logger.error(
                { err: creditErr, requestId, subscriptionId: inv.subscriptionId },
                '[refund-workflow] Subscription credit insert failed',
              );
            }
          }

          await writeBillingAudit({
            orgId: current.orgId,
            actorId,
            actorEmail,
            action: isFullRefund
              ? 'refund_workflow.subscription_invoice_voided'
              : 'refund_workflow.subscription_partial_credit',
            resource: 'subscription',
            resourceId: String(inv.subscriptionId),
            after: {
              refundAmount,
              invoiceAmount,
              refundId,
              requestId,
              isFullRefund,
              invoiceId: meta.invoiceId,
            },
          });
        }
      } catch (accountingErr) {
        logger.error(
          { err: accountingErr, requestId, invoiceId: meta.invoiceId },
          '[refund-workflow] Post-refund accounting update failed',
        );
      }
    }

    // Send completion email (non-fatal — fire-and-forget is acceptable here
    // because email delivery does not affect financial record integrity)
    void sendRefundCompletedEmail(completed ?? current, meta).catch((err) =>
      logger.warn({ err, requestId }, '[refund-workflow] Completion email failed (non-fatal)'),
    );

    return completed ?? current;
  } catch (err) {
    const errorCode = (err as { code?: string }).code ?? 'UNKNOWN';
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    const retriesCount = (meta.railRetries ?? 0) + 1;

    // Automatically return to under_review so operators can inspect and retry
    // without manual state patching. The error code and retry count are preserved
    // in metadata for visibility. The request never gets permanently stuck in failed.
    const retriedMeta: RefundWorkflowMetadata = {
      ...meta,
      workflowState: 'under_review',
      railErrorCode: errorCode,
      railRetries: retriesCount,
    };

    const [reverted] = await db
      .update(billingRefundRequestsTable)
      .set({
        status: 'pending',   // under_review maps to DB status 'pending'
        metadata: retriedMeta as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(billingRefundRequestsTable.id, requestId))
      .returning();

    await writeBillingAudit({
      orgId: current.orgId,
      actorId,
      actorEmail,
      action: 'refund_workflow.execution_failed_reverted',
      resource: 'refund_request',
      resourceId: String(requestId),
      before: { state: 'executing' },
      after: {
        state: 'under_review',
        errorCode,
        errorMessage,
        railRetries: retriesCount,
        reason: 'rail_execution_failed',
      },
    });

    logger.error(
      { err, requestId, errorCode, railRetries: retriesCount },
      '[refund-workflow] Refund execution failed — reverted to under_review for retry',
    );

    return reverted ?? current;
  }
}

// ─── Retry failed refund ──────────────────────────────────────────────────────

/**
 * retryRefund — transition a failed refund request back to under_review and
 * immediately attempt execution again. Use this after resolving the underlying
 * rail error (e.g. the charge was already partially refunded).
 *
 * Enforces a max-retry cap (default 3) to prevent infinite retry loops.
 */
export const MAX_REFUND_RETRIES = 3;

export async function retryRefund(
  requestId: number,
  actorId: number,
  actorEmail: string | null,
): Promise<typeof billingRefundRequestsTable.$inferSelect> {
  const [current] = await db
    .select()
    .from(billingRefundRequestsTable)
    .where(eq(billingRefundRequestsTable.id, requestId));

  if (!current) throw new Error(`Refund request ${requestId} not found`);

  const meta = (current.metadata ?? {}) as RefundWorkflowMetadata;

  // Accept both 'failed' (legacy) and 'under_review' (auto-reverted after execution failure).
  // An under_review request with railRetries > 0 is an execution failure waiting for retry.
  const isRetryable =
    meta.workflowState === 'failed' ||
    (meta.workflowState === 'under_review' && (meta.railRetries ?? 0) > 0);

  if (!isRetryable) {
    throw new Error(
      `Cannot retry refund in state: ${meta.workflowState} (railRetries=${meta.railRetries ?? 0}). ` +
      `Only failed or under_review requests with prior execution failures can be retried.`,
    );
  }

  if ((meta.railRetries ?? 0) >= MAX_REFUND_RETRIES) {
    throw new Error(
      `Refund request ${requestId} has reached the maximum retry limit (${MAX_REFUND_RETRIES}). Cancel and create a new request.`,
    );
  }

  await writeBillingAudit({
    orgId: current.orgId,
    actorId,
    actorEmail,
    action: 'refund_workflow.retry_queued',
    resource: 'refund_request',
    resourceId: String(requestId),
    before: { state: meta.workflowState, railRetries: meta.railRetries },
    after: { state: 'approved', railRetries: meta.railRetries },
  });

  // Re-approve so executeRefund can run
  const updatedMeta: RefundWorkflowMetadata = { ...meta, workflowState: 'approved' };
  const [reapproved] = await db
    .update(billingRefundRequestsTable)
    .set({
      status: 'approved',
      metadata: updatedMeta as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(billingRefundRequestsTable.id, requestId))
    .returning();

  if (!reapproved) throw new Error('Failed to re-approve refund request for retry');

  // Execute immediately — errors bubble up to the caller
  return executeRefund(requestId, actorId, actorEmail);
}

// ─── Credit memo creation ─────────────────────────────────────────────────────

export async function createCreditMemoForRefund(
  request: typeof billingRefundRequestsTable.$inferSelect,
  createdBy: number,
): Promise<void> {
  const meta = (request.metadata ?? {}) as RefundWorkflowMetadata;
  const net30InvoiceId = meta.net30InvoiceId;
  if (!net30InvoiceId) return;

  const [invoice] = await db
    .select()
    .from(net30InvoicesTable)
    .where(and(eq(net30InvoicesTable.id, net30InvoiceId), eq(net30InvoicesTable.orgId, request.orgId)));

  if (!invoice) {
    logger.warn({ net30InvoiceId, requestId: request.id }, '[refund-workflow] NET-30 invoice not found for credit memo');
    return;
  }

  // For invoice-linked full refunds, request.amount is resolved from the invoice at
  // creation time (see createRefundRequest storedAmount). For charge-only full refunds
  // the amount may still be null; skip memo creation in that case since the credit value
  // is unknown until Stripe confirms the disbursement amount.
  const refundAmount = request.amount ? parseFloat(request.amount) : null;
  if (refundAmount === null || refundAmount <= 0) {
    logger.warn(
      { net30InvoiceId, requestId: request.id },
      '[refund-workflow] Credit memo skipped — refund amount unknown or zero',
    );
    return;
  }
  const memoNumber = `CM-RF-${request.id}-${Date.now().toString(36).toUpperCase()}`;

  const creditMemoReason = mapReasonToCreditMemoReason(meta.reasonCode);

  const [memo] = await db
    .insert(net30CreditMemosTable)
    .values({
      invoiceId: net30InvoiceId,
      orgId: request.orgId,
      memoNumber,
      amount: String(refundAmount),
      currency: request.currency ?? 'usd',
      reason: creditMemoReason,
      description: `Refund credit memo — Request #${request.id}. Reason: ${meta.reasonCode}. ${meta.customerFacingNote ?? ''}`.trim(),
      createdBy,
      metadata: { refundRequestId: request.id, stripeRefundId: request.stripeRefundId },
    })
    .returning();

  if (memo) {
    // Update the refund request with the credit memo ID
    const updatedMeta = { ...meta, creditMemoId: memo.id };
    await db
      .update(billingRefundRequestsTable)
      .set({ metadata: updatedMeta as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(billingRefundRequestsTable.id, request.id));

    // Apply credit to the invoice's outstanding balance
    const newCreditApplied = parseFloat(invoice.creditApplied) + refundAmount;
    const newOutstanding = Math.max(0, parseFloat(invoice.outstandingBalance) - refundAmount);
    await db
      .update(net30InvoicesTable)
      .set({
        creditApplied: String(newCreditApplied),
        outstandingBalance: String(newOutstanding),
        updatedAt: new Date(),
      })
      .where(eq(net30InvoicesTable.id, net30InvoiceId));

    await writeBillingAudit({
      orgId: request.orgId,
      actorId: createdBy,
      action: 'refund_workflow.credit_memo.created',
      resource: 'credit_memo',
      resourceId: String(memo.id),
      after: {
        memoNumber,
        amount: refundAmount,
        invoiceId: net30InvoiceId,
        refundRequestId: request.id,
      },
    });

    logger.info({ memoId: memo.id, memoNumber, requestId: request.id }, '[refund-workflow] Credit memo created');
  }
}

// ─── Email notifications ──────────────────────────────────────────────────────

export async function sendRefundApprovedEmail(
  request: typeof billingRefundRequestsTable.$inferSelect,
  meta: RefundWorkflowMetadata,
): Promise<void> {
  if (meta.suppressCustomerEmail) return;

  const customerEmail = meta.customerEmail ?? await resolveCustomerEmail(request.orgId, request.requestedBy);
  if (!customerEmail) return;

  const { subject, html, text } = buildRefundApprovedEmail({
    requestId: request.id,
    amount: request.amount ? parseFloat(request.amount) : null,
    currency: request.currency ?? 'usd',
    reasonCode: meta.reasonCode,
    customerFacingNote: meta.customerFacingNote ?? undefined,
  });

  await sendEmail({ to: customerEmail, subject, html, text });
}

export async function sendRefundCompletedEmail(
  request: typeof billingRefundRequestsTable.$inferSelect,
  meta: RefundWorkflowMetadata,
): Promise<void> {
  if (meta.suppressCustomerEmail) return;

  const customerEmail = meta.customerEmail ?? await resolveCustomerEmail(request.orgId, request.requestedBy);
  if (!customerEmail) return;

  const { subject, html, text } = buildRefundCompletedEmail({
    requestId: request.id,
    refundId: request.stripeRefundId ?? undefined,
    amount: request.amount ? parseFloat(request.amount) : null,
    currency: request.currency ?? 'usd',
    reasonCode: meta.reasonCode,
    customerFacingNote: meta.customerFacingNote ?? undefined,
  });

  await sendEmail({ to: customerEmail, subject, html, text });
}

export async function sendRefundDeniedEmail(
  request: typeof billingRefundRequestsTable.$inferSelect,
  meta: RefundWorkflowMetadata,
  denialReason?: string,
): Promise<void> {
  if (meta.suppressCustomerEmail) return;

  const customerEmail = meta.customerEmail ?? await resolveCustomerEmail(request.orgId, request.requestedBy);
  if (!customerEmail) return;

  const { subject, html, text } = buildRefundDeniedEmail({
    requestId: request.id,
    amount: request.amount ? parseFloat(request.amount) : null,
    currency: request.currency ?? 'usd',
    denialReason: denialReason ?? 'Your request did not meet our refund criteria.',
  });

  await sendEmail({ to: customerEmail, subject, html, text });
}

async function resolveCustomerEmail(orgId: number, requestedBy?: number | null): Promise<string | null> {
  // Suppress unused-var lint — orgId retained for future billing-contact lookup
  void orgId;
  try {
    // Resolve the email of the user who submitted the refund request.
    // This is the most reliable contact point: the requester is the customer representative.
    if (!requestedBy) return null;
    const [user] = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, requestedBy));
    return user?.email ?? null;
  } catch {
    return null;
  }
}

// ─── Demo fixtures ────────────────────────────────────────────────────────────

export function buildDemoRefundQueue(): Array<Record<string, unknown>> {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  return [
    {
      id: 1001,
      orgId: 1,
      stripeChargeId: 'ch_demo_001',
      stripeRefundId: null,
      amount: '249.00',
      currency: 'usd',
      reason: 'requested_by_customer',
      status: 'pending',
      requestedBy: 42,
      approvedBy: null,
      requestedAt: daysAgo(1),
      processedAt: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(0),
      metadata: {
        workflowState: 'requested',
        reasonCode: 'service_failure',
        customerFacingNote: 'Service was unavailable during the billing period.',
        internalNote: 'Confirmed outage from 2026-04-20 to 2026-04-21.',
        suppressCustomerEmail: false,
        approvals: [],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: null,
        railErrorCode: null,
        railRetries: 0,
      },
    },
    {
      id: 1002,
      orgId: 1,
      stripeChargeId: 'ch_demo_002',
      stripeRefundId: null,
      amount: '1850.00',
      currency: 'usd',
      reason: 'requested_by_customer',
      status: 'pending',
      requestedBy: 43,
      approvedBy: null,
      requestedAt: daysAgo(3),
      processedAt: null,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
      metadata: {
        workflowState: 'under_review',
        reasonCode: 'duplicate',
        customerFacingNote: 'Duplicate charge on the same invoice.',
        internalNote: 'Two charges found on invoice INV-2026-0420.',
        suppressCustomerEmail: false,
        approvals: [],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: null,
        railErrorCode: null,
        railRetries: 0,
      },
    },
    {
      id: 1003,
      orgId: 1,
      stripeChargeId: 'ch_demo_003',
      stripeRefundId: 're_demo_003',
      amount: '5499.00',
      currency: 'usd',
      reason: 'fraudulent',
      status: 'completed',
      requestedBy: 44,
      approvedBy: 55,
      requestedAt: daysAgo(7),
      processedAt: daysAgo(5),
      createdAt: daysAgo(7),
      updatedAt: daysAgo(5),
      metadata: {
        workflowState: 'completed',
        reasonCode: 'fraudulent',
        customerFacingNote: 'Fraudulent charge identified and reversed.',
        internalNote: 'Chargeback risk confirmed. Refunded proactively.',
        suppressCustomerEmail: false,
        approvals: [
          {
            approverId: 55,
            approverEmail: 'finance@demo.com',
            approverRole: 'finance',
            decision: 'approved',
            timestamp: daysAgo(6),
            note: 'Confirmed with fraud team.',
          },
          {
            approverId: 56,
            approverEmail: 'exec@demo.com',
            approverRole: 'executive',
            decision: 'approved',
            timestamp: daysAgo(5),
          },
        ],
        requiredApprovals: { roles: ['finance', 'executive'], minApprovers: 2, thresholdLabel: 'dual_approval' },
        railType: 'card',
        railErrorCode: null,
        railRetries: 0,
        creditMemoId: null,
      },
    },
    {
      id: 1004,
      orgId: 1,
      stripeChargeId: 'ch_demo_004',
      stripeRefundId: null,
      amount: '750.00',
      currency: 'usd',
      reason: 'other',
      status: 'rejected',
      requestedBy: 45,
      approvedBy: null,
      requestedAt: daysAgo(5),
      processedAt: daysAgo(4),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(4),
      metadata: {
        workflowState: 'denied',
        reasonCode: 'goodwill',
        customerFacingNote: 'Goodwill refund for onboarding delay.',
        internalNote: 'Delay was within SLA. Denied.',
        suppressCustomerEmail: false,
        approvals: [
          {
            approverId: 57,
            approverEmail: 'manager@demo.com',
            approverRole: 'manager',
            decision: 'denied',
            timestamp: daysAgo(4),
            note: 'Delay was within SLA. Not eligible for goodwill refund.',
          },
        ],
        requiredApprovals: { roles: ['manager'], minApprovers: 1, thresholdLabel: 'manager_approval' },
        railType: null,
        railErrorCode: null,
        railRetries: 0,
      },
    },
    {
      id: 1005,
      orgId: 1,
      stripeChargeId: 'ch_demo_005',
      stripeRefundId: null,
      amount: '320.00',
      currency: 'usd',
      reason: 'requested_by_customer',
      status: 'failed',
      requestedBy: 46,
      approvedBy: 58,
      requestedAt: daysAgo(2),
      processedAt: null,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0),
      metadata: {
        workflowState: 'failed',
        reasonCode: 'requested_by_customer',
        customerFacingNote: 'Customer cancellation refund.',
        internalNote: null,
        suppressCustomerEmail: false,
        approvals: [
          {
            approverId: 58,
            approverEmail: 'ops@demo.com',
            approverRole: 'ops',
            decision: 'approved',
            timestamp: daysAgo(1),
          },
        ],
        requiredApprovals: { roles: [], minApprovers: 0, thresholdLabel: 'self_serve' },
        railType: 'card',
        railErrorCode: 'charge_already_refunded',
        railRetries: 1,
      },
    },
  ];
}

// ─── Reporting helpers ────────────────────────────────────────────────────────

export async function getRefundReasonMix(
  orgId: number | null,
  startDate: Date,
  endDate: Date,
  productId?: string | null,
): Promise<
  Array<{
    reasonCode: string;
    productId: string | null;
    count: number;
    totalAmount: number;
    percentage: number;
  }>
> {
  // Group by the workflow taxonomy reasonCode stored in metadata JSON rather than the
  // Stripe-mapped `reason` column (which collapses 'service_failure', 'goodwill', etc.
  // into 'other'). The taxonomy gives finance teams the meaningful breakdown they need.
  // productId dimension allows per-product breakdown (e.g. plan SKU).
  const rows = await db
    .select({
      reasonCode: sql<string>`coalesce(${billingRefundRequestsTable.metadata}->>'reasonCode', ${billingRefundRequestsTable.reason})`,
      productId: sql<string | null>`${billingRefundRequestsTable.metadata}->>'productId'`,
      count: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${billingRefundRequestsTable.amount}::numeric), 0)`,
    })
    .from(billingRefundRequestsTable)
    .where(
      and(
        orgId ? eq(billingRefundRequestsTable.orgId, orgId) : undefined,
        gte(billingRefundRequestsTable.createdAt, startDate),
        lte(billingRefundRequestsTable.createdAt, endDate),
        eq(billingRefundRequestsTable.status, 'completed'),
        productId
          ? sql`${billingRefundRequestsTable.metadata}->>'productId' = ${productId}`
          : undefined,
      ),
    )
    .groupBy(
      sql`coalesce(${billingRefundRequestsTable.metadata}->>'reasonCode', ${billingRefundRequestsTable.reason})`,
      sql`${billingRefundRequestsTable.metadata}->>'productId'`,
    );

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return rows.map((r) => ({
    reasonCode: r.reasonCode,
    productId: r.productId ?? null,
    count: r.count,
    totalAmount: Number(r.totalAmount),
    percentage: total > 0 ? Math.round((r.count / total) * 10000) / 100 : 0,
  }));
}

export async function getRefundRate(
  orgId: number | null,
  startDate: Date,
  endDate: Date,
  productId?: string | null,
): Promise<{
  totalRefunds: number;
  totalRefundAmount: number;
  refundRate: number;
  byStatus: Record<string, number>;
  byProduct: Array<{ productId: string | null; count: number; totalAmount: number }>;
}> {
  const where = and(
    orgId ? eq(billingRefundRequestsTable.orgId, orgId) : undefined,
    gte(billingRefundRequestsTable.createdAt, startDate),
    lte(billingRefundRequestsTable.createdAt, endDate),
    productId
      ? sql`${billingRefundRequestsTable.metadata}->>'productId' = ${productId}`
      : undefined,
  );

  const [rows, productRows] = await Promise.all([
    db
      .select({
        status: billingRefundRequestsTable.status,
        count: sql<number>`count(*)::int`,
        totalAmount: sql<number>`coalesce(sum(${billingRefundRequestsTable.amount}::numeric), 0)`,
      })
      .from(billingRefundRequestsTable)
      .where(where)
      .groupBy(billingRefundRequestsTable.status),
    db
      .select({
        productId: sql<string | null>`${billingRefundRequestsTable.metadata}->>'productId'`,
        count: sql<number>`count(*)::int`,
        totalAmount: sql<number>`coalesce(sum(${billingRefundRequestsTable.amount}::numeric), 0)`,
      })
      .from(billingRefundRequestsTable)
      .where(where)
      .groupBy(sql`${billingRefundRequestsTable.metadata}->>'productId'`),
  ]);

  const completedRow = rows.find((r) => r.status === 'completed');
  // totalRefunds counts ALL statuses (useful for pipeline visibility / byStatus breakdown)
  const totalRefunds = rows.reduce((sum, r) => sum + r.count, 0);
  // completedCount and amount are used together so the refund rate is internally consistent
  const completedCount = Number(completedRow?.count ?? 0);
  const totalRefundAmount = Number(completedRow?.totalAmount ?? 0);

  // Refund rate: completed refunds / invoices issued in same period.
  // Using completedCount (not totalRefunds) so the rate matches the amount metric and
  // excludes pending/denied/cancelled requests that were never actually paid out.
  let invoiceCount = 0;
  try {
    const [inv] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoicesTable)
      .where(
        and(
          orgId ? eq(invoicesTable.orgId, orgId) : undefined,
          gte(invoicesTable.createdAt, startDate),
          lte(invoicesTable.createdAt, endDate),
        ),
      );
    invoiceCount = inv?.count ?? 0;
  } catch {
    invoiceCount = 0;
  }

  return {
    totalRefunds,
    totalRefundAmount,
    refundRate: invoiceCount > 0 ? Math.round((completedCount / invoiceCount) * 10000) / 100 : 0,
    byStatus: Object.fromEntries(rows.map((r) => [r.status, r.count])),
    byProduct: productRows.map((r) => ({
      productId: r.productId ?? null,
      count: r.count,
      totalAmount: Number(r.totalAmount),
    })),
  };
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function mapReasonToStripe(
  reason: RefundReasonCode,
): 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other' {
  switch (reason) {
    case 'duplicate':
      return 'duplicate';
    case 'fraudulent':
      return 'fraudulent';
    case 'requested_by_customer':
      return 'requested_by_customer';
    default:
      return 'other';
  }
}

// ─── Subscription credit balance query ───────────────────────────────────────
// Aggregates all credit entries for a subscription from subscriptionCreditsTable.
// Finance teams use this to get the current per-subscription credit balance without
// scanning the audit log.

export async function getSubscriptionCreditBalance(
  subscriptionId: number,
  orgId: number | null,
): Promise<{
  subscriptionId: number;
  totalCreditAmount: number;
  currency: string;
  creditCount: number;
  entries: Array<{
    id: number;
    amount: number;
    type: string;
    sourceRefundId: number | null;
    note: string | null;
    createdAt: Date;
  }>;
}> {
  const rows = await db
    .select({
      id: subscriptionCreditsTable.id,
      amount: subscriptionCreditsTable.amount,
      currency: subscriptionCreditsTable.currency,
      type: subscriptionCreditsTable.type,
      sourceRefundId: subscriptionCreditsTable.sourceRefundId,
      note: subscriptionCreditsTable.note,
      createdAt: subscriptionCreditsTable.createdAt,
    })
    .from(subscriptionCreditsTable)
    .where(
      and(
        eq(subscriptionCreditsTable.subscriptionId, subscriptionId),
        orgId ? eq(subscriptionCreditsTable.orgId, orgId) : undefined,
      ),
    );

  const totalCreditAmount = rows.reduce((sum, r) => sum + parseFloat(String(r.amount)), 0);
  const currency = rows[0]?.currency ?? 'usd';

  return {
    subscriptionId,
    totalCreditAmount: Math.round(totalCreditAmount * 100) / 100,
    currency,
    creditCount: rows.length,
    entries: rows.map((r) => ({
      id: r.id,
      amount: parseFloat(String(r.amount)),
      type: r.type,
      sourceRefundId: r.sourceRefundId,
      note: r.note,
      createdAt: r.createdAt,
    })),
  };
}

function mapReasonToCreditMemoReason(
  reason: RefundReasonCode,
): 'billing_error' | 'service_credit' | 'goodwill' | 'dispute_resolution' | 'other' {
  switch (reason) {
    case 'duplicate':
      return 'billing_error';
    case 'fraudulent':
      return 'dispute_resolution';
    case 'service_failure':
      return 'service_credit';
    case 'goodwill':
      return 'goodwill';
    default:
      return 'other';
  }
}
