import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const alloyChatKbDocuments = pgTable('alloy_chat_kb_documents', {
  id: text('id').primaryKey(),
  orgId: integer('org_id'),
  title: text('title').notNull(),
  sourceType: text('source_type').notNull(),
  sourceUrl: text('source_url'),
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull().default(0),
  totalChunks: integer('total_chunks').notNull().default(1),
  embedding: text('embedding'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const alloyChatAdvisories = pgTable('alloy_chat_advisories', {
  id: text('id').primaryKey(),
  orgId: integer('org_id'),
  category: text('category').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  severity: text('severity').notNull().default('info'),
  isRead: boolean('is_read').notNull().default(false),
  metadata: jsonb('metadata'),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
});

export const alloyChatComparisons = pgTable('alloy_chat_comparisons', {
  id: text('id').primaryKey(),
  orgId: integer('org_id'),
  prompt: text('prompt').notNull(),
  results: jsonb('results').notNull(),
  ratings: jsonb('ratings'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
