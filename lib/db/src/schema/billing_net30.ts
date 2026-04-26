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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations';

// ─── NET-30 Enterprise Invoice Lifecycle ──────────────────────────────────────
// Covers the full lifecycle of manually-drafted enterprise invoices:
//   draft → review → approved → sent → (partial) → paid | void | in_collections
// Built on top of Stripe (finalization + hosted PDF) with NET-15/30/45/60/custom
// payment terms, PO numbers, dunning automation, credit memos, and a collections
// handoff packet. Does NOT replace Stripe-managed subscription invoices.

export const net30InvoicesTable = pgTable(
  'net30_invoices',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    invoiceNumber: text('invoice_number').notNull(),
    externalCustomerId: text('external_customer_id'),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email'),

    terms: text('terms', { enum: ['NET-15', 'NET-30', 'NET-45', 'NET-60', 'CUSTOM'] })
      .notNull()
      .default('NET-30'),
    customTermsDays: integer('custom_terms_days'),
    poNumber: text('po_number'),

    billingAddress: jsonb('billing_address'),
    shippingAddress: jsonb('shipping_address'),

    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0'),
    discountAmount: numeric('discount_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }),
    taxAmount: numeric('tax_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    creditApplied: numeric('credit_applied', { precision: 14, scale: 2 }).notNull().default('0'),
    outstandingBalance: numeric('outstanding_balance', { precision: 14, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('usd'),

    status: text('status', {
      enum: ['draft', 'review', 'approved', 'sent', 'partial', 'paid', 'void', 'in_collections'],
    })
      .notNull()
      .default('draft'),

    dueDate: timestamp('due_date'),
    issuedDate: timestamp('issued_date'),
    sentAt: timestamp('sent_at'),
    paidAt: timestamp('paid_at'),

    stripeInvoiceId: text('stripe_invoice_id'),
    stripeHostedInvoiceUrl: text('stripe_hosted_invoice_url'),
    stripePdfUrl: text('stripe_pdf_url'),

    dunningEnabled: boolean('dunning_enabled').notNull().default(true),
    dunningPausedAt: timestamp('dunning_paused_at'),
    lastDunningAt: timestamp('last_dunning_at'),
    nextDunningAt: timestamp('next_dunning_at'),
    dunningStep: integer('dunning_step').notNull().default(0),

    collectionsAt: timestamp('collections_at'),
    collectionsPacketUrl: text('collections_packet_url'),

    notes: text('notes'),
    internalNotes: text('internal_notes'),
    attachments: jsonb('attachments'),

    approvedBy: integer('approved_by'),
    approvedAt: timestamp('approved_at'),
    sentBy: integer('sent_by'),

    metadata: jsonb('metadata'),
    createdBy: integer('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('net30_invoices_org_id_idx').on(t.orgId),
    index('net30_invoices_status_idx').on(t.status),
    index('net30_invoices_due_date_idx').on(t.dueDate),
    index('net30_invoices_invoice_number_idx').on(t.invoiceNumber),
    index('net30_invoices_next_dunning_idx').on(t.nextDunningAt),
  ],
);

export const insertNet30InvoiceSchema = createInsertSchema(net30InvoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNet30Invoice = z.infer<typeof insertNet30InvoiceSchema>;
export type Net30Invoice = typeof net30InvoicesTable.$inferSelect;

// ─── Line Items ───────────────────────────────────────────────────────────────

export const net30InvoiceLineItemsTable = pgTable(
  'net30_invoice_line_items',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => net30InvoicesTable.id, { onDelete: 'cascade' }),

    description: text('description').notNull(),
    productCode: text('product_code'),
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull().default('1'),
    unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
    lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull(),
    taxable: boolean('taxable').notNull().default(false),
    taxCategory: text('tax_category'),
    sortOrder: integer('sort_order').notNull().default(0),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('net30_line_items_invoice_id_idx').on(t.invoiceId),
  ],
);

export const insertNet30LineItemSchema = createInsertSchema(net30InvoiceLineItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNet30LineItem = z.infer<typeof insertNet30LineItemSchema>;
export type Net30LineItem = typeof net30InvoiceLineItemsTable.$inferSelect;

// ─── Payment History ──────────────────────────────────────────────────────────
// Records both Stripe-webhook payments and manual mark-as-paid entries
// (check, wire, ACH). Partial payments accumulate; balance is recomputed
// each time.

export const net30InvoicePaymentsTable = pgTable(
  'net30_invoice_payments',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => net30InvoicesTable.id, { onDelete: 'cascade' }),

    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('usd'),
    method: text('method', { enum: ['stripe', 'wire', 'check', 'ach', 'crypto', 'other'] })
      .notNull()
      .default('stripe'),
    reference: text('reference'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeChargeId: text('stripe_charge_id'),
    paidAt: timestamp('paid_at').notNull(),
    recordedBy: integer('recorded_by'),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('net30_payments_invoice_id_idx').on(t.invoiceId),
    index('net30_payments_paid_at_idx').on(t.paidAt),
    uniqueIndex('net30_payments_reference_uidx').on(t.reference),
  ],
);

export const insertNet30PaymentSchema = createInsertSchema(net30InvoicePaymentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNet30Payment = z.infer<typeof insertNet30PaymentSchema>;
export type Net30Payment = typeof net30InvoicePaymentsTable.$inferSelect;

// ─── Credit Memos ─────────────────────────────────────────────────────────────
// First-class credit memos: created against an invoice with reason and amount.
// Applied to the outstanding balance automatically and audited.

export const net30CreditMemosTable = pgTable(
  'net30_credit_memos',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => net30InvoicesTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    memoNumber: text('memo_number').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('usd'),
    reason: text('reason', {
      enum: ['billing_error', 'service_credit', 'goodwill', 'dispute_resolution', 'other'],
    })
      .notNull()
      .default('other'),
    description: text('description'),
    appliedAt: timestamp('applied_at').notNull().defaultNow(),
    createdBy: integer('created_by'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('net30_credit_memos_invoice_id_idx').on(t.invoiceId),
    index('net30_credit_memos_org_id_idx').on(t.orgId),
  ],
);

export const insertNet30CreditMemoSchema = createInsertSchema(net30CreditMemosTable).omit({
  id: true,
  createdAt: true,
  appliedAt: true,
});
export type InsertNet30CreditMemo = z.infer<typeof insertNet30CreditMemoSchema>;
export type Net30CreditMemo = typeof net30CreditMemosTable.$inferSelect;

// ─── Dunning Log ──────────────────────────────────────────────────────────────
// Records every dunning reminder dispatched — which invoice, which step,
// which recipient, which template, and whether delivery succeeded.

export const net30DunningLogTable = pgTable(
  'net30_dunning_log',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => net30InvoicesTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    step: integer('step').notNull(),
    daysOverdue: integer('days_overdue').notNull(),
    recipient: text('recipient').notNull(),
    template: text('template').notNull().default('standard_reminder'),
    subject: text('subject'),
    success: boolean('success').notNull().default(false),
    error: text('error'),
    messageId: text('message_id'),
    dispatchedAt: timestamp('dispatched_at').notNull().defaultNow(),
    metadata: jsonb('metadata'),
  },
  (t) => [
    index('net30_dunning_log_invoice_id_idx').on(t.invoiceId),
    index('net30_dunning_log_dispatched_at_idx').on(t.dispatchedAt),
  ],
);

export const insertNet30DunningLogSchema = createInsertSchema(net30DunningLogTable).omit({
  id: true,
  dispatchedAt: true,
});
export type InsertNet30DunningLog = z.infer<typeof insertNet30DunningLogSchema>;
export type Net30DunningLog = typeof net30DunningLogTable.$inferSelect;

// ─── Dunning Config ───────────────────────────────────────────────────────────
// Per-org dunning cadence. The default schedule fires at +3, +7, +14, +21
// days past due. Operators can override per-org or per-invoice.

export const net30DunningConfigTable = pgTable(
  'net30_dunning_config',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    cadenceDays: jsonb('cadence_days').notNull().default([3, 7, 14, 21]),
    templateName: text('template_name').notNull().default('standard_reminder'),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('net30_dunning_config_org_id_idx').on(t.orgId),
  ],
);

export const insertNet30DunningConfigSchema = createInsertSchema(net30DunningConfigTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNet30DunningConfig = z.infer<typeof insertNet30DunningConfigSchema>;
export type Net30DunningConfig = typeof net30DunningConfigTable.$inferSelect;

// ─── AR Aging Snapshots ───────────────────────────────────────────────────────
// Daily snapshots of AR aging buckets per org for trend reporting.
// On-demand aging is computed live; this table stores the daily snapshot
// produced by the scheduled job for historical trend analysis.

export const net30AgingSnapshotsTable = pgTable(
  'net30_aging_snapshots',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    snapshotDate: timestamp('snapshot_date').notNull(),
    current: numeric('current', { precision: 14, scale: 2 }).notNull().default('0'),
    bucket1to30: numeric('bucket_1_30', { precision: 14, scale: 2 }).notNull().default('0'),
    bucket31to60: numeric('bucket_31_60', { precision: 14, scale: 2 }).notNull().default('0'),
    bucket61to90: numeric('bucket_61_90', { precision: 14, scale: 2 }).notNull().default('0'),
    bucket90plus: numeric('bucket_90_plus', { precision: 14, scale: 2 }).notNull().default('0'),
    totalOutstanding: numeric('total_outstanding', { precision: 14, scale: 2 }).notNull().default('0'),
    invoiceCount: integer('invoice_count').notNull().default(0),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('net30_aging_snapshots_org_id_idx').on(t.orgId),
    index('net30_aging_snapshots_snapshot_date_idx').on(t.snapshotDate),
  ],
);

export const insertNet30AgingSnapshotSchema = createInsertSchema(net30AgingSnapshotsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNet30AgingSnapshot = z.infer<typeof insertNet30AgingSnapshotSchema>;
export type Net30AgingSnapshot = typeof net30AgingSnapshotsTable.$inferSelect;
