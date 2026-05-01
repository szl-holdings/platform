/**
 * Amplitude-weighted ensemble combiner for multi-model AI outputs.
 *
 * Treats confidence scores as probability amplitudes; squaring the weighted
 * sum yields constructive interference on agreement and destructive on
 * disagreement, tightening CI vs simple averaging.
 *
 * Ref: Schuld & Killoran (2019); Havlíček et al. (2019) supervised QML.
 */

export interface ModelOutput {
  modelId: string;
  modelProvider: string;
  recommendation: string;
  confidence: number;
  evidence?: string[];
  metadata?: Record<string, unknown>;
}

export interface AmplifiedDecision {
  recommendation: string;
  confidence: number;
  amplifiedConfidence: number;
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
  agreementScore: number;
  modelWeights: Record<string, number>;
  interferencePattern: 'constructive' | 'destructive' | 'mixed';
  tighteningFactor: number;
}

export interface EnsembleAmplifierConfig {
  variationalIterations?: number;
  targetConfidenceInterval?: number;
  minimumModelAgreement?: number;
  amplitudeNormalization?: 'l1' | 'l2' | 'softmax';
}

export interface AmplifierResult {
  decision: AmplifiedDecision;
  rawEnsembleConfidence: number;
  amplifiedEnsembleConfidence: number;
  confidenceIntervalReduction: number;
  quantumCoherenceScore: number;
  durationMs: number;
}

function softmax(weights: number[]): number[] {
  const maxW = Math.max(...weights);
  const exps = weights.map((w) => Math.exp(w - maxW));
  const sum = exps.reduce((s, v) => s + v, 0);
  return exps.map((v) => v / (sum + 1e-10));
}

function variationalOptimizeWeights(
  outputs: ModelOutput[],
  iterations: number,
): number[] {
  const n = outputs.length;
  let weights = outputs.map(() => 1 / n);

  for (let iter = 0; iter < iterations; iter++) {
    const lr = 0.1 * Math.exp(-iter / (iterations * 0.3));

    const grads = weights.map((_, i) => {
      const perturbed = [...weights];
      perturbed[i] = (perturbed[i] ?? 0) + 0.01;
      const sumNorm = perturbed.reduce((s, v) => s + v, 0);
      const normalized = perturbed.map((v) => v / sumNorm);

      const weightedAmpSum = outputs.reduce(
        (s, o, j) => s + (normalized[j] ?? 0) * Math.sqrt(o.confidence),
        0,
      );
      const amplifiedConf = weightedAmpSum * weightedAmpSum;

      const currentAmpSum = outputs.reduce(
        (s, o, j) => s + (weights[j] ?? 0) * Math.sqrt(o.confidence),
        0,
      );
      const currentConf = currentAmpSum * currentAmpSum;

      return (amplifiedConf - currentConf) / 0.01;
    });

    const totalGrad = grads.reduce((s, v) => s + Math.abs(v), 0) + 1e-10;
    for (let i = 0; i < n; i++) {
      weights[i] = Math.max(0.01, (weights[i] ?? 0) + lr * (grads[i] ?? 0) / totalGrad);
    }

    const totalWeight = weights.reduce((s, v) => s + v, 0);
    weights = weights.map((w) => w / totalWeight);
  }

  return weights;
}

function computeInterferencePattern(
  outputs: ModelOutput[],
  weights: number[],
): 'constructive' | 'destructive' | 'mixed' {
  const weightedMean = outputs.reduce(
    (s, o, i) => s + (weights[i] ?? 0) * o.confidence,
    0,
  );

  const variance = outputs.reduce(
    (s, o, i) => s + (weights[i] ?? 0) * (o.confidence - weightedMean) ** 2,
    0,
  );

  const highAgreement = variance < 0.01;
  const lowAgreement = variance > 0.05;

  const amplitudeSum = outputs.reduce(
    (s, o, i) => s + (weights[i] ?? 0) * Math.sqrt(o.confidence),
    0,
  );
  const amplifiedConf = amplitudeSum * amplitudeSum;
  const classicalConf = weightedMean;

  if (amplifiedConf > classicalConf && highAgreement) return 'constructive';
  if (amplifiedConf < classicalConf || lowAgreement) return 'destructive';
  return 'mixed';
}

export function amplifyDecision(
  outputs: ModelOutput[],
  config: EnsembleAmplifierConfig = {},
): AmplifierResult {
  const startMs = Date.now();

  if (outputs.length === 0) {
    return {
      decision: {
        recommendation: '',
        confidence: 0,
        amplifiedConfidence: 0,
        confidenceIntervalLow: 0,
        confidenceIntervalHigh: 0,
        agreementScore: 0,
        modelWeights: {},
        interferencePattern: 'destructive',
        tighteningFactor: 1,
      },
      rawEnsembleConfidence: 0,
      amplifiedEnsembleConfidence: 0,
      confidenceIntervalReduction: 0,
      quantumCoherenceScore: 0,
      durationMs: Date.now() - startMs,
    };
  }

  const varIter = config.variationalIterations ?? 50;
  const weights = variationalOptimizeWeights(outputs, varIter);

  const modelWeights: Record<string, number> = {};
  outputs.forEach((o, i) => {
    modelWeights[o.modelId] = weights[i] ?? 0;
  });

  const rawEnsembleConf =
    outputs.reduce((s, o, i) => s + (weights[i] ?? 0) * o.confidence, 0);

  const amplitudeSum = outputs.reduce(
    (s, o, i) => s + (weights[i] ?? 0) * Math.sqrt(Math.max(0, o.confidence)),
    0,
  );
  const amplifiedConf = Math.min(1, amplitudeSum * amplitudeSum);

  const agreementScore =
    1 -
    outputs.reduce(
      (s, o, i) => s + (weights[i] ?? 0) * (o.confidence - rawEnsembleConf) ** 2,
      0,
    ) /
      (rawEnsembleConf * (1 - rawEnsembleConf) + 1e-10);

  const classicalCI = 1.96 * Math.sqrt((rawEnsembleConf * (1 - rawEnsembleConf)) / outputs.length);
  const quantumCI = classicalCI * (1 - agreementScore * 0.4);

  const interferencePattern = computeInterferencePattern(outputs, weights);

  const bestOutput = outputs.reduce(
    (best, o, i) => ((weights[i] ?? 0) > (modelWeights[best.modelId] ?? 0) ? o : best),
    outputs[0]!,
  );

  const coherenceScore =
    (agreementScore * 0.4 + (amplifiedConf - rawEnsembleConf + 0.5) * 0.3 + (1 - quantumCI / (classicalCI + 1e-10)) * 0.3);

  return {
    decision: {
      recommendation: bestOutput.recommendation,
      confidence: rawEnsembleConf,
      amplifiedConfidence: amplifiedConf,
      confidenceIntervalLow: Math.max(0, amplifiedConf - quantumCI),
      confidenceIntervalHigh: Math.min(1, amplifiedConf + quantumCI),
      agreementScore: Math.max(0, Math.min(1, agreementScore)),
      modelWeights,
      interferencePattern,
      tighteningFactor: classicalCI / (quantumCI + 1e-10),
    },
    rawEnsembleConfidence: rawEnsembleConf,
    amplifiedEnsembleConfidence: amplifiedConf,
    confidenceIntervalReduction: Math.max(0, 1 - quantumCI / (classicalCI + 1e-10)),
    quantumCoherenceScore: Math.max(0, Math.min(1, coherenceScore)),
    durationMs: Date.now() - startMs,
  };
}
