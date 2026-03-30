import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { failFastOnInvalidConfig } from "./lib/startup-validation";
import { initWebSocket } from "./lib/websocket";
import { jobQueue, startScheduledJobs } from "./lib/job-queue";
import { startDomainNotificationGenerators, stopDomainNotificationGenerators } from "./lib/domain-notifications";
import { agentScheduler } from "./lib/agent-scheduler";
import { knowledgeStore } from "./lib/knowledge-store";
import { ensureAlloyTables } from "./lib/alloy-migrations";
import "./lib/terra-nyc-ingestion";
import { scheduleNycIngestionJob } from "./lib/terra-nyc-ingestion";

failFastOnInvalidConfig();

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
ensureAlloyTables()
  .then(() => knowledgeStore.loadFromDb())
  .then(() => {
    agentScheduler.start();
  })
  .catch(err => {
    logger.fatal({ err }, "Alloy schema bootstrap failed — cannot guarantee data integrity, shutting down");
    process.exit(1);
  });
startScheduledJobs();

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
