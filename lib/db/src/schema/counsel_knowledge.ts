import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const counselKnowledgeDocumentsTable = pgTable(
  'counsel_knowledge_documents',
  {
    id: serial('id').primaryKey(),
    matterId: text('matter_id').notNull(),
    orgId: text('org_id').notNull().default('default'),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(),
    fileSize: integer('file_size').notNull().default(0),
    textContent: text('text_content').notNull(),
    status: text('status', {
      enum: ['pending', 'indexing', 'indexed', 'error'],
    })
      .notNull()
      .default('pending'),
    errorMessage: text('error_message'),
    chunkCount: integer('chunk_count').notNull().default(0),
    entityCount: integer('entity_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    indexedAt: timestamp('indexed_at'),
  },
  (t) => [
    index('counsel_knowledge_documents_matter_idx').on(t.matterId),
    index('counsel_knowledge_documents_org_idx').on(t.orgId),
  ],
);

export const counselKnowledgeChunksTable = pgTable(
  'counsel_knowledge_chunks',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .notNull()
      .references(() => counselKnowledgeDocumentsTable.id, { onDelete: 'cascade' }),
    matterId: text('matter_id').notNull(),
    orgId: text('org_id').notNull().default('default'),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    startChar: integer('start_char').notNull().default(0),
    endChar: integer('end_char').notNull().default(0),
    sectionHint: text('section_hint'),
    keywords: jsonb('keywords').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('counsel_knowledge_chunks_document_idx').on(t.documentId),
    index('counsel_knowledge_chunks_matter_idx').on(t.matterId),
  ],
);

export const counselKnowledgeEntitiesTable = pgTable(
  'counsel_knowledge_entities',
  {
    id: serial('id').primaryKey(),
    matterId: text('matter_id').notNull(),
    orgId: text('org_id').notNull().default('default'),
    name: text('name').notNull(),
    type: text('type').notNull(),
    description: text('description'),
    documentIds: jsonb('document_ids').$type<number[]>().notNull().default([]),
    chunkIds: jsonb('chunk_ids').$type<number[]>().notNull().default([]),
    mentionCount: integer('mention_count').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('counsel_knowledge_entities_matter_idx').on(t.matterId),
    index('counsel_knowledge_entities_name_idx').on(t.name),
  ],
);

export const counselKnowledgeRelationsTable = pgTable(
  'counsel_knowledge_relations',
  {
    id: serial('id').primaryKey(),
    matterId: text('matter_id').notNull(),
    orgId: text('org_id').notNull().default('default'),
    subjectEntity: text('subject_entity').notNull(),
    predicate: text('predicate').notNull(),
    objectEntity: text('object_entity').notNull(),
    description: text('description'),
    documentId: integer('document_id'),
    chunkId: integer('chunk_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('counsel_knowledge_relations_matter_idx').on(t.matterId),
    index('counsel_knowledge_relations_subject_idx').on(t.subjectEntity),
  ],
);

export const counselKnowledgeQueriesTable = pgTable(
  'counsel_knowledge_queries',
  {
    id: serial('id').primaryKey(),
    matterId: text('matter_id').notNull(),
    orgId: text('org_id').notNull().default('default'),
    question: text('question').notNull(),
    answer: text('answer'),
    citations: jsonb('citations')
      .$type<
        Array<{
          documentId: number;
          fileName: string;
          chunkIndex: number;
          sectionHint: string | null;
          excerpt: string;
        }>
      >()
      .notNull()
      .default([]),
    status: text('status', { enum: ['pending', 'answered', 'error'] })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    answeredAt: timestamp('answered_at'),
  },
  (t) => [index('counsel_knowledge_queries_matter_idx').on(t.matterId)],
);
