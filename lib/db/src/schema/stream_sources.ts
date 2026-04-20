import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const streamDataSourcesTable = pgTable('stream_data_sources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  endpoint: text('endpoint'),
  authConfig: jsonb('auth_config'),
  pollingIntervalMs: integer('polling_interval_ms').default(30000),
  enabled: boolean('enabled').notNull().default(true),
  status: text('status').notNull().default('idle'),
  lastHealthAt: timestamp('last_health_at'),
  lastErrorAt: timestamp('last_error_at'),
  lastError: text('last_error'),
  eventsIngested: integer('events_ingested').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const streamIngestedEventsTable = pgTable('stream_ingested_events', {
  id: serial('id').primaryKey(),
  externalId: text('external_id'),
  sourceId: integer('source_id').references(() => streamDataSourcesTable.id, {
    onDelete: 'set null',
  }),
  category: text('category').notNull(),
  type: text('type').notNull(),
  source: text('source').notNull(),
  severity: text('severity'),
  payload: jsonb('payload').notNull(),
  normalizedAt: timestamp('normalized_at').notNull().defaultNow(),
  eventTs: timestamp('event_ts').notNull().defaultNow(),
});

export const insertStreamDataSourceSchema = createInsertSchema(streamDataSourcesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStreamDataSource = z.infer<typeof insertStreamDataSourceSchema>;
export type StreamDataSource = typeof streamDataSourcesTable.$inferSelect;

export const insertStreamIngestedEventSchema = createInsertSchema(streamIngestedEventsTable).omit({
  id: true,
  normalizedAt: true,
});
export type InsertStreamIngestedEvent = z.infer<typeof insertStreamIngestedEventSchema>;
export type StreamIngestedEvent = typeof streamIngestedEventsTable.$inferSelect;
