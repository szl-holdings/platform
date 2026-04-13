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
import {
  ensureCompoundIntelligenceTables,
  upsertOntologyEntity,
  createOntologyLink,
  traverseOntologyGraph,
  buildBehavioralGenome,
  predictCascadeEffects,
  generateAnticipatorySignal,
  detectCrossDomainCorrelations,
  getCompetitiveMoatAnalysis,
} from "../lib/alloy-compound-intelligence";
import { pool } from "@szl-holdings/db";

const router = Router();

function getOrgId(req: Request): number {
  return (req as { orgId?: number }).orgId ?? 1;
}

ensureMlTables().catch(() => {});
ensureCompoundIntelligenceTables().catch(() => {});

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
    const modelId = parseInt(req.params.id as string);
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
      predictionId: parseInt(req.params.id as string),
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

router.post("/ontology/entities", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { entityId, entityType, domain, name, properties, confidence, sourceSystem } = req.body;
    if (!entityType || !domain || !name) {
      return sendBadRequest(res, "entityType, domain, and name are required");
    }
    const entity = await upsertOntologyEntity({ orgId, entityId, entityType, domain, name, properties, confidence, sourceSystem });
    sendCreated(res, { entity });
  } catch (err) {
    handleRouteError(res, err, "Failed to upsert entity");
  }
});

router.get("/ontology/entities", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { domain, entityType, limit } = req.query;
    let query = `SELECT * FROM alloy_ontology_entities WHERE org_id = $1 AND is_active = TRUE`;
    const params: unknown[] = [orgId];
    if (domain) { params.push(domain); query += ` AND domain = $${params.length}`; }
    if (entityType) { params.push(entityType); query += ` AND entity_type = $${params.length}`; }
    query += ` ORDER BY last_seen DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string) || 100);
    const { rows } = await pool.query(query, params);
    sendSuccess(res, { entities: rows, total: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch entities");
  }
});

router.post("/ontology/links", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { sourceEntityId, targetEntityId, linkType, strength, evidence, isInferred } = req.body;
    if (!sourceEntityId || !targetEntityId || !linkType) {
      return sendBadRequest(res, "sourceEntityId, targetEntityId, and linkType are required");
    }
    const link = await createOntologyLink({ orgId, sourceEntityId, targetEntityId, linkType, strength, evidence, isInferred });
    sendCreated(res, { link });
  } catch (err) {
    handleRouteError(res, err, "Failed to create link");
  }
});

router.get("/ontology/graph/:entityId", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { depth, linkTypes, domains } = req.query;
    const graph = await traverseOntologyGraph({
      orgId,
      entityId: req.params.entityId as string,
      depth: depth ? parseInt(depth as string) : undefined,
      linkTypes: linkTypes ? (linkTypes as string).split(",") : undefined,
      domains: domains ? (domains as string).split(",") : undefined,
    });
    sendSuccess(res, { graph });
  } catch (err) {
    handleRouteError(res, err, "Failed to traverse graph");
  }
});

router.post("/behavioral/genome", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { entityId, domain, genomeType, behaviors } = req.body;
    if (!entityId || !domain || !genomeType || !behaviors?.length) {
      return sendBadRequest(res, "entityId, domain, genomeType, and behaviors[] are required");
    }
    const genome = await buildBehavioralGenome({ orgId, entityId, domain, genomeType, behaviors });
    sendCreated(res, { genome });
  } catch (err) {
    handleRouteError(res, err, "Failed to build behavioral genome");
  }
});

router.get("/behavioral/genomes", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { domain, minAnomaly } = req.query;
    let query = `SELECT * FROM alloy_behavioral_genomes WHERE org_id = $1`;
    const params: unknown[] = [orgId];
    if (domain) { params.push(domain); query += ` AND domain = $${params.length}`; }
    if (minAnomaly) { params.push(parseFloat(minAnomaly as string)); query += ` AND anomaly_score >= $${params.length}`; }
    query += " ORDER BY anomaly_score DESC LIMIT 100";
    const { rows } = await pool.query(query, params);
    sendSuccess(res, { genomes: rows, total: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch behavioral genomes");
  }
});

router.get("/behavioral/genome/:entityId", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { rows } = await pool.query(
      `SELECT * FROM alloy_behavioral_genomes WHERE org_id = $1 AND entity_id = $2 ORDER BY updated_at DESC`,
      [orgId, req.params.entityId]
    );
    sendSuccess(res, { genomes: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch entity genome");
  }
});

router.post("/cascade/predict", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { triggerDomain, triggerSignal, severity } = req.body;
    if (!triggerDomain || !triggerSignal) {
      return sendBadRequest(res, "triggerDomain and triggerSignal are required");
    }
    const result = await predictCascadeEffects({ orgId, triggerDomain, triggerSignal, severity });
    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to predict cascade effects");
  }
});

router.get("/cascade/predictions", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { domain, status } = req.query;
    let query = `SELECT * FROM alloy_cascade_predictions WHERE org_id = $1`;
    const params: unknown[] = [orgId];
    if (domain) { params.push(domain); query += ` AND trigger_domain = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += " ORDER BY created_at DESC LIMIT 50";
    const { rows } = await pool.query(query, params);
    sendSuccess(res, { cascades: rows, total: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch cascade predictions");
  }
});

router.post("/cascade/resolve/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { actualOutcome, wasAccurate } = req.body;
    const { rows } = await pool.query(
      `UPDATE alloy_cascade_predictions SET status = 'resolved', resolved_at = NOW(), actual_outcome = $3, was_accurate = $4
       WHERE id = $1 AND org_id = $2 RETURNING *`,
      [req.params.id, orgId, JSON.stringify(actualOutcome || {}), wasAccurate ?? null]
    );
    if (!rows.length) return sendBadRequest(res, "Cascade prediction not found");
    sendSuccess(res, { cascade: rows[0] });
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve cascade");
  }
});

router.post("/anticipatory/signal", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { entityId, domain, signalType, context } = req.body;
    if (!domain || !signalType || !context) {
      return sendBadRequest(res, "domain, signalType, and context are required");
    }
    const result = await generateAnticipatorySignal({ orgId, entityId, domain, signalType, context });
    if (!result.signal) return sendSuccess(res, { message: result.message, signal: null });
    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to generate anticipatory signal");
  }
});

router.get("/anticipatory/signals", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { domain, active } = req.query;
    let query = `SELECT * FROM alloy_anticipatory_signals WHERE org_id = $1`;
    const params: unknown[] = [orgId];
    if (domain) { params.push(domain); query += ` AND domain = $${params.length}`; }
    if (active === "true") query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
    query += " ORDER BY confidence DESC, created_at DESC LIMIT 100";
    const { rows } = await pool.query(query, params);
    sendSuccess(res, { signals: rows, total: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch anticipatory signals");
  }
});

router.post("/correlations/detect", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { domains, timeWindowHours } = req.body;
    const result = await detectCrossDomainCorrelations({ orgId, domains, timeWindowHours });
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to detect correlations");
  }
});

router.get("/correlations", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { priority, domain } = req.query;
    let query = `SELECT * FROM alloy_cross_domain_correlations WHERE org_id = $1`;
    const params: unknown[] = [orgId];
    if (priority) { params.push(priority); query += ` AND priority = $${params.length}`; }
    if (domain) { params.push(domain); query += ` AND $${params.length} = ANY(domains)`; }
    query += " ORDER BY strength DESC, created_at DESC LIMIT 50";
    const { rows } = await pool.query(query, params);
    sendSuccess(res, { correlations: rows, total: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch correlations");
  }
});

router.get("/competitive/moat", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const analysis = await getCompetitiveMoatAnalysis(orgId);
    sendSuccess(res, analysis);
  } catch (err) {
    handleRouteError(res, err, "Failed to get competitive analysis");
  }
});

router.get("/compound/dashboard", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const [entities, links, genomes, cascades, signals, correlations, moat] = await Promise.all([
      pool.query(`SELECT count(*) as total, count(DISTINCT domain) as domains FROM alloy_ontology_entities WHERE org_id = $1 AND is_active = TRUE`, [orgId]),
      pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE is_inferred = TRUE) as inferred FROM alloy_ontology_links WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, avg(anomaly_score) as avg_anomaly, count(*) FILTER (WHERE anomaly_score > 0.7) as high_risk FROM alloy_behavioral_genomes WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE status = 'active') as active, avg(risk_amplification) as avg_amplification FROM alloy_cascade_predictions WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, avg(confidence) as avg_confidence, count(*) FILTER (WHERE was_acted_on = TRUE) as acted_on FROM alloy_anticipatory_signals WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE actionable = TRUE) as actionable, count(*) FILTER (WHERE priority = 'critical') as critical FROM alloy_cross_domain_correlations WHERE org_id = $1`, [orgId]),
      pool.query(`SELECT count(*) as total, avg(moat_score) as avg_moat, count(*) FILTER (WHERE is_unique = TRUE) as unique_capabilities FROM alloy_competitive_moat WHERE org_id = $1`, [orgId]),
    ]);

    sendSuccess(res, {
      compoundIntelligence: {
        ontology: { entities: entities.rows[0].total, domains: entities.rows[0].domains, links: links.rows[0].total, inferredLinks: links.rows[0].inferred },
        behavioralGenomes: genomes.rows[0],
        cascadePredictions: cascades.rows[0],
        anticipatorySignals: signals.rows[0],
        crossDomainCorrelations: correlations.rows[0],
        competitiveMoat: moat.rows[0],
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch compound dashboard");
  }
});

export default router;
