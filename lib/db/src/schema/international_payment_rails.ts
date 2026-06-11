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
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations.js';

export const internationalPaymentMethodsTable = pgTable(
  'international_payment_methods',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['sepa_debit', 'bacs_debit', 'ach_debit'] }).notNull(),
    stripePaymentMethodId: text('stripe_payment_method_id').unique(),
    currency: text('currency').notNull().default('eur'),
    status: text('status', { enum: ['pending', 'verified', 'active', 'failed', 'cancelled'] })
      .notNull()
      .default('pending'),
    lastFour: text('last_four'),
    bankName: text('bank_name'),
    sortCode: text('sort_code'),
    iban: text('iban'),
    mandateReference: text('mandate_reference'),
    mandateAcceptedAt: timestamp('mandate_accepted_at'),
    metadata: jsonb('metadata'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('intl_payment_methods_org_id_idx').on(t.orgId),
    index('intl_payment_methods_type_idx').on(t.type),
    index('intl_payment_methods_status_idx').on(t.status),
  ],
);

export const internationalPaymentsTable = pgTable(
  'international_payments',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    paymentMethodId: integer('payment_method_id').references(
      () => internationalPaymentMethodsTable.id,
      { onDelete: 'set null' },
    ),
    stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: text('currency').notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['initiated', 'processing', 'settled', 'failed', 'refunded'],
    })
      .notNull()
      .default('initiated'),
    settlementDate: timestamp('settlement_date'),
    failureReason: text('failure_reason'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('intl_payments_org_id_idx').on(t.orgId),
    index('intl_payments_status_idx').on(t.status),
    index('intl_payments_stripe_pi_idx').on(t.stripePaymentIntentId),
  ],
);

export const insertInternationalPaymentMethodSchema = createInsertSchema(
  internationalPaymentMethodsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export const insertInternationalPaymentSchema = createInsertSchema(
  internationalPaymentsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export type InternationalPaymentMethod =
  typeof internationalPaymentMethodsTable.$inferSelect;
export type InternationalPayment = typeof internationalPaymentsTable.$inferSelect;
export type InsertInternationalPaymentMethod = z.infer<
  typeof insertInternationalPaymentMethodSchema
>;
export type InsertInternationalPayment = z.infer<typeof insertInternationalPaymentSchema>;
