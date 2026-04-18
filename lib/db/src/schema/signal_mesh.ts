import {
  pgTable,
  text,
  uuid,
  timestamp,
  real,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const meshSignalsTable = pgTable(
  "mesh_signals",
  {
    signalId: uuid("signal_id").primaryKey(),
    source: text("source").notNull(),
    type: text("type").notNull(),
    domain: text("domain").notNull(),
    severity: text("severity"),
    stage: text("stage").notNull(),
    tenantId: text("tenant_id"),
    sessionId: text("session_id"),
    freshness: real("freshness").notNull(),
    confidence: real("confidence").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    payload: jsonb("payload").$type<{ signal: unknown }>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    domainIdx: index("mesh_signals_domain_idx").on(t.domain),
    typeIdx: index("mesh_signals_type_idx").on(t.type),
    tenantIdx: index("mesh_signals_tenant_id_idx").on(t.tenantId),
    occurredAtIdx: index("mesh_signals_occurred_at_idx").on(t.occurredAt),
    receivedAtIdx: index("mesh_signals_received_at_idx").on(t.receivedAt),
  }),
);

export const meshEvidenceItemsTable = pgTable(
  "mesh_evidence_items",
  {
    evidenceId: uuid("evidence_id").primaryKey(),
    type: text("type").notNull(),
    domain: text("domain").notNull(),
    signalId: uuid("signal_id"),
    summary: text("summary").notNull(),
    confidence: real("confidence").notNull(),
    freshness: real("freshness").notNull(),
    weight: real("weight").notNull().default(1),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    payload: jsonb("payload").$type<{ evidenceItem: unknown }>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    domainIdx: index("mesh_evidence_items_domain_idx").on(t.domain),
    typeIdx: index("mesh_evidence_items_type_idx").on(t.type),
    signalIdIdx: index("mesh_evidence_items_signal_id_idx").on(t.signalId),
    observedAtIdx: index("mesh_evidence_items_observed_at_idx").on(t.observedAt),
  }),
);

export const meshRecommendationsTable = pgTable(
  "mesh_recommendations",
  {
    recommendationId: uuid("recommendation_id").primaryKey(),
    domain: text("domain").notNull(),
    title: text("title").notNull(),
    suggestedAction: text("suggested_action").notNull(),
    status: text("status").notNull().default("pending"),
    confidence: real("confidence").notNull(),
    freshness: real("freshness").notNull(),
    tenantId: text("tenant_id"),
    generatedBy: text("generated_by"),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    payload: jsonb("payload").$type<{ recommendation: unknown }>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    domainIdx: index("mesh_recommendations_domain_idx").on(t.domain),
    statusIdx: index("mesh_recommendations_status_idx").on(t.status),
    tenantIdx: index("mesh_recommendations_tenant_id_idx").on(t.tenantId),
    generatedAtIdx: index("mesh_recommendations_generated_at_idx").on(
      t.generatedAt,
    ),
  }),
);

export const meshEntitySnapshotsTable = pgTable(
  "mesh_entity_snapshots",
  {
    entityId: text("entity_id").primaryKey(),
    snapshotId: uuid("snapshot_id").notNull(),
    entityType: text("entity_type").notNull(),
    domain: text("domain").notNull(),
    displayName: text("display_name").notNull(),
    health: text("health").notNull().default("unknown"),
    tenantId: text("tenant_id"),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    payload: jsonb("payload").$type<{ snapshot: unknown }>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    domainIdx: index("mesh_entity_snapshots_domain_idx").on(t.domain),
    entityTypeIdx: index("mesh_entity_snapshots_entity_type_idx").on(
      t.entityType,
    ),
    healthIdx: index("mesh_entity_snapshots_health_idx").on(t.health),
    tenantIdx: index("mesh_entity_snapshots_tenant_id_idx").on(t.tenantId),
  }),
);

export const meshEvidenceEntityLinksTable = pgTable(
  "mesh_evidence_entity_links",
  {
    evidenceId: uuid("evidence_id").notNull(),
    entityId: text("entity_id").notNull(),
    entityType: text("entity_type").notNull(),
    domain: text("domain").notNull(),
    linkedAt: timestamp("linked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.evidenceId, t.entityId] }),
    entityIdIdx: index("mesh_evidence_entity_links_entity_id_idx").on(
      t.entityId,
    ),
    evidenceIdIdx: index("mesh_evidence_entity_links_evidence_id_idx").on(
      t.evidenceId,
    ),
  }),
);

export type MeshSignalRow = typeof meshSignalsTable.$inferSelect;
export type MeshSignalInsert = typeof meshSignalsTable.$inferInsert;
export type MeshEvidenceItemRow = typeof meshEvidenceItemsTable.$inferSelect;
export type MeshEvidenceItemInsert =
  typeof meshEvidenceItemsTable.$inferInsert;
export type MeshRecommendationRow =
  typeof meshRecommendationsTable.$inferSelect;
export type MeshRecommendationInsert =
  typeof meshRecommendationsTable.$inferInsert;
export type MeshEntitySnapshotRow =
  typeof meshEntitySnapshotsTable.$inferSelect;
export type MeshEntitySnapshotInsert =
  typeof meshEntitySnapshotsTable.$inferInsert;
export type MeshEvidenceEntityLinkRow =
  typeof meshEvidenceEntityLinksTable.$inferSelect;
export type MeshEvidenceEntityLinkInsert =
  typeof meshEvidenceEntityLinksTable.$inferInsert;
