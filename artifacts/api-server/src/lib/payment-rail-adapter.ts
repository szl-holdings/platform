/**
 * payment-rail-adapter.ts — Unified Rail Adapter Facade.
 *
 * Exposes a rail-agnostic interface over card (Stripe), ACH (Stripe + Plaid),
 * and crypto (Coinbase Commerce) so callers never branch on rail internally.
 *
 * Interface:
 *   chargeInvoice(invoiceId, rail, paymentMethodId)
 *   getPaymentMethods(customerId)
 *   addPaymentMethod(customerId, rail, payload)
 *   handleRailWebhook(rail, payload)
 *
 * Design notes:
 *  - All rail adapters are lazy-required so unused adapters don't add startup
 *    overhead.
 *  - Demo mode is handled per-adapter; this facade exposes isRailAvailable()
 *    to let routes surface appropriate UI affordances.
 *  - The facade never throws on unsupported rails — it returns a typed error
 *    result so routes can emit structured 400/422 responses.
 */

import { billingRailAccountsTable, db, invoicesTable, organizationsTable, revenueEventsTable } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { writeBillingAudit } from './billing-audit';
import { logger } from './logger';
import { services } from '@szl-holdings/services';

export type PaymentRail = 'card' | 'ach' | 'crypto';

export interface RailResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface PaymentMethodSummary {
  id: number;
  rail: PaymentRail;
  label: string;
  status: 'active' | 'pending' | 'inactive' | 'rejected';
  isDefault: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ChargeInvoiceResult {
  status: 'succeeded' | 'pending' | 'failed';
  rail: PaymentRail;
  externalRef?: string;
  hostedUrl?: string;
  failureReason?: string;
  achReturnCode?: string;
  demo?: boolean;
}

// ─── Rail availability ────────────────────────────────────────────────────────

export function isRailAvailable(rail: PaymentRail): boolean {
  switch (rail) {
    case 'card':
      return !!process.env.STRIPE_SECRET_KEY;
    case 'ach':
      return true;
    case 'crypto':
      return true;
    default:
      return false;
  }
}

export function getRailStatus(): Record<PaymentRail, { available: boolean; demo: boolean }> {
  return {
    card: {
      available: !!process.env.STRIPE_SECRET_KEY,
      demo: !process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
    },
    ach: {
      available: true,
      demo: !(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET),
    },
    crypto: {
      available: true,
      demo: !process.env.COINBASE_COMMERCE_API_KEY,
    },
  };
}

// ─── Get payment methods ──────────────────────────────────────────────────────

export async function getPaymentMethods(orgId: number): Promise<PaymentMethodSummary[]> {
  // Fetch ACH + crypto rail accounts from our DB
  const [rows, [org]] = await Promise.all([
    db
      .select()
      .from(billingRailAccountsTable)
      .where(
        and(
          eq(billingRailAccountsTable.orgId, orgId),
          eq(billingRailAccountsTable.status, 'active'),
        ),
      ),
    db
      .select({ billingCustomerId: organizationsTable.billingCustomerId })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId)),
  ]);

  const railMethods: PaymentMethodSummary[] = rows.map((r) => ({
    id: r.id,
    rail: r.rail as PaymentRail,
    label: r.accountLabel ?? `${r.rail} account`,
    status: r.status as PaymentMethodSummary['status'],
    isDefault: r.isDefault,
    metadata: (r.metadata as Record<string, unknown>) ?? undefined,
    createdAt: r.createdAt,
  }));

  // Merge Stripe card payment methods when the org has a billing customer
  if (org?.billingCustomerId) {
    try {
      const stripeCards = await services.stripe.listPaymentMethods(org.billingCustomerId, 'card');
      const cardMethods: PaymentMethodSummary[] = stripeCards.map((c, idx) => ({
        id: -1 - idx, // negative synthetic ID to avoid collision with rail account PKs
        rail: 'card' as PaymentRail,
        label: c.brand ? `${c.brand.toUpperCase()} ••••${c.last4}` : `Card ••••${c.last4 ?? '????'}`,
        status: 'active' as PaymentMethodSummary['status'],
        isDefault: c.isDefault,
        metadata: {
          stripePaymentMethodId: c.id,
          brand: c.brand,
          last4: c.last4,
          expMonth: c.expMonth,
          expYear: c.expYear,
        },
        createdAt: new Date(),
      }));
      return [...railMethods, ...cardMethods];
    } catch (err) {
      logger.warn({ err, orgId }, '[rail-adapter] Failed to fetch Stripe card methods; returning rail-only methods');
    }
  }

  return railMethods;
}

// ─── Add payment method ────────────────────────────────────────────────────────

export type AddPaymentMethodPayload =
  | { rail: 'ach'; processorToken: string; accountId: string; institutionName?: string; accountName?: string; accountMask?: string; plaidItemId?: string; demo?: boolean }
  | { rail: 'crypto'; address?: string; demo?: boolean }
  | { rail: 'card'; stripePaymentMethodId: string };

export async function addPaymentMethod(
  orgId: number,
  payload: AddPaymentMethodPayload,
): Promise<RailResult<PaymentMethodSummary>> {
  try {
    if (payload.rail === 'ach') {
      const { processorToken, accountId, institutionName, accountName, accountMask, plaidItemId, demo } = payload;

      let stripePaymentMethodId: string | null = null;
      let stripeCustomerId: string | null = null;

      if (!demo) {
        const [org] = await db
          .select({ billingCustomerId: organizationsTable.billingCustomerId })
          .from(organizationsTable)
          .where(eq(organizationsTable.id, orgId));

        if (org?.billingCustomerId) {
          stripeCustomerId = org.billingCustomerId;
          // Step 1: convert the Plaid processor token → Stripe btok_*
          const bankAccountToken = await services.stripe.createBankAccountTokenFromPlaid(processorToken);
          // Step 2: attach btok_* to the customer to get a proper ba_* bank account ID
          // that can be used with Stripe's ACH charging APIs. Never store btok_* directly.
          const attachedBankAccount = await services.stripe.attachBankAccountToCustomer(
            stripeCustomerId,
            bankAccountToken.id,
          );
          stripePaymentMethodId = attachedBankAccount.id; // ba_* or ba_demo_*
        }
      }

      const label = [institutionName, accountName, accountMask ? `••••${accountMask}` : null]
        .filter(Boolean)
        .join(' — ') || 'Bank account';

      const [inserted] = await db
        .insert(billingRailAccountsTable)
        .values({
          orgId,
          rail: 'ach',
          externalAccountId: stripePaymentMethodId ?? `plaid-${accountId}`,
          accountLabel: label,
          status: 'active',
          isDefault: false,
          verifiedAt: new Date(),
          metadata: {
            plaidItemId: plaidItemId ?? null,
            plaidAccountId: accountId,
            processorToken: null,
            stripePaymentMethodId,
            stripeCustomerId,
            institutionName: institutionName ?? null,
            accountName: accountName ?? null,
            accountMask: accountMask ?? null,
            demo: demo ?? false,
          },
        })
        .returning();

      if (!inserted) throw new Error('Failed to insert ACH rail account');

      return {
        success: true,
        data: {
          id: inserted.id,
          rail: 'ach',
          label,
          status: 'active',
          isDefault: inserted.isDefault,
          createdAt: inserted.createdAt,
        },
      };
    }

    if (payload.rail === 'crypto') {
      const label = payload.address ? `Crypto wallet ${payload.address.slice(0, 10)}…` : 'Crypto payments';
      const [inserted] = await db
        .insert(billingRailAccountsTable)
        .values({
          orgId,
          rail: 'crypto',
          externalAccountId: payload.address ?? null,
          accountLabel: label,
          status: 'active',
          isDefault: false,
          verifiedAt: new Date(),
          metadata: { address: payload.address ?? null, demo: payload.demo ?? false },
        })
        .returning();

      if (!inserted) throw new Error('Failed to insert crypto rail account');

      return {
        success: true,
        data: {
          id: inserted.id,
          rail: 'crypto',
          label,
          status: 'active',
          isDefault: inserted.isDefault,
          createdAt: inserted.createdAt,
        },
      };
    }

    return { success: false, error: 'Unsupported rail', errorCode: 'UNSUPPORTED_RAIL' };
  } catch (err) {
    logger.error({ err, orgId, rail: payload.rail }, '[rail-adapter] Failed to add payment method');
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'ADD_PAYMENT_METHOD_FAILED',
    };
  }
}

// ─── Charge invoice ────────────────────────────────────────────────────────────

export async function chargeInvoice(
  invoiceId: number,
  rail: PaymentRail,
  paymentMethodId: number,
  orgId: number,
): Promise<RailResult<ChargeInvoiceResult>> {
  try {
    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.orgId, orgId)));

    if (!invoice) {
      return { success: false, error: 'Invoice not found', errorCode: 'INVOICE_NOT_FOUND' };
    }

    if (invoice.status === 'paid') {
      return { success: false, error: 'Invoice is already paid', errorCode: 'ALREADY_PAID' };
    }

    if (invoice.status === 'void') {
      return { success: false, error: 'Invoice is void', errorCode: 'INVOICE_VOID' };
    }

    // Card with a negative synthetic ID comes from getPaymentMethods() Stripe
    // card listing. Decode the Stripe PM without a billingRailAccountsTable row.
    if (rail === 'card' && paymentMethodId < 0) {
      return chargeInvoiceCardBySyntheticId(invoice, paymentMethodId, orgId);
    }

    const [railAccount] = await db
      .select()
      .from(billingRailAccountsTable)
      .where(
        and(
          eq(billingRailAccountsTable.id, paymentMethodId),
          eq(billingRailAccountsTable.orgId, orgId),
        ),
      );

    if (!railAccount) {
      return {
        success: false,
        error: 'Payment method not found',
        errorCode: 'PAYMENT_METHOD_NOT_FOUND',
      };
    }

    if (rail === 'ach') {
      return chargeInvoiceAch(invoice, railAccount, orgId);
    }

    if (rail === 'crypto') {
      return chargeInvoiceCrypto(invoice, railAccount, orgId);
    }

    if (rail === 'card') {
      return chargeInvoiceCard(invoice, railAccount, orgId);
    }

    return { success: false, error: 'Unsupported rail', errorCode: 'UNSUPPORTED_RAIL' };
  } catch (err) {
    logger.error({ err, invoiceId, rail, orgId }, '[rail-adapter] chargeInvoice failed');
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorCode: 'CHARGE_FAILED',
    };
  }
}

async function chargeInvoiceAch(
  invoice: typeof invoicesTable.$inferSelect,
  railAccount: typeof billingRailAccountsTable.$inferSelect,
  orgId: number,
): Promise<RailResult<ChargeInvoiceResult>> {
  const meta = (railAccount.metadata as Record<string, unknown>) ?? {};
  const isDemo = !!(meta['demo'] as boolean);
  const stripePaymentMethodId = meta['stripePaymentMethodId'] as string | undefined;
  const stripeCustomerId = meta['stripeCustomerId'] as string | undefined;

  // Block charges on accounts awaiting micro-deposit verification.
  if (railAccount.status === 'pending_verification') {
    logger.warn({ orgId, invoiceId: invoice.id, railAccountId: railAccount.id },
      '[rail-adapter] ACH charge rejected — bank account is pending micro-deposit verification');
    return {
      success: false,
      error: 'Bank account is awaiting micro-deposit verification. Check your bank account for two small deposits and complete verification.',
      errorCode: 'ACH_PENDING_VERIFICATION',
    };
  }

  if (isDemo) {
    // Explicit demo mode: ACH bank account was enrolled without live Stripe credentials.
    const demoRef = `ach_demo_${Date.now()}`;
    await db
      .update(invoicesTable)
      .set({ status: 'ach_pending', updatedAt: new Date() })
      .where(eq(invoicesTable.id, invoice.id));

    await writeBillingAudit({
      orgId,
      action: 'invoice.ach.pending',
      resource: 'invoice',
      resourceId: String(invoice.id),
      after: { rail: 'ach', status: 'ach_pending', ref: demoRef, demo: true },
    });

    return {
      success: true,
      data: {
        status: 'pending',
        rail: 'ach',
        externalRef: demoRef,
        demo: true,
      },
    };
  }

  // Live mode: fail fast if Stripe linkage is incomplete rather than silently
  // falling back to a demo path that would return success without moving money.
  if (!stripePaymentMethodId) {
    logger.error({ orgId, invoiceId: invoice.id, railAccountId: railAccount.id },
      '[rail-adapter] ACH charge attempted without a linked Stripe payment method');
    return {
      success: false,
      error: 'ACH payment method is not linked to a Stripe instrument. Re-enroll the bank account.',
      errorCode: 'ACH_STRIPE_PM_MISSING',
    };
  }
  if (!stripeCustomerId) {
    logger.error({ orgId, invoiceId: invoice.id },
      '[rail-adapter] ACH charge attempted without a Stripe customer ID on the organization');
    return {
      success: false,
      error: 'Organization does not have a Stripe billing customer. Complete billing setup first.',
      errorCode: 'ACH_STRIPE_CUSTOMER_MISSING',
    };
  }

  const amountCents = Math.round(parseFloat(invoice.amount) * 100);

  const charge = await services.stripe.createAchCharge({
    amount: amountCents,
    currency: invoice.currency,
    customerId: stripeCustomerId,
    paymentMethodId: stripePaymentMethodId,
    invoiceId: invoice.stripeInvoiceId ?? String(invoice.id),
    orgId,
    internalInvoiceId: String(invoice.id),
  });

  const status = charge.status === 'succeeded' ? 'succeeded' : 'pending';

  if (status === 'succeeded') {
    await db
      .update(invoicesTable)
      .set({ status: 'paid', paidAt: new Date() })
      .where(eq(invoicesTable.id, invoice.id));
  } else {
    // ACH settlement takes 3–5 business days. Persist a distinct 'ach_pending'
    // status so the invoice is not confused with an unpaid-and-unsent 'open'
    // invoice. Webhooks (charge.succeeded / charge.failed) will update this further.
    await db
      .update(invoicesTable)
      .set({ status: 'ach_pending', updatedAt: new Date() })
      .where(eq(invoicesTable.id, invoice.id));
  }

  await db.insert(revenueEventsTable).values({
    eventType: 'ach.charge.initiated',
    product: 'platform',
    customerId: stripeCustomerId,
    invoiceId: invoice.stripeInvoiceId ?? undefined,
    amount: invoice.amount,
    currency: invoice.currency,
    idempotencyKey: `ach-charge-${invoice.id}-${charge.id}`,
    metadata: { rail: 'ach', chargeId: charge.id, orgId, internalInvoiceId: String(invoice.id) },
  }).onConflictDoNothing();

  await writeBillingAudit({
    orgId,
    action: `invoice.ach.${status}`,
    resource: 'invoice',
    resourceId: String(invoice.id),
    stripeCustomerId,
    after: { rail: 'ach', status, chargeId: charge.id },
  });

  return {
    success: true,
    data: {
      status,
      rail: 'ach',
      externalRef: charge.id,
    },
  };
}

async function chargeInvoiceCrypto(
  invoice: typeof invoicesTable.$inferSelect,
  railAccount: typeof billingRailAccountsTable.$inferSelect,
  orgId: number,
): Promise<RailResult<ChargeInvoiceResult>> {
  const { createCharge } = await import('./coinbase-adapter');

  const charge = await createCharge({
    name: `Invoice #${invoice.id}`,
    description: `Payment for invoice ${invoice.stripeInvoiceId ?? invoice.id}`,
    amountUsd: invoice.amount,
    currency: invoice.currency.toUpperCase(),
    metadata: {
      invoiceId: String(invoice.id),
      orgId: String(orgId),
      stripeInvoiceId: invoice.stripeInvoiceId ?? '',
      railAccountId: String(railAccount.id),
    },
    redirectUrl: process.env.APP_URL
      ? `${process.env.APP_URL}/billing/invoices/${invoice.id}?payment=success`
      : undefined,
    cancelUrl: process.env.APP_URL
      ? `${process.env.APP_URL}/billing/invoices/${invoice.id}?payment=cancelled`
      : undefined,
  });

  // Transition invoice to crypto_pending so reconciliation can distinguish
  // "charge created, awaiting on-chain confirmation" from "unpaid open".
  await db
    .update(invoicesTable)
    .set({ status: 'crypto_pending', updatedAt: new Date() })
    .where(eq(invoicesTable.id, invoice.id));

  await writeBillingAudit({
    orgId,
    action: 'invoice.crypto.charge_created',
    resource: 'invoice',
    resourceId: String(invoice.id),
    after: {
      rail: 'crypto',
      coinbaseChargeId: charge.chargeId,
      coinbaseCode: charge.code,
      hostedUrl: charge.hostedUrl,
      demo: charge.demo ?? false,
    },
  });

  return {
    success: true,
    data: {
      status: 'pending',
      rail: 'crypto',
      externalRef: charge.chargeId,
      hostedUrl: charge.hostedUrl,
      demo: charge.demo,
    },
  };
}

// ─── Card rail ────────────────────────────────────────────────────────────────

/**
 * chargeInvoiceCardBySyntheticId — charges a Stripe card returned by
 * getPaymentMethods() where the ID is a negative synthetic value encoding the
 * card's 0-based index in the org's Stripe PM list (`id = -(idx + 1)`).
 *
 * This function re-fetches the Stripe PM list to decode the actual pm_xxx
 * identifier without requiring the card to be stored in billingRailAccountsTable.
 */
async function chargeInvoiceCardBySyntheticId(
  invoice: typeof invoicesTable.$inferSelect,
  syntheticId: number, // negative integer: id = -(idx + 1)
  orgId: number,
): Promise<RailResult<ChargeInvoiceResult>> {
  const [org] = await db
    .select({ billingCustomerId: organizationsTable.billingCustomerId })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, orgId));

  if (!org?.billingCustomerId) {
    return {
      success: false,
      error: 'Organization does not have a Stripe billing customer.',
      errorCode: 'CARD_STRIPE_CUSTOMER_MISSING',
    };
  }

  const cardIdx = -syntheticId - 1; // decode: syntheticId = -(idx + 1)
  const stripeCards = await services.stripe.listPaymentMethods(org.billingCustomerId, 'card');
  const card = stripeCards[cardIdx];
  if (!card) {
    return {
      success: false,
      error: 'Card payment method not found.',
      errorCode: 'PAYMENT_METHOD_NOT_FOUND',
    };
  }

  // Build a minimal stub so we can delegate to the shared chargeInvoiceCard path.
  const stub = {
    id: syntheticId,
    orgId,
    rail: 'card' as const,
    externalAccountId: card.id,
    accountLabel: `${card.brand ?? 'Card'} ••••${card.last4 ?? '????'}`,
    status: 'active' as const,
    isDefault: card.isDefault,
    metadata: { stripePaymentMethodId: card.id, demo: false },
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return chargeInvoiceCard(invoice, stub, orgId);
}

async function chargeInvoiceCard(
  invoice: typeof invoicesTable.$inferSelect,
  railAccount: typeof billingRailAccountsTable.$inferSelect,
  orgId: number,
): Promise<RailResult<ChargeInvoiceResult>> {
  const meta = (railAccount.metadata as Record<string, unknown>) ?? {};
  const stripePaymentMethodId = meta['stripePaymentMethodId'] as string | undefined;
  const isDemo = !!(meta['demo'] as boolean);

  if (isDemo || !services.stripe.isLive) {
    // Demo: simulate an instant card approval.
    const demoRef = `card_demo_${Date.now()}`;
    await db
      .update(invoicesTable)
      .set({ status: 'paid', paidAt: new Date() })
      .where(eq(invoicesTable.id, invoice.id));

    await writeBillingAudit({
      orgId,
      action: 'invoice.card.paid',
      resource: 'invoice',
      resourceId: String(invoice.id),
      after: { rail: 'card', ref: demoRef, demo: true },
    });

    return { success: true, data: { status: 'succeeded', rail: 'card', externalRef: demoRef, demo: true } };
  }

  if (!stripePaymentMethodId) {
    return {
      success: false,
      error: 'Card payment method is not linked to a Stripe instrument.',
      errorCode: 'CARD_STRIPE_PM_MISSING',
    };
  }

  // If the invoice already has a Stripe invoice ID, pay it via the Stripe
  // Invoices API so the charge is reflected in the Stripe dashboard.
  if (invoice.stripeInvoiceId) {
    const paidInvoice = await services.stripe.payStripeInvoice(
      invoice.stripeInvoiceId,
      stripePaymentMethodId,
    );
    const succeeded = paidInvoice.status === 'paid';
    if (succeeded) {
      await db
        .update(invoicesTable)
        .set({ status: 'paid', paidAt: new Date() })
        .where(eq(invoicesTable.id, invoice.id));
    }
    await writeBillingAudit({
      orgId,
      action: succeeded ? 'invoice.card.paid' : 'invoice.card.failed',
      resource: 'invoice',
      resourceId: String(invoice.id),
      stripeInvoiceId: invoice.stripeInvoiceId,
      after: { rail: 'card', stripeStatus: paidInvoice.status },
    });
    return {
      success: succeeded,
      data: succeeded ? { status: 'succeeded', rail: 'card', externalRef: invoice.stripeInvoiceId } : undefined,
      error: succeeded ? undefined : 'Card charge failed',
      errorCode: succeeded ? undefined : 'CARD_CHARGE_FAILED',
    };
  }

  // No Stripe invoice: create a PaymentIntent directly.
  const amountCents = Math.round(parseFloat(invoice.amount) * 100);
  const intent = await services.stripe.createPaymentIntentForRail({
    amount: amountCents,
    currency: invoice.currency,
    paymentMethodId: stripePaymentMethodId,
    internalInvoiceId: String(invoice.id),
    orgId,
  });

  const succeeded = intent.status === 'succeeded';
  if (succeeded) {
    await db
      .update(invoicesTable)
      .set({ status: 'paid', paidAt: new Date() })
      .where(eq(invoicesTable.id, invoice.id));
  }

  await writeBillingAudit({
    orgId,
    action: succeeded ? 'invoice.card.paid' : 'invoice.card.failed',
    resource: 'invoice',
    resourceId: String(invoice.id),
    after: { rail: 'card', paymentIntentId: intent.id, stripeStatus: intent.status },
  });

  return {
    success: succeeded,
    data: succeeded ? { status: 'succeeded', rail: 'card', externalRef: intent.id } : undefined,
    error: succeeded ? undefined : 'Card charge failed',
    errorCode: succeeded ? undefined : 'CARD_CHARGE_FAILED',
  };
}

// ─── Handle rail webhook ───────────────────────────────────────────────────────

export async function handleRailWebhook(
  rail: 'plaid' | 'coinbase',
  payload: Record<string, unknown>,
): Promise<{ handled: boolean; action?: string }> {
  if (rail === 'plaid') {
    return handlePlaidWebhook(payload);
  }
  if (rail === 'coinbase') {
    return handleCoinbaseWebhookPayload(payload);
  }
  return { handled: false };
}

async function handlePlaidWebhook(
  payload: Record<string, unknown>,
): Promise<{ handled: boolean; action?: string }> {
  const webhookType = payload['webhook_type'] as string;
  const webhookCode = payload['webhook_code'] as string;
  const itemId = payload['item_id'] as string;

  logger.info({ webhookType, webhookCode, itemId }, '[rail-adapter] Plaid webhook received');

  // ── Micro-deposit verification state machine ─────────────────────────────
  // Plaid signals micro-deposit verification via AUTH or ITEM webhooks when
  // instant auth is unavailable. We update the rail account status so the
  // account cannot be charged until it's verified.

  if (webhookType === 'AUTH' && webhookCode === 'AUTOMATICALLY_VERIFIED') {
    // Micro-deposit verification completed automatically. Mark the account active.
    const rows = await db
      .select()
      .from(billingRailAccountsTable)
      .where(eq(billingRailAccountsTable.rail, 'ach'));
    const matchingRow = rows.find((r) => {
      const meta = r.metadata as Record<string, unknown>;
      return meta?.['plaidItemId'] === itemId;
    });
    if (matchingRow) {
      await db
        .update(billingRailAccountsTable)
        .set({ status: 'active', verifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(billingRailAccountsTable.id, matchingRow.id));
      await writeBillingAudit({
        orgId: matchingRow.orgId,
        action: 'ach.bank_account.verified',
        resource: 'billing_rail_account',
        resourceId: String(matchingRow.id),
        after: { plaidItemId: itemId, method: 'automatic_micro_deposit' },
      });
    }
    return { handled: true, action: 'plaid_auth_automatically_verified' };
  }

  if (webhookType === 'AUTH' && webhookCode === 'VERIFICATION_EXPIRED') {
    // Micro-deposit verification expired. Mark account inactive.
    const rows = await db
      .select()
      .from(billingRailAccountsTable)
      .where(eq(billingRailAccountsTable.rail, 'ach'));
    const matchingRow = rows.find((r) => {
      const meta = r.metadata as Record<string, unknown>;
      return meta?.['plaidItemId'] === itemId;
    });
    if (matchingRow) {
      await db
        .update(billingRailAccountsTable)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(billingRailAccountsTable.id, matchingRow.id));
      await writeBillingAudit({
        orgId: matchingRow.orgId,
        action: 'ach.bank_account.verification_expired',
        resource: 'billing_rail_account',
        resourceId: String(matchingRow.id),
        after: { plaidItemId: itemId },
      });
    }
    return { handled: true, action: 'plaid_auth_verification_expired' };
  }

  if (webhookType === 'ITEM' && webhookCode === 'PENDING_AUTOMATIC_VERIFICATION') {
    // Instant auth unavailable; Plaid has initiated micro-deposit verification.
    // Mark the account as pending so it cannot be charged until verified.
    const rows = await db
      .select()
      .from(billingRailAccountsTable)
      .where(eq(billingRailAccountsTable.rail, 'ach'));
    const matchingRow = rows.find((r) => {
      const meta = r.metadata as Record<string, unknown>;
      return meta?.['plaidItemId'] === itemId;
    });
    if (matchingRow) {
      await db
        .update(billingRailAccountsTable)
        .set({ status: 'pending_verification', verifiedAt: null, updatedAt: new Date() })
        .where(eq(billingRailAccountsTable.id, matchingRow.id));
      await writeBillingAudit({
        orgId: matchingRow.orgId,
        action: 'ach.bank_account.pending_verification',
        resource: 'billing_rail_account',
        resourceId: String(matchingRow.id),
        after: { plaidItemId: itemId, method: 'micro_deposit' },
      });
    }
    return { handled: true, action: 'plaid_item_pending_automatic_verification' };
  }

  if (webhookType === 'ITEM' && webhookCode === 'ERROR') {
    const error = payload['error'] as { error_code?: string; error_message?: string } | null;
    logger.warn({ itemId, error }, '[rail-adapter] Plaid item error received');

    const rows = await db
      .select()
      .from(billingRailAccountsTable)
      .where(eq(billingRailAccountsTable.rail, 'ach'));

    const matchingRow = rows.find((r) => {
      const meta = r.metadata as Record<string, unknown>;
      return meta?.['plaidItemId'] === itemId;
    });

    if (matchingRow) {
      await db
        .update(billingRailAccountsTable)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(billingRailAccountsTable.id, matchingRow.id));

      await writeBillingAudit({
        orgId: matchingRow.orgId,
        action: 'ach.plaid_item.error',
        resource: 'billing_rail_account',
        resourceId: String(matchingRow.id),
        after: { plaidItemId: itemId, errorCode: error?.error_code, errorMessage: error?.error_message },
      });
    }

    return { handled: true, action: 'plaid_item_error' };
  }

  if (webhookType === 'ITEM' && webhookCode === 'PENDING_EXPIRATION') {
    logger.warn({ itemId }, '[rail-adapter] Plaid item pending expiration');
    return { handled: true, action: 'plaid_item_pending_expiration' };
  }

  return { handled: true, action: 'plaid_webhook_acknowledged' };
}

/**
 * triggerCryptoDunning — sends rail-specific dunning emails when a Coinbase
 * charge fails, expires, or is delayed. Uses the same org-admin lookup
 * pattern as the Stripe ACH dunning in billing-webhook.ts.
 */
async function triggerCryptoDunning(
  invoice: typeof invoicesTable.$inferSelect,
  eventType: string,
  chargeId: string,
): Promise<void> {
  const { sendEmail, buildCryptoPaymentFailedEmail, buildCryptoPaymentFailedEmailSubject } = await import('./email');
  const { pool } = await import('@szl-holdings/db');

  const userRes = await pool.query<{ email: string; display_name: string }>(
    `SELECT u.email, u.display_name
     FROM users u
     JOIN user_organizations uo ON uo.user_id = u.id
     WHERE uo.org_id = $1 AND uo.role IN ('owner','admin','ops')
     LIMIT 3`,
    [invoice.orgId],
  );

  type CryptoReason = 'failed' | 'expired' | 'underpaid' | 'overpaid' | 'delayed';
  const reasonMap: Record<string, CryptoReason> = {
    'charge:failed': 'failed',
    'charge:expired': 'expired',
    'charge:delayed': 'delayed',
  };
  const reason: CryptoReason = reasonMap[eventType] ?? 'failed';

  for (const row of userRes.rows) {
    void sendEmail({
      to: row.email,
      subject: buildCryptoPaymentFailedEmailSubject({ reason, invoiceId: String(invoice.id) }),
      html: buildCryptoPaymentFailedEmail({
        userName: row.display_name ?? row.email,
        invoiceId: String(invoice.id),
        amount: invoice.amount,
        currency: invoice.currency.toUpperCase(),
        reason,
        coinbaseChargeCode: chargeId,
      }),
      text: `Crypto payment issue (${eventType}) for Invoice #${invoice.id}. Charge: ${chargeId}`,
    });
  }
}

async function handleCoinbaseWebhookPayload(
  payload: Record<string, unknown>,
): Promise<{ handled: boolean; action?: string }> {
  const eventType = payload['type'] as string;
  const eventId = payload['id'] as string;
  const data = payload['data'] as Record<string, unknown> | undefined;
  const chargeData = data as {
    id?: string;
    code?: string;
    metadata?: Record<string, string>;
    pricing?: { local?: { amount?: string; currency?: string } };
    payments?: Array<{ network?: string; transaction_id?: string }>;
  } | undefined;

  logger.info({ eventType, eventId }, '[rail-adapter] Coinbase Commerce webhook received');

  const chargeId = chargeData?.id;
  const metadata = chargeData?.metadata ?? {};
  const invoiceId = metadata['invoiceId'] ? parseInt(metadata['invoiceId'], 10) : null;
  const orgId = metadata['orgId'] ? parseInt(metadata['orgId'], 10) : null;
  const stripeInvoiceId = metadata['stripeInvoiceId'] ?? null;

  if (!invoiceId || !orgId) {
    logger.warn(
      { eventType, chargeId, metadata },
      '[rail-adapter] Coinbase webhook missing invoiceId/orgId in metadata',
    );
    return { handled: false };
  }

  if (eventType === 'charge:confirmed') {
    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.orgId, orgId)));

    if (!invoice) {
      logger.warn({ invoiceId, orgId }, '[rail-adapter] Coinbase: invoice not found');
      return { handled: false };
    }

    if (invoice.status === 'paid') {
      logger.info({ invoiceId }, '[rail-adapter] Coinbase: invoice already paid — idempotent skip');
      return { handled: true, action: 'coinbase_already_paid' };
    }

    await db
      .update(invoicesTable)
      .set({ status: 'paid', paidAt: new Date() })
      .where(eq(invoicesTable.id, invoiceId));

    const payment = chargeData?.payments?.[0];
    await db.insert(revenueEventsTable).values({
      eventType: 'crypto.charge.confirmed',
      product: 'platform',
      invoiceId: stripeInvoiceId ?? undefined,
      amount: chargeData?.pricing?.local?.amount ?? invoice.amount,
      currency: chargeData?.pricing?.local?.currency ?? invoice.currency,
      idempotencyKey: `coinbase-confirmed-${eventId}`,
      metadata: {
        rail: 'crypto',
        coinbaseChargeId: chargeId,
        coinbaseEventId: eventId,
        network: payment?.network,
        transactionId: payment?.transaction_id,
        orgId,
      },
    }).onConflictDoNothing();

    // Sync Stripe invoice state: mark as paid-out-of-band so Stripe's ledger
    // reflects the on-chain settlement without re-charging the customer.
    if (stripeInvoiceId) {
      try {
        await services.stripe.markInvoicePaidOutOfBand(stripeInvoiceId);
        logger.info({ stripeInvoiceId, invoiceId }, '[rail-adapter] Stripe invoice marked paid out-of-band');
      } catch (err) {
        logger.warn({ err, stripeInvoiceId, invoiceId },
          '[rail-adapter] Stripe out-of-band reconciliation failed (non-fatal)');
      }
    }

    await writeBillingAudit({
      orgId,
      action: 'invoice.crypto.confirmed',
      resource: 'invoice',
      resourceId: String(invoiceId),
      after: {
        rail: 'crypto',
        coinbaseChargeId: chargeId,
        network: payment?.network,
        transactionId: payment?.transaction_id,
        stripeInvoiceId,
      },
    });

    logger.info({ invoiceId, chargeId }, '[rail-adapter] Coinbase: invoice marked paid');
    return { handled: true, action: 'coinbase_invoice_paid' };
  }

  if (eventType === 'charge:failed' || eventType === 'charge:expired' || eventType === 'charge:delayed') {
    // Idempotency: skip if we already recorded this specific Coinbase event to
    // prevent duplicate dunning emails on webhook retries.
    const existingEvent = await db
      .select({ id: revenueEventsTable.id })
      .from(revenueEventsTable)
      .where(eq(revenueEventsTable.idempotencyKey, `coinbase-failed-${eventId}`))
      .then((rows) => rows[0]);
    if (existingEvent) {
      logger.info({ eventId, invoiceId }, '[rail-adapter] Coinbase: failure event already processed — idempotent skip');
      return { handled: true, action: 'coinbase_failure_already_processed' };
    }

    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.orgId, orgId)));

    if (invoice && invoice.status !== 'paid' && invoice.status !== 'void') {
      await db
        .update(invoicesTable)
        .set({ status: 'open' })
        .where(eq(invoicesTable.id, invoiceId));
    }

    const failureReasonMap: Record<string, string> = {
      'charge:failed': 'payment_failed',
      'charge:expired': 'payment_expired',
      'charge:delayed': 'payment_delayed',
    };

    // Persist the failure event with the unique eventId-based idempotency key
    // BEFORE triggering dunning. This is the canonical marker the idempotency
    // check at the top of this handler reads on subsequent webhook retries.
    await db.insert(revenueEventsTable).values({
      eventType: 'crypto.charge.failed',
      product: 'platform',
      invoiceId: invoice?.stripeInvoiceId ?? undefined,
      amount: invoice?.amount ?? '0',
      currency: invoice?.currency ?? 'usd',
      idempotencyKey: `coinbase-failed-${eventId}`,
      metadata: {
        rail: 'crypto',
        coinbaseChargeId: chargeId,
        coinbaseEventId: eventId,
        reason: failureReasonMap[eventType] ?? 'unknown',
        orgId,
        internalInvoiceId: String(invoiceId),
      },
    }).onConflictDoNothing();

    await writeBillingAudit({
      orgId,
      action: `invoice.crypto.${eventType.replace('charge:', '')}`,
      resource: 'invoice',
      resourceId: String(invoiceId),
      after: {
        rail: 'crypto',
        coinbaseChargeId: chargeId,
        reason: failureReasonMap[eventType] ?? 'unknown',
      },
    });

    // Dunning: notify org admins via rail-specific email template
    if (invoice) {
      void triggerCryptoDunning(invoice, eventType, chargeId ?? 'unknown').catch(
        (err: unknown) => logger.warn({ err, invoiceId }, '[rail-adapter] Crypto dunning email failed'),
      );
    }

    logger.info({ invoiceId, chargeId, eventType }, '[rail-adapter] Coinbase: invoice returned to open');
    return { handled: true, action: 'coinbase_invoice_failed' };
  }

  return { handled: true, action: 'coinbase_webhook_acknowledged' };
}
