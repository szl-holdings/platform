/**
 * SZL Holdings — Temporal Worker Bootstrap
 *
 * Registers all platform workflows and activities and starts a worker that
 * polls the configured task queue. This is the runtime that makes the
 * orchestration layer actually execute — without it, workflows can be
 * defined and tested but never run against a real Temporal cluster.
 *
 * Used by:
 *  - `scripts/start-worker.ts` — long-running worker process (api-server
 *    artifact registers this as its `temporal-worker` service).
 *  - `scripts/smoke-test.ts` — boots an ephemeral Temporal dev server and
 *    verifies a simple workflow can be started and completed.
 */

import { NativeConnection, Worker, type WorkerOptions } from "@temporalio/worker";

import { logger as defaultLogger } from "./logger.js";
import * as approvalActivities from "./activities/approval-activities.js";
import * as evidenceActivities from "./activities/evidence-activities.js";
import * as ingestionActivities from "./activities/ingestion-activities.js";
import * as frontierActivities from "./activities/frontier-ingest-activities.js";

export const DEFAULT_TASK_QUEUE = "szl-platform";
export const DEFAULT_NAMESPACE = "default";

export type SimpleLogger = {
  info: (obj: Record<string, unknown> | string, msg?: string) => void;
  warn: (obj: Record<string, unknown> | string, msg?: string) => void;
  error: (obj: Record<string, unknown> | string, msg?: string) => void;
};

/**
 * All activity implementations registered on the worker. Workflows reference
 * these via `proxyActivities<typeof approvalActivities>(...)` etc., so the
 * names here must match the source-of-truth modules in `activities/`.
 */
export function buildActivityRegistry() {
  return {
    ...approvalActivities,
    ...evidenceActivities,
    ...ingestionActivities,
    ...frontierActivities,
  };
}

export interface WorkerBootstrapOptions {
  /** Temporal Frontend host:port (gRPC). Defaults to TEMPORAL_ENDPOINT or localhost:7233. */
  address?: string;
  /** Temporal namespace. Defaults to TEMPORAL_NAMESPACE or "default". */
  namespace?: string;
  /** Task queue name. Defaults to TEMPORAL_TASK_QUEUE or "szl-platform". */
  taskQueue?: string;
  /** Override the workflows bundle path. Defaults to `./workflows` relative to this file. */
  workflowsPath?: string;
  /** Optional logger; defaults to console. */
  logger?: SimpleLogger;
  /** Additional WorkerOptions overrides (e.g. for tests). */
  workerOptions?: Partial<WorkerOptions>;
}

export interface BootstrappedWorker {
  worker: Worker;
  connection: NativeConnection;
  taskQueue: string;
  namespace: string;
  /** Resolves once the worker has fully shut down. */
  run: () => Promise<void>;
  shutdown: () => void;
}

const pinoLogger: SimpleLogger = {
  info: (obj, msg) =>
    typeof obj === "string" ? defaultLogger.info(obj) : defaultLogger.info(obj, msg),
  warn: (obj, msg) =>
    typeof obj === "string" ? defaultLogger.warn(obj) : defaultLogger.warn(obj, msg),
  error: (obj, msg) =>
    typeof obj === "string" ? defaultLogger.error(obj) : defaultLogger.error(obj, msg),
};

/**
 * Bootstrap a worker against a real Temporal Frontend (does NOT call .run()).
 * The caller decides whether to await `run()` (long-running process) or shut
 * down explicitly (smoke tests).
 */
export async function bootstrapTemporalWorker(
  opts: WorkerBootstrapOptions = {},
): Promise<BootstrappedWorker> {
  const logger = opts.logger ?? pinoLogger;
  const address = opts.address ?? process.env.TEMPORAL_ENDPOINT ?? "localhost:7233";
  const namespace = opts.namespace ?? process.env.TEMPORAL_NAMESPACE ?? DEFAULT_NAMESPACE;
  const taskQueue = opts.taskQueue ?? process.env.TEMPORAL_TASK_QUEUE ?? DEFAULT_TASK_QUEUE;
  const workflowsPath =
    opts.workflowsPath ?? new URL("./workflows/index.ts", import.meta.url).pathname;

  // Allow tests to inject a pre-built connection (e.g. the in-memory connection
  // from TestWorkflowEnvironment) by passing `workerOptions.connection`. When
  // not provided, dial the configured Temporal Frontend over gRPC.
  const injectedConnection = opts.workerOptions?.connection as NativeConnection | undefined;
  let connection: NativeConnection;
  let ownsConnection = false;
  if (injectedConnection) {
    connection = injectedConnection;
    logger.info({ namespace, taskQueue }, "Using injected Temporal connection");
  } else {
    logger.info({ address, namespace, taskQueue }, "Connecting to Temporal Frontend");
    try {
      connection = await NativeConnection.connect({ address });
      ownsConnection = true;
    } catch (err) {
      logger.error({ err, address }, "Failed to connect to Temporal Frontend");
      throw err;
    }
  }

  let worker: Worker;
  try {
    worker = await Worker.create({
      connection,
      namespace,
      taskQueue,
      workflowsPath,
      activities: buildActivityRegistry(),
      ...opts.workerOptions,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create Temporal worker");
    if (ownsConnection) await connection.close().catch(() => {});
    throw err;
  }

  logger.info(
    { namespace, taskQueue, workflowsPath },
    "Temporal worker registered; activities and workflows loaded",
  );

  return {
    worker,
    connection,
    taskQueue,
    namespace,
    run: async () => {
      try {
        await worker.run();
      } finally {
        if (ownsConnection) await connection.close().catch(() => {});
      }
    },
    shutdown: () => worker.shutdown(),
  };
}
