/**
 * Long-running Temporal worker entrypoint.
 *
 * Run with:
 *   pnpm --filter @szl-holdings/temporal-tests run worker:start
 *
 * Required env:
 *   TEMPORAL_ENDPOINT      host:port of the Temporal Frontend (gRPC).
 *                          Default: localhost:7233
 *   TEMPORAL_NAMESPACE     Default: "default"
 *   TEMPORAL_TASK_QUEUE    Default: "szl-platform"
 *
 * Initializes the platform OpenTelemetry tracer (Phase 8) BEFORE
 * bootstrapping the worker so workflow/activity executions and any
 * outbound HTTP fetches show up as spans in the shared OTel pipeline.
 * Logging is routed through the shared pino logger.
 *
 * Surfaces startup/connection errors clearly and forwards SIGTERM/SIGINT
 * to the worker for graceful shutdown, flushing the OTel exporter on exit.
 */

import { initOtel } from "@szl-holdings/otel";
import { shutdownTracer } from "@szl-holdings/observability";

import { logger } from "../logger.js";
import { bootstrapTemporalWorker } from "../worker.js";
import { parseTimeoutEnv, waitForTemporalReady } from "./wait-for-temporal.js";

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? "temporal-worker";

async function main() {
  const started = Date.now();

  try {
    await initOtel({
      serviceName: SERVICE_NAME,
      serviceVersion: process.env.npm_package_version ?? "0.0.0",
      otlpEndpoint:
        process.env.OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      exportToAzureMonitor: !!process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING,
      exportToNewRelic: !!process.env.NEW_RELIC_LICENSE_KEY,
      exportToConsole: process.env.OTEL_CONSOLE_EXPORT === "true",
    });
  } catch (err) {
    logger.warn(
      { err },
      "[temporal-worker] OpenTelemetry initialization failed — continuing without OTel",
    );
  }

  const endpoint = process.env.TEMPORAL_ENDPOINT ?? "localhost:7233";
  const totalTimeoutMs = parseTimeoutEnv(
    process.env.TEMPORAL_READINESS_TIMEOUT_MS,
    5 * 60 * 1_000,
  );

  try {
    await waitForTemporalReady({ endpoint, totalTimeoutMs });
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? { message: err.message } : err },
      "[temporal-worker] FATAL: Temporal Frontend never became reachable",
    );
    await shutdownTracer(4_000).catch(() => {});
    process.exit(1);
  }

  let bootstrapped: Awaited<ReturnType<typeof bootstrapTemporalWorker>>;
  try {
    bootstrapped = await bootstrapTemporalWorker();
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? { message: err.message, stack: err.stack } : err },
      "[temporal-worker] FATAL: failed to start worker",
    );
    await shutdownTracer(4_000).catch(() => {});
    process.exit(1);
  }

  logger.info(
    {
      namespace: bootstrapped.namespace,
      taskQueue: bootstrapped.taskQueue,
      bootMs: Date.now() - started,
    },
    "[temporal-worker] running",
  );

  const stop = (signal: NodeJS.Signals) => {
    logger.info({ signal }, "[temporal-worker] received signal — initiating graceful shutdown");
    bootstrapped.shutdown();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  try {
    await bootstrapped.run();
    logger.info("[temporal-worker] shut down cleanly");
    await shutdownTracer(4_000).catch(() => {});
    process.exit(0);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? { message: err.message, stack: err.stack } : err },
      "[temporal-worker] worker.run() exited with error",
    );
    await shutdownTracer(4_000).catch(() => {});
    process.exit(1);
  }
}

main();
