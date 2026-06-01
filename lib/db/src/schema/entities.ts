import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const entityTypeEnum = pgEnum('entity_type', [
  'person',
  'organization',
  'asset',
  'vessel',
  'port',
  'workflow',
  'task',
  'alert',
  'case',
  'incident',
  'control',
  'risk_item',
  'recommendation',
]);

export const entitiesTable = pgTable(
  'entities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: entityTypeEnum('entity_type').notNull(),
    name: text('name').notNull(),
    sourceApp: text('source_app').notNull(),
    externalId: text('external_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    tags: text('tags').array().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => ({
    entityTypeIdx: index('entities_entity_type_idx').on(t.entityType),
    sourceAppIdx: index('entities_source_app_idx').on(t.sourceApp),
    externalIdIdx: index('entities_external_id_idx').on(t.externalId),
    nameSourceAppUniq: uniqueIndex('entities_name_source_app_uniq').on(t.name, t.sourceApp),
  }),
);

export const entityRelationshipsTable = pgTable(
  'entity_relationships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fromEntityId: uuid('from_entity_id')
      .notNull()
      .references(() => entitiesTable.id, { onDelete: 'cascade' }),
    toEntityId: uuid('to_entity_id')
      .notNull()
      .references(() => entitiesTable.id, { onDelete: 'cascade' }),
    relationshipType: text('relationship_type').notNull(),
    strength: text('strength'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    fromEntityIdx: index('entity_rel_from_idx').on(t.fromEntityId),
    toEntityIdx: index('entity_rel_to_idx').on(t.toEntityId),
    typeIdx: index('entity_rel_type_idx').on(t.relationshipType),
  }),
);

export const entityTagsTable = pgTable(
  'entity_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entitiesTable.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
    taggedBy: text('tagged_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    entityTagIdx: index('entity_tags_entity_idx').on(t.entityId),
    tagIdx: index('entity_tags_tag_idx').on(t.tag),
  }),
);

export const entityMetadataTable = pgTable(
  'entity_metadata',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entitiesTable.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: jsonb('value').$type<unknown>(),
    sourceApp: text('source_app').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    entityMetaIdx: index('entity_metadata_entity_idx').on(t.entityId),
    keyIdx: index('entity_metadata_key_idx').on(t.key),
  }),
);

export type Entity = typeof entitiesTable.$inferSelect;
export type NewEntity = typeof entitiesTable.$inferInsert;
export type EntityRelationship = typeof entityRelationshipsTable.$inferSelect;
export type EntityTag = typeof entityTagsTable.$inferSelect;
export type EntityMetadata = typeof entityMetadataTable.$inferSelect;
