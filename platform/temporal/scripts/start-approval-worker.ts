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
 * Surfaces startup/connection errors clearly with a `[temporal-approval-worker]
 * FATAL` prefix and forwards SIGTERM/SIGINT for graceful shutdown.
 */

import { bootstrapTemporalWorker } from "../worker.js";

const APPROVAL_TASK_QUEUE_ENV = "TEMPORAL_APPROVAL_TASK_QUEUE";
const DEFAULT_APPROVAL_TASK_QUEUE = "approval-task-queue";

async function main() {
  const started = Date.now();
  const taskQueue =
    process.env[APPROVAL_TASK_QUEUE_ENV] ?? DEFAULT_APPROVAL_TASK_QUEUE;

  let bootstrapped: Awaited<ReturnType<typeof bootstrapTemporalWorker>>;
  try {
    bootstrapped = await bootstrapTemporalWorker({ taskQueue });
  } catch (err) {
    console.error(
      "[temporal-approval-worker] FATAL: failed to start worker",
      err instanceof Error ? { message: err.message, stack: err.stack } : err,
    );
    process.exit(1);
  }

  console.log(
    `[temporal-approval-worker] running (namespace=${bootstrapped.namespace} ` +
      `taskQueue=${bootstrapped.taskQueue} bootMs=${Date.now() - started})`,
  );

  const stop = (signal: NodeJS.Signals) => {
    console.log(
      `[temporal-approval-worker] received ${signal} — initiating graceful shutdown`,
    );
    bootstrapped.shutdown();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  try {
    await bootstrapped.run();
    console.log("[temporal-approval-worker] shut down cleanly");
    process.exit(0);
  } catch (err) {
    console.error(
      "[temporal-approval-worker] worker.run() exited with error",
      err instanceof Error ? { message: err.message, stack: err.stack } : err,
    );
    process.exit(1);
  }
}

main();
