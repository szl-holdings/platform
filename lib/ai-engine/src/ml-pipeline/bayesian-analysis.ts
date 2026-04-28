// ---------------------------------------------------------------------------
// Bayesian Analysis Engine
// Beta-Binomial model for conversion/binary metrics
// Normal-Normal model for continuous metrics
// Thompson sampling for multi-armed bandit mode
// ---------------------------------------------------------------------------

export interface BetaParams {
  alpha: number;
  beta: number;
}

export interface NormalParams {
  mu: number;
  kappa: number;
  alpha: number;
  beta: number;
}

export interface BayesianConversionResult {
  variantKey: string;
  alpha: number;
  beta: number;
  posteriorMean: number;
  credibleInterval: [number, number];
  probabilityToBeatControl: number | null;
  expectedLift: number | null;
  expectedLiftInterval: [number, number] | null;
  thompsonWeight: number;
}

export interface BayesianContinuousResult {
  variantKey: string;
  posteriorMu: number;
  posteriorSigma: number;
  credibleInterval: [number, number];
  probabilityToBeatControl: number | null;
  expectedLift: number | null;
  thompsonWeight: number;
}

export interface BayesianAnalysisInput {
  variantKey: string;
  conversions: number;
  exposures: number;
  metricSum?: number;
  metricSumSq?: number;
  isControl?: boolean;
}

export interface BayesianAnalysisResult {
  analysisType: 'beta_binomial' | 'normal_normal';
  variants: (BayesianConversionResult | BayesianContinuousResult)[];
  recommendedVariant: string | null;
  isBandit: boolean;
  banditWeights: Record<string, number>;
  minSampleSizeReached: boolean;
  sampleSizeRecommendation: number;
}

const MONTE_CARLO_SAMPLES = 10_000;

function betaSample(alpha: number, beta: number): number {
  if (alpha <= 0 || beta <= 0) return 0.5;
  const x = gammaSample(alpha);
  const y = gammaSample(beta);
  if (x + y === 0) return 0.5;
  return x / (x + y);
}

function gammaSample(shape: number): number {
  if (shape < 1) return gammaSample(1 + shape) * Math.random() ** (1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number;
    let v: number;
    do {
      x = normalSample();
      v = (1 + c * x) ** 3;
    } while (v <= 0);
    const u = Math.random();
    if (u < 1 - 0.0331 * (x * x) ** 2) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function normalSample(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function betaCredibleInterval(alpha: number, beta: number, ci = 0.95): [number, number] {
  const samples: number[] = [];
  for (let i = 0; i < 2000; i++) {
    samples.push(betaSample(alpha, beta));
  }
  samples.sort((a, b) => a - b);
  const lower = Math.floor(((1 - ci) / 2) * samples.length);
  const upper = Math.ceil((1 - (1 - ci) / 2) * samples.length);
  return [samples[lower] ?? 0, samples[upper] ?? 1];
}

function computeProbabilityToBeatControl(
  treatAlpha: number,
  treatBeta: number,
  controlAlpha: number,
  controlBeta: number,
): number {
  let wins = 0;
  for (let i = 0; i < MONTE_CARLO_SAMPLES; i++) {
    const treat = betaSample(treatAlpha, treatBeta);
    const ctrl = betaSample(controlAlpha, controlBeta);
    if (treat > ctrl) wins++;
  }
  return wins / MONTE_CARLO_SAMPLES;
}

function computeExpectedLift(
  treatAlpha: number,
  treatBeta: number,
  controlAlpha: number,
  controlBeta: number,
): { lift: number; interval: [number, number] } {
  const lifts: number[] = [];
  for (let i = 0; i < MONTE_CARLO_SAMPLES; i++) {
    const treat = betaSample(treatAlpha, treatBeta);
    const ctrl = betaSample(controlAlpha, controlBeta);
    if (ctrl > 0) {
      lifts.push((treat - ctrl) / ctrl);
    }
  }
  lifts.sort((a, b) => a - b);
  const mean = lifts.reduce((s, v) => s + v, 0) / lifts.length;
  const lower = lifts[Math.floor(0.05 * lifts.length)] ?? lifts[0] ?? 0;
  const upper = lifts[Math.ceil(0.95 * lifts.length)] ?? lifts[lifts.length - 1] ?? 0;
  return { lift: mean, interval: [lower, upper] };
}

export function bayesianConversionAnalysis(
  variants: BayesianAnalysisInput[],
  priorAlpha = 1,
  priorBeta = 1,
): BayesianConversionResult[] {
  return variants.map((v) => {
    const alpha = priorAlpha + v.conversions;
    const beta = priorBeta + (v.exposures - v.conversions);
    const posteriorMean = alpha / (alpha + beta);
    const ci = betaCredibleInterval(alpha, beta);
    return {
      variantKey: v.variantKey,
      alpha,
      beta,
      posteriorMean,
      credibleInterval: ci,
      probabilityToBeatControl: null,
      expectedLift: null,
      expectedLiftInterval: null,
      thompsonWeight: 0,
    };
  });
}

export function runBayesianConversionAnalysis(
  variants: BayesianAnalysisInput[],
  options: { isBandit?: boolean; minSampleSize?: number } = {},
): BayesianAnalysisResult {
  const { isBandit = false, minSampleSize = 100 } = options;
  const results = bayesianConversionAnalysis(variants);
  const controlInput = variants.find((v) => v.isControl) ?? variants[0];
  const control = results.find((r) => r.variantKey === controlInput?.variantKey) ?? results[0];

  const totalSamples = MONTE_CARLO_SAMPLES;
  const thompsonCounts: Record<string, number> = {};
  results.forEach((r) => (thompsonCounts[r.variantKey] = 0));

  for (let i = 0; i < totalSamples; i++) {
    let best = -Infinity;
    let bestKey = '';
    for (const r of results) {
      const s = betaSample(r.alpha, r.beta);
      if (s > best) {
        best = s;
        bestKey = r.variantKey;
      }
    }
    thompsonCounts[bestKey] = (thompsonCounts[bestKey] ?? 0) + 1;
  }

  const totalCounts = Object.values(thompsonCounts).reduce((s, v) => s + v, 0);
  results.forEach((r) => {
    r.thompsonWeight = (thompsonCounts[r.variantKey] ?? 0) / totalCounts;
  });

  if (control) {
    for (const r of results) {
      if (r.variantKey === control.variantKey) {
        r.probabilityToBeatControl = null;
        r.expectedLift = 0;
        r.expectedLiftInterval = [0, 0];
        continue;
      }
      r.probabilityToBeatControl = computeProbabilityToBeatControl(
        r.alpha,
        r.beta,
        control.alpha,
        control.beta,
      );
      const { lift, interval } = computeExpectedLift(r.alpha, r.beta, control.alpha, control.beta);
      r.expectedLift = lift;
      r.expectedLiftInterval = interval;
    }
  }

  const minSampleReached = variants.every(
    (v) => v.exposures >= minSampleSize && v.conversions >= 5,
  );

  let recommendedVariant: string | null = null;
  if (minSampleReached) {
    const treatments = results.filter((r) => r.variantKey !== (control?.variantKey ?? ''));
    const best = treatments.reduce(
      (prev, cur) =>
        (cur.probabilityToBeatControl ?? 0) > (prev.probabilityToBeatControl ?? 0) ? cur : prev,
      treatments[0] ?? results[0],
    );
    if (best && (best.probabilityToBeatControl ?? 0) >= 0.95) {
      recommendedVariant = best.variantKey;
    }
  }

  const banditWeights: Record<string, number> = {};
  results.forEach((r) => (banditWeights[r.variantKey] = r.thompsonWeight));

  const maxExposures = Math.max(...variants.map((v) => v.exposures));
  const sampleSizeRecommendation = Math.max(0, minSampleSize - maxExposures);

  return {
    analysisType: 'beta_binomial',
    variants: results,
    recommendedVariant,
    isBandit,
    banditWeights,
    minSampleSizeReached: minSampleReached,
    sampleSizeRecommendation,
  };
}

export function runBayesianContinuousAnalysis(
  variants: BayesianAnalysisInput[],
  options: { isBandit?: boolean; minSampleSize?: number } = {},
): BayesianAnalysisResult {
  const { isBandit = false, minSampleSize = 100 } = options;

  const results: BayesianContinuousResult[] = variants.map((v) => {
    const n = v.exposures;
    const sum = v.metricSum ?? 0;
    const sumSq = v.metricSumSq ?? 0;
    const xBar = n > 0 ? sum / n : 0;
    const sampleVar = n > 1 ? (sumSq - n * xBar ** 2) / (n - 1) : 1;

    const kappa0 = 1;
    const mu0 = 0;
    const alpha0 = 1;
    const beta0 = 1;

    const kappaN = kappa0 + n;
    const muN = (kappa0 * mu0 + sum) / kappaN;
    const alphaN = alpha0 + n / 2;
    const betaN =
      beta0 +
      0.5 * (sampleVar * (n - 1) + (kappa0 * n * (xBar - mu0) ** 2) / kappaN);

    const posteriorSigma = Math.sqrt(Math.max(0.0001, betaN / alphaN));
    const ci: [number, number] = [muN - 1.96 * posteriorSigma, muN + 1.96 * posteriorSigma];

    return {
      variantKey: v.variantKey,
      posteriorMu: muN,
      posteriorSigma,
      credibleInterval: ci,
      probabilityToBeatControl: null,
      expectedLift: null,
      thompsonWeight: 0,
    };
  });

  const controlInput = variants.find((v) => v.isControl) ?? variants[0];
  const control = results.find((r) => r.variantKey === controlInput?.variantKey) ?? results[0];
  const totalSamples = MONTE_CARLO_SAMPLES;
  const thompsonCounts: Record<string, number> = {};
  results.forEach((r) => (thompsonCounts[r.variantKey] = 0));

  for (let i = 0; i < totalSamples; i++) {
    let best = -Infinity;
    let bestKey = '';
    for (const r of results) {
      const s = r.posteriorMu + r.posteriorSigma * normalSample();
      if (s > best) {
        best = s;
        bestKey = r.variantKey;
      }
    }
    thompsonCounts[bestKey] = (thompsonCounts[bestKey] ?? 0) + 1;
  }

  const totalCounts = Object.values(thompsonCounts).reduce((s, v) => s + v, 0);
  results.forEach((r) => {
    r.thompsonWeight = (thompsonCounts[r.variantKey] ?? 0) / totalCounts;
  });

  if (control) {
    for (const r of results) {
      if (r.variantKey === control.variantKey) {
        r.probabilityToBeatControl = null;
        r.expectedLift = 0;
        continue;
      }
      let wins = 0;
      const liftSamples: number[] = [];
      for (let i = 0; i < totalSamples; i++) {
        const treat = r.posteriorMu + r.posteriorSigma * normalSample();
        const ctrl = control.posteriorMu + control.posteriorSigma * normalSample();
        if (treat > ctrl) wins++;
        if (ctrl !== 0) liftSamples.push((treat - ctrl) / Math.abs(ctrl));
      }
      r.probabilityToBeatControl = wins / totalSamples;
      r.expectedLift = liftSamples.reduce((s, v) => s + v, 0) / liftSamples.length;
    }
  }

  const minSampleReached = variants.every((v) => v.exposures >= minSampleSize);
  let recommendedVariant: string | null = null;
  if (minSampleReached && control) {
    const treatments = results.filter((r) => r.variantKey !== control.variantKey);
    const best = treatments.reduce(
      (prev, cur) =>
        (cur.probabilityToBeatControl ?? 0) > (prev.probabilityToBeatControl ?? 0) ? cur : prev,
      treatments[0],
    );
    if (best && (best.probabilityToBeatControl ?? 0) >= 0.95) {
      recommendedVariant = best.variantKey;
    }
  }

  const banditWeights: Record<string, number> = {};
  results.forEach((r) => (banditWeights[r.variantKey] = r.thompsonWeight));

  const maxExposures = Math.max(...variants.map((v) => v.exposures));

  return {
    analysisType: 'normal_normal',
    variants: results,
    recommendedVariant,
    isBandit,
    banditWeights,
    minSampleSizeReached: minSampleReached,
    sampleSizeRecommendation: Math.max(0, minSampleSize - maxExposures),
  };
}

export function thompsonSampleVariant(banditWeights: Record<string, number>): string {
  const keys = Object.keys(banditWeights);
  const weights = keys.map((k) => banditWeights[k] ?? 0);
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return keys[Math.floor(Math.random() * keys.length)] ?? keys[0] ?? '';
  let r = Math.random() * totalWeight;
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return keys[i] ?? '';
  }
  return keys[keys.length - 1] ?? '';
}
