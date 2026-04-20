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

export const replayScenariosTable = pgTable(
  'replay_scenarios',
  {
    id: serial('id').primaryKey(),
    scenarioId: text('scenario_id').notNull().unique(),
    name: text('name').notNull(),
    domain: text('domain').notNull(),
    description: text('description').notNull().default(''),
    tags: text('tags').array().notNull().default([]),
    snapshotCount: integer('snapshot_count').notNull().default(0),
    lastReplayed: timestamp('last_replayed', { withTimezone: true }),
    lastOutcome: text('last_outcome'),
    groundTruthMatchRate: real('ground_truth_match_rate'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('replay_scenarios_domain_idx').on(t.domain),
    index('replay_scenarios_updated_at_idx').on(t.updatedAt),
  ],
);

export const replaySnapshotsTable = pgTable(
  'replay_snapshots',
  {
    id: serial('id').primaryKey(),
    snapshotId: text('snapshot_id').notNull().unique(),
    scenarioId: text('scenario_id').notNull(),
    label: text('label').notNull(),
    domain: text('domain').notNull(),
    snapshotType: text('snapshot_type').notNull(),
    historicalContext: jsonb('historical_context').notNull().default({}),
    agentInputs: jsonb('agent_inputs').notNull().default([]),
    groundTruth: jsonb('ground_truth'),
    sanitized: boolean('sanitized').notNull().default(true),
    version: text('version').notNull().default('1.0'),
    tags: text('tags').array().notNull().default([]),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('replay_snapshots_scenario_id_idx').on(t.scenarioId),
    index('replay_snapshots_domain_idx').on(t.domain),
    index('replay_snapshots_type_idx').on(t.snapshotType),
  ],
);

export const replayRunsTable = pgTable(
  'replay_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    scenarioId: text('scenario_id').notNull(),
    scenarioName: text('scenario_name').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
    totalSnapshots: integer('total_snapshots').notNull().default(0),
    successful: integer('successful').notNull().default(0),
    failed: integer('failed').notNull().default(0),
    avgLatencyMs: real('avg_latency_ms').notNull().default(0),
    groundTruthMatchRate: real('ground_truth_match_rate').notNull().default(0),
    totalCostUsd: real('total_cost_usd').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('replay_runs_scenario_id_idx').on(t.scenarioId),
    index('replay_runs_started_at_idx').on(t.startedAt),
  ],
);

export const evalBaselinesTable = pgTable(
  'eval_baselines',
  {
    id: serial('id').primaryKey(),
    suiteId: text('suite_id').notNull(),
    model: text('model').notNull().default('default'),
    passRate: real('pass_rate').notNull().default(0),
    avgScore: real('avg_score').notNull().default(0),
    avgLatencyMs: real('avg_latency_ms').notNull().default(0),
    totalCostUsd: real('total_cost_usd').notNull().default(0),
    version: text('version').notNull().default('1.0'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('eval_baselines_suite_model_idx').on(t.suiteId, t.model),
    index('eval_baselines_recorded_at_idx').on(t.recordedAt),
  ],
);

export type ReplayScenarioRow = typeof replayScenariosTable.$inferSelect;
export type InsertReplayScenario = typeof replayScenariosTable.$inferInsert;
export type ReplaySnapshotRow = typeof replaySnapshotsTable.$inferSelect;
export type InsertReplaySnapshot = typeof replaySnapshotsTable.$inferInsert;
export type ReplayRunRow = typeof replayRunsTable.$inferSelect;
export type InsertReplayRun = typeof replayRunsTable.$inferInsert;
export type EvalBaselineRow = typeof evalBaselinesTable.$inferSelect;
export type InsertEvalBaseline = typeof evalBaselinesTable.$inferInsert;
