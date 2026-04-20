import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const incaProjectsTable = pgTable('inca_projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: ['research', 'development', 'testing', 'deployed', 'archived'] })
    .notNull()
    .default('research'),
  domain: text('domain'),
  accuracy: numeric('accuracy', { precision: 5, scale: 2 }),
  loss: numeric('loss', { precision: 8, scale: 6 }),
  inferenceTime: integer('inference_time'),
  startDate: text('start_date'),
  lastUpdated: text('last_updated'),
  progress: integer('progress').default(0),
  team: jsonb('team'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const incaExperimentsTable = pgTable(
  'inca_experiments',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => incaProjectsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    hypothesis: text('hypothesis'),
    results: text('results'),
    status: text('status', { enum: ['queued', 'running', 'completed', 'failed', 'canceled'] })
      .notNull()
      .default('queued'),
    hyperparameters: jsonb('hyperparameters'),
    startDate: text('start_date'),
    endDate: text('end_date'),
    duration: text('duration'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('inca_experiments_project_idx').on(t.projectId)],
);

export const incaModelsTable = pgTable(
  'inca_models',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => incaProjectsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    architecture: text('architecture'),
    version: text('version'),
    accuracy: numeric('accuracy', { precision: 5, scale: 2 }),
    speed: integer('speed'),
    cost: integer('cost'),
    robustness: integer('robustness'),
    interpretability: integer('interpretability'),
    parameters: text('parameters'),
    trainingData: text('training_data'),
    status: text('status', { enum: ['training', 'staging', 'production', 'retired'] })
      .notNull()
      .default('training'),
    lastTrained: text('last_trained'),
    performanceHistory: jsonb('performance_history'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('inca_models_project_idx').on(t.projectId)],
);

export const incaInsightsTable = pgTable('inca_insights', {
  id: serial('id').primaryKey(),
  category: text('category', { enum: ['success', 'warning', 'trend', 'discovery'] }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  sourceExperiment: text('source_experiment'),
  confidence: integer('confidence'),
  impact: text('impact', { enum: ['high', 'medium', 'low'] })
    .notNull()
    .default('medium'),
  date: text('date'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const incaDatasetsTable = pgTable(
  'inca_datasets',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').references(() => incaProjectsTable.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    description: text('description'),
    size: text('size'),
    format: text('format'),
    source: text('source'),
    recordCount: integer('record_count'),
    status: text('status', { enum: ['raw', 'processed', 'validated', 'archived'] })
      .notNull()
      .default('raw'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('inca_datasets_project_idx').on(t.projectId)],
);

export const insertIncaProjectSchema = createInsertSchema(incaProjectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIncaProject = z.infer<typeof insertIncaProjectSchema>;
export type IncaProject = typeof incaProjectsTable.$inferSelect;

export const insertIncaExperimentSchema = createInsertSchema(incaExperimentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIncaExperiment = z.infer<typeof insertIncaExperimentSchema>;
export type IncaExperiment = typeof incaExperimentsTable.$inferSelect;

export const insertIncaModelSchema = createInsertSchema(incaModelsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIncaModel = z.infer<typeof insertIncaModelSchema>;
export type IncaModelRow = typeof incaModelsTable.$inferSelect;

export const insertIncaInsightSchema = createInsertSchema(incaInsightsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertIncaInsight = z.infer<typeof insertIncaInsightSchema>;
export type IncaInsight = typeof incaInsightsTable.$inferSelect;

export const insertIncaDatasetSchema = createInsertSchema(incaDatasetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIncaDataset = z.infer<typeof insertIncaDatasetSchema>;
export type IncaDataset = typeof incaDatasetsTable.$inferSelect;
