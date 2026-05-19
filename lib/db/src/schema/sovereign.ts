/**
 * Sovereign Substrate — registry of AI artifacts published to HuggingFace
 * Buckets with cryptographic Proof Packets.
 *
 * Backs the `/sovereign` catalog in A11oy and the `sovereign.searchArtifacts`
 * MCP tool. Every row binds a content hash to a bucket URI, packet hash,
 * trust tier, and the most recent verification state.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const SOVEREIGN_TRUST_TIERS = ['verified', 'community', 'experimental'] as const;
export type SovereignTrustTier = (typeof SOVEREIGN_TRUST_TIERS)[number];

export const SOVEREIGN_ARTIFACT_KINDS = [
  'model',
  'dataset',
  'eval-snapshot',
  'agent-skill',
] as const;
export type SovereignArtifactKind = (typeof SOVEREIGN_ARTIFACT_KINDS)[number];

export const SOVEREIGN_BUCKETS = ['forge-models', 'forge-datasets', 'forge-public'] as const;
export type SovereignBucket = (typeof SOVEREIGN_BUCKETS)[number];

export const SOVEREIGN_VERIFICATION_STATES = [
  'unverified',
  'verified',
  'failed',
  'revoked',
] as const;
export type SovereignVerificationState = (typeof SOVEREIGN_VERIFICATION_STATES)[number];

export const sovereignArtifactsTable = pgTable(
  'sovereign_artifacts',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    kind: varchar('kind', { length: 40 }).notNull(),
    task: varchar('task', { length: 80 }),
    bucket: varchar('bucket', { length: 40 }).notNull(),
    bucketUri: text('bucket_uri').notNull(),
    packetUri: text('packet_uri').notNull(),
    contentHash: text('content_hash').notNull(),
    packetHash: text('packet_hash').notNull(),
    trustTier: varchar('trust_tier', { length: 20 }).notNull().default('experimental'),
    visibility: varchar('visibility', { length: 20 }).notNull().default('private'),
    biasScore: numeric('bias_score', { precision: 5, scale: 4 }),
    mirrorEvalScore: numeric('mirror_eval_score', { precision: 5, scale: 4 }),
    evalSummary: jsonb('eval_summary')
      .$type<Record<string, number>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    sourceModelVersionId: varchar('source_model_version_id'),
    signerId: varchar('signer_id', { length: 120 }).notNull(),
    publicKeyId: varchar('public_key_id', { length: 120 }).notNull(),
    revocationUrl: text('revocation_url'),
    verificationState: varchar('verification_state', { length: 20 })
      .notNull()
      .default('unverified'),
    lastVerifiedAt: timestamp('last_verified_at'),
    expiresAt: timestamp('expires_at'),
    publishedAt: timestamp('published_at').notNull().defaultNow(),
    license: varchar('license', { length: 60 }),
    tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    isRevoked: boolean('is_revoked').notNull().default(false),
    orgId: integer('org_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    uniqHash: uniqueIndex('sovereign_artifacts_content_uniq').on(t.contentHash, t.bucket),
    byKind: index('sovereign_artifacts_kind_idx').on(t.kind, t.trustTier),
    byBucket: index('sovereign_artifacts_bucket_idx').on(t.bucket),
  }),
);

export type SovereignArtifact = typeof sovereignArtifactsTable.$inferSelect;
export type SovereignArtifactInsert = typeof sovereignArtifactsTable.$inferInsert;
