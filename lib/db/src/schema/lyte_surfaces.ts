import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const lyteDriftItemsTable = pgTable('lyte_drift_items', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  program: text('program').notNull(),
  team: text('team').notNull(),
  staleDays: integer('stale_days').notNull(),
  owners: jsonb('owners').notNull().$type<string[]>(),
  evidence: jsonb('evidence').notNull().$type<string[]>(),
  status: text('status').notNull(),
  lastActivity: text('last_activity').notNull(),
  impact: text('impact').notNull(),
  proofRef: text('proof_ref').notNull(),
  orderIdx: integer('order_idx').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lyteDriftHistoryTable = pgTable('lyte_drift_history', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
  count: integer('count').notNull(),
  orderIdx: integer('order_idx').notNull().default(0),
});

export const lytePressureCellsTable = pgTable('lyte_pressure_cells', {
  id: serial('id').primaryKey(),
  team: text('team').notNull(),
  workflow: text('workflow').notNull(),
  account: text('account').notNull(),
  program: text('program').notNull(),
  sponsor: text('sponsor').notNull(),
  openCount: integer('open_count').notNull(),
  overdue: integer('overdue').notNull(),
  blocked: integer('blocked').notNull(),
  escalated: integer('escalated').notNull(),
  score: integer('score').notNull(),
  orderIdx: integer('order_idx').notNull().default(0),
});

export const lyteDebtItemsTable = pgTable('lyte_debt_items', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  team: text('team').notNull(),
  owner: text('owner').notNull(),
  type: text('type').notNull(),
  score: integer('score').notNull(),
  ageDays: integer('age_days').notNull(),
  escalations: integer('escalations').notNull(),
  program: text('program').notNull(),
  evidence: jsonb('evidence').notNull().$type<string[]>(),
  proofRef: text('proof_ref').notNull(),
  status: text('status').notNull(),
  orderIdx: integer('order_idx').notNull().default(0),
});

export const lyteDebtScoreHistoryTable = pgTable('lyte_debt_score_history', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
  critical: integer('critical').notNull(),
  high: integer('high').notNull(),
  medium: integer('medium').notNull(),
  orderIdx: integer('order_idx').notNull().default(0),
});

export const lyteReplayScenariosTable = pgTable('lyte_replay_scenarios', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  decision: text('decision').notNull(),
  outcome: text('outcome').notNull(),
  dateRange: text('date_range').notNull(),
  events: jsonb('events').notNull().$type<unknown[]>(),
  orderIdx: integer('order_idx').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lyteBoardMetricsTable = pgTable('lyte_board_metrics', {
  id: serial('id').primaryKey(),
  label: text('label').notNull().unique(),
  value: text('value').notNull(),
  delta: text('delta'),
  trend: text('trend').notNull(),
  context: text('context').notNull(),
  good: text('good').notNull(),
  orderIdx: integer('order_idx').notNull().default(0),
});

export const lyteBoardRisksTable = pgTable('lyte_board_risks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  severity: text('severity').notNull(),
  domain: text('domain').notNull(),
  signal: text('signal').notNull(),
  recommendation: text('recommendation').notNull(),
  proofRef: text('proof_ref').notNull(),
  interventionOwner: text('intervention_owner').notNull(),
  deadline: text('deadline').notNull(),
  orderIdx: integer('order_idx').notNull().default(0),
});

export type LyteDriftItem = typeof lyteDriftItemsTable.$inferSelect;
export type LytePressureCell = typeof lytePressureCellsTable.$inferSelect;
export type LyteDebtItem = typeof lyteDebtItemsTable.$inferSelect;
export type LyteReplayScenario = typeof lyteReplayScenariosTable.$inferSelect;
export type LyteBoardMetric = typeof lyteBoardMetricsTable.$inferSelect;
export type LyteBoardRisk = typeof lyteBoardRisksTable.$inferSelect;

// Suppress unused-export lint warning when types module is re-exported wholesale.
void doublePrecision;
