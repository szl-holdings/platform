import { Router, type IRouter } from "express";
import { services } from "@workspace/services";
import { MetricCollector, serverTelemetry, clientTelemetry } from "@workspace/observability";
import type { WebVitalsReport } from "@workspace/observability";
import { ALL_CONFIGS, getConfigBySlug } from "@workspace/observability/configs";
import { authMiddleware } from "../middlewares/auth";

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

  const snapshot = collector.getSnapshot();
  const isAuthenticated = !!req.user || process.env.NODE_ENV !== "production";

  const response: Record<string, unknown> = {
    appSlug,
    domain: config.domain,
    appName: config.appName,
    timestamp: new Date().toISOString(),
    pillars: snapshot.pillars,
    overallScore: snapshot.overallScore,
    overallStatus: snapshot.overallStatus,
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
      pillars: snapshot.pillars,
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
  res.status(204).end();
});

export default router;
