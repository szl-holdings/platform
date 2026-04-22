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
