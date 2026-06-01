import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const evalForgeSuitesTable = pgTable(
  'eval_forge_suites',
  {
    id: serial('id').primaryKey(),
    suiteId: text('suite_id').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    domain: text('domain').notNull(),
    evalType: text('eval_type').notNull(),
    version: integer('version').default(1).notNull(),
    tags: text('tags').array().notNull().default([]),
    caseCount: integer('case_count').notNull().default(0),
    redTeamCount: integer('red_team_count').notNull().default(0),
    registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('eval_forge_suites_domain_idx').on(t.domain),
    index('eval_forge_suites_eval_type_idx').on(t.evalType),
  ],
);

export const evalForgeRunsTable = pgTable(
  'eval_forge_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    suiteId: text('suite_id').notNull(),
    suiteName: text('suite_name'),
    domain: text('domain'),
    evalType: text('eval_type'),
    model: text('model'),
    triggeredBy: text('triggered_by').notNull().default('api'),
    totalCases: integer('total_cases').notNull().default(0),
    passed: integer('passed').notNull().default(0),
    failed: integer('failed').notNull().default(0),
    passRate: real('pass_rate').notNull().default(0),
    avgScore: real('avg_score').notNull().default(0),
    avgLatencyMs: real('avg_latency_ms').notNull().default(0),
    totalCostUsd: real('total_cost_usd').notNull().default(0),
    totalTokensUsed: integer('total_tokens_used').notNull().default(0),
    metrics: jsonb('metrics'),
    caseResults: jsonb('case_results'),
    hasRegression: boolean('has_regression').default(false),
    regressionSeverity: text('regression_severity'),
    regressionNotes: text('regression_notes').array().notNull().default([]),
    improvementNotes: text('improvement_notes').array().notNull().default([]),
    baselineRunId: text('baseline_run_id'),
    runAt: timestamp('run_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('eval_forge_runs_suite_idx').on(t.suiteId),
    index('eval_forge_runs_eval_type_idx').on(t.evalType),
    index('eval_forge_runs_run_at_idx').on(t.runAt),
    index('eval_forge_runs_regression_idx').on(t.hasRegression),
  ],
);

export type EvalForgeSuiteRow = typeof evalForgeSuitesTable.$inferSelect;
export type InsertEvalForgeSuite = typeof evalForgeSuitesTable.$inferInsert;
export type EvalForgeRunRow = typeof evalForgeRunsTable.$inferSelect;
export type InsertEvalForgeRun = typeof evalForgeRunsTable.$inferInsert;
