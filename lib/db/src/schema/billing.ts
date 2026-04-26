import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations';

export const billingPlansTable = pgTable('billing_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  priceMonthly: numeric('price_monthly', { precision: 10, scale: 2 }).notNull(),
  priceYearly: numeric('price_yearly', { precision: 10, scale: 2 }),
  features: jsonb('features'),
  stripePriceId: text('stripe_price_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const subscriptionsTable = pgTable(
  'subscriptions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    planId: integer('plan_id')
      .notNull()
      .references(() => billingPlansTable.id),
    status: text('status', { enum: ['active', 'trialing', 'past_due', 'canceled', 'paused'] })
      .notNull()
      .default('active'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    canceledAt: timestamp('canceled_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('subscriptions_org_id_idx').on(t.orgId),
    index('subscriptions_status_idx').on(t.status),
    index('subscriptions_stripe_id_idx').on(t.stripeSubscriptionId),
  ],
);

export const invoicesTable = pgTable(
  'invoices',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    subscriptionId: integer('subscription_id').references(() => subscriptionsTable.id),
    stripeInvoiceId: text('stripe_invoice_id'),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('usd'),
    status: text('status', { enum: ['draft', 'open', 'paid', 'void', 'uncollectible'] })
      .notNull()
      .default('draft'),
    paidAt: timestamp('paid_at'),
    dueDate: timestamp('due_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('invoices_org_id_idx').on(t.orgId),
    index('invoices_stripe_id_idx').on(t.stripeInvoiceId),
  ],
);

export const entitlementsTable = pgTable('entitlements', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id')
    .notNull()
    .references(() => billingPlansTable.id, { onDelete: 'cascade' }),
  featureKey: text('feature_key').notNull(),
  featureName: text('feature_name').notNull(),
  type: text('type', { enum: ['boolean', 'limit', 'usage'] })
    .notNull()
    .default('boolean'),
  limitValue: integer('limit_value'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usageEventsTable = pgTable(
  'usage_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    quantity: integer('quantity').notNull().default(1),
    metadata: jsonb('metadata'),
    recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  },
  (t) => [
    index('usage_events_org_feature_idx').on(t.orgId, t.featureKey, sql`${t.recordedAt} DESC`),
  ],
);

export const insertBillingPlanSchema = createInsertSchema(billingPlansTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBillingPlan = z.infer<typeof insertBillingPlanSchema>;
export type BillingPlan = typeof billingPlansTable.$inferSelect;

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;

export const insertEntitlementSchema = createInsertSchema(entitlementsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEntitlement = z.infer<typeof insertEntitlementSchema>;
export type Entitlement = typeof entitlementsTable.$inferSelect;

export const insertUsageEventSchema = createInsertSchema(usageEventsTable).omit({
  id: true,
  recordedAt: true,
});
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type UsageEvent = typeof usageEventsTable.$inferSelect;

export const fulfillmentsTable = pgTable(
  'fulfillments',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    stripeSessionId: text('stripe_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    product: text('product').notNull(),
    tierId: text('tier_id').notNull(),
    tierName: text('tier_name').notNull(),
    customerEmail: text('customer_email'),
    amount: numeric('amount', { precision: 10, scale: 2 }),
    currency: text('currency').notNull().default('usd'),
    status: text('status', { enum: ['pending', 'fulfilled', 'refunded', 'failed'] })
      .notNull()
      .default('pending'),
    metadata: jsonb('metadata'),
    fulfilledAt: timestamp('fulfilled_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('fulfillments_org_id_idx').on(t.orgId),
    index('fulfillments_session_id_idx').on(t.stripeSessionId),
    index('fulfillments_product_idx').on(t.product),
  ],
);

export const insertFulfillmentSchema = createInsertSchema(fulfillmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFulfillment = z.infer<typeof insertFulfillmentSchema>;
export type Fulfillment = typeof fulfillmentsTable.$inferSelect;

export const entitlementOverridesTable = pgTable(
  'entitlement_overrides',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    granted: boolean('granted').notNull().default(true),
    reason: text('reason'),
    grantedBy: integer('granted_by'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('entitlement_overrides_org_feature_idx').on(t.orgId, t.featureKey),
  ],
);

export const insertEntitlementOverrideSchema = createInsertSchema(entitlementOverridesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEntitlementOverride = z.infer<typeof insertEntitlementOverrideSchema>;
export type EntitlementOverride = typeof entitlementOverridesTable.$inferSelect;

// ─── Billing Webhook Event Dedupe ─────────────────────────────────────────────
// Stores every processed Stripe event ID so duplicate webhook deliveries are
// silently dropped without re-executing side-effects. This is the primary
// idempotency guard for the centralized webhook dispatcher.

export const billingWebhookEventsTable = pgTable(
  'billing_webhook_events',
  {
    id: serial('id').primaryKey(),
    stripeEventId: text('stripe_event_id').notNull(),
    eventType: text('event_type').notNull(),
    processedAt: timestamp('processed_at').notNull().defaultNow(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['processing', 'processed', 'skipped', 'failed'] })
      .notNull()
      .default('processing'),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata'),
  },
  (t) => [
    unique('billing_webhook_events_stripe_event_id_unique').on(t.stripeEventId),
    index('billing_webhook_events_event_type_idx').on(t.eventType),
    index('billing_webhook_events_processed_at_idx').on(t.processedAt),
  ],
);

export const insertBillingWebhookEventSchema = createInsertSchema(billingWebhookEventsTable).omit({
  id: true,
  processedAt: true,
});
export type InsertBillingWebhookEvent = z.infer<typeof insertBillingWebhookEventSchema>;
export type BillingWebhookEvent = typeof billingWebhookEventsTable.$inferSelect;

// ─── Billing Payment Methods ──────────────────────────────────────────────────
// Mirrors Stripe payment method objects per org/customer so the frontend can
// display saved cards without a live Stripe round-trip on every page load.

export const billingPaymentMethodsTable = pgTable(
  'billing_payment_methods',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    stripePaymentMethodId: text('stripe_payment_method_id').notNull(),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    type: text('type').notNull().default('card'),
    brand: text('brand'),
    last4: text('last4'),
    expMonth: integer('exp_month'),
    expYear: integer('exp_year'),
    isDefault: boolean('is_default').notNull().default(false),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('billing_payment_methods_stripe_pm_id_unique').on(t.stripePaymentMethodId),
    index('billing_payment_methods_org_id_idx').on(t.orgId),
    index('billing_payment_methods_customer_id_idx').on(t.stripeCustomerId),
  ],
);

export const insertBillingPaymentMethodSchema = createInsertSchema(billingPaymentMethodsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBillingPaymentMethod = z.infer<typeof insertBillingPaymentMethodSchema>;
export type BillingPaymentMethod = typeof billingPaymentMethodsTable.$inferSelect;

// ─── Billing Refund Requests ──────────────────────────────────────────────────
// Tracks refund requests before and after Stripe processes them. The multi-step
// approval workflow is handled by the custom-refund-workflow task; this table
// is the shared data contract between that workflow and the billing foundation.

export const billingRefundRequestsTable = pgTable(
  'billing_refund_requests',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    stripeChargeId: text('stripe_charge_id'),
    stripeRefundId: text('stripe_refund_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    amount: numeric('amount', { precision: 10, scale: 2 }),
    currency: text('currency').notNull().default('usd'),
    reason: text('reason', { enum: ['duplicate', 'fraudulent', 'requested_by_customer', 'other'] })
      .notNull()
      .default('requested_by_customer'),
    status: text('status', {
      enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed'],
    })
      .notNull()
      .default('pending'),
    requestedBy: integer('requested_by'),
    approvedBy: integer('approved_by'),
    notes: text('notes'),
    idempotencyKey: text('idempotency_key').unique(),
    metadata: jsonb('metadata'),
    requestedAt: timestamp('requested_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('billing_refund_requests_org_id_idx').on(t.orgId),
    index('billing_refund_requests_status_idx').on(t.status),
    index('billing_refund_requests_charge_id_idx').on(t.stripeChargeId),
  ],
);

export const insertBillingRefundRequestSchema = createInsertSchema(billingRefundRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requestedAt: true,
});
export type InsertBillingRefundRequest = z.infer<typeof insertBillingRefundRequestSchema>;
export type BillingRefundRequest = typeof billingRefundRequestsTable.$inferSelect;

// ─── Billing Tax Calculations ─────────────────────────────────────────────────
// Stores per-invoice tax calculation snapshots. Populated by the Stripe Tax
// webhook events and eventually by the tax-automation task that layers
// jurisdiction-level overrides on top of Stripe Tax defaults.

export const billingTaxCalculationsTable = pgTable(
  'billing_tax_calculations',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    stripeInvoiceId: text('stripe_invoice_id'),
    stripeTaxCalculationId: text('stripe_tax_calculation_id'),
    taxAmountExclusive: numeric('tax_amount_exclusive', { precision: 10, scale: 2 }),
    taxAmountInclusive: numeric('tax_amount_inclusive', { precision: 10, scale: 2 }),
    currency: text('currency').notNull().default('usd'),
    jurisdiction: text('jurisdiction'),
    taxType: text('tax_type'),
    taxRate: numeric('tax_rate', { precision: 6, scale: 4 }),
    metadata: jsonb('metadata'),
    calculatedAt: timestamp('calculated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('billing_tax_calculations_org_id_idx').on(t.orgId),
    index('billing_tax_calculations_invoice_id_idx').on(t.stripeInvoiceId),
  ],
);

export const insertBillingTaxCalculationSchema = createInsertSchema(billingTaxCalculationsTable).omit({
  id: true,
  createdAt: true,
  calculatedAt: true,
});
export type InsertBillingTaxCalculation = z.infer<typeof insertBillingTaxCalculationSchema>;
export type BillingTaxCalculation = typeof billingTaxCalculationsTable.$inferSelect;

// ─── Billing Rail Accounts ────────────────────────────────────────────────────
// Stores metadata for alternative payment rails (ACH, crypto) per org. The
// actual rail integration is handled by the alternative-rails task; this table
// is the shared data contract for the billing foundation layer.

export const billingRailAccountsTable = pgTable(
  'billing_rail_accounts',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    rail: text('rail', { enum: ['card', 'ach', 'crypto', 'wire', 'sepa'] })
      .notNull()
      .default('card'),
    externalAccountId: text('external_account_id'),
    accountLabel: text('account_label'),
    status: text('status', { enum: ['active', 'pending', 'inactive', 'rejected'] })
      .notNull()
      .default('pending'),
    isDefault: boolean('is_default').notNull().default(false),
    verifiedAt: timestamp('verified_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('billing_rail_accounts_org_id_idx').on(t.orgId),
    index('billing_rail_accounts_rail_idx').on(t.rail),
  ],
);

export const insertBillingRailAccountSchema = createInsertSchema(billingRailAccountsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBillingRailAccount = z.infer<typeof insertBillingRailAccountSchema>;
export type BillingRailAccount = typeof billingRailAccountsTable.$inferSelect;

// ─── Billing Audit Log ────────────────────────────────────────────────────────
// Immutable record of every billing-mutating action. Every route that calls
// Stripe (checkout, portal, cancel, update, refund) appends a row here via
// writeBillingAudit() in lib/billing-audit.ts.

export const billingAuditLogTable = pgTable(
  'billing_audit_log',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    actorId: integer('actor_id'),
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    resourceId: text('resource_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    stripeEventId: text('stripe_event_id'),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeInvoiceId: text('stripe_invoice_id'),
    idempotencyKey: text('idempotency_key'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('billing_audit_log_org_id_idx').on(t.orgId),
    index('billing_audit_log_action_idx').on(t.action),
    index('billing_audit_log_created_at_idx').on(t.createdAt),
    index('billing_audit_log_actor_id_idx').on(t.actorId),
  ],
);

export const insertBillingAuditLogSchema = createInsertSchema(billingAuditLogTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBillingAuditLog = z.infer<typeof insertBillingAuditLogSchema>;
export type BillingAuditLog = typeof billingAuditLogTable.$inferSelect;
