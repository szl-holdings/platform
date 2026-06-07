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
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

export const ATLAS_TEMPLATE_TYPES = [
  'deck',
  'brief',
  'memo',
  'executive_summary',
  'report',
  'approval_packet',
  'incident_packet',
  'readiness_report',
  'proposal',
  'voyage_report',
  'property_brief',
  'threat_assessment',
  'ops_runbook',
  'incident_postmortem',
  'market_analysis',
] as const;

export type AtlasTemplateType = (typeof ATLAS_TEMPLATE_TYPES)[number];

export const ATLAS_EXPORT_FORMATS = ['pdf', 'docx', 'pptx', 'xlsx', 'web'] as const;
export type AtlasExportFormat = (typeof ATLAS_EXPORT_FORMATS)[number];

export const ATLAS_ARTIFACT_DOMAINS = [
  'maritime',
  'security',
  'real_estate',
  'aiops',
  'research',
  'creative',
  'general',
] as const;
export type AtlasArtifactDomain = (typeof ATLAS_ARTIFACT_DOMAINS)[number];

export const atlasArtifactsTable = pgTable(
  'atlas_artifacts',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    templateType: text('template_type', { enum: ATLAS_TEMPLATE_TYPES }).notNull(),
    domain: text('domain', { enum: ATLAS_ARTIFACT_DOMAINS }).notNull().default('general'),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    version: integer('version').notNull().default(1),
    parentArtifactId: integer('parent_artifact_id'),
    status: text('status', {
      enum: ['draft', 'generating', 'ready', 'exporting', 'exported', 'failed', 'archived'],
    })
      .notNull()
      .default('draft'),
    content: jsonb('content').default({}),
    sections: jsonb('sections').default([]),
    metadata: jsonb('metadata').default({}),
    proofChainId: integer('proof_chain_id'),
    outcomeGraphId: integer('outcome_graph_id'),
    correlationId: text('correlation_id'),
    generatedBy: text('generated_by'),
    generatedByUserId: integer('generated_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    reviewedByUserId: integer('reviewed_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at'),
    approvedByUserId: integer('approved_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    expiresAt: timestamp('expires_at'),
    isLatest: boolean('is_latest').notNull().default(true),
    shareToken: text('share_token'),
    shareExpiresAt: timestamp('share_expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('atlas_artifacts_org_idx').on(table.orgId),
    index('atlas_artifacts_template_idx').on(table.templateType),
    index('atlas_artifacts_domain_idx').on(table.domain),
    index('atlas_artifacts_entity_idx').on(table.entityType, table.entityId),
    index('atlas_artifacts_status_idx').on(table.status),
    index('atlas_artifacts_slug_idx').on(table.slug),
    index('atlas_artifacts_share_token_idx').on(table.shareToken),
    index('atlas_artifacts_created_idx').on(table.createdAt),
  ],
);

export const atlasExportJobsTable = pgTable(
  'atlas_export_jobs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    artifactId: integer('artifact_id')
      .notNull()
      .references(() => atlasArtifactsTable.id, { onDelete: 'cascade' }),
    format: text('format', { enum: ATLAS_EXPORT_FORMATS }).notNull(),
    status: text('status', {
      enum: ['pending', 'processing', 'completed', 'failed'],
    })
      .notNull()
      .default('pending'),
    fileUrl: text('file_url'),
    fileSizeBytes: integer('file_size_bytes'),
    errorMessage: text('error_message'),
    requestedByUserId: integer('requested_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    expiresAt: timestamp('expires_at'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('atlas_export_artifact_idx').on(table.artifactId),
    index('atlas_export_status_idx').on(table.status),
    index('atlas_export_org_idx').on(table.orgId),
  ],
);

export const insertAtlasArtifactSchema = createInsertSchema(atlasArtifactsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAtlasArtifact = z.infer<typeof insertAtlasArtifactSchema>;
export type AtlasArtifact = typeof atlasArtifactsTable.$inferSelect;

export const insertAtlasExportJobSchema = createInsertSchema(atlasExportJobsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAtlasExportJob = z.infer<typeof insertAtlasExportJobSchema>;
export type AtlasExportJob = typeof atlasExportJobsTable.$inferSelect;
