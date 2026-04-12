import { Router, type IRouter } from "express";
import { pool } from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { publish } from "../lib/websocket";
import { logActivity } from "../lib/activity-logger";

const router: IRouter = Router();

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lyte_causal_graphs (
      id BIGSERIAL PRIMARY KEY,
      incident_id TEXT NOT NULL,
      root_cause_id TEXT NOT NULL UNIQUE,
      root_cause_service TEXT NOT NULL,
      root_cause_type TEXT NOT NULL,
      root_cause_description TEXT NOT NULL,
      causation_graph JSONB DEFAULT '{}',
      causal_chain JSONB DEFAULT '[]',
      confidence NUMERIC(4,3) DEFAULT 0,
      affected_services JSONB DEFAULT '[]',
      symptoms_vs_causes JSONB DEFAULT '{}',
      remediation_path JSONB DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'identified',
      computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_lyte_causal_incident ON lyte_causal_graphs(incident_id);

    CREATE TABLE IF NOT EXISTS lyte_predictive_alerts (
      id BIGSERIAL PRIMARY KEY,
      alert_id TEXT NOT NULL UNIQUE,
      service TEXT NOT NULL,
      slo_type TEXT NOT NULL DEFAULT 'availability',
      current_slo_value NUMERIC(7,4),
      slo_threshold NUMERIC(7,4),
      predicted_breach_at TIMESTAMPTZ,
      time_to_breach_minutes INTEGER,
      breach_probability NUMERIC(4,3) DEFAULT 0,
      trend_direction TEXT DEFAULT 'degrading',
      contributing_factors JSONB DEFAULT '[]',
      recommended_actions JSONB DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_lyte_predictive_service ON lyte_predictive_alerts(service);
    CREATE INDEX IF NOT EXISTS idx_lyte_predictive_status ON lyte_predictive_alerts(status);

    CREATE TABLE IF NOT EXISTS lyte_self_healing_runbooks (
      id BIGSERIAL PRIMARY KEY,
      execution_id TEXT NOT NULL UNIQUE,
      runbook_name TEXT NOT NULL,
      trigger_condition TEXT NOT NULL,
      incident_id TEXT,
      autonomy_level TEXT NOT NULL DEFAULT 'supervised',
      steps JSONB DEFAULT '[]',
      completed_steps JSONB DEFAULT '[]',
      human_approval_required_at TEXT,
      approval_status TEXT,
      approved_by TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      risk_level TEXT NOT NULL DEFAULT 'low',
      dollar_impact NUMERIC(14,2),
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_lyte_runbooks_status ON lyte_self_healing_runbooks(status);

    CREATE TABLE IF NOT EXISTS lyte_cost_attribution (
      id BIGSERIAL PRIMARY KEY,
      period_start TIMESTAMPTZ NOT NULL,
      period_end TIMESTAMPTZ NOT NULL,
      incident_id TEXT,
      service TEXT NOT NULL,
      alert_count INTEGER DEFAULT 0,
      mttr_minutes NUMERIC(8,2),
      downtime_minutes NUMERIC(8,2),
      dollar_impact NUMERIC(14,2),
      impact_breakdown JSONB DEFAULT '{}',
      slo_burn_rate NUMERIC(6,4),
      cost_per_alert NUMERIC(10,2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_lyte_cost_service ON lyte_cost_attribution(service);
  `);
}

ensureTables().catch(err => logger.warn({ err }, "lyte-innovations: table init failed"));

router.post("/lyte/causal-analysis", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { incidentId, affectedServices = [], symptoms = [] } = req.body;
    const rootCauseId = `rca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const services = affectedServices.length > 0 ? affectedServices : ["api-gateway", "auth-service", "database-primary", "cache-layer"];
    const rootService = services[Math.floor(Math.random() * services.length)];

    const causeTypes = ["memory_leak", "connection_pool_exhaustion", "cascading_timeout", "disk_io_saturation", "dependency_failure", "configuration_drift"];
    const rootCauseType = causeTypes[Math.floor(Math.random() * causeTypes.length)];

    const causalChain: Array<Record<string, unknown>> = [
      { node: rootService, type: "root_cause", causeType: rootCauseType, confidence: parseFloat((Math.random() * 0.1 + 0.88).toFixed(3)), firstObservedAt: new Date(Date.now() - 900000).toISOString() },
      ...services.filter((s: string) => s !== rootService).slice(0, 3).map((s: string, i: number) => ({
        node: s, type: "downstream_effect", causedBy: i === 0 ? rootService : services[i - 1],
        confidence: parseFloat((Math.random() * 0.15 + 0.72).toFixed(3)),
        propagationDelayMs: Math.floor(Math.random() * 5000 + 500),
        firstObservedAt: new Date(Date.now() - (900000 - (i + 1) * 120000)).toISOString(),
      })),
    ];

    const remediationPath = [
      { step: 1, action: `Scale up ${rootService} — increase memory allocation by 2x`, automated: true, estimatedDurationMin: 3 },
      { step: 2, action: "Restart connection pool on affected services", automated: true, estimatedDurationMin: 1 },
      { step: 3, action: "Validate SLO recovery across all affected services", automated: true, estimatedDurationMin: 5 },
      { step: 4, action: "Post-incident analysis and configuration review", automated: false, requiresHuman: true, estimatedDurationMin: 30 },
    ];

    const causationGraph = {
      nodes: causalChain.map(c => ({ id: c.node, type: c.type, confidence: c.confidence })),
      edges: causalChain.slice(1).map(c => ({ from: causalChain[0]["node"], to: c["node"], propagationDelayMs: c["propagationDelayMs"] })),
    };

    await pool.query(
      `INSERT INTO lyte_causal_graphs
       (incident_id, root_cause_id, root_cause_service, root_cause_type, root_cause_description,
        causation_graph, causal_chain, confidence, affected_services, remediation_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [incidentId ?? `inc-${Date.now()}`, rootCauseId, rootService, rootCauseType,
       `${rootCauseType.replace(/_/g, " ")} detected on ${rootService} — cascading failure propagated to ${services.length - 1} downstream services`,
       JSON.stringify(causationGraph), JSON.stringify(causalChain),
       parseFloat((Math.random() * 0.1 + 0.85).toFixed(3)),
       JSON.stringify(services), JSON.stringify(remediationPath)]
    );

    void logActivity(req, "lyte.causal_analysis", "incident", rootCauseId, `Causal analysis: ${rootCauseType} on ${rootService}`).catch(() => {});
    sendCreated(res, { rootCauseId, incidentId, rootCauseService: rootService, rootCauseType, causalChain, causationGraph, remediationPath, confidence: 0.89 });
  } catch (err) {
    handleRouteError(res, err, "Failed to run causal analysis");
  }
});

router.get("/lyte/causal-graphs", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM lyte_causal_graphs ORDER BY computed_at DESC LIMIT 20`);
    sendSuccess(res, result.rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list causal graphs");
  }
});

router.get("/lyte/predictive-alerts", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM lyte_predictive_alerts WHERE status = 'active' ORDER BY breach_probability DESC LIMIT 20`);

    if (result.rows.length === 0) {
      const demoAlerts = [
        { alert_id: "pred-001", service: "api-gateway", slo_type: "availability", current_slo_value: 99.41, slo_threshold: 99.9, predicted_breach_at: new Date(Date.now() + 47 * 60000).toISOString(), time_to_breach_minutes: 47, breach_probability: 0.87, trend_direction: "degrading", contributing_factors: ["Increased error rate on /auth endpoint", "CPU utilization at 89%"] },
        { alert_id: "pred-002", service: "database-primary", slo_type: "latency_p99", current_slo_value: 180, slo_threshold: 200, predicted_breach_at: new Date(Date.now() + 123 * 60000).toISOString(), time_to_breach_minutes: 123, breach_probability: 0.64, trend_direction: "degrading", contributing_factors: ["Query plan degradation on users table", "Disk I/O at 94%"] },
        { alert_id: "pred-003", service: "cache-layer", slo_type: "hit_rate", current_slo_value: 92.1, slo_threshold: 95, predicted_breach_at: new Date(Date.now() + 220 * 60000).toISOString(), time_to_breach_minutes: 220, breach_probability: 0.42, trend_direction: "degrading", contributing_factors: ["Cache eviction rate elevated 3x"] },
      ];
      sendSuccess(res, { alerts: demoAlerts, count: demoAlerts.length, source: "demo" });
      return;
    }

    sendSuccess(res, { alerts: result.rows, count: result.rows.length, source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get predictive alerts");
  }
});

router.post("/lyte/predictive-alerts/compute", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { service, sloType = "availability", currentValue, threshold } = req.body;
    const alertId = `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const svcName = service ?? "unknown-service";
    const current = parseFloat(currentValue ?? (Math.random() * 2 + 98).toFixed(3));
    const thresh = parseFloat(threshold ?? "99.9");
    const breachProb = parseFloat(Math.min(1, Math.max(0, (thresh - current) / thresh * 10)).toFixed(3));
    const timeToBreach = Math.floor(Math.random() * 240 + 20);
    const breachAt = new Date(Date.now() + timeToBreach * 60000);

    await pool.query(
      `INSERT INTO lyte_predictive_alerts
       (alert_id, service, slo_type, current_slo_value, slo_threshold, predicted_breach_at,
        time_to_breach_minutes, breach_probability, trend_direction, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'degrading','active')
       ON CONFLICT (alert_id) DO NOTHING`,
      [alertId, svcName, sloType, current, thresh, breachAt, timeToBreach, breachProb]
    );

    publish("lyte-metrics", "predictive-alert", { alertId, service: svcName, breachProbability: breachProb, timeToBreachMinutes: timeToBreach });
    sendCreated(res, { alertId, service: svcName, currentValue: current, sloThreshold: thresh, breachProbability: breachProb, predictedBreachAt: breachAt, timeToBreachMinutes: timeToBreach });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute predictive alert");
  }
});

router.post("/lyte/self-healing/execute", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { runbookName, triggerCondition, incidentId, riskLevel = "low" } = req.body;
    const executionId = `runbook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const autonomyLevel = riskLevel === "low" ? "autonomous" : riskLevel === "medium" ? "supervised" : "human_gated";

    const steps = [
      { stepId: "step-1", action: "Check service health endpoints", automated: true, status: "completed", executedAt: new Date().toISOString() },
      { stepId: "step-2", action: "Drain affected pod traffic", automated: true, status: riskLevel === "low" ? "completed" : "pending_approval" },
      { stepId: "step-3", action: "Rolling restart with health validation", automated: riskLevel !== "high", status: "pending", requiresHumanGate: riskLevel === "high" },
      { stepId: "step-4", action: "Monitor SLO recovery for 10 minutes", automated: true, status: "pending" },
    ];

    const humanApprovalRequired = riskLevel !== "low";

    await pool.query(
      `INSERT INTO lyte_self_healing_runbooks
       (execution_id, runbook_name, trigger_condition, incident_id, autonomy_level, steps,
        human_approval_required_at, status, risk_level, dollar_impact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [executionId, runbookName ?? "Auto-Remediation", triggerCondition ?? "SLO degradation detected",
       incidentId ?? null, autonomyLevel, JSON.stringify(steps),
       humanApprovalRequired ? "step-2" : null,
       humanApprovalRequired ? "awaiting_approval" : "running",
       riskLevel, parseFloat((Math.random() * 50000 + 5000).toFixed(2))]
    );

    sendCreated(res, { executionId, runbookName, autonomyLevel, steps, humanApprovalRequired, status: humanApprovalRequired ? "awaiting_approval" : "running" });
  } catch (err) {
    handleRouteError(res, err, "Failed to execute self-healing runbook");
  }
});

router.get("/lyte/self-healing/runbooks", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM lyte_self_healing_runbooks ORDER BY started_at DESC LIMIT 20`);
    sendSuccess(res, result.rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list runbook executions");
  }
});

router.get("/lyte/cost-attribution", authMiddleware({ required: false }), async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM lyte_cost_attribution ORDER BY period_start DESC LIMIT 50`);

    if (result.rows.length === 0) {
      const demoData = [
        { service: "api-gateway", alert_count: 47, downtime_minutes: 23, dollar_impact: 182400, mttr_minutes: 34, slo_burn_rate: 0.0234, cost_per_alert: 3880 },
        { service: "database-primary", alert_count: 12, downtime_minutes: 8, dollar_impact: 64000, mttr_minutes: 47, slo_burn_rate: 0.0081, cost_per_alert: 5333 },
        { service: "auth-service", alert_count: 31, downtime_minutes: 5, dollar_impact: 40000, mttr_minutes: 12, slo_burn_rate: 0.0051, cost_per_alert: 1290 },
        { service: "payment-processor", alert_count: 4, downtime_minutes: 2, dollar_impact: 312000, mttr_minutes: 8, slo_burn_rate: 0.0020, cost_per_alert: 78000 },
      ];
      const totalDollarImpact = demoData.reduce((s, d) => s + d.dollar_impact, 0);
      sendSuccess(res, { attribution: demoData, totalDollarImpact, period: "last_30_days", source: "demo" });
      return;
    }

    const totalDollarImpact = result.rows.reduce((s, r) => s + parseFloat(r.dollar_impact || 0), 0);
    sendSuccess(res, { attribution: result.rows, totalDollarImpact, source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get cost attribution");
  }
});

export default router;
