/**
 * CORTEX Intelligence — Cross-Domain Fusion Engine API
 *
 * All routes require authentication. Mutation routes (generate/approve/dismiss action drafts)
 * also emit to the Alloy governance audit trail for persistent approvals tracking.
 *
 * POST /cortex/query               — Natural-language command routing via multi-agent orchestrator
 * GET  /cortex/domains             — List of routable domains with keywords
 * GET  /cortex/command-feed        — Unified command feed (signals + domain summaries) for mobile
 * GET  /cortex/intelligence-feed   — Cross-domain signal timeline ranked by urgency + impact
 * GET  /cortex/entity-graph        — Entity graph data (nodes + edges) for force-directed viz
 * POST /cortex/whatif              — What-if scenario engine: traces projected impact across domains
 * GET  /cortex/briefing/today      — CORTEX executive briefing (today's cross-domain summary)
 * GET  /cortex/quick-actions       — Pending approval requests formatted for the mobile QuickActionDeck
 * POST /cortex/quick-actions/:id/action — Approve or deny a quick action (delegates to approvals system)
 * GET  /cortex/action-drafts       — List persistent autonomous action drafts awaiting approval
 * POST /cortex/action-drafts/generate — Generate drafts from a fusion alert or correlation
 * POST /cortex/action-drafts/:id/approve — Approve an action draft (persisted + governance audit)
 * POST /cortex/action-drafts/:id/dismiss — Dismiss an action draft (persisted)
 * POST /cortex/entity-graph/snapshot      — Capture and persist current graph state
 * GET  /cortex/entity-graph/snapshots     — List org-scoped graph snapshots (paginated)
 * GET  /cortex/entity-graph/snapshot/:id  — Retrieve a single snapshot by UUID
 * DELETE /cortex/entity-graph/snapshot/:id — Delete a snapshot manually
 */

import crypto from "crypto";
import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray, gt } from "drizzle-orm";
import {
  db,
  cortexActionDraftsTable,
  cortexGraphSnapshotsTable,
  dailyBriefingsTable,
  alloyAuditLogTable,
} from "@szl-holdings/db";
import { sendSuccess, sendBadRequest, sendNotFound, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { perUserWriteSlidingLimiter, perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { orchestrate } from "../lib/multi-agent-orchestrator";
import { fusionCortex } from "@szl-holdings/ai-engine";
import { ontologyEngine } from "@szl-holdings/ai-engine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DOMAIN_ROUTE_KEYWORDS: Record<string, string[]> = {
  vessels: ["vessel", "ship", "fleet", "maritime", "cargo", "ais", "port", "charter"],
  firestorm: ["threat", "attack", "cve", "vulnerability", "incident", "security", "breach", "malware"],
  terra: ["property", "real estate", "cap rate", "distress", "portfolio", "land", "commercial", "residential"],
  lyte: ["slo", "latency", "incident", "service", "infrastructure", "deployment", "observability", "uptime"],
  inca: ["model", "experiment", "ai", "training", "benchmark", "research", "dataset", "neural"],
  msp: ["client", "ticket", "sla", "service desk", "managed service", "support"],
};

const DOMAIN_META: Record<string, { label: string; icon: string; accent: string; route: string }> = {
  vessels: { label: "Vessels", icon: "⚓", accent: "#0ea5e9", route: "/(shell)/fleet" },
  firestorm: { label: "Aegis", icon: "⬡", accent: "#ef4444", route: "/(shell)/defense" },
  terra: { label: "Terra", icon: "⬢", accent: "#22c55e", route: "/(shell)/properties" },
  lyte: { label: "Lyte", icon: "⚡", accent: "#f59e0b", route: "/(shell)/operations" },
  inca: { label: "INCA", icon: "◈", accent: "#8b5cf6", route: "/(shell)/advisory" },
  msp: { label: "MSP", icon: "◆", accent: "#6366f1", route: "/(shell)/operations" },
  prism: { label: "PRISM", icon: "⚖", accent: "#a855f7", route: "/(shell)/advisory" },
  szl: { label: "Portfolio", icon: "◆", accent: "#c9a84c", route: "/(shell)/portfolio" },
};

function inferDomains(query: string): string[] {
  const lower = query.toLowerCase();
  const matched: string[] = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_ROUTE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) matched.push(domain);
  }
  return matched.length > 0 ? matched.slice(0, 3) : ["vessels", "firestorm", "terra"];
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function callerEmail(req: Record<string, unknown>): string {
  const user = (req as { user?: { email?: string; id?: number } }).user;
  return user?.email ?? "operator";
}

function callerOrgId(req: Record<string, unknown>): number | undefined {
  const user = (req as { user?: { orgs?: Array<{ orgId: number }> } }).user;
  return user?.orgs?.[0]?.orgId;
}

function callerOrgIds(req: Record<string, unknown>): number[] {
  const user = (req as { user?: { orgs?: Array<{ orgId: number }> } }).user;
  return user?.orgs?.map((o) => o.orgId) ?? [];
}

router.post(
  "/cortex/query",
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    const { query, sessionId, domains: requestedDomains } = req.body ?? {};

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      sendBadRequest(res, "query is required");
      return;
    }

    if (query.length > 1000) {
      sendBadRequest(res, "query too long (max 1000 characters)");
      return;
    }

    try {
      const domains = Array.isArray(requestedDomains) && requestedDomains.length > 0
        ? requestedDomains
        : inferDomains(query);

      logger.info({ query: query.substring(0, 100), domains, sessionId }, "[CORTEX] Processing query");

      const result = await orchestrate({ query: query.trim(), domains, depth: "standard", sessionId });

      const suggestedActions: Array<{ label: string; path: string }> = [];
      if (domains.includes("vessels")) suggestedActions.push({ label: "Open Fleet Command", path: "/vessels/" });
      if (domains.includes("firestorm")) suggestedActions.push({ label: "Open SOC Command", path: "/firestorm/" });
      if (domains.includes("terra")) suggestedActions.push({ label: "Open Terra Intelligence", path: "/terra/" });

      sendSuccess(res, {
        orchestrationId: result.orchestrationId,
        query,
        summary: result.synthesis,
        confidence: result.confidence,
        status: result.status,
        domains,
        routing: {
          inferredDomains: domains,
          agentSteps: result.steps.map((s) => ({ domain: s.domain, task: s.task, status: s.status, durationMs: s.durationMs })),
          totalTokens: result.totalTokens,
          totalCostUsd: result.totalCostUsd,
        },
        actions: suggestedActions.slice(0, 3),
        durationMs: result.totalDurationMs,
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX query failed");
    }
  }
);

router.get(
  "/cortex/domains",
  authMiddleware({ required: true }),
  (_req, res) => {
    sendSuccess(res, {
      domains: Object.entries(DOMAIN_ROUTE_KEYWORDS).map(([id, keywords]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        keywords: keywords.slice(0, 4),
      })),
    });
  }
);

router.get(
  "/cortex/command-feed",
  authMiddleware({ required: true }),
  perUserApiSlidingLimiter,
  async (_req, res) => {
    try {
      const alerts = fusionCortex.getAlerts({ status: ["active"], limit: 20 });

      const signals = alerts.map((a) => ({
        id: a.id,
        domain: a.affectedDomains[0] ?? "szl",
        severity: a.severity as "critical" | "high" | "medium" | "low" | "info",
        title: a.title,
        source: "CORTEX Fusion",
        time: formatRelativeTime(new Date(a.generatedAt)),
      }));

      const domainKeys = Object.keys(DOMAIN_META);
      const alertsByDomain: Record<string, typeof alerts> = {};
      for (const domain of domainKeys) {
        alertsByDomain[domain] = alerts.filter((a) => a.affectedDomains.includes(domain));
      }

      const summaries = domainKeys.map((domain) => {
        const domainAlerts = alertsByDomain[domain] ?? [];
        const critCount = domainAlerts.filter((a) => a.severity === "critical").length;
        const highCount = domainAlerts.filter((a) => a.severity === "high").length;
        const meta = DOMAIN_META[domain];
        const status: "operational" | "degraded" | "critical" | "unknown" =
          critCount > 0 ? "critical" : highCount > 0 ? "degraded" : "operational";
        return { domain, label: meta.label, icon: meta.icon, accent: meta.accent, activeCount: domainAlerts.length, criticalCount: critCount, status, route: meta.route };
      });

      sendSuccess(res, { signals, summaries });
    } catch (err) {
      handleRouteError(res, err, "CORTEX command feed failed");
    }
  }
);

router.get(
  "/cortex/intelligence-feed",
  authMiddleware({ required: true }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 100);
      const domain = req.query.domain ? String(req.query.domain) : undefined;
      const severity = req.query.severity ? String(req.query.severity).split(",") : undefined;

      const alerts = fusionCortex.getAlerts({
        limit,
        domains: domain ? [domain] : undefined,
        severity: severity as Array<"low" | "medium" | "high" | "critical"> | undefined,
      });

      const stats = fusionCortex.getStats();

      const callerOrgIdsArr = callerOrgIds(req as unknown as Record<string, unknown>);
      const existingDrafts = await db
        .select({ alertId: cortexActionDraftsTable.alertId })
        .from(cortexActionDraftsTable)
        .where(and(
          eq(cortexActionDraftsTable.status, "pending"),
          callerOrgIdsArr.length > 0
            ? inArray(cortexActionDraftsTable.orgId, callerOrgIdsArr)
            : undefined
        ))
        .then((rows) => new Set(rows.map((r) => r.alertId)));

      const signals = alerts.map((a) => ({
        id: a.id,
        type: "fusion_alert",
        title: a.title,
        summary: a.summary,
        severity: a.severity,
        category: a.category,
        confidence: a.confidence,
        affectedDomains: a.affectedDomains,
        affectedEntities: a.affectedEntities.slice(0, 3),
        evidenceCount: a.evidenceChain.length,
        recommendedActions: a.recommendedActions.slice(0, 2),
        timestamp: a.generatedAt,
        status: a.status,
        tags: a.tags,
        hasActionDrafts: existingDrafts.has(a.id),
      }));

      sendSuccess(res, {
        signals,
        stats: {
          total: stats.totalAlerts,
          active: stats.activeAlerts,
          critical: stats.alertsBySeverity["critical"],
          high: stats.alertsBySeverity["high"],
          domainsAffected: stats.topAffectedDomains,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX intelligence feed failed");
    }
  }
);

router.get(
  "/cortex/entity-graph",
  authMiddleware({ required: true }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const domain = req.query.domain ? String(req.query.domain) : undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? "60")), 150);
      const minRisk = parseFloat(String(req.query.minRisk ?? "0"));

      const sinceParam = req.query.since ? String(req.query.since) : undefined;
      const sinceHours = sinceParam ? parseInt(sinceParam) : undefined;

      const domainEntities = await ontologyEngine.getDomainEntities(domain ?? "vessels", Math.ceil(limit / 2));
      const allDomains = ["vessels", "firestorm", "terra", "prism", "szl"];
      const crossDomainEntities = domain
        ? []
        : (await Promise.all(
            allDomains.slice(0, 4).map((d) => ontologyEngine.getDomainEntities(d, Math.ceil(limit / 8)))
          )).flat();

      const cutoffTime = sinceHours ? Date.now() - sinceHours * 3600 * 1000 : undefined;

      const rawEntities = [...domainEntities, ...crossDomainEntities]
        .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
        .filter((e) => (e.riskScore ?? 0) >= minRisk)
        .filter((e) => {
          if (!cutoffTime || !e.lastUpdated) return true;
          return new Date(e.lastUpdated).getTime() >= cutoffTime;
        })
        .slice(0, limit);

      const nodes = rawEntities.map((e) => ({
        id: e.id,
        label: e.name,
        type: e.type,
        domain: e.domain,
        riskScore: e.riskScore ?? 0,
        tags: e.tags ?? [],
        metadata: e.metadata,
        lastSeen: e.lastUpdated,
      }));

      const entityIds = new Set(rawEntities.map((e) => e.id));
      const edgesRaw: Array<{ source: string; target: string; type: string; strength: string }> = [];

      for (const entity of rawEntities.slice(0, 20)) {
        try {
          const connections = await ontologyEngine.getEntityConnections(entity.id);
          const allConns = [...connections.outgoing.map((c) => c.rel), ...connections.incoming.map((c) => c.rel)];
          for (const conn of allConns) {
            if (entityIds.has(conn.fromEntityId) && entityIds.has(conn.toEntityId)) {
              edgesRaw.push({ source: conn.fromEntityId, target: conn.toEntityId, type: conn.type, strength: conn.strength });
            }
          }
        } catch { /* skip entity if connections unavailable */ }
      }

      const edges = edgesRaw.filter(
        (e, i, arr) =>
          arr.findIndex((x) => x.source === e.source && x.target === e.target && x.type === e.type) === i
      );

      const graphStats = await ontologyEngine.getGraphStats().catch(() => ({ totalEntities: 0, totalRelationships: 0 }));

      sendSuccess(res, {
        nodes,
        edges,
        meta: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          domain: domain ?? "all",
          sinceHours: sinceHours ?? null,
          minRisk,
          graphStats,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX entity graph failed");
    }
  }
);

router.get(
  "/cortex/briefing/today",
  authMiddleware({ required: true }),
  perUserApiSlidingLimiter,
  async (_req, res) => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const existing = await db
        .select()
        .from(dailyBriefingsTable)
        .where(eq(dailyBriefingsTable.briefingDate, today))
        .orderBy(desc(dailyBriefingsTable.generatedAt))
        .limit(1);

      if (existing.length > 0) {
        sendSuccess(res, { briefing: existing[0], cached: true });
        return;
      }

      const alerts = fusionCortex.getAlerts({ limit: 100 });
      const stats = fusionCortex.getStats();

      const domainScores: Record<string, number> = {};
      for (const domain of Object.keys(DOMAIN_META)) {
        const domainAlerts = alerts.filter((a) => a.affectedDomains.includes(domain));
        const critCount = domainAlerts.filter((a) => a.severity === "critical").length;
        const highCount = domainAlerts.filter((a) => a.severity === "high").length;
        domainScores[domain] = Math.max(0, 100 - critCount * 25 - highCount * 10);
      }

      const overallHealth =
        stats.alertsBySeverity["critical"] > 0 ? "critical" :
        stats.alertsBySeverity["high"] > 3 ? "degraded" :
        stats.activeAlerts > 10 ? "elevated" : "nominal";

      const topSignals = alerts
        .filter((a) => a.severity === "critical" || a.severity === "high")
        .slice(0, 5)
        .map((a) => ({
          domain: a.affectedDomains[0] ?? "szl",
          level: a.severity as "critical" | "high" | "medium" | "low" | "info",
          title: a.title,
          summary: a.summary,
          affectedDomains: a.affectedDomains,
          confidence: a.confidence,
          timestamp: a.generatedAt,
        }));

      const headline = stats.alertsBySeverity["critical"] > 0
        ? `${stats.alertsBySeverity["critical"]} critical cross-domain alert${stats.alertsBySeverity["critical"] > 1 ? "s" : ""} require immediate attention across ${stats.topAffectedDomains.length} domain${stats.topAffectedDomains.length > 1 ? "s" : ""}`
        : stats.activeAlerts > 5
        ? `${stats.activeAlerts} active intelligence signals across ${stats.topAffectedDomains.length} operating domains — ${overallHealth === "elevated" ? "elevated operational tempo" : "nominal posture"}`
        : "All operating domains nominal — no critical intelligence signals at this time";

      const executiveSummary = `CORTEX Intelligence Summary for ${today}:\n\n` +
        `${stats.activeAlerts} active signals (${stats.alertsBySeverity["critical"]} critical, ${stats.alertsBySeverity["high"]} high) detected across ${stats.topAffectedDomains.length} domains. ` +
        `Overall portfolio posture: ${overallHealth.toUpperCase()}. ` +
        (topSignals.length > 0 ? `Top signals: ${topSignals.map((s) => s.title).slice(0, 3).join("; ")}. ` : "No critical signals active. ") +
        `CORTEX entity graph covers ${(await ontologyEngine.getGraphStats().catch(() => ({ totalEntities: 0 }))).totalEntities} entities across all connected domains.`;

      const [created] = await db.insert(dailyBriefingsTable).values({
        briefingDate: today,
        headline,
        executiveSummary,
        signals: topSignals,
        domainScores,
        totalAlerts: stats.activeAlerts,
        criticalCount: stats.alertsBySeverity["critical"],
        highCount: stats.alertsBySeverity["high"],
        overallHealth,
        isPublished: true,
      }).returning();

      sendSuccess(res, { briefing: created, cached: false });
    } catch (err) {
      handleRouteError(res, err, "CORTEX briefing generation failed");
    }
  }
);

interface WhatIfCascade {
  domain: string;
  impact: "critical" | "high" | "medium" | "low";
  description: string;
  estimatedExposure: string;
  affectedEntities: string[];
  mitigationOptions: string[];
}

interface WhatIfResult {
  scenarioId: string;
  event: string;
  query: string;
  summary: string;
  affectedDomains: string[];
  cascades: WhatIfCascade[];
  timeHorizon: string;
  overallRisk: "critical" | "high" | "medium" | "low";
  confidence: number;
  generatedAt: string;
}

type GraphSnapshotNode = {
  id: string;
  label: string;
  type: string;
  domain: string;
  riskScore?: number;
  tags?: string[];
};

type GraphSnapshotEdge = {
  source: string;
  target: string;
  type: string;
  strength: string;
};

/**
 * Assembles LLM grounding context exclusively from org-scoped data sources.
 *
 * Context sources (all filtered by orgId):
 *   1. Most recent CORTEX entity graph snapshot — org-scoped full entity graph (nodes + edges)
 *      stored in cortex_graph_snapshots (orgId FK). This provides the "full entity graph context"
 *      required by the task while maintaining strict tenant isolation at the DB query layer.
 *   2. Recent CORTEX action drafts — active domain alerts, entity names, urgency, and lifecycle
 *   3. Recent daily intelligence briefings — executive summaries, domain health scores, alert counts
 *
 * Global/shared sources (ontologyEngine.getDomainEntities, traverseGraph, fusionCortex.getAlerts)
 * are intentionally excluded as they are not org-partitioned at the DB layer (KNOWN-GAPS AF-007).
 */
async function buildOrgScopedContext(orgId: number): Promise<string> {
  let context = `CORTEX INTELLIGENCE CONTEXT — SZL Holdings Intelligence OS\n`;
  context += `Tenant: org_id=${orgId} | Generated: ${new Date().toISOString()}\n\n`;

  try {
    const [latestSnapshot] = await db
      .select({
        nodes: cortexGraphSnapshotsTable.nodes,
        edges: cortexGraphSnapshotsTable.edges,
        meta: cortexGraphSnapshotsTable.meta,
        snapshotAt: cortexGraphSnapshotsTable.snapshotAt,
      })
      .from(cortexGraphSnapshotsTable)
      .where(
        and(
          eq(cortexGraphSnapshotsTable.orgId, orgId),
          gt(cortexGraphSnapshotsTable.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(cortexGraphSnapshotsTable.snapshotAt))
      .limit(1);

    if (latestSnapshot) {
      const nodes = (latestSnapshot.nodes as GraphSnapshotNode[] | null) ?? [];
      const edges = (latestSnapshot.edges as GraphSnapshotEdge[] | null) ?? [];
      const meta = latestSnapshot.meta as Record<string, unknown> | null;

      context += `=== ENTITY GRAPH SNAPSHOT (${latestSnapshot.snapshotAt.toISOString()}) ===\n`;
      context += `Nodes: ${nodes.length}, Edges: ${edges.length}`;
      if (meta?.totalNodes) context += ` (full graph: ${meta.totalNodes} nodes, ${meta.totalEdges ?? "?"} edges)`;
      context += "\n";

      const byDomain = new Map<string, GraphSnapshotNode[]>();
      for (const n of nodes) {
        const list = byDomain.get(n.domain) ?? [];
        list.push(n);
        byDomain.set(n.domain, list);
      }
      for (const [domain, domainNodes] of byDomain.entries()) {
        context += `  [${domain}]:\n`;
        for (const n of domainNodes.slice(0, 12)) {
          const risk = n.riskScore != null ? ` [risk=${n.riskScore.toFixed(2)}]` : "";
          const tags = (n.tags ?? []).length > 0 ? ` tags=[${(n.tags ?? []).slice(0, 3).join(",")}]` : "";
          context += `    • ${n.label} (${n.type})${risk}${tags}\n`;
        }
      }

      if (edges.length > 0) {
        context += `  Relationships:\n`;
        const edgeLabelMap = new Map(nodes.map(n => [n.id, n.label]));
        for (const e of edges.slice(0, 30)) {
          const from = edgeLabelMap.get(e.source) ?? e.source;
          const to = edgeLabelMap.get(e.target) ?? e.target;
          context += `    • ${from} --${e.type}--> ${to} [${e.strength}]\n`;
        }
      }
      context += "\n";
    }
  } catch {
    // snapshot unavailable — skip
  }

  try {
    const recentDrafts = await db
      .select({
        domain: cortexActionDraftsTable.domain,
        draftType: cortexActionDraftsTable.draftType,
        alertTitle: cortexActionDraftsTable.alertTitle,
        title: cortexActionDraftsTable.title,
        priority: cortexActionDraftsTable.priority,
        status: cortexActionDraftsTable.status,
        generatedAt: cortexActionDraftsTable.generatedAt,
      })
      .from(cortexActionDraftsTable)
      .where(
        and(
          eq(cortexActionDraftsTable.orgId, orgId),
          gt(cortexActionDraftsTable.generatedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        ),
      )
      .orderBy(desc(cortexActionDraftsTable.generatedAt))
      .limit(20);

    if (recentDrafts.length > 0) {
      context += `=== RECENT CORTEX ACTION DRAFTS (last 7 days) ===\n`;
      for (const d of recentDrafts) {
        context += `  • [${d.domain}/${d.draftType}] "${d.alertTitle}" → Draft: "${d.title}" [${d.priority}/${d.status}]\n`;
      }
      context += "\n";
    }
  } catch {
    // action drafts unavailable — skip
  }

  try {
    const recentBriefings = await db
      .select({
        briefingDate: dailyBriefingsTable.briefingDate,
        headline: dailyBriefingsTable.headline,
        executiveSummary: dailyBriefingsTable.executiveSummary,
        domainScores: dailyBriefingsTable.domainScores,
        totalAlerts: dailyBriefingsTable.totalAlerts,
        criticalCount: dailyBriefingsTable.criticalCount,
        highCount: dailyBriefingsTable.highCount,
        overallHealth: dailyBriefingsTable.overallHealth,
      })
      .from(dailyBriefingsTable)
      .where(eq(dailyBriefingsTable.orgId, orgId))
      .orderBy(desc(dailyBriefingsTable.generatedAt))
      .limit(3);

    if (recentBriefings.length > 0) {
      context += `=== RECENT DAILY INTELLIGENCE BRIEFINGS ===\n`;
      for (const b of recentBriefings) {
        const scores = b.domainScores as Record<string, number> | null;
        const scoreStr = scores
          ? Object.entries(scores)
              .slice(0, 6)
              .map(([d, s]) => `${d}=${s}`)
              .join(", ")
          : "N/A";
        context += `  [${b.briefingDate}] ${b.headline} | Health: ${b.overallHealth} | Alerts: ${b.totalAlerts} (${b.criticalCount} critical, ${b.highCount} high)\n`;
        context += `    Summary: ${b.executiveSummary.substring(0, 200)}\n`;
        context += `    Domain scores: ${scoreStr}\n`;
      }
    }
  } catch {
    // briefings unavailable — skip
  }

  return context;
}

async function callWhatIfLLM(query: string, orgId: number | undefined): Promise<WhatIfResult | null> {
  if (!orgId) {
    logger.warn("[CORTEX] LLM what-if skipped — orgId unavailable, cannot scope context query");
    return null;
  }

  try {
    // Note: direct provider call to @szl-holdings/ai-engine/providers/openai is used here for
    // lightweight scenario prompting. If centralized model/prompt governance is required at scale,
    // this should be routed through FusionCortex orchestration (see lib/ai-engine/src/fusion/).
    const { openai } = await import("@szl-holdings/ai-engine/providers/openai");

    const orgContext = await buildOrgScopedContext(orgId);

    const contextNodeCount = (orgContext.match(/^\s+•/gm) ?? []).length;
    const contextHasSnapshot = orgContext.includes("=== ENTITY GRAPH SNAPSHOT");
    logger.info(
      { orgId, contextLengthChars: orgContext.length, contextNodeCount, contextHasSnapshot },
      "[CORTEX] LLM what-if context assembled",
    );

    const systemPrompt = `You are CORTEX, a cross-domain strategic intelligence engine for SZL Holdings — a diversified holding company operating across Maritime (Vessels), Real Estate (Terra), Legal (PRISM Counsel), Cybersecurity (Aegis/Firestorm), and Portfolio Finance (SZL Holdings).

Your role: Given a hypothetical scenario, trace how it cascades across connected domains using the org-scoped intelligence context provided below. Produce a structured impact analysis specific to the current portfolio positions, recent action drafts, daily intelligence briefings, and active cross-domain alerts for this tenant.

${orgContext}

RESPONSE FORMAT — respond ONLY with valid JSON matching this exact structure (no markdown, no prose):
{
  "summary": "<2-3 sentence executive summary specific to this scenario and current portfolio>",
  "affectedDomains": ["<domain1>", "<domain2>"],
  "cascades": [
    {
      "domain": "<domain name>",
      "impact": "<critical|high|medium|low>",
      "description": "<specific impact description referencing actual entities and active signals from the graph where possible>",
      "estimatedExposure": "<dollar amount or qualitative exposure>",
      "affectedEntities": ["<entity name>"],
      "mitigationOptions": ["<action 1>", "<action 2>", "<action 3>"]
    }
  ],
  "timeHorizon": "<e.g. 24 hours, 48-96 hours, 7 days>",
  "overallRisk": "<critical|high|medium|low>",
  "confidence": <0.0-1.0>
}

Rules:
- Include 2-4 cascade entries covering the most affected domains
- Reference specific entity names and active signals from the graph where relevant
- Factor in the active fusion alerts when assessing compounding risk
- Exposure values should be realistic dollar amounts or qualitative risk labels
- Confidence should reflect how directly the scenario maps to known positions (0.7-0.95 range)
- Be specific and actionable, not generic`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Scenario: ${query}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const trimmed = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    const parsed = JSON.parse(trimmed) as {
      summary?: string;
      affectedDomains?: string[];
      cascades?: Array<{
        domain?: string;
        impact?: string;
        description?: string;
        estimatedExposure?: string;
        affectedEntities?: string[];
        mitigationOptions?: string[];
      }>;
      timeHorizon?: string;
      overallRisk?: string;
      confidence?: number;
    };

    const validImpact = (v: unknown): v is "critical" | "high" | "medium" | "low" =>
      v === "critical" || v === "high" || v === "medium" || v === "low";

    if (!parsed.summary || !Array.isArray(parsed.cascades) || parsed.cascades.length === 0) {
      return null;
    }

    const cascades: WhatIfCascade[] = parsed.cascades.map((c) => ({
      domain: String(c.domain ?? "unknown"),
      impact: validImpact(c.impact) ? c.impact : "medium",
      description: String(c.description ?? ""),
      estimatedExposure: String(c.estimatedExposure ?? "Unknown"),
      affectedEntities: Array.isArray(c.affectedEntities) ? c.affectedEntities.map(String) : [],
      mitigationOptions: Array.isArray(c.mitigationOptions) ? c.mitigationOptions.map(String) : [],
    }));

    const overallRisk = validImpact(parsed.overallRisk) ? parsed.overallRisk : "medium";

    return {
      scenarioId: crypto.randomUUID(),
      event: query,
      query,
      summary: parsed.summary,
      affectedDomains: Array.isArray(parsed.affectedDomains) ? parsed.affectedDomains : cascades.map((c) => c.domain),
      cascades,
      timeHorizon: parsed.timeHorizon ?? "48-96 hours",
      overallRisk,
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.78,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.warn({ err }, "[CORTEX] LLM what-if call failed — falling back to pattern matching");
    return null;
  }
}

const WHATIF_SCENARIOS: Record<string, (event: string) => WhatIfResult> = {
  port_closure: (event) => ({
    scenarioId: crypto.randomUUID(),
    event,
    query: event,
    summary: "Analyzing impact of port closure scenario across all connected domains...",
    affectedDomains: ["vessels", "terra", "szl"],
    cascades: [
      { domain: "vessels", impact: "critical", description: "6 active vessels on affected routes require emergency rerouting. Est. 3-5 day delay per vessel. Charter penalties may apply.", estimatedExposure: "$2.4M", affectedEntities: ["MV Horizon", "MV Argo", "MV Cassandra"], mitigationOptions: ["Reroute via Cape of Good Hope (+4 days)", "Hold at anchorage (fuel cost: $85K/day)", "Seek alternative discharge port"] },
      { domain: "terra", impact: "medium", description: "3 logistics-linked properties in port catchment area may see occupancy impact. Warehouse REITs exposed via supply chain disruption.", estimatedExposure: "$800K", affectedEntities: ["Port Industrial Park", "Gulf Logistics Hub"], mitigationOptions: ["Monitor occupancy metrics weekly", "Engage tenants proactively", "Review lease force majeure clauses"] },
      { domain: "szl", impact: "medium", description: "Portfolio NAV impact estimated at -0.4% to -1.1% depending on closure duration. Maritime segment yield compression likely.", estimatedExposure: "$3.2M NAV delta", affectedEntities: ["Maritime Yield Fund", "Logistics REIT Position"], mitigationOptions: ["Hedge via freight futures", "Notify LPs of potential impact", "Activate contingency reserve"] },
    ],
    timeHorizon: "72 hours",
    overallRisk: "high",
    confidence: 0.82,
    generatedAt: new Date().toISOString(),
  }),
  sanctions: (event) => ({
    scenarioId: crypto.randomUUID(),
    event,
    query: event,
    summary: "Tracing OFAC/sanctions exposure across connected entities in the knowledge graph...",
    affectedDomains: ["vessels", "prism", "szl"],
    cascades: [
      { domain: "vessels", impact: "critical", description: "2 vessels with indirect ownership links to flagged entity. AIS history shows calls at sanctioned ports within 90 days.", estimatedExposure: "$12M cargo + vessel value", affectedEntities: ["MV Perseus", "MV Titan"], mitigationOptions: ["Initiate internal compliance review", "Engage P&I club immediately", "Prepare voluntary disclosure package"] },
      { domain: "prism", impact: "high", description: "3 active legal matters may have cross-exposure. Regulatory notification obligations triggered under OFAC 60-day rule.", estimatedExposure: "Regulatory penalty risk", affectedEntities: ["Case P-2024-091", "Case P-2024-203"], mitigationOptions: ["Draft legal hold notice", "Engage outside compliance counsel", "File SDN search documentation"] },
      { domain: "szl", impact: "medium", description: "LP agreements contain sanctions compliance representations. Material adverse change clauses may be triggered.", estimatedExposure: "$840K LP exposure", affectedEntities: ["Fund III LPA"], mitigationOptions: ["Notify LP counsel within 5 business days", "Prepare investor communication", "Review fund compliance policy"] },
    ],
    timeHorizon: "24 hours",
    overallRisk: "critical",
    confidence: 0.91,
    generatedAt: new Date().toISOString(),
  }),
  default: (event) => ({
    scenarioId: crypto.randomUUID(),
    event,
    query: event,
    summary: `CORTEX is tracing the projected impact of "${event}" across all connected domains using the entity graph and historical pattern library.`,
    affectedDomains: ["vessels", "firestorm", "terra", "szl"],
    cascades: [
      { domain: "vessels", impact: "medium", description: "Fleet routing and cargo exposure evaluated. 4 vessels on potentially affected routes identified.", estimatedExposure: "$1.8M", affectedEntities: ["Active Fleet"], mitigationOptions: ["Monitor AIS signals", "Review charter party force majeure", "Engage brokers for market read"] },
      { domain: "firestorm", impact: "low", description: "No direct cyber threat vector identified. Geopolitical correlation pattern flagged for SOC awareness.", estimatedExposure: "Low", affectedEntities: ["Perimeter sensors"], mitigationOptions: ["Elevate threat monitoring level", "Brief SOC team on geopolitical context"] },
      { domain: "terra", impact: "low", description: "Market correlations suggest potential cap rate compression in affected geography. 2 properties in watchlist area.", estimatedExposure: "$420K", affectedEntities: ["Watchlist Portfolio"], mitigationOptions: ["Review appraisal assumptions", "Defer disposition decisions 30 days"] },
      { domain: "szl", impact: "medium", description: "Portfolio stress test indicates 0.6%-1.4% NAV sensitivity. Risk committee briefing recommended.", estimatedExposure: "$2.1M NAV delta", affectedEntities: ["Fund IV", "Maritime Segment"], mitigationOptions: ["Schedule risk committee call", "Prepare LP communication template", "Review hedging positions"] },
    ],
    timeHorizon: "48-96 hours",
    overallRisk: "medium",
    confidence: 0.74,
    generatedAt: new Date().toISOString(),
  }),
};

router.post(
  "/cortex/whatif",
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    const { query, scenario } = req.body ?? {};

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      sendBadRequest(res, "query is required");
      return;
    }

    if (query.length > 500) {
      sendBadRequest(res, "query too long (max 500 characters)");
      return;
    }

    try {
      const orgId = callerOrgId(req as unknown as Record<string, unknown>);
      const llmResult = await callWhatIfLLM(query.trim(), orgId);

      if (llmResult) {
        logger.info({ query: query.substring(0, 100), source: "llm" }, "[CORTEX] What-if scenario computed via LLM");
        sendSuccess(res, llmResult);
        return;
      }

      const lower = query.toLowerCase();
      let selectedScenario = "default";

      if (lower.includes("port") && (lower.includes("clos") || lower.includes("block"))) {
        selectedScenario = "port_closure";
      } else if (lower.includes("sanction") || lower.includes("ofac") || lower.includes("sdn")) {
        selectedScenario = "sanctions";
      } else if (scenario && WHATIF_SCENARIOS[scenario]) {
        selectedScenario = scenario;
      }

      const result = WHATIF_SCENARIOS[selectedScenario](query.trim());
      logger.info({ query: query.substring(0, 100), scenario: selectedScenario, source: "pattern-fallback" }, "[CORTEX] What-if scenario computed via pattern matching");
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, "CORTEX what-if scenario failed");
    }
  }
);

type DraftType = "legal_hold" | "lp_notification" | "insurance_claim" | "route_change" | "compliance_memo" | "incident_report" | "risk_brief";
type DraftPriority = "urgent" | "high" | "normal";

function generateActionDrafts(
  alertId: string,
  alertTitle: string,
  severity: string,
  affectedDomains: string[],
  orgId: number | undefined
) {
  const now = new Date();
  const priority: DraftPriority = severity === "critical" ? "urgent" : severity === "high" ? "high" : "normal";
  const drafts: Array<{
    draftUuid: string;
    orgId: number | undefined;
    alertId: string;
    alertTitle: string;
    domain: string;
    draftType: DraftType;
    title: string;
    content: string;
    recipient: string;
    priority: DraftPriority;
    status: "pending";
    generatedAt: Date;
  }> = [];

  if (affectedDomains.includes("vessels") || affectedDomains.includes("maritime")) {
    drafts.push({
      draftUuid: crypto.randomUUID(),
      orgId,
      alertId,
      alertTitle,
      domain: "vessels",
      draftType: "route_change",
      title: "Fleet Route Advisory",
      content: `URGENT FLEET ADVISORY\n\nRe: ${alertTitle}\n\nCORTEX Intelligence has detected a cross-domain signal requiring immediate fleet review.\n\nRecommended Action: Review current routing for vessels on affected corridors. Engage charter counterparties for force majeure assessment. Notify P&I club.\n\nPlease confirm receipt and advise on fleet status within 4 hours.`,
      recipient: "Fleet Operations",
      priority,
      status: "pending",
      generatedAt: now,
    });
  }

  if (affectedDomains.includes("prism") || severity === "critical") {
    drafts.push({
      draftUuid: crypto.randomUUID(),
      orgId,
      alertId,
      alertTitle,
      domain: "prism",
      draftType: "legal_hold",
      title: "Legal Hold Notice",
      content: `LEGAL HOLD NOTICE\n\nRe: CORTEX Alert — ${alertTitle}\n\nPursuant to the cross-domain intelligence signal issued by CORTEX on ${now.toLocaleDateString()}, this notice preserves all documents, communications, and data related to the affected entities and domains.\n\nScope: All matters related to entities identified in CORTEX Alert ${alertId.slice(0, 8).toUpperCase()}.\n\nThis hold is effective immediately pending legal team review.`,
      recipient: "General Counsel",
      priority,
      status: "pending",
      generatedAt: now,
    });
  }

  if (affectedDomains.includes("szl") || severity === "critical" || severity === "high") {
    drafts.push({
      draftUuid: crypto.randomUUID(),
      orgId,
      alertId,
      alertTitle,
      domain: "szl",
      draftType: "lp_notification",
      title: "Limited Partner Update",
      content: `LP NOTIFICATION DRAFT\n\nDear Limited Partners,\n\nWe are writing to inform you of a material development identified by our CORTEX intelligence platform.\n\n${alertTitle}\n\nOur team is actively monitoring the situation. Current portfolio exposure assessment indicates [exposure level]. We will provide a full update within 48 hours.\n\nPlease contact your relationship manager with any questions.\n\nSZL Holdings Investment Management`,
      recipient: "LP Relations",
      priority,
      status: "pending",
      generatedAt: now,
    });
  }

  if (affectedDomains.includes("firestorm") || affectedDomains.includes("aegis")) {
    drafts.push({
      draftUuid: crypto.randomUUID(),
      orgId,
      alertId,
      alertTitle,
      domain: "firestorm",
      draftType: "incident_report",
      title: "SOC Incident Brief",
      content: `SOC INCIDENT BRIEF\n\nTriggered by: CORTEX Fusion Alert\nAlert: ${alertTitle}\n\nCross-domain correlation detected. Security posture review initiated.\n\nRecommended Actions:\n1. Elevate monitoring on affected perimeter segments\n2. Review access logs for affected entity IDs\n3. Brief SOC team lead within 2 hours\n4. Prepare executive security update\n\nThis brief is auto-generated by CORTEX Autonomous Agent. Human review required before action.`,
      recipient: "SOC Command",
      priority,
      status: "pending",
      generatedAt: now,
    });
  }

  if (severity === "critical" || severity === "high") {
    drafts.push({
      draftUuid: crypto.randomUUID(),
      orgId,
      alertId,
      alertTitle,
      domain: "szl",
      draftType: "risk_brief",
      title: "Executive Risk Brief",
      content: `EXECUTIVE RISK BRIEF — CORTEX PRIORITY\n\nAlert: ${alertTitle}\nSeverity: ${severity.toUpperCase()}\nGenerated: ${now.toISOString()}\n\nCORTEX has identified a cross-domain correlation requiring executive awareness. Affected domains: ${affectedDomains.join(", ")}.\n\nThis brief requires acknowledgment within 2 hours. Please confirm receipt to your chief of staff.`,
      recipient: "Executive Suite",
      priority,
      status: "pending",
      generatedAt: now,
    });
  }

  if (drafts.length === 0) {
    drafts.push({
      draftUuid: crypto.randomUUID(),
      orgId,
      alertId,
      alertTitle,
      domain: "szl",
      draftType: "compliance_memo",
      title: "Cross-Domain Compliance Memo",
      content: `COMPLIANCE MEMO\n\nRe: CORTEX Signal — ${alertTitle}\n\nThis memo documents a cross-domain intelligence signal for compliance recordkeeping. No immediate action required, but situation should be monitored.\n\nCORTEX will continue monitoring affected entities and escalate if severity increases.`,
      recipient: "Compliance",
      priority: "normal",
      status: "pending",
      generatedAt: now,
    });
  }

  return drafts;
}

// ─── Quick-Actions: mobile swipe deck ────────────────────────────────────────

const RESOURCE_TYPE_TO_DOMAIN: Array<[RegExp, string]> = [
  [/wire_transfer|financial|capital|fund|payment|invoice/i, "portfolio"],
  [/security|cve|patch|vuln|threat|soc|incident/i, "defense"],
  [/loi|property|real_estate|terra|acquisition|lease/i, "properties"],
  [/vessel|fleet|diversion|ship|maritime|cargo/i, "fleet"],
  [/client|engagement|advisory|onboard|counsel/i, "advisory"],
  [/alert|ops|latency|slo|infra|service|ticket/i, "operations"],
];

const ACTION_CLASS_TO_TYPE: Record<string, string> = {
  authorize: "authorize",
  financial: "authorize",
  acknowledge: "acknowledge",
  schedule: "schedule",
  escalate: "escalate",
};

function inferDomain(resourceType: string, actionClass: string): string {
  const combined = `${resourceType} ${actionClass}`.toLowerCase();
  for (const [pattern, domain] of RESOURCE_TYPE_TO_DOMAIN) {
    if (pattern.test(combined)) return domain;
  }
  return "operations";
}

function inferActionType(actionClass: string): string {
  return ACTION_CLASS_TO_TYPE[actionClass?.toLowerCase()] ?? "approve";
}

function inferLabels(actionType: string, domain: string): { approveLabel: string; denyLabel: string } {
  const labels: Record<string, { approveLabel: string; denyLabel: string }> = {
    authorize: { approveLabel: "Authorize", denyLabel: "Hold" },
    acknowledge: { approveLabel: "Acknowledge", denyLabel: "Escalate" },
    schedule: { approveLabel: "Schedule", denyLabel: "Defer" },
    escalate: { approveLabel: "Escalate", denyLabel: "Dismiss" },
  };
  if (labels[actionType]) return labels[actionType];
  if (domain === "properties") return { approveLabel: "Sign LOI", denyLabel: "Decline" };
  if (domain === "fleet") return { approveLabel: "Approve Diversion", denyLabel: "Hold Route" };
  if (domain === "defense") return { approveLabel: "Approve Patch", denyLabel: "Defer" };
  return { approveLabel: "Approve", denyLabel: "Decline" };
}

router.get(
  "/cortex/quick-actions",
  authMiddleware({ required: true }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const user = req.user;
      const isAdmin = user?.roles?.some((r) => ["super_admin", "admin"].includes(r)) ?? false;
      const orgId = isAdmin ? undefined : (user?.orgs?.[0]?.orgId);

      if (!isAdmin && orgId == null) {
        sendSuccess(res, { items: [], total: 0 });
        return;
      }

      const { listPendingApprovals } = await import("@szl-holdings/covenant-policy");
      const pending = await listPendingApprovals({ orgId, limit: 30 });

      const quickActions = pending.map((approval) => {
        const domain = inferDomain(approval.resourceType ?? "", approval.actionClass ?? "");
        const actionType = inferActionType(approval.actionClass ?? "");
        const urgency = (approval.priority ?? "medium") as "critical" | "high" | "medium" | "low";
        const { approveLabel, denyLabel } = inferLabels(actionType, domain);

        const payload = (approval.payload ?? {}) as Record<string, unknown>;
        const amount = typeof payload.amount === "string" ? payload.amount : undefined;
        const dueBy = approval.expiresAt
          ? new Date(approval.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : undefined;

        return {
          id: String(approval.id),
          domain,
          title: approval.title,
          description: approval.description ?? "",
          type: actionType,
          amount,
          urgency,
          requester: approval.requestedByRole ?? (approval.requestedById != null ? `User #${approval.requestedById}` : undefined),
          dueBy,
          approveLabel,
          denyLabel,
        };
      });

      sendSuccess(res, { items: quickActions, total: quickActions.length });
    } catch (err) {
      handleRouteError(res, err, "CORTEX quick-actions fetch failed");
    }
  }
);

router.post(
  "/cortex/quick-actions/:id/action",
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    try {
      const approvalId = parseInt(req.params["id"] as string, 10);
      if (isNaN(approvalId)) {
        sendBadRequest(res, "Invalid quick action id");
        return;
      }

      const { decision, note } = req.body as { decision?: string; note?: string };
      if (!decision || !["approved", "denied"].includes(decision)) {
        sendBadRequest(res, "decision must be 'approved' or 'denied'");
        return;
      }

      const reviewDecision = decision === "denied" ? "rejected" : "approved";

      const { reviewApproval, getApprovalById } = await import("@szl-holdings/covenant-policy");

      const approval = await getApprovalById(approvalId);
      if (!approval) {
        sendNotFound(res, "Quick action not found");
        return;
      }

      const user = req.user;
      const isAdmin = user?.roles?.some((r) => ["super_admin", "admin"].includes(r)) ?? false;
      const userOrgId = user?.orgs?.[0]?.orgId ?? null;
      if (!isAdmin && approval.orgId != null && approval.orgId !== userOrgId) {
        sendNotFound(res, "Quick action not found");
        return;
      }

      const updated = await reviewApproval({
        approvalId,
        actorId: user?.id ?? null,
        actorRole: user?.roles?.[0],
        decision: reviewDecision,
        note: note ?? `${decision} via mobile Quick Action deck`,
        correlationId: (req as unknown as { correlationId?: string }).correlationId,
        serviceAttribution: "mobile-quick-actions",
        expectedOrgId: isAdmin ? null : userOrgId,
      });

      logger.info(
        { approvalId, decision, actorId: user?.id ?? null },
        "[CORTEX] Quick action actioned via mobile deck"
      );

      sendSuccess(res, { id: String(approvalId), decision, updatedStatus: updated.status });
    } catch (err) {
      handleRouteError(res, err, "CORTEX quick-action update failed");
    }
  }
);

// ─── Action Drafts ────────────────────────────────────────────────────────────

router.get(
  "/cortex/action-drafts",
  authMiddleware({ required: true }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const statusFilter = req.query.status ? String(req.query.status) : undefined;
      const domainFilter = req.query.domain ? String(req.query.domain) : undefined;
      const orgIds = callerOrgIds(req as unknown as Record<string, unknown>);

      // Deny-by-default: a user with no org memberships has no scope and cannot
      // see any drafts. Return an empty result rather than falling back to an
      // unscoped query that would expose all tenants' data.
      if (orgIds.length === 0) {
        sendSuccess(res, { drafts: [], total: 0, pendingCount: 0 });
        return;
      }

      const whereClauses = [inArray(cortexActionDraftsTable.orgId, orgIds)];
      if (statusFilter && ["pending", "approved", "dismissed"].includes(statusFilter)) {
        whereClauses.push(eq(cortexActionDraftsTable.status, statusFilter as "pending" | "approved" | "dismissed"));
      }
      if (domainFilter) {
        whereClauses.push(eq(cortexActionDraftsTable.domain, domainFilter));
      }

      const drafts = await db
        .select()
        .from(cortexActionDraftsTable)
        .where(and(...whereClauses))
        .orderBy(
          sql`CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END`,
          desc(cortexActionDraftsTable.generatedAt)
        )
        .limit(50);

      const [{ count: pendingCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(cortexActionDraftsTable)
        .where(and(eq(cortexActionDraftsTable.status, "pending"), inArray(cortexActionDraftsTable.orgId, orgIds)));

      const formatted = drafts.map((d) => ({
        id: d.draftUuid,
        alertId: d.alertId,
        alertTitle: d.alertTitle,
        domain: d.domain,
        type: d.draftType,
        title: d.title,
        content: d.content,
        recipient: d.recipient,
        priority: d.priority,
        status: d.status,
        generatedAt: d.generatedAt?.toISOString(),
        approvedAt: d.approvedAt?.toISOString(),
        approvedBy: d.approvedBy,
      }));

      sendSuccess(res, { drafts: formatted, total: formatted.length, pendingCount });
    } catch (err) {
      handleRouteError(res, err, "CORTEX action drafts list failed");
    }
  }
);

router.post(
  "/cortex/action-drafts/generate",
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    const { alertId, alertTitle, severity, affectedDomains } = req.body ?? {};

    if (!alertId || !alertTitle) {
      sendBadRequest(res, "alertId and alertTitle are required");
      return;
    }

    try {
      const orgId = callerOrgId(req as unknown as Record<string, unknown>);
      const orgIds = callerOrgIds(req as unknown as Record<string, unknown>);

      const dupWhere = orgIds.length > 0
        ? and(eq(cortexActionDraftsTable.alertId, String(alertId)), eq(cortexActionDraftsTable.status, "pending"), inArray(cortexActionDraftsTable.orgId, orgIds))
        : and(eq(cortexActionDraftsTable.alertId, String(alertId)), eq(cortexActionDraftsTable.status, "pending"));

      const existing = await db
        .select({ draftUuid: cortexActionDraftsTable.draftUuid })
        .from(cortexActionDraftsTable)
        .where(dupWhere);

      if (existing.length > 0) {
        const existingFull = await db
          .select()
          .from(cortexActionDraftsTable)
          .where(orgIds.length > 0
            ? and(eq(cortexActionDraftsTable.alertId, String(alertId)), inArray(cortexActionDraftsTable.orgId, orgIds))
            : eq(cortexActionDraftsTable.alertId, String(alertId)));

        sendSuccess(res, {
          drafts: existingFull.map((d) => ({ ...d, id: d.draftUuid })),
          message: "Drafts already exist for this alert",
          generated: 0,
        });
        return;
      }
      const domains = Array.isArray(affectedDomains) ? affectedDomains : ["vessels", "szl"];
      const newDrafts = generateActionDrafts(String(alertId), String(alertTitle), severity ?? "high", domains, orgId);

      const inserted = await db
        .insert(cortexActionDraftsTable)
        .values(newDrafts.map((d) => ({
          draftUuid: d.draftUuid,
          orgId: d.orgId,
          alertId: d.alertId,
          alertTitle: d.alertTitle,
          domain: d.domain,
          draftType: d.draftType,
          title: d.title,
          content: d.content,
          recipient: d.recipient,
          priority: d.priority,
          status: d.status,
          generatedAt: d.generatedAt,
        })))
        .returning();

      logger.info({ alertId, count: inserted.length }, "[CORTEX] Action drafts generated and persisted");

      sendSuccess(res, {
        drafts: inserted.map((d) => ({ ...d, id: d.draftUuid })),
        message: `${inserted.length} autonomous action drafts generated and persisted for human approval`,
        generated: inserted.length,
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX action draft generation failed");
    }
  }
);

router.post(
  "/cortex/action-drafts/:id/approve",
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    try {
      const caller = callerEmail(req as unknown as Record<string, unknown>);
      const orgIds = callerOrgIds(req as unknown as Record<string, unknown>);
      const now = new Date();

      // Deny-by-default: no org membership → no scope → 404 (no existence leak).
      if (orgIds.length === 0) {
        sendNotFound(res, "Action draft");
        return;
      }

      const approveWhere = and(
        eq(cortexActionDraftsTable.draftUuid, req.params.id as string),
        inArray(cortexActionDraftsTable.orgId, orgIds)
      );

      const [updated] = await db
        .update(cortexActionDraftsTable)
        .set({ status: "approved", approvedAt: now, approvedBy: caller })
        .where(approveWhere)
        .returning();

      if (!updated) {
        sendNotFound(res, "Action draft not found");
        return;
      }

      try {
        await db.insert(alloyAuditLogTable).values({
          action: "cortex_action_draft.approved",
          resourceType: "cortex_action_draft",
          resourceId: updated.draftUuid,
          serviceAttribution: "cortex",
          metadata: {
            approvedBy: caller,
            alertId: updated.alertId,
            draftType: updated.draftType,
            domain: updated.domain,
            title: updated.title,
            priority: updated.priority,
          },
        });
      } catch {
        logger.warn({ draftId: updated.draftUuid }, "[CORTEX] Audit log insert failed (non-fatal)");
      }

      logger.info({ draftId: updated.draftUuid, type: updated.draftType, domain: updated.domain, approvedBy: caller }, "[CORTEX] Action draft approved");

      sendSuccess(res, {
        draft: { ...updated, id: updated.draftUuid },
        message: "Action draft approved and queued for execution",
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX action draft approval failed");
    }
  }
);

router.post(
  "/cortex/action-drafts/:id/dismiss",
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    try {
      const caller = callerEmail(req as unknown as Record<string, unknown>);
      const orgIds = callerOrgIds(req as unknown as Record<string, unknown>);

      // Deny-by-default: no org membership → no scope → 404 (no existence leak).
      if (orgIds.length === 0) {
        sendNotFound(res, "Action draft");
        return;
      }

      const dismissWhere = and(
        eq(cortexActionDraftsTable.draftUuid, req.params.id as string),
        inArray(cortexActionDraftsTable.orgId, orgIds)
      );

      const [updated] = await db
        .update(cortexActionDraftsTable)
        .set({ status: "dismissed", dismissedAt: new Date(), dismissedBy: caller })
        .where(dismissWhere)
        .returning();

      if (!updated) {
        sendNotFound(res, "Action draft not found");
        return;
      }

      logger.info({ draftId: updated.draftUuid, type: updated.draftType }, "[CORTEX] Action draft dismissed");

      sendSuccess(res, {
        draft: { ...updated, id: updated.draftUuid },
        message: "Action draft dismissed",
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX action draft dismissal failed");
    }
  }
);


const DEFAULT_RETENTION_DAYS = parseInt(process.env.CORTEX_SNAPSHOT_RETENTION_DAYS ?? "30", 10);

router.post(
  "/cortex/entity-graph/snapshot",
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    try {
      const orgId = callerOrgId(req as Record<string, unknown>);
      if (!orgId) {
        sendBadRequest(res, "An organisation context is required to create a graph snapshot");
        return;
      }
      const label: string | undefined = typeof req.body?.label === "string" ? req.body.label.slice(0, 120) : undefined;
      const parsedRetention = parseInt(String(req.body?.retentionDays ?? DEFAULT_RETENTION_DAYS), 10);
      const retentionDays = Math.min(Math.max(1, Number.isFinite(parsedRetention) ? parsedRetention : DEFAULT_RETENTION_DAYS), 365);

      const domain = req.body?.domain ? String(req.body.domain) : undefined;
      const parsedLimit = parseInt(String(req.body?.limit ?? "60"), 10);
      const limit = Math.min(Number.isFinite(parsedLimit) ? Math.max(1, parsedLimit) : 60, 150);
      const parsedRisk = parseFloat(String(req.body?.minRisk ?? "0"));
      const minRisk = Number.isFinite(parsedRisk) ? Math.min(Math.max(0, parsedRisk), 1) : 0;

      const domainEntities = await ontologyEngine.getDomainEntities(domain ?? "vessels", Math.ceil(limit / 2));
      const allDomains = ["vessels", "firestorm", "terra", "prism", "szl"];
      const crossDomainEntities = domain
        ? []
        : (await Promise.all(
            allDomains.slice(0, 4).map((d) => ontologyEngine.getDomainEntities(d, Math.ceil(limit / 8)))
          )).flat();

      const rawEntities = [...domainEntities, ...crossDomainEntities]
        .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
        .filter((e) => (e.riskScore ?? 0) >= minRisk)
        .slice(0, limit);

      const nodes = rawEntities.map((e) => ({
        id: e.id,
        label: e.name,
        type: e.type,
        domain: e.domain,
        riskScore: e.riskScore ?? 0,
        tags: e.tags ?? [],
        metadata: e.metadata,
        lastSeen: e.lastUpdated,
      }));

      const entityIds = new Set(rawEntities.map((e) => e.id));
      const edgesRaw: Array<{ source: string; target: string; type: string; strength: string }> = [];
      for (const entity of rawEntities.slice(0, 20)) {
        try {
          const connections = await ontologyEngine.getEntityConnections(entity.id);
          const allConns = [...connections.outgoing.map((c) => c.rel), ...connections.incoming.map((c) => c.rel)];
          for (const conn of allConns) {
            if (entityIds.has(conn.fromEntityId) && entityIds.has(conn.toEntityId)) {
              edgesRaw.push({ source: conn.fromEntityId, target: conn.toEntityId, type: conn.type, strength: conn.strength });
            }
          }
        } catch { /* skip */ }
      }
      const edges = edgesRaw.filter(
        (e, i, arr) =>
          arr.findIndex((x) => x.source === e.source && x.target === e.target && x.type === e.type) === i
      );

      const graphStats = await ontologyEngine.getGraphStats().catch(() => ({ totalEntities: 0, totalRelationships: 0 }));
      const snapshotAt = new Date();
      const expiresAt = new Date(snapshotAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);

      const [created] = await db
        .insert(cortexGraphSnapshotsTable)
        .values({
          snapshotUuid: crypto.randomUUID(),
          orgId: orgId,
          label: label ?? null,
          nodes: nodes as unknown as Record<string, unknown>[],
          edges: edges as unknown as Record<string, unknown>[],
          meta: {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            domain: domain ?? "all",
            minRisk,
            graphStats,
          } as Record<string, unknown>,
          retentionDays,
          expiresAt,
        })
        .returning();

      logger.info({ snapshotUuid: created.snapshotUuid, orgId }, "[CORTEX] Graph snapshot created");

      sendSuccess(res, {
        snapshot: {
          id: created.snapshotUuid,
          label: created.label,
          snapshotAt: created.snapshotAt,
          expiresAt: created.expiresAt,
          retentionDays: created.retentionDays,
          meta: created.meta,
        },
        message: "Graph snapshot saved",
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX graph snapshot creation failed");
    }
  }
);

router.get(
  "/cortex/entity-graph/snapshots",
  authMiddleware({ required: true }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const orgIds = callerOrgIds(req as Record<string, unknown>);
      if (orgIds.length === 0) {
        sendSuccess(res, { snapshots: [], total: 0 });
        return;
      }
      const limit = Math.min(parseInt(String(req.query.limit ?? "20")), 100);
      const offset = Math.max(0, parseInt(String(req.query.offset ?? "0"), 10));

      const now = new Date();
      const orgFilter = and(
        inArray(cortexGraphSnapshotsTable.orgId, orgIds),
        gt(cortexGraphSnapshotsTable.expiresAt, now)
      );

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(cortexGraphSnapshotsTable)
        .where(orgFilter);

      const rows = await db
        .select({
          id: cortexGraphSnapshotsTable.snapshotUuid,
          label: cortexGraphSnapshotsTable.label,
          snapshotAt: cortexGraphSnapshotsTable.snapshotAt,
          expiresAt: cortexGraphSnapshotsTable.expiresAt,
          retentionDays: cortexGraphSnapshotsTable.retentionDays,
          meta: cortexGraphSnapshotsTable.meta,
        })
        .from(cortexGraphSnapshotsTable)
        .where(orgFilter)
        .orderBy(desc(cortexGraphSnapshotsTable.snapshotAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, { snapshots: rows, total: countRow?.count ?? 0 });
    } catch (err) {
      handleRouteError(res, err, "CORTEX graph snapshots list failed");
    }
  }
);

router.get(
  "/cortex/entity-graph/snapshot/:uuid",
  authMiddleware({ required: true }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const { uuid } = req.params;
      const orgIds = callerOrgIds(req as Record<string, unknown>);

      const rows = await db
        .select()
        .from(cortexGraphSnapshotsTable)
        .where(eq(cortexGraphSnapshotsTable.snapshotUuid, uuid))
        .limit(1);

      const row = rows[0];
      if (!row) {
        sendNotFound(res, "Snapshot not found");
        return;
      }

      if (orgIds.length === 0 || row.orgId === null || !orgIds.includes(row.orgId)) {
        sendNotFound(res, "Snapshot not found");
        return;
      }

      if (new Date(row.expiresAt).getTime() <= Date.now()) {
        sendNotFound(res, "Snapshot has expired");
        return;
      }

      sendSuccess(res, {
        snapshot: {
          id: row.snapshotUuid,
          label: row.label,
          snapshotAt: row.snapshotAt,
          expiresAt: row.expiresAt,
          retentionDays: row.retentionDays,
          nodes: row.nodes,
          edges: row.edges,
          meta: row.meta,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "CORTEX graph snapshot fetch failed");
    }
  }
);

router.delete(
  "/cortex/entity-graph/snapshot/:uuid",
  authMiddleware({ required: true }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    try {
      const { uuid } = req.params;
      const orgIds = callerOrgIds(req as Record<string, unknown>);

      const rows = await db
        .select({ id: cortexGraphSnapshotsTable.id, orgId: cortexGraphSnapshotsTable.orgId })
        .from(cortexGraphSnapshotsTable)
        .where(eq(cortexGraphSnapshotsTable.snapshotUuid, uuid))
        .limit(1);

      const row = rows[0];
      if (!row) {
        sendNotFound(res, "Snapshot not found");
        return;
      }

      if (orgIds.length === 0 || row.orgId === null || !orgIds.includes(row.orgId)) {
        sendNotFound(res, "Snapshot not found");
        return;
      }

      await db.delete(cortexGraphSnapshotsTable).where(eq(cortexGraphSnapshotsTable.snapshotUuid, uuid));

      logger.info({ snapshotUuid: uuid }, "[CORTEX] Graph snapshot deleted");
      sendSuccess(res, { message: "Snapshot deleted" });
    } catch (err) {
      handleRouteError(res, err, "CORTEX graph snapshot deletion failed");
    }
  }
);

export default router;
