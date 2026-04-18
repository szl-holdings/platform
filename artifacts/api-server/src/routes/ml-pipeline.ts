import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendError, sendBadRequest, sendNotFound, handleRouteError } from "../lib/api-response";
import {
  featureStoreService,
  trainingService,
  modelRegistryService,
  inferenceService,
  monitoringService,
  abTestingService,
  explainabilityService,
  datasetService,
  domainTemplatesService,
  getMlPipelineStatus,
} from "../lib/ml-pipeline-service";
import type { ModelLifecycle } from "@szl-holdings/ai-engine";
import { z } from "zod";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router = Router();

const featureComputeSchema = z.object({
  featureId: z.string().min(1).max(200),
  domain: z.string().min(1).max(100),
  entityId: z.string().min(1).max(200),
  entityType: z.string().min(1).max(100),
  value: z.unknown(),
});

const featureVectorSchema = z.object({
  entityId: z.string().min(1).max(200),
  entityType: z.string().min(1).max(100),
  featureIds: z.array(z.string().min(1).max(200)).min(1).max(100),
});

const createDatasetSchema = z.object({
  domain: z.string().min(1).max(100),
  name: z.string().min(1).max(300).optional(),
  entityType: z.string().min(1).max(100).optional(),
  maxRows: z.number().int().min(1).max(1000000).optional(),
});

const createTrainingRunSchema = z.object({
  datasetId: z.string().min(1).max(200),
  domain: z.string().min(1).max(100),
  modelType: z.string().min(1).max(100).optional(),
  hyperparameters: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

router.get("/ml/status", authMiddleware(), (_req, res) => {
  try {
    res.json(getMlPipelineStatus());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// Feature Store
// ---------------------------------------------------------------------------

router.get("/ml/features", authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(featureStoreService.getDefinitions(domain));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/features/catalog", authMiddleware(), (_req, res) => {
  try {
    res.json(featureStoreService.getCatalog());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/features/freshness", authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(featureStoreService.checkFreshness(domain));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/features/summary", authMiddleware(), (_req, res) => {
  try {
    res.json(featureStoreService.getSummary());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/features/compute", authMiddleware(), validateBody(featureComputeSchema), (req, res) => {
  try {
    const { featureId, domain, entityId, entityType, value } = req.body as z.infer<typeof featureComputeSchema>;
    const result = featureStoreService.computeFeature(featureId, domain, entityId, entityType, value);
    res.status(201).json(result);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/features/vector", authMiddleware(), validateBody(featureVectorSchema), (req, res) => {
  try {
    const { entityId, entityType, featureIds } = req.body as z.infer<typeof featureVectorSchema>;
    res.json(featureStoreService.getFeatureVector(entityId, entityType, featureIds));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// Domain Templates
// ---------------------------------------------------------------------------

router.get("/ml/templates", authMiddleware(), (_req, res) => {
  try {
    res.json(domainTemplatesService.getAllTemplates());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/templates/:domain", authMiddleware(), (req, res) => {
  try {
    const { domain } = req.params as Record<string, string>;
    res.json(domainTemplatesService.getTemplates(domain));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/templates/:domain/:modelType", authMiddleware(), (req, res) => {
  try {
    const { domain, modelType } = req.params as Record<string, string>;
    const template = domainTemplatesService.getTemplate(domain, modelType);
    if (!template) return sendNotFound(res, "Template not found");
    res.json(template);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// Datasets
// ---------------------------------------------------------------------------

router.get("/ml/datasets", authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(datasetService.list(domain));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/datasets/summary", authMiddleware(), (_req, res) => {
  try {
    res.json(datasetService.getSummary());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/datasets/:datasetId", authMiddleware(), (req, res) => {
  try {
    const ds = datasetService.get(req.params.datasetId as string);
    if (!ds) return sendNotFound(res, "Dataset not found");
    res.json(ds);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

const fullDatasetSchema = z.object({
  name: z.string().min(1).max(300),
  domain: z.string().min(1).max(100),
  featureIds: z.array(z.string().min(1).max(200)).min(1).max(200),
  labelColumn: z.string().min(1).max(200),
  splitStrategy: z.enum(["random", "temporal", "stratified"]).optional(),
  temporalRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  description: z.string().max(2000).optional(),
});

router.post("/ml/datasets", authMiddleware(), validateBody(fullDatasetSchema), async (req, res) => {
  try {
    const { name, domain, featureIds, labelColumn, splitStrategy, temporalRange, description } = req.body as z.infer<typeof fullDatasetSchema>;
    const ds = await datasetService.create({ name, domain, featureIds, labelColumn, splitStrategy, temporalRange: temporalRange as any, description });
    res.status(201).json(ds);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/datasets/bootstrap", authMiddleware(), async (_req, res) => {
  try {
    const datasets = await datasetService.bootstrap();
    res.status(201).json({ bootstrapped: datasets.length, datasets });
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/datasets/:datasetId/refresh", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const ds = await datasetService.refresh(req.params.datasetId as string);
    res.json(ds);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// Training Pipeline
// ---------------------------------------------------------------------------

router.get("/ml/training/runs", authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(trainingService.listRuns(domain));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/training/summary", authMiddleware(), (_req, res) => {
  try {
    res.json(trainingService.getSummary());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/training/runs/:runId", authMiddleware(), (req, res) => {
  try {
    const run = trainingService.getRun(req.params.runId as string);
    if (!run) return sendNotFound(res, "Training run not found");
    res.json(run);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

const startTrainingRunSchema = z.object({
  domain: z.string().min(1).max(100),
  modelType: z.string().min(1).max(100),
  algorithmFamily: z.string().min(1).max(100),
  datasetId: z.string().min(1).max(200),
  featureIds: z.array(z.string().min(1).max(200)).min(1).max(200),
  hyperparameters: z.record(z.unknown()).optional(),
  triggeredBy: z.string().max(200).optional(),
});

router.post("/ml/training/runs", authMiddleware(), validateBody(startTrainingRunSchema), async (req, res) => {
  try {
    const { domain, modelType, algorithmFamily, datasetId, featureIds, hyperparameters, triggeredBy } = req.body as z.infer<typeof startTrainingRunSchema>;
    const run = await trainingService.startRun({ domain, modelType, algorithmFamily, datasetId, featureIds, hyperparameters: hyperparameters ?? {}, triggeredBy });
    res.status(201).json(run);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/training/trigger/:domain", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const runs = await trainingService.triggerDomain(req.params.domain as string);
    res.status(201).json({ triggered: runs.length, runs });
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------

router.get("/ml/registry/models", authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  try {
    const { domain, lifecycle } = req.query as { domain?: string; lifecycle?: ModelLifecycle };
    res.json(modelRegistryService.listModels(domain, lifecycle));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/registry/summary", authMiddleware(), (_req, res) => {
  try {
    res.json(modelRegistryService.getSummary());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/registry/models/:modelVersionId", authMiddleware(), (req, res) => {
  try {
    const model = modelRegistryService.getModel(req.params.modelVersionId as string);
    if (!model) return sendNotFound(res, "Model version not found");
    res.json(model);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/registry/models/:modelVersionId/lineage", authMiddleware(), (req, res) => {
  try {
    const lineage = modelRegistryService.getLineage(req.params.modelVersionId as string);
    if (!lineage) return sendNotFound(res, "Model version not found");
    res.json(lineage);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/registry/models/:modelVersionId/promote", authMiddleware(), validateBody(jsonObjectBodySchema), (req, res) => {
  try {
    const { lifecycle, promotedBy } = req.body;
    if (!lifecycle) return sendBadRequest(res, "lifecycle is required (experimental | staging | production | deprecated)");
    const result = modelRegistryService.promote(req.params.modelVersionId as string, lifecycle as ModelLifecycle, promotedBy);
    if (!result.success) return sendBadRequest(res, result.message);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// Inference
// ---------------------------------------------------------------------------

router.post("/ml/inference/predict", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { domain, modelType, entityId, entityType, inputFeatures, includeExplanation, forceRefresh } = req.body;
    if (!domain || !modelType || !entityId || !entityType) {
      return sendBadRequest(res, "domain, modelType, entityId, and entityType are required");
    }
    const result = await inferenceService.predict({ domain, modelType, entityId, entityType, inputFeatures, includeExplanation, forceRefresh });
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/inference/batch", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { domain, modelType, entities, includeExplanation } = req.body;
    if (!domain || !modelType || !Array.isArray(entities)) {
      return sendBadRequest(res, "domain, modelType, and entities[] are required");
    }
    const result = await inferenceService.batchPredict({ domain, modelType, entities, includeExplanation });
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/inference/stats", authMiddleware(), (_req, res) => {
  try {
    res.json(inferenceService.getStats());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.delete("/ml/inference/cache", authMiddleware(), (req, res) => {
  try {
    const { modelVersionId } = req.query as { modelVersionId?: string };
    const cleared = inferenceService.clearCache(modelVersionId);
    res.json({ cleared });
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

router.get("/ml/monitoring/snapshots", authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  try {
    const { modelVersionId } = req.query as { modelVersionId?: string };
    res.json(monitoringService.getSnapshots(modelVersionId));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/monitoring/summary", authMiddleware(), (_req, res) => {
  try {
    res.json(monitoringService.getSummary());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/monitoring/retraining-log", authMiddleware(), (_req, res) => {
  try {
    res.json(monitoringService.getRetrainingLog());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/monitoring/run/:modelVersionId", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const snapshot = await monitoringService.runCycle(req.params.modelVersionId as string);
    res.status(201).json(snapshot);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/monitoring/run-all", authMiddleware(), async (_req, res) => {
  try {
    const snapshots = await monitoringService.runAllProduction();
    res.status(201).json({ count: snapshots.length, snapshots });
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// A/B Testing
// ---------------------------------------------------------------------------

router.get("/ml/ab-tests", authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(abTestingService.list(domain));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/ab-tests/summary", authMiddleware(), (_req, res) => {
  try {
    res.json(abTestingService.getSummary());
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/ab-tests", authMiddleware(), validateBody(jsonObjectBodySchema), (req, res) => {
  try {
    const { name, domain, controlModelVersionId, treatmentModelVersionId, trafficSplitPct, primaryMetric, significanceThreshold, minSampleSize, description } = req.body;
    if (!name || !domain || !controlModelVersionId || !treatmentModelVersionId) {
      return sendBadRequest(res, "name, domain, controlModelVersionId, and treatmentModelVersionId are required");
    }
    const test = abTestingService.create({ name, domain, controlModelVersionId, treatmentModelVersionId, trafficSplitPct, primaryMetric, significanceThreshold, minSampleSize, description });
    res.status(201).json(test);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/ab-tests/:testId/assign", authMiddleware(), validateBody(jsonObjectBodySchema), (req, res) => {
  try {
    const { entityId } = req.body;
    if (!entityId) return sendBadRequest(res, "entityId is required");
    const assignment = abTestingService.assign(req.params.testId as string, entityId);
    if (!assignment) return sendNotFound(res, "A/B test not found or not running");
    res.json(assignment);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/ab-tests/:testId/outcome", authMiddleware(), validateBody(jsonObjectBodySchema), (req, res) => {
  try {
    const { variant, metricValue } = req.body;
    if (!variant || metricValue === undefined) return sendBadRequest(res, "variant and metricValue are required");
    abTestingService.record(req.params.testId as string, variant, metricValue);
    res.json({ recorded: true });
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.get("/ml/ab-tests/:testId/evaluate", authMiddleware(), async (req, res) => {
  try {
    const result = abTestingService.evaluate(req.params.testId as string);
    if (!result) { res.json({ status: "insufficient_samples" }); return; }
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/ab-tests/:testId/conclude", authMiddleware(), validateBody(jsonObjectBodySchema), (req, res) => {
  try {
    const test = abTestingService.conclude(req.params.testId as string);
    if (!test) return sendNotFound(res, "A/B test not found or already concluded");
    res.json(test);
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

// ---------------------------------------------------------------------------
// Explainability
// ---------------------------------------------------------------------------

router.post("/ml/explain", authMiddleware(), validateBody(jsonObjectBodySchema), (req, res) => {
  try {
    const { domain, modelType, prediction, featureImportance, featureValues } = req.body;
    if (!domain || !modelType || prediction === undefined || !featureImportance || !featureValues) {
      return sendBadRequest(res, "domain, modelType, prediction, featureImportance, and featureValues are required");
    }
    res.json(explainabilityService.explain(domain, modelType, prediction, featureImportance, featureValues));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

router.post("/ml/explain/shap", authMiddleware(), validateBody(jsonObjectBodySchema), (req, res) => {
  try {
    const { featureImportance, featureValues, prediction } = req.body;
    if (!featureImportance || !featureValues || prediction === undefined) {
      return sendBadRequest(res, "featureImportance, featureValues, and prediction are required");
    }
    res.json(explainabilityService.computeShap(featureImportance, featureValues, prediction));
  } catch (err) {
    handleRouteError(res, err, 'Operation failed');
  }
});

export default router;
