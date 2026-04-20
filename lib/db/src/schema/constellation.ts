import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const cstSensitivityEnum = pgEnum('cst_sensitivity_tier', [
  'public',
  'internal',
  'confidential',
  'restricted',
  'top_secret',
]);

export const cstNodes = pgTable(
  'cst_nodes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    canonicalId: uuid('canonical_id').defaultRandom().notNull().unique(),
    domain: text('domain').notNull(),
    entityType: text('entity_type').notNull(),
    labels: text('labels').array().default([]),
    name: text('name').notNull(),
    description: text('description'),
    provenanceSourceId: text('provenance_source_id'),
    provenanceSourceType: text('provenance_source_type'),
    provenanceSourceLabel: text('provenance_source_label'),
    freshness: timestamp('freshness', { withTimezone: true }).defaultNow().notNull(),
    confidence: real('confidence').default(1.0).notNull(),
    ownerId: text('owner_id'),
    ownerType: text('owner_type'),
    ownerOrgId: text('owner_org_id'),
    sensitivityTier: cstSensitivityEnum('sensitivity_tier').default('internal').notNull(),
    relatedActionIds: jsonb('related_action_ids').$type<string[]>().default([]),
    relatedDocumentIds: jsonb('related_document_ids').$type<string[]>().default([]),
    relatedExecutionIds: jsonb('related_execution_ids').$type<string[]>().default([]),
    relatedRiskIds: jsonb('related_risk_ids').$type<string[]>().default([]),
    extensions: jsonb('extensions').$type<Record<string, unknown>>().default({}),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('cst_nodes_domain_idx').on(t.domain),
    index('cst_nodes_entity_type_idx').on(t.entityType),
    index('cst_nodes_canonical_id_idx').on(t.canonicalId),
    index('cst_nodes_active_idx').on(t.isActive),
    index('cst_nodes_name_idx').on(t.name),
    index('cst_nodes_domain_type_idx').on(t.domain, t.entityType),
    index('cst_nodes_sensitivity_idx').on(t.sensitivityTier),
    index('cst_nodes_confidence_idx').on(t.confidence),
  ],
);

export const cstNodeTypes = pgTable(
  'cst_node_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    domain: text('domain').notNull(),
    typeKey: text('type_key').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    defaultSensitivity: cstSensitivityEnum('default_sensitivity').default('internal').notNull(),
    extensionSchema: jsonb('extension_schema').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('cst_node_types_domain_key_uniq').on(t.domain, t.typeKey),
    index('cst_node_types_domain_idx').on(t.domain),
  ],
);

export const cstNodeAliases = pgTable(
  'cst_node_aliases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => cstNodes.id, { onDelete: 'cascade' }),
    aliasType: text('alias_type').notNull(),
    aliasValue: text('alias_value').notNull(),
    sourceSystem: text('source_system'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('cst_aliases_node_idx').on(t.nodeId),
    index('cst_aliases_value_idx').on(t.aliasValue),
    uniqueIndex('cst_aliases_type_value_uniq').on(t.aliasType, t.aliasValue),
  ],
);

export const cstEdges = pgTable(
  'cst_edges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fromNodeId: uuid('from_node_id')
      .notNull()
      .references(() => cstNodes.id, { onDelete: 'cascade' }),
    toNodeId: uuid('to_node_id')
      .notNull()
      .references(() => cstNodes.id, { onDelete: 'cascade' }),
    relationshipType: text('relationship_type').notNull(),
    confidence: real('confidence').default(1.0).notNull(),
    sourceId: text('source_id'),
    sourceType: text('source_type'),
    sourceLabel: text('source_label'),
    active: boolean('active').default(true).notNull(),
    extensions: jsonb('extensions').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('cst_edges_from_idx').on(t.fromNodeId),
    index('cst_edges_to_idx').on(t.toNodeId),
    index('cst_edges_type_idx').on(t.relationshipType),
    index('cst_edges_active_idx').on(t.active),
    uniqueIndex('cst_edges_from_to_type_uniq').on(t.fromNodeId, t.toNodeId, t.relationshipType),
  ],
);

export const cstEdgeEvidence = pgTable(
  'cst_edge_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    edgeId: uuid('edge_id')
      .notNull()
      .references(() => cstEdges.id, { onDelete: 'cascade' }),
    evidenceType: text('evidence_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    sourceId: text('source_id'),
    sourceLabel: text('source_label'),
    confidence: real('confidence').default(1.0).notNull(),
    recordedBy: text('recorded_by'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('cst_evidence_edge_idx').on(t.edgeId),
    index('cst_evidence_type_idx').on(t.evidenceType),
    index('cst_evidence_recorded_at_idx').on(t.recordedAt),
  ],
);

export type CstNode = typeof cstNodes.$inferSelect;
export type NewCstNode = typeof cstNodes.$inferInsert;
export type CstNodeType = typeof cstNodeTypes.$inferSelect;
export type NewCstNodeType = typeof cstNodeTypes.$inferInsert;
export type CstNodeAlias = typeof cstNodeAliases.$inferSelect;
export type NewCstNodeAlias = typeof cstNodeAliases.$inferInsert;
export type CstEdge = typeof cstEdges.$inferSelect;
export type NewCstEdge = typeof cstEdges.$inferInsert;
export type CstEdgeEvidence = typeof cstEdgeEvidence.$inferSelect;
export type NewCstEdgeEvidence = typeof cstEdgeEvidence.$inferInsert;
