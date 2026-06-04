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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Feature Store
// ---------------------------------------------------------------------------

export const mlFeatureDefinitions = pgTable(
  'ml_feature_definitions',
  {
    id: serial('id').primaryKey(),
    featureId: text('feature_id').notNull().unique(),
    name: text('name').notNull(),
    domain: text('domain').notNull(),
    description: text('description'),
    dataType: text('data_type').notNull(),
    computationQuery: text('computation_query'),
    dependencies: jsonb('dependencies').notNull().default([]),
    version: integer('version').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    freshnessIntervalSeconds: integer('freshness_interval_seconds').notNull().default(3600),
    tags: jsonb('tags').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_ml_feature_def_domain').on(t.domain)],
);

export const mlFeatureValues = pgTable(
  'ml_feature_values',
  {
    id: serial('id').primaryKey(),
    featureId: text('feature_id').notNull(),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    value: jsonb('value').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isStale: boolean('is_stale').notNull().default(false),
    pipelineRunId: text('pipeline_run_id'),
  },
  (t) => [
    index('idx_ml_feature_val_entity').on(t.entityId, t.entityType),
    index('idx_ml_feature_val_feature').on(t.featureId),
    uniqueIndex('uq_ml_feature_val_entity_feature').on(t.featureId, t.entityId, t.entityType),
  ],
);

// ---------------------------------------------------------------------------
// Training Datasets
// ---------------------------------------------------------------------------

export const mlDatasets = pgTable(
  'ml_datasets',
  {
    id: serial('id').primaryKey(),
    datasetId: text('dataset_id').notNull().unique(),
    name: text('name').notNull(),
    domain: text('domain').notNull(),
    version: text('version').notNull(),
    description: text('description'),
    splitStrategy: text('split_strategy').notNull().default('temporal'),
    trainFraction: real('train_fraction').notNull().default(0.8),
    valFraction: real('val_fraction').notNull().default(0.1),
    testFraction: real('test_fraction').notNull().default(0.1),
    rowCount: integer('row_count').notNull().default(0),
    featureCount: integer('feature_count').notNull().default(0),
    featureIds: jsonb('feature_ids').notNull().default([]),
    labelColumn: text('label_column').notNull(),
    qualityScore: real('quality_score'),
    biasMetrics: jsonb('bias_metrics'),
    missingValuePct: real('missing_value_pct'),
    classDistribution: jsonb('class_distribution'),
    temporalRange: jsonb('temporal_range'),
    privacyControls: jsonb('privacy_controls').notNull().default({}),
    storageUri: text('storage_uri'),
    checksum: text('checksum'),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    refreshedAt: timestamp('refreshed_at', { withTimezone: true }),
  },
  (t) => [index('idx_ml_dataset_domain').on(t.domain)],
);

// ---------------------------------------------------------------------------
// Training Runs
// ---------------------------------------------------------------------------

export const mlTrainingRuns = pgTable(
  'ml_training_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    domain: text('domain').notNull(),
    modelType: text('model_type').notNull(),
    algorithmFamily: text('algorithm_family').notNull(),
    datasetId: text('dataset_id').notNull(),
    featureIds: jsonb('feature_ids').notNull().default([]),
    hyperparameters: jsonb('hyperparameters').notNull().default({}),
    status: text('status').notNull().default('pending'),
    stage: text('stage').notNull().default('data_extraction'),
    trainMetrics: jsonb('train_metrics'),
    valMetrics: jsonb('val_metrics'),
    testMetrics: jsonb('test_metrics'),
    featureImportance: jsonb('feature_importance'),
    artifactUri: text('artifact_uri'),
    errorMessage: text('error_message'),
    durationSeconds: real('duration_seconds'),
    triggeredBy: text('triggered_by').notNull().default('manual'),
    parentRunId: text('parent_run_id'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_ml_training_domain').on(t.domain),
    index('idx_ml_training_status').on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------

export const mlModelVersions = pgTable(
  'ml_model_versions',
  {
    id: serial('id').primaryKey(),
    modelVersionId: text('model_version_id').notNull().unique(),
    modelName: text('model_name').notNull(),
    domain: text('domain').notNull(),
    version: text('version').notNull(),
    algorithmFamily: text('algorithm_family').notNull(),
    runId: text('run_id').notNull(),
    datasetId: text('dataset_id').notNull(),
    datasetVersion: text('dataset_version').notNull(),
    featureIds: jsonb('feature_ids').notNull().default([]),
    hyperparameters: jsonb('hyperparameters').notNull().default({}),
    trainMetrics: jsonb('train_metrics').notNull().default({}),
    testMetrics: jsonb('test_metrics').notNull().default({}),
    featureImportance: jsonb('feature_importance'),
    lifecycle: text('lifecycle').notNull().default('experimental'),
    isProduction: boolean('is_production').notNull().default(false),
    artifactUri: text('artifact_uri'),
    serializedModel: jsonb('serialized_model'),
    promotedAt: timestamp('promoted_at', { withTimezone: true }),
    deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
    promotedBy: text('promoted_by'),
    tags: jsonb('tags').notNull().default([]),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_ml_model_domain').on(t.domain),
    index('idx_ml_model_lifecycle').on(t.lifecycle),
    uniqueIndex('uq_ml_model_name_version').on(t.modelName, t.version),
  ],
);

// ---------------------------------------------------------------------------
// Predictions / Inference Log
// ---------------------------------------------------------------------------

export const mlPredictions = pgTable(
  'ml_predictions',
  {
    id: serial('id').primaryKey(),
    predictionId: text('prediction_id').notNull().unique(),
    modelVersionId: text('model_version_id').notNull(),
    domain: text('domain').notNull(),
    entityId: text('entity_id').notNull(),
    entityType: text('entity_type').notNull(),
    inputFeatures: jsonb('input_features').notNull().default({}),
    prediction: jsonb('prediction').notNull(),
    confidence: real('confidence'),
    explanation: jsonb('explanation'),
    abTestId: text('ab_test_id'),
    abTestVariant: text('ab_test_variant'),
    latencyMs: integer('latency_ms'),
    cacheHit: boolean('cache_hit').notNull().default(false),
    isBatch: boolean('is_batch').notNull().default(false),
    actual: jsonb('actual'),
    actualRecordedAt: timestamp('actual_recorded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_ml_pred_model').on(t.modelVersionId),
    index('idx_ml_pred_entity').on(t.entityId, t.entityType),
    index('idx_ml_pred_domain').on(t.domain),
  ],
);

// ---------------------------------------------------------------------------
// Model Monitoring
// ---------------------------------------------------------------------------

export const mlModelMonitoringSnapshots = pgTable(
  'ml_model_monitoring_snapshots',
  {
    id: serial('id').primaryKey(),
    snapshotId: text('snapshot_id').notNull().unique(),
    modelVersionId: text('model_version_id').notNull(),
    domain: text('domain').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
    predictionCount: integer('prediction_count').notNull().default(0),
    accuracyMetrics: jsonb('accuracy_metrics'),
    dataDriftScores: jsonb('data_drift_scores'),
    predictionDistribution: jsonb('prediction_distribution'),
    featureStats: jsonb('feature_stats'),
    driftDetected: boolean('drift_detected').notNull().default(false),
    performanceDegraded: boolean('performance_degraded').notNull().default(false),
    retrainingTriggered: boolean('retraining_triggered').notNull().default(false),
    alertsSent: jsonb('alerts_sent').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_ml_monitor_model').on(t.modelVersionId),
    index('idx_ml_monitor_domain').on(t.domain),
  ],
);

// ---------------------------------------------------------------------------
// A/B Tests
// ---------------------------------------------------------------------------

export const mlAbTests = pgTable(
  'ml_ab_tests',
  {
    id: serial('id').primaryKey(),
    testId: text('test_id').notNull().unique(),
    name: text('name').notNull(),
    domain: text('domain').notNull(),
    description: text('description'),
    controlModelVersionId: text('control_model_version_id').notNull(),
    treatmentModelVersionId: text('treatment_model_version_id').notNull(),
    trafficSplitPct: real('traffic_split_pct').notNull().default(0.5),
    primaryMetric: text('primary_metric').notNull(),
    significanceThreshold: real('significance_threshold').notNull().default(0.05),
    minSampleSize: integer('min_sample_size').notNull().default(100),
    status: text('status').notNull().default('running'),
    winner: text('winner'),
    pValue: real('p_value'),
    effectSize: real('effect_size'),
    controlMetrics: jsonb('control_metrics'),
    treatmentMetrics: jsonb('treatment_metrics'),
    sampleCount: integer('sample_count').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    concludedAt: timestamp('concluded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_ml_ab_domain').on(t.domain), index('idx_ml_ab_status').on(t.status)],
);

// ---------------------------------------------------------------------------
// Insert Schemas & Types
// ---------------------------------------------------------------------------

export const insertMlFeatureDefinitionSchema = createInsertSchema(mlFeatureDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertMlFeatureValueSchema = createInsertSchema(mlFeatureValues).omit({ id: true });
export const insertMlDatasetSchema = createInsertSchema(mlDatasets).omit({
  id: true,
  createdAt: true,
});
export const insertMlTrainingRunSchema = createInsertSchema(mlTrainingRuns).omit({
  id: true,
  createdAt: true,
});
export const insertMlModelVersionSchema = createInsertSchema(mlModelVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertMlPredictionSchema = createInsertSchema(mlPredictions).omit({ id: true });
export const insertMlMonitoringSnapshotSchema = createInsertSchema(mlModelMonitoringSnapshots).omit(
  { id: true, createdAt: true },
);
export const insertMlAbTestSchema = createInsertSchema(mlAbTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MlFeatureDefinition = typeof mlFeatureDefinitions.$inferSelect;
export type MlFeatureValue = typeof mlFeatureValues.$inferSelect;
export type MlDataset = typeof mlDatasets.$inferSelect;
export type MlTrainingRun = typeof mlTrainingRuns.$inferSelect;
export type MlModelVersion = typeof mlModelVersions.$inferSelect;
export type MlPrediction = typeof mlPredictions.$inferSelect;
export type MlModelMonitoringSnapshot = typeof mlModelMonitoringSnapshots.$inferSelect;
export type MlAbTest = typeof mlAbTests.$inferSelect;

export type InsertMlFeatureDefinition = z.infer<typeof insertMlFeatureDefinitionSchema>;
export type InsertMlFeatureValue = z.infer<typeof insertMlFeatureValueSchema>;
export type InsertMlDataset = z.infer<typeof insertMlDatasetSchema>;
export type InsertMlTrainingRun = z.infer<typeof insertMlTrainingRunSchema>;
export type InsertMlModelVersion = z.infer<typeof insertMlModelVersionSchema>;
export type InsertMlPrediction = z.infer<typeof insertMlPredictionSchema>;
export type InsertMlMonitoringSnapshot = z.infer<typeof insertMlMonitoringSnapshotSchema>;
export type InsertMlAbTest = z.infer<typeof insertMlAbTestSchema>;
