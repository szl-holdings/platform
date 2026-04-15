import type {
  MetricQueryParams,
  BulkQueryParams,
  MetricQueryResult,
  AnalyticsGranularity,
  MetricDataPoint,
} from "./types.js";
import { buildMetricQueryResult, generateBuckets } from "./aggregation-pipeline.js";

// ---------------------------------------------------------------------------
// Default granularity selection based on time range
// ---------------------------------------------------------------------------

export function selectGranularity(from: Date, to: Date): AnalyticsGranularity {
  const rangeMs = to.getTime() - from.getTime();
  const hours = rangeMs / (1000 * 60 * 60);

  if (hours <= 2) return "minute";
  if (hours <= 48) return "hour";
  if (hours <= 336) return "day";  // 14 days
  if (hours <= 2160) return "week"; // 90 days
  return "month";
}

// ---------------------------------------------------------------------------
// Time range parsing (e.g. "7d", "30d", "24h", "90d")
// ---------------------------------------------------------------------------

export function parseTimeRange(range: string): { from: Date; to: Date } {
  const now = new Date();
  const match = /^(\d+)([mhdwM])$/.exec(range);
  if (!match) {
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  let ms = 0;
  switch (unit) {
    case "m": ms = value * 60 * 1000; break;
    case "h": ms = value * 60 * 60 * 1000; break;
    case "d": ms = value * 24 * 60 * 60 * 1000; break;
    case "w": ms = value * 7 * 24 * 60 * 60 * 1000; break;
    case "M": ms = value * 30 * 24 * 60 * 60 * 1000; break;
  }

  return { from: new Date(now.getTime() - ms), to: now };
}

// ---------------------------------------------------------------------------
// In-memory query engine (for real-time and demo data)
// ---------------------------------------------------------------------------

const _metricCache = new Map<string, { dataPoints: MetricDataPoint[]; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function cacheMetricResult(metricId: string, dataPoints: MetricDataPoint[]): void {
  _metricCache.set(metricId, { dataPoints, cachedAt: Date.now() });
}

export function getCachedMetric(metricId: string): MetricDataPoint[] | null {
  const cached = _metricCache.get(metricId);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    _metricCache.delete(metricId);
    return null;
  }
  return cached.dataPoints;
}

export function evictCache(metricId?: string): void {
  if (metricId) {
    _metricCache.delete(metricId);
  } else {
    _metricCache.clear();
  }
}

// ---------------------------------------------------------------------------
// Query result builder from raw data points
// ---------------------------------------------------------------------------

export function queryMetric(
  params: MetricQueryParams,
  rawDataPoints: MetricDataPoint[]
): MetricQueryResult {
  const granularity = params.granularity ?? selectGranularity(params.from, params.to);

  const filtered = rawDataPoints.filter(
    dp => dp.timestamp >= params.from && dp.timestamp <= params.to
  );

  if (params.dimensions) {
    const filtered2 = filtered.filter(dp => {
      if (!dp.dimensions) return false;
      return Object.entries(params.dimensions!).every(([k, v]) => dp.dimensions?.[k] === v);
    });
    return buildMetricQueryResult(params.metricId, params.domain ?? "", granularity, params.from, params.to, filtered2);
  }

  return buildMetricQueryResult(params.metricId, params.domain ?? "", granularity, params.from, params.to, filtered);
}

// ---------------------------------------------------------------------------
// Bulk query — return multiple metrics in one pass
// ---------------------------------------------------------------------------

export function bulkQueryMetrics(
  params: BulkQueryParams,
  dataSource: (metricId: string) => MetricDataPoint[]
): Record<string, MetricQueryResult> {
  const granularity = params.granularity ?? selectGranularity(params.from, params.to);
  const results: Record<string, MetricQueryResult> = {};

  for (const metricId of params.metrics) {
    const rawPoints = dataSource(metricId);
    const filtered = rawPoints.filter(dp => dp.timestamp >= params.from && dp.timestamp <= params.to);
    results[metricId] = buildMetricQueryResult(
      metricId,
      params.domain ?? "",
      granularity,
      params.from,
      params.to,
      filtered
    );
  }

  return results;
}

// ---------------------------------------------------------------------------
// Comparison query — current vs. previous period
// ---------------------------------------------------------------------------

export interface ComparisonQueryResult {
  current: MetricQueryResult;
  previous: MetricQueryResult;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

export function compareMetricPeriods(
  params: MetricQueryParams,
  dataSource: (from: Date, to: Date) => MetricDataPoint[]
): ComparisonQueryResult {
  const granularity = params.granularity ?? selectGranularity(params.from, params.to);
  const rangeDuration = params.to.getTime() - params.from.getTime();

  const prevFrom = new Date(params.from.getTime() - rangeDuration);
  const prevTo = new Date(params.to.getTime() - rangeDuration);

  const currentData = dataSource(params.from, params.to).filter(dp => dp.timestamp >= params.from && dp.timestamp <= params.to);
  const prevData = dataSource(prevFrom, prevTo).filter(dp => dp.timestamp >= prevFrom && dp.timestamp <= prevTo);

  const current = buildMetricQueryResult(params.metricId, params.domain ?? "", granularity, params.from, params.to, currentData);
  const previous = buildMetricQueryResult(params.metricId, params.domain ?? "", granularity, prevFrom, prevTo, prevData);

  const changePercent = previous.currentValue !== 0
    ? ((current.currentValue - previous.currentValue) / previous.currentValue) * 100
    : 0;

  const trend: "up" | "down" | "stable" = changePercent > 5 ? "up" : changePercent < -5 ? "down" : "stable";

  return { current, previous, changePercent, trend };
}

// ---------------------------------------------------------------------------
// GraphQL-compatible response formatter
// ---------------------------------------------------------------------------

export interface GraphQLMetricResponse {
  metricId: string;
  domain: string;
  granularity: string;
  currentValue: number;
  previousValue: number | null;
  changePercent: number | null;
  trend: string;
  dataPoints: Array<{ timestamp: string; value: number; sampleCount: number }>;
}

export function toGraphQLResponse(result: MetricQueryResult): GraphQLMetricResponse {
  return {
    metricId: result.metricId,
    domain: result.domain,
    granularity: result.granularity,
    currentValue: result.currentValue,
    previousValue: result.previousValue ?? null,
    changePercent: result.changePercent ?? null,
    trend: result.trend ?? "stable",
    dataPoints: result.dataPoints.map(dp => ({
      timestamp: dp.timestamp.toISOString(),
      value: dp.value,
      sampleCount: dp.sampleCount,
    })),
  };
}
