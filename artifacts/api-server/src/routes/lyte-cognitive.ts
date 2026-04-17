import { Router, type IRouter } from "express";
import {
  db,
  lyteSignalsTable,
  lyteActionsTable,
  lyteReadinessItemsTable,
  lyteIncidentsTable,
  lyteEscalationsTable,
  lyteRecommendationsTable,
  lyteMetricsTable,
  lyteAlertsTable,
} from "@szl-holdings/db";
import { eq, desc, and, ne, lte, gte, or, sql } from "drizzle-orm";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { lyteAdapter } from "@szl-holdings/constellation";
import { rankSignalGroups, type SignalGroup } from "@szl-holdings/decision-engine";
import { estimateRiskAndApprovals, levelForRisk, type PlanStep, type ResolvedPlanContext } from "@workspace/planner";
import {
  SEVERITY_VAR,
  CATEGORY_DOMAIN,
  estimateVarFromSignal,
  parseTimeWindow,
  safeParseLimit,
  computeBottleneckUrgency,
  computeAccountabilityUrgency,
} from "./lyte-cognitive-helpers.js";

const router: IRouter = Router();

router.post("/lyte/cognitive/signal-fusion/run", authMiddleware(), async (req, res) => {
  try {
    const [signals, alerts, escalations, metrics] = await Promise.all([
      db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.receivedAt)).limit(200),
      db.select().from(lyteAlertsTable).where(eq(lyteAlertsTable.status, "firing")).limit(100),
      db.select().from(lyteEscalationsTable)
        .where(or(eq(lyteEscalationsTable.status, "open"), eq(lyteEscalationsTable.status, "in_progress")))
        .limit(50),
      db.select().from(lyteMetricsTable)
        .where(and(eq(lyteMetricsTable.anomaly, true), gte(lyteMetricsTable.recordedAt, new Date(Date.now() - 24 * 3600 * 1000))))
        .limit(50),
    ]);

    const fusedNodes: Array<{ id: string; entityType: string; name: string; source: string; domain: string }> = [];
    const errors: string[] = [];

    for (const sig of signals) {
      try {
        const node = await lyteAdapter.upsertEntity({
          domain: "lyte",
          entityType: "signal",
          name: sig.title,
          description: sig.body ?? undefined,
          provenance: { sourceId: String(sig.id), sourceType: "integration", sourceLabel: `lyte:${sig.sourceType}` },
          confidence: sig.severity === "critical" ? 1.0 : sig.severity === "high" ? 0.85 : 0.7,
          labels: [sig.severity, sig.status, sig.sourceType],
          extensions: { signalId: sig.id, severity: sig.severity, status: sig.status, source: sig.source },
        });
        fusedNodes.push({ id: node.id, entityType: "signal", name: sig.title, source: sig.source, domain: "lyte" });
      } catch (e) {
        errors.push(`signal:${sig.id}`);
      }
    }

    for (const alert of alerts) {
      try {
        const node = await lyteAdapter.upsertEntity({
          domain: "lyte",
          entityType: "signal",
          name: alert.name,
          description: alert.description ?? undefined,
          provenance: { sourceId: String(alert.id), sourceType: "integration", sourceLabel: `lyte:alert` },
          confidence: 0.9,
          labels: ["alert", alert.severity, alert.status],
          extensions: { alertId: alert.id, severity: alert.severity, service: alert.service },
        });
        fusedNodes.push({ id: node.id, entityType: "alert", name: alert.name, source: alert.service ?? "lyte", domain: "lyte" });
      } catch (e) {
        errors.push(`alert:${alert.id}`);
      }
    }

    for (const esc of escalations) {
      try {
        const node = await lyteAdapter.upsertEntity({
          domain: "lyte",
          entityType: "workflow",
          name: esc.title,
          description: esc.description ?? undefined,
          provenance: { sourceId: String(esc.id), sourceType: "system", sourceLabel: "lyte:escalation" },
          confidence: 0.95,
          labels: ["escalation", esc.severity, esc.status],
          extensions: { escalationId: esc.id, severity: esc.severity, assignedTo: esc.assignedTo },
        });
        fusedNodes.push({ id: node.id, entityType: "escalation", name: esc.title, source: "lyte:escalation", domain: "lyte" });
      } catch (e) {
        errors.push(`escalation:${esc.id}`);
      }
    }

    for (const metric of metrics) {
      try {
        const node = await lyteAdapter.upsertEntity({
          domain: "lyte",
          entityType: "metric",
          name: `${metric.name} [anomaly]`,
          description: metric.description ?? undefined,
          provenance: { sourceId: String(metric.id), sourceType: "system", sourceLabel: "lyte:metric-anomaly" },
          confidence: 0.75,
          labels: ["metric", "anomaly"],
          extensions: { metricId: metric.id, name: metric.name, value: metric.value },
        });
        fusedNodes.push({ id: node.id, entityType: "metric-anomaly", name: `${metric.name} [anomaly]`, source: "lyte:metric-anomaly", domain: "lyte" });
      } catch (e) {
        errors.push(`metric:${metric.id}`);
      }
    }

    const bySource: Record<string, number> = {};
    for (const n of fusedNodes) {
      bySource[n.source] = (bySource[n.source] ?? 0) + 1;
    }

    const bySeverityGroup: Record<string, number> = {};
    for (const s of signals) {
      bySeverityGroup[s.severity] = (bySeverityGroup[s.severity] ?? 0) + 1;
    }

    sendSuccess(res, {
      status: "completed",
      fusedCount: fusedNodes.length,
      errorCount: errors.length,
      bySource,
      bySeverity: bySeverityGroup,
      anomalyMetrics: metrics.length,
      constellationNodes: fusedNodes.slice(0, 20),
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Signal fusion run failed");
  }
});

router.get("/lyte/cognitive/signal-fusion", authMiddleware(), async (req, res) => {
  try {
    const [signals, alerts, escalations] = await Promise.all([
      db.select({
        id: lyteSignalsTable.id,
        source: lyteSignalsTable.source,
        sourceType: lyteSignalsTable.sourceType,
        severity: lyteSignalsTable.severity,
        title: lyteSignalsTable.title,
        status: lyteSignalsTable.status,
        receivedAt: lyteSignalsTable.receivedAt,
      }).from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.receivedAt)).limit(100),
      db.select({ id: lyteAlertsTable.id, name: lyteAlertsTable.name, service: lyteAlertsTable.service, severity: lyteAlertsTable.severity, status: lyteAlertsTable.status })
        .from(lyteAlertsTable).limit(50),
      db.select({ id: lyteEscalationsTable.id, title: lyteEscalationsTable.title, severity: lyteEscalationsTable.severity, status: lyteEscalationsTable.status })
        .from(lyteEscalationsTable).limit(50),
    ]);

    const bySource: Record<string, { count: number; severities: Record<string, number>; latestAt: string }> = {};
    for (const s of signals) {
      if (!bySource[s.source]) bySource[s.source] = { count: 0, severities: {}, latestAt: s.receivedAt.toISOString() };
      bySource[s.source].count++;
      bySource[s.source].severities[s.severity] = (bySource[s.source].severities[s.severity] ?? 0) + 1;
      if (s.receivedAt > new Date(bySource[s.source].latestAt)) bySource[s.source].latestAt = s.receivedAt.toISOString();
    }

    const bySeverity: Record<string, number> = {};
    for (const s of signals) bySeverity[s.severity] = (bySeverity[s.severity] ?? 0) + 1;

    const sourceDomains = [
      { type: "signals", count: signals.length, sources: [...new Set(signals.map(s => s.source))] },
      { type: "alerts", count: alerts.length, sources: [...new Set(alerts.map(a => a.service ?? "unknown"))] },
      { type: "escalations", count: escalations.length, sources: ["lyte:escalation"] },
    ];

    sendSuccess(res, {
      totalEvents: signals.length + alerts.length + escalations.length,
      sourceDomains,
      bySource,
      bySeverity,
      activeSignals: signals.filter(s => !["resolved", "dismissed"].includes(s.status)).length,
      firingAlerts: alerts.filter(a => a.status === "firing").length,
      openEscalations: escalations.filter(e => ["open", "in_progress"].includes(e.status)).length,
      recentSignals: signals.slice(0, 10),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get signal fusion state");
  }
});

router.get("/lyte/cognitive/bottlenecks", authMiddleware(), async (req, res) => {
  try {
    const now = new Date();
    const [blockedItems, stalledActions, openEscalations, criticalSignals] = await Promise.all([
      db.select().from(lyteReadinessItemsTable).where(eq(lyteReadinessItemsTable.status, "blocked")).limit(50),
      db.select().from(lyteActionsTable)
        .where(or(
          eq(lyteActionsTable.state, "escalated"),
          and(eq(lyteActionsTable.state, "new"), lte(lyteActionsTable.dueAt, now)),
          and(eq(lyteActionsTable.state, "assigned"), lte(lyteActionsTable.dueAt, now)),
        )).limit(50),
      db.select().from(lyteEscalationsTable)
        .where(or(eq(lyteEscalationsTable.status, "open"), eq(lyteEscalationsTable.status, "escalated")))
        .orderBy(desc(lyteEscalationsTable.createdAt)).limit(30),
      db.select().from(lyteSignalsTable)
        .where(and(eq(lyteSignalsTable.severity, "critical"), ne(lyteSignalsTable.status, "resolved")))
        .limit(20),
    ]);

    const ownerMap: Record<string, { bottlenecks: number; var: number; ageHours: number; items: string[]; escalationCount: number }> = {};

    for (const item of blockedItems) {
      const owner = item.owner ?? "Unassigned";
      if (!ownerMap[owner]) ownerMap[owner] = { bottlenecks: 0, var: 0, ageHours: 0, items: [], escalationCount: 0 };
      ownerMap[owner].bottlenecks++;
      const ageMs = now.getTime() - item.createdAt.getTime();
      ownerMap[owner].ageHours = Math.max(ownerMap[owner].ageHours, Math.floor(ageMs / 3600000));
      ownerMap[owner].items.push(`${item.title} [${item.itemType}]`);
    }

    for (const action of stalledActions) {
      const owner = action.owner ?? action.assignedTo ?? "Unassigned";
      if (!ownerMap[owner]) ownerMap[owner] = { bottlenecks: 0, var: 0, ageHours: 0, items: [], escalationCount: 0 };
      ownerMap[owner].bottlenecks++;
      ownerMap[owner].var += parseFloat(action.valueAtRisk ?? "0");
      if (action.dueAt) {
        const overdueHours = Math.floor((now.getTime() - action.dueAt.getTime()) / 3600000);
        ownerMap[owner].ageHours = Math.max(ownerMap[owner].ageHours, overdueHours);
      }
      ownerMap[owner].items.push(`${action.title} [${action.signalCategory}]`);
    }

    for (const esc of openEscalations) {
      const owner = esc.assignedTo ?? "Unassigned";
      if (!ownerMap[owner]) ownerMap[owner] = { bottlenecks: 0, var: 0, ageHours: 0, items: [], escalationCount: 0 };
      ownerMap[owner].escalationCount++;
    }

    const rankedBottlenecks = Object.entries(ownerMap)
      .map(([owner, data]) => {
        const { urgencyScore, level } = computeBottleneckUrgency(data);
        return { owner, ...data, urgencyScore, level };
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    const domainBottlenecks: Record<string, { count: number; var: number; level: string }> = {};
    for (const action of stalledActions) {
      const domain = CATEGORY_DOMAIN[action.signalCategory] ?? "operations";
      if (!domainBottlenecks[domain]) domainBottlenecks[domain] = { count: 0, var: 0, level: "low" };
      domainBottlenecks[domain].count++;
      domainBottlenecks[domain].var += parseFloat(action.valueAtRisk ?? "0");
    }
    for (const [domain, data] of Object.entries(domainBottlenecks)) {
      data.level = data.var > 500_000 ? "critical" : data.var > 100_000 ? "high" : data.var > 10_000 ? "medium" : "low";
    }

    sendSuccess(res, {
      totalBottlenecks: blockedItems.length + stalledActions.length,
      blockedItems: blockedItems.length,
      stalledActions: stalledActions.length,
      openEscalations: openEscalations.length,
      criticalSignals: criticalSignals.length,
      totalVaR: stalledActions.reduce((s, a) => s + parseFloat(a.valueAtRisk ?? "0"), 0),
      rankedByOwner: rankedBottlenecks.slice(0, 20),
      byDomain: domainBottlenecks,
      recentEscalations: openEscalations.slice(0, 5),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute bottleneck intelligence");
  }
});

router.get("/lyte/cognitive/interventions", authMiddleware(), async (req, res) => {
  try {
    const limit = safeParseLimit(req.query.limit, 20, 50);
    const [activeSignals, stalledActions, blockedItems, openEscalations] = await Promise.all([
      db.select().from(lyteSignalsTable)
        .where(and(ne(lyteSignalsTable.status, "resolved"), ne(lyteSignalsTable.status, "dismissed")))
        .orderBy(desc(lyteSignalsTable.receivedAt)).limit(100),
      db.select().from(lyteActionsTable)
        .where(ne(lyteActionsTable.state, "resolved")).orderBy(desc(lyteActionsTable.createdAt)).limit(50),
      db.select().from(lyteReadinessItemsTable)
        .where(or(eq(lyteReadinessItemsTable.status, "blocked"), eq(lyteReadinessItemsTable.status, "not_started")))
        .limit(30),
      db.select().from(lyteEscalationsTable)
        .where(or(eq(lyteEscalationsTable.status, "open"), eq(lyteEscalationsTable.status, "escalated")))
        .limit(20),
    ]);

    const signalsByCategory: Record<string, typeof activeSignals> = {};
    for (const s of activeSignals) {
      const cat = (s.metadata as Record<string, unknown> | null)?.category as string ?? s.sourceType;
      if (!signalsByCategory[cat]) signalsByCategory[cat] = [];
      signalsByCategory[cat].push(s);
    }

    const groups: SignalGroup[] = Object.entries(signalsByCategory).map(([cat, sigs]) => {
      const totalVar = sigs.reduce((sum, s) => sum + estimateVarFromSignal(s), 0);
      const criticalCount = sigs.filter(s => s.severity === "critical").length;
      const highCount = sigs.filter(s => s.severity === "high").length;
      const sources = [...new Set(sigs.map(s => s.source))];
      const domain = CATEGORY_DOMAIN[cat] ?? "operations";

      return {
        domain,
        signals: sigs.map(s => ({
          id: String(s.id),
          domain: "lyte",
          type: s.sourceType,
          value: s.severity,
          source: s.source,
          sourceId: String(s.id),
          timestamp: s.receivedAt.getTime(),
          metadata: (s.metadata as Record<string, unknown> | null) ?? undefined,
        })),
        businessImpact: {
          financialExposureUsd: totalVar,
          affectedEntities: sigs.length,
          reputationalRisk: criticalCount > 0 ? "high" : highCount > 0 ? "medium" : "low",
          regulatoryExposure: cat === "compliance" || cat === "audit",
          crossDomainBlastRadius: sources.slice(0, 3),
        },
        confidence: criticalCount > 0 ? 0.9 : highCount > 0 ? 0.8 : 0.65,
        suggestedAction: criticalCount > 0
          ? `Immediate escalation required for ${criticalCount} critical ${cat} signals`
          : `Review and resolve ${sigs.length} active ${cat} signals`,
        suggestedOwner: sigs[0] ? ((sigs[0].metadata as Record<string, unknown> | null)?.assignee as string ?? undefined) : undefined,
        estimatedCostUsd: totalVar * 0.15,
        evidence: [
          { label: "Signal Count", value: String(sigs.length), source: "lyte:signals" },
          { label: "Max Severity", value: criticalCount > 0 ? "critical" : highCount > 0 ? "high" : "medium", source: "lyte:signals" },
          { label: "Value at Risk", value: `$${(totalVar / 1000).toFixed(0)}K`, source: "lyte:actions" },
          ...sources.slice(0, 2).map(src => ({ label: "Source", value: src, source: "lyte:connector" })),
        ],
        customTitle: `${cat.replace(/_/g, " ")} — ${sigs.length} active signal${sigs.length > 1 ? "s" : ""}`,
        customSummary: `${sigs.length} ${cat} signal(s) from ${sources.join(", ")} with $${(totalVar / 1000).toFixed(0)}K value at risk.`,
      };
    });

    const ranked = rankSignalGroups(groups);

    const plannerContext: ResolvedPlanContext = {
      agentId: "lyte-cognitive",
      agentTier: "operator",
      approvalThreshold: "high",
      fallbackCount: 0,
      seeds: [],
      metadata: {},
    };

    const planSteps: PlanStep[] = ranked.map((rec, idx) => {
      const varValue = rec.businessImpact.financialExposureUsd ?? 0;
      const urgencyRisk = rec.urgency === "critical" ? 0.9 : rec.urgency === "urgent" ? 0.6 : rec.urgency === "moderate" ? 0.35 : 0.15;
      const varRisk = varValue >= 1_000_000 ? 0.3 : varValue >= 250_000 ? 0.2 : varValue >= 50_000 ? 0.1 : 0;
      const estimatedRisk = Math.min(urgencyRisk + varRisk, 1);
      return {
        stepId: rec.id,
        index: idx,
        title: rec.title,
        description: rec.summary,
        dependsOn: [],
        status: "pending" as const,
        route: {
          routeClass: "planning" as const,
          estimatedCostUsd: 0,
          selectedBy: "priority" as const,
          fallbackChain: [],
        },
        estimatedValue: Math.min(varValue / 1_000_000, 1),
        estimatedRisk,
        riskLevel: levelForRisk(estimatedRisk),
        requiredEvidence: (rec.evidence ?? []).map(e => e.label),
        requiredApproval: false,
        rollbackPoints: [],
        inputs: {},
        metadata: { interventionId: rec.id, domain: rec.domain },
      };
    });

    const assessedSteps = estimateRiskAndApprovals(planSteps, plannerContext);
    const stepAssessment = new Map(assessedSteps.map(s => [s.stepId, s]));

    const interventions = ranked.slice(0, limit).map(rec => {
      const assessment = stepAssessment.get(rec.id);
      return {
        ...rec,
        sourceSignalCount: rec.sourceSignals.length,
        valueAtRisk: rec.businessImpact.financialExposureUsd ?? 0,
        evidence: rec.evidence ?? [],
        createdAt: new Date(rec.createdAt).toISOString(),
        expiresAt: rec.expiresAt ? new Date(rec.expiresAt).toISOString() : undefined,
        plannerAssessment: assessment ? {
          riskLevel: assessment.riskLevel,
          requiredApproval: assessment.requiredApproval,
          approvalReason: assessment.approvalReason ?? null,
          rollbackPoints: assessment.rollbackPoints,
        } : null,
      };
    });

    const totalVaR = interventions.reduce((s, i) => s + i.valueAtRisk, 0);

    sendSuccess(res, {
      count: interventions.length,
      totalSignalsEvaluated: activeSignals.length,
      totalVaR,
      interventions,
      stalledActionsSummary: {
        total: stalledActions.length,
        byCategory: stalledActions.reduce<Record<string, number>>((a, act) => {
          a[act.signalCategory] = (a[act.signalCategory] ?? 0) + 1; return a;
        }, {}),
      },
      blockedItemsSummary: { total: blockedItems.length },
      escalationsSummary: { total: openEscalations.length },
      evaluatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to rank interventions");
  }
});

router.get("/lyte/cognitive/accountability-map", authMiddleware(), async (req, res) => {
  try {
    const [actions, readinessItems, escalations, incidents] = await Promise.all([
      db.select().from(lyteActionsTable).where(ne(lyteActionsTable.state, "resolved")).limit(100),
      db.select().from(lyteReadinessItemsTable)
        .where(or(eq(lyteReadinessItemsTable.status, "blocked"), eq(lyteReadinessItemsTable.status, "not_started"), eq(lyteReadinessItemsTable.status, "in_progress")))
        .limit(50),
      db.select().from(lyteEscalationsTable)
        .where(or(eq(lyteEscalationsTable.status, "open"), eq(lyteEscalationsTable.status, "escalated"), eq(lyteEscalationsTable.status, "in_progress")))
        .orderBy(desc(lyteEscalationsTable.createdAt)).limit(50),
      db.select().from(lyteIncidentsTable)
        .where(or(eq(lyteIncidentsTable.status, "open"), eq(lyteIncidentsTable.status, "investigating")))
        .limit(30),
    ]);

    const accountabilityMap: Record<string, {
      owner: string;
      ownerConfidence: "owned" | "contested" | "gap";
      bottlenecks: Array<{ id: number; title: string; type: string; var: number; severity?: string }>;
      interventions: Array<{ id: number; title: string; category: string; priority: string; state: string }>;
      incidents: Array<{ id: number; title: string; severity: string }>;
      escalationPath: Array<{ escalationId: number; title: string; severity: string; assignedTo: string | null }>;
      totalVaR: number;
      urgencyScore: number;
    }> = {};

    function ensureOwner(owner: string) {
      if (!accountabilityMap[owner]) {
        accountabilityMap[owner] = {
          owner,
          ownerConfidence: owner === "Unassigned" ? "gap" : "owned",
          bottlenecks: [],
          interventions: [],
          incidents: [],
          escalationPath: [],
          totalVaR: 0,
          urgencyScore: 0,
        };
      }
      return accountabilityMap[owner];
    }

    for (const item of readinessItems) {
      const owner = item.owner ?? "Unassigned";
      const entry = ensureOwner(owner);
      const varEst = item.itemType === "blocker" ? 100_000 : 25_000;
      entry.bottlenecks.push({ id: item.id, title: item.title, type: item.itemType, var: varEst });
      entry.totalVaR += varEst;
    }

    for (const action of actions) {
      const primaryOwner = action.owner ?? action.assignedTo ?? "Unassigned";
      const contested = action.owner && action.assignedTo && action.owner !== action.assignedTo;
      const entry = ensureOwner(primaryOwner);
      if (contested) entry.ownerConfidence = "contested";
      const varNum = parseFloat(action.valueAtRisk ?? "0");
      entry.interventions.push({
        id: action.id, title: action.title, category: action.signalCategory,
        priority: action.priority, state: action.state,
      });
      entry.totalVaR += varNum;
    }

    for (const inc of incidents) {
      const owner = inc.assignee ?? "Unassigned";
      const entry = ensureOwner(owner);
      entry.incidents.push({ id: inc.id, title: inc.title, severity: inc.severity });
    }

    for (const esc of escalations) {
      const targetOwner = esc.assignedTo ?? "Unassigned";
      const entry = ensureOwner(targetOwner);
      entry.escalationPath.push({
        escalationId: esc.id,
        title: esc.title,
        severity: esc.severity,
        assignedTo: esc.assignedTo ?? null,
      });
    }

    for (const entry of Object.values(accountabilityMap)) {
      entry.urgencyScore = computeAccountabilityUrgency({
        bottlenecks: entry.bottlenecks.length,
        urgentInterventions: entry.interventions.filter(i => i.priority === "urgent").length,
        criticalIncidents: entry.incidents.filter(i => i.severity === "critical").length,
        escalationCount: entry.escalationPath.length,
        totalVaR: entry.totalVaR,
      });
    }

    const sortedMap = Object.values(accountabilityMap)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    const unassignedCount = sortedMap.find(e => e.owner === "Unassigned");
    const ownershipGaps = unassignedCount
      ? {
          count: (unassignedCount.bottlenecks.length + unassignedCount.interventions.length),
          estimatedVaR: unassignedCount.totalVaR,
        }
      : { count: 0, estimatedVaR: 0 };

    sendSuccess(res, {
      ownerCount: sortedMap.filter(e => e.owner !== "Unassigned").length,
      ownershipGaps,
      totalVaRMapped: sortedMap.reduce((s, e) => s + e.totalVaR, 0),
      accountabilityMap: sortedMap,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build accountability map");
  }
});

router.get("/lyte/cognitive/value-at-risk", authMiddleware(), async (req, res) => {
  try {
    const periodDays = Math.min(Math.max(parseInt(String(req.query.days ?? "30"), 10) || 30, 1), 365);
    const cutoff = new Date(Date.now() - periodDays * 24 * 3600 * 1000);

    const [actions, signals, escalations] = await Promise.all([
      db.select().from(lyteActionsTable)
        .where(and(ne(lyteActionsTable.state, "resolved"), gte(lyteActionsTable.createdAt, cutoff)))
        .limit(200),
      db.select().from(lyteSignalsTable)
        .where(and(ne(lyteSignalsTable.status, "resolved"), gte(lyteSignalsTable.createdAt, cutoff)))
        .limit(200),
      db.select().from(lyteEscalationsTable)
        .where(and(or(eq(lyteEscalationsTable.status, "open"), eq(lyteEscalationsTable.status, "escalated")), gte(lyteEscalationsTable.createdAt, cutoff)))
        .limit(100),
    ]);

    const byDomain: Record<string, { var: number; count: number; items: number }> = {};
    const byOwner: Record<string, { var: number; count: number; overdue: number }> = {};

    for (const action of actions) {
      const domain = CATEGORY_DOMAIN[action.signalCategory] ?? "operations";
      const varNum = parseFloat(action.valueAtRisk ?? "0");
      if (!byDomain[domain]) byDomain[domain] = { var: 0, count: 0, items: 0 };
      byDomain[domain].var += varNum;
      byDomain[domain].count++;
      byDomain[domain].items++;

      const owner = action.owner ?? action.assignedTo ?? "Unassigned";
      if (!byOwner[owner]) byOwner[owner] = { var: 0, count: 0, overdue: 0 };
      byOwner[owner].var += varNum;
      byOwner[owner].count++;
      if (action.dueAt && action.dueAt < new Date()) byOwner[owner].overdue++;
    }

    for (const sig of signals) {
      const domain = "signals";
      const varNum = estimateVarFromSignal(sig);
      if (!byDomain[domain]) byDomain[domain] = { var: 0, count: 0, items: 0 };
      byDomain[domain].var += varNum;
      byDomain[domain].count++;
      byDomain[domain].items++;
    }

    const totalVaR = actions.reduce((s, a) => s + parseFloat(a.valueAtRisk ?? "0"), 0)
      + signals.reduce((s, sig) => s + estimateVarFromSignal(sig), 0);

    const totalSignalVaR = signals.reduce((s, sig) => {
      const v = estimateVarFromSignal(sig);
      return { critical: s.critical + (sig.severity === "critical" ? v : 0), high: s.high + (sig.severity === "high" ? v : 0), total: s.total + v };
    }, { critical: 0, high: 0, total: 0 });

    const topRisks = [...actions]
      .filter(a => parseFloat(a.valueAtRisk ?? "0") > 0)
      .sort((a, b) => parseFloat(b.valueAtRisk ?? "0") - parseFloat(a.valueAtRisk ?? "0"))
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        title: a.title,
        owner: a.owner ?? a.assignedTo ?? "Unassigned",
        domain: CATEGORY_DOMAIN[a.signalCategory] ?? "operations",
        var: parseFloat(a.valueAtRisk ?? "0"),
        priority: a.priority,
        state: a.state,
        category: a.signalCategory,
      }));

    sendSuccess(res, {
      periodDays,
      periodFrom: cutoff.toISOString(),
      periodTo: new Date().toISOString(),
      totalVaR: Math.round(totalVaR),
      actionVaR: Math.round(actions.reduce((s, a) => s + parseFloat(a.valueAtRisk ?? "0"), 0)),
      signalVaR: Math.round(totalSignalVaR.total),
      criticalExposure: Math.round(totalSignalVaR.critical),
      highExposure: Math.round(totalSignalVaR.high),
      byDomain,
      byOwner: Object.entries(byOwner)
        .map(([owner, data]) => ({ owner, ...data }))
        .sort((a, b) => b.var - a.var),
      topRisks,
      escalationCount: escalations.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute value-at-risk");
  }
});

router.get("/lyte/cognitive/executive-narrative", authMiddleware(), async (req, res) => {
  try {
    const { fromDate, toDate } = parseTimeWindow(
      req.query.from as string | undefined,
      req.query.to as string | undefined,
    );

    const [signals, actions, incidents, escalations, readinessItems] = await Promise.all([
      db.select().from(lyteSignalsTable)
        .where(and(gte(lyteSignalsTable.receivedAt, fromDate), lte(lyteSignalsTable.receivedAt, toDate)))
        .orderBy(desc(lyteSignalsTable.receivedAt)).limit(200),
      db.select().from(lyteActionsTable)
        .where(and(gte(lyteActionsTable.createdAt, fromDate), lte(lyteActionsTable.createdAt, toDate)))
        .orderBy(desc(lyteActionsTable.createdAt)).limit(100),
      db.select().from(lyteIncidentsTable)
        .where(and(gte(lyteIncidentsTable.createdAt, fromDate), lte(lyteIncidentsTable.createdAt, toDate)))
        .orderBy(desc(lyteIncidentsTable.createdAt)).limit(50),
      db.select().from(lyteEscalationsTable)
        .where(and(gte(lyteEscalationsTable.createdAt, fromDate), lte(lyteEscalationsTable.createdAt, toDate)))
        .orderBy(desc(lyteEscalationsTable.createdAt)).limit(50),
      db.select().from(lyteReadinessItemsTable)
        .where(and(gte(lyteReadinessItemsTable.createdAt, fromDate), lte(lyteReadinessItemsTable.createdAt, toDate)))
        .limit(50),
    ]);

    const activeSignals = signals.filter(s => !["resolved", "dismissed"].includes(s.status));
    const criticalSignals = activeSignals.filter(s => s.severity === "critical");
    const highSignals = activeSignals.filter(s => s.severity === "high");
    const openIncidents = incidents.filter(i => !["resolved", "closed"].includes(i.status));
    const pendingActions = actions.filter(a => !["resolved", "dismissed"].includes(a.state));
    const overdueActions = pendingActions.filter(a => a.dueAt && a.dueAt < new Date());
    const blockedItems = readinessItems.filter(r => r.status === "blocked");

    const totalVaR = actions.reduce((s, a) => s + parseFloat(a.valueAtRisk ?? "0"), 0)
      + activeSignals.reduce((s, sig) => s + estimateVarFromSignal(sig), 0);

    const citations: Array<{ ref: string; source: string; value: string; at: string }> = [];
    for (const cs of criticalSignals.slice(0, 3)) {
      citations.push({ ref: `SIG-${cs.id}`, source: cs.source, value: `Critical: ${cs.title}`, at: cs.receivedAt.toISOString() });
    }
    for (const inc of openIncidents.slice(0, 2)) {
      citations.push({ ref: `INC-${inc.id}`, source: "lyte:incidents", value: inc.title, at: inc.createdAt.toISOString() });
    }
    for (const esc of escalations.slice(0, 2)) {
      citations.push({ ref: `ESC-${esc.id}`, source: "lyte:escalations", value: esc.title, at: esc.createdAt.toISOString() });
    }

    const paragraphs: string[] = [];

    const windowLabel = `${fromDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${toDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const operationalStatus = criticalSignals.length > 3 || openIncidents.length > 2
      ? "elevated-risk"
      : criticalSignals.length > 0 || openIncidents.length > 0
      ? "monitoring"
      : "stable";

    if (criticalSignals.length > 0) {
      paragraphs.push(
        `During ${windowLabel}, Lyte detected ${criticalSignals.length} critical signal${criticalSignals.length > 1 ? "s" : ""} ` +
        `requiring immediate executive attention [${criticalSignals.slice(0, 3).map(s => `SIG-${s.id}`).join(", ")}]. ` +
        `These signals represent an estimated $${(totalVaR / 1_000_000).toFixed(2)}M in aggregate value at risk across ` +
        `${[...new Set(activeSignals.map(s => s.source))].length} operational sources.`
      );
    } else {
      paragraphs.push(
        `During ${windowLabel}, Lyte processed ${signals.length} total signal${signals.length !== 1 ? "s" : ""} ` +
        `with no critical escalations. The system operated within acceptable risk parameters.`
      );
    }

    if (openIncidents.length > 0) {
      paragraphs.push(
        `${openIncidents.length} incident${openIncidents.length > 1 ? "s remain" : " remains"} open as of this period, ` +
        `with ${openIncidents.filter(i => i.severity === "critical").length} at critical severity ` +
        `[${openIncidents.slice(0, 2).map(i => `INC-${i.id}`).join(", ")}]. ` +
        `Immediate investigation and resolution is recommended to prevent SLA breach.`
      );
    }

    if (overdueActions.length > 0) {
      const overdueVaR = overdueActions.reduce((s, a) => s + parseFloat(a.valueAtRisk ?? "0"), 0);
      paragraphs.push(
        `${overdueActions.length} action${overdueActions.length > 1 ? "s are" : " is"} past due, ` +
        `representing $${(overdueVaR / 1000).toFixed(0)}K in unresolved risk exposure. ` +
        `Operational cadence requires immediate remediation to avoid SLA breach.`
      );
    }

    if (blockedItems.length > 0) {
      paragraphs.push(
        `${blockedItems.length} readiness item${blockedItems.length > 1 ? "s are" : " is"} currently blocked, ` +
        `creating downstream dependency risks. ` +
        `Ownership review and blocker resolution are recommended as immediate priorities.`
      );
    }

    if (escalations.length > 0) {
      paragraphs.push(
        `${escalations.length} escalation${escalations.length > 1 ? "s were" : " was"} triggered during this period ` +
        `[${escalations.slice(0, 2).map(e => `ESC-${e.id}`).join(", ")}]. ` +
        `${escalations.filter(e => e.severity === "critical").length} carried critical severity, ` +
        `indicating systemic pressure on existing resolution workflows.`
      );
    }

    const recommendations: string[] = [];
    if (criticalSignals.length > 0) recommendations.push(`Immediately review and resolve ${criticalSignals.length} critical signal(s) — estimated $${(criticalSignals.reduce((s, sig) => s + estimateVarFromSignal(sig), 0) / 1000).toFixed(0)}K VaR.`);
    if (overdueActions.length > 0) recommendations.push(`Reassign or escalate ${overdueActions.length} overdue action(s) to prevent SLA breach.`);
    if (blockedItems.length > 0) recommendations.push(`Unblock ${blockedItems.length} readiness item(s) to restore delivery cadence.`);
    if (openIncidents.length > 0) recommendations.push(`Drive resolution of ${openIncidents.length} open incident(s) — target closure within 24h for critical severity.`);
    if (recommendations.length === 0) recommendations.push("Maintain current monitoring cadence. No critical actions required.");

    const byCategory: Record<string, number> = {};
    for (const a of actions) {
      byCategory[a.signalCategory] = (byCategory[a.signalCategory] ?? 0) + 1;
    }

    sendSuccess(res, {
      briefId: `LB-${Date.now()}`,
      window: { from: fromDate.toISOString(), to: toDate.toISOString(), label: windowLabel },
      operationalStatus,
      headline: {
        totalSignals: signals.length,
        activeSignals: activeSignals.length,
        criticalSignals: criticalSignals.length,
        openIncidents: openIncidents.length,
        pendingActions: pendingActions.length,
        overdueActions: overdueActions.length,
        escalations: escalations.length,
        totalVaR: Math.round(totalVaR),
        readinessBlockers: blockedItems.length,
      },
      narrative: paragraphs.join("\n\n"),
      paragraphs,
      recommendations,
      citations,
      categoryBreakdown: byCategory,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid from/to")) {
      sendBadRequest(res, err.message);
      return;
    }
    handleRouteError(res, err, "Failed to generate executive narrative");
  }
});

export default router;
