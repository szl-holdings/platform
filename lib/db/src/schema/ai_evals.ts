import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const aiTracesTable = pgTable(
  'ai_traces',
  {
    traceId: varchar('trace_id', { length: 128 }).primaryKey(),
    correlationId: varchar('correlation_id', { length: 128 }),
    orgId: integer('org_id'),
    agentId: varchar('agent_id', { length: 128 }),
    model: varchar('model', { length: 200 }).notNull(),
    modelProvider: varchar('model_provider', { length: 100 }).notNull(),
    modelVersion: varchar('model_version', { length: 100 }),
    routeClass: varchar('route_class', { length: 100 }),
    domain: varchar('domain', { length: 80 }).notNull(),
    recommendationType: varchar('recommendation_type', { length: 80 }).notNull(),
    promptHash: varchar('prompt_hash', { length: 32 }).notNull(),
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    latencyMs: integer('latency_ms').notNull().default(0),
    costEstimateUsd: numeric('cost_estimate_usd', { precision: 14, scale: 8 })
      .notNull()
      .default('0'),
    confidence: numeric('confidence', { precision: 6, scale: 4 }).notNull().default('1'),
    riskLevel: varchar('risk_level', { length: 20 }),
    requiresReview: boolean('requires_review').notNull().default(false),
    reviewReason: text('review_reason'),
    proofChainId: integer('proof_chain_id'),
    outcomeGraphId: integer('outcome_graph_id'),
    inputSummary: text('input_summary'),
    outputSummary: text('output_summary'),
    toolsUsed: jsonb('tools_used').$type<string[]>(),
    evalScore: numeric('eval_score', { precision: 6, scale: 4 }),
    evalPassed: boolean('eval_passed'),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    capturedAt: timestamp('captured_at').notNull().defaultNow(),
  },
  (t) => ({
    idxOrgId: index('ai_traces_org_id_idx').on(t.orgId),
    idxDomain: index('ai_traces_domain_idx').on(t.domain),
    idxStatus: index('ai_traces_status_idx').on(t.status),
    idxRequiresReview: index('ai_traces_requires_review_idx').on(t.requiresReview),
    idxCapturedAt: index('ai_traces_captured_at_idx').on(t.capturedAt),
    idxOrgDomain: index('ai_traces_org_domain_idx').on(t.orgId, t.domain),
  }),
);

/**
 * eval_harness_runs — durable store for signed Governed Evaluation Harness run reports.
 *
 * Written by the eval-runner Python sidecar via psycopg2 when DATABASE_URL is set.
 * Each row is immutable once status = 'completed'; HMAC signature covers content_hash.
 */
export const evalHarnessRunsTable = pgTable(
  'eval_harness_runs',
  {
    runId: varchar('run_id', { length: 128 }).primaryKey(),
    suiteId: varchar('suite_id', { length: 100 }).notNull(),
    suiteName: varchar('suite_name', { length: 200 }).notNull().default(''),
    suiteContentHash: varchar('suite_content_hash', { length: 64 }).notNull().default(''),
    modelId: varchar('model_id', { length: 200 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    triggeredBy: varchar('triggered_by', { length: 100 }).notNull().default('api'),
    baselineRunId: varchar('baseline_run_id', { length: 128 }),
    seed: integer('seed'),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    error: text('error'),
    totalCases: integer('total_cases').notNull().default(0),
    passedCases: integer('passed_cases').notNull().default(0),
    failedCases: integer('failed_cases').notNull().default(0),
    passRate: real('pass_rate').notNull().default(0),
    aggregateScore: real('aggregate_score').notNull().default(0),
    categories: jsonb('categories').$type<Record<string, {
      total: number; passed: number; pass_rate: number; weighted_score: number;
    }>>().notNull().default(sql`'{}'::jsonb`),
    caseResults: jsonb('case_results').$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
    contentHash: varchar('content_hash', { length: 64 }).notNull().default(''),
    signature: varchar('signature', { length: 64 }).notNull().default(''),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    durationMs: integer('duration_ms').notNull().default(0),
  },
  (t) => ({
    idxSuiteId: index('eval_harness_runs_suite_id_idx').on(t.suiteId),
    idxModelId: index('eval_harness_runs_model_id_idx').on(t.modelId),
    idxStatus: index('eval_harness_runs_status_idx').on(t.status),
    idxStartedAt: index('eval_harness_runs_started_at_idx').on(t.startedAt),
    idxSuiteModel: index('eval_harness_runs_suite_model_idx').on(t.suiteId, t.modelId),
  }),
);

/**
 * eval_evidence_records — links a completed harness run to a Proof Chain entry.
 *
 * Every time the validation gate passes, an evidence record is written here.
 * The `proof_chain_content_id` ties this record to a row in the proof_chain table
 * (contentType='eval_harness_run') so every promotion decision has a traceable
 * evidence artifact in the immutable Proof Chain.
 *
 * Written by attachHarnessEvidenceToPassport() in validation-gate.ts after a
 * gate pass.  Each record is append-only — never updated.
 */
export const evalEvidenceRecordsTable = pgTable(
  'eval_evidence_records',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    runId: varchar('run_id', { length: 128 }).notNull(),
    modelId: varchar('model_id', { length: 200 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    suiteId: varchar('suite_id', { length: 100 }).notNull(),
    passRate: real('pass_rate').notNull(),
    aggregateScore: real('aggregate_score').notNull().default(0),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    signature: varchar('signature', { length: 64 }).notNull(),
    suiteContentHash: varchar('suite_content_hash', { length: 64 }).notNull().default(''),
    // Proof Chain linkage — contentId used to find the proof_chain row
    proofChainContentId: varchar('proof_chain_content_id', { length: 200 }),
    proofChainId: integer('proof_chain_id'),
    triggeredBy: varchar('triggered_by', { length: 100 }).notNull().default('validation_gate'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    idxRunId: index('eval_evidence_records_run_id_idx').on(t.runId),
    idxModelId: index('eval_evidence_records_model_id_idx').on(t.modelId),
    idxCreatedAt: index('eval_evidence_records_created_at_idx').on(t.createdAt),
  }),
);

export type EvalEvidenceRecord = typeof evalEvidenceRecordsTable.$inferSelect;
export type InsertEvalEvidenceRecord = typeof evalEvidenceRecordsTable.$inferInsert;

export const aiReviewQueueTable = pgTable(
  'ai_review_queue',
  {
    reviewId: varchar('review_id', { length: 128 }).primaryKey(),
    traceId: varchar('trace_id', { length: 128 }).notNull(),
    orgId: integer('org_id'),
    domain: varchar('domain', { length: 80 }).notNull(),
    recommendationType: varchar('recommendation_type', { length: 80 }).notNull(),
    model: varchar('model', { length: 200 }).notNull(),
    confidence: numeric('confidence', { precision: 6, scale: 4 }).notNull().default('1'),
    riskLevel: varchar('risk_level', { length: 20 }),
    reviewReason: text('review_reason').notNull(),
    priority: varchar('priority', { length: 20 }).notNull().default('low'),
    inputSummary: text('input_summary'),
    outputSummary: text('output_summary'),
    costEstimateUsd: numeric('cost_estimate_usd', { precision: 14, scale: 8 })
      .notNull()
      .default('0'),
    latencyMs: integer('latency_ms').notNull().default(0),
    evalScore: numeric('eval_score', { precision: 6, scale: 4 }),
    evalPassed: boolean('eval_passed'),
    verdict: varchar('verdict', { length: 30 }),
    reviewedBy: integer('reviewed_by'),
    reviewNotes: text('review_notes'),
    escalatedTo: varchar('escalated_to', { length: 200 }),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    enqueuedAt: timestamp('enqueued_at').notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
  },
  (t) => ({
    idxOrgId: index('ai_review_queue_org_id_idx').on(t.orgId),
    idxStatus: index('ai_review_queue_status_idx').on(t.status),
    idxPriority: index('ai_review_queue_priority_idx').on(t.priority),
    idxDomain: index('ai_review_queue_domain_idx').on(t.domain),
    idxEnqueuedAt: index('ai_review_queue_enqueued_at_idx').on(t.enqueuedAt),
    idxTraceId: index('ai_review_queue_trace_id_idx').on(t.traceId),
  }),
);
