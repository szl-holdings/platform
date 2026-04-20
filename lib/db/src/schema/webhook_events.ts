import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { connectorsTable } from './connectors';

export const webhookEventsTable = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  connectorId: integer('connector_id').references(() => connectorsTable.id, {
    onDelete: 'set null',
  }),
  source: text('source').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload'),
  status: text('status', { enum: ['received', 'processing', 'processed', 'failed'] })
    .notNull()
    .default('received'),
  errorMessage: text('error_message'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
