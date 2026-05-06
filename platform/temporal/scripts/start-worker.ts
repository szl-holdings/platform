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
 * Surfaces startup/connection errors clearly and forwards SIGTERM/SIGINT
 * to the worker for graceful shutdown.
 */

import { bootstrapTemporalWorker } from "../worker.js";

async function main() {
  const started = Date.now();
  let bootstrapped: Awaited<ReturnType<typeof bootstrapTemporalWorker>>;
  try {
    bootstrapped = await bootstrapTemporalWorker();
  } catch (err) {
    console.error(
      "[temporal-worker] FATAL: failed to start worker",
      err instanceof Error ? { message: err.message, stack: err.stack } : err,
    );
    process.exit(1);
  }

  console.log(
    `[temporal-worker] running (namespace=${bootstrapped.namespace} ` +
      `taskQueue=${bootstrapped.taskQueue} bootMs=${Date.now() - started})`,
  );

  const stop = (signal: NodeJS.Signals) => {
    console.log(`[temporal-worker] received ${signal} — initiating graceful shutdown`);
    bootstrapped.shutdown();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  try {
    await bootstrapped.run();
    console.log("[temporal-worker] shut down cleanly");
    process.exit(0);
  } catch (err) {
    console.error(
      "[temporal-worker] worker.run() exited with error",
      err instanceof Error ? { message: err.message, stack: err.stack } : err,
    );
    process.exit(1);
  }
}

main();
