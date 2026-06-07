import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const conduitConnectionStatusEnum = pgEnum('conduit_connection_status', [
  'active',
  'error',
  'untested',
]);

export const conduitSyncRunModeEnum = pgEnum('conduit_sync_run_mode', [
  'manual',
  'scheduled',
  'on_change',
]);

export const conduitSyncSemanticsEnum = pgEnum('conduit_sync_semantics', [
  'insert',
  'upsert',
  'mirror',
]);

export const conduitSyncStatusEnum = pgEnum('conduit_sync_status', [
  'active',
  'paused',
  'draft',
  'error',
]);

export const conduitSyncRunStatusEnum = pgEnum('conduit_sync_run_status', [
  'running',
  'success',
  'failed',
  'partial',
]);

export const conduitMappingTransformEnum = pgEnum('conduit_mapping_transform', [
  'uppercase',
  'lowercase',
  'concat',
  'split',
  'format_date',
  'lookup',
  'json_extract',
  'constant',
  'conditional',
]);

export const conduitConnectionsTable = pgTable('conduit_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull().default('default'),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  status: conduitConnectionStatusEnum('status').notNull().default('untested'),
  credentialMeta: jsonb('credential_meta').$type<Record<string, unknown>>().notNull().default({}),
  testedAt: timestamp('tested_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const conduitSyncsTable = pgTable('conduit_syncs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull().default('default'),
  name: text('name').notNull(),
  sourceType: text('source_type').notNull().default('postgres'),
  sourceMeta: jsonb('source_meta').$type<Record<string, unknown>>().notNull().default({}),
  connectionId: uuid('connection_id').notNull().references(() => conduitConnectionsTable.id, { onDelete: 'cascade' }),
  objectType: text('object_type').notNull(),
  runMode: conduitSyncRunModeEnum('run_mode').notNull().default('manual'),
  scheduleExpr: text('schedule_expr'),
  semantics: conduitSyncSemanticsEnum('semantics').notNull().default('upsert'),
  upsertKey: text('upsert_key'),
  status: conduitSyncStatusEnum('status').notNull().default('draft'),
  lastRunId: uuid('last_run_id'),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastRunStatus: text('last_run_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const conduitSyncMappingsTable = pgTable('conduit_sync_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  syncId: uuid('sync_id').notNull().references(() => conduitSyncsTable.id, { onDelete: 'cascade' }),
  sourceField: text('source_field').notNull(),
  destinationField: text('destination_field').notNull(),
  transform: conduitMappingTransformEnum('transform'),
  transformConfig: jsonb('transform_config').$type<Record<string, unknown>>().notNull().default({}),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const conduitSyncRunsTable = pgTable('conduit_sync_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  syncId: uuid('sync_id').notNull().references(() => conduitSyncsTable.id, { onDelete: 'cascade' }),
  status: conduitSyncRunStatusEnum('status').notNull().default('running'),
  rowsRead: integer('rows_read').notNull().default(0),
  rowsWritten: integer('rows_written').notNull().default(0),
  rowsFailed: integer('rows_failed').notNull().default(0),
  durationMs: integer('duration_ms'),
  errorMessage: text('error_message'),
  triggeredBy: text('triggered_by').notNull().default('manual'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const conduitSyncRunRowsTable = pgTable('conduit_sync_run_rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => conduitSyncRunsTable.id, { onDelete: 'cascade' }),
  rowIndex: integer('row_index').notNull(),
  sourceData: jsonb('source_data').$type<Record<string, unknown>>().notNull().default({}),
  errorMessage: text('error_message'),
  retried: boolean('retried').notNull().default(false),
  retriedAt: timestamp('retried_at', { withTimezone: true }),
});

export const conduitTemplatesTable = pgTable('conduit_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sourceType: text('source_type').notNull(),
  destination: text('destination').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull().default('general'),
  icon: text('icon').notNull().default('zap'),
  mappings: jsonb('mappings').$type<Array<Record<string, unknown>>>().notNull().default([]),
  isBuiltin: boolean('is_builtin').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertConduitConnectionSchema = createInsertSchema(conduitConnectionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertConduitConnection = z.infer<typeof insertConduitConnectionSchema>;
export type ConduitConnection = typeof conduitConnectionsTable.$inferSelect;

export const insertConduitSyncSchema = createInsertSchema(conduitSyncsTable).omit({
  id: true,
  lastRunId: true,
  lastRunAt: true,
  lastRunStatus: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertConduitSync = z.infer<typeof insertConduitSyncSchema>;
export type ConduitSync = typeof conduitSyncsTable.$inferSelect;

export const insertConduitSyncMappingSchema = createInsertSchema(conduitSyncMappingsTable).omit({ id: true });
export type InsertConduitSyncMapping = z.infer<typeof insertConduitSyncMappingSchema>;
export type ConduitSyncMapping = typeof conduitSyncMappingsTable.$inferSelect;

export const insertConduitSyncRunSchema = createInsertSchema(conduitSyncRunsTable).omit({
  id: true,
  startedAt: true,
  finishedAt: true,
});
export type InsertConduitSyncRun = z.infer<typeof insertConduitSyncRunSchema>;
export type ConduitSyncRun = typeof conduitSyncRunsTable.$inferSelect;

export const insertConduitTemplateSchema = createInsertSchema(conduitTemplatesTable).omit({ id: true, createdAt: true });
export type InsertConduitTemplate = z.infer<typeof insertConduitTemplateSchema>;
export type ConduitTemplate = typeof conduitTemplatesTable.$inferSelect;
