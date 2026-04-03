import { Router, type IRouter } from "express";
import { services } from "@szl-holdings/services";
import { APP_INTEGRATIONS } from "@szl-holdings/config";
import { integrationActivityLog, type IntegrationActivity } from "./admin.js";

function logActivity(entry: Omit<IntegrationActivity, "id" | "timestamp">) {
  integrationActivityLog.unshift({
    ...entry,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  });
  if (integrationActivityLog.length > 200) integrationActivityLog.length = 200;
}

const servicesRouter: IRouter = Router();

servicesRouter.get("/services/health", (_req, res) => {
  const matrix = services.getHealthMatrix();
  res.json(matrix);
});

servicesRouter.get("/services/health/app/:appSlug", (req, res) => {
  const appSlug = req.params["appSlug"]!;
  const mapping = APP_INTEGRATIONS[appSlug];
  if (!mapping) {
    res.status(404).json({ error: `No integration mapping found for app: ${appSlug}` });
    return;
  }
  const health = services.getAppHealthMatrix(mapping.connectors);
  res.json({
    app: appSlug,
    description: mapping.description,
    ...health,
  });
});

servicesRouter.post("/services/health/app/:appSlug/test", async (req, res) => {
  const appSlug = req.params["appSlug"]!;
  const mapping = APP_INTEGRATIONS[appSlug];
  if (!mapping) {
    res.status(404).json({ error: `No integration mapping found for app: ${appSlug}` });
    return;
  }
  const results = await Promise.all(
    mapping.connectors.map(async (connectorName) => {
      const result = await services.testConnection(connectorName);
      if (result) {
        logActivity({
          type: "health_check",
          connector: result.name,
          app: appSlug,
          status: result.success ? "success" : "error",
          message: result.message,
          responseTimeMs: result.responseTimeMs,
        });
      }
      return result;
    })
  );
  res.json({ app: appSlug, results: results.filter(Boolean) });
});

servicesRouter.post("/services/health/verify-all", async (_req, res) => {
  const appSlugs = Object.keys(APP_INTEGRATIONS);
  const results: Record<string, {
    app: string;
    connectors: Array<{
      name: string;
      success: boolean;
      status: string;
      fallbackMode: boolean;
      message: string;
      responseTimeMs: number;
    }>;
    allHealthy: boolean;
    fallbackCount: number;
    failedCount: number;
  }> = {};

  for (const slug of appSlugs) {
    const mapping = APP_INTEGRATIONS[slug]!;
    const connectorResults = await Promise.all(
      mapping.connectors.map(async (connectorName) => {
        const result = await services.testConnection(connectorName);
        if (result) {
          logActivity({
            type: "health_check",
            connector: result.name,
            app: slug,
            status: result.success ? "success" : "error",
            message: `E2E verification: ${result.message}`,
            responseTimeMs: result.responseTimeMs,
          });
          return {
            name: result.name,
            success: result.success,
            status: result.status,
            fallbackMode: result.status === "MOCKED_DEMO_MODE",
            message: result.message,
            responseTimeMs: result.responseTimeMs,
          };
        }
        return {
          name: connectorName,
          success: false,
          status: "UNKNOWN",
          fallbackMode: false,
          message: `Connector '${connectorName}' not found in registry`,
          responseTimeMs: 0,
        };
      })
    );

    results[slug] = {
      app: mapping.description,
      connectors: connectorResults,
      allHealthy: connectorResults.every((c) => c.success),
      fallbackCount: connectorResults.filter((c) => c.fallbackMode).length,
      failedCount: connectorResults.filter((c) => !c.success).length,
    };
  }

  const totalApps = appSlugs.length;
  const healthyApps = Object.values(results).filter((r) => r.allHealthy).length;
  const totalConnectors = Object.values(results).reduce((sum, r) => sum + r.connectors.length, 0);
  const totalFallbacks = Object.values(results).reduce((sum, r) => sum + r.fallbackCount, 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failedCount, 0);

  res.json({
    verifiedAt: new Date().toISOString(),
    summary: { totalApps, healthyApps, totalConnectors, totalFallbacks, totalFailed },
    apps: results,
  });
});

servicesRouter.get("/services/health/summary", (_req, res) => {
  const matrix = services.getHealthMatrix();
  res.json({
    unhealthyCount: matrix.services.filter((s) => s.status === "MANUAL_REQUIRED").length,
    demoCount: matrix.services.filter((s) => s.status === "MOCKED_DEMO_MODE").length,
    liveCount: matrix.summary.liveConfigured,
    total: matrix.summary.total,
    hasDemoMode: matrix.summary.mockedDemoMode > 0,
    hasUnhealthy: matrix.summary.manualRequired > 0,
  });
});

export default servicesRouter;
