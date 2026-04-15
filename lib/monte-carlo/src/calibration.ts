import { distributionStats, type DistributionStats } from "./distributions.js";
import type { ScenarioDefinition } from "./schema.js";
import type { SimulationResult } from "./engine.js";

export interface HistoricalDataPoint {
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  date?: string;
  weight?: number;
}

export interface CalibrationResult {
  scenarioId: string;
  sampledOutputs: Record<string, DistributionStats>;
  historicalOutputs: Record<string, DistributionStats>;
  calibrationScore: Record<string, number>;
  meanAbsoluteError: Record<string, number>;
  suggestions: CalibrationSuggestion[];
  fittedParameters: FittedParameter[];
  backtestAccuracy: number;
  timestamp: string;
}

export interface CalibrationSuggestion {
  inputId: string;
  currentMean: number;
  suggestedMean: number;
  currentStdDev: number;
  suggestedStdDev: number;
  reason: string;
}

export interface FittedParameter {
  inputId: string;
  inputLabel: string;
  distributionType: string;
  fittedParams: Record<string, number>;
  fittingMethod: "MLE" | "MoM";
  rmse: number;
}

function fitMLE(distributionType: string, samples: number[]): { params: Record<string, number>; method: "MLE" | "MoM" } | null {
  if (samples.length < 3) return null;
  const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
  const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  const sorted = [...samples].sort((a, b) => a - b);

  switch (distributionType) {
    case "normal":
      return { params: { mean, stdDev }, method: "MLE" };

    case "log_normal": {
      const positiveSamples = samples.filter((v) => v > 0);
      if (positiveSamples.length < 3) return null;
      const logMean = positiveSamples.reduce((s, v) => s + Math.log(v), 0) / positiveSamples.length;
      const logVar = positiveSamples.reduce((s, v) => s + (Math.log(v) - logMean) ** 2, 0) / positiveSamples.length;
      return { params: { mean: logMean, stdDev: Math.sqrt(logVar) }, method: "MLE" };
    }

    case "uniform":
      return { params: { min: sorted[0]!, max: sorted[sorted.length - 1]! }, method: "MLE" };

    case "triangular": {
      const min = sorted[0]!;
      const max = sorted[sorted.length - 1]!;
      const mode = Math.max(min, Math.min(max, 3 * mean - min - max));
      return { params: { min, mode, max }, method: "MoM" };
    }

    case "beta": {
      if (mean <= 0 || mean >= 1 || variance <= 0) return null;
      const factor = mean * (1 - mean) / variance - 1;
      const alpha = Math.max(0.01, mean * factor);
      const beta = Math.max(0.01, (1 - mean) * factor);
      return { params: { alpha, beta }, method: "MoM" };
    }

    case "poisson":
      return { params: { lambda: Math.max(0.001, mean) }, method: "MLE" };

    case "constant":
      return { params: { value: mean }, method: "MLE" };

    default:
      return { params: { mean, stdDev }, method: "MLE" };
  }
}

function computeFittedRMSE(distributionType: string, fittedParams: Record<string, number>, samples: number[]): number {
  const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
  const fittedMean = fittedParams["mean"] ?? fittedParams["value"] ?? fittedParams["lambda"] ?? mean;
  return Math.sqrt(samples.reduce((s, v) => s + (v - fittedMean) ** 2, 0) / samples.length);
}

export interface BacktestResult {
  scenarioId: string;
  period: string;
  predictedStats: DistributionStats;
  actualStats: DistributionStats;
  coveragePct: number;
  mae: number;
  rmse: number;
  hitRateP10P90: number;
  notes: string;
}

export function calibrate(
  scenario: ScenarioDefinition,
  historicalData: HistoricalDataPoint[],
  simulationResult: SimulationResult
): CalibrationResult {
  const calibrationScore: Record<string, number> = {};
  const meanAbsoluteError: Record<string, number> = {};
  const suggestions: CalibrationSuggestion[] = [];

  const historicalOutputsRaw: Record<string, number[]> = {};
  for (const m of scenario.outputs) {
    historicalOutputsRaw[m.id] = [];
  }

  for (const dp of historicalData) {
    for (const m of scenario.outputs) {
      const val = dp.outputs[m.id];
      if (val !== undefined && isFinite(val)) {
        historicalOutputsRaw[m.id]!.push(val);
      }
    }
  }

  const historicalOutputs: Record<string, DistributionStats> = {};
  const sampledOutputs: Record<string, DistributionStats> = {};

  for (const m of scenario.outputs) {
    const hist = historicalOutputsRaw[m.id]!;
    if (hist.length === 0) continue;

    historicalOutputs[m.id] = distributionStats(hist);
    sampledOutputs[m.id] = simulationResult.results[m.id]!.stats;

    const histStats = historicalOutputs[m.id]!;
    const simStats = sampledOutputs[m.id]!;

    const meanError = Math.abs(simStats.mean - histStats.mean) / Math.max(Math.abs(histStats.mean), 1);
    meanAbsoluteError[m.id] = meanError;

    const score = Math.max(0, 1 - meanError);
    calibrationScore[m.id] = score;
  }

  const fittedParameters: FittedParameter[] = [];

  for (const input of scenario.inputs) {
    const inputSamples = simulationResult.inputSamples[input.id];
    if (!inputSamples || inputSamples.length === 0) continue;

    const currentStats = distributionStats(inputSamples);
    const historicalInputSamples = historicalData.map((dp) => dp.inputs[input.id]).filter((v): v is number => v !== undefined && isFinite(v));
    if (historicalInputSamples.length < 5) continue;

    const historicalStats = distributionStats(historicalInputSamples);

    if (Math.abs(currentStats.mean - historicalStats.mean) / Math.max(Math.abs(historicalStats.mean), 1) > 0.15) {
      suggestions.push({
        inputId: input.id,
        currentMean: currentStats.mean,
        suggestedMean: historicalStats.mean,
        currentStdDev: currentStats.stdDev,
        suggestedStdDev: historicalStats.stdDev,
        reason: `Historical mean (${historicalStats.mean.toFixed(3)}) differs significantly from simulation mean (${currentStats.mean.toFixed(3)})`,
      });
    }

    const distType = input.distribution.type;
    const fit = fitMLE(distType, historicalInputSamples);
    if (fit !== null) {
      fittedParameters.push({
        inputId: input.id,
        inputLabel: input.label,
        distributionType: distType,
        fittedParams: fit.params,
        fittingMethod: fit.method,
        rmse: computeFittedRMSE(distType, fit.params, historicalInputSamples),
      });
    }
  }

  const overallAccuracy = Object.values(calibrationScore).length > 0
    ? Object.values(calibrationScore).reduce((a, b) => a + b, 0) / Object.values(calibrationScore).length
    : 0;

  return {
    scenarioId: scenario.id,
    sampledOutputs,
    historicalOutputs,
    calibrationScore,
    meanAbsoluteError,
    suggestions,
    fittedParameters,
    backtestAccuracy: overallAccuracy,
    timestamp: new Date().toISOString(),
  };
}

export function backtest(
  scenario: ScenarioDefinition,
  historicalData: HistoricalDataPoint[],
  simulationResult: SimulationResult,
  outputId: string
): BacktestResult {
  const metric = scenario.outputs.find((o) => o.id === outputId);
  if (!metric) throw new Error(`Output '${outputId}' not found`);

  const actualValues = historicalData.map((dp) => dp.outputs[outputId]).filter((v): v is number => v !== undefined && isFinite(v));
  if (actualValues.length === 0) throw new Error("No historical data for this output");

  const actualStats = distributionStats(actualValues);
  const predictedStats = simulationResult.results[outputId]!.stats;

  const coverageCount = actualValues.filter(
    (v) => v >= predictedStats.p10 && v <= predictedStats.p90
  ).length;
  const coveragePct = (coverageCount / actualValues.length) * 100;

  const mae = actualValues.reduce((sum, v) => sum + Math.abs(v - predictedStats.mean), 0) / actualValues.length;
  const rmse = Math.sqrt(actualValues.reduce((sum, v) => sum + (v - predictedStats.mean) ** 2, 0) / actualValues.length);
  const hitRate = coveragePct;

  const dates = historicalData.map((dp) => dp.date).filter(Boolean);
  const period = dates.length > 0 ? `${dates[0]} to ${dates[dates.length - 1]}` : "unknown period";

  return {
    scenarioId: scenario.id,
    period,
    predictedStats,
    actualStats,
    coveragePct,
    mae,
    rmse,
    hitRateP10P90: hitRate,
    notes: coveragePct >= 70
      ? "Good calibration — historical outcomes fall within P10-P90 band at target rate"
      : `Model may need recalibration — only ${coveragePct.toFixed(1)}% of historical outcomes fall within P10-P90 band`,
  };
}
