import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations.js';
import { usersTable } from './auth.js';

export const courtFilingsTable = pgTable(
  'court_filings',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    matterId: integer('matter_id'),
    submittedById: integer('submitted_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    filingType: text('filing_type', {
      enum: [
        'complaint',
        'motion',
        'answer',
        'brief',
        'notice',
        'order',
        'stipulation',
        'subpoena',
        'other',
      ],
    })
      .notNull()
      .default('other'),
    jurisdiction: text('jurisdiction').notNull(),
    courtName: text('court_name'),
    caseNumber: text('case_number'),
    documentTitle: text('document_title').notNull(),
    documentUrl: text('document_url'),
    electronicFilingSystem: text('electronic_filing_system', {
      enum: ['pacer', 'odyssey', 'tyler_efsp', 'nycourts', 'ca_efiling', 'manual'],
    })
      .notNull()
      .default('manual'),
    efsConfirmationNumber: text('efs_confirmation_number'),
    status: text('status', {
      enum: [
        'draft',
        'ready',
        'submitted',
        'accepted',
        'rejected',
        'pending_review',
        'filed',
        'failed',
      ],
    })
      .notNull()
      .default('draft'),
    filingFeeAmount: text('filing_fee_amount'),
    filingFeeStatus: text('filing_fee_status', { enum: ['pending', 'paid', 'waived', 'failed'] }),
    dueDate: timestamp('due_date'),
    submittedAt: timestamp('submitted_at'),
    acceptedAt: timestamp('accepted_at'),
    rejectionReason: text('rejection_reason'),
    electronicallySupportedJurisdiction: boolean('electronically_supported_jurisdiction')
      .notNull()
      .default(false),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('court_filings_org_id_idx').on(t.orgId),
    index('court_filings_matter_id_idx').on(t.matterId),
    index('court_filings_status_idx').on(t.status),
    index('court_filings_jurisdiction_idx').on(t.jurisdiction),
  ],
);

export const courtFilingEventsTable = pgTable(
  'court_filing_events',
  {
    id: serial('id').primaryKey(),
    filingId: integer('filing_id')
      .notNull()
      .references(() => courtFilingsTable.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    description: text('description'),
    payload: jsonb('payload'),
    performedById: integer('performed_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (t) => [
    index('court_filing_events_filing_id_idx').on(t.filingId),
  ],
);

export const insertCourtFilingSchema = createInsertSchema(courtFilingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourtFilingEventSchema = createInsertSchema(courtFilingEventsTable).omit({
  id: true,
  occurredAt: true,
});

export type CourtFiling = typeof courtFilingsTable.$inferSelect;
export type CourtFilingEvent = typeof courtFilingEventsTable.$inferSelect;
export type InsertCourtFiling = z.infer<typeof insertCourtFilingSchema>;
export type InsertCourtFilingEvent = z.infer<typeof insertCourtFilingEventSchema>;
