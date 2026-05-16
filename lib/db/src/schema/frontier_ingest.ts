/**
 * Frontier Ingestion Engine — durable schema.
 *
 * The engine pulls discoveries from external AI providers (Anthropic,
 * OpenAI, Google, NVIDIA, HuggingFace), scores them, and either auto-
 * promotes them downstream or queues them for operator review. These
 * tables back the cross-process state shared between the Temporal
 * worker process (writes) and the api-server process (reads/reviews)
 * so that discoveries, the operator inbox, the timeline proof-ledger,
 * promotion records, and spend meters survive restarts.
 *
 * The matching CREATE TABLE statements are also kept in
 * `services/frontier-ingest/src/db-backend.ts` as an idempotent
 * bootstrap so the engine can self-provision in environments where
 * Drizzle migrations haven't been run yet (e.g. ephemeral CI).
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const frontierArtifactsTable = pgTable('frontier_artifacts', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  kind: text('kind').notNull(),
  externalId: text('external_id').notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  summary: text('summary'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  raw: jsonb('raw').$type<Record<string, unknown>>(),
  discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().defaultNow(),
});

export const frontierEvidenceTable = pgTable('frontier_evidence', {
  artifactId: text('artifact_id')
    .primaryKey()
    .references(() => frontierArtifactsTable.id, { onDelete: 'cascade' }),
  score: jsonb('score').$type<Record<string, unknown>>().notNull(),
  decision: text('decision').notNull(),
  promotionTarget: text('promotion_target'),
  evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const frontierInboxTable = pgTable(
  'frontier_inbox',
  {
    id: text('id').primaryKey(),
    artifactId: text('artifact_id')
      .notNull()
      .references(() => frontierArtifactsTable.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: text('reviewed_by'),
    reviewNote: text('review_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idxStatus: index('frontier_inbox_status_idx').on(t.status, t.createdAt),
  }),
);

export const frontierPromotionsTable = pgTable(
  'frontier_promotions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    artifactId: text('artifact_id')
      .notNull()
      .references(() => frontierArtifactsTable.id, { onDelete: 'cascade' }),
    target: text('target').notNull(),
    promotedAt: timestamp('promoted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idxTarget: index('frontier_promotions_target_idx').on(t.target, t.promotedAt),
  }),
);

export const frontierDownstreamTable = pgTable(
  'frontier_downstream',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    target: text('target').notNull(),
    artifactId: text('artifact_id').notNull(),
    proofChainRef: text('proof_chain_ref'),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idxTarget: index('frontier_downstream_target_idx').on(t.target, t.createdAt),
  }),
);

export const frontierTimelineTable = pgTable(
  'frontier_timeline',
  {
    id: text('id').primaryKey(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    kind: text('kind').notNull(),
    provider: text('provider'),
    artifactId: text('artifact_id'),
    inboxId: text('inbox_id'),
    message: text('message').notNull(),
    costUsd: numeric('cost_usd', { precision: 12, scale: 6 }),
  },
  (t) => ({
    idxAt: index('frontier_timeline_at_idx').on(t.at),
  }),
);

/**
 * Lifetime per-provider spend counters. One row per provider; updated
 * on every recordCost. Survives restart so the lifetime cap is enforced
 * across api-server / Temporal worker process boundaries.
 */
export const frontierSpendTable = pgTable('frontier_spend', {
  provider: text('provider').primaryKey(),
  spendUsd: numeric('spend_usd', { precision: 14, scale: 6 }).notNull().default('0'),
  callCount: bigint('call_count', { mode: 'number' }).notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Daily-window spend totals. Single-row table (id = 1) keyed by the
 * rolling 24h window. Persisted so the daily cap is enforced across
 * restarts — previously a process restart would zero the daily meter
 * and let the engine spend another full daily cap.
 */
export const frontierSpendWindowTable = pgTable('frontier_spend_window', {
  id: integer('id').primaryKey().default(1),
  dailyUsd: numeric('daily_usd', { precision: 14, scale: 6 }).notNull().default('0'),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
});

export const frontierSeenTable = pgTable('frontier_seen', {
  artifactId: text('artifact_id').primaryKey(),
  seenAt: timestamp('seen_at', { withTimezone: true }).notNull().defaultNow(),
});

export type FrontierArtifactRow = typeof frontierArtifactsTable.$inferSelect;
export type FrontierInboxRow = typeof frontierInboxTable.$inferSelect;
export type FrontierTimelineRow = typeof frontierTimelineTable.$inferSelect;
export type FrontierPromotionRow = typeof frontierPromotionsTable.$inferSelect;
export type FrontierSpendRow = typeof frontierSpendTable.$inferSelect;
export type FrontierSpendWindowRow = typeof frontierSpendWindowTable.$inferSelect;
