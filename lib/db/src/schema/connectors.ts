import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations.js';

export const connectorsTable = pgTable('connectors', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', {
    enum: [
      'stripe',
      'slack',
      'twilio',
      'google',
      'notion',
      'github',
      'shopify',
      'salesforce',
      'hubspot',
      'dynamics365',
      'custom',
    ],
  }).notNull(),
  syncStatus: text('sync_status', { enum: ['idle', 'syncing', 'success', 'error'] }).default(
    'idle',
  ),
  lastSyncError: text('last_sync_error'),
  syncStats: jsonb('sync_stats'),
  oauthData: jsonb('oauth_data'),
  status: text('status', { enum: ['active', 'inactive', 'error', 'pending'] })
    .notNull()
    .default('pending'),
  config: jsonb('config'),
  lastSyncAt: timestamp('last_sync_at'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const connectorLogsTable = pgTable('connector_logs', {
  id: serial('id').primaryKey(),
  connectorId: integer('connector_id')
    .notNull()
    .references(() => connectorsTable.id, { onDelete: 'cascade' }),
  level: text('level', { enum: ['info', 'warn', 'error'] }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertConnectorSchema = createInsertSchema(connectorsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertConnector = z.infer<typeof insertConnectorSchema>;
export type Connector = typeof connectorsTable.$inferSelect;

export const insertConnectorLogSchema = createInsertSchema(connectorLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertConnectorLog = z.infer<typeof insertConnectorLogSchema>;
export type ConnectorLog = typeof connectorLogsTable.$inferSelect;
