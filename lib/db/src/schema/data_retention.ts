import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

export const dataRetentionPoliciesTable = pgTable('data_retention_policies', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
  tableName: text('table_name').notNull(),
  retentionDays: integer('retention_days').notNull(),
  purgeStrategy: text('purge_strategy', {
    enum: ['delete', 'anonymize', 'archive'],
  })
    .notNull()
    .default('delete'),
  isActive: boolean('is_active').notNull().default(true),
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  description: text('description'),
  createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
  updatedBy: integer('updated_by').references(() => usersTable.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const dataRetentionAuditLogTable = pgTable('data_retention_audit_log', {
  id: serial('id').primaryKey(),
  policyId: integer('policy_id').references(() => dataRetentionPoliciesTable.id, {
    onDelete: 'set null',
  }),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
  tableName: text('table_name').notNull(),
  action: text('action', {
    enum: [
      'policy_created',
      'policy_updated',
      'policy_deleted',
      'purge_started',
      'purge_completed',
      'purge_failed',
      'manual_trigger',
    ],
  }).notNull(),
  actorId: integer('actor_id').references(() => usersTable.id, { onDelete: 'set null' }),
  actorName: text('actor_name'),
  affectedRows: integer('affected_rows'),
  details: jsonb('details'),
  status: text('status', { enum: ['success', 'failure', 'partial'] })
    .notNull()
    .default('success'),
  errorMessage: text('error_message'),
  executedAt: timestamp('executed_at').notNull().defaultNow(),
});
