import {
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
import { organizationsTable } from './organizations';
import { usersTable } from './auth';

export const esignatureRequestsTable = pgTable(
  'esignature_requests',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    matterId: integer('matter_id'),
    requestedById: integer('requested_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    provider: text('provider', { enum: ['docusign', 'hellosign', 'internal'] })
      .notNull()
      .default('docusign'),
    providerEnvelopeId: text('provider_envelope_id').unique(),
    documentTitle: text('document_title').notNull(),
    documentUrl: text('document_url'),
    status: text('status', {
      enum: [
        'draft',
        'sent',
        'delivered',
        'partially_signed',
        'completed',
        'declined',
        'voided',
        'expired',
      ],
    })
      .notNull()
      .default('draft'),
    signatories: jsonb('signatories').notNull().default('[]'),
    completedAt: timestamp('completed_at'),
    expiresAt: timestamp('expires_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('esig_requests_org_id_idx').on(t.orgId),
    index('esig_requests_matter_id_idx').on(t.matterId),
    index('esig_requests_status_idx').on(t.status),
    index('esig_requests_envelope_id_idx').on(t.providerEnvelopeId),
  ],
);

export const esignatureEventsTable = pgTable(
  'esignature_events',
  {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
      .notNull()
      .references(() => esignatureRequestsTable.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    signatoryEmail: text('signatory_email'),
    signatoryName: text('signatory_name'),
    payload: jsonb('payload'),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (t) => [
    index('esig_events_request_id_idx').on(t.requestId),
    index('esig_events_type_idx').on(t.eventType),
  ],
);

export const insertEsignatureRequestSchema = createInsertSchema(esignatureRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEsignatureEventSchema = createInsertSchema(esignatureEventsTable).omit({
  id: true,
  occurredAt: true,
});

export type EsignatureRequest = typeof esignatureRequestsTable.$inferSelect;
export type EsignatureEvent = typeof esignatureEventsTable.$inferSelect;
export type InsertEsignatureRequest = z.infer<typeof insertEsignatureRequestSchema>;
export type InsertEsignatureEvent = z.infer<typeof insertEsignatureEventSchema>;
