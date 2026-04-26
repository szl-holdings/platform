import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const fineTuningJobs = pgTable('fine_tuning_jobs', {
  id: serial('id').primaryKey(),
  jobId: text('job_id').notNull().unique(),
  agentId: text('agent_id').notNull(),
  provider: text('provider').notNull(),
  baseModel: text('base_model').notNull(),
  fineTunedModelId: text('fine_tuned_model_id'),
  status: text('status').notNull().default('pending'),
  datasetVersion: text('dataset_version').notNull(),
  datasetSize: integer('dataset_size').notNull().default(0),
  hyperparameters: jsonb('hyperparameters').notNull().default({}),
  evalScores: jsonb('eval_scores'),
  baseModelEvalScores: jsonb('base_model_eval_scores'),
  promotedToLifecycle: text('promoted_to_lifecycle'),
  trainingCostUsd: real('training_cost_usd'),
  errorMessage: text('error_message'),
  triggeredBy: text('triggered_by').default('manual'),
  qualityGatePassed: boolean('quality_gate_passed'),
  qualityReport: jsonb('quality_report'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fineTunedModelRegistry = pgTable('fine_tuned_model_registry', {
  id: serial('id').primaryKey(),
  modelId: text('model_id').notNull().unique(),
  agentId: text('agent_id').notNull(),
  jobId: text('job_id').notNull(),
  baseModel: text('base_model').notNull(),
  provider: text('provider').notNull(),
  datasetVersion: text('dataset_version').notNull(),
  lifecycle: text('lifecycle').notNull().default('staging'),
  evalPassRate: real('eval_pass_rate'),
  evalScores: jsonb('eval_scores'),
  baseModelEvalScores: jsonb('base_model_eval_scores'),
  costPer1kInput: real('cost_per_1k_input'),
  costPer1kOutput: real('cost_per_1k_output'),
  isActive: boolean('is_active').notNull().default(true),
  canaryTrafficPct: integer('canary_traffic_pct').default(10),
  canaryRequestsTotal: integer('canary_requests_total').default(0),
  canaryRequestsSuccess: integer('canary_requests_success').default(0),
  canaryStartedAt: timestamp('canary_started_at', { withTimezone: true }),
  canaryPromoteThreshold: integer('canary_promote_threshold').default(100),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
  promotedAt: timestamp('promoted_at', { withTimezone: true }),
  deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
});

export const fineTuningDatasets = pgTable('fine_tuning_datasets', {
  id: serial('id').primaryKey(),
  version: text('version').notNull().unique(),
  agentId: text('agent_id').notNull(),
  domain: text('domain').notNull(),
  format: text('format').notNull().default('openai-jsonl'),
  sampleCount: integer('sample_count').notNull().default(0),
  sourceBreakdown: jsonb('source_breakdown').notNull().default({}),
  qualityReport: jsonb('quality_report'),
  exportedAt: timestamp('exported_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fineTuningTriggerConfigs = pgTable('fine_tuning_trigger_configs', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull().unique(),
  enabled: boolean('enabled').notNull().default(true),
  correctionThreshold: integer('correction_threshold').notNull().default(50),
  evalScoreDropThreshold: real('eval_score_drop_threshold').notNull().default(0.05),
  calibrationBiasThreshold: real('calibration_bias_threshold').notNull().default(0.15),
  cooldownHours: integer('cooldown_hours').notNull().default(24),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  lastDecision: text('last_decision'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const insertFineTuningJobSchema = createInsertSchema(fineTuningJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertFineTunedModelSchema = createInsertSchema(fineTunedModelRegistry).omit({
  id: true,
  registeredAt: true,
});
export const insertFineTuningDatasetSchema = createInsertSchema(fineTuningDatasets).omit({
  id: true,
  createdAt: true,
});
export const insertFineTuningTriggerConfigSchema = createInsertSchema(
  fineTuningTriggerConfigs,
).omit({ id: true, createdAt: true, updatedAt: true });

export type FineTuningJob = typeof fineTuningJobs.$inferSelect;
export type FineTunedModelRegistry = typeof fineTunedModelRegistry.$inferSelect;
export type FineTuningDataset = typeof fineTuningDatasets.$inferSelect;
export type FineTuningTriggerConfig = typeof fineTuningTriggerConfigs.$inferSelect;
export type InsertFineTuningJob = z.infer<typeof insertFineTuningJobSchema>;
export type InsertFineTunedModel = z.infer<typeof insertFineTunedModelSchema>;
export type InsertFineTuningDataset = z.infer<typeof insertFineTuningDatasetSchema>;
export type InsertFineTuningTriggerConfig = z.infer<typeof insertFineTuningTriggerConfigSchema>;
