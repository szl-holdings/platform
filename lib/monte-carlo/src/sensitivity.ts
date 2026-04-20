import { type Distribution, sample } from './distributions.js';
import type { SimulationResult } from './engine.js';
import type { InputVariable, ScenarioDefinition } from './schema.js';

export interface TornadoEntry {
  inputId: string;
  inputLabel: string;
  outputId: string;
  outputLabel: string;
  lowValue: number;
  highValue: number;
  swing: number;
  impactPct: number;
  rank: number;
  direction: 'positive' | 'negative' | 'mixed';
}

export interface SensitivityReport {
  outputId: string;
  outputLabel: string;
  baselineMean: number;
  tornado: TornadoEntry[];
  topDriver: string;
  topDriverLabel: string;
  criticalAssumptions: CriticalAssumption[];
  narrative: Record<string, string>;
}

export interface CriticalAssumption {
  inputId: string;
  inputLabel: string;
  percentageOfTotalVariance: number;
  summary: string;
}

export function computeSensitivity(
  scenario: ScenarioDefinition,
  simulationResult: SimulationResult,
  outputId: string,
  samplesPerVariable = 200,
): SensitivityReport {
  const outputMetric = scenario.outputs.find((o) => o.id === outputId);
  if (!outputMetric) throw new Error(`Output '${outputId}' not found`);

  const baselineInputs: Record<string, number> = {};
  for (const v of scenario.inputs) {
    baselineInputs[v.id] = expectedValue(v.distribution);
  }

  const baselineOutputs = scenario.calculate(baselineInputs, 0);
  const baselineMean = baselineOutputs[outputId] ?? 0;

  const correlations = simulationResult.correlationMatrix;
  const outputCorrelations = correlations[outputId] ?? {};

  const tornadoEntries: TornadoEntry[] = [];
  const totalSwingSum = scenario.inputs.reduce((sum, v) => {
    const r = outputCorrelations[v.id] ?? 0;
    const inputStats = simulationResult.inputSamples[v.id];
    if (!inputStats || inputStats.length === 0) return sum;
    const inputStdDev = Math.sqrt(
      inputStats.reduce((s, x) => {
        const mean = inputStats.reduce((a, b) => a + b, 0) / inputStats.length;
        return s + (x - mean) ** 2;
      }, 0) / inputStats.length,
    );
    return sum + Math.abs(r) * inputStdDev;
  }, 0);

  for (const input of scenario.inputs) {
    const r = outputCorrelations[input.id] ?? 0;
    const inputSamples = simulationResult.inputSamples[input.id] ?? [];
    if (inputSamples.length === 0) continue;

    const inputMean = inputSamples.reduce((a, b) => a + b, 0) / inputSamples.length;
    const inputVar =
      inputSamples.reduce((s, x) => s + (x - inputMean) ** 2, 0) / inputSamples.length;
    const inputStdDev = Math.sqrt(inputVar);

    const perturbedOutputs: number[] = [];
    const sampleCount = Math.max(50, Math.min(samplesPerVariable, 1000));
    for (let j = 0; j < sampleCount; j++) {
      const perturbedInputs = { ...baselineInputs };
      perturbedInputs[input.id] = sample(input.distribution);
      try {
        const out = scenario.calculate(perturbedInputs, j)[outputId];
        if (out !== undefined && isFinite(out)) perturbedOutputs.push(out);
      } catch {
        /* skip invalid iteration */
      }
    }

    let lowOutput: number, highOutput: number;
    if (perturbedOutputs.length >= 2) {
      const sorted = perturbedOutputs.sort((a, b) => a - b);
      const p10Idx = Math.floor(sorted.length * 0.1);
      const p90Idx = Math.min(Math.floor(sorted.length * 0.9), sorted.length - 1);
      lowOutput = sorted[p10Idx] ?? baselineMean;
      highOutput = sorted[p90Idx] ?? baselineMean;
    } else {
      lowOutput = baselineMean;
      highOutput = baselineMean;
    }

    const swing = Math.abs(highOutput - lowOutput);
    const impactPct = totalSwingSum > 0 ? ((Math.abs(r) * inputStdDev) / totalSwingSum) * 100 : 0;

    let direction: 'positive' | 'negative' | 'mixed' = 'mixed';
    if (r > 0.1) direction = 'positive';
    else if (r < -0.1) direction = 'negative';

    tornadoEntries.push({
      inputId: input.id,
      inputLabel: input.label,
      outputId,
      outputLabel: outputMetric.label,
      lowValue: Math.min(lowOutput, highOutput),
      highValue: Math.max(lowOutput, highOutput),
      swing,
      impactPct,
      rank: 0,
      direction,
    });
  }

  tornadoEntries.sort((a, b) => b.impactPct - a.impactPct);
  tornadoEntries.forEach((e, i) => {
    e.rank = i + 1;
  });

  const topDriver = tornadoEntries[0];
  const criticalAssumptions: CriticalAssumption[] = tornadoEntries.slice(0, 5).map((e) => ({
    inputId: e.inputId,
    inputLabel: e.inputLabel,
    percentageOfTotalVariance: e.impactPct,
    summary: buildAssumptionSummary(e),
  }));

  const narrative: Record<string, string> = {};
  for (const entry of tornadoEntries.slice(0, 3)) {
    narrative[entry.inputId] = buildNarrative(entry, outputMetric.label, baselineMean);
  }

  return {
    outputId,
    outputLabel: outputMetric.label,
    baselineMean,
    tornado: tornadoEntries,
    topDriver: topDriver?.inputId ?? '',
    topDriverLabel: topDriver?.inputLabel ?? '',
    criticalAssumptions,
    narrative,
  };
}

function expectedValue(dist: Distribution): number {
  switch (dist.type) {
    case 'normal':
      return dist.mean;
    case 'log_normal':
      return dist.mean;
    case 'uniform':
      return (dist.min + dist.max) / 2;
    case 'triangular':
      return (dist.min + dist.mode + dist.max) / 3;
    case 'beta': {
      const raw = dist.alpha / (dist.alpha + dist.beta);
      const lo = dist.min ?? 0;
      const hi = dist.max ?? 1;
      return lo + raw * (hi - lo);
    }
    case 'poisson':
      return dist.lambda;
    case 'constant':
      return dist.value;
    case 'custom': {
      if (dist.weights) {
        const total = dist.weights.reduce((a, b) => a + b, 0);
        return dist.values.reduce((s, v, i) => s + v * (dist.weights![i]! / total), 0);
      }
      return dist.values.reduce((a, b) => a + b, 0) / dist.values.length;
    }
  }
}

function buildAssumptionSummary(entry: TornadoEntry): string {
  return `${entry.inputLabel} accounts for ${entry.impactPct.toFixed(1)}% of ${entry.outputLabel} variance (swing: ${(entry.highValue - entry.lowValue).toFixed(2)})`;
}

function buildNarrative(entry: TornadoEntry, outputLabel: string, baseline: number): string {
  const pct = entry.impactPct.toFixed(0);
  const dir =
    entry.direction === 'positive'
      ? 'positively'
      : entry.direction === 'negative'
        ? 'negatively'
        : 'ambiguously';
  return `${outputLabel} is ${pct}% driven by ${entry.inputLabel}, which ${dir} correlates with the outcome. Moving from P10 to P90 of this variable shifts ${outputLabel} by ${Math.abs(entry.highValue - entry.lowValue).toFixed(2)} (from ${entry.lowValue.toFixed(2)} to ${entry.highValue.toFixed(2)}).`;
}
