/**
 * yawar_events — yawar-bus event log table.
 *
 * Each row is a single published event on a topic, hash-linked to the
 * previous event on the same topic via `prev_hash`. The set of rows for a
 * given topic forms an append-only SHA-256 chain (the same model as
 * `@szl-holdings/szl-receipts` ReceiptChain, durably persisted).
 *
 * `receiptId` is the PRIMARY KEY: it is the canonical chain-link identity
 * surfaced by GET /api/yawar/receipt/:id and matches the id ReceiptChain
 * carries on the LambdaReceipt it appends. `seq` is a monotonic bigserial
 * used purely for ordering — replay/subscribe scan a topic slice in seq
 * order, which is sub-linear under the `(topic, seq)` index.
 */
import { bigserial, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const yawarEventsTable = pgTable(
  'yawar_events',
  {
    receiptId: text('receipt_id').primaryKey(),
    seq: bigserial('seq', { mode: 'number' }).notNull().unique(),
    topic: text('topic').notNull(),
    ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
    payload: jsonb('payload').notNull().default({}),
    prevHash: text('prev_hash').notNull(),
    hash: text('hash').notNull(),
    signer: text('signer'),
  },
  (table) => [
    index('yawar_events_topic_seq_idx').on(table.topic, table.seq),
    index('yawar_events_topic_ts_idx').on(table.topic, table.ts),
    index('yawar_events_topic_hash_idx').on(table.topic, table.hash),
  ],
);

export type YawarEventRow = typeof yawarEventsTable.$inferSelect;
export type NewYawarEvent = typeof yawarEventsTable.$inferInsert;
