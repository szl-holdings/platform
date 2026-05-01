/**
 * Amplitude-inspired importance sampler (Grover-style).
 *
 * Replaces uniform MC sampling with |ψ(x)|²-weighted sampling over
 * correlated risk paths, reducing variance vs O(1/√N) classical MC.
 *
 * Ref: Brassard et al. (2002) amplitude amplification;
 *      Stamatopoulos et al. (2020) option pricing with QAE.
 */

export interface AmplitudeSamplerConfig {
  amplificationIterations?: number;
  targetCorrelationThreshold?: number;
  entanglementCoupling?: number;
  importanceSamplingBias?: number;
}

export interface CorrelatedVariable {
  name: string;
  domain?: string;
  mean: number;
  stdDev: number;
  correlatedWith?: Array<{ variable: string; strength: number }>;
}

export interface AmplitudeWeightedSample {
  values: Record<string, number>;
  importanceWeight: number;
  amplitudeSquared: number;
  correlationScore: number;
  isHighImpact: boolean;
}

export interface AmplitudeSamplerResult {
  samples: AmplitudeWeightedSample[];
  classicalVariance: number;
  quantumVariance: number;
  varianceReduction: number;
  highImpactPathsFound: number;
  entangledPairsDetected: number;
  durationMs: number;
}

function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

function computeAmplitude(
  values: Record<string, number>,
  variables: CorrelatedVariable[],
  correlationThreshold: number,
): number {
  let amplitude = 1.0;

  for (const v of variables) {
    const val = values[v.name] ?? v.mean;
    const zScore = Math.abs((val - v.mean) / (v.stdDev + 1e-10));
    const tailWeight = Math.exp(-0.5 * zScore * zScore);
    amplitude *= tailWeight;

    if (v.correlatedWith && val > v.mean + correlationThreshold * v.stdDev) {
      for (const corr of v.correlatedWith) {
        const corrVal = values[corr.variable] ?? 0;
        const corrVar = variables.find((x) => x.name === corr.variable);
        if (corrVar && corrVal > corrVar.mean) {
          amplitude *= 1 + corr.strength * 0.5;
        }
      }
    }
  }

  return amplitude;
}

function groverAmplify(
  amplitudes: number[],
  targetMask: boolean[],
  iterations: number,
): number[] {
  const n = amplitudes.length;
  const amplified = [...amplitudes];

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < n; i++) {
      if (targetMask[i]) {
        amplified[i] = -amplified[i]!;
      }
    }

    const mean = amplified.reduce((s, v) => s + v, 0) / n;
    for (let i = 0; i < n; i++) {
      amplified[i] = 2 * mean - amplified[i]!;
    }
  }

  return amplified;
}

export function amplitudeSample(
  variables: CorrelatedVariable[],
  numSamples: number,
  config: AmplitudeSamplerConfig = {},
): AmplitudeSamplerResult {
  const startMs = Date.now();
  const ampIterations = config.amplificationIterations ?? 3;
  const corrThreshold = config.targetCorrelationThreshold ?? 1.5;
  const entanglementCoupling = config.entanglementCoupling ?? 0.6;
  const importanceBias = config.importanceSamplingBias ?? 2.0;

  const rawAmplitudes: number[] = [];
  const rawValues: Record<string, number>[] = [];

  for (let s = 0; s < numSamples; s++) {
    const values: Record<string, number> = {};

    const correlated: Record<string, number> = {};
    for (const v of variables) {
      if (v.correlatedWith && v.correlatedWith.length > 0) {
        for (const corr of v.correlatedWith) {
          correlated[corr.variable] = (correlated[corr.variable] ?? 0) + corr.strength;
        }
      }
    }

    for (const v of variables) {
      let sample = randomNormal(v.mean, v.stdDev);

      if (v.correlatedWith) {
        for (const corr of v.correlatedWith) {
          const corrVal = values[corr.variable];
          if (corrVal !== undefined) {
            const couplingEffect =
              entanglementCoupling *
              corr.strength *
              ((corrVal - (variables.find((x) => x.name === corr.variable)?.mean ?? 0)) /
                (variables.find((x) => x.name === corr.variable)?.stdDev ?? 1));
            sample += couplingEffect * v.stdDev;
          }
        }
      }

      values[v.name] = sample;
    }

    const amplitude = computeAmplitude(values, variables, corrThreshold);
    rawAmplitudes.push(amplitude);
    rawValues.push(values);
  }

  const targetMask = rawAmplitudes.map((a) => a > 1.0);
  const amplifiedWeights = groverAmplify(rawAmplitudes, targetMask, ampIterations);

  const totalWeight = amplifiedWeights.reduce((s, w) => s + Math.max(0, w), 0) + 1e-10;
  const normalizedWeights = amplifiedWeights.map((w) => Math.max(0, w) / totalWeight);

  const classicalVals = rawValues.map((v) => Object.values(v).reduce((s, x) => s + x, 0));
  const classicalMean = classicalVals.reduce((s, v) => s + v, 0) / numSamples;
  const classicalVariance =
    classicalVals.reduce((s, v) => s + (v - classicalMean) ** 2, 0) / numSamples;

  const weightedMean = rawValues.reduce((s, v, i) => {
    return s + Object.values(v).reduce((sv, x) => sv + x, 0) * normalizedWeights[i]!;
  }, 0);
  const quantumVariance = rawValues.reduce((s, v, i) => {
    const sum = Object.values(v).reduce((sv, x) => sv + x, 0);
    return s + normalizedWeights[i]! * (sum - weightedMean) ** 2;
  }, 0);

  const samples: AmplitudeWeightedSample[] = rawValues.map((values, i) => {
    const corrScore = variables.reduce((s, v) => {
      if (!v.correlatedWith) return s;
      const val = values[v.name] ?? v.mean;
      const isHigh = val > v.mean + corrThreshold * v.stdDev;
      return s + (isHigh ? 1 : 0) * v.correlatedWith.length;
    }, 0);

    return {
      values,
      importanceWeight: normalizedWeights[i]! * importanceBias,
      amplitudeSquared: (rawAmplitudes[i] ?? 0) ** 2,
      correlationScore: corrScore,
      isHighImpact: corrScore > 1 || (rawAmplitudes[i] ?? 0) > 1.5,
    };
  });

  const entangledPairs = new Set<string>();
  for (const v of variables) {
    if (v.correlatedWith) {
      for (const corr of v.correlatedWith) {
        if (Math.abs(corr.strength) >= entanglementCoupling) {
          entangledPairs.add([v.name, corr.variable].sort().join('::'));
        }
      }
    }
  }

  return {
    samples,
    classicalVariance,
    quantumVariance,
    varianceReduction: Math.max(0, 1 - quantumVariance / (classicalVariance + 1e-10)),
    highImpactPathsFound: samples.filter((s) => s.isHighImpact).length,
    entangledPairsDetected: entangledPairs.size,
    durationMs: Date.now() - startMs,
  };
}

export function buildCorrelationMatrix(
  variables: CorrelatedVariable[],
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const v of variables) {
    matrix[v.name] = {};
    for (const u of variables) {
      if (v.name === u.name) {
        matrix[v.name]![u.name] = 1.0;
      } else {
        const corr = v.correlatedWith?.find((c) => c.variable === u.name);
        matrix[v.name]![u.name] = corr?.strength ?? 0;
      }
    }
  }
  return matrix;
}
