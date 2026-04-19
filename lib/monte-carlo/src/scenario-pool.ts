import {
  aggregateScenarioShards,
  type MonteCarloResult,
  type ScenarioShardSamples,
} from "./scenario-simulation.js";
import type { ScenarioDefinition } from "./schema.js";
import type {
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
} from "./scenario-simulation.worker.js";

export type WorkerLike = {
  postMessage: (msg: ScenarioSimulationRequest) => void;
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<ScenarioSimulationResponse>) => void,
  ) => void;
  removeEventListener: (
    type: "message",
    listener: (event: MessageEvent<ScenarioSimulationResponse>) => void,
  ) => void;
  terminate: () => void;
};

export type WorkerFactory = () => WorkerLike;

export interface ScenarioPoolOptions {
  /** Scenario being simulated; required for the merge step. */
  scenario: ScenarioDefinition;
  /** Total iterations to run across the pool. */
  iterations: number;
  /** Creates a fresh worker; called once per shard. */
  workerFactory: WorkerFactory;
  /**
   * Hard cap on the number of parallel workers. Defaults to 4. The actual
   * pool size is `min(maxWorkers, hardwareConcurrency, ceil(iterations/parallelThreshold))`.
   */
  maxWorkers?: number;
  /**
   * Minimum iterations per shard — keeps small simulations on a single worker
   * to avoid spin-up overhead. Defaults to 5,000.
   */
  parallelThreshold?: number;
  /** Per-worker timeout in ms. Defaults to 60s. */
  timeoutMs?: number;
  /**
   * Optional progress callback. Fires whenever any shard worker reports
   * progress; the callback receives the aggregated `completed` and `total`
   * counts across all shards in the pool.
   */
  onProgress?: (progress: PoolProgress) => void;
}

export interface PoolProgress {
  completed: number;
  total: number;
  validIterations: number;
}

function detectHardwareConcurrency(): number {
  if (typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number") {
    return Math.max(1, navigator.hardwareConcurrency);
  }
  return 1;
}

/**
 * Distribute `iterations` across N shards as evenly as possible. Returns an
 * array of per-shard iteration counts whose sum equals `iterations` and whose
 * lengths is exactly the smaller of `shardCount` and `iterations`.
 */
export function planShards(iterations: number, shardCount: number): number[] {
  const safeShards = Math.max(1, Math.min(shardCount, iterations));
  const base = Math.floor(iterations / safeShards);
  const remainder = iterations - base * safeShards;
  const out: number[] = [];
  for (let i = 0; i < safeShards; i++) {
    out.push(base + (i < remainder ? 1 : 0));
  }
  return out;
}

/**
 * Compute the number of workers to spawn given configuration + environment.
 */
export function planPoolSize(
  iterations: number,
  options: { maxWorkers?: number; parallelThreshold?: number } = {},
): number {
  const maxWorkers = Math.max(1, options.maxWorkers ?? 4);
  const threshold = Math.max(1, options.parallelThreshold ?? 5_000);
  const byThreshold = Math.max(1, Math.floor(iterations / threshold));
  const byHardware = detectHardwareConcurrency();
  return Math.max(1, Math.min(maxWorkers, byHardware, byThreshold));
}

function nowMs(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

let nextRequestId = 1;

function runOneShard(
  worker: WorkerLike,
  scenarioId: string,
  iterations: number,
  timeoutMs: number,
  onShardProgress?: (completed: number, validIterations: number) => void,
): Promise<{ shard: ScenarioShardSamples; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const requestId = nextRequestId++;
    const handler = (event: MessageEvent<ScenarioSimulationResponse>) => {
      const data = event.data;
      if (data.requestId !== requestId) return;
      if (data.type === "progress") {
        onShardProgress?.(data.completed, data.validIterations);
        return;
      }
      worker.removeEventListener("message", handler);
      clearTimeout(timer);
      if (!data.ok) {
        reject(new Error(data.error));
        return;
      }
      if (data.mode === "shard") {
        resolve({ shard: data.shard, durationMs: data.durationMs });
        return;
      }
      reject(new Error("Worker returned unexpected response shape for shard request"));
    };
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      worker.removeEventListener("message", handler);
      reject(new Error(`Worker shard timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    worker.addEventListener("message", handler);
    worker.postMessage({ requestId, scenarioId, iterations, mode: "shard" });
  });
}

/**
 * Run a Monte Carlo scenario across a small pool of Web Workers, then merge
 * the per-shard samples on the main thread to produce a single
 * {@link MonteCarloResult}.
 *
 * If pool sizing collapses to a single worker (small iteration counts or
 * single-core environments) this still works correctly — it just runs one
 * shard.
 */
export async function runScenarioInPool(
  options: ScenarioPoolOptions,
): Promise<MonteCarloResult> {
  const {
    scenario,
    iterations,
    workerFactory,
    maxWorkers,
    parallelThreshold,
    timeoutMs = 60_000,
    onProgress,
  } = options;

  if (iterations <= 0) {
    return aggregateScenarioShards(scenario, [], 0);
  }

  const poolSize = planPoolSize(iterations, { maxWorkers, parallelThreshold });
  const shardSizes = planShards(iterations, poolSize);
  const workers: WorkerLike[] = [];
  const start = nowMs();

  // Track per-shard progress so we can emit aggregated counts to the caller.
  const shardCompleted: number[] = shardSizes.map(() => 0);
  const shardValid: number[] = shardSizes.map(() => 0);
  const emitAggregate = onProgress
    ? () => {
        let completed = 0;
        let validIterations = 0;
        for (let i = 0; i < shardCompleted.length; i++) {
          completed += shardCompleted[i]!;
          validIterations += shardValid[i]!;
        }
        onProgress({ completed, total: iterations, validIterations });
      }
    : undefined;

  try {
    const shardPromises = shardSizes.map((shardIters, idx) => {
      const w = workerFactory();
      workers.push(w);
      return runOneShard(w, scenario.id, shardIters, timeoutMs, emitAggregate
        ? (completed, validIterations) => {
            shardCompleted[idx] = completed;
            shardValid[idx] = validIterations;
            emitAggregate();
          }
        : undefined);
    });
    const results = await Promise.all(shardPromises);
    const durationMs = nowMs() - start;
    return aggregateScenarioShards(
      scenario,
      results.map((r) => r.shard),
      durationMs,
    );
  } finally {
    for (const w of workers) {
      try {
        w.terminate();
      } catch {
        /* ignore terminate errors */
      }
    }
  }
}
