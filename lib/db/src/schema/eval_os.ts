import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const evalDomainEnum = pgEnum('eval_domain', [
  'terra',
  'prism-counsel',
  'vessels',
  'aegis',
  'lyte',
  'carlota-jo',
  'imperium',
  'platform',
  'pulse',
  'cross-domain',
]);

export const evalStatusEnum = pgEnum('eval_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export const evalGraderTypeEnum = pgEnum('eval_grader_type', [
  'prompt-eval',
  'model-routing-eval',
  'tool-reliability',
  'agent-workflow-eval',
  'policy-adherence',
  'citation-quality',
  'hallucination',
  'bias-safety',
  'latency-cost',
  'trace-grading',
  'human-review',
  'exact-match',
  'semantic-similarity',
  'custom',
]);

export const evalSeverityEnum = pgEnum('eval_severity', ['none', 'minor', 'major', 'critical']);

export const evalSuitesTable = pgTable(
  'eval_suites',
  {
    id: serial('id').primaryKey(),
    suiteId: text('suite_id').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    domain: evalDomainEnum('domain').notNull(),
    version: integer('version').notNull().default(1),
    latestVersion: integer('latest_version').notNull().default(1),
    graderTypes: text('grader_types').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    config: jsonb('config').default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('eval_suites_domain_idx').on(t.domain),
    index('eval_suites_active_idx').on(t.isActive),
  ],
);

export const evalCasesTable = pgTable(
  'eval_cases',
  {
    id: serial('id').primaryKey(),
    caseId: text('case_id').notNull().unique(),
    suiteId: text('suite_id').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    domain: evalDomainEnum('domain').notNull(),
    graderType: evalGraderTypeEnum('grader_type').notNull(),
    input: jsonb('input').notNull().default({}),
    groundTruth: jsonb('ground_truth').notNull().default({}),
    expectedOutcome: text('expected_outcome').notNull().default('pass'),
    policies: text('policies').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    isRedTeam: boolean('is_red_team').notNull().default(false),
    version: integer('version').notNull().default(1),
    weight: real('weight').notNull().default(1.0),
    config: jsonb('config').default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('eval_cases_suite_idx').on(t.suiteId),
    index('eval_cases_domain_idx').on(t.domain),
    index('eval_cases_grader_idx').on(t.graderType),
    index('eval_cases_red_team_idx').on(t.isRedTeam),
  ],
);

export const evalRunsTable = pgTable(
  'eval_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    suiteId: text('suite_id').notNull(),
    suiteName: text('suite_name'),
    domain: evalDomainEnum('domain'),
    status: evalStatusEnum('status').notNull().default('pending'),
    triggeredBy: text('triggered_by').notNull().default('api'),
    model: text('model'),
    totalCases: integer('total_cases').notNull().default(0),
    passedCases: integer('passed_cases').notNull().default(0),
    failedCases: integer('failed_cases').notNull().default(0),
    passRate: real('pass_rate'),
    avgScore: real('avg_score'),
    avgLatencyMs: real('avg_latency_ms'),
    totalCostUsd: real('total_cost_usd'),
    totalTokensUsed: integer('total_tokens_used'),
    hasRegression: boolean('has_regression'),
    regressionSeverity: evalSeverityEnum('regression_severity'),
    regressionNotes: text('regression_notes').array().notNull().default([]),
    improvementNotes: text('improvement_notes').array().notNull().default([]),
    baselineRunId: text('baseline_run_id'),
    traceIds: text('trace_ids').array().notNull().default([]),
    summary: jsonb('summary').default({}),
    error: text('error'),
    startedAt: bigint('started_at', { mode: 'number' }),
    completedAt: bigint('completed_at', { mode: 'number' }),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('eval_runs_suite_idx').on(t.suiteId),
    index('eval_runs_status_idx').on(t.status),
    index('eval_runs_domain_idx').on(t.domain),
    index('eval_runs_regression_idx').on(t.hasRegression),
    index('eval_runs_created_idx').on(t.createdAt),
  ],
);

export const evalScoresTable = pgTable(
  'eval_scores',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    scoreId: text('score_id').notNull().unique(),
    runId: text('run_id').notNull(),
    caseId: text('case_id').notNull(),
    suiteId: text('suite_id').notNull(),
    domain: evalDomainEnum('domain').notNull(),
    graderType: evalGraderTypeEnum('grader_type').notNull(),
    passed: boolean('passed').notNull(),
    score: real('score').notNull(),
    expectedOutcome: text('expected_outcome').notNull().default('pass'),
    input: jsonb('input').notNull().default({}),
    output: jsonb('output').notNull().default({}),
    groundTruth: jsonb('ground_truth').notNull().default({}),
    latencyMs: real('latency_ms').notNull().default(0),
    tokensUsed: integer('tokens_used').notNull().default(0),
    costUsd: real('cost_usd').notNull().default(0),
    model: text('model'),
    traceId: text('trace_id'),
    humanLabel: text('human_label'),
    humanNotes: text('human_notes'),
    humanLabeledBy: text('human_labeled_by'),
    humanLabeledAt: timestamp('human_labeled_at'),
    failureReason: text('failure_reason'),
    tags: text('tags').array().notNull().default([]),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('eval_scores_run_idx').on(t.runId),
    index('eval_scores_case_idx').on(t.caseId),
    index('eval_scores_suite_idx').on(t.suiteId),
    index('eval_scores_domain_idx').on(t.domain),
    index('eval_scores_passed_idx').on(t.passed),
    index('eval_scores_human_label_idx').on(t.humanLabel),
  ],
);

export type EvalSuiteRow = typeof evalSuitesTable.$inferSelect;
export type EvalCaseRow = typeof evalCasesTable.$inferSelect;
export type EvalRunRow = typeof evalRunsTable.$inferSelect;
export type EvalScoreRow = typeof evalScoresTable.$inferSelect;

export type NewEvalSuite = typeof evalSuitesTable.$inferInsert;
export type NewEvalCase = typeof evalCasesTable.$inferInsert;
export type NewEvalRun = typeof evalRunsTable.$inferInsert;
export type NewEvalScore = typeof evalScoresTable.$inferInsert;
