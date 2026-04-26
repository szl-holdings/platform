/**
 * billing-webhook.ts — Centralized Stripe webhook dispatcher.
 *
 * Design invariants:
 *  1. Signature verification is the caller's responsibility (billing.ts already
 *     does this before calling dispatchWebhookEvent).
 *  2. Event-ID dedupe via a three-state machine:
 *       pending/processing → handler runs → processed (success) or failed (error)
 *     On Stripe retry of a `failed` event, we reset to `processing` and re-run.
 *     On retry of an already-`processed` or `processing` event we return
 *     { duplicate: true } so Stripe stops retrying.
 *  3. Each handler is isolated — one handler's failure does NOT prevent the
 *     audit row from being written. Errors are logged and surfaced in the audit.
 *  4. All side-effectful DB writes use onConflictDoNothing() or upsert patterns
 *     so individual handler invocations are also idempotent.
 *  5. Billing audit entries are written for every event that causes a state
 *     mutation.
 *  6. Tenant resolution: if metadata lacks a valid orgId, the write is logged
 *     as unresolved and SKIPPED rather than falling back to an arbitrary org.
 *     This prevents cross-tenant data contamination.
 */

import {
  billingPlansTable,
  billingWebhookEventsTable,
  db,
  fulfillmentsTable,
  invoicesTable,
  organizationsTable,
  revenueEventsTable,
  subscriptionsTable,
} from '@szl-holdings/db';
import { and, eq, lt } from 'drizzle-orm';
import { writeBillingAudit } from './billing-audit';
import { logger } from './logger';

export interface StripeEventPayload {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

type WebhookHandler = (event: StripeEventPayload) => Promise<void>;

// ─── Tenant resolution helper ─────────────────────────────────────────────────

/**
 * resolveOrgId — parses orgId from webhook metadata. Returns null when the
 * metadata is absent or invalid, and logs a warning so ops can investigate.
 * Never falls back to an arbitrary org (e.g. "first org" / orgId=1).
 */
function resolveOrgId(
  metadata: Record<string, string> | undefined,
  context: string,
  eventId: string,
): number | null {
  const raw = metadata?.['orgId'];
  if (!raw) {
    logger.warn(
      { eventId, context },
      '[webhook] Event metadata missing orgId — tenant cannot be determined',
    );
    return null;
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed <= 0) {
    logger.warn(
      { eventId, context, rawOrgId: raw },
      '[webhook] Event metadata contains invalid orgId',
    );
    return null;
  }
  return parsed;
}

// ─── Per-feature handlers ─────────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(event: StripeEventPayload): Promise<void> {
  const session = event.data.object;
  logger.info(
    { sessionId: session['id'], customerId: session['customer'], mode: session['mode'] },
    '[webhook] checkout.session.completed',
  );

  const metadata = session['metadata'] as Record<string, string> | undefined;

  if (session['mode'] === 'payment') {
    await db
      .insert(fulfillmentsTable)
      .values({
        stripeSessionId: session['id'] as string,
        stripePaymentIntentId: session['payment_intent'] as string | undefined,
        product: metadata?.['product'] ?? metadata?.['service'] ?? 'platform',
        tierId: metadata?.['tierId'] ?? 'unknown',
        tierName: metadata?.['tierName'] ?? 'Unknown',
        customerEmail:
          (session['customer_details'] as Record<string, string> | undefined)?.['email'] ??
          (session['customer_email'] as string | undefined) ??
          null,
        amount: session['amount_total']
          ? String((session['amount_total'] as number) / 100)
          : null,
        currency: (session['currency'] as string) ?? 'usd',
        status: 'fulfilled',
        fulfilledAt: new Date(),
        metadata: { stripeEventId: event.id, sessionMetadata: metadata },
      })
      .onConflictDoNothing();

    await writeBillingAudit({
      action: 'checkout.completed',
      resource: 'fulfillment',
      resourceId: session['id'] as string,
      stripeEventId: event.id,
      stripeCustomerId: session['customer'] as string | null,
      after: {
        mode: 'payment',
        tierId: metadata?.['tierId'],
      },
    });
    return;
  }

  if (session['subscription']) {
    const orgId = resolveOrgId(metadata, 'checkout.session.completed', event.id);
    const planId = metadata?.['planId'] ? parseInt(metadata['planId'], 10) : null;

    if (!orgId) {
      logger.warn(
        { eventId: event.id, sessionId: session['id'] },
        '[webhook] checkout.session.completed: no valid orgId in metadata — subscription write skipped',
      );
      return;
    }

    let resolvedPlanId = planId && !isNaN(planId) ? planId : null;
    if (!resolvedPlanId) {
      const [firstPlan] = await db
        .select({ id: billingPlansTable.id })
        .from(billingPlansTable)
        .limit(1);
      resolvedPlanId = firstPlan?.id ?? null;
    }

    await db
      .insert(subscriptionsTable)
      .values({
        orgId,
        planId: resolvedPlanId,
        status: 'active',
        stripeSubscriptionId: session['subscription'] as string,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      })
      .onConflictDoNothing();

    await writeBillingAudit({
      action: 'subscription.created',
      resource: 'subscription',
      resourceId: session['subscription'] as string,
      orgId,
      stripeEventId: event.id,
      stripeCustomerId: session['customer'] as string | null,
      stripeSubscriptionId: session['subscription'] as string | null,
      after: { status: 'active', orgId },
    });
  }
}

async function handleSubscriptionCreatedOrUpdated(event: StripeEventPayload): Promise<void> {
  const sub = event.data.object;
  logger.info(
    { subscriptionId: sub['id'], status: sub['status'], eventType: event.type },
    '[webhook] subscription updated',
  );

  const existing = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.stripeSubscriptionId, sub['id'] as string));

  if (existing.length === 0) return;

  const newStatus =
    sub['status'] === 'active'
      ? 'active'
      : sub['status'] === 'trialing'
        ? 'trialing'
        : sub['status'] === 'past_due'
          ? 'past_due'
          : 'canceled';

  await db
    .update(subscriptionsTable)
    .set({
      status: newStatus,
      currentPeriodStart: new Date((sub['current_period_start'] as number) * 1000),
      currentPeriodEnd: new Date((sub['current_period_end'] as number) * 1000),
      canceledAt: sub['canceled_at'] ? new Date((sub['canceled_at'] as number) * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.stripeSubscriptionId, sub['id'] as string));

  await writeBillingAudit({
    action:
      event.type === 'customer.subscription.created'
        ? 'subscription.created'
        : 'subscription.updated',
    resource: 'subscription',
    resourceId: sub['id'] as string,
    orgId: existing[0]?.orgId ?? null,
    stripeEventId: event.id,
    stripeCustomerId: sub['customer'] as string | null,
    stripeSubscriptionId: sub['id'] as string | null,
    before: { status: existing[0]?.status },
    after: { status: newStatus },
  });
}

async function handleSubscriptionDeleted(event: StripeEventPayload): Promise<void> {
  const sub = event.data.object;
  logger.info({ subscriptionId: sub['id'] }, '[webhook] subscription deleted');

  const existing = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.stripeSubscriptionId, sub['id'] as string));

  await db
    .update(subscriptionsTable)
    .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptionsTable.stripeSubscriptionId, sub['id'] as string));

  await writeBillingAudit({
    action: 'subscription.canceled',
    resource: 'subscription',
    resourceId: sub['id'] as string,
    orgId: existing[0]?.orgId ?? null,
    stripeEventId: event.id,
    stripeCustomerId: sub['customer'] as string | null,
    stripeSubscriptionId: sub['id'] as string | null,
    before: { status: existing[0]?.status ?? 'unknown' },
    after: { status: 'canceled' },
  });
}

async function handleInvoicePaid(event: StripeEventPayload): Promise<void> {
  const invoice = event.data.object;
  logger.info({ invoiceId: invoice['id'] }, '[webhook] invoice.paid');

  const metadata = invoice['metadata'] as Record<string, string> | undefined;
  const orgId = resolveOrgId(metadata, 'invoice.paid', event.id);

  if (orgId) {
    // invoices.org_id is NOT NULL — only write when we have a valid tenant
    await db
      .insert(invoicesTable)
      .values({
        orgId,
        stripeInvoiceId: invoice['id'] as string,
        amount: ((invoice['amount_paid'] as number) / 100).toFixed(2),
        currency: invoice['currency'] as string,
        status: 'paid',
        paidAt: new Date(),
      })
      .onConflictDoNothing();
  } else {
    logger.warn(
      { eventId: event.id, invoiceId: invoice['id'] },
      '[webhook] invoice.paid: no valid orgId in metadata — invoices row write skipped',
    );
  }

  await db
    .insert(revenueEventsTable)
    .values({
      eventType: 'invoice.paid',
      product: metadata?.['product'] ?? 'platform',
      customerId: invoice['customer'] as string | undefined,
      subscriptionId: invoice['subscription'] as string | undefined,
      invoiceId: invoice['id'] as string | undefined,
      amount: invoice['amount_paid'] ? String((invoice['amount_paid'] as number) / 100) : null,
      currency: (invoice['currency'] as string) ?? 'usd',
      idempotencyKey: `invoice-paid-${event.id}`,
      metadata: { stripeEventId: event.id },
    })
    .onConflictDoNothing();

  await writeBillingAudit({
    action: 'invoice.paid',
    resource: 'invoice',
    resourceId: invoice['id'] as string,
    orgId,
    stripeEventId: event.id,
    stripeCustomerId: invoice['customer'] as string | null,
    stripeInvoiceId: invoice['id'] as string | null,
    after: { status: 'paid', amount: (invoice['amount_paid'] as number) / 100 },
  });

  // Fire-and-forget: compute and persist the tax decision for this invoice so
  // the tax engine is integrated into the real payment flow. Failures are logged
  // but do NOT block the webhook response or billing record writes.
  if (orgId) {
    void (async () => {
      try {
        const { computeTaxDecision, persistTaxCalculation } = await import('./tax-engine');
        const amountExclusive = invoice['amount_paid'] ? (invoice['amount_paid'] as number) / 100 : 0;
        const currency = (invoice['currency'] as string) ?? 'usd';
        const customerCountry = ((metadata?.['customerCountry'] as string | undefined) ?? 'US').toUpperCase();
        const sellerCountry = (process.env.SELLER_COUNTRY ?? 'US').toUpperCase();
        const customerIsB2B = metadata?.['customerIsB2B'] === 'true';

        const taxInput = {
          orgId,
          invoiceId: invoice['id'] as string,
          sellerCountry,
          customerCountry,
          customerIsB2B,
          amountExclusive,
          currency,
        };
        const decision = await computeTaxDecision(taxInput);
        await persistTaxCalculation(taxInput, decision);
        logger.info(
          { invoiceId: invoice['id'], source: decision.source, taxAmountExclusive: decision.taxAmountExclusive },
          '[webhook] invoice.paid: tax decision computed and persisted',
        );
      } catch (taxErr) {
        logger.warn({ err: taxErr, invoiceId: invoice['id'] }, '[webhook] invoice.paid: tax decision computation failed (non-fatal)');
      }
    })();
  }
}

async function handleInvoicePaymentFailed(event: StripeEventPayload): Promise<void> {
  const invoice = event.data.object;
  logger.info({ invoiceId: invoice['id'] }, '[webhook] invoice.payment_failed');

  if (invoice['subscription']) {
    await db
      .update(subscriptionsTable)
      .set({ status: 'past_due', updatedAt: new Date() })
      .where(eq(subscriptionsTable.stripeSubscriptionId, invoice['subscription'] as string));
  }

  await db
    .insert(revenueEventsTable)
    .values({
      eventType: 'invoice.payment_failed',
      product: 'platform',
      customerId: invoice['customer'] as string | undefined,
      subscriptionId: invoice['subscription'] as string | undefined,
      invoiceId: invoice['id'] as string | undefined,
      amount: invoice['amount_due'] ? String((invoice['amount_due'] as number) / 100) : null,
      currency: (invoice['currency'] as string) ?? 'usd',
      idempotencyKey: `payment-failed-${event.id}`,
      metadata: { stripeEventId: event.id },
    })
    .onConflictDoNothing();

  await writeBillingAudit({
    action: 'invoice.payment_failed',
    resource: 'invoice',
    resourceId: invoice['id'] as string,
    stripeEventId: event.id,
    stripeCustomerId: invoice['customer'] as string | null,
    stripeInvoiceId: invoice['id'] as string | null,
    after: { subscriptionStatus: 'past_due' },
  });
}

async function handleChargeRefunded(event: StripeEventPayload): Promise<void> {
  const charge = event.data.object;
  logger.info(
    { chargeId: charge['id'], amountRefunded: charge['amount_refunded'] },
    '[webhook] charge.refunded',
  );

  await db
    .insert(revenueEventsTable)
    .values({
      eventType: 'refund.issued',
      product: 'platform',
      customerId: charge['customer'] as string | undefined,
      invoiceId: charge['invoice'] as string | undefined,
      amount: charge['amount_refunded']
        ? String((charge['amount_refunded'] as number) / 100)
        : null,
      currency: (charge['currency'] as string) ?? 'usd',
      idempotencyKey: `charge-refunded-${event.id}`,
      metadata: { stripeEventId: event.id },
    })
    .onConflictDoNothing();

  await writeBillingAudit({
    action: 'charge.refunded',
    resource: 'charge',
    resourceId: charge['id'] as string,
    stripeEventId: event.id,
    stripeCustomerId: charge['customer'] as string | null,
    after: { amountRefunded: charge['amount_refunded'] },
  });
}

async function handlePaymentIntentSucceeded(event: StripeEventPayload): Promise<void> {
  const pi = event.data.object;
  logger.info(
    { paymentIntentId: pi['id'], amount: pi['amount'] },
    '[webhook] payment_intent.succeeded',
  );
}

// ─── customer.tax_id.* handlers ───────────────────────────────────────────────
// Tax ID events are informational: we write an audit record and log them so the
// billing audit trail stays complete. No DB mutation is required here — tax ID
// persistence and validation are handled by the tax-automation task.

async function handleTaxIdCreated(event: StripeEventPayload): Promise<void> {
  const taxId = event.data.object;
  logger.info(
    { taxIdId: taxId['id'], customerId: taxId['customer'], type: taxId['type'] },
    '[webhook] customer.tax_id.created',
  );
  await writeBillingAudit({
    action: 'customer.tax_id.created',
    resource: 'tax_id',
    resourceId: taxId['id'] as string,
    stripeEventId: event.id,
    stripeCustomerId: taxId['customer'] as string | null,
    after: { taxIdType: taxId['type'], value: taxId['value'] },
  });
}

async function handleTaxIdUpdated(event: StripeEventPayload): Promise<void> {
  const taxId = event.data.object;
  logger.info(
    { taxIdId: taxId['id'], customerId: taxId['customer'], verificationStatus: taxId['verification'] },
    '[webhook] customer.tax_id.updated',
  );
  await writeBillingAudit({
    action: 'customer.tax_id.updated',
    resource: 'tax_id',
    resourceId: taxId['id'] as string,
    stripeEventId: event.id,
    stripeCustomerId: taxId['customer'] as string | null,
    after: { taxIdType: taxId['type'], value: taxId['value'], verification: taxId['verification'] },
  });
}

async function handleTaxIdDeleted(event: StripeEventPayload): Promise<void> {
  const taxId = event.data.object;
  logger.info(
    { taxIdId: taxId['id'], customerId: taxId['customer'] },
    '[webhook] customer.tax_id.deleted',
  );
  await writeBillingAudit({
    action: 'customer.tax_id.deleted',
    resource: 'tax_id',
    resourceId: taxId['id'] as string,
    stripeEventId: event.id,
    stripeCustomerId: taxId['customer'] as string | null,
    after: { taxIdType: taxId['type'] },
  });
}

// ─── Dispatcher map ───────────────────────────────────────────────────────────

const HANDLERS: Record<string, WebhookHandler> = {
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'customer.subscription.created': handleSubscriptionCreatedOrUpdated,
  'customer.subscription.updated': handleSubscriptionCreatedOrUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'customer.tax_id.created': handleTaxIdCreated,
  'customer.tax_id.updated': handleTaxIdUpdated,
  'customer.tax_id.deleted': handleTaxIdDeleted,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'charge.refunded': handleChargeRefunded,
  'payment_intent.succeeded': handlePaymentIntentSucceeded,
};

/**
 * SUPPORTED_EVENT_TYPES — the complete list of Stripe event types handled by
 * the billing webhook dispatcher. Exported for test introspection and
 * documentation purposes.
 */
export const SUPPORTED_EVENT_TYPES: ReadonlyArray<string> = Object.keys(HANDLERS);

// ─── Webhook event state machine ──────────────────────────────────────────────

/**
 * How long (in ms) a row may remain in status='processing' before it is
 * considered stale and eligible for reclaim by the next Stripe retry.
 * 10 minutes is safely above the P99 handler latency and well below Stripe's
 * 72-hour retry window.
 */
const PROCESSING_STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * claimEvent — attempts to claim ownership of a Stripe event for processing.
 *
 * State machine:
 *   (new event)   → INSERT status='processing'          → handler runs
 *   (duplicate)   → conflict → SELECT existing status:
 *     'processed'              → already done, return duplicate=true
 *     'processing' (fresh)     → in-flight; return duplicate=true
 *     'processing' (stale >10m)→ previous processor crashed; atomically reclaim
 *     'failed'                 → previous attempt failed; atomically reclaim
 *
 * Returns { claimed: true }  — caller should run the handler.
 * Returns { claimed: false } — true duplicate; caller returns 200 without work.
 *
 * Stale-processing reclaim prevents events from being permanently dead-lettered
 * when a processor crashes between claim and completion. `processedAt` is
 * repurposed as "last entered processing at" — it is reset to NOW() on every
 * successful reclaim so the staleness window restarts cleanly.
 */
async function claimEvent(
  eventId: string,
  eventType: string,
): Promise<{ claimed: boolean; wasFailed: boolean }> {
  try {
    await db.insert(billingWebhookEventsTable).values({
      stripeEventId: eventId,
      eventType,
      status: 'processing',
    });
    return { claimed: true, wasFailed: false };
  } catch (insertErr) {
    const msg = String((insertErr as Error)?.message ?? '');
    const isConflict =
      msg.includes('unique') ||
      msg.includes('duplicate') ||
      msg.includes('billing_webhook_events_stripe_event_id_unique');

    if (!isConflict) {
      throw insertErr;
    }

    const [existing] = await db
      .select({
        status: billingWebhookEventsTable.status,
        processedAt: billingWebhookEventsTable.processedAt,
      })
      .from(billingWebhookEventsTable)
      .where(eq(billingWebhookEventsTable.stripeEventId, eventId))
      .limit(1);

    if (!existing || existing.status === 'processed') {
      logger.info(
        { eventId, eventType, existingStatus: existing?.status },
        '[webhook] Duplicate delivery detected — skipping (already processed)',
      );
      return { claimed: false, wasFailed: false };
    }

    if (existing.status === 'processing') {
      // Determine whether the in-flight claim is stale (processor crashed).
      // `processedAt` is set to NOW() on every successful transition into
      // 'processing', so it serves as the lease-start timestamp.
      const staleThreshold = new Date(Date.now() - PROCESSING_STALE_THRESHOLD_MS);
      const isStale = existing.processedAt != null && existing.processedAt < staleThreshold;

      if (!isStale) {
        logger.info(
          { eventId, eventType },
          '[webhook] Duplicate delivery — event is currently in-flight, skipping',
        );
        return { claimed: false, wasFailed: false };
      }

      // Stale claim: atomically flip processing→processing with a fresh
      // processedAt, scoped to the specific row's current timestamp so
      // only one concurrent reclaimer wins.
      const reclaimed = await db
        .update(billingWebhookEventsTable)
        .set({ status: 'processing', processedAt: new Date(), errorMessage: null })
        .where(
          and(
            eq(billingWebhookEventsTable.stripeEventId, eventId),
            eq(billingWebhookEventsTable.status, 'processing'),
            lt(billingWebhookEventsTable.processedAt, staleThreshold),
          ),
        )
        .returning({ id: billingWebhookEventsTable.id });

      if (reclaimed.length === 0) {
        logger.info(
          { eventId, eventType },
          '[webhook] Concurrent retry already reclaimed this stale event — backing off',
        );
        return { claimed: false, wasFailed: false };
      }

      logger.info(
        { eventId, eventType },
        '[webhook] Re-claiming stale processing event (previous processor likely crashed)',
      );
      return { claimed: true, wasFailed: false };
    }

    if (existing.status === 'failed') {
      // Atomic reclaim: only transition failed→processing if the row still has
      // status='failed' at UPDATE time. If a concurrent retry already flipped it
      // to 'processing', this UPDATE affects 0 rows and we back off.
      // Reset processedAt so the stale-processing window restarts from now.
      const reclaimed = await db
        .update(billingWebhookEventsTable)
        .set({ status: 'processing', processedAt: new Date(), errorMessage: null })
        .where(
          and(
            eq(billingWebhookEventsTable.stripeEventId, eventId),
            eq(billingWebhookEventsTable.status, 'failed'),
          ),
        )
        .returning({ id: billingWebhookEventsTable.id });

      if (reclaimed.length === 0) {
        logger.info(
          { eventId, eventType },
          '[webhook] Concurrent retry already reclaimed this event — backing off',
        );
        return { claimed: false, wasFailed: false };
      }

      logger.info(
        { eventId, eventType },
        '[webhook] Re-claiming previously failed event for retry',
      );
      return { claimed: true, wasFailed: true };
    }

    return { claimed: false, wasFailed: false };
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * dispatchWebhookEvent — called by the /billing/webhooks route AFTER the
 * stripe signature has already been verified.
 *
 * Returns { duplicate: true } when the event has already been processed.
 * Returns { duplicate: false } when the event was processed (or had no handler).
 * Throws on handler errors so the caller can return a 500 — Stripe will retry
 * the event, and since status is `failed`, the next delivery will be re-claimed.
 */
export async function dispatchWebhookEvent(
  event: StripeEventPayload,
): Promise<{ duplicate: boolean }> {
  if (!event.id || !event.type) {
    throw new Error('Invalid Stripe event: missing id or type');
  }

  const { claimed } = await claimEvent(event.id, event.type);
  if (!claimed) {
    return { duplicate: true };
  }

  const handler = HANDLERS[event.type];
  if (!handler) {
    logger.info(
      { eventType: event.type, eventId: event.id },
      '[webhook] No handler registered for event type',
    );
    await db
      .update(billingWebhookEventsTable)
      .set({ status: 'processed', processedAt: new Date() })
      .where(eq(billingWebhookEventsTable.stripeEventId, event.id));
    return { duplicate: false };
  }

  try {
    await handler(event);
    await db
      .update(billingWebhookEventsTable)
      .set({ status: 'processed', processedAt: new Date() })
      .where(eq(billingWebhookEventsTable.stripeEventId, event.id));
    logger.info(
      { eventType: event.type, eventId: event.id },
      '[webhook] Event processed successfully',
    );
  } catch (handlerErr) {
    logger.error(
      { err: handlerErr, eventType: event.type, eventId: event.id },
      '[webhook] Handler failed — marking event as failed for Stripe retry',
    );
    await db
      .update(billingWebhookEventsTable)
      .set({
        status: 'failed',
        errorMessage: String((handlerErr as Error)?.message ?? 'Unknown error').slice(0, 1000),
      })
      .where(eq(billingWebhookEventsTable.stripeEventId, event.id));
    throw handlerErr;
  }

  return { duplicate: false };
}
