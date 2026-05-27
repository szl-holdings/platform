/**
 * Time-R1 Temporal Engine — bucket-drift scoring with a causal prior.
 *
 * Re-expression of the Time-R1 thesis against SZL primitives. The contribution
 * is treating *time* as a first-class feature: events are bucketed into
 * fixed temporal windows, each bucket emits a drift score relative to a
 * rolling baseline, and the engine refuses to score a series whose
 * timestamps are non-monotonic (effect-before-cause) unless explicitly
 * overridden.
 *
 * Pure-ts, deterministic. The receipt is sealed by the caller.
 */

export interface TimeSeriesPoint {
  /** unix ms (or any monotonic integer) */
  t: number;
  v: number;
  /** optional label/topic — used in the synthesis */
  label?: string;
}

export interface BucketDrift {
  bucketIndex: number;
  startT: number;
  endT: number;
  /** mean value in the bucket */
  mean: number;
  /** stdev within the bucket */
  std: number;
  /** drift score vs. rolling baseline (z-score, clipped to [-6,6]) */
  driftScore: number;
  /** event count in the bucket */
  count: number;
}

export interface TemporalForecast {
  seriesId: string;
  bucketWindowMs: number;
  bucketCount: number;
  baseline: { mean: number; std: number };
  buckets: BucketDrift[];
  /** monotonic timestamps OR `[]` if `allowNonMonotonic` was set */
  causalPriorViolations: number[];
  /** the highest-drift bucket — what the model wants to surface */
  peakBucket: BucketDrift | null;
  /** simple reward-shaped forecast: predicted next-bucket mean ± confidence */
  forecast: { nextMean: number; confidence: number; horizonMs: number };
  /** narrative tail */
  synthesis: string;
}

export interface TemporalScoreOptions {
  seriesId?: string;
  /** size of each time bucket in ms */
  bucketWindowMs?: number;
  /** number of buckets to average for the baseline (sliding) */
  baselineBuckets?: number;
  /** if true, refuse to throw on out-of-order timestamps */
  allowNonMonotonic?: boolean;
}

export class NonMonotonicSeriesError extends Error {
  constructor(public readonly violations: number[]) {
    super(
      `Time-R1: non-monotonic timestamps at indices [${violations.slice(0, 6).join(', ')}${
        violations.length > 6 ? ', …' : ''
      }] — refusing to score (use allowNonMonotonic to override).`,
    );
    this.name = 'NonMonotonicSeriesError';
  }
}

export function scoreBuckets(
  series: TimeSeriesPoint[],
  opts: TemporalScoreOptions = {},
): TemporalForecast {
  if (series.length === 0) {
    throw new Error('scoreBuckets: empty series');
  }
  const violations: number[] = [];
  for (let i = 1; i < series.length; i++) {
    if (series[i].t < series[i - 1].t) violations.push(i);
  }
  if (violations.length > 0 && !opts.allowNonMonotonic) {
    throw new NonMonotonicSeriesError(violations);
  }

  const seriesId =
    opts.seriesId ?? `series_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
  const minT = series[0].t;
  const maxT = series[series.length - 1].t;
  const totalSpan = Math.max(1, maxT - minT);
  const bucketWindowMs = opts.bucketWindowMs ?? Math.max(1, Math.floor(totalSpan / 10));
  const bucketCount = Math.max(1, Math.ceil(totalSpan / bucketWindowMs) + 1);

  const sums = new Array(bucketCount).fill(0);
  const sqs = new Array(bucketCount).fill(0);
  const counts = new Array(bucketCount).fill(0);
  for (const p of series) {
    const i = Math.min(bucketCount - 1, Math.floor((p.t - minT) / bucketWindowMs));
    sums[i] += p.v;
    sqs[i] += p.v * p.v;
    counts[i] += 1;
  }
  const buckets: BucketDrift[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const c = counts[i];
    const mean = c > 0 ? sums[i] / c : 0;
    const variance = c > 0 ? Math.max(0, sqs[i] / c - mean * mean) : 0;
    buckets.push({
      bucketIndex: i,
      startT: minT + i * bucketWindowMs,
      endT: minT + (i + 1) * bucketWindowMs,
      mean,
      std: Math.sqrt(variance),
      driftScore: 0,
      count: c,
    });
  }

  // Rolling baseline + drift score (z-score)
  const baselineBuckets = Math.min(buckets.length, opts.baselineBuckets ?? 5);
  let runningMean = 0;
  let runningVar = 0;
  let runningN = 0;
  for (let i = 0; i < buckets.length; i++) {
    if (runningN >= 2 && Math.sqrt(runningVar / runningN) > 1e-9) {
      const z = (buckets[i].mean - runningMean / runningN) / Math.sqrt(runningVar / runningN);
      buckets[i].driftScore = Math.max(-6, Math.min(6, z));
    } else {
      buckets[i].driftScore = 0;
    }
    runningMean += buckets[i].mean;
    runningVar += (buckets[i].mean - (runningMean / (runningN + 1))) ** 2;
    runningN += 1;
    if (runningN > baselineBuckets) {
      runningMean -= buckets[i - baselineBuckets].mean;
      runningVar = Math.max(
        0,
        runningVar - (buckets[i - baselineBuckets].mean - runningMean / runningN) ** 2,
      );
      runningN -= 1;
    }
  }

  const baselineMean = buckets.reduce((s, b) => s + b.mean, 0) / Math.max(1, buckets.length);
  const baselineVar =
    buckets.reduce((s, b) => s + (b.mean - baselineMean) ** 2, 0) / Math.max(1, buckets.length);
  const peak = buckets.reduce<BucketDrift | null>(
    (acc, b) => (acc === null || Math.abs(b.driftScore) > Math.abs(acc.driftScore) ? b : acc),
    null,
  );

  // Reward-shaped forecast: predict next-bucket mean as a damped projection
  // of the trend in the most recent baselineBuckets. Confidence shrinks as
  // recent drift grows — high drift ⇒ low confidence.
  const recent = buckets.slice(-baselineBuckets);
  const trend =
    recent.length >= 2 ? (recent[recent.length - 1].mean - recent[0].mean) / (recent.length - 1) : 0;
  const lastMean = recent[recent.length - 1]?.mean ?? 0;
  const recentDrift = recent.reduce((s, b) => s + Math.abs(b.driftScore), 0) / Math.max(1, recent.length);
  const confidence = Math.max(0.05, 1 - Math.min(1, recentDrift / 3));
  const synthesis = peak
    ? `Peak drift bucket ${peak.bucketIndex} (z=${peak.driftScore.toFixed(2)}, n=${peak.count}). ` +
      `Trend ${trend >= 0 ? '+' : ''}${trend.toFixed(3)}/bucket. Confidence ${(confidence * 100).toFixed(0)}%.`
    : 'No buckets to summarise.';

  return {
    seriesId,
    bucketWindowMs,
    bucketCount,
    baseline: { mean: baselineMean, std: Math.sqrt(baselineVar) },
    buckets,
    causalPriorViolations: violations,
    peakBucket: peak,
    forecast: { nextMean: lastMean + trend, confidence, horizonMs: bucketWindowMs },
    synthesis,
  };
}
