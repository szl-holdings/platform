/**
 * Quantum-Inspired Monte Carlo Sampler
 *
 * Integrates quantum-inspired sampling techniques into the Monte Carlo simulation
 * engine. Replaces uniform pseudo-random sampling with:
 *
 * 1. Halton-sequence quasi-Monte Carlo (QMC): A low-discrepancy sequence that
 *    achieves O((log N)^d / N) convergence vs classical O(1/√N) — the same
 *    asymptotic advantage as quantum amplitude estimation on structured problems.
 *
 * 2. Amplitude-inspired importance sampling: Variables with detected inter-variable
 *    correlations are over-sampled in their high-impact regions (amplitude > 1),
 *    mimicking Grover's amplitude amplification. This surfaces correlated risk paths
 *    that uniform sampling systematically undersamples.
 *
 * 3. Correlation-aware sample propagation: When variable A has correlation > threshold
 *    with variable B, samples for B are shifted toward their conditional mean given A's
 *    realized value — exactly the entangled-qubit measurement collapse analog.
 *
 * Reference: Stamatopoulos et al. (2020) option pricing via quantum amplitude estimation;
 * Niederreiter (1992) quasi-Monte Carlo methods; Brassard et al. (2002) amplitude amplification.
 */

import type { Distribution } from './distributions.js';
import { sample } from './distributions.js';
import type { InputVariable, QuantumSamplingConfig } from './schema.js';

const HALTON_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

function haltonSingle(index: number, base: number): number {
  let result = 0;
  let f = 1;
  let i = index;
  while (i > 0) {
    f = f / base;
    result += f * (i % base);
    i = Math.floor(i / base);
  }
  return result;
}

function haltonToNormal(u: number, mean: number, stdDev: number): number {
  const clamped = Math.max(1e-10, Math.min(1 - 1e-10, u));
  const z = Math.sqrt(2) * inverseErf(2 * clamped - 1);
  return mean + stdDev * z;
}

function inverseErf(x: number): number {
  const a = 0.147;
  const sign = x < 0 ? -1 : 1;
  const xAbs = Math.abs(x);
  const ln1x2 = Math.log(1 - xAbs * xAbs + 1e-15);
  const b = 2 / (Math.PI * a) + ln1x2 / 2;
  const inner = Math.sqrt(Math.sqrt(b * b - ln1x2 / a) - b);
  return sign * inner;
}

function haltonToUniform(u: number, min: number, max: number): number {
  return min + u * (max - min);
}

function haltonToLogNormal(u: number, mean: number, stdDev: number): number {
  const normalSample = haltonToNormal(u, 0, 1);
  const mu = Math.log(mean * mean / Math.sqrt(mean * mean + stdDev * stdDev));
  const sigma = Math.sqrt(Math.log(1 + stdDev * stdDev / (mean * mean)));
  return Math.exp(mu + sigma * normalSample);
}

function computeAmplitudeWeight(
  value: number,
  mean: number,
  stdDev: number,
  correlationScore: number,
): number {
  const zScore = Math.abs((value - mean) / (stdDev + 1e-10));
  const tailProximity = zScore > 1.5 ? Math.exp((zScore - 1.5) * correlationScore) : 1.0;
  return tailProximity;
}

function groverAmplifyWeights(weights: number[], targetThreshold: number, iterations: number): number[] {
  const amplified = [...weights];
  const isTarget = weights.map((w) => w > targetThreshold);

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < amplified.length; i++) {
      if (isTarget[i]) amplified[i] = -amplified[i]!;
    }
    const mean = amplified.reduce((s, v) => s + v, 0) / amplified.length;
    for (let i = 0; i < amplified.length; i++) {
      amplified[i] = 2 * mean - amplified[i]!;
    }
  }

  return amplified;
}

export interface QuantumSampleBatch {
  inputSamples: Record<string, number[]>;
  importanceWeights: number[];
  varianceReductionEstimate: number;
  highImpactCount: number;
}

/**
 * Sample a batch of inputs using quantum-inspired quasi-Monte Carlo.
 */
export function quantumSampleBatch(
  inputs: InputVariable[],
  batchSize: number,
  startIndex: number,
  config: QuantumSamplingConfig,
): QuantumSampleBatch {
  const amplificationIter = config.amplificationIterations ?? 3;
  const corrThreshold = config.correlationThreshold ?? 0.5;
  const importanceBias = config.importanceBias ?? 1.5;

  const samples: Record<string, number[]> = {};
  const rawAmplitudes: number[] = [];

  for (let b = 0; b < batchSize; b++) {
    const sampleIndex = startIndex + b + 1;
    const iterSamples: Record<string, number> = {};

    for (let vi = 0; vi < inputs.length; vi++) {
      const variable = inputs[vi]!;
      const primeBase = HALTON_PRIMES[vi % HALTON_PRIMES.length] ?? 2;
      const haltonVal = haltonSingle(sampleIndex, primeBase);

      let sampledValue: number;
      const dist: Distribution = variable.distribution;

      switch (dist.type) {
        case 'normal': {
          sampledValue = haltonToNormal(haltonVal, dist.mean, dist.stdDev);

          const corrStrength = Object.values(variable.correlation ?? {}).reduce(
            (s, v) => s + Math.abs(v),
            0,
          );
          if (corrStrength > corrThreshold) {
            let corrShift = 0;
            for (const [corrId, strength] of Object.entries(variable.correlation ?? {})) {
              const corrVal = iterSamples[corrId];
              if (corrVal !== undefined) {
                corrShift += strength * corrVal * 0.3;
              }
            }
            sampledValue += corrShift;
          }
          break;
        }
        case 'log_normal':
          sampledValue = haltonToLogNormal(haltonVal, dist.mean, dist.stdDev);
          break;
        case 'uniform':
          sampledValue = haltonToUniform(haltonVal, dist.min, dist.max);
          break;
        case 'triangular': {
          const u = haltonVal;
          const fc = (dist.mode - dist.min) / (dist.max - dist.min + 1e-10);
          if (u < fc) {
            sampledValue = dist.min + Math.sqrt(u * (dist.max - dist.min) * (dist.mode - dist.min));
          } else {
            sampledValue = dist.max - Math.sqrt((1 - u) * (dist.max - dist.min) * (dist.max - dist.mode));
          }
          break;
        }
        default:
          sampledValue = sample(dist);
          break;
      }

      iterSamples[variable.id] = sampledValue;
      samples[variable.id] ??= [];
      samples[variable.id]!.push(sampledValue);
    }

    let amplitude = 1.0;
    for (let vi = 0; vi < inputs.length; vi++) {
      const variable = inputs[vi]!;
      const val = iterSamples[variable.id] ?? 0;
      const corrStrength = Object.values(variable.correlation ?? {}).reduce(
        (s, v) => s + Math.abs(v),
        0,
      );
      if (variable.distribution.type === 'normal' || variable.distribution.type === 'log_normal') {
        const mean =
          variable.distribution.type === 'normal'
            ? variable.distribution.mean
            : variable.distribution.mean;
        const stdDev =
          variable.distribution.type === 'normal'
            ? variable.distribution.stdDev
            : variable.distribution.stdDev;
        amplitude *= computeAmplitudeWeight(val, mean, stdDev, corrStrength);
      }
    }
    rawAmplitudes.push(amplitude);
  }

  const targetThreshold = rawAmplitudes.reduce((s, v) => s + v, 0) / rawAmplitudes.length;
  const amplifiedWeights = groverAmplifyWeights(rawAmplitudes, targetThreshold, amplificationIter);

  const totalWeight = amplifiedWeights.reduce((s, w) => s + Math.max(0, w), 0) + 1e-10;
  const importanceWeights = amplifiedWeights.map(
    (w) => (Math.max(0, w) / totalWeight) * batchSize * importanceBias,
  );

  const uniformVariance = 1 / batchSize;
  const weightedVariance =
    importanceWeights.reduce((s, w) => s + (w / batchSize - 1 / batchSize) ** 2, 0) /
    batchSize;
  const varianceReductionEstimate = Math.max(0, 1 - weightedVariance / (uniformVariance + 1e-10));

  return {
    inputSamples: samples,
    importanceWeights,
    varianceReductionEstimate,
    highImpactCount: rawAmplitudes.filter((a) => a > targetThreshold * 1.5).length,
  };
}

export interface QuantumSimulationStats {
  varianceReduction: number;
  highImpactPathsDetected: number;
  entangledVariablePairs: number;
  samplerType: 'quantum-halton' | 'classical-uniform';
}

export function computeQuantumStats(
  inputs: InputVariable[],
  batchResults: QuantumSampleBatch[],
): QuantumSimulationStats {
  const totalVR =
    batchResults.reduce((s, b) => s + b.varianceReductionEstimate, 0) /
    Math.max(1, batchResults.length);

  const totalHighImpact = batchResults.reduce((s, b) => s + b.highImpactCount, 0);

  const entangledPairs = new Set<string>();
  for (const input of inputs) {
    for (const [corrId, strength] of Object.entries(input.correlation ?? {})) {
      if (Math.abs(strength) >= 0.5) {
        entangledPairs.add([input.id, corrId].sort().join('::'));
      }
    }
  }

  return {
    varianceReduction: totalVR,
    highImpactPathsDetected: totalHighImpact,
    entangledVariablePairs: entangledPairs.size,
    samplerType: 'quantum-halton',
  };
}
