import { Router, type IRouter } from "express";
import { services } from "@workspace/services";
import { MetricCollector, serverTelemetry, clientTelemetry } from "@workspace/observability";
import type { WebVitalsReport } from "@workspace/observability";
import { ALL_CONFIGS, getConfigBySlug } from "@workspace/observability/configs";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { db, platformJobRunsTable, artifactApprovalsTable } from "@workspace/db";
import { sql, eq, and, gt } from "drizzle-orm";

const router: IRouter = Router();

const collectors = new Map<string, MetricCollector>();

for (const config of ALL_CONFIGS) {
  collectors.set(config.appSlug, new MetricCollector(config));
}

function injectRealServiceHealth(collector: MetricCollector, connectors: string[]) {
  const healthMatrix = services.getAppHealthMatrix(connectors);
  const liveCount = healthMatrix.summary.liveConfigured;
  const total = healthMatrix.summary.total;
  const healthPct = total > 0 ? (liveCount / total) * 100 : 100;
  collector.record("integration_health_pct", healthPct);
  collector.record("live_integrations", liveCount);
  collector.record("unhealthy_integrations", healthMatrix.summary.manualRequired);
}

setInterval(() => {
  for (const [slug, collector] of collectors.entries()) {
    collector.simulateTick();

    const config = getConfigBySlug(slug);
    if (config?.connectors) {
      injectRealServiceHealth(collector, config.connectors);
    }
  }

  const telemetrySnapshot = serverTelemetry.getSnapshot();
  for (const collector of collectors.values()) {
    collector.record("api_p95_latency", telemetrySnapshot.p95Latency);
    collector.record("api_error_rate", telemetrySnapshot.errorRate * 100);
    collector.record("api_throughput", telemetrySnapshot.throughputPerHour);
  }
}, 10000);

function buildDataSources(isAuthenticated: boolean) {
  const sources: string[] = ["domain_simulation"];
  sources.push("server_telemetry");
  if (isAuthenticated) {
    sources.push("integration_health");
    sources.push("client_vitals");
  }
  return sources;
}

router.get("/observability/:appSlug", authMiddleware({ required: false }), (req, res) => {
  const appSlug = String(req.params.appSlug);
  const config = getConfigBySlug(appSlug);
  const collector = collectors.get(appSlug);

  if (!config || !collector) {
    res.status(404).json({ error: "App not found", availableApps: ALL_CONFIGS.map((c) => c.appSlug) });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=10, s-maxage=10");

  const snapshot = collector.getSnapshot();
  const isAuthenticated = !!req.user || process.env.NODE_ENV !== "production";

  const lensMetadata = config.domainLensLabels ? {
    postureScoreName: config.domainLensLabels.postureScoreName,
    topSignalLabel: config.domainLensLabels.topSignalLabel,
    velocityTrendLabel: config.domainLensLabels.velocityTrendLabel,
  } : null;

  const response: Record<string, unknown> = {
    appSlug,
    domain: config.domain,
    appName: config.appName,
    timestamp: new Date().toISOString(),
    lenses: snapshot.lenses,
    pillars: snapshot.pillars,
    overallScore: snapshot.overallScore,
    overallStatus: snapshot.overallStatus,
    postureScore: snapshot.postureScore,
    topSignal: snapshot.topSignal,
    velocityTrend: snapshot.velocityTrend,
    lensMetadata,
    metrics: snapshot.metrics,
    events: snapshot.events.slice(0, 20),
    dataSources: buildDataSources(isAuthenticated),
  };

  if (isAuthenticated) {
    const connectors = config.connectors || [];
    const healthMatrix = services.getAppHealthMatrix(connectors);
    response.integrations = {
      total: healthMatrix.summary.total,
      live: healthMatrix.summary.liveConfigured,
      demo: healthMatrix.summary.mockedDemoMode,
      unhealthy: healthMatrix.summary.manualRequired,
      services: healthMatrix.services.map((s) => ({
        name: s.name,
        status: s.status,
      })),
    };
    response.serverTelemetry = serverTelemetry.getSnapshot();
    response.clientVitals = clientTelemetry.getAggregatedVitals(appSlug);
  }

  res.json(response);
});

router.get("/observability", authMiddleware({ required: false }), (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=15, s-maxage=15");
  const isAuthenticated = !!req.user || process.env.NODE_ENV !== "production";

  const allApps = ALL_CONFIGS.map((config) => {
    const collector = collectors.get(config.appSlug)!;
    const snapshot = collector.getSnapshot();

    const appData: Record<string, unknown> = {
      appSlug: config.appSlug,
      appName: config.appName,
      domain: config.domain,
      overallScore: snapshot.overallScore,
      overallStatus: snapshot.overallStatus,
      lenses: snapshot.lenses,
      pillars: snapshot.pillars,
      postureScore: snapshot.postureScore,
      topSignal: snapshot.topSignal,
      velocityTrend: snapshot.velocityTrend,
      metrics: snapshot.metrics,
      events: snapshot.events.slice(0, 10),
    };

    if (isAuthenticated) {
      const connectors = config.connectors || [];
      const healthMatrix = services.getAppHealthMatrix(connectors);
      appData.integrationHealth = {
        live: healthMatrix.summary.liveConfigured,
        demo: healthMatrix.summary.mockedDemoMode,
        unhealthy: healthMatrix.summary.manualRequired,
      };
    }

    return appData;
  });

  const portfolioScore = Math.round(
    allApps.reduce((s, a) => s + (a.overallScore as number), 0) / allApps.length
  );

  const response: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    portfolioScore,
    portfolioStatus: portfolioScore >= 80 ? "healthy" : portfolioScore >= 50 ? "degraded" : "critical",
    apps: allApps,
    dataSources: buildDataSources(isAuthenticated),
  };

  if (isAuthenticated) {
    response.serverTelemetry = serverTelemetry.getSnapshot();
  }

  res.json(response);
});

router.post("/observability/vitals", (req, res) => {
  const body = req.body;
  if (!body || !body.appSlug) {
    res.status(400).json({ error: "appSlug is required" });
    return;
  }

  const report: WebVitalsReport = {
    appSlug: body.appSlug,
    lcp: typeof body.lcp === "number" ? body.lcp : undefined,
    fid: typeof body.fid === "number" ? body.fid : undefined,
    cls: typeof body.cls === "number" ? body.cls : undefined,
    fcp: typeof body.fcp === "number" ? body.fcp : undefined,
    ttfb: typeof body.ttfb === "number" ? body.ttfb : undefined,
    inp: typeof body.inp === "number" ? body.inp : undefined,
    timestamp: Date.now(),
    userAgent: req.headers["user-agent"],
    pathname: typeof body.pathname === "string" ? body.pathname : undefined,
  };

  clientTelemetry.recordVitals(report);

  serverTelemetry.recordBusinessEvent({
    type: "web_vitals_received",
    domain: body.appSlug,
    metadata: { pathname: report.pathname, lcp: report.lcp, cls: report.cls },
  });

  res.status(204).end();
});

router.post("/observability/client-errors", (req, res) => {
  const body = req.body;
  if (!body || !body.app) {
    res.status(400).json({ error: "app is required" });
    return;
  }

  serverTelemetry.recordBusinessEvent({
    type: "client_error",
    domain: body.app,
    metadata: {
      errorId: body.errorId,
      message: String(body.message || "").slice(0, 500),
      url: body.url,
      timestamp: body.timestamp,
    },
  });

  console.error(`[ClientError] ${body.app}: ${String(body.message || "").slice(0, 200)} (${body.errorId})`);
  res.status(204).end();
});

router.post("/observability/error-feedback", (req, res) => {
  const body = req.body;
  if (!body || !body.app) {
    res.status(400).json({ error: "app is required" });
    return;
  }

  serverTelemetry.recordBusinessEvent({
    type: "error_feedback",
    domain: body.app,
    metadata: {
      errorId: body.errorId,
      description: String(body.description || "").slice(0, 1000),
      url: body.url,
      timestamp: body.timestamp,
    },
  });

  console.info(`[ErrorFeedback] ${body.app}: ${String(body.description || "").slice(0, 200)} (${body.errorId})`);
  res.status(204).end();
});

router.get("/observability/alerts", authMiddleware(), requireRole("ops", "admin"), (req, res) => {
  const includeResolved = req.query["includeResolved"] === "true";
  const alerts = includeResolved
    ? serverTelemetry.getAllAlerts()
    : serverTelemetry.getActiveAlerts();
  res.setHeader("Cache-Control", "no-store");
  res.json({
    timestamp: new Date().toISOString(),
    activeCount: serverTelemetry.getActiveAlerts().length,
    alerts,
  });
});

router.post("/observability/alerts/:id/resolve", authMiddleware(), requireRole("ops"), (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Alert ID is required" });
    return;
  }
  serverTelemetry.resolveAlert(id);
  res.json({ success: true, id });
});

router.get("/observability/business-events", authMiddleware(), requireRole("ops", "admin"), (req, res) => {
  const snapshot = serverTelemetry.getSnapshot();
  res.setHeader("Cache-Control", "no-store");
  res.json({
    timestamp: new Date().toISOString(),
    windowMs: 300_000,
    eventCounts: snapshot.businessEvents,
    eventsByDomain: snapshot.eventsByDomain,
    jobFailures: snapshot.jobFailures,
    workflowCompletions: snapshot.workflowCompletions,
    authFailures: snapshot.authFailures,
    retryCount: snapshot.retryCount,
  });
});

router.get("/observability/telemetry/technical", authMiddleware(), requireRole("ops", "admin"), (_req, res) => {
  const snapshot = serverTelemetry.getSnapshot();
  res.setHeader("Cache-Control", "no-store");
  res.json({
    timestamp: new Date().toISOString(),
    requestLatency: {
      p50: snapshot.p50Latency,
      p95: snapshot.p95Latency,
      p99: snapshot.p99Latency,
      avg: snapshot.avgResponseTime,
    },
    endpointErrorRate: snapshot.errorRate,
    clientErrorRate: snapshot.clientErrorRate,
    requestCount: snapshot.requestCount,
    throughputPerHour: snapshot.throughputPerHour,
    jobDuration: {
      failures: snapshot.jobFailures,
      completions: snapshot.workflowCompletions,
    },
    workflowFailureRate: snapshot.workflowCompletions > 0
      ? snapshot.jobFailures / (snapshot.jobFailures + snapshot.workflowCompletions)
      : 0,
    retryCount: snapshot.retryCount,
    authFailures: snapshot.authFailures,
    uptimeSeconds: snapshot.uptimeSeconds,
    activeAlerts: snapshot.activeAlerts,
  });
});

router.get("/observability/telemetry/product", authMiddleware(), requireRole("ops", "admin"), async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [jobStats, approvalStats, recentJobs] = await Promise.all([
      db.select({
        workflowType: platformJobRunsTable.workflowType,
        status: platformJobRunsTable.status,
        count: sql<number>`COUNT(*)::int`,
        avgDurationMs: sql<number>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)::int`,
      })
        .from(platformJobRunsTable)
        .where(gt(platformJobRunsTable.createdAt, windowStart))
        .groupBy(platformJobRunsTable.workflowType, platformJobRunsTable.status),

      db.select({
        status: artifactApprovalsTable.status,
        count: sql<number>`COUNT(*)::int`,
        avgWaitMs: sql<number>`AVG(EXTRACT(EPOCH FROM (COALESCE(reviewed_at, NOW()) - requested_at)) * 1000)::int`,
      })
        .from(artifactApprovalsTable)
        .where(gt(artifactApprovalsTable.requestedAt, windowStart))
        .groupBy(artifactApprovalsTable.status),

      db.select({
        workflowType: platformJobRunsTable.workflowType,
        status: platformJobRunsTable.status,
        result: platformJobRunsTable.result,
        durationMs: sql<number>`EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000`,
      })
        .from(platformJobRunsTable)
        .where(and(
          gt(platformJobRunsTable.createdAt, windowStart),
          eq(platformJobRunsTable.status, "completed"),
        ))
        .orderBy(sql`created_at DESC`)
        .limit(100),
    ]);

    const byType = (type: string) => jobStats.filter(r => r.workflowType === type);
    const countForType = (type: string, status?: string) => {
      const rows = status ? byType(type).filter(r => r.status === status) : byType(type);
      return rows.reduce((s, r) => s + (r.count ?? 0), 0);
    };
    const avgDurationForType = (type: string) => {
      const rows = byType(type).filter(r => r.avgDurationMs != null);
      if (rows.length === 0) return null;
      return Math.round(rows.reduce((s, r) => s + (r.avgDurationMs ?? 0), 0) / rows.length);
    };

    const latestJobResult = (type: string) => {
      const match = recentJobs.find(r => r.workflowType === type);
      return (match?.result as Record<string, unknown>) ?? null;
    };

    const lyteResult = latestJobResult("lyte_digest");
    const readinessResult = latestJobResult("readiness_digest");

    const pendingApprovals = approvalStats.find(r => r.status === "pending")?.count ?? 0;
    const approvedApprovals = approvalStats.find(r => r.status === "approved")?.count ?? 0;
    const avgApprovalWaitMs = approvalStats.find(r => r.status === "approved")?.avgWaitMs ?? null;

    const jobRunCounts = {
      lyteDigest: { runs: countForType("lyte_digest"), avgDurationMs: avgDurationForType("lyte_digest") },
      readinessDigest: { runs: countForType("readiness_digest"), avgDurationMs: avgDurationForType("readiness_digest") },
      vesselEtaRefresh: { runs: countForType("vessel_eta_refresh"), avgDurationMs: avgDurationForType("vessel_eta_refresh") },
      routePressureScan: { runs: countForType("route_pressure_scan"), avgDurationMs: avgDurationForType("route_pressure_scan") },
      staleActionScan: { runs: countForType("stale_action_scan"), avgDurationMs: avgDurationForType("stale_action_scan") },
      artifactGeneration: { runs: countForType("artifact_generation"), avgDurationMs: avgDurationForType("artifact_generation") },
      featureFlagSync: { runs: countForType("feature_flag_sync"), avgDurationMs: avgDurationForType("feature_flag_sync") },
    };

    const totalFailed = jobStats.filter(r => r.status === "failed").reduce((s, r) => s + r.count, 0);
    const totalWarnings = jobStats.filter(r => r.status === "completed_with_warnings").reduce((s, r) => s + r.count, 0);
    const totalCompleted = jobStats.filter(r => r.status === "completed").reduce((s, r) => s + r.count, 0);

    res.json({
      timestamp: new Date().toISOString(),
      windowHours: 24,
      lyte: {
        unresolvedActionCount: typeof lyteResult?.["unresolvedActionCount"] === "number" ? lyteResult["unresolvedActionCount"] : null,
        criticalSignalCount: typeof lyteResult?.["criticalCount"] === "number" ? lyteResult["criticalCount"] : null,
        totalSignalCount: typeof lyteResult?.["signalCount"] === "number" ? lyteResult["signalCount"] : null,
      },
      readiness: {
        blockerCount: typeof readinessResult?.["blockerCount"] === "number" ? readinessResult["blockerCount"] : null,
        avgScore: typeof readinessResult?.["avgScore"] === "number" ? readinessResult["avgScore"] : null,
      },
      approvals: {
        pending: pendingApprovals,
        approved: approvedApprovals,
        avgApprovalWaitMs,
      },
      jobRuns: jobRunCounts,
      jobHealth: {
        totalFailed,
        totalWithWarnings: totalWarnings,
        totalCompleted,
        failureRate: (totalFailed + totalCompleted + totalWarnings) > 0
          ? totalFailed / (totalFailed + totalCompleted + totalWarnings)
          : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate product telemetry", details: String(err) });
  }
});

export default router;
