import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";

const vector = customType<{ data: string; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1024})`;
  },
});

// ─── Knowledge Graph Entities ─────────────────────────────────────────────────

export const kgEntities = pgTable(
  "kg_entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    entityType: text("entity_type").notNull(),
    domain: text("domain").notNull(),
    subDomain: text("sub_domain"),
    description: text("description"),
    canonicalId: text("canonical_id"),
    sourceIds: jsonb("source_ids").$type<string[]>().default([]),
    properties: jsonb("properties").$type<Record<string, unknown>>().default({}),
    embedding: vector("embedding", { dimensions: 1024 }),
    embeddingModel: text("embedding_model"),
    embeddingAt: timestamp("embedding_at", { withTimezone: true }),
    tenantId: text("tenant_id"),
    confidence: real("confidence").default(1.0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("kg_entities_type_idx").on(t.entityType),
    index("kg_entities_domain_idx").on(t.domain),
    index("kg_entities_canonical_idx").on(t.canonicalId),
    index("kg_entities_name_idx").on(t.name),
    index("kg_entities_active_idx").on(t.isActive),
    // NOTE: kg_entities_natural_key_idx is NOT declared here.
    // Migration 0022 creates it as a tenant-aware UNIQUE expression index:
    //   UNIQUE (name, entity_type, domain, COALESCE(tenant_id, ''))
    // Declaring it as a plain non-unique index in Drizzle would conflict with
    // the migration-managed expression index, so it is managed exclusively via SQL.
  ],
);

// ─── Knowledge Graph Relationships ───────────────────────────────────────────

export const kgRelationships = pgTable(
  "kg_relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromEntityId: uuid("from_entity_id").notNull().references(() => kgEntities.id, { onDelete: "cascade" }),
    toEntityId: uuid("to_entity_id").notNull().references(() => kgEntities.id, { onDelete: "cascade" }),
    relationshipType: text("relationship_type").notNull(),
    strength: real("strength").default(1.0),
    confidence: real("confidence").default(1.0),
    fromDomain: text("from_domain").notNull(),
    toDomain: text("to_domain").notNull(),
    isCrossDomain: boolean("is_cross_domain").default(false),
    direction: text("direction").default("directed"),
    properties: jsonb("properties").$type<Record<string, unknown>>().default({}),
    evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]),
    detectedBy: text("detected_by"),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("kg_rel_from_idx").on(t.fromEntityId),
    index("kg_rel_to_idx").on(t.toEntityId),
    index("kg_rel_type_idx").on(t.relationshipType),
    index("kg_rel_cross_domain_idx").on(t.isCrossDomain),
    index("kg_rel_from_domain_idx").on(t.fromDomain),
    index("kg_rel_to_domain_idx").on(t.toDomain),
    uniqueIndex("kg_rel_unique_idx").on(t.fromEntityId, t.toEntityId, t.relationshipType),
  ],
);

// ─── Embedding Model Registry ─────────────────────────────────────────────────

export const embeddingModelRegistry = pgTable(
  "embedding_model_registry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modelId: text("model_id").notNull().unique(),
    provider: text("provider").notNull(),
    displayName: text("display_name").notNull(),
    dimensions: integer("dimensions").notNull(),
    maxInputTokens: integer("max_input_tokens").default(8192),
    isDefault: boolean("is_default").default(false),
    isActive: boolean("is_active").default(true),
    version: integer("version").default(1),
    apiEndpoint: text("api_endpoint"),
    properties: jsonb("properties").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("emb_model_provider_idx").on(t.provider),
    index("emb_model_active_idx").on(t.isActive),
  ],
);

// ─── Embedding Tasks (async queue) ────────────────────────────────────────────

export const embeddingTasks = pgTable(
  "embedding_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetTable: text("target_table").notNull(),
    targetId: text("target_id").notNull(),
    targetColumn: text("target_column").default("embedding"),
    contentColumn: text("content_column").default("content"),
    modelId: text("model_id"),
    status: text("status").notNull().default("pending"),
    priority: integer("priority").default(5),
    attempts: integer("attempts").default(0),
    maxAttempts: integer("max_attempts").default(3),
    errorMessage: text("error_message"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("emb_tasks_status_idx").on(t.status),
    index("emb_tasks_table_idx").on(t.targetTable),
    index("emb_tasks_scheduled_idx").on(t.scheduledAt),
    uniqueIndex("emb_tasks_target_idx").on(t.targetTable, t.targetId, t.targetColumn),
  ],
);

// ─── Cross-Domain Link Events ─────────────────────────────────────────────────

export const kgCrossDomainLinks = pgTable(
  "kg_cross_domain_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    relationshipId: uuid("relationship_id").references(() => kgRelationships.id, { onDelete: "cascade" }),
    fromDomain: text("from_domain").notNull(),
    toDomain: text("to_domain").notNull(),
    linkType: text("link_type").notNull(),
    detectedBy: text("detected_by"),
    triggerEvent: text("trigger_event"),
    triggerEntityId: text("trigger_entity_id"),
    detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  },
  (t) => [
    index("kg_xdomain_from_idx").on(t.fromDomain),
    index("kg_xdomain_to_idx").on(t.toDomain),
    index("kg_xdomain_type_idx").on(t.linkType),
  ],
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type KgEntity = typeof kgEntities.$inferSelect;
export type NewKgEntity = typeof kgEntities.$inferInsert;
export type KgRelationship = typeof kgRelationships.$inferSelect;
export type NewKgRelationship = typeof kgRelationships.$inferInsert;
export type EmbeddingModelRecord = typeof embeddingModelRegistry.$inferSelect;
export type EmbeddingTask = typeof embeddingTasks.$inferSelect;
export type KgCrossDomainLink = typeof kgCrossDomainLinks.$inferSelect;
