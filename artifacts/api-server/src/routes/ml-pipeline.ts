import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendError, sendBadRequest, sendNotFound } from "../lib/api-response";
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

const router = Router();

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

router.get("/ml/status", authMiddleware, (_req, res) => {
  try {
    res.json(getMlPipelineStatus());
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Feature Store
// ---------------------------------------------------------------------------

router.get("/ml/features", authMiddleware, (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(featureStoreService.getDefinitions(domain));
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/features/catalog", authMiddleware, (_req, res) => {
  try {
    res.json(featureStoreService.getCatalog());
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/features/freshness", authMiddleware, (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(featureStoreService.checkFreshness(domain));
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/features/summary", authMiddleware, (_req, res) => {
  try {
    res.json(featureStoreService.getSummary());
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/features/compute", authMiddleware, (req, res) => {
  try {
    const { featureId, domain, entityId, entityType, value } = req.body;
    if (!featureId || !domain || !entityId || !entityType || value === undefined) {
      return sendBadRequest(res, "featureId, domain, entityId, entityType, and value are required");
    }
    const result = featureStoreService.computeFeature(featureId, domain, entityId, entityType, value);
    res.status(201).json(result);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/features/vector", authMiddleware, (req, res) => {
  try {
    const { entityId, entityType, featureIds } = req.body;
    if (!entityId || !entityType || !Array.isArray(featureIds)) {
      return sendBadRequest(res, "entityId, entityType, and featureIds[] are required");
    }
    res.json(featureStoreService.getFeatureVector(entityId, entityType, featureIds));
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Domain Templates
// ---------------------------------------------------------------------------

router.get("/ml/templates", authMiddleware, (_req, res) => {
  try {
    res.json(domainTemplatesService.getAllTemplates());
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/templates/:domain", authMiddleware, (req, res) => {
  try {
    const { domain } = req.params;
    res.json(domainTemplatesService.getTemplates(domain));
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/templates/:domain/:modelType", authMiddleware, (req, res) => {
  try {
    const { domain, modelType } = req.params;
    const template = domainTemplatesService.getTemplate(domain, modelType);
    if (!template) return sendNotFound(res, "Template not found");
    res.json(template);
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Datasets
// ---------------------------------------------------------------------------

router.get("/ml/datasets", authMiddleware, (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(datasetService.list(domain));
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/datasets/summary", authMiddleware, (_req, res) => {
  try {
    res.json(datasetService.getSummary());
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/datasets/:datasetId", authMiddleware, (req, res) => {
  try {
    const ds = datasetService.get(req.params.datasetId);
    if (!ds) return sendNotFound(res, "Dataset not found");
    res.json(ds);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/datasets", authMiddleware, async (req, res) => {
  try {
    const { name, domain, featureIds, labelColumn, splitStrategy, temporalRange, description } = req.body;
    if (!name || !domain || !Array.isArray(featureIds) || !labelColumn) {
      return sendBadRequest(res, "name, domain, featureIds[], and labelColumn are required");
    }
    const ds = await datasetService.create({ name, domain, featureIds, labelColumn, splitStrategy, temporalRange, description });
    res.status(201).json(ds);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/datasets/bootstrap", authMiddleware, async (_req, res) => {
  try {
    const datasets = await datasetService.bootstrap();
    res.status(201).json({ bootstrapped: datasets.length, datasets });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/datasets/:datasetId/refresh", authMiddleware, async (req, res) => {
  try {
    const ds = await datasetService.refresh(req.params.datasetId);
    res.json(ds);
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Training Pipeline
// ---------------------------------------------------------------------------

router.get("/ml/training/runs", authMiddleware, (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(trainingService.listRuns(domain));
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/training/summary", authMiddleware, (_req, res) => {
  try {
    res.json(trainingService.getSummary());
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/training/runs/:runId", authMiddleware, (req, res) => {
  try {
    const run = trainingService.getRun(req.params.runId);
    if (!run) return sendNotFound(res, "Training run not found");
    res.json(run);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/training/runs", authMiddleware, async (req, res) => {
  try {
    const { domain, modelType, algorithmFamily, datasetId, featureIds, hyperparameters, triggeredBy } = req.body;
    if (!domain || !modelType || !algorithmFamily || !datasetId || !Array.isArray(featureIds)) {
      return sendBadRequest(res, "domain, modelType, algorithmFamily, datasetId, and featureIds[] are required");
    }
    const run = await trainingService.startRun({ domain, modelType, algorithmFamily, datasetId, featureIds, hyperparameters: hyperparameters ?? {}, triggeredBy });
    res.status(201).json(run);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/training/trigger/:domain", authMiddleware, async (req, res) => {
  try {
    const runs = await trainingService.triggerDomain(req.params.domain);
    res.status(201).json({ triggered: runs.length, runs });
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------

router.get("/ml/registry/models", authMiddleware, (req, res) => {
  try {
    const { domain, lifecycle } = req.query as { domain?: string; lifecycle?: ModelLifecycle };
    res.json(modelRegistryService.listModels(domain, lifecycle));
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/registry/summary", authMiddleware, (_req, res) => {
  try {
    res.json(modelRegistryService.getSummary());
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/registry/models/:modelVersionId", authMiddleware, (req, res) => {
  try {
    const model = modelRegistryService.getModel(req.params.modelVersionId);
    if (!model) return sendNotFound(res, "Model version not found");
    res.json(model);
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/registry/models/:modelVersionId/lineage", authMiddleware, (req, res) => {
  try {
    const lineage = modelRegistryService.getLineage(req.params.modelVersionId);
    if (!lineage) return sendNotFound(res, "Model version not found");
    res.json(lineage);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/registry/models/:modelVersionId/promote", authMiddleware, (req, res) => {
  try {
    const { lifecycle, promotedBy } = req.body;
    if (!lifecycle) return sendBadRequest(res, "lifecycle is required (experimental | staging | production | deprecated)");
    const result = modelRegistryService.promote(req.params.modelVersionId, lifecycle as ModelLifecycle, promotedBy);
    if (!result.success) return sendBadRequest(res, result.message);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Inference
// ---------------------------------------------------------------------------

router.post("/ml/inference/predict", authMiddleware, async (req, res) => {
  try {
    const { domain, modelType, entityId, entityType, inputFeatures, includeExplanation, forceRefresh } = req.body;
    if (!domain || !modelType || !entityId || !entityType) {
      return sendBadRequest(res, "domain, modelType, entityId, and entityType are required");
    }
    const result = await inferenceService.predict({ domain, modelType, entityId, entityType, inputFeatures, includeExplanation, forceRefresh });
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/inference/batch", authMiddleware, async (req, res) => {
  try {
    const { domain, modelType, entities, includeExplanation } = req.body;
    if (!domain || !modelType || !Array.isArray(entities)) {
      return sendBadRequest(res, "domain, modelType, and entities[] are required");
    }
    const result = await inferenceService.batchPredict({ domain, modelType, entities, includeExplanation });
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/inference/stats", authMiddleware, (_req, res) => {
  try {
    res.json(inferenceService.getStats());
  } catch (err) {
    sendError(res, err);
  }
});

router.delete("/ml/inference/cache", authMiddleware, (req, res) => {
  try {
    const { modelVersionId } = req.query as { modelVersionId?: string };
    const cleared = inferenceService.clearCache(modelVersionId);
    res.json({ cleared });
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

router.get("/ml/monitoring/snapshots", authMiddleware, (req, res) => {
  try {
    const { modelVersionId } = req.query as { modelVersionId?: string };
    res.json(monitoringService.getSnapshots(modelVersionId));
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/monitoring/summary", authMiddleware, (_req, res) => {
  try {
    res.json(monitoringService.getSummary());
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/monitoring/retraining-log", authMiddleware, (_req, res) => {
  try {
    res.json(monitoringService.getRetrainingLog());
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/monitoring/run/:modelVersionId", authMiddleware, async (req, res) => {
  try {
    const snapshot = await monitoringService.runCycle(req.params.modelVersionId);
    res.status(201).json(snapshot);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/monitoring/run-all", authMiddleware, async (_req, res) => {
  try {
    const snapshots = await monitoringService.runAllProduction();
    res.status(201).json({ count: snapshots.length, snapshots });
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// A/B Testing
// ---------------------------------------------------------------------------

router.get("/ml/ab-tests", authMiddleware, (req, res) => {
  try {
    const { domain } = req.query as { domain?: string };
    res.json(abTestingService.list(domain));
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/ab-tests/summary", authMiddleware, (_req, res) => {
  try {
    res.json(abTestingService.getSummary());
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/ab-tests", authMiddleware, (req, res) => {
  try {
    const { name, domain, controlModelVersionId, treatmentModelVersionId, trafficSplitPct, primaryMetric, significanceThreshold, minSampleSize, description } = req.body;
    if (!name || !domain || !controlModelVersionId || !treatmentModelVersionId) {
      return sendBadRequest(res, "name, domain, controlModelVersionId, and treatmentModelVersionId are required");
    }
    const test = abTestingService.create({ name, domain, controlModelVersionId, treatmentModelVersionId, trafficSplitPct, primaryMetric, significanceThreshold, minSampleSize, description });
    res.status(201).json(test);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/ab-tests/:testId/assign", authMiddleware, (req, res) => {
  try {
    const { entityId } = req.body;
    if (!entityId) return sendBadRequest(res, "entityId is required");
    const assignment = abTestingService.assign(req.params.testId, entityId);
    if (!assignment) return sendNotFound(res, "A/B test not found or not running");
    res.json(assignment);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/ab-tests/:testId/outcome", authMiddleware, (req, res) => {
  try {
    const { variant, metricValue } = req.body;
    if (!variant || metricValue === undefined) return sendBadRequest(res, "variant and metricValue are required");
    abTestingService.record(req.params.testId, variant, metricValue);
    res.json({ recorded: true });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/ml/ab-tests/:testId/evaluate", authMiddleware, (req, res) => {
  try {
    const result = abTestingService.evaluate(req.params.testId);
    if (!result) return res.json({ status: "insufficient_samples" });
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/ab-tests/:testId/conclude", authMiddleware, (req, res) => {
  try {
    const test = abTestingService.conclude(req.params.testId);
    if (!test) return sendNotFound(res, "A/B test not found or already concluded");
    res.json(test);
  } catch (err) {
    sendError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Explainability
// ---------------------------------------------------------------------------

router.post("/ml/explain", authMiddleware, (req, res) => {
  try {
    const { domain, modelType, prediction, featureImportance, featureValues } = req.body;
    if (!domain || !modelType || prediction === undefined || !featureImportance || !featureValues) {
      return sendBadRequest(res, "domain, modelType, prediction, featureImportance, and featureValues are required");
    }
    res.json(explainabilityService.explain(domain, modelType, prediction, featureImportance, featureValues));
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/ml/explain/shap", authMiddleware, (req, res) => {
  try {
    const { featureImportance, featureValues, prediction } = req.body;
    if (!featureImportance || !featureValues || prediction === undefined) {
      return sendBadRequest(res, "featureImportance, featureValues, and prediction are required");
    }
    res.json(explainabilityService.computeShap(featureImportance, featureValues, prediction));
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
