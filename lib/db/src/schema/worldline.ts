import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';
import { organizationsTable } from './organizations.js';

export type WorldlineSourceType =
  | 'api'
  | 'webhook'
  | 'file_feed'
  | 'database_sync'
  | 'scrape'
  | 'streaming'
  | 'manual';

export type WorldlineFreshnessCadence =
  | 'realtime'
  | 'minutely'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'on_demand';

export type WorldlineSourceStatus = 'active' | 'paused' | 'degraded' | 'inactive' | 'pending_setup';

export const worldlineSourceRegistryTable = pgTable(
  'worldline_source_registry',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    sourceType: text('source_type', {
      enum: ['api', 'webhook', 'file_feed', 'database_sync', 'scrape', 'streaming', 'manual'],
    }).notNull(),
    domain: text('domain').notNull(),
    status: text('status', {
      enum: ['active', 'paused', 'degraded', 'inactive', 'pending_setup'],
    })
      .notNull()
      .default('pending_setup'),
    freshnessCadence: text('freshness_cadence', {
      enum: ['realtime', 'minutely', 'hourly', 'daily', 'weekly', 'on_demand'],
    })
      .notNull()
      .default('daily'),
    confidenceBaseline: real('confidence_baseline').notNull().default(0.7),
    connectionConfig: jsonb('connection_config').default({}),
    normalizationConfig: jsonb('normalization_config').default({}),
    lastFetchedAt: timestamp('last_fetched_at'),
    lastSuccessAt: timestamp('last_success_at'),
    lastErrorAt: timestamp('last_error_at'),
    lastErrorMessage: text('last_error_message'),
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
    totalFetches: integer('total_fetches').notNull().default(0),
    totalRecordsIngested: integer('total_records_ingested').notNull().default(0),
    freshnessScore: real('freshness_score').default(1.0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('worldline_source_org_slug_idx').on(table.orgId, table.slug),
    index('worldline_source_domain_idx').on(table.domain),
    index('worldline_source_status_idx').on(table.status),
    index('worldline_source_type_idx').on(table.sourceType),
  ],
);

export const worldlineFetchLogsTable = pgTable(
  'worldline_fetch_logs',
  {
    id: serial('id').primaryKey(),
    sourceId: integer('source_id')
      .notNull()
      .references(() => worldlineSourceRegistryTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['success', 'partial', 'failed', 'skipped'] }).notNull(),
    recordsReceived: integer('records_received').notNull().default(0),
    recordsNormalized: integer('records_normalized').notNull().default(0),
    recordsRejected: integer('records_rejected').notNull().default(0),
    confidenceScore: real('confidence_score'),
    freshnessScore: real('freshness_score'),
    latencyMs: integer('latency_ms'),
    errorMessage: text('error_message'),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    correlationId: text('correlation_id'),
    metadata: jsonb('metadata').default({}),
  },
  (table) => [
    index('worldline_fetch_source_idx').on(table.sourceId),
    index('worldline_fetch_org_idx').on(table.orgId),
    index('worldline_fetch_status_idx').on(table.status),
    index('worldline_fetch_at_idx').on(table.fetchedAt),
  ],
);

export const worldlineSignalPublicationsTable = pgTable(
  'worldline_signal_publications',
  {
    id: serial('id').primaryKey(),
    sourceId: integer('source_id')
      .notNull()
      .references(() => worldlineSourceRegistryTable.id, { onDelete: 'cascade' }),
    fetchLogId: integer('fetch_log_id').references(() => worldlineFetchLogsTable.id, {
      onDelete: 'set null',
    }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    targetPack: text('target_pack').notNull(),
    publishedAt: timestamp('published_at').notNull().defaultNow(),
    recordCount: integer('record_count').notNull().default(0),
    payloadSummary: jsonb('payload_summary').default({}),
    correlationId: text('correlation_id'),
  },
  (table) => [
    index('worldline_pub_source_idx').on(table.sourceId),
    index('worldline_pub_pack_idx').on(table.targetPack),
    index('worldline_pub_org_idx').on(table.orgId),
    index('worldline_pub_at_idx').on(table.publishedAt),
  ],
);

export const insertWorldlineSourceSchema = createInsertSchema(worldlineSourceRegistryTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalFetches: true,
  totalRecordsIngested: true,
  consecutiveFailures: true,
});
export type InsertWorldlineSource = z.infer<typeof insertWorldlineSourceSchema>;
export type WorldlineSource = typeof worldlineSourceRegistryTable.$inferSelect;

export const insertWorldlineFetchLogSchema = createInsertSchema(worldlineFetchLogsTable).omit({
  id: true,
  fetchedAt: true,
});
export type InsertWorldlineFetchLog = z.infer<typeof insertWorldlineFetchLogSchema>;
export type WorldlineFetchLog = typeof worldlineFetchLogsTable.$inferSelect;
