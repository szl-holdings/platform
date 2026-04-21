import { sample } from './distributions.js';
import type { ScenarioDefinition } from './schema.js';

export interface MonteCarloOutputStat {
  label: string;
  format?: string | undefined;
  higherIsBetter?: boolean | undefined;
  mean: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  min: number;
  max: number;
  stdDev: number;
}

export interface MonteCarloResult {
  scenarioId: string;
  title: string;
  description: string;
  domain: string;
  iterations: number;
  validIterations: number;
  durationMs: number;
  metrics: Record<string, MonteCarloOutputStat>;
  inputSensitivity: Array<{ inputId: string; label: string; impact: number }>;
}

/**
 * Raw per-shard sample arrays. Input samples are only collected for valid
 * iterations so that they remain index-aligned with output samples — this
 * keeps the input-vs-output sensitivity correlation correct when shards are
 * concatenated together.
 */
export interface ScenarioShardSamples {
  iterations: number;
  validIterations: number;
  inputSamples: Record<string, number[]>;
  outputSamples: Record<string, number[]>;
}

export interface SimulationProgress {
  completed: number;
  total: number;
  validIterations: number;
}

export interface SimulationOptions {
  /** Optional progress callback fired periodically while iterating. */
  onProgress?: ((progress: SimulationProgress) => void) | undefined;
  /**
   * Iteration interval at which to fire `onProgress`. Defaults to ~5% of the
   * shard's iteration count (min 1). Ignored when `onProgress` is absent.
   */
  progressInterval?: number | undefined;
}

export type RunScenarioOptions = SimulationOptions;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil((sorted.length * p) / 100) - 1);
  return sorted[idx]!;
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/**
 * Run `iterations` Monte Carlo iterations of `scenario` and return the raw
 * per-input/per-output sample arrays. Useful for sharding work across
 * multiple workers; combine the resulting shards with
 * {@link aggregateScenarioShards} to compute final statistics.
 *
 * If `options.onProgress` is provided, it fires periodically during the loop
 * so callers (e.g. worker pools) can surface live progress to the UI.
 */
export function simulateScenarioShard(
  scenario: ScenarioDefinition,
  iterations: number,
  options: SimulationOptions = {},
): ScenarioShardSamples {
  const inputSamples: Record<string, number[]> = {};
  for (const inp of scenario.inputs) inputSamples[inp.id] = [];
  const outputSamples: Record<string, number[]> = {};
  for (const out of scenario.outputs) outputSamples[out.id] = [];

  let validIterations = 0;

  const { onProgress } = options;
  const progressInterval =
    onProgress && iterations > 0
      ? Math.max(1, options.progressInterval ?? Math.floor(iterations / 20))
      : 0;

  for (let i = 0; i < iterations; i++) {
    const inputs: Record<string, number> = {};
    for (const inp of scenario.inputs) {
      inputs[inp.id] = sample(inp.distribution);
    }
    try {
      const outputs = scenario.calculate(inputs, i);
      let valid = true;
      if (scenario.constraints) {
        for (const constraint of scenario.constraints) {
          if (!constraint.check(outputs)) {
            valid = false;
            break;
          }
        }
      }
      if (!valid) continue;

      // Only record samples once we know the iteration was valid; this keeps
      // input and output arrays index-aligned for sensitivity analysis.
      let allFinite = true;
      for (const out of scenario.outputs) {
        const v = outputs[out.id];
        if (v === undefined || !isFinite(v)) {
          allFinite = false;
          break;
        }
      }
      if (!allFinite) continue;

      validIterations++;
      for (const inp of scenario.inputs) {
        inputSamples[inp.id]!.push(inputs[inp.id]!);
      }
      for (const out of scenario.outputs) {
        outputSamples[out.id]!.push(outputs[out.id]!);
      }
    } catch {
      /* constraint or calculation violation */
    }
    if (progressInterval > 0 && (i + 1) % progressInterval === 0 && i + 1 < iterations) {
      onProgress!({
        completed: i + 1,
        total: iterations,
        validIterations,
      });
    }
  }

  return { iterations, validIterations, inputSamples, outputSamples };
}

/**
 * Merge one or more shard sample sets and compute the final
 * {@link MonteCarloResult}. Sensitivity correlation pairs input samples with
 * output samples per shard (via simple concatenation), which is correct
 * because each shard preserves index-aligned (input, output) pairs.
 */
export function aggregateScenarioShards(
  scenario: ScenarioDefinition,
  shards: ScenarioShardSamples[],
  durationMs: number,
): MonteCarloResult {
  const inputAccum: Record<string, number[]> = {};
  for (const inp of scenario.inputs) inputAccum[inp.id] = [];
  const outputAccum: Record<string, number[]> = {};
  for (const out of scenario.outputs) outputAccum[out.id] = [];

  let totalIterations = 0;
  let validIterations = 0;
  for (const shard of shards) {
    totalIterations += shard.iterations;
    validIterations += shard.validIterations;
    for (const inp of scenario.inputs) {
      const src = shard.inputSamples[inp.id];
      if (src && src.length) inputAccum[inp.id]!.push(...src);
    }
    for (const out of scenario.outputs) {
      const src = shard.outputSamples[out.id];
      if (src && src.length) outputAccum[out.id]!.push(...src);
    }
  }

  const metrics: MonteCarloResult['metrics'] = {};
  for (const out of scenario.outputs) {
    const values = outputAccum[out.id] ?? [];
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    metrics[out.id] = {
      label: out.label,
      format: out.format,
      higherIsBetter: out.higherIsBetter,
      mean,
      p5: percentile(sorted, 5),
      p25: percentile(sorted, 25),
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p95: percentile(sorted, 95),
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      stdDev: computeStdDev(values, mean),
    };
  }

  const primaryOutput = scenario.outputs[0];
  const baseOutputs = primaryOutput ? (outputAccum[primaryOutput.id] ?? []) : [];
  const baseMean =
    baseOutputs.length > 0 ? baseOutputs.reduce((s, v) => s + v, 0) / baseOutputs.length : 0;
  const baseVar =
    baseOutputs.length > 0
      ? baseOutputs.reduce((s, v) => s + (v - baseMean) ** 2, 0) / baseOutputs.length
      : 0;

  const inputSensitivity = scenario.inputs
    .map((inp) => {
      const inputVals = inputAccum[inp.id] ?? [];
      const inputMean =
        inputVals.length > 0 ? inputVals.reduce((s, v) => s + v, 0) / inputVals.length : 0;
      let cov = 0;
      const n = Math.min(inputVals.length, baseOutputs.length);
      for (let i = 0; i < n; i++) {
        cov += (inputVals[i]! - inputMean) * (baseOutputs[i]! - baseMean);
      }
      cov /= inputVals.length || 1;
      const inputVar =
        inputVals.length > 0
          ? inputVals.reduce((s, v) => s + (v - inputMean) ** 2, 0) / inputVals.length
          : 0;
      const r2 = baseVar > 0 && inputVar > 0 ? (cov * cov) / (inputVar * baseVar) : 0;
      return { inputId: inp.id, label: inp.label, impact: Math.sqrt(r2) };
    })
    .sort((a, b) => b.impact - a.impact);

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    description: scenario.description,
    domain: scenario.domain,
    iterations: totalIterations,
    validIterations,
    durationMs,
    metrics,
    inputSensitivity,
  };
}

export function runScenarioSimulation(
  scenario: ScenarioDefinition,
  iterations: number,
  options: RunScenarioOptions = {},
): MonteCarloResult {
  const start = nowMs();
  const shard = simulateScenarioShard(scenario, iterations, options);
  const end = nowMs();
  return aggregateScenarioShards(scenario, [shard], end - start);
}
