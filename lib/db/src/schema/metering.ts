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
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';
import { organizationsTable } from './organizations.js';

/**
 * Metering & Multi-Tenant Billing Engine
 *
 * Tables:
 *  metering_events        — durable, immutable, deduplicated billable event log
 *  usage_aggregates       — pre-computed rollups per tenant/feature/period
 *  rate_cards             — versioned pricing model definitions
 *  rate_card_tiers        — tiered price bands within a rate card
 *  rate_card_assignments  — maps rate cards → tenants
 *  quota_configs          — soft/hard limits per org/feature/plan
 *  quota_violations       — audit log of limit hits and enforcement actions
 *  cost_allocations       — per-tenant infra cost tracking for margin analysis
 *  billing_line_items     — generated invoice line items from metering data
 */

export const meteringEventsTable = pgTable(
  'metering_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    eventType: text('event_type').notNull(),
    featureKey: text('feature_key').notNull(),
    product: text('product').notNull().default('platform'),
    quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull().default('1'),
    unitLabel: text('unit_label').notNull().default('unit'),
    dimensions: jsonb('dimensions'),
    idempotencyKey: text('idempotency_key').unique(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata'),
  },
  (t) => [
    index('metering_events_org_feature_idx').on(t.orgId, t.featureKey),
    index('metering_events_org_occurred_idx').on(t.orgId, t.occurredAt),
    index('metering_events_product_idx').on(t.product),
    index('metering_events_occurred_at_idx').on(t.occurredAt),
  ],
);

export const usageAggregatesTable = pgTable(
  'usage_aggregates',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    product: text('product').notNull().default('platform'),
    periodType: text('period_type', { enum: ['hour', 'day', 'month', 'billing_cycle'] }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    totalQuantity: numeric('total_quantity', { precision: 20, scale: 6 }).notNull().default('0'),
    eventCount: integer('event_count').notNull().default(0),
    uniqueUsers: integer('unique_users').notNull().default(0),
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata'),
  },
  (t) => [
    unique('usage_agg_org_feature_period_uq').on(
      t.orgId,
      t.featureKey,
      t.periodType,
      t.periodStart,
    ),
    index('usage_agg_org_period_idx').on(t.orgId, t.periodStart),
    index('usage_agg_feature_idx').on(t.featureKey),
  ],
);

export const rateCardsTable = pgTable(
  'rate_cards',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    featureKey: text('feature_key').notNull(),
    product: text('product').notNull().default('platform'),
    pricingModel: text('pricing_model', {
      enum: ['flat_rate', 'per_unit', 'tiered', 'volume', 'package', 'commitment'],
    })
      .notNull()
      .default('per_unit'),
    unitLabel: text('unit_label').notNull().default('unit'),
    flatAmount: numeric('flat_amount', { precision: 12, scale: 6 }),
    unitAmount: numeric('unit_amount', { precision: 12, scale: 6 }),
    freeUnits: integer('free_units').notNull().default(0),
    billingInterval: text('billing_interval', { enum: ['monthly', 'annual', 'usage'] })
      .notNull()
      .default('monthly'),
    currency: text('currency').notNull().default('usd'),
    version: integer('version').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('rate_cards_feature_active_idx').on(t.featureKey, t.isActive),
    index('rate_cards_product_idx').on(t.product),
  ],
);

export const rateCardTiersTable = pgTable(
  'rate_card_tiers',
  {
    id: serial('id').primaryKey(),
    rateCardId: integer('rate_card_id')
      .notNull()
      .references(() => rateCardsTable.id, { onDelete: 'cascade' }),
    fromUnit: integer('from_unit').notNull(),
    toUnit: integer('to_unit'),
    unitAmount: numeric('unit_amount', { precision: 12, scale: 6 }).notNull(),
    flatAmount: numeric('flat_amount', { precision: 12, scale: 6 }),
    order: integer('order').notNull().default(0),
  },
  (t) => [index('rate_card_tiers_card_idx').on(t.rateCardId)],
);

export const rateCardAssignmentsTable = pgTable(
  'rate_card_assignments',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    rateCardId: integer('rate_card_id')
      .notNull()
      .references(() => rateCardsTable.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    assignedBy: text('assigned_by'),
    notes: text('notes'),
  },
  (t) => [
    unique('rate_card_assign_org_feature_uq').on(t.orgId, t.featureKey, t.isActive),
    index('rate_card_assign_org_idx').on(t.orgId),
  ],
);

export const quotaConfigsTable = pgTable(
  'quota_configs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    product: text('product').notNull().default('platform'),
    periodType: text('period_type', { enum: ['day', 'month', 'billing_cycle'] })
      .notNull()
      .default('month'),
    softLimit: numeric('soft_limit', { precision: 18, scale: 2 }),
    hardLimit: numeric('hard_limit', { precision: 18, scale: 2 }),
    softLimitAction: text('soft_limit_action', {
      enum: ['notify', 'warn_user', 'throttle'],
    })
      .notNull()
      .default('notify'),
    hardLimitAction: text('hard_limit_action', {
      enum: ['block', 'degrade', 'overage_billing'],
    })
      .notNull()
      .default('block'),
    overageUnitAmount: numeric('overage_unit_amount', { precision: 12, scale: 6 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('quota_configs_org_feature_idx').on(t.orgId, t.featureKey),
    unique('quota_configs_org_feature_period_uq').on(t.orgId, t.featureKey, t.periodType),
  ],
);

export const quotaViolationsTable = pgTable(
  'quota_violations',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    violationType: text('violation_type', { enum: ['soft', 'hard'] }).notNull(),
    action: text('action').notNull(),
    currentUsage: numeric('current_usage', { precision: 18, scale: 6 }),
    limitValue: numeric('limit_value', { precision: 18, scale: 6 }),
    metadata: jsonb('metadata'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('quota_violations_org_idx').on(t.orgId),
    index('quota_violations_occurred_idx').on(t.occurredAt),
  ],
);

export const costAllocationsTable = pgTable(
  'cost_allocations',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    product: text('product').notNull().default('platform'),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    infraCost: numeric('infra_cost', { precision: 12, scale: 4 }).notNull().default('0'),
    billedAmount: numeric('billed_amount', { precision: 12, scale: 4 }).notNull().default('0'),
    currency: text('currency').notNull().default('usd'),
    costDriver: text('cost_driver'),
    notes: text('notes'),
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cost_alloc_org_period_idx').on(t.orgId, t.periodStart),
    index('cost_alloc_product_idx').on(t.product),
  ],
);

export const billingLineItemsTable = pgTable(
  'billing_line_items',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    invoiceId: integer('invoice_id'),
    stripeInvoiceId: text('stripe_invoice_id'),
    featureKey: text('feature_key').notNull(),
    description: text('description').notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
    unitAmount: numeric('unit_amount', { precision: 12, scale: 6 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('usd'),
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    rateCardId: integer('rate_card_id').references(() => rateCardsTable.id),
    status: text('status', { enum: ['draft', 'finalized', 'invoiced', 'void'] })
      .notNull()
      .default('draft'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('billing_line_items_org_idx').on(t.orgId),
    index('billing_line_items_period_idx').on(t.orgId, t.periodStart),
    unique('billing_line_items_overage_uq').on(t.orgId, t.featureKey, t.periodStart, t.status),
  ],
);

export const insertMeteringEventSchema = createInsertSchema(meteringEventsTable).omit({
  id: true,
  recordedAt: true,
});
export type InsertMeteringEvent = z.infer<typeof insertMeteringEventSchema>;
export type MeteringEvent = typeof meteringEventsTable.$inferSelect;

export const insertUsageAggregateSchema = createInsertSchema(usageAggregatesTable).omit({
  id: true,
  computedAt: true,
});
export type InsertUsageAggregate = z.infer<typeof insertUsageAggregateSchema>;
export type UsageAggregate = typeof usageAggregatesTable.$inferSelect;

export const insertRateCardSchema = createInsertSchema(rateCardsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRateCard = z.infer<typeof insertRateCardSchema>;
export type RateCard = typeof rateCardsTable.$inferSelect;

export const insertRateCardTierSchema = createInsertSchema(rateCardTiersTable).omit({ id: true });
export type InsertRateCardTier = z.infer<typeof insertRateCardTierSchema>;
export type RateCardTier = typeof rateCardTiersTable.$inferSelect;

export const insertRateCardAssignmentSchema = createInsertSchema(rateCardAssignmentsTable).omit({
  id: true,
  assignedAt: true,
});
export type InsertRateCardAssignment = z.infer<typeof insertRateCardAssignmentSchema>;
export type RateCardAssignment = typeof rateCardAssignmentsTable.$inferSelect;

export const insertQuotaConfigSchema = createInsertSchema(quotaConfigsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertQuotaConfig = z.infer<typeof insertQuotaConfigSchema>;
export type QuotaConfig = typeof quotaConfigsTable.$inferSelect;

export const insertQuotaViolationSchema = createInsertSchema(quotaViolationsTable).omit({
  id: true,
  occurredAt: true,
});
export type InsertQuotaViolation = z.infer<typeof insertQuotaViolationSchema>;
export type QuotaViolation = typeof quotaViolationsTable.$inferSelect;

export const insertCostAllocationSchema = createInsertSchema(costAllocationsTable).omit({
  id: true,
  computedAt: true,
});
export type InsertCostAllocation = z.infer<typeof insertCostAllocationSchema>;
export type CostAllocation = typeof costAllocationsTable.$inferSelect;

export const insertBillingLineItemSchema = createInsertSchema(billingLineItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBillingLineItem = z.infer<typeof insertBillingLineItemSchema>;
export type BillingLineItem = typeof billingLineItemsTable.$inferSelect;

/**
 * billing_meters — first-class meter definitions.
 * Each meter has a unique key that matches the featureKey used in metering_events.
 * Aggregation modes: sum (default), last (last-value-wins), unique_count (unique user count).
 */
export const billingMetersTable = pgTable(
  'billing_meters',
  {
    id: serial('id').primaryKey(),
    key: text('key').notNull().unique(),
    displayName: text('display_name').notNull(),
    unit: text('unit').notNull().default('unit'),
    aggregation: text('aggregation', { enum: ['sum', 'last', 'unique_count'] })
      .notNull()
      .default('sum'),
    billingWindow: text('billing_window', { enum: ['day', 'month', 'billing_cycle'] })
      .notNull()
      .default('month'),
    stripePriceId: text('stripe_price_id'),
    stripeMeterId: text('stripe_meter_id'),
    pricingModel: text('pricing_model', { enum: ['per_unit', 'graduated', 'volume', 'package'] })
      .notNull()
      .default('per_unit'),
    includedUnits: numeric('included_units', { precision: 18, scale: 6 })
      .notNull()
      .default('0'),
    unitAmount: numeric('unit_amount', { precision: 12, scale: 6 }),
    product: text('product').notNull().default('platform'),
    isActive: boolean('is_active').notNull().default(true),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('billing_meters_key_idx').on(t.key),
    index('billing_meters_product_idx').on(t.product),
  ],
);

/**
 * billing_meter_allotments — per-plan included allotments for each meter.
 * When a subscription is created the system auto-registers the metered prices
 * and tracks how many units are included before overages apply.
 */
export const billingMeterAllotmentsTable = pgTable(
  'billing_meter_allotments',
  {
    id: serial('id').primaryKey(),
    planId: integer('plan_id').notNull(),
    meterId: integer('meter_id')
      .notNull()
      .references(() => billingMetersTable.id, { onDelete: 'cascade' }),
    includedUnits: numeric('included_units', { precision: 18, scale: 6 }).notNull().default('0'),
    stripePriceId: text('stripe_price_id'),
    overageUnitAmount: numeric('overage_unit_amount', { precision: 12, scale: 6 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('billing_meter_allotments_plan_meter_uq').on(t.planId, t.meterId),
    index('billing_meter_allotments_plan_idx').on(t.planId),
    index('billing_meter_allotments_meter_idx').on(t.meterId),
  ],
);

/**
 * metering_corrections — admin adjustment records (+/- quantity) applied to usage.
 * Corrections are audited and reflected on the next invoice.
 */
export const meteringCorrectionsTable = pgTable(
  'metering_corrections',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    meterKey: text('meter_key').notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
    reasonCode: text('reason_code', {
      enum: ['data_correction', 'customer_request', 'system_error', 'promotional', 'other'],
    })
      .notNull()
      .default('other'),
    reason: text('reason'),
    appliedToPeriodStart: timestamp('applied_to_period_start', { withTimezone: true }),
    appliedToPeriodEnd: timestamp('applied_to_period_end', { withTimezone: true }),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata'),
  },
  (t) => [
    index('metering_corrections_org_idx').on(t.orgId),
    index('metering_corrections_meter_idx').on(t.orgId, t.meterKey),
    index('metering_corrections_applied_idx').on(t.appliedAt),
  ],
);

/**
 * usage_threshold_notifications — dedup table preventing re-firing of 50/80/100% alerts
 * within the same billing period per org/meter.
 */
export const usageThresholdNotificationsTable = pgTable(
  'usage_threshold_notifications',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    meterKey: text('meter_key').notNull(),
    threshold: integer('threshold').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    notifiedAt: timestamp('notified_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('usage_threshold_notif_uq').on(t.orgId, t.meterKey, t.threshold, t.periodStart),
    index('usage_threshold_notif_org_idx').on(t.orgId),
  ],
);

export const insertBillingMeterSchema = createInsertSchema(billingMetersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBillingMeter = z.infer<typeof insertBillingMeterSchema>;
export type BillingMeter = typeof billingMetersTable.$inferSelect;

export const insertBillingMeterAllotmentSchema = createInsertSchema(billingMeterAllotmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBillingMeterAllotment = z.infer<typeof insertBillingMeterAllotmentSchema>;
export type BillingMeterAllotment = typeof billingMeterAllotmentsTable.$inferSelect;

export const insertMeteringCorrectionSchema = createInsertSchema(meteringCorrectionsTable).omit({
  id: true,
  appliedAt: true,
});
export type InsertMeteringCorrection = z.infer<typeof insertMeteringCorrectionSchema>;
export type MeteringCorrection = typeof meteringCorrectionsTable.$inferSelect;

export const insertUsageThresholdNotificationSchema = createInsertSchema(usageThresholdNotificationsTable).omit({
  id: true,
  notifiedAt: true,
});
export type InsertUsageThresholdNotification = z.infer<typeof insertUsageThresholdNotificationSchema>;
export type UsageThresholdNotification = typeof usageThresholdNotificationsTable.$inferSelect;
