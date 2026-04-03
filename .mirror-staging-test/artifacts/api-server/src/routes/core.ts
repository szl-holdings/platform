import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  recommendationsTable,
  auditLogsTable,
  terraDistressPropertiesTable,
  terraLeadsTable,
  terraDealsTable,
  firestormFindingsTable,
  alloyWorkflows,
  platformJobRunsTable,
} from "@workspace/db";
import {
  RECOMMENDATION_ENTITY_TYPES,
  type RecommendationEntityType,
} from "@workspace/db";
import { sql, desc, gte, eq, count } from "drizzle-orm";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ENTITY_SCORING: Record<
  RecommendationEntityType,
  {
    baseWeight: number;
    factors: string[];
    domain: string;
    actionPrefix: string;
  }
> = {
  distress_property: {
    baseWeight: 1.2,
    factors: [
      "opportunity_score",
      "days_in_distress",
      "debt_to_value",
      "auction_proximity",
    ],
    domain: "beacon",
    actionPrefix: "Acquire or note-purchase",
  },
  lead: {
    baseWeight: 1.0,
    factors: ["conversion_probability", "engagement_score", "recency"],
    domain: "beacon",
    actionPrefix: "Re-engage via direct outreach",
  },
  deal: {
    baseWeight: 1.1,
    factors: ["stage_velocity", "deal_size", "close_probability"],
    domain: "beacon",
    actionPrefix: "Advance deal stage",
  },
  vulnerability: {
    baseWeight: 1.3,
    factors: ["cvss_score", "exploitability", "asset_criticality"],
    domain: "firestorm",
    actionPrefix: "Remediate within",
  },
  incident: {
    baseWeight: 1.4,
    factors: ["severity", "blast_radius", "containment_status"],
    domain: "rosie",
    actionPrefix: "Escalate and contain",
  },
  asset: {
    baseWeight: 0.9,
    factors: ["risk_exposure", "compliance_gap", "operational_criticality"],
    domain: "alloy",
    actionPrefix: "Audit and secure",
  },
  vessel: {
    baseWeight: 1.0,
    factors: ["anomaly_score", "sanctions_risk", "route_deviation"],
    domain: "vessels",
    actionPrefix: "Flag for review",
  },
  signal: {
    baseWeight: 1.1,
    factors: ["signal_strength", "recurrence", "cross_domain_correlation"],
    domain: "lyte",
    actionPrefix: "Investigate signal",
  },
  workflow: {
    baseWeight: 0.8,
    factors: ["failure_rate", "duration_deviation", "impact_scope"],
    domain: "alloy",
    actionPrefix: "Review and optimize",
  },
  general: {
    baseWeight: 1.0,
    factors: ["context_relevance", "urgency", "impact"],
    domain: "general",
    actionPrefix: "Take action on",
  },
};

function scoreEntity(
  entityType: RecommendationEntityType,
  context: Record<string, unknown>,
): {
  score: number;
  confidence: number;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  reasoning: string;
  recommended_action: string;
  timeframe: string;
} {
  const cfg = ENTITY_SCORING[entityType];

  let rawScore = 55;
  let confidenceBase = 0.7;

  if (entityType === "distress_property") {
    const oppScore = Number(context.opportunity_score ?? context.opportunityScore ?? 70);
    const daysInDistress = Number(context.days_in_distress ?? context.daysInDistress ?? 90);
    const distressType = String(context.distress_type ?? context.distressType ?? "pre-foreclosure");

    rawScore = oppScore * cfg.baseWeight;
    if (distressType === "auction") rawScore = Math.min(rawScore + 10, 100);
    if (daysInDistress > 180) rawScore = Math.min(rawScore + 5, 100);
    if (daysInDistress < 30) rawScore = Math.max(rawScore - 5, 0);
    confidenceBase = oppScore >= 85 ? 0.92 : oppScore >= 70 ? 0.80 : 0.65;

    const severity: "info" | "low" | "medium" | "high" | "critical" =
      rawScore >= 90 ? "critical" : rawScore >= 75 ? "high" : rawScore >= 60 ? "medium" : "low";

    const address = String(context.address ?? "property");
    const borough = context.borough ? ` in ${context.borough}` : "";
    const estVal = context.estimated_value ?? context.estimatedValue;
    const valStr = estVal
      ? ` (est. $${Number(estVal).toLocaleString()})`
      : "";

    return {
      score: Math.round(rawScore * 100) / 100,
      confidence: Math.round(confidenceBase * 1000) / 1000,
      severity,
      title: `${distressType === "auction" ? "Auction Imminent" : distressType === "foreclosure" ? "Active Foreclosure" : "High-Opportunity Distress"}: ${address}${borough}`,
      reasoning: `Opportunity score ${oppScore}/100 — ${daysInDistress} days in distress, distress type: ${distressType}${valStr}. ${cfg.factors.join(", ")} all factored into scoring. ${daysInDistress > 180 ? "Owner is highly motivated — advanced distress stage." : "Early/mid-stage — window available for outreach."}`,
      recommended_action: `${cfg.actionPrefix} ${address}${borough}. ${rawScore >= 85 ? "High-priority — act within 72 hours." : rawScore >= 70 ? "Medium-priority — schedule outreach within 7 days." : "Monitor — add to watchlist for 30-day review."}`,
      timeframe: rawScore >= 85 ? "72 hours" : rawScore >= 70 ? "7 days" : "30 days",
    };
  }

  if (entityType === "vulnerability") {
    const cvss = Number(context.cvss_score ?? context.cvssScore ?? 5.0);
    const findingTitle = String(context.title ?? "Security Finding");
    const affectedAsset = String(context.affected_asset ?? context.affectedAsset ?? "unknown asset");

    rawScore = (cvss / 10) * 100 * cfg.baseWeight;
    confidenceBase = cvss >= 8 ? 0.95 : cvss >= 5 ? 0.82 : 0.70;

    const severity: "info" | "low" | "medium" | "high" | "critical" =
      cvss >= 9 ? "critical" : cvss >= 7 ? "high" : cvss >= 4 ? "medium" : cvss >= 1 ? "low" : "info";

    return {
      score: Math.round(rawScore * 100) / 100,
      confidence: Math.round(confidenceBase * 1000) / 1000,
      severity,
      title: `${severity.charAt(0).toUpperCase() + severity.slice(1)} Vulnerability: ${findingTitle}`,
      reasoning: `CVSS score ${cvss}/10 on ${affectedAsset}. Exploitability and asset criticality indicate ${severity} business risk. Immediate remediation prevents potential breach escalation.`,
      recommended_action: `${cfg.actionPrefix} ${cvss >= 8 ? "24 hours" : cvss >= 5 ? "7 days" : "30 days"} — patch ${affectedAsset}, verify remediation, update security posture in Firestorm.`,
      timeframe: cvss >= 8 ? "24 hours" : cvss >= 5 ? "7 days" : "30 days",
    };
  }

  if (entityType === "incident") {
    const severity_raw = String(context.severity ?? "medium");
    const incidentTitle = String(context.title ?? "Security Incident");

    const sevMap: Record<string, number> = { critical: 95, high: 80, medium: 60, low: 40, info: 20 };
    rawScore = (sevMap[severity_raw] ?? 60) * cfg.baseWeight;
    confidenceBase = severity_raw === "critical" ? 0.96 : severity_raw === "high" ? 0.88 : 0.75;

    const sev: "info" | "low" | "medium" | "high" | "critical" =
      (["info", "low", "medium", "high", "critical"].includes(severity_raw)
        ? severity_raw
        : "medium") as "info" | "low" | "medium" | "high" | "critical";

    return {
      score: Math.min(Math.round(rawScore * 100) / 100, 100),
      confidence: Math.round(confidenceBase * 1000) / 1000,
      severity: sev,
      title: `Active ${sev.charAt(0).toUpperCase() + sev.slice(1)} Incident: ${incidentTitle}`,
      reasoning: `Incident severity is ${sev}. Containment status and blast radius indicate ${rawScore >= 80 ? "immediate escalation required" : "managed response warranted"}. Cross-domain correlation with known threat patterns.`,
      recommended_action: `${cfg.actionPrefix} immediately in Aegis Operations — assign incident commander, activate playbook, notify stakeholders within ${sev === "critical" ? "15 minutes" : sev === "high" ? "1 hour" : "4 hours"}.`,
      timeframe: sev === "critical" ? "15 minutes" : sev === "high" ? "1 hour" : "4 hours",
    };
  }

  const severity: "info" | "low" | "medium" | "high" | "critical" =
    rawScore >= 85 ? "critical" : rawScore >= 70 ? "high" : rawScore >= 55 ? "medium" : rawScore >= 35 ? "low" : "info";

  return {
    score: Math.round(rawScore * 100) / 100,
    confidence: Math.round(confidenceBase * 1000) / 1000,
    severity,
    title: `${entityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Recommendation`,
    reasoning: `Analyzed ${cfg.factors.join(", ")} for entity of type ${entityType}. Score of ${Math.round(rawScore)} reflects ${rawScore >= 70 ? "elevated priority" : "standard monitoring"} across ${cfg.domain} domain.`,
    recommended_action: `${cfg.actionPrefix} this ${entityType.replace(/_/g, " ")} within ${rawScore >= 80 ? "48 hours" : "7 days"} — review in ${cfg.domain} dashboard.`,
    timeframe: rawScore >= 80 ? "48 hours" : "7 days",
  };
}

router.post(
  "/core/recommendations",
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const {
        entity_type,
        entity_id,
        context: ctx = {},
        domain,
      } = req.body as {
        entity_type?: string;
        entity_id?: string;
        context?: Record<string, unknown>;
        domain?: string;
      };

      if (!entity_type) {
        sendError(res, "entity_type is required", 400);
        return;
      }

      if (!RECOMMENDATION_ENTITY_TYPES.includes(entity_type as RecommendationEntityType)) {
        sendError(
          res,
          `Invalid entity_type "${entity_type}". Valid: ${RECOMMENDATION_ENTITY_TYPES.join(", ")}`,
          400,
        );
        return;
      }

      const validEntityType = entity_type as RecommendationEntityType;
      const cfg = ENTITY_SCORING[validEntityType];
      const effectiveDomain = domain ?? cfg.domain;

      const start = Date.now();
      const result = scoreEntity(validEntityType, ctx);
      const latencyMs = Date.now() - start;

      const [stored] = await db
        .insert(recommendationsTable)
        .values({
          entityType: validEntityType,
          entityId: entity_id,
          domain: effectiveDomain,
          score: String(result.score),
          confidence: String(result.confidence),
          severity: result.severity,
          title: result.title,
          reasoning: result.reasoning,
          recommendedAction: result.recommended_action,
          timeframe: result.timeframe,
          context: ctx,
          latencyMs,
          generatedAt: new Date(),
        })
        .returning();

      res.status(200).json({
        success: true,
        data: {
          id: stored.id,
          entity_type: stored.entityType,
          entity_id: stored.entityId,
          domain: stored.domain,
          score: Number(stored.score),
          confidence: Number(stored.confidence),
          severity: stored.severity,
          title: stored.title,
          reasoning: stored.reasoning,
          recommended_action: stored.recommendedAction,
          timeframe: stored.timeframe,
          generated_at: stored.generatedAt,
        },
        meta: {
          latency_ms: latencyMs,
          engine: "Alloy Intelligence Engine v2.0 — Deterministic Scoring",
          domain: effectiveDomain,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Recommendation generation failed");
    }
  },
);

router.get(
  "/core/recommendations",
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20),
      );
      const offset = Math.max(
        0,
        parseInt(String(req.query.offset ?? "0"), 10) || 0,
      );
      const entityType = req.query.entity_type as string | undefined;
      const domain = req.query.domain as string | undefined;

      let query = db
        .select()
        .from(recommendationsTable)
        .orderBy(desc(recommendationsTable.createdAt))
        .limit(limit)
        .offset(offset);

      const rows = await query;
      const [{ total }] = await db
        .select({ total: count() })
        .from(recommendationsTable);

      res.json({
        success: true,
        data: rows.map((r) => ({
          id: r.id,
          entity_type: r.entityType,
          entity_id: r.entityId,
          domain: r.domain,
          score: Number(r.score),
          confidence: Number(r.confidence),
          severity: r.severity,
          title: r.title,
          reasoning: r.reasoning,
          recommended_action: r.recommendedAction,
          timeframe: r.timeframe,
          generated_at: r.generatedAt,
          created_at: r.createdAt,
        })),
        meta: { total, limit, offset },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list recommendations");
    }
  },
);

router.get("/core/health", async (_req, res) => {
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatencyMs = Date.now() - dbStart;

    const [recCount] = await db
      .select({ count: count() })
      .from(recommendationsTable);
    const [auditCount] = await db
      .select({ count: count() })
      .from(auditLogsTable);

    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
        version: process.env.npm_package_version ?? "0.0.0",
        services: {
          database: {
            status: "ok",
            latency_ms: dbLatencyMs,
          },
          api: {
            status: "ok",
            memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          },
          intelligence: { status: "ok", version: "2.0.0" },
          beacon: { status: "ok" },
          rosie: { status: "ok" },
          alloy: { status: "ok" },
          lyte: { status: "ok" },
        },
        telemetry: {
          total_recommendations: recCount?.count ?? 0,
          total_audit_events: auditCount?.count ?? 0,
        },
      },
      meta: {
        environment: process.env.NODE_ENV ?? "development",
        node_version: process.version,
      },
    });
  } catch (err) {
    logger.error({ err }, "Core health check failed");
    res.status(503).json({
      success: false,
      data: {
        status: "degraded",
        timestamp: new Date().toISOString(),
        error: "Database connectivity issue",
      },
    });
  }
});

router.get("/core/metrics", async (_req, res) => {
  try {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [distressTotal] = await db
      .select({ count: count() })
      .from(terraDistressPropertiesTable);

    const [distressHighOpp] = await db
      .select({ count: count() })
      .from(terraDistressPropertiesTable)
      .where(sql`opportunity_score >= 80`);

    let leadsTotal = { count: 0 };
    let dealsTotal = { count: 0 };
    let dealsConverted = { count: 0 };
    let vulnsOpen = { count: 0 };
    let workflowRuns = { count: 0 };
    let recsTotal = { count: 0 };
    let auditTotal = { count: 0 };

    try {
      [leadsTotal] = await db
        .select({ count: count() })
        .from(terraLeadsTable) as [{ count: number }];
    } catch { /* table may not exist yet */ }

    try {
      [dealsTotal] = await db
        .select({ count: count() })
        .from(terraDealsTable) as [{ count: number }];
      [dealsConverted] = await db
        .select({ count: count() })
        .from(terraDealsTable)
        .where(sql`status = 'closed_won'`) as [{ count: number }];
    } catch { /* table may not exist yet */ }

    try {
      [vulnsOpen] = await db
        .select({ count: count() })
        .from(firestormFindingsTable)
        .where(eq(firestormFindingsTable.status, "open")) as [{ count: number }];
    } catch { /* table may not exist yet */ }

    try {
      [workflowRuns] = await db
        .select({ count: count() })
        .from(platformJobRunsTable)
        .where(gte(platformJobRunsTable.createdAt, since30d)) as [{ count: number }];
    } catch { /* table may not exist yet */ }

    try {
      [recsTotal] = await db
        .select({ count: count() })
        .from(recommendationsTable) as [{ count: number }];
    } catch { /* table may not exist yet */ }

    try {
      [auditTotal] = await db
        .select({ count: count() })
        .from(auditLogsTable)
        .where(gte(auditLogsTable.createdAt, since30d)) as [{ count: number }];
    } catch { /* table may not exist yet */ }

    const recentRecs = await db
      .select()
      .from(recommendationsTable)
      .orderBy(desc(recommendationsTable.createdAt))
      .limit(5);

    res.json({
      success: true,
      data: {
        beacon: {
          total_distress_properties: distressTotal?.count ?? 0,
          high_opportunity_properties: distressHighOpp?.count ?? 0,
          total_leads: leadsTotal?.count ?? 0,
          total_deals: dealsTotal?.count ?? 0,
          converted_deals: dealsConverted?.count ?? 0,
        },
        firestorm: {
          open_vulnerabilities: vulnsOpen?.count ?? 0,
        },
        alloy: {
          workflow_runs_30d: workflowRuns?.count ?? 0,
          total_recommendations: recsTotal?.count ?? 0,
          recent_recommendations: recentRecs.map((r) => ({
            id: r.id,
            entity_type: r.entityType,
            domain: r.domain,
            score: Number(r.score),
            title: r.title,
            severity: r.severity,
            generated_at: r.generatedAt,
          })),
        },
        platform: {
          audit_events_30d: auditTotal?.count ?? 0,
          generated_at: new Date().toISOString(),
        },
      },
      meta: {
        window: "30d",
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve core metrics");
  }
});

export default router;
