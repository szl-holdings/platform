import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, handleRouteError } from "../lib/api-response";
import {
  createMlModel,
  runTraining,
  predict,
  resolvePrediction,
  runBacktest,
  generateForecast,
  ensureMlTables,
} from "../lib/alloy-ml-engine";
import { pool } from "@szl-holdings/db";

const router = Router();

function getOrgId(req: Request): number {
  return (req as { orgId?: number }).orgId ?? 1;
}

ensureMlTables().catch(() => {});

router.get("/ml/models", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { domain, status } = req.query;
    let query = `SELECT id, name, domain, model_type, status, version, accuracy, precision, recall, f1_score,
      total_predictions, correct_predictions, training_data_size, avg_latency_ms, last_trained_at, deployed_at, created_at, updated_at
      FROM alloy_ml_models WHERE org_id = $1`;
    const params: unknown[] = [orgId];

    if (domain) { params.push(domain); query += ` AND domain = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += " ORDER BY updated_at DESC LIMIT 50";

    const { rows } = await pool.query(query, params);
    sendSuccess(res, { models: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch models");
  }
});

router.get("/ml/models/:id", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { rows } = await pool.query(
      `SELECT * FROM alloy_ml_models WHERE id = $1 AND org_id = $2`,
      [req.params.id, orgId]
    );
    if (!rows.length) return sendBadRequest(res, "Model not found");
    sendSuccess(res, { model: rows[0] });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch model");
  }
});

router.post("/ml/models", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { name, domain, modelType } = req.body;
    if (!name || !domain || !modelType) {
      return sendBadRequest(res, "name, domain, and modelType are required");
    }

    const result = await createMlModel({ orgId, name, domain, modelType });
    sendCreated(res, { model: result });
  } catch (err) {
    handleRouteError(res, err, "Failed to create model");
  }
});

router.post("/ml/models/:id/train", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const modelId = parseInt(req.params.id);
    const { config, trainingData } = req.body;

    const trainingConfig = {
      strategy: config?.strategy || "evolutionary",
      maxGenerations: config?.maxGenerations || 25,
      populationSize: config?.populationSize || 20,
      validationSplit: config?.validationSplit || 0.2,
      targetMetric: config?.targetMetric || "accuracy",
      earlyStoppingPatience: config?.earlyStoppingPatience || 5,
      crossValidationFolds: config?.crossValidationFolds || 3,
    };

    const defaultTrainingData = trainingData?.length > 0 ? trainingData : generateDomainTrainingData(req.body.domain || "general");

    const result = await runTraining({
      orgId,
      modelId,
      config: trainingConfig,
      trainingData: defaultTrainingData,
    });

    sendSuccess(res, { training: result });
  } catch (err) {
    handleRouteError(res, err, "Failed to run training");
  }
});

router.post("/ml/predict", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { modelId, input, domain } = req.body;
    if (!modelId || !input || !domain) {
      return sendBadRequest(res, "modelId, input, and domain are required");
    }

    const result = await predict({ orgId, modelId, input, domain });
    sendSuccess(res, { prediction: result });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate prediction");
  }
});

router.post("/ml/predictions/:id/resolve", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { actualValue, actualLabel } = req.body;
    if (actualValue === undefined) {
      return sendBadRequest(res, "actualValue is required");
    }

    const result = await resolvePrediction({
      orgId,
      predictionId: parseInt(req.params.id),
      actualValue,
      actualLabel,
    });
    sendSuccess(res, { resolution: result });
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve prediction");
  }
});

router.get("/ml/predictions", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { modelId, domain, limit } = req.query;
    let query = `SELECT id, model_id, domain, prediction_type, predicted_value, predicted_label,
      confidence, is_correct, error_margin, latency_ms, created_at, resolved_at
      FROM alloy_predictions WHERE org_id = $1`;
    const params: unknown[] = [orgId];

    if (modelId) { params.push(modelId); query += ` AND model_id = $${params.length}`; }
    if (domain) { params.push(domain); query += ` AND domain = $${params.length}`; }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string) || 50);

    const { rows } = await pool.query(query, params);
    sendSuccess(res, { predictions: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch predictions");
  }
});

router.post("/ml/backtest", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { modelId, name, domain, timeRangeStart, timeRangeEnd } = req.body;
    if (!modelId || !domain) {
      return sendBadRequest(res, "modelId and domain are required");
    }

    const start = timeRangeStart ? new Date(timeRangeStart) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = timeRangeEnd ? new Date(timeRangeEnd) : new Date();

    const result = await runBacktest({
      orgId,
      modelId,
      name: name || `Backtest ${domain} ${new Date().toISOString().split("T")[0]}`,
      domain,
      timeRangeStart: start,
      timeRangeEnd: end,
    });

    sendSuccess(res, { backtest: result });
  } catch (err) {
    handleRouteError(res, err, "Failed to run backtest");
  }
});

router.get("/ml/backtests", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { modelId, domain } = req.query;
    let query = `SELECT id, model_id, name, domain, status, total_predictions, correct_predictions,
      accuracy, precision, recall, f1_score, drift_detected, duration_ms, created_at, completed_at
      FROM alloy_backtest_sessions WHERE org_id = $1`;
    const params: unknown[] = [orgId];

    if (modelId) { params.push(modelId); query += ` AND model_id = $${params.length}`; }
    if (domain) { params.push(domain); query += ` AND domain = $${params.length}`; }
    query += " ORDER BY created_at DESC LIMIT 50";

    const { rows } = await pool.query(query, params);
    sendSuccess(res, { backtests: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch backtests");
  }
});

router.get("/ml/backtests/:id", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { rows } = await pool.query(
      `SELECT * FROM alloy_backtest_sessions WHERE id = $1 AND org_id = $2`,
      [req.params.id, orgId]
    );
    if (!rows.length) return sendBadRequest(res, "Backtest session not found");
    sendSuccess(res, { backtest: rows[0] });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch backtest");
  }
});

router.post("/ml/forecast", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { modelId, domain, targetMetric, horizon } = req.body;
    if (!modelId || !domain || !targetMetric) {
      return sendBadRequest(res, "modelId, domain, and targetMetric are required");
    }

    const result = await generateForecast({
      orgId,
      modelId,
      domain,
      targetMetric,
      horizon: horizon || "30d",
    });

    sendSuccess(res, { forecast: result });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate forecast");
  }
});

router.get("/ml/forecasts", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { modelId, domain } = req.query;
    let query = `SELECT id, model_id, domain, target_metric, forecast_horizon, confidence,
      methodology, is_expired, expires_at, created_at
      FROM alloy_forecasts WHERE org_id = $1`;
    const params: unknown[] = [orgId];

    if (modelId) { params.push(modelId); query += ` AND model_id = $${params.length}`; }
    if (domain) { params.push(domain); query += ` AND domain = $${params.length}`; }
    query += " ORDER BY created_at DESC LIMIT 50";

    const { rows } = await pool.query(query, params);
    sendSuccess(res, { forecasts: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch forecasts");
  }
});

router.get("/ml/forecasts/:id", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { rows } = await pool.query(
      `SELECT * FROM alloy_forecasts WHERE id = $1 AND org_id = $2`,
      [req.params.id, orgId]
    );
    if (!rows.length) return sendBadRequest(res, "Forecast not found");
    sendSuccess(res, { forecast: rows[0] });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch forecast");
  }
});

router.get("/ml/training-runs", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { modelId } = req.query;
    let query = `SELECT id, model_id, run_name, status, strategy, generations_completed,
      max_generations, best_fitness, convergence_rate, duration_ms, started_at, completed_at, created_at
      FROM alloy_ml_training_runs WHERE org_id = $1`;
    const params: unknown[] = [orgId];

    if (modelId) { params.push(modelId); query += ` AND model_id = $${params.length}`; }
    query += " ORDER BY created_at DESC LIMIT 50";

    const { rows } = await pool.query(query, params);
    sendSuccess(res, { trainingRuns: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch training runs");
  }
});

router.get("/ml/training-runs/:id", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { rows } = await pool.query(
      `SELECT * FROM alloy_ml_training_runs WHERE id = $1 AND org_id = $2`,
      [req.params.id, orgId]
    );
    if (!rows.length) return sendBadRequest(res, "Training run not found");
    sendSuccess(res, { trainingRun: rows[0] });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch training run");
  }
});

router.get("/ml/dashboard", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);

    const [modelsResult, runsResult, predictionsResult, backtestsResult, forecastsResult] = await Promise.all([
      pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE status = 'trained') as trained, count(*) FILTER (WHERE status = 'deployed') as deployed FROM alloy_ml_models WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE status = 'completed') as completed, avg(best_fitness) as avg_fitness FROM alloy_ml_training_runs WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE is_correct = true) as correct, avg(confidence) as avg_confidence, avg(latency_ms) as avg_latency FROM alloy_predictions WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, avg(accuracy) as avg_accuracy, avg(f1_score) as avg_f1, count(*) FILTER (WHERE drift_detected = true) as drift_count FROM alloy_backtest_sessions WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, avg(confidence) as avg_confidence, count(*) FILTER (WHERE is_expired = false) as active FROM alloy_forecasts WHERE org_id = $1`, [orgId]),
    ]);

    sendSuccess(res, {
      dashboard: {
        models: modelsResult.rows[0],
        trainingRuns: runsResult.rows[0],
        predictions: predictionsResult.rows[0],
        backtests: backtestsResult.rows[0],
        forecasts: forecastsResult.rows[0],
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch dashboard");
  }
});

function generateDomainTrainingData(domain: string) {
  const domainExamples: Record<string, Array<{ input: Record<string, unknown>; expectedOutput: unknown; expectedLabel: string }>> = {
    maritime: [
      { input: { vesselType: "bulk_carrier", aisGaps: 3, flagState: "panama", portHistory: ["dubai", "mumbai"], sanctionedEntity: false }, expectedOutput: { risk: "low", score: 0.2 }, expectedLabel: "low_risk" },
      { input: { vesselType: "tanker", aisGaps: 15, flagState: "cameroon", portHistory: ["bandar_abbas", "dalian"], sanctionedEntity: true }, expectedOutput: { risk: "critical", score: 0.95 }, expectedLabel: "critical_risk" },
      { input: { vesselType: "container", aisGaps: 0, flagState: "marshall_islands", portHistory: ["singapore", "rotterdam"], sanctionedEntity: false }, expectedOutput: { risk: "minimal", score: 0.05 }, expectedLabel: "minimal_risk" },
      { input: { vesselType: "tanker", aisGaps: 8, flagState: "liberia", portHistory: ["novorossiysk", "istanbul"], sanctionedEntity: false }, expectedOutput: { risk: "elevated", score: 0.6 }, expectedLabel: "elevated_risk" },
      { input: { vesselType: "general_cargo", aisGaps: 22, flagState: "comoros", portHistory: ["latakia", "tartus"], sanctionedEntity: true }, expectedOutput: { risk: "critical", score: 0.98 }, expectedLabel: "critical_risk" },
    ],
    legal: [
      { input: { caseType: "breach_of_contract", damages: 500000, jurisdiction: "NY", evidenceStrength: "strong", precedentFavorable: true }, expectedOutput: { outcome: "likely_win", settlementRange: [350000, 450000] }, expectedLabel: "favorable" },
      { input: { caseType: "negligence", damages: 2000000, jurisdiction: "CA", evidenceStrength: "moderate", precedentFavorable: false }, expectedOutput: { outcome: "uncertain", settlementRange: [400000, 800000] }, expectedLabel: "uncertain" },
      { input: { caseType: "IP_infringement", damages: 10000000, jurisdiction: "DE", evidenceStrength: "strong", precedentFavorable: true }, expectedOutput: { outcome: "likely_win", settlementRange: [5000000, 8000000] }, expectedLabel: "favorable" },
    ],
    defense: [
      { input: { threatActor: "APT-29", targetSector: "energy", attackVector: "supply_chain", detectionSignals: 5 }, expectedOutput: { severity: "critical", attribution_confidence: 0.85 }, expectedLabel: "critical_threat" },
      { input: { threatActor: "unknown", targetSector: "maritime", attackVector: "phishing", detectionSignals: 2 }, expectedOutput: { severity: "moderate", attribution_confidence: 0.3 }, expectedLabel: "moderate_threat" },
    ],
    real_estate: [
      { input: { propertyType: "multifamily", occupancy: 0.92, capRate: 0.055, marketTrend: "appreciating", distressSignals: 0 }, expectedOutput: { recommendation: "hold", projectedReturn: 0.08 }, expectedLabel: "stable" },
      { input: { propertyType: "office", occupancy: 0.65, capRate: 0.08, marketTrend: "declining", distressSignals: 3 }, expectedOutput: { recommendation: "sell", projectedReturn: -0.05 }, expectedLabel: "distressed" },
    ],
    general: [
      { input: { signalType: "anomaly", domain: "cross_domain", confidence: 0.7, impactScore: 0.8 }, expectedOutput: { priority: "high", action: "investigate" }, expectedLabel: "high_priority" },
      { input: { signalType: "routine", domain: "operations", confidence: 0.9, impactScore: 0.2 }, expectedOutput: { priority: "low", action: "monitor" }, expectedLabel: "low_priority" },
    ],
  };

  const examples = domainExamples[domain] || domainExamples.general;
  return examples.map(e => ({
    ...e,
    domain,
    difficulty: 1,
    tags: [domain, "training"],
  }));
}

export default router;
