import { logger } from "./logger";
import {
  getDomainFeatureDefinitions,
  getAllFeatureDefinitions,
  computeFeature,
  getFeatureVector,
  getFeatureStoreSummary,
  checkFreshness,
  DOMAIN_FEATURE_CATALOG,
} from "@szl-holdings/ai-engine";
import {
  startTrainingRun,
  getTrainingRun,
  listTrainingRuns,
  triggerDomainTraining,
  getTrainingPipelineSummary,
  type TrainingRunConfig,
} from "@szl-holdings/ai-engine";
import {
  mlModelRegistry,
  type ModelLifecycle,
} from "@szl-holdings/ai-engine";
import {
  predict,
  batchPredict,
  getInferenceStats,
  clearPredictionCache,
  type PredictionRequest,
  type BatchPredictionRequest,
} from "@szl-holdings/ai-engine";
import {
  runMonitoringCycle,
  runMonitoringForAllProductionModels,
  getMonitoringSnapshots,
  getRetrainingLog,
  getMonitoringSummary,
} from "@szl-holdings/ai-engine";
import {
  createAbTest,
  assignVariant,
  recordAbTestOutcome,
  evaluateAbTest,
  concludeAbTest,
  listAbTests,
  getAbTestSummary,
} from "@szl-holdings/ai-engine";
import {
  explainPrediction,
  computeShapExplanation,
} from "@szl-holdings/ai-engine";
import {
  createDataset,
  refreshDataset,
  getDataset,
  listDatasets,
  getDatasetSummary,
  bootstrapDomainDatasets,
} from "@szl-holdings/ai-engine";
import {
  getDomainTemplates,
  getAllDomainTemplates,
  getTemplate,
} from "@szl-holdings/ai-engine";

// ---------------------------------------------------------------------------
// Feature Store Service
// ---------------------------------------------------------------------------

export const featureStoreService = {
  getDefinitions(domain?: string) {
    return domain ? getDomainFeatureDefinitions(domain) : getAllFeatureDefinitions();
  },

  computeFeature(featureId: string, domain: string, entityId: string, entityType: string, value: unknown) {
    const defs = getDomainFeatureDefinitions(domain);
    const def = defs.find(d => d.featureId === featureId);
    if (!def) throw new Error(`Feature definition ${featureId} not found for domain ${domain}`);
    return computeFeature(def, entityId, entityType, value);
  },

  getFeatureVector(entityId: string, entityType: string, featureIds: string[]) {
    return getFeatureVector(entityId, entityType, featureIds);
  },

  getSummary() {
    return getFeatureStoreSummary();
  },

  checkFreshness(domain?: string) {
    return checkFreshness(domain);
  },

  getCatalog() {
    return DOMAIN_FEATURE_CATALOG;
  },
};

// ---------------------------------------------------------------------------
// Training Pipeline Service
// ---------------------------------------------------------------------------

export const trainingService = {
  async startRun(config: TrainingRunConfig) {
    logger.info({ domain: config.domain, modelType: config.modelType }, "Training run initiated via service");
    return startTrainingRun(config);
  },

  getRun(runId: string) {
    return getTrainingRun(runId);
  },

  listRuns(domain?: string) {
    return listTrainingRuns(domain);
  },

  async triggerDomain(domain: string) {
    return triggerDomainTraining(domain, "api");
  },

  getSummary() {
    return getTrainingPipelineSummary();
  },
};

// ---------------------------------------------------------------------------
// Model Registry Service
// ---------------------------------------------------------------------------

export const modelRegistryService = {
  listModels(domain?: string, lifecycle?: ModelLifecycle) {
    return mlModelRegistry.listModels(domain, lifecycle);
  },

  getModel(modelVersionId: string) {
    return mlModelRegistry.getModel(modelVersionId);
  },

  getProductionModel(modelName: string) {
    return mlModelRegistry.getProductionModel(modelName);
  },

  promote(modelVersionId: string, lifecycle: ModelLifecycle, promotedBy?: string) {
    return mlModelRegistry.promoteModel(modelVersionId, lifecycle, promotedBy);
  },

  getLineage(modelVersionId: string) {
    return mlModelRegistry.getModelLineage(modelVersionId);
  },

  getSummary() {
    return mlModelRegistry.getRegistrySummary();
  },
};

// ---------------------------------------------------------------------------
// Inference Service
// ---------------------------------------------------------------------------

export const inferenceService = {
  async predict(request: PredictionRequest) {
    return predict(request);
  },

  async batchPredict(request: BatchPredictionRequest) {
    return batchPredict(request);
  },

  getStats() {
    return getInferenceStats();
  },

  clearCache(modelVersionId?: string) {
    return clearPredictionCache(modelVersionId);
  },
};

// ---------------------------------------------------------------------------
// Monitoring Service
// ---------------------------------------------------------------------------

export const monitoringService = {
  async runCycle(modelVersionId: string) {
    return runMonitoringCycle(modelVersionId);
  },

  async runAllProduction() {
    return runMonitoringForAllProductionModels();
  },

  getSnapshots(modelVersionId?: string) {
    return getMonitoringSnapshots(modelVersionId);
  },

  getRetrainingLog() {
    return getRetrainingLog();
  },

  getSummary() {
    return getMonitoringSummary();
  },
};

// ---------------------------------------------------------------------------
// A/B Testing Service
// ---------------------------------------------------------------------------

export const abTestingService = {
  create(input: Parameters<typeof createAbTest>[0]) {
    return createAbTest(input);
  },

  assign(testId: string, entityId: string) {
    return assignVariant(testId, entityId);
  },

  record(testId: string, variant: "control" | "treatment", metricValue: number) {
    return recordAbTestOutcome(testId, variant, metricValue);
  },

  evaluate(testId: string) {
    return evaluateAbTest(testId);
  },

  conclude(testId: string) {
    return concludeAbTest(testId);
  },

  list(domain?: string) {
    return listAbTests(domain);
  },

  getSummary() {
    return getAbTestSummary();
  },
};

// ---------------------------------------------------------------------------
// Explainability Service
// ---------------------------------------------------------------------------

export const explainabilityService = {
  explain(domain: string, modelType: string, prediction: unknown, featureImportance: Record<string, number>, featureValues: Record<string, unknown>) {
    return explainPrediction(domain, modelType, prediction, featureImportance, featureValues);
  },

  computeShap(featureImportance: Record<string, number>, featureValues: Record<string, unknown>, prediction: unknown) {
    return computeShapExplanation(featureImportance, featureValues, prediction);
  },
};

// ---------------------------------------------------------------------------
// Dataset Manager Service
// ---------------------------------------------------------------------------

export const datasetService = {
  async create(input: Parameters<typeof createDataset>[0]) {
    return createDataset(input);
  },

  async refresh(datasetId: string) {
    return refreshDataset(datasetId);
  },

  get(datasetId: string) {
    return getDataset(datasetId);
  },

  list(domain?: string) {
    return listDatasets(domain);
  },

  getSummary() {
    return getDatasetSummary();
  },

  async bootstrap() {
    return bootstrapDomainDatasets();
  },
};

// ---------------------------------------------------------------------------
// Domain Templates Service
// ---------------------------------------------------------------------------

export const domainTemplatesService = {
  getTemplates(domain: string) {
    return getDomainTemplates(domain);
  },

  getAllTemplates() {
    return getAllDomainTemplates();
  },

  getTemplate(domain: string, modelType: string) {
    return getTemplate(domain, modelType);
  },
};

// ---------------------------------------------------------------------------
// Full ML Pipeline Status
// ---------------------------------------------------------------------------

export function getMlPipelineStatus() {
  return {
    featureStore: featureStoreService.getSummary(),
    trainingPipeline: trainingService.getSummary(),
    modelRegistry: modelRegistryService.getSummary(),
    inference: inferenceService.getStats(),
    monitoring: monitoringService.getSummary(),
    abTesting: abTestingService.getSummary(),
    datasets: datasetService.getSummary(),
    timestamp: new Date().toISOString(),
  };
}

logger.info("ML Pipeline service layer initialised");
