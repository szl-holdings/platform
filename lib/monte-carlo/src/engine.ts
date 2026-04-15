import { sample, distributionStats, buildHistogram, buildCDF, type DistributionStats, type HistogramBucket, type CDFPoint } from "./distributions.js";
import type { ScenarioDefinition, RunConfig, OutputMetric, PartialOutputSnapshot, PartialResultCallback } from "./schema.js";
import type { SerializableScenario } from "./dsl.js";
import { buildScenarioCalculate } from "./dsl.js";
import { runParallelChunks } from "./parallel.js";

export interface SimulationProgress {
  iteration: number;
  totalIterations: number;
  percentComplete: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
}

export interface MetricResult {
  metric: OutputMetric;
  values: number[];
  stats: DistributionStats;
  histogram: HistogramBucket[];
  cdf: CDFPoint[];
  constraintViolations: number;
}

export interface SimulationResult {
  scenarioId: string;
  scenarioTitle: string;
  runConfig: RunConfig;
  totalIterations: number;
  validIterations: number;
  constraintViolationRate: number;
  timedOut: boolean;
  results: Record<string, MetricResult>;
  inputSamples: Record<string, number[]>;
  correlationMatrix: Record<string, Record<string, number>>;
  durationMs: number;
  timestamp: string;
}

export type ProgressCallback = (progress: SimulationProgress) => void;

function buildPartialSnapshots(outputs: OutputMetric[], accumulators: Record<string, number[]>, validIterations: number): PartialOutputSnapshot[] {
  return outputs.map((m) => {
    const vals = accumulators[m.id] ?? [];
    if (vals.length === 0) return { outputId: m.id, outputLabel: m.label, count: 0, mean: 0, p25: 0, p50: 0, p75: 0, min: 0, max: 0 };
    const sorted = [...vals].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = vals.reduce((s, v) => s + v, 0) / n;
    const p = (pct: number) => sorted[Math.max(0, Math.floor(n * pct / 100) - 1)] ?? 0;
    return { outputId: m.id, outputLabel: m.label, count: validIterations, mean, p25: p(25), p50: p(50), p75: p(75), min: sorted[0]!, max: sorted[n - 1]! };
  });
}

export async function runSimulation(
  scenario: ScenarioDefinition,
  config: Partial<RunConfig> = {},
  onProgress?: ProgressCallback,
  onPartialResult?: PartialResultCallback
): Promise<SimulationResult> {
  const cfg: RunConfig = {
    iterations: Math.min(config.iterations ?? 10_000, 100_000),
    batchSize: config.batchSize ?? 1_000,
    sensitivitySamples: config.sensitivitySamples ?? 200,
    timeoutMs: config.timeoutMs ?? 120_000,
    snapshotInterval: config.snapshotInterval ?? 0,
  };

  const startMs = Date.now();
  const deadline = startMs + (cfg.timeoutMs ?? 120_000);

  const inputSamples: Record<string, number[]> = {};
  for (const v of scenario.inputs) inputSamples[v.id] = [];

  const validInputSamples: Record<string, number[]> = {};
  for (const v of scenario.inputs) validInputSamples[v.id] = [];

  const outputAccumulators: Record<string, number[]> = {};
  for (const m of scenario.outputs) outputAccumulators[m.id] = [];

  let validIterations = 0;
  let constraintViolations = 0;
  const totalIterations = cfg.iterations;
  const batchSize = Math.min(cfg.batchSize ?? 1_000, totalIterations);
  let completed = 0;

  while (completed < totalIterations) {
    if (Date.now() > deadline) break;

    const batchCount = Math.min(batchSize, totalIterations - completed);

    for (let i = 0; i < batchCount; i++) {
      const inputs: Record<string, number> = {};
      for (const v of scenario.inputs) {
        const val = sample(v.distribution);
        inputs[v.id] = val;
        inputSamples[v.id]!.push(val);
      }

      let outputs: Record<string, number>;
      try {
        outputs = scenario.calculate(inputs, completed + i);
      } catch {
        constraintViolations++;
        continue;
      }

      let valid = true;
      if (scenario.constraints) {
        for (const constraint of scenario.constraints) {
          if (!constraint.check(outputs)) {
            valid = false;
            constraintViolations++;
            break;
          }
        }
      }

      if (!valid) continue;

      validIterations++;
      for (const v of scenario.inputs) {
        validInputSamples[v.id]!.push(inputs[v.id]!);
      }
      for (const m of scenario.outputs) {
        const val = outputs[m.id];
        if (val !== undefined && isFinite(val)) {
          outputAccumulators[m.id]!.push(val);
        }
      }

      const snapshotInterval = cfg.snapshotInterval ?? 0;
      if (onPartialResult && snapshotInterval > 0 && validIterations % snapshotInterval === 0) {
        onPartialResult(validIterations, totalIterations, buildPartialSnapshots(scenario.outputs, outputAccumulators, validIterations));
      }
    }

    completed += batchCount;

    if (onProgress) {
      const elapsed = Date.now() - startMs;
      const rate = elapsed > 0 ? completed / elapsed : 0;
      const remaining = rate > 0 ? (totalIterations - completed) / rate : 0;
      onProgress({
        iteration: completed,
        totalIterations,
        percentComplete: (completed / totalIterations) * 100,
        elapsedMs: elapsed,
        estimatedRemainingMs: remaining,
      });
    }

    await new Promise<void>((r) => setTimeout(r, 0));
  }

  const didTimeout = completed < cfg.iterations;
  const results = buildResults(scenario.outputs, outputAccumulators, constraintViolations);
  const correlationMatrix = computeCorrelationMatrix(validInputSamples, outputAccumulators, scenario.inputs.map((i) => i.id));

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    runConfig: cfg,
    totalIterations: completed,
    validIterations,
    constraintViolationRate: constraintViolations / Math.max(completed, 1),
    timedOut: didTimeout,
    results,
    inputSamples,
    correlationMatrix,
    durationMs: Date.now() - startMs,
    timestamp: new Date().toISOString(),
  };
}

export async function runSerializableSimulation(
  scenario: SerializableScenario,
  config: Partial<RunConfig> = {},
  onProgress?: ProgressCallback
): Promise<SimulationResult> {
  const cfg: RunConfig = {
    iterations: Math.min(config.iterations ?? 10_000, 100_000),
    batchSize: config.batchSize ?? 1_000,
    sensitivitySamples: config.sensitivitySamples ?? 200,
    timeoutMs: config.timeoutMs ?? 120_000,
  };

  const startMs = Date.now();

  const numCPUs = Math.min(4, Math.max(1, Math.floor(cfg.iterations / 2_000)));
  const scenarioJson = JSON.stringify(scenario);

  if (onProgress) {
    onProgress({ iteration: 0, totalIterations: cfg.iterations, percentComplete: 0, elapsedMs: 0, estimatedRemainingMs: cfg.timeoutMs ?? 120_000 });
  }

  const chunkResult = await runParallelChunks(scenarioJson, {
    workers: numCPUs,
    iterations: cfg.iterations,
    timeoutMs: cfg.timeoutMs,
    onProgress: onProgress
      ? (completed, total) => {
          const elapsed = Date.now() - startMs;
          const rate = elapsed > 0 ? completed / elapsed : 0;
          const remaining = rate > 0 ? Math.round((total - completed) / rate) : 0;
          onProgress({
            iteration: completed,
            totalIterations: total,
            percentComplete: Math.round((completed / total) * 100),
            elapsedMs: elapsed,
            estimatedRemainingMs: remaining,
          });
        }
      : undefined,
  });

  if (onProgress) {
    const elapsed = Date.now() - startMs;
    onProgress({ iteration: cfg.iterations, totalIterations: cfg.iterations, percentComplete: 100, elapsedMs: elapsed, estimatedRemainingMs: 0 });
  }

  const outputMetrics: OutputMetric[] = scenario.outputs.map((o) => ({
    id: o.id,
    label: o.label,
    unit: o.unit,
    format: o.format as OutputMetric["format"],
    higherIsBetter: o.higherIsBetter,
  }));

  const results = buildResults(outputMetrics, chunkResult.outputSamples, chunkResult.violationCount);
  const corrInputSamples = Object.keys(chunkResult.validInputSamples ?? {}).length > 0
    ? chunkResult.validInputSamples
    : chunkResult.inputSamples;
  const correlationMatrix = computeCorrelationMatrix(corrInputSamples, chunkResult.outputSamples, scenario.inputs.map((i) => i.id));

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    runConfig: cfg,
    totalIterations: cfg.iterations,
    validIterations: chunkResult.validCount,
    constraintViolationRate: chunkResult.violationCount / Math.max(cfg.iterations, 1),
    timedOut: false,
    results,
    inputSamples: chunkResult.inputSamples,
    correlationMatrix,
    durationMs: Date.now() - startMs,
    timestamp: new Date().toISOString(),
  };
}

function buildResults(
  outputs: OutputMetric[],
  outputAccumulators: Record<string, number[]>,
  constraintViolations: number
): Record<string, MetricResult> {
  const results: Record<string, MetricResult> = {};
  for (const m of outputs) {
    const vals = outputAccumulators[m.id] ?? [];
    const safeVals = vals.length > 0 ? vals : [0];
    results[m.id] = {
      metric: m,
      values: vals,
      stats: distributionStats(safeVals),
      histogram: buildHistogram(safeVals),
      cdf: buildCDF(safeVals),
      constraintViolations,
    };
  }
  return results;
}

function computeCorrelationMatrix(
  inputSamples: Record<string, number[]>,
  outputSamples: Record<string, number[]>,
  inputIds: string[]
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  const n = Math.min(
    ...Object.values(outputSamples).map((v) => v.length),
    ...Object.values(inputSamples).map((v) => v.length),
    1000
  );
  const allSeries: Record<string, number[]> = {};

  for (const [k, v] of Object.entries(outputSamples)) allSeries[k] = v.slice(0, n);
  for (const id of inputIds) {
    const s = inputSamples[id];
    if (s) allSeries[id] = s.slice(0, n);
  }

  for (const idA of Object.keys(allSeries)) {
    matrix[idA] = {};
    for (const idB of Object.keys(allSeries)) {
      matrix[idA]![idB] = pearsonCorrelation(allSeries[idA]!, allSeries[idB]!);
    }
  }

  return matrix;
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i]!; sumY += ys[i]!;
    sumXY += xs[i]! * ys[i]!;
    sumX2 += xs[i]! * xs[i]!;
    sumY2 += ys[i]! * ys[i]!;
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

export function compareScenarios(
  results: SimulationResult[],
  outputId: string,
  scenarioWeights?: number[],
  higherIsBetter = true
): ScenarioComparison {
  if (results.length === 0) throw new Error("No results to compare");

  const scenarios = results.map((r) => {
    const metric = r.results[outputId];
    if (!metric) throw new Error(`Output '${outputId}' not found in scenario ${r.scenarioId}`);
    return {
      scenarioId: r.scenarioId,
      scenarioTitle: r.scenarioTitle,
      stats: metric.stats,
      histogram: metric.histogram,
      cdf: metric.cdf,
    };
  });

  const best = higherIsBetter
    ? scenarios.reduce((b, s) => s.stats.mean > b.stats.mean ? s : b)
    : scenarios.reduce((b, s) => s.stats.mean < b.stats.mean ? s : b);
  const lowestRisk = scenarios.reduce((b, s) => s.stats.stdDev < b.stats.stdDev ? s : b);

  let normalizedWeights: number[];
  if (scenarioWeights && scenarioWeights.length === scenarios.length) {
    const wTotal = scenarioWeights.reduce((s, w) => s + Math.max(0, w), 0);
    normalizedWeights = wTotal > 0
      ? scenarioWeights.map((w) => Math.max(0, w) / wTotal)
      : scenarios.map(() => 1 / scenarios.length);
  } else {
    normalizedWeights = scenarios.map(() => 1 / scenarios.length);
  }
  const pwMean = scenarios.reduce((s, sc, i) => s + sc.stats.mean * normalizedWeights[i]!, 0);

  const decisionMatrix: DecisionMatrixRow[] = scenarios.map((s) => ({
    scenarioId: s.scenarioId,
    scenarioTitle: s.scenarioTitle,
    expectedValue: s.stats.mean,
    worstCase: s.stats.p5,
    bestCase: s.stats.p95,
    volatility: s.stats.stdDev,
    sharpeProxy: s.stats.stdDev > 0 ? s.stats.mean / s.stats.stdDev : 0,
    recommendation: s.scenarioId === best.scenarioId ? "Preferred" :
      s.scenarioId === lowestRisk.scenarioId ? "Low-risk alternative" : "Consider",
  }));

  return {
    outputId,
    scenarios,
    bestMean: best.scenarioId,
    lowestRisk: lowestRisk.scenarioId,
    probabilityWeightedMean: pwMean,
    decisionMatrix,
  };
}

export interface DecisionMatrixRow {
  scenarioId: string;
  scenarioTitle: string;
  expectedValue: number;
  worstCase: number;
  bestCase: number;
  volatility: number;
  sharpeProxy: number;
  recommendation: string;
}

export interface ScenarioComparison {
  outputId: string;
  scenarios: Array<{
    scenarioId: string;
    scenarioTitle: string;
    stats: DistributionStats;
    histogram: HistogramBucket[];
    cdf: CDFPoint[];
  }>;
  bestMean: string;
  lowestRisk: string;
  probabilityWeightedMean: number;
  decisionMatrix: DecisionMatrixRow[];
}

export { buildScenarioCalculate };
