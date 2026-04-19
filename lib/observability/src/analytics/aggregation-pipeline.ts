import type { AnalyticsGranularity, MetricDataPoint, MetricQueryResult } from "./types.js";
import { calculate } from "./metric-definitions.js";

// ---------------------------------------------------------------------------
// Time bucket helpers
// ---------------------------------------------------------------------------

export function getBucketStart(date: Date, granularity: AnalyticsGranularity): Date {
  const d = new Date(date);
  switch (granularity) {
    case "minute":
      d.setSeconds(0, 0);
      return d;
    case "hour":
      d.setMinutes(0, 0, 0);
      return d;
    case "day":
      d.setHours(0, 0, 0, 0);
      return d;
    case "week": {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month":
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
  }
}

export function getBucketEnd(bucketStart: Date, granularity: AnalyticsGranularity): Date {
  const d = new Date(bucketStart);
  switch (granularity) {
    case "minute": d.setMinutes(d.getMinutes() + 1); return d;
    case "hour": d.setHours(d.getHours() + 1); return d;
    case "day": d.setDate(d.getDate() + 1); return d;
    case "week": d.setDate(d.getDate() + 7); return d;
    case "month": d.setMonth(d.getMonth() + 1); return d;
  }
}

export function generateBuckets(from: Date, to: Date, granularity: AnalyticsGranularity): Array<{ start: Date; end: Date }> {
  const buckets: Array<{ start: Date; end: Date }> = [];
  let current = getBucketStart(from, granularity);
  while (current < to) {
    const end = getBucketEnd(current, granularity);
    buckets.push({ start: new Date(current), end: new Date(end) });
    current = end;
  }
  return buckets;
}

// ---------------------------------------------------------------------------
// In-memory aggregation (used when DB is not available or for real-time)
// ---------------------------------------------------------------------------

export interface RawDataRow {
  timestamp: Date;
  numericValue?: number;
  dimensions?: Record<string, string>;
  eventName: string;
  properties?: Record<string, unknown>;
}

export function aggregateRows(
  rows: RawDataRow[],
  granularity: AnalyticsGranularity,
  from: Date,
  to: Date,
  calculationType: string,
  dimensionFilter?: Record<string, string>
): MetricDataPoint[] {
  const filtered = dimensionFilter
    ? rows.filter(r => Object.entries(dimensionFilter).every(([k, v]) => r.dimensions?.[k] === v))
    : rows;

  const buckets = generateBuckets(from, to, granularity);
  return buckets.map(({ start, end }) => {
    const inBucket = filtered.filter(r => r.timestamp >= start && r.timestamp < end);
    const values = inBucket.map(r => r.numericValue ?? 1);
    const value = calculate(values, calculationType as Parameters<typeof calculate>[1]);
    return {
      timestamp: start,
      value,
      sampleCount: inBucket.length,
    };
  });
}

// ---------------------------------------------------------------------------
// Rolling window statistics
// ---------------------------------------------------------------------------

export interface RollingStats {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  count: number;
  p50: number;
  p95: number;
  p99: number;
}

export function computeRollingStats(values: number[]): RollingStats {
  if (values.length === 0) {
    return { mean: 0, stddev: 0, min: 0, max: 0, count: 0, p50: 0, p95: 0, p99: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const stddev = Math.sqrt(variance);
  const percentile = (p: number) => sorted[Math.max(0, Math.floor(n * p) - 1)];
  return {
    mean,
    stddev,
    min: sorted[0]!,
    max: sorted[n - 1]!,
    count: n,
    p50: percentile(0.5)!,
    p95: percentile(0.95)!,
    p99: percentile(0.99)!,
  };
}

// ---------------------------------------------------------------------------
// Trend detection
// ---------------------------------------------------------------------------

export function detectTrend(dataPoints: MetricDataPoint[]): "up" | "down" | "stable" {
  if (dataPoints.length < 3) return "stable";
  const values = dataPoints.map(d => d.value);
  const n = values.length;
  const half = Math.floor(n / 2);
  const firstHalfMean = values.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const secondHalfMean = values.slice(half).reduce((s, v) => s + v, 0) / (n - half);
  const changePct = firstHalfMean !== 0 ? ((secondHalfMean - firstHalfMean) / firstHalfMean) * 100 : 0;
  if (changePct > 5) return "up";
  if (changePct < -5) return "down";
  return "stable";
}

// ---------------------------------------------------------------------------
// Metric query result builder
// ---------------------------------------------------------------------------

export function buildMetricQueryResult(
  metricId: string,
  domain: string,
  granularity: AnalyticsGranularity,
  from: Date,
  to: Date,
  dataPoints: MetricDataPoint[]
): MetricQueryResult {
  const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  const currentValue = latest?.value ?? 0;
  const previousValue = prev?.value;
  const changePercent = previousValue != null && previousValue !== 0
    ? ((currentValue - previousValue) / previousValue) * 100
    : undefined;

  return {
    metricId,
    domain,
    granularity,
    periodStart: from,
    periodEnd: to,
    dataPoints: sorted,
    currentValue,
    ...(previousValue !== undefined ? { previousValue } : {}),
    ...(changePercent !== undefined ? { changePercent } : {}),
    trend: detectTrend(sorted),
  };
}

// ---------------------------------------------------------------------------
// Materialized snapshot computation (used by background job)
// ---------------------------------------------------------------------------

export interface SnapshotJob {
  metricId: string;
  domain: string;
  granularity: AnalyticsGranularity;
  periodStart: Date;
  value: number;
  sampleCount: number;
  dimensions?: Record<string, string>;
}

export function planSnapshotJobs(
  metricIds: string[],
  granularities: AnalyticsGranularity[],
  lookbackHours: number
): Array<{ metricId: string; granularity: AnalyticsGranularity; from: Date; to: Date }> {
  const now = new Date();
  const from = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
  const jobs: Array<{ metricId: string; granularity: AnalyticsGranularity; from: Date; to: Date }> = [];
  for (const metricId of metricIds) {
    for (const granularity of granularities) {
      jobs.push({ metricId, granularity, from, to: now });
    }
  }
  return jobs;
}
