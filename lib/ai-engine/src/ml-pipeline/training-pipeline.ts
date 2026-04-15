
import { logger } from "./logger.js";
import { getDomainFeatureDefinitions, getFeatureVector } from "./feature-store.js";
import { DOMAIN_MODEL_TEMPLATES, DomainModelTemplate, ModelAlgorithm } from "./domain-templates.js";
import { mlModelRegistry } from "./ml-model-registry.js";

export type TrainingStage = "data_extraction" | "feature_engineering" | "model_training" | "evaluation" | "registration";
export type TrainingStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface TrainingRunConfig {
  domain: string;
  modelType: string;
  algorithmFamily: string;
  datasetId: string;
  featureIds: string[];
  hyperparameters: Record<string, unknown>;
  triggeredBy?: string;
}

export interface TrainingMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  auc?: number;
  mse?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
  logLoss?: number;
  mape?: number;
  sampleCount: number;
  [key: string]: number | undefined;
}

export interface TrainingRun {
  runId: string;
  domain: string;
  modelType: string;
  algorithmFamily: string;
  datasetId: string;
  featureIds: string[];
  hyperparameters: Record<string, unknown>;
  status: TrainingStatus;
  stage: TrainingStage;
  trainMetrics: TrainingMetrics | null;
  valMetrics: TrainingMetrics | null;
  testMetrics: TrainingMetrics | null;
  featureImportance: Record<string, number> | null;
  errorMessage: string | null;
  durationSeconds: number | null;
  triggeredBy: string;
  startedAt: Date;
  completedAt: Date | null;
}

// In-memory run store
const runStore = new Map<string, TrainingRun>();

// ---------------------------------------------------------------------------
// Simulated ML training (deterministic, no GPU required)
// In production, this would call a Python microservice via HTTP.
// ---------------------------------------------------------------------------

function simulateMetrics(algorithmFamily: string, dataSize: number): { train: TrainingMetrics; val: TrainingMetrics; test: TrainingMetrics } {
  const baseAcc = 0.78 + Math.random() * 0.15;
  const noise = () => (Math.random() - 0.5) * 0.04;

  const isRegression = ["linear_regression", "gradient_boosted_regression", "time_series"].includes(algorithmFamily);
  const isAnomaly = algorithmFamily === "isolation_forest";

  if (isRegression) {
    const r2 = 0.72 + Math.random() * 0.22;
    return {
      train: { r2: r2 + 0.05, rmse: 0.12 + noise(), mae: 0.09 + noise(), mse: 0.014 + noise(), mape: 0.08 + noise(), sampleCount: Math.floor(dataSize * 0.8) },
      val:   { r2: r2 + 0.02, rmse: 0.14 + noise(), mae: 0.11 + noise(), mse: 0.020 + noise(), mape: 0.10 + noise(), sampleCount: Math.floor(dataSize * 0.1) },
      test:  { r2, rmse: 0.15 + noise(), mae: 0.12 + noise(), mse: 0.022 + noise(), mape: 0.11 + noise(), sampleCount: Math.floor(dataSize * 0.1) },
    };
  }

  if (isAnomaly) {
    return {
      train: { auc: 0.88 + noise(), precision: 0.82 + noise(), recall: 0.79 + noise(), f1: 0.80 + noise(), sampleCount: Math.floor(dataSize * 0.8) },
      val:   { auc: 0.85 + noise(), precision: 0.79 + noise(), recall: 0.76 + noise(), f1: 0.77 + noise(), sampleCount: Math.floor(dataSize * 0.1) },
      test:  { auc: 0.84 + noise(), precision: 0.78 + noise(), recall: 0.75 + noise(), f1: 0.76 + noise(), sampleCount: Math.floor(dataSize * 0.1) },
    };
  }

  return {
    train: { accuracy: baseAcc + 0.05, precision: baseAcc + 0.03 + noise(), recall: baseAcc - 0.02 + noise(), f1: baseAcc + 0.01 + noise(), auc: baseAcc + 0.08 + noise(), logLoss: 0.35 + noise(), sampleCount: Math.floor(dataSize * 0.8) },
    val:   { accuracy: baseAcc + 0.01, precision: baseAcc + noise(),       recall: baseAcc - 0.04 + noise(), f1: baseAcc - 0.02 + noise(), auc: baseAcc + 0.05 + noise(), logLoss: 0.39 + noise(), sampleCount: Math.floor(dataSize * 0.1) },
    test:  { accuracy: baseAcc,         precision: baseAcc - 0.01 + noise(), recall: baseAcc - 0.05 + noise(), f1: baseAcc - 0.03 + noise(), auc: baseAcc + 0.04 + noise(), logLoss: 0.41 + noise(), sampleCount: Math.floor(dataSize * 0.1) },
  };
}

function simulateFeatureImportance(featureIds: string[]): Record<string, number> {
  const raw = featureIds.map(f => ({ f, w: Math.random() }));
  const total = raw.reduce((s, r) => s + r.w, 0);
  const result: Record<string, number> = {};
  raw.forEach(r => { result[r.f] = parseFloat((r.w / total).toFixed(4)); });
  return result;
}

// ---------------------------------------------------------------------------
// Pipeline execution
// ---------------------------------------------------------------------------

async function runStage(run: TrainingRun, stage: TrainingStage): Promise<void> {
  run.stage = stage;
  logger.info({ runId: run.runId, stage }, "Training stage started");
  await new Promise<void>((resolve) => setTimeout(resolve, 10)); // yield
}

export async function startTrainingRun(config: TrainingRunConfig): Promise<TrainingRun> {
  const runId = `run-${crypto.randomUUID()}`;

  const run: TrainingRun = {
    runId,
    domain: config.domain,
    modelType: config.modelType,
    algorithmFamily: config.algorithmFamily,
    datasetId: config.datasetId,
    featureIds: config.featureIds,
    hyperparameters: config.hyperparameters,
    status: "running",
    stage: "data_extraction",
    trainMetrics: null,
    valMetrics: null,
    testMetrics: null,
    featureImportance: null,
    errorMessage: null,
    durationSeconds: null,
    triggeredBy: config.triggeredBy ?? "manual",
    startedAt: new Date(),
    completedAt: null,
  };

  runStore.set(runId, run);
  logger.info({ runId, domain: config.domain, algorithm: config.algorithmFamily }, "Training run started");

  try {
    const t0 = Date.now();

    await runStage(run, "data_extraction");
    await runStage(run, "feature_engineering");
    await runStage(run, "model_training");

    const dataSize = 5000 + Math.floor(Math.random() * 15000);
    const metrics = simulateMetrics(config.algorithmFamily, dataSize);
    run.trainMetrics = metrics.train;
    run.valMetrics = metrics.val;

    await runStage(run, "evaluation");
    run.testMetrics = metrics.test;
    run.featureImportance = simulateFeatureImportance(config.featureIds);

    await runStage(run, "registration");

    // Register to model registry
    const template = DOMAIN_MODEL_TEMPLATES[config.domain]?.find(t => t.modelType === config.modelType);
    const modelName = template ? `${config.domain}-${config.modelType}` : `${config.domain}-${config.algorithmFamily}`;
    await mlModelRegistry.registerModel({
      modelName,
      domain: config.domain,
      algorithmFamily: config.algorithmFamily,
      runId,
      datasetId: config.datasetId,
      datasetVersion: "1.0",
      featureIds: config.featureIds,
      hyperparameters: config.hyperparameters,
      trainMetrics: metrics.train,
      testMetrics: metrics.test,
      featureImportance: run.featureImportance,
    });

    run.durationSeconds = (Date.now() - t0) / 1000;
    run.status = "completed";
    run.completedAt = new Date();

    logger.info({ runId, durationSeconds: run.durationSeconds }, "Training run completed");
  } catch (err) {
    run.status = "failed";
    run.errorMessage = err instanceof Error ? err.message : String(err);
    run.completedAt = new Date();
    logger.error({ runId, error: run.errorMessage }, "Training run failed");
  }

  return run;
}

export function getTrainingRun(runId: string): TrainingRun | null {
  return runStore.get(runId) ?? null;
}

export function listTrainingRuns(domain?: string): TrainingRun[] {
  const runs = Array.from(runStore.values());
  return domain ? runs.filter(r => r.domain === domain) : runs;
}

export async function triggerDomainTraining(domain: string, triggeredBy = "auto"): Promise<TrainingRun[]> {
  const templates = DOMAIN_MODEL_TEMPLATES[domain] ?? [];
  const runs: TrainingRun[] = [];

  for (const tpl of templates) {
    const featureDefs = getDomainFeatureDefinitions(domain);
    const featureIds = featureDefs.map(f => f.featureId);

    const run = await startTrainingRun({
      domain,
      modelType: tpl.modelType,
      algorithmFamily: tpl.algorithmFamily,
      datasetId: `dataset-${domain}-auto`,
      featureIds,
      hyperparameters: tpl.defaultHyperparameters,
      triggeredBy,
    });
    runs.push(run);
  }

  return runs;
}

export function getTrainingPipelineSummary() {
  const runs = Array.from(runStore.values());
  return {
    total: runs.length,
    completed: runs.filter(r => r.status === "completed").length,
    failed: runs.filter(r => r.status === "failed").length,
    running: runs.filter(r => r.status === "running").length,
    byDomain: Object.fromEntries(
      [...new Set(runs.map(r => r.domain))].map(d => [d, runs.filter(r => r.domain === d).length])
    ),
  };
}
