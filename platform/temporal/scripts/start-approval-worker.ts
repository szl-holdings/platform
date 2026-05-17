/**
 * Long-running Temporal worker entrypoint for the agent-gateway approval
 * task queue.
 *
 * The agent-gateway (`platform/agent-gateway/src/approval.ts`) starts the
 * `approvalWorkflow` against `TEMPORAL_APPROVAL_TASK_QUEUE` (default
 * `approval-task-queue`). Without a worker polling that queue, those
 * production approval requests would sit forever in Temporal. This process
 * is the worker that drains them.
 *
 * Run with:
 *   pnpm --filter @szl-holdings/temporal-tests run worker:approval:start
 *
 * Required env:
 *   TEMPORAL_ENDPOINT              host:port of the Temporal Frontend (gRPC).
 *                                  Default: localhost:7233
 *   TEMPORAL_NAMESPACE             Default: "default"
 *   TEMPORAL_APPROVAL_TASK_QUEUE   Default: "approval-task-queue"
 *
 * Initializes the platform OpenTelemetry tracer (Phase 8) BEFORE bootstrap
 * so workflow/activity executions show up as spans in the shared pipeline,
 * and routes logging through the shared pino logger.
 *
 * Surfaces startup/connection errors clearly with a `[temporal-approval-worker]
 * FATAL` prefix and forwards SIGTERM/SIGINT for graceful shutdown, flushing
 * the OTel exporter on exit.
 */

import { initOtel } from "@szl-holdings/otel";
import { shutdownTracer } from "@szl-holdings/observability";

import { createLogger } from "../logger.js";
import { bootstrapTemporalWorker } from "../worker.js";
import { parseTimeoutEnv, waitForTemporalReady } from "./wait-for-temporal.js";

const APPROVAL_TASK_QUEUE_ENV = "TEMPORAL_APPROVAL_TASK_QUEUE";
const DEFAULT_APPROVAL_TASK_QUEUE = "approval-task-queue";
const SERVICE_NAME =
  process.env.OTEL_SERVICE_NAME ?? "temporal-approval-worker";

const logger = createLogger(SERVICE_NAME);

async function main() {
  const started = Date.now();
  const taskQueue =
    process.env[APPROVAL_TASK_QUEUE_ENV] ?? DEFAULT_APPROVAL_TASK_QUEUE;
  const endpointFromEnv = process.env.TEMPORAL_ENDPOINT;
  const endpoint = endpointFromEnv ?? "localhost:7233";
  // See start-worker.ts for rationale: when no TEMPORAL_ENDPOINT is configured
  // (typical dev / Replit workspace where no Temporal server is running),
  // short-circuit to a 5s probe and exit(0) so the workflow reports
  // "finished" instead of burning 5 min and crashing red.
  const skipIfUnreachable =
    process.env.TEMPORAL_SKIP_IF_UNREACHABLE === "true" || !endpointFromEnv;
  const defaultTimeoutMs = skipIfUnreachable ? 5_000 : 5 * 60 * 1_000;
  const rawTimeout = process.env.TEMPORAL_READINESS_TIMEOUT_MS;
  const parsedTimeout = rawTimeout === undefined ? defaultTimeoutMs : Number(rawTimeout);
  const totalTimeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout >= 0
    ? parsedTimeout
    : defaultTimeoutMs;

  try {
    await waitForTemporalReady({ endpoint, totalTimeoutMs });
  } catch (err) {
    if (skipIfUnreachable) {
      console.warn(
        "[temporal-approval-worker] Temporal Frontend unreachable — no TEMPORAL_ENDPOINT configured; exiting cleanly",
        { endpoint, err: err instanceof Error ? { message: err.message } : err },
      );
      process.exit(0);
    }
    console.error(
      "[temporal-approval-worker] FATAL: Temporal Frontend never became reachable",
      err instanceof Error ? { message: err.message } : err,
    );
    process.exit(1);
  }

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
      "[temporal-approval-worker] OpenTelemetry initialization failed — continuing without OTel",
    );
  }

  let bootstrapped: Awaited<ReturnType<typeof bootstrapTemporalWorker>>;
  try {
    bootstrapped = await bootstrapTemporalWorker({ taskQueue, logger });
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? { message: err.message, stack: err.stack } : err },
      "[temporal-approval-worker] FATAL: failed to start worker",
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
    "[temporal-approval-worker] running",
  );

  const stop = (signal: NodeJS.Signals) => {
    logger.info(
      { signal },
      "[temporal-approval-worker] received signal — initiating graceful shutdown",
    );
    bootstrapped.shutdown();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  try {
    await bootstrapped.run();
    logger.info("[temporal-approval-worker] shut down cleanly");
    await shutdownTracer(4_000).catch(() => {});
    process.exit(0);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? { message: err.message, stack: err.stack } : err },
      "[temporal-approval-worker] worker.run() exited with error",
    );
    await shutdownTracer(4_000).catch(() => {});
    process.exit(1);
  }
}

main();
