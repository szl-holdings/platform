import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations';

export const nexusEntitiesTable = pgTable(
  'nexus_entities',
  {
    id: serial('id').primaryKey(),
    uri: text('uri').notNull(),
    kind: text('kind', {
      enum: [
        'organization',
        'person',
        'vessel',
        'property',
        'matter',
        'threat',
        'scenario',
        'deal',
        'briefing',
        'holding',
        'counterparty',
      ],
    }).notNull(),
    orgId: integer('org_id').references(() => organizationsTable.id, {
      onDelete: 'cascade',
    }),
    sourceTable: text('source_table').notNull(),
    sourceId: text('source_id').notNull(),
    displayName: text('display_name').notNull(),
    attributes: jsonb('attributes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('nexus_entities_uri_idx').on(t.uri),
    index('nexus_entities_kind_idx').on(t.kind),
    index('nexus_entities_org_idx').on(t.orgId),
    index('nexus_entities_source_idx').on(t.sourceTable, t.sourceId),
  ],
);

export const nexusEdgesTable = pgTable(
  'nexus_edges',
  {
    id: serial('id').primaryKey(),
    fromUri: text('from_uri').notNull(),
    toUri: text('to_uri').notNull(),
    relation: text('relation').notNull(),
    orgId: integer('org_id').references(() => organizationsTable.id, {
      onDelete: 'cascade',
    }),
    attributes: jsonb('attributes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('nexus_edges_from_to_rel_idx').on(t.fromUri, t.toUri, t.relation),
    index('nexus_edges_from_idx').on(t.fromUri),
    index('nexus_edges_to_idx').on(t.toUri),
    index('nexus_edges_org_idx').on(t.orgId),
  ],
);

export const insertNexusEntitySchema = createInsertSchema(nexusEntitiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type NexusEntity = typeof nexusEntitiesTable.$inferSelect;
export type InsertNexusEntity = z.infer<typeof insertNexusEntitySchema>;

export const insertNexusEdgeSchema = createInsertSchema(nexusEdgesTable).omit({
  id: true,
  createdAt: true,
});
export type NexusEdge = typeof nexusEdgesTable.$inferSelect;
export type InsertNexusEdge = z.infer<typeof insertNexusEdgeSchema>;
