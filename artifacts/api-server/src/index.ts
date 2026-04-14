import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { failFastOnInvalidConfig } from "./lib/startup-validation";
import { initWebSocket } from "./lib/websocket";
import { jobQueue, startScheduledJobs } from "./lib/job-queue";
import { startNamedScheduledJobs } from "./lib/scheduled-jobs";
import "./lib/platform-jobs";
import { startPlatformScheduledJobs } from "./lib/platform-jobs";
import { ensurePlatformFlags } from "./lib/platform-flags";
import { startDomainNotificationGenerators, stopDomainNotificationGenerators } from "./lib/domain-notifications";
import { startSelfMonitoring, stopSelfMonitoring } from "./lib/self-monitor";
import { agentScheduler, registerDefaultSchedules } from "./lib/agent-scheduler";
import { knowledgeStore } from "./lib/knowledge-store";
import { ensureAlloyTables } from "./lib/alloy-migrations";
import { ensureAlloyGovernanceTables } from "./lib/alloy-governance-migrations";
import { ensurePlatformOpsTables } from "./lib/platform-ops-migrations";
import { ensureLyteDashboardsTable } from "./lib/lyte-dashboard-migrations";
import { ensureExportJobsTable } from "./lib/export-migrations";
import { ensureFeedbackTables } from "./lib/feedback-migrations";
import { ensureTerraActionItemsTable } from "./lib/terra-action-items-migration";
import { ensureTradecraftTables } from "./lib/tradecraft-migrations";
import { ensureOutcomeGraphTables } from "./lib/outcome-graph-migrations";
import { ensureCognitiveLearningTables } from "./lib/cognitive-learning-migrations";
import "./lib/terra-nyc-ingestion";
import { scheduleNycIngestionJob } from "./lib/terra-nyc-ingestion";
import "./lib/terra-nyc-extended-ingestion";
import { scheduleNycExtendedIngestionJob } from "./lib/terra-nyc-extended-ingestion";
import { seedPlatformData } from "./lib/seed-platform";
import { initializeOpenTelemetry } from "@szl-holdings/observability";
import { seedTerraDemo } from "./lib/terra-seed";
import { seedMspData } from "./lib/seed-msp";
import { seedDreamscapeData } from "./lib/seed-dreamscape";
import { seedDosData } from "./lib/seed-dos";
import { buildGraphQLMiddleware } from "./graphql/index.js";
import { registerGraphQLHandler } from "./app.js";
import { prewarmIntelligenceCache, scheduleIntelligenceRefresh } from "./routes/intelligence.js";
import { registerAllPrismJobHandlers } from "./services/prism-job-handlers";
import { startPrismJobPoller } from "./services/prism-queue";
import { registerGenAITelemetryBridge } from "./lib/genai-telemetry-bridge.js";
import "./lib/cross-app-notification-relay.js";
import { providerHealth } from "./lib/provider-health";

failFastOnInvalidConfig();

registerGenAITelemetryBridge();

initializeOpenTelemetry({
  serviceName: process.env.OTEL_SERVICE_NAME ?? "szl-api",
  serviceVersion: process.env.npm_package_version ?? "1.0.0",
  otlpEndpoint: process.env.OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  exportToAzureMonitor: !!process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING,
  exportToNewRelic: !!process.env.NEW_RELIC_LICENSE_KEY,
  exportToConsole: process.env.OTEL_CONSOLE_EXPORT === "true",
}).catch(err => {
  logger.warn({ err }, "OpenTelemetry initialization failed — continuing without OTel");
});

const HEAP_LIMIT_MB = 512;
const HEAP_CRITICAL_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.92);
const HEAP_WARN_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.82);
const HEAP_GC_THRESHOLD_MB = Math.round(HEAP_LIMIT_MB * 0.70);

export { app };

export async function bootstrap(server: http.Server, port: number): Promise<http.RequestListener> {
  buildGraphQLMiddleware(server)
    .then(middleware => {
      registerGraphQLHandler(middleware);
      logger.info("GraphQL endpoint mounted at /api/graphql");
      logger.info("GraphQL subscriptions available at wss://.../api/graphql/ws");
    })
    .catch(err => {
      logger.warn({ err }, "GraphQL initialization failed — continuing without GraphQL");
    });

  initWebSocket(server);
  startDomainNotificationGenerators();
  startSelfMonitoring();

  providerHealth.startActiveProbes();
  registerAllPrismJobHandlers();
  const prismPoller = startPrismJobPoller(5000);

  const memoryMonitor = setInterval(() => {
    const { heapUsed, heapTotal } = process.memoryUsage();
    const heapUsedMb = Math.round(heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(heapTotal / 1024 / 1024);
    if (heapUsedMb >= HEAP_CRITICAL_THRESHOLD_MB) {
      logger.error({
        heapUsedMb,
        heapTotalMb,
        limitMb: HEAP_LIMIT_MB,
      }, "[memory] Heap usage critical — forcing GC");
      if (global.gc) { global.gc(); global.gc(); }
    } else if (heapUsedMb >= HEAP_WARN_THRESHOLD_MB) {
      logger.warn({
        heapUsedMb,
        heapTotalMb,
        limitMb: HEAP_LIMIT_MB,
      }, "[memory] Heap usage elevated — running GC");
      if (global.gc) global.gc();
    } else if (heapUsedMb >= HEAP_GC_THRESHOLD_MB) {
      if (global.gc) global.gc();
    }
  }, 20_000);
  memoryMonitor.unref();

  logger.info({ port, host: "0.0.0.0" }, "Server listening");

  scheduleNycIngestionJob();
  scheduleNycExtendedIngestionJob();
  prewarmIntelligenceCache().catch(err => {
    logger.warn({ err }, "[intelligence-cache] Prewarm failed (non-fatal)");
  });
  scheduleIntelligenceRefresh();

  import("@szl-holdings/ai-engine")
    .then(({ startCognitiveLearning }) => startCognitiveLearning())
    .catch(err => logger.warn({ err }, "[cognitive] Cognitive learning startup failed (non-fatal)"));

  ensureAlloyTables()
    .then(() => ensureAlloyGovernanceTables())
    .then(() => ensurePlatformOpsTables())
    .then(() => ensureLyteDashboardsTable())
    .then(() => ensureExportJobsTable())
    .then(() => ensureFeedbackTables())
    .then(() => ensureTerraActionItemsTable())
    .then(() => ensureTradecraftTables())
    .then(() => ensureOutcomeGraphTables())
    .then(() => ensureCognitiveLearningTables())
    .then(() => ensurePlatformFlags())
    .then(() => knowledgeStore.loadFromDb())
    .then(() => {
      registerDefaultSchedules();
      seedPlatformData().catch(err => {
        logger.warn({ err }, "[seed-platform] Seed failed (non-fatal)");
      });
      seedTerraDemo().catch(err => {
        logger.warn({ err }, "[terra-seed] Terra demo seed failed (non-fatal)");
      });
      seedMspData().catch(err => {
        logger.warn({ err }, "[msp-seed] MSP demo seed failed (non-fatal)");
      });
      seedDreamscapeData().catch(err => {
        logger.warn({ err }, "[seed-dreamscape] Creative Workflows seed failed (non-fatal)");
      });
      seedDosData().catch(err => {
        logger.warn({ err }, "[dos-seed] Distribution OS seed failed (non-fatal)");
      });
      startScheduledJobs();
      startNamedScheduledJobs();
      startPlatformScheduledJobs();
    })
    .catch(err => {
      logger.fatal({ err }, "Schema bootstrap failed — cannot guarantee data integrity, shutting down");
      process.exit(1);
    });

  const SHUTDOWN_TIMEOUT_MS = 10_000;

  async function shutdown(signal: string) {
    logger.info({ signal }, "Graceful shutdown initiated");

    const shutdownTimer = setTimeout(() => {
      logger.error("Shutdown timeout exceeded — forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    shutdownTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info("HTTP server closed");
    } catch (err) {
      logger.warn({ err }, "Error closing HTTP server");
    }

    stopDomainNotificationGenerators();
    stopSelfMonitoring();
    providerHealth.stopActiveProbes();
    agentScheduler.stop();
    clearInterval(prismPoller);

    try {
      await jobQueue.shutdown();
      logger.info("Job queue flushed");
    } catch (err) {
      logger.warn({ err }, "Error flushing job queue");
    }

    try {
      const { pool } = await import("@szl-holdings/db");
      await pool.end();
      logger.info("Database pool closed");
    } catch (err) {
      logger.warn({ err }, "Error closing DB pool (may not be configured)");
    }

    clearTimeout(shutdownTimer);
    logger.info("Graceful shutdown complete");
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception — shutting down");
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled promise rejection — shutting down");
    shutdown("unhandledRejection");
  });

  return app as unknown as http.RequestListener;
}

if (!process.env.__FAST_START_SERVER) {
  const rawPort = process.env["PORT"];
  if (!rawPort) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  const server = http.createServer(app);
  server.listen(port, "0.0.0.0", () => {
    bootstrap(server, port);
  });
}
