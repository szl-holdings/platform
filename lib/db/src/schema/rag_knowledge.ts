import { customType, pgTable, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";

const vector = customType<{ data: string; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
});

export const ragKnowledgeChunks = pgTable(
  "rag_knowledge_chunks",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    source: text("source").notNull(),
    sourceType: text("source_type").notNull(),
    domain: text("domain").notNull().default("general"),
    sensitivityLevel: text("sensitivity_level").notNull().default("internal"),
    objectId: text("object_id"),
    chunkIndex: integer("chunk_index").notNull().default(0),
    chunkHash: text("chunk_hash").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("rag_chunks_source_type_idx").on(t.sourceType),
    index("rag_chunks_domain_idx").on(t.domain),
    index("rag_chunks_sensitivity_idx").on(t.sensitivityLevel),
    index("rag_chunks_object_id_idx").on(t.objectId),
    index("rag_chunks_created_idx").on(t.createdAt),
  ],
);
