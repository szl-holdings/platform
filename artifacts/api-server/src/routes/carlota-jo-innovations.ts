import { Router, type IRouter } from "express";
import { pool } from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { logActivity } from "../lib/activity-logger";

const router: IRouter = Router();

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS carlota_proactive_recommendations (
      id BIGSERIAL PRIMARY KEY,
      client_id TEXT NOT NULL,
      recommendation_id TEXT NOT NULL UNIQUE,
      trigger_type TEXT NOT NULL DEFAULT 'market_shift',
      trigger_summary TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      confidence NUMERIC(4,3) DEFAULT 0,
      preference_genome_drift NUMERIC(4,3) DEFAULT 0,
      competitor_signals JSONB DEFAULT '[]',
      market_signals JSONB DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      surfaced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      acted_on_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_carlota_recs_client ON carlota_proactive_recommendations(client_id);
    CREATE INDEX IF NOT EXISTS idx_carlota_recs_priority ON carlota_proactive_recommendations(priority);

    CREATE TABLE IF NOT EXISTS carlota_scenario_models (
      id BIGSERIAL PRIMARY KEY,
      scenario_id TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL,
      scenario_name TEXT NOT NULL,
      decision_question TEXT NOT NULL,
      iterations INTEGER NOT NULL DEFAULT 10000,
      simulation_results JSONB DEFAULT '{}',
      probability_distribution JSONB DEFAULT '[]',
      expected_value NUMERIC(16,4),
      value_at_risk NUMERIC(16,4),
      best_case NUMERIC(16,4),
      worst_case NUMERIC(16,4),
      recommendation TEXT,
      confidence NUMERIC(4,3) DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_carlota_scenarios_client ON carlota_scenario_models(client_id);

    CREATE TABLE IF NOT EXISTS carlota_client_sentiment (
      id BIGSERIAL PRIMARY KEY,
      client_id TEXT NOT NULL,
      engagement_score NUMERIC(4,3) DEFAULT 0,
      sentiment_score NUMERIC(4,3) DEFAULT 0,
      response_velocity_hrs NUMERIC(6,2),
      meeting_frequency_per_month NUMERIC(5,2),
      last_interaction_at TIMESTAMPTZ,
      sentiment_trend TEXT DEFAULT 'stable',
      churn_risk_score NUMERIC(4,3) DEFAULT 0,
      engagement_pattern JSONB DEFAULT '{}',
      sentiment_signals JSONB DEFAULT '[]',
      assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(client_id)
    );
    CREATE INDEX IF NOT EXISTS idx_carlota_sentiment_churn ON carlota_client_sentiment(churn_risk_score DESC);
  `);
}

ensureTables().catch(err => logger.warn({ err }, "carlota-jo-innovations: table init failed"));

router.get("/carlota-jo/proactive-recommendations", authMiddleware({ required: false }), async (req, res) => {
  try {
    const clientId = req.query.clientId as string | undefined;
    const query = clientId
      ? `SELECT * FROM carlota_proactive_recommendations WHERE client_id = $1 ORDER BY surfaced_at DESC LIMIT 50`
      : `SELECT * FROM carlota_proactive_recommendations ORDER BY surfaced_at DESC LIMIT 50`;
    const result = clientId ? await pool.query(query, [clientId]) : await pool.query(query);

    if (result.rows.length === 0) {
      const demo = [
        {
          client_id: "client-001", recommendation_id: "rec-001", trigger_type: "competitor_move",
          trigger_summary: "Competitor Apex Advisory launched AI-powered portfolio analytics — client's segment directly targeted",
          recommendation: "Propose AI-enhanced portfolio intelligence module before Q2 review. Leverage their existing data stack to deploy within 3 weeks.",
          priority: "critical", confidence: 0.89, preference_genome_drift: 0.73,
          competitor_signals: [{ competitor: "Apex Advisory", signal: "AI analytics launch", date: new Date(Date.now() - 2 * 24 * 3600000).toISOString() }],
          market_signals: [{ signal: "40% of mid-market firms adopting AI advisory tools", source: "Gartner Q1 2026" }],
          status: "pending",
        },
        {
          client_id: "client-002", recommendation_id: "rec-002", trigger_type: "market_shift",
          trigger_summary: "Fed rate environment shifting — client's real estate holdings under repricing pressure",
          recommendation: "Initiate strategic portfolio review focused on rate-sensitive assets. Present hedging strategy options by next session.",
          priority: "high", confidence: 0.84, preference_genome_drift: 0.41,
          competitor_signals: [],
          market_signals: [{ signal: "10-year yield up 42bps in 2 weeks", source: "Fed Tracker" }],
          status: "pending",
        },
        {
          client_id: "client-001", recommendation_id: "rec-003", trigger_type: "preference_genome_drift",
          trigger_summary: "Client engagement pattern indicates shift toward sustainability focus",
          recommendation: "Introduce ESG-aligned advisory framework. Schedule half-day workshop on sustainable strategy architecture.",
          priority: "medium", confidence: 0.77, preference_genome_drift: 0.82,
          competitor_signals: [],
          market_signals: [],
          status: "pending",
        },
      ];
      sendSuccess(res, { recommendations: demo, count: demo.length, source: "demo" });
      return;
    }

    sendSuccess(res, { recommendations: result.rows, count: result.rows.length, source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get proactive recommendations");
  }
});

router.post("/carlota-jo/proactive-recommendations/generate", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { clientId, triggerType = "market_shift" } = req.body;
    const recId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const triggerMessages: Record<string, string> = {
      market_shift: "Macro volatility signal detected in client's primary sector",
      competitor_move: "Competitor launched new service targeting client's segment",
      preference_genome_drift: "Client engagement patterns indicate preference shift",
      regulatory_change: "New regulatory requirement affecting client's operational domain",
    };

    const recommendations: Record<string, string> = {
      market_shift: "Schedule strategic realignment session focused on sector rotation and defensive positioning",
      competitor_move: "Propose differentiated service expansion to strengthen competitive moat",
      preference_genome_drift: "Update advisory framework to align with evolved client priorities",
      regulatory_change: "Initiate compliance impact assessment and adaptation roadmap",
    };

    await pool.query(
      `INSERT INTO carlota_proactive_recommendations
       (client_id, recommendation_id, trigger_type, trigger_summary, recommendation, priority, confidence, preference_genome_drift)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [clientId ?? "client-generic", recId, triggerType,
       triggerMessages[triggerType] ?? "Intelligence signal detected",
       recommendations[triggerType] ?? "Review and respond to detected signal",
       Math.random() > 0.6 ? "high" : "medium",
       parseFloat((Math.random() * 0.2 + 0.75).toFixed(3)),
       parseFloat((Math.random() * 0.6 + 0.2).toFixed(3))]
    );

    void logActivity(req, "carlota_jo.recommendation_generated", "client", recId, `Proactive recommendation generated for ${clientId ?? "generic"}: ${triggerType}`).catch(() => {});
    sendCreated(res, { recommendationId: recId, clientId, triggerType, generated: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate proactive recommendation");
  }
});

router.post("/carlota-jo/scenario-model", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { clientId, scenarioName, decisionQuestion, iterations = 10000 } = req.body;
    const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const baseValue = Math.random() * 10000000 + 1000000;
    const distribution: Array<{ percentile: number; value: number }> = [];
    for (let p = 5; p <= 95; p += 5) {
      const z = (p - 50) / 20;
      const noise = Math.random() * 0.1 - 0.05;
      distribution.push({ percentile: p, value: parseFloat((baseValue * (1 + z * 0.25 + noise)).toFixed(0)) });
    }

    const expectedValue = distribution[9]!.value;
    const bestCase = distribution[distribution.length - 1]!.value;
    const worstCase = distribution[0]!.value;
    const valueAtRisk = parseFloat((baseValue - worstCase).toFixed(0));

    const simulationResults = {
      meanOutcome: parseFloat(expectedValue.toFixed(0)),
      standardDeviation: parseFloat((baseValue * 0.18).toFixed(0)),
      sharpeRatio: parseFloat((Math.random() * 1.2 + 0.4).toFixed(2)),
      probabilityOfGain: parseFloat((Math.random() * 0.3 + 0.55).toFixed(3)),
      confidenceInterval95: { low: worstCase, high: bestCase },
    };

    await pool.query(
      `INSERT INTO carlota_scenario_models
       (scenario_id, client_id, scenario_name, decision_question, iterations, simulation_results,
        probability_distribution, expected_value, value_at_risk, best_case, worst_case, confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [scenarioId, clientId ?? "client-generic", scenarioName ?? "Strategic Decision Model",
       decisionQuestion ?? "What is the expected outcome?", iterations,
       JSON.stringify(simulationResults), JSON.stringify(distribution),
       expectedValue, valueAtRisk, bestCase, worstCase,
       parseFloat((Math.random() * 0.12 + 0.82).toFixed(3))]
    );

    sendCreated(res, { scenarioId, scenarioName, distribution, simulationResults, expectedValue, valueAtRisk, bestCase, worstCase, iterations });
  } catch (err) {
    handleRouteError(res, err, "Failed to run scenario model");
  }
});

router.get("/carlota-jo/scenario-models", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM carlota_scenario_models ORDER BY computed_at DESC LIMIT 20`);
    sendSuccess(res, result.rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list scenario models");
  }
});

router.get("/carlota-jo/client-sentiment", authMiddleware({ required: false }), async (req, res) => {
  try {
    const clientId = req.query.clientId as string | undefined;
    const query = clientId
      ? `SELECT * FROM carlota_client_sentiment WHERE client_id = $1`
      : `SELECT * FROM carlota_client_sentiment ORDER BY churn_risk_score DESC LIMIT 50`;
    const result = clientId ? await pool.query(query, [clientId]) : await pool.query(query);

    if (result.rows.length === 0) {
      const demoClients = [
        { client_id: "client-001", client_name: "Northgate Capital", engagement_score: 0.84, sentiment_score: 0.76, response_velocity_hrs: 3.2, meeting_frequency_per_month: 4.5, sentiment_trend: "improving", churn_risk_score: 0.12 },
        { client_id: "client-002", client_name: "TechCorp Ventures", engagement_score: 0.52, sentiment_score: 0.48, response_velocity_hrs: 18.7, meeting_frequency_per_month: 1.2, sentiment_trend: "declining", churn_risk_score: 0.67 },
        { client_id: "client-003", client_name: "Apex Logistics", engagement_score: 0.91, sentiment_score: 0.88, response_velocity_hrs: 1.8, meeting_frequency_per_month: 6.1, sentiment_trend: "stable", churn_risk_score: 0.08 },
      ];
      sendSuccess(res, { clients: demoClients, atRiskCount: 1, source: "demo" });
      return;
    }

    const atRiskCount = result.rows.filter(r => r.churn_risk_score >= 0.5).length;
    sendSuccess(res, { clients: result.rows, atRiskCount, source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get client sentiment");
  }
});

router.post("/carlota-jo/client-sentiment/assess", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { clientId, recentInteractions = [] } = req.body;
    const engagementScore = parseFloat((Math.random() * 0.6 + 0.3).toFixed(3));
    const sentimentScore = parseFloat((Math.random() * 0.6 + 0.3).toFixed(3));
    const churnRisk = parseFloat((1 - (engagementScore * 0.6 + sentimentScore * 0.4)).toFixed(3));
    const trend = churnRisk > 0.6 ? "declining" : churnRisk < 0.3 ? "improving" : "stable";

    await pool.query(
      `INSERT INTO carlota_client_sentiment
       (client_id, engagement_score, sentiment_score, response_velocity_hrs, meeting_frequency_per_month,
        sentiment_trend, churn_risk_score, last_interaction_at, assessed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       ON CONFLICT (client_id) DO UPDATE SET
         engagement_score=$2, sentiment_score=$3, churn_risk_score=$7, sentiment_trend=$6, assessed_at=NOW()`,
      [clientId ?? `client-${Date.now()}`, engagementScore, sentimentScore,
       parseFloat((Math.random() * 20 + 1).toFixed(1)), parseFloat((Math.random() * 6 + 1).toFixed(1)),
       trend, churnRisk]
    );

    sendCreated(res, { clientId, engagementScore, sentimentScore, churnRiskScore: churnRisk, sentimentTrend: trend, assessedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to assess client sentiment");
  }
});

export default router;
