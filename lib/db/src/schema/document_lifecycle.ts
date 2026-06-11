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
import { organizationsTable } from './organizations.js';
import { usersTable } from './auth.js';

export const documentLifecycleTable = pgTable(
  'document_lifecycle',
  {
    id: serial('id').primaryKey(),
    documentId: text('document_id').notNull().unique(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    documentType: text('document_type', {
      enum: ['filing', 'contract', 'brief', 'memo', 'exhibit', 'certificate', 'deck', 'report'],
    }).notNull(),
    lifecycleState: text('lifecycle_state', {
      enum: ['draft', 'review', 'sign', 'file', 'archive'],
    }).notNull().default('draft'),
    domain: text('domain', {
      enum: ['counsel', 'security', 'platform'],
    }).notNull().default('counsel'),
    matterId: integer('matter_id'),
    fundId: text('fund_id'),
    version: integer('version').notNull().default(1),
    signatureStatus: text('signature_status', {
      enum: ['none', 'pending', 'partially_signed', 'completed', 'declined'],
    }).notNull().default('none'),
    jurisdictionCode: text('jurisdiction_code'),
    frozenMetrics: jsonb('frozen_metrics'),
    createdById: integer('created_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('doc_lifecycle_org_id_idx').on(t.orgId),
    index('doc_lifecycle_document_id_idx').on(t.documentId),
    index('doc_lifecycle_state_idx').on(t.lifecycleState),
    index('doc_lifecycle_domain_idx').on(t.domain),
    index('doc_lifecycle_type_idx').on(t.documentType),
    index('doc_lifecycle_matter_id_idx').on(t.matterId),
    index('doc_lifecycle_fund_id_idx').on(t.fundId),
  ],
);

export const documentAuditTrailTable = pgTable(
  'document_audit_trail',
  {
    id: serial('id').primaryKey(),
    documentId: text('document_id').notNull(),
    fromState: text('from_state'),
    toState: text('to_state').notNull(),
    performedById: integer('performed_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    performedByName: text('performed_by_name'),
    roleUsed: text('role_used').notNull(),
    reason: text('reason'),
    metadata: jsonb('metadata'),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (t) => [
    index('doc_audit_document_id_idx').on(t.documentId),
    index('doc_audit_org_id_idx').on(t.orgId),
    index('doc_audit_occurred_at_idx').on(t.occurredAt),
    index('doc_audit_performed_by_idx').on(t.performedById),
  ],
);

export const lifecycleWorkflowConfigTable = pgTable(
  'lifecycle_workflow_config',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    domain: text('domain').notNull(),
    documentType: text('document_type').notNull(),
    states: jsonb('states').notNull(),
    transitions: jsonb('transitions').notNull(),
    roleMatrix: jsonb('role_matrix').notNull(),
    isActive: text('is_active').notNull().default('true'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('lifecycle_wf_org_id_idx').on(t.orgId),
    index('lifecycle_wf_domain_idx').on(t.domain),
    index('lifecycle_wf_type_idx').on(t.documentType),
  ],
);

export const insertDocumentLifecycleSchema = createInsertSchema(documentLifecycleTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentAuditTrailSchema = createInsertSchema(documentAuditTrailTable).omit({
  id: true,
  occurredAt: true,
});

export type DocumentLifecycle = typeof documentLifecycleTable.$inferSelect;
export type DocumentAuditTrail = typeof documentAuditTrailTable.$inferSelect;
export type LifecycleWorkflowConfig = typeof lifecycleWorkflowConfigTable.$inferSelect;
export type InsertDocumentLifecycle = z.infer<typeof insertDocumentLifecycleSchema>;
export type InsertDocumentAuditTrail = z.infer<typeof insertDocumentAuditTrailSchema>;
