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
import { organizationsTable } from './organizations';

export const reliquaryCatalogTable = pgTable(
  'reliquary_catalog',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    contentHash: text('content_hash').notNull().unique(),
    covenantHash: text('covenant_hash').notNull().unique(),
    artifactType: text('artifact_type', {
      enum: ['model', 'prompt', 'agent', 'dataset', 'embedding', 'report', 'bundle'],
    }).notNull(),
    label: text('label').notNull(),
    description: text('description'),
    policyId: text('policy_id').notNull(),
    actor: text('actor').notNull(),
    tenant: text('tenant').notNull(),
    doctrineRevision: text('doctrine_revision').notNull(),
    sizeBytes: integer('size_bytes').notNull().default(0),
    mimeType: text('mime_type').notNull().default('application/octet-stream'),
    diskPath: text('disk_path').notNull(),
    proofReceiptId: text('proof_receipt_id'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('reliquary_catalog_org_idx').on(table.orgId),
    index('reliquary_catalog_content_hash_idx').on(table.contentHash),
    index('reliquary_catalog_covenant_hash_idx').on(table.covenantHash),
    index('reliquary_catalog_type_idx').on(table.artifactType),
    index('reliquary_catalog_created_idx').on(table.createdAt),
  ],
);

export const reliquaryLineageEdgesTable = pgTable(
  'reliquary_lineage_edges',
  {
    id: serial('id').primaryKey(),
    parentContentHash: text('parent_content_hash').notNull(),
    childContentHash: text('child_content_hash').notNull(),
    relationship: text('relationship').notNull().default('derived_from'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('reliquary_lineage_parent_idx').on(table.parentContentHash),
    index('reliquary_lineage_child_idx').on(table.childContentHash),
  ],
);

export const reliquarySnapshotsTable = pgTable(
  'reliquary_snapshots',
  {
    id: serial('id').primaryKey(),
    snapshotHash: text('snapshot_hash').notNull().unique(),
    label: text('label').notNull(),
    manifest: jsonb('manifest').notNull(),
    diskPath: text('disk_path').notNull(),
    proofReceiptId: text('proof_receipt_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('reliquary_snapshots_hash_idx').on(table.snapshotHash),
    index('reliquary_snapshots_created_idx').on(table.createdAt),
  ],
);

export const reliquaryAttestationsTable = pgTable(
  'reliquary_attestations',
  {
    id: serial('id').primaryKey(),
    merkleRoot: text('merkle_root').notNull(),
    artifactCount: integer('artifact_count').notNull().default(0),
    contentHashesSnapshot: jsonb('content_hashes_snapshot').notNull(),
    proofReceiptId: text('proof_receipt_id'),
    verifiedAt: timestamp('verified_at'),
    verificationResult: text('verification_result'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('reliquary_attestations_merkle_idx').on(table.merkleRoot),
    index('reliquary_attestations_created_idx').on(table.createdAt),
  ],
);

export const reliquarySovereignStateTable = pgTable(
  'reliquary_sovereign_state',
  {
    id: serial('id').primaryKey(),
    active: boolean('active').notNull().default(false),
    activatedBy: text('activated_by'),
    reason: text('reason'),
    activatedAt: timestamp('activated_at'),
    deactivatedAt: timestamp('deactivated_at'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

export type ReliquaryCatalog = typeof reliquaryCatalogTable.$inferSelect;
export type InsertReliquaryCatalog = typeof reliquaryCatalogTable.$inferInsert;
export type ReliquaryLineageEdge = typeof reliquaryLineageEdgesTable.$inferSelect;
export type ReliquarySnapshot = typeof reliquarySnapshotsTable.$inferSelect;
export type ReliquaryAttestation = typeof reliquaryAttestationsTable.$inferSelect;
export type ReliquarySovereignState = typeof reliquarySovereignStateTable.$inferSelect;
