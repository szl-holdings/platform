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
import { ensurePlatformOpsTables } from "./lib/platform-ops-migrations";
import "./lib/terra-nyc-ingestion";
import { scheduleNycIngestionJob } from "./lib/terra-nyc-ingestion";
import { seedPlatformData } from "./lib/seed-platform";
import { initializeOpenTelemetry } from "@workspace/observability";
import { seedTerraDemo } from "./lib/terra-seed";
import { seedMspData } from "./lib/seed-msp";

failFastOnInvalidConfig();

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

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);

initWebSocket(server);
startDomainNotificationGenerators();
startSelfMonitoring();

import { providerHealth } from "./lib/provider-health";
providerHealth.startActiveProbes();
ensureAlloyTables()
  .then(() => ensurePlatformOpsTables())
  .then(() => knowledgeStore.loadFromDb())
  .then(() => {
    registerDefaultSchedules();
  })
  .catch(err => {
    logger.fatal({ err }, "Schema bootstrap failed — cannot guarantee data integrity, shutting down");
    process.exit(1);
  });
startScheduledJobs();
startNamedScheduledJobs();
startPlatformScheduledJobs();
ensurePlatformFlags().catch((err) => {
  logger.warn({ err }, "Failed to ensure platform feature flags on startup");
});

seedPlatformData().catch(err => {
  logger.warn({ err }, "[seed-platform] Seed failed (non-fatal)");
});

seedTerraDemo().catch(err => {
  logger.warn({ err }, "[terra-seed] Terra demo seed failed (non-fatal)");
});

seedMspData().catch(err => {
  logger.warn({ err }, "[msp-seed] MSP demo seed failed (non-fatal)");
});

server.listen(port, "0.0.0.0", () => {
  logger.info({ port, host: "0.0.0.0" }, "Server listening");
  scheduleNycIngestionJob();
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

  try {
    await jobQueue.shutdown();
    logger.info("Job queue flushed");
  } catch (err) {
    logger.warn({ err }, "Error flushing job queue");
  }

  try {
    const { pool } = await import("@workspace/db");
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
