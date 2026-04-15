import { LRUCache } from "lru-cache";
import {
  runSimulation,
  runSerializableSimulation,
  computeSensitivity,
  compareScenarios,
  calibrate,
  backtest,
  buildScenarioCalculate,
  DOMAIN_SCENARIO_LIBRARY,
  SCENARIO_VARIANTS,
  DEFAULT_RUN_CONFIG,
  validateSerializableScenario,
  type ScenarioDefinition,
  type InputVariable,
  type OutputMetric,
  type RunConfig,
  type SimulationResult,
  type SensitivityReport,
  type ScenarioComparison,
  type CalibrationResult,
  type BacktestResult,
  type HistoricalDataPoint,
  type SimulationProgress,
  type SerializableScenario,
  type PartialOutputSnapshot,
} from "@szl-holdings/monte-carlo";
import { publish, WS_CHANNELS } from "./websocket.js";
import { logger } from "./logger.js";

export type { SimulationResult, SensitivityReport, ScenarioComparison, CalibrationResult, BacktestResult, SimulationProgress };

/**
 * In-memory job store for Monte Carlo simulation jobs.
 * Jobs are evicted after JOB_TTL_MS (2h) via automatic cleanup.
 *
 * PRODUCTION NOTE: this store is process-local and non-persistent.
 * Jobs are lost on process restart and cannot be shared across replicas.
 * Replace with a Redis or database-backed store before horizontal scaling.
 */
const jobStore = new LRUCache<string, SimulationJob>({ max: 500 });

const JOB_TTL_MS = 2 * 60 * 60 * 1000;
const AUTO_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
const _autoCleanupTimer = setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS;
  let removed = 0;
  for (const [id, job] of jobStore) {
    if (new Date(job.createdAt).getTime() < cutoff && job.status !== "running") {
      jobStore.delete(id);
      removed++;
    }
  }
  if (removed > 0) logger.info({ removed, remaining: jobStore.size }, "monte-carlo: auto-cleaned expired jobs");
}, AUTO_CLEANUP_INTERVAL_MS).unref();

export interface SimulationJob {
  jobId: string;
  status: "pending" | "running" | "complete" | "error";
  progress?: SimulationProgress;
  result?: SimulationResult;
  sensitivity?: Record<string, SensitivityReport>;
  error?: string;
  scenarioId: string;
  scenarioType: "builtin" | "custom";
  config: RunConfig;
  createdAt: string;
  completedAt?: string;
  creatorUserId?: string | null;
  creatorTenantId?: string | null;
}

function generateJobId(): string {
  return `mc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listScenarios(): Array<{ id: string; title: string; description: string; domain: string; tags: string[]; inputs: number; outputs: number }> {
  return Object.values(DOMAIN_SCENARIO_LIBRARY).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    domain: s.domain,
    tags: s.tags ?? [],
    inputs: s.inputs.length,
    outputs: s.outputs.length,
  }));
}

export function getScenario(id: string): ScenarioDefinition | undefined {
  return DOMAIN_SCENARIO_LIBRARY[id];
}

export function getVariants(scenarioId: string) {
  return SCENARIO_VARIANTS[scenarioId] ?? [];
}

function broadcastProgress(job: SimulationJob, progress: SimulationProgress): void {
  publish(
    WS_CHANNELS.MONTE_CARLO_PROGRESS,
    "progress",
    {
      jobId: job.jobId,
      iteration: progress.iteration,
      totalIterations: progress.totalIterations,
      percentComplete: progress.percentComplete,
      elapsedMs: progress.elapsedMs,
      estimatedRemainingMs: progress.estimatedRemainingMs,
    },
    job.creatorTenantId ?? null
  );
}

function broadcastComplete(job: SimulationJob): void {
  publish(
    WS_CHANNELS.MONTE_CARLO_PROGRESS,
    "complete",
    {
      jobId: job.jobId,
      status: job.status,
      scenarioId: job.scenarioId,
      durationMs: job.result?.durationMs,
      validIterations: job.result?.validIterations,
      timedOut: job.result?.timedOut ?? false,
      ...(job.result?.timedOut ? { warning: `Simulation timed out after ${job.result.durationMs}ms — completed ${job.result.totalIterations} of ${job.result.runConfig.iterations} requested iterations` } : {}),
    },
    job.creatorTenantId ?? null
  );
}

function broadcastError(job: SimulationJob, error: string): void {
  publish(
    WS_CHANNELS.MONTE_CARLO_PROGRESS,
    "error",
    { jobId: job.jobId, error },
    job.creatorTenantId ?? null
  );
}

function broadcastPartialResult(job: SimulationJob, validIterations: number, totalIterations: number, snapshots: PartialOutputSnapshot[]): void {
  publish(
    WS_CHANNELS.MONTE_CARLO_PROGRESS,
    "interim-snapshot",
    {
      jobId: job.jobId,
      validIterations,
      totalIterations,
      percentComplete: Math.round((validIterations / Math.max(totalIterations, 1)) * 100),
      snapshots,
    },
    job.creatorTenantId ?? null
  );
}

function serializableToScenarioDefinition(scenario: SerializableScenario): ScenarioDefinition {
  const VALID_DOMAINS = new Set(["vessels","terra","szl","prism","aegis","nexus","lyte","generic"]);
  const domainStr = scenario.domain as string;
  return {
    id: scenario.id,
    version: scenario.version ?? "1.0.0",
    title: scenario.title,
    description: scenario.description ?? "",
    domain: (VALID_DOMAINS.has(domainStr) ? domainStr : "generic") as ScenarioDefinition["domain"],
    tags: scenario.tags,
    inputs: scenario.inputs.map((i): InputVariable => ({
      id: i.id,
      label: i.label ?? i.id,
      description: i.description,
      unit: i.unit,
      format: (i.format as InputVariable["format"]) ?? undefined,
      distribution: i.distribution as InputVariable["distribution"],
    })),
    outputs: scenario.outputs.map((o): OutputMetric => ({
      id: o.id,
      label: o.label,
      description: o.description,
      unit: o.unit,
      format: (o.format as OutputMetric["format"]) ?? undefined,
      higherIsBetter: o.higherIsBetter,
    })),
    calculate: buildScenarioCalculate(scenario.outputExprs, scenario.intermediates ?? []),
  };
}

export function startSimulationJob(
  scenarioId: string,
  config: Partial<RunConfig> = {},
  creatorUserId?: string | null,
  creatorTenantId?: string | null
): SimulationJob {
  const scenario = DOMAIN_SCENARIO_LIBRARY[scenarioId];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);

  const finalConfig: RunConfig = { ...DEFAULT_RUN_CONFIG, ...config };
  const jobId = generateJobId();

  const job: SimulationJob = {
    jobId,
    status: "running",
    scenarioId,
    scenarioType: "builtin",
    config: finalConfig,
    createdAt: new Date().toISOString(),
    creatorUserId: creatorUserId ?? null,
    creatorTenantId: creatorTenantId ?? null,
  };

  jobStore.set(jobId, job);

  (async () => {
    try {
      const snapshotInterval = finalConfig.snapshotInterval ?? 0;
      const result = await runSimulation(
        scenario, finalConfig,
        (progress) => { job.progress = progress; broadcastProgress(job, progress); },
        snapshotInterval > 0
          ? (vi, total, snaps) => broadcastPartialResult(job, vi, total, snaps)
          : undefined
      );

      const sensitivity: Record<string, SensitivityReport> = {};
      for (const output of scenario.outputs) {
        try {
          sensitivity[output.id] = computeSensitivity(scenario, result, output.id, finalConfig.sensitivitySamples);
        } catch (err: unknown) {
          logger.warn({ err, outputId: output.id, jobId }, "monte-carlo: sensitivity analysis failed for output");
        }
      }

      job.result = result;
      job.sensitivity = sensitivity;
      job.status = "complete";
      job.completedAt = new Date().toISOString();
      broadcastComplete(job);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Simulation failed";
      logger.error({ err, jobId, scenarioId }, "monte-carlo: simulation job failed");
      job.status = "error";
      job.error = msg;
      job.completedAt = new Date().toISOString();
      broadcastError(job, msg);
    }
  })();

  return job;
}

export function startCustomSimulationJob(
  scenario: SerializableScenario,
  config: Partial<RunConfig> = {},
  creatorUserId?: string | null,
  creatorTenantId?: string | null
): SimulationJob {
  const finalConfig: RunConfig = { ...DEFAULT_RUN_CONFIG, ...config };
  const jobId = generateJobId();

  const job: SimulationJob = {
    jobId,
    status: "running",
    scenarioId: scenario.id,
    scenarioType: "custom",
    config: finalConfig,
    createdAt: new Date().toISOString(),
    creatorUserId: creatorUserId ?? null,
    creatorTenantId: creatorTenantId ?? null,
  };

  jobStore.set(jobId, job);

  (async () => {
    try {
      const result = await runSerializableSimulation(scenario, finalConfig, (progress) => {
        job.progress = progress;
        broadcastProgress(job, progress);
      });

      const scenarioDefinition = serializableToScenarioDefinition(scenario);

      const sensitivity: Record<string, SensitivityReport> = {};
      for (const output of scenario.outputs) {
        try {
          sensitivity[output.id] = computeSensitivity(scenarioDefinition, result, output.id, finalConfig.sensitivitySamples);
        } catch (err: unknown) {
          logger.warn({ err, outputId: output.id, jobId }, "monte-carlo: custom scenario sensitivity analysis failed");
        }
      }

      job.result = result;
      job.sensitivity = sensitivity;
      job.status = "complete";
      job.completedAt = new Date().toISOString();
      broadcastComplete(job);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Custom simulation failed";
      logger.error({ err, jobId, scenarioId: scenario.id }, "monte-carlo: custom simulation job failed");
      job.status = "error";
      job.error = msg;
      job.completedAt = new Date().toISOString();
      broadcastError(job, msg);
    }
  })();

  return job;
}

export function getJob(jobId: string): SimulationJob | undefined {
  return jobStore.get(jobId);
}

export function listJobs(): SimulationJob[] {
  return Array.from(jobStore.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);
}

export async function runComparison(
  scenarioId: string,
  variantIds: string[],
  outputId: string,
  config: Partial<RunConfig> = {},
  weights?: number[]
): Promise<ScenarioComparison> {
  const baseScenario = DOMAIN_SCENARIO_LIBRARY[scenarioId];
  if (!baseScenario) throw new Error(`Unknown scenario: ${scenarioId}`);

  const scenarios = variantIds.length > 0
    ? variantIds.map((vid) => {
        const variant = SCENARIO_VARIANTS[scenarioId]?.find((v) => v.id === vid);
        if (!variant) throw new Error(`Variant ${vid} not found for ${scenarioId}`);
        return applyVariant(baseScenario, variant);
      })
    : [baseScenario];

  const iterCount = Math.min(config.iterations ?? 5_000, 10_000);
  const results = await Promise.all(
    scenarios.map((s) => runSimulation(s, { ...DEFAULT_RUN_CONFIG, ...config, iterations: iterCount }))
  );

  const outputMetric = baseScenario.outputs.find((o) => o.id === outputId);
  const higherIsBetter = outputMetric?.higherIsBetter ?? true;

  return compareScenarios(results, outputId, weights, higherIsBetter);
}

function applyVariant(
  base: ScenarioDefinition,
  variant: { id: string; label: string; overrides: Record<string, unknown> }
): ScenarioDefinition {
  return {
    ...base,
    id: `${base.id}/${variant.id}`,
    title: `${base.title} — ${variant.label}`,
    inputs: base.inputs.map((input) => {
      const override = (variant.overrides as Record<string, Partial<typeof input>>)[input.id];
      if (!override) return input;
      return { ...input, ...override };
    }),
  };
}

export function runCalibrationCheck(
  scenarioId: string,
  historicalData: HistoricalDataPoint[],
  simulationResult: SimulationResult
): CalibrationResult {
  const scenario = DOMAIN_SCENARIO_LIBRARY[scenarioId];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  return calibrate(scenario, historicalData, simulationResult);
}

export function runBacktest(
  scenarioId: string,
  historicalData: HistoricalDataPoint[],
  simulationResult: SimulationResult,
  outputId: string
): BacktestResult {
  const scenario = DOMAIN_SCENARIO_LIBRARY[scenarioId];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  return backtest(scenario, historicalData, simulationResult, outputId);
}

export function cleanupOldJobs(maxAgeMs = 3_600_000): void {
  const cutoff = Date.now() - maxAgeMs;
  for (const [id, job] of jobStore) {
    if (new Date(job.createdAt).getTime() < cutoff && job.status !== "running") {
      jobStore.delete(id);
    }
  }
}

export { validateSerializableScenario };
