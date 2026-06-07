import { bigserial, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const changeEventsTable = pgTable(
  'change_events',
  {
    cursor: bigserial('cursor', { mode: 'number' }).primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    actorId: text('actor_id').notNull(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    delta: jsonb('delta').$type<Record<string, unknown>>().notNull(),
    crdtClock: jsonb('crdt_clock').$type<Record<string, number>>().notNull().default({}),
    appSource: text('app_source'),
  },
  (table) => ({
    entityIdx: index('change_events_entity_idx').on(table.entityType, table.entityId),
    cursorIdx: index('change_events_cursor_idx').on(table.cursor),
    actorIdx: index('change_events_actor_idx').on(table.actorId),
    timestampIdx: index('change_events_timestamp_idx').on(table.timestamp),
  }),
);

export const insertChangeEventSchema = createInsertSchema(changeEventsTable).omit({
  cursor: true,
  timestamp: true,
});
export type InsertChangeEvent = z.infer<typeof insertChangeEventSchema>;
export type ChangeEvent = typeof changeEventsTable.$inferSelect;
