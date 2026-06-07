/**
 * Open Evaluation Layer — database schema
 *
 * Tables:
 *  eval_benchmarks            — benchmark/dataset definitions (eval.yaml records)
 *  eval_benchmark_tasks       — individual tasks within a benchmark
 *  eval_results               — submitted evaluation results (eval_results.yaml records)
 *  eval_verification_tokens   — cryptographic proofs from sandboxed re-runs
 *  eval_community_submissions — PR-gate for community-contributed scores
 */

import { sql } from 'drizzle-orm';
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
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Benchmarks ───────────────────────────────────────────────────────────────

export const evalBenchmarksTable = pgTable(
  'eval_benchmarks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    benchmarkId: varchar('benchmark_id', { length: 256 }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    domain: varchar('domain', { length: 128 }).notNull(),
    evaluationFramework: varchar('evaluation_framework', { length: 64 }).notNull(),
    /** Serialized EvalBenchmarkTask[] */
    tasks: jsonb('tasks').notNull().default(sql`'[]'::jsonb`),
    tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
    paperUrl: text('paper_url'),
    isCrossCutting: boolean('is_cross_cutting').notNull().default(false),
    /** Seed = shipped with platform; tenant = org-defined */
    source: varchar('source', { length: 32 }).notNull().default('tenant'),
    orgId: integer('org_id'),
    /** Soft-delete / archive */
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('eval_benchmarks_benchmark_id_org_idx').on(t.benchmarkId, t.orgId),
    index('eval_benchmarks_domain_idx').on(t.domain),
    index('eval_benchmarks_cross_cutting_idx').on(t.isCrossCutting),
    index('eval_benchmarks_source_idx').on(t.source),
  ],
);

export type EvalBenchmarkRow = typeof evalBenchmarksTable.$inferSelect;
export type InsertEvalBenchmark = typeof evalBenchmarksTable.$inferInsert;

// ─── Results ──────────────────────────────────────────────────────────────────

export const evalResultsTable = pgTable(
  'eval_results',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    /** FK to eval_benchmarks.benchmark_id — denormalized for easy join-free queries */
    benchmarkId: varchar('benchmark_id', { length: 256 }).notNull(),
    benchmarkName: text('benchmark_name'),
    taskId: varchar('task_id', { length: 256 }).notNull(),
    /** The entity that produced this result */
    entityId: varchar('entity_id', { length: 256 }).notNull(),
    entityLabel: text('entity_label').notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    domain: varchar('domain', { length: 128 }).notNull(),
    metric: varchar('metric', { length: 128 }).notNull(),
    /** Stored as text to handle boolean, numeric, and string values uniformly */
    value: text('value').notNull(),
    unit: varchar('unit', { length: 32 }),
    higherIsBetter: boolean('higher_is_better').notNull().default(true),
    /** Numeric cast of value for ranking queries. NULL for non-numeric. */
    numericValue: numeric('numeric_value', { precision: 20, scale: 8 }),
    evaluationFramework: varchar('evaluation_framework', { length: 64 }),
    /** Badge state: verified | community | leaderboard | source */
    badgeState: varchar('badge_state', { length: 32 }).notNull().default('community'),
    verifyToken: varchar('verify_token', { length: 512 }),
    evalDate: varchar('eval_date', { length: 32 }),
    sourceUrl: text('source_url'),
    notes: text('notes'),
    tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
    /** Raw YAML payload for auditability */
    rawYaml: jsonb('raw_yaml'),
    submittedBy: varchar('submitted_by', { length: 256 }),
    orgId: integer('org_id'),
    /** FK to eval_community_submissions.id if submitted via PR flow */
    submissionId: uuid('submission_id'),
    /** FK to eval_verification_tokens.id once verified */
    verificationTokenId: uuid('verification_token_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('eval_results_benchmark_task_idx').on(t.benchmarkId, t.taskId),
    index('eval_results_entity_idx').on(t.entityId, t.entityType),
    index('eval_results_domain_idx').on(t.domain),
    index('eval_results_badge_state_idx').on(t.badgeState),
    index('eval_results_numeric_value_idx').on(t.numericValue),
    index('eval_results_org_idx').on(t.orgId),
    index('eval_results_submitted_by_idx').on(t.submittedBy),
    index('eval_results_eval_date_idx').on(t.evalDate),
  ],
);

export type EvalResultRow = typeof evalResultsTable.$inferSelect;
export type InsertEvalResult = typeof evalResultsTable.$inferInsert;

// ─── Verification Tokens ──────────────────────────────────────────────────────

export const evalVerificationTokensTable = pgTable(
  'eval_verification_tokens',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    resultId: uuid('result_id').notNull(),
    /** status: pending | running | passed | failed | expired */
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    verifyToken: varchar('verify_token', { length: 512 }).notNull(),
    /** Cryptographic signature / signed JWT of the re-run report */
    proof: text('proof'),
    /** Re-run score (numeric) for delta comparison */
    rerunNumericValue: numeric('rerun_numeric_value', { precision: 20, scale: 8 }),
    /** Delta between submitted and re-run value */
    delta: numeric('delta', { precision: 20, scale: 8 }),
    verifiedBy: varchar('verified_by', { length: 32 }),
    notes: text('notes'),
    /** Full re-run report stored for auditability */
    rerunReport: jsonb('rerun_report'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('eval_verification_tokens_result_id_idx').on(t.resultId),
    index('eval_verification_tokens_status_idx').on(t.status),
  ],
);

export type EvalVerificationTokenRow = typeof evalVerificationTokensTable.$inferSelect;
export type InsertEvalVerificationToken = typeof evalVerificationTokensTable.$inferInsert;

// ─── Community Submissions (PR-gate) ─────────────────────────────────────────

export const evalCommunitySubmissionsTable = pgTable(
  'eval_community_submissions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    /** Short human-readable title for the PR */
    title: text('title').notNull(),
    /** status: open | merged | rejected | closed */
    status: varchar('status', { length: 32 }).notNull().default('open'),
    /** Raw YAML payload submitted */
    yamlPayload: jsonb('yaml_payload').notNull(),
    prDescription: text('pr_description'),
    /** GitHub PR number once opened */
    githubPrNumber: integer('github_pr_number'),
    /** GitHub PR URL once opened */
    githubPrUrl: text('github_pr_url'),
    /** Branch created for this PR */
    branchName: varchar('branch_name', { length: 256 }),
    submittedBy: varchar('submitted_by', { length: 256 }).notNull(),
    orgId: integer('org_id'),
    /** Admin who accepted or rejected */
    reviewedBy: varchar('reviewed_by', { length: 256 }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),
    /** Once merged, how many eval_results rows were created */
    resultCount: integer('result_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('eval_community_submissions_status_idx').on(t.status),
    index('eval_community_submissions_org_idx').on(t.orgId),
    index('eval_community_submissions_submitted_by_idx').on(t.submittedBy),
  ],
);

export type EvalCommunitySubmissionRow = typeof evalCommunitySubmissionsTable.$inferSelect;
export type InsertEvalCommunitySubmission = typeof evalCommunitySubmissionsTable.$inferInsert;
