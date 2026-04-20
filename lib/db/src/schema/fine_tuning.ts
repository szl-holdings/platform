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
  exportedAt: timestamp('exported_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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

export type FineTuningJob = typeof fineTuningJobs.$inferSelect;
export type FineTunedModelRegistry = typeof fineTunedModelRegistry.$inferSelect;
export type FineTuningDataset = typeof fineTuningDatasets.$inferSelect;
export type InsertFineTuningJob = z.infer<typeof insertFineTuningJobSchema>;
export type InsertFineTunedModel = z.infer<typeof insertFineTunedModelSchema>;
export type InsertFineTuningDataset = z.infer<typeof insertFineTuningDatasetSchema>;
