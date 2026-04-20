import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const MEMORY_TIERS = [
  'session',
  'workflow',
  'entity',
  'artifact',
  'executive',
  'domain',
  'operator-feedback',
  'long-term',
] as const;

export type MemoryTierName = (typeof MEMORY_TIERS)[number];

export const MEMORY_SENSITIVITY_LEVELS = [
  'public',
  'internal',
  'confidential',
  'restricted',
] as const;

export const MEMORY_RETENTION_POLICIES = [
  'ephemeral',
  'session-scoped',
  'workflow-scoped',
  'persistent',
  'archival',
] as const;

export const MEMORY_PROVENANCE_METHODS = ['agent', 'human', 'import', 'derived'] as const;

export const memoryRecordsTable = pgTable(
  'memory_records',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').notNull().unique(),
    tier: text('tier', { enum: MEMORY_TIERS }).notNull(),
    key: text('key').notNull(),
    value: jsonb('value'),
    scopeId: text('scope_id'),
    confidence: numeric('confidence', { precision: 5, scale: 4 }).notNull().default('1'),
    sensitivity: text('sensitivity', { enum: MEMORY_SENSITIVITY_LEVELS })
      .notNull()
      .default('internal'),
    retentionPolicy: text('retention_policy', {
      enum: MEMORY_RETENTION_POLICIES,
    })
      .notNull()
      .default('persistent'),
    expiresAt: timestamp('expires_at'),
    maxAgeDays: integer('max_age_days'),
    isStale: boolean('is_stale').notNull().default(false),
    provenanceSource: text('provenance_source').notNull(),
    provenanceSourceId: text('provenance_source_id'),
    provenanceAuthor: text('provenance_author'),
    provenanceMethod: text('provenance_method', {
      enum: MEMORY_PROVENANCE_METHODS,
    })
      .notNull()
      .default('agent'),
    linkedEntities: jsonb('linked_entities').default([]),
    linkedTraces: jsonb('linked_traces').default([]),
    linkedActions: jsonb('linked_actions').default([]),
    tags: jsonb('tags').default([]),
    metadata: jsonb('metadata').default({}),
    lastAccessedAt: timestamp('last_accessed_at'),
    lastUpdatedAt: timestamp('last_updated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('memory_records_tier_idx').on(t.tier),
    index('memory_records_key_idx').on(t.key),
    index('memory_records_scope_idx').on(t.scopeId),
    index('memory_records_sensitivity_idx').on(t.sensitivity),
    index('memory_records_expires_idx').on(t.expiresAt),
    index('memory_records_stale_idx').on(t.isStale),
    index('memory_records_created_idx').on(t.createdAt),
  ],
);

export const memoryLinksTable = pgTable(
  'memory_links',
  {
    id: serial('id').primaryKey(),
    sourceRecordId: text('source_record_id').notNull(),
    targetRecordId: text('target_record_id').notNull(),
    linkType: text('link_type', {
      enum: ['derives-from', 'updates', 'contradicts', 'supports', 'references', 'supersedes'],
    })
      .notNull()
      .default('references'),
    strength: numeric('strength', { precision: 5, scale: 4 }).default('1'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('memory_links_source_idx').on(t.sourceRecordId),
    index('memory_links_target_idx').on(t.targetRecordId),
    index('memory_links_type_idx').on(t.linkType),
  ],
);

export const insertMemoryRecordSchema = createInsertSchema(memoryRecordsTable).omit({
  id: true,
  createdAt: true,
  lastUpdatedAt: true,
});
export type InsertMemoryRecord = z.infer<typeof insertMemoryRecordSchema>;
export type MemoryRecord = typeof memoryRecordsTable.$inferSelect;

export const insertMemoryLinkSchema = createInsertSchema(memoryLinksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMemoryLink = z.infer<typeof insertMemoryLinkSchema>;
export type MemoryLink = typeof memoryLinksTable.$inferSelect;
