import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const osRecommendationsTable = pgTable(
  'os_recommendations',
  {
    id: serial('id').primaryKey(),
    recId: text('rec_id').notNull(),
    variant: text('variant').notNull(),
    priority: text('priority').notNull(),
    status: text('status').notNull().default('pending'),
    category: text('category'),
    title: text('title').notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('os_recommendations_variant_idx').on(t.variant),
    index('os_recommendations_rec_id_idx').on(t.recId),
    index('os_recommendations_status_idx').on(t.status),
  ],
);

export const insertOsRecommendationSchema = createInsertSchema(osRecommendationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOsRecommendation = z.infer<typeof insertOsRecommendationSchema>;
export type OsRecommendation = typeof osRecommendationsTable.$inferSelect;

export const osSourceHealthTable = pgTable(
  'os_source_health',
  {
    id: serial('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    variant: text('variant').notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('os_source_health_variant_idx').on(t.variant),
  ],
);

export const insertOsSourceHealthSchema = createInsertSchema(osSourceHealthTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOsSourceHealth = z.infer<typeof insertOsSourceHealthSchema>;
export type OsSourceHealth = typeof osSourceHealthTable.$inferSelect;

export const osRunsTable = pgTable(
  'os_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull(),
    variant: text('variant').notNull(),
    status: text('status').notNull().default('completed'),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('os_runs_variant_idx').on(t.variant),
    index('os_runs_run_id_idx').on(t.runId),
  ],
);

export const insertOsRunSchema = createInsertSchema(osRunsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOsRun = z.infer<typeof insertOsRunSchema>;
export type OsRun = typeof osRunsTable.$inferSelect;

export const osEvalResultsTable = pgTable(
  'os_eval_results',
  {
    id: serial('id').primaryKey(),
    skillName: text('skill_name').notNull(),
    passRate: integer('pass_rate_bps').notNull(),
    total: integer('total').notNull(),
    passed: integer('passed').notNull(),
    regressions: integer('regressions').notNull().default(0),
    trend: text('trend').notNull().default('stable'),
    lastRunAt: timestamp('last_run_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export const insertOsEvalResultSchema = createInsertSchema(osEvalResultsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOsEvalResult = z.infer<typeof insertOsEvalResultSchema>;
export type OsEvalResult = typeof osEvalResultsTable.$inferSelect;

export const osCommandKpisTable = pgTable(
  'os_command_kpis',
  {
    id: serial('id').primaryKey(),
    data: jsonb('data').notNull(),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
);

export const osPlatformStatsTable = pgTable(
  'os_platform_stats',
  {
    id: serial('id').primaryKey(),
    data: jsonb('data').notNull(),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
);
