import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const ragKnowledgeDocuments = pgTable(
  'rag_knowledge_documents',
  {
    docId: text('doc_id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    domain: text('domain').notNull().default('general'),
    sourceType: text('source_type').notNull().default('document'),
    tags: jsonb('tags').notNull().default([]),
    importance: integer('importance').notNull().default(5),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('rag_docs_domain_idx').on(t.domain),
    index('rag_docs_source_type_idx').on(t.sourceType),
  ],
);
