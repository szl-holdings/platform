import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const pcGcMattersTable = pgTable('pc_gc_matters', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().default('demo'),
  name: text('name').notNull(),
  clientName: text('client_name').notNull(),
  matterNumber: text('matter_number').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  privilegeLevel: text('privilege_level').notNull(),
  pressureScore: integer('pressure_score').notNull().default(0),
  complexityScore: integer('complexity_score').notNull().default(0),
  openedDate: text('opened_date').notNull(),
  trialDate: text('trial_date'),
  closingDate: text('closing_date'),
  nextDeadline: text('next_deadline').notNull(),
  nextDeadlineLabel: text('next_deadline_label').notNull(),
  leadCounsel: text('lead_counsel').notNull(),
  jurisdiction: text('jurisdiction').notNull(),
  estimatedExposure: numeric('estimated_exposure', { precision: 18, scale: 2 }),
  summary: text('summary').notNull(),
  tags: jsonb('tags').notNull().default([]),
  parties: jsonb('parties').notNull().default([]),
  wall: jsonb('wall').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcGcObligationsTable = pgTable(
  'pc_gc_obligations',
  {
    id: text('id').notNull(),
    matterId: text('matter_id')
      .notNull()
      .references(() => pcGcMattersTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    dueDate: text('due_date').notNull(),
    status: text('status').notNull(),
    assignee: text('assignee').notNull(),
    dependencies: jsonb('dependencies').notNull().default([]),
    privilegeLevel: text('privilege_level').notNull(),
    filingRequired: boolean('filing_required').notNull().default(false),
    courtId: text('court_id'),
    consequence: text('consequence'),
    completedDate: text('completed_date'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.matterId, t.id] }) }),
);

export const pcGcAuditEntriesTable = pgTable(
  'pc_gc_audit_entries',
  {
    id: text('id').notNull(),
    matterId: text('matter_id')
      .notNull()
      .references(() => pcGcMattersTable.id, { onDelete: 'cascade' }),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    user: text('user_id').notNull(),
    role: text('role').notNull(),
    action: text('action').notNull(),
    detail: text('detail').notNull(),
    ip: text('ip').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.matterId, t.id] }) }),
);

export const pcGcProofChainEntriesTable = pgTable(
  'pc_gc_proof_chain_entries',
  {
    id: text('id').notNull(),
    matterId: text('matter_id')
      .notNull()
      .references(() => pcGcMattersTable.id, { onDelete: 'cascade' }),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    eventType: text('event_type').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    privilegeLevel: text('privilege_level').notNull(),
    author: text('author').notNull(),
    parties: jsonb('parties').notNull().default([]),
    documentRef: text('document_ref'),
    hash: text('hash'),
    redacted: boolean('redacted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.matterId, t.id] }) }),
);

export type PcGcMatterRow = typeof pcGcMattersTable.$inferSelect;
export type PcGcObligationRow = typeof pcGcObligationsTable.$inferSelect;
export type PcGcAuditEntryRow = typeof pcGcAuditEntriesTable.$inferSelect;
export type PcGcProofChainEntryRow = typeof pcGcProofChainEntriesTable.$inferSelect;
