import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { usersTable } from "./auth";

export const alloyMlModelsTable = pgTable("alloy_ml_models", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  domain: text("domain", {
    enum: ["legal", "maritime", "defense", "real_estate", "finance", "cyber", "intelligence", "consulting", "general"],
  }).notNull(),
  modelType: text("model_type", {
    enum: ["classifier", "predictor", "anomaly_detector", "forecaster", "ranker", "recommender"],
  }).notNull(),
  status: text("status", {
    enum: ["draft", "training", "trained", "validating", "deployed", "retired"],
  }).notNull().default("draft"),
  version: integer("version").notNull().default(1),
  promptStrategy: jsonb("prompt_strategy").notNull().default({}),
  reasoningChain: jsonb("reasoning_chain").notNull().default([]),
  featureWeights: jsonb("feature_weights").notNull().default({}),
  hyperparameters: jsonb("hyperparameters").notNull().default({}),
  populationId: integer("population_id"),
  eliteGenomeId: integer("elite_genome_id"),
  trainingDataSize: integer("training_data_size").notNull().default(0),
  accuracy: real("accuracy").notNull().default(0),
  precision: real("precision").notNull().default(0),
  recall: real("recall").notNull().default(0),
  f1Score: real("f1_score").notNull().default(0),
  confidenceCalibration: real("confidence_calibration").notNull().default(0),
  totalPredictions: integer("total_predictions").notNull().default(0),
  correctPredictions: integer("correct_predictions").notNull().default(0),
  avgLatencyMs: integer("avg_latency_ms").notNull().default(0),
  lastTrainedAt: timestamp("last_trained_at"),
  deployedAt: timestamp("deployed_at"),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_ml_models_org_idx").on(t.orgId),
  index("alloy_ml_models_domain_idx").on(t.domain),
  index("alloy_ml_models_type_idx").on(t.modelType),
  index("alloy_ml_models_status_idx").on(t.status),
]);

export const alloyMlTrainingRunsTable = pgTable("alloy_ml_training_runs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  modelId: integer("model_id"),
  runName: text("run_name").notNull(),
  status: text("status", {
    enum: ["queued", "preparing", "training", "evaluating", "completed", "failed"],
  }).notNull().default("queued"),
  strategy: text("strategy", {
    enum: ["evolutionary", "few_shot_optimization", "chain_of_thought_tuning", "ensemble_distillation", "reinforcement_from_feedback"],
  }).notNull().default("evolutionary"),
  generationsCompleted: integer("generations_completed").notNull().default(0),
  maxGenerations: integer("max_generations").notNull().default(50),
  populationSize: integer("population_size").notNull().default(20),
  trainingConfig: jsonb("training_config").notNull().default({}),
  trainingData: jsonb("training_data").notNull().default([]),
  epochMetrics: jsonb("epoch_metrics").notNull().default([]),
  bestFitness: real("best_fitness").notNull().default(0),
  convergenceRate: real("convergence_rate").notNull().default(0),
  improvementOverBaseline: real("improvement_over_baseline").notNull().default(0),
  finalMetrics: jsonb("final_metrics").default(null),
  errorLog: text("error_log"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms").notNull().default(0),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_ml_runs_org_idx").on(t.orgId),
  index("alloy_ml_runs_model_idx").on(t.modelId),
  index("alloy_ml_runs_status_idx").on(t.status),
  index("alloy_ml_runs_created_idx").on(t.createdAt),
]);

export const alloyPredictionsTable = pgTable("alloy_predictions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  modelId: integer("model_id"),
  domain: text("domain").notNull(),
  predictionType: text("prediction_type", {
    enum: ["classification", "regression", "anomaly", "forecast", "ranking", "recommendation"],
  }).notNull(),
  inputData: jsonb("input_data").notNull(),
  inputHash: text("input_hash").notNull(),
  predictedValue: jsonb("predicted_value").notNull(),
  predictedLabel: text("predicted_label"),
  confidence: real("confidence").notNull().default(0),
  reasoning: jsonb("reasoning").notNull().default([]),
  actualValue: jsonb("actual_value"),
  actualLabel: text("actual_label"),
  isCorrect: boolean("is_correct"),
  errorMargin: real("error_margin"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  latencyMs: integer("latency_ms").notNull().default(0),
  tokensUsed: integer("tokens_used").notNull().default(0),
  promptStrategyUsed: jsonb("prompt_strategy_used").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_predictions_org_idx").on(t.orgId),
  index("alloy_predictions_model_idx").on(t.modelId),
  index("alloy_predictions_domain_idx").on(t.domain),
  index("alloy_predictions_type_idx").on(t.predictionType),
  index("alloy_predictions_hash_idx").on(t.inputHash),
  index("alloy_predictions_correct_idx").on(t.isCorrect),
  index("alloy_predictions_created_idx").on(t.createdAt),
]);

export const alloyBacktestSessionsTable = pgTable("alloy_backtest_sessions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  modelId: integer("model_id"),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  status: text("status", {
    enum: ["queued", "running", "completed", "failed"],
  }).notNull().default("queued"),
  timeRangeStart: timestamp("time_range_start").notNull(),
  timeRangeEnd: timestamp("time_range_end").notNull(),
  totalPredictions: integer("total_predictions").notNull().default(0),
  correctPredictions: integer("correct_predictions").notNull().default(0),
  accuracy: real("accuracy").notNull().default(0),
  precision: real("precision").notNull().default(0),
  recall: real("recall").notNull().default(0),
  f1Score: real("f1_score").notNull().default(0),
  meanAbsoluteError: real("mean_absolute_error").notNull().default(0),
  rootMeanSquaredError: real("root_mean_squared_error").notNull().default(0),
  calibrationScore: real("calibration_score").notNull().default(0),
  profitLossImpact: real("profit_loss_impact").notNull().default(0),
  timeSeriesAccuracy: jsonb("time_series_accuracy").notNull().default([]),
  confusionMatrix: jsonb("confusion_matrix").notNull().default({}),
  featureImportance: jsonb("feature_importance").notNull().default([]),
  driftDetected: boolean("drift_detected").notNull().default(false),
  driftMetrics: jsonb("drift_metrics").default({}),
  comparisonBaseline: jsonb("comparison_baseline").default({}),
  results: jsonb("results").notNull().default([]),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms").notNull().default(0),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_backtest_org_idx").on(t.orgId),
  index("alloy_backtest_model_idx").on(t.modelId),
  index("alloy_backtest_domain_idx").on(t.domain),
  index("alloy_backtest_status_idx").on(t.status),
  index("alloy_backtest_created_idx").on(t.createdAt),
]);

export const alloyForecastsTable = pgTable("alloy_forecasts", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  modelId: integer("model_id"),
  domain: text("domain").notNull(),
  targetMetric: text("target_metric").notNull(),
  forecastHorizon: text("forecast_horizon", {
    enum: ["1d", "7d", "14d", "30d", "90d", "180d", "365d"],
  }).notNull(),
  forecastPoints: jsonb("forecast_points").notNull().default([]),
  upperBound: jsonb("upper_bound").notNull().default([]),
  lowerBound: jsonb("lower_bound").notNull().default([]),
  confidence: real("confidence").notNull().default(0),
  methodology: text("methodology", {
    enum: ["trend_extrapolation", "seasonal_decomposition", "causal_reasoning", "ensemble_forecast", "anomaly_adjusted"],
  }).notNull().default("ensemble_forecast"),
  inputFeatures: jsonb("input_features").notNull().default([]),
  reasoning: jsonb("reasoning").notNull().default([]),
  actualOutcome: jsonb("actual_outcome"),
  mapeScore: real("mape_score"),
  isExpired: boolean("is_expired").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_forecasts_org_idx").on(t.orgId),
  index("alloy_forecasts_model_idx").on(t.modelId),
  index("alloy_forecasts_domain_idx").on(t.domain),
  index("alloy_forecasts_metric_idx").on(t.targetMetric),
  index("alloy_forecasts_horizon_idx").on(t.forecastHorizon),
  index("alloy_forecasts_created_idx").on(t.createdAt),
]);

export const insertAlloyMlModelSchema = createInsertSchema(alloyMlModelsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlloyMlModel = z.infer<typeof insertAlloyMlModelSchema>;
export type AlloyMlModel = typeof alloyMlModelsTable.$inferSelect;

export const insertAlloyMlTrainingRunSchema = createInsertSchema(alloyMlTrainingRunsTable).omit({ id: true, createdAt: true });
export type InsertAlloyMlTrainingRun = z.infer<typeof insertAlloyMlTrainingRunSchema>;
export type AlloyMlTrainingRun = typeof alloyMlTrainingRunsTable.$inferSelect;

export const insertAlloyPredictionSchema = createInsertSchema(alloyPredictionsTable).omit({ id: true, createdAt: true });
export type InsertAlloyPrediction = z.infer<typeof insertAlloyPredictionSchema>;
export type AlloyPrediction = typeof alloyPredictionsTable.$inferSelect;

export const insertAlloyBacktestSessionSchema = createInsertSchema(alloyBacktestSessionsTable).omit({ id: true, createdAt: true });
export type InsertAlloyBacktestSession = z.infer<typeof insertAlloyBacktestSessionSchema>;
export type AlloyBacktestSession = typeof alloyBacktestSessionsTable.$inferSelect;

export const insertAlloyForecastSchema = createInsertSchema(alloyForecastsTable).omit({ id: true, createdAt: true });
export type InsertAlloyForecast = z.infer<typeof insertAlloyForecastSchema>;
export type AlloyForecast = typeof alloyForecastsTable.$inferSelect;
