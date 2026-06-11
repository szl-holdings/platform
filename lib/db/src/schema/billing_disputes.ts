import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations.js';
import { usersTable } from './auth.js';

export const billingDisputesTable = pgTable(
  'billing_disputes',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    stripeDisputeId: text('stripe_dispute_id').notNull().unique(),
    stripeChargeId: text('stripe_charge_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('usd'),
    reason: text('reason'),
    status: text('status', {
      enum: [
        'warning_needs_response',
        'warning_under_review',
        'warning_closed',
        'needs_response',
        'under_review',
        'charge_refunded',
        'won',
        'lost',
      ],
    })
      .notNull()
      .default('needs_response'),
    isChargeback: integer('is_chargeback').notNull().default(1),
    stripeEvidenceDueBy: timestamp('stripe_evidence_due_by'),
    evidenceSubmitted: jsonb('evidence_submitted'),
    responseNotes: text('response_notes'),
    respondedAt: timestamp('responded_at'),
    respondedById: integer('responded_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    closedAt: timestamp('closed_at'),
    outcome: text('outcome', { enum: ['won', 'lost', 'withdrawn'] }),
    stripeRawData: jsonb('stripe_raw_data'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('billing_disputes_org_id_idx').on(t.orgId),
    index('billing_disputes_status_idx').on(t.status),
    index('billing_disputes_stripe_dispute_id_idx').on(t.stripeDisputeId),
  ],
);

export const billingDisputeAuditTable = pgTable(
  'billing_dispute_audit',
  {
    id: serial('id').primaryKey(),
    disputeId: integer('dispute_id')
      .notNull()
      .references(() => billingDisputesTable.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    performedById: integer('performed_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (t) => [
    index('dispute_audit_dispute_id_idx').on(t.disputeId),
  ],
);

export const insertBillingDisputeSchema = createInsertSchema(billingDisputesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingDisputeAuditSchema = createInsertSchema(billingDisputeAuditTable).omit({
  id: true,
  occurredAt: true,
});

export type BillingDispute = typeof billingDisputesTable.$inferSelect;
export type BillingDisputeAudit = typeof billingDisputeAuditTable.$inferSelect;
export type InsertBillingDispute = z.infer<typeof insertBillingDisputeSchema>;
export type InsertBillingDisputeAudit = z.infer<typeof insertBillingDisputeAuditSchema>;
