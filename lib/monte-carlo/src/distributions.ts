export type DistributionType =
  | 'normal'
  | 'log_normal'
  | 'uniform'
  | 'triangular'
  | 'beta'
  | 'poisson'
  | 'constant'
  | 'custom';

export interface NormalDistribution {
  type: 'normal';
  mean: number;
  stdDev: number;
}

export interface LogNormalDistribution {
  type: 'log_normal';
  mean: number;
  stdDev: number;
}

export interface UniformDistribution {
  type: 'uniform';
  min: number;
  max: number;
}

export interface TriangularDistribution {
  type: 'triangular';
  min: number;
  mode: number;
  max: number;
}

export interface BetaDistribution {
  type: 'beta';
  alpha: number;
  beta: number;
  min?: number;
  max?: number;
}

export interface PoissonDistribution {
  type: 'poisson';
  lambda: number;
}

export interface ConstantDistribution {
  type: 'constant';
  value: number;
}

export interface CustomDistribution {
  type: 'custom';
  values: number[];
  weights?: number[];
}

export type Distribution =
  | NormalDistribution
  | LogNormalDistribution
  | UniformDistribution
  | TriangularDistribution
  | BetaDistribution
  | PoissonDistribution
  | ConstantDistribution
  | CustomDistribution;

function randomNormal(mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

function randomBeta(alpha: number, beta: number): number {
  const x = randomGamma(alpha);
  const y = randomGamma(beta);
  return x / (x + y);
}

function randomGamma(shape: number): number {
  if (shape < 1) {
    return randomGamma(1 + shape) * Math.random() ** (1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number;
    let v: number;
    do {
      x = randomNormal(0, 1);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function randomPoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export function sample(dist: Distribution): number {
  switch (dist.type) {
    case 'normal':
      return randomNormal(dist.mean, dist.stdDev);

    case 'log_normal': {
      const lnMean = Math.log(
        (dist.mean * dist.mean) / Math.sqrt(dist.stdDev * dist.stdDev + dist.mean * dist.mean),
      );
      const lnStd = Math.sqrt(Math.log(1 + (dist.stdDev / dist.mean) * (dist.stdDev / dist.mean)));
      return Math.exp(randomNormal(lnMean, lnStd));
    }

    case 'uniform':
      return dist.min + Math.random() * (dist.max - dist.min);

    case 'triangular': {
      const u = Math.random();
      const fc = (dist.mode - dist.min) / (dist.max - dist.min);
      if (u < fc) {
        return dist.min + Math.sqrt(u * (dist.max - dist.min) * (dist.mode - dist.min));
      } else {
        return dist.max - Math.sqrt((1 - u) * (dist.max - dist.min) * (dist.max - dist.mode));
      }
    }

    case 'beta': {
      const raw = randomBeta(dist.alpha, dist.beta);
      const lo = dist.min ?? 0;
      const hi = dist.max ?? 1;
      return lo + raw * (hi - lo);
    }

    case 'poisson':
      return randomPoisson(dist.lambda);

    case 'constant':
      return dist.value;

    case 'custom': {
      if (dist.weights) {
        const totalWeight = dist.weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalWeight;
        for (let i = 0; i < dist.values.length; i++) {
          r -= dist.weights[i]!;
          if (r <= 0) return dist.values[i]!;
        }
        return dist.values[dist.values.length - 1]!;
      }
      return dist.values[Math.floor(Math.random() * dist.values.length)]!;
    }
  }
}

export function sampleBatch(dist: Distribution, n: number): number[] {
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = sample(dist);
  return out;
}

export function distributionStats(values: number[]): DistributionStats {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median: percentile(sorted, 50),
    stdDev,
    variance,
    min: sorted[0]!,
    max: sorted[n - 1]!,
    p5: percentile(sorted, 5),
    p10: percentile(sorted, 10),
    p25: percentile(sorted, 25),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    skewness: calcSkewness(values, mean, stdDev),
    kurtosis: calcKurtosis(values, mean, stdDev),
    confidenceInterval95: {
      lower: mean - 1.96 * (stdDev / Math.sqrt(n)),
      upper: mean + 1.96 * (stdDev / Math.sqrt(n)),
    },
  };
}

export interface DistributionStats {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  skewness: number;
  kurtosis: number;
  confidenceInterval95: { lower: number; upper: number };
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  return sorted[lo]! * (1 - frac) + sorted[hi]! * frac;
}

function calcSkewness(values: number[], mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  const n = values.length;
  const sum = values.reduce((s, v) => s + ((v - mean) / stdDev) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

function calcKurtosis(values: number[], mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  const n = values.length;
  const sum = values.reduce((s, v) => s + ((v - mean) / stdDev) ** 4, 0);
  return sum / n - 3;
}

export function buildHistogram(values: number[], buckets = 50): HistogramBucket[] {
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const width = (max - min) / buckets;
  const histogram: HistogramBucket[] = [];

  for (let i = 0; i < buckets; i++) {
    const lo = min + i * width;
    const hi = lo + width;
    const count = values.filter((v) => v >= lo && (i === buckets - 1 ? v <= hi : v < hi)).length;
    histogram.push({ lo, hi, mid: (lo + hi) / 2, count, frequency: count / values.length });
  }

  return histogram;
}

export interface HistogramBucket {
  lo: number;
  hi: number;
  mid: number;
  count: number;
  frequency: number;
}

export function buildCDF(values: number[], points = 100): CDFPoint[] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const result: CDFPoint[] = [];

  for (let i = 0; i < points; i++) {
    const idx = Math.floor((i / (points - 1)) * (n - 1));
    result.push({ value: sorted[idx]!, cumProb: (idx + 1) / n });
  }

  return result;
}

export interface CDFPoint {
  value: number;
  cumProb: number;
}
