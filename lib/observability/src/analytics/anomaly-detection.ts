import type { AnomalyRecord, AnomalyType, AnomalySeverity, MetricDataPoint } from "./types.js";
import { computeRollingStats } from "./aggregation-pipeline.js";

// ---------------------------------------------------------------------------
// Z-score based spike/drop detection
// ---------------------------------------------------------------------------

export interface AnomalyCandidate {
  timestamp: Date;
  observedValue: number;
  expectedValue: number;
  zScore: number;
  deviationPercent: number;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
}

function computeSeverity(zScore: number): AnomalySeverity {
  const absZ = Math.abs(zScore);
  if (absZ >= 4.0) return "critical";
  if (absZ >= 3.0) return "high";
  if (absZ >= 2.5) return "medium";
  return "low";
}

export function detectAnomalies(
  dataPoints: MetricDataPoint[],
  minDataPoints: number = 14,
  zScoreThreshold: number = 2.5
): AnomalyCandidate[] {
  if (dataPoints.length < minDataPoints) return [];

  const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const candidates: AnomalyCandidate[] = [];

  for (let i = minDataPoints; i < sorted.length; i++) {
    const window = sorted.slice(Math.max(0, i - minDataPoints), i);
    const values = window.map(d => d.value);
    const stats = computeRollingStats(values);

    if (stats.stddev === 0) continue;

    const current = sorted[i];
    if (!current) continue;

    const zScore = (current.value - stats.mean) / stats.stddev;
    const deviationPercent = stats.mean !== 0
      ? Math.abs((current.value - stats.mean) / stats.mean) * 100
      : 0;

    if (Math.abs(zScore) < zScoreThreshold) continue;

    const anomalyType: AnomalyType = zScore > 0 ? "spike" : "drop";
    const severity = computeSeverity(zScore);

    candidates.push({
      timestamp: current.timestamp,
      observedValue: current.value,
      expectedValue: stats.mean,
      zScore,
      deviationPercent,
      anomalyType,
      severity,
    });
  }

  return suppressNoisyAnomalies(candidates);
}

// ---------------------------------------------------------------------------
// Trend change detection (using simple linear regression)
// ---------------------------------------------------------------------------

export function detectTrendChange(dataPoints: MetricDataPoint[], windowSize: number = 14): AnomalyCandidate[] {
  if (dataPoints.length < windowSize * 2) return [];

  const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const candidates: AnomalyCandidate[] = [];

  for (let i = windowSize; i < sorted.length - windowSize; i++) {
    const before = sorted.slice(i - windowSize, i).map(d => d.value);
    const after = sorted.slice(i, i + windowSize).map(d => d.value);

    const beforeMean = before.reduce((s, v) => s + v, 0) / before.length;
    const afterMean = after.reduce((s, v) => s + v, 0) / after.length;

    if (beforeMean === 0) continue;

    const changePct = Math.abs((afterMean - beforeMean) / beforeMean) * 100;
    if (changePct < 20) continue;

    const deviation = afterMean - beforeMean;
    const stddev = computeRollingStats(before).stddev;
    const zScore = stddev > 0 ? deviation / stddev : 0;

    if (Math.abs(zScore) < 2.0) continue;

    const current = sorted[i];
    if (!current) continue;

    candidates.push({
      timestamp: current.timestamp,
      observedValue: afterMean,
      expectedValue: beforeMean,
      zScore,
      deviationPercent: changePct,
      anomalyType: "trend_change",
      severity: computeSeverity(zScore),
    });

    i += windowSize - 1;
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Seasonal deviation detection (compare to same period last week/month)
// ---------------------------------------------------------------------------

export function detectSeasonalDeviation(
  dataPoints: MetricDataPoint[],
  seasonalWindowMs: number = 7 * 24 * 60 * 60 * 1000,
  deviationThresholdPct: number = 30
): AnomalyCandidate[] {
  const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const candidates: AnomalyCandidate[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (!current) continue;

    const seasonalTime = current.timestamp.getTime() - seasonalWindowMs;
    const seasonal = sorted.find(d => Math.abs(d.timestamp.getTime() - seasonalTime) < 60 * 60 * 1000);
    if (!seasonal) continue;

    if (seasonal.value === 0) continue;

    const deviationPct = Math.abs((current.value - seasonal.value) / seasonal.value) * 100;
    if (deviationPct < deviationThresholdPct) continue;

    const zScore = (current.value - seasonal.value) / (seasonal.value * 0.1 + 0.001);

    candidates.push({
      timestamp: current.timestamp,
      observedValue: current.value,
      expectedValue: seasonal.value,
      zScore,
      deviationPercent: deviationPct,
      anomalyType: "seasonal_deviation",
      severity: computeSeverity(zScore),
    });
  }

  return suppressNoisyAnomalies(candidates);
}

// ---------------------------------------------------------------------------
// Missing data detection
// ---------------------------------------------------------------------------

export function detectMissingData(
  dataPoints: MetricDataPoint[],
  expectedIntervalMs: number,
  gapMultiplier: number = 3
): AnomalyCandidate[] {
  if (dataPoints.length < 2) return [];

  const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const candidates: AnomalyCandidate[] = [];
  const expectedGap = expectedIntervalMs * gapMultiplier;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    const gap = curr.timestamp.getTime() - prev.timestamp.getTime();

    if (gap > expectedGap) {
      candidates.push({
        timestamp: new Date((prev.timestamp.getTime() + curr.timestamp.getTime()) / 2),
        observedValue: 0,
        expectedValue: prev.value,
        zScore: 3.5,
        deviationPercent: 100,
        anomalyType: "missing",
        severity: "high",
      });
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Noise suppression — deduplicate closely-grouped anomalies
// ---------------------------------------------------------------------------

function suppressNoisyAnomalies(
  candidates: AnomalyCandidate[],
  suppressWindowMs: number = 60 * 60 * 1000
): AnomalyCandidate[] {
  const suppressed: AnomalyCandidate[] = [];
  const sorted = [...candidates].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let lastTimestamp: number | null = null;
  for (const candidate of sorted) {
    if (lastTimestamp !== null && candidate.timestamp.getTime() - lastTimestamp < suppressWindowMs) {
      continue;
    }
    suppressed.push(candidate);
    lastTimestamp = candidate.timestamp.getTime();
  }

  return suppressed;
}

// ---------------------------------------------------------------------------
// Context builder — what else changed around an anomaly?
// ---------------------------------------------------------------------------

export function buildAnomalyContext(
  anomaly: AnomalyCandidate,
  allMetricsData: Map<string, MetricDataPoint[]>,
  contextWindowMs: number = 2 * 60 * 60 * 1000
): Record<string, unknown> {
  const context: Record<string, unknown> = {
    windowStart: new Date(anomaly.timestamp.getTime() - contextWindowMs).toISOString(),
    windowEnd: new Date(anomaly.timestamp.getTime() + contextWindowMs).toISOString(),
    correlatedMetrics: [] as Array<{ metricId: string; valueAtAnomaly: number; direction: string }>,
  };

  for (const [metricId, points] of allMetricsData) {
    const nearbyPoints = points.filter(
      p => Math.abs(p.timestamp.getTime() - anomaly.timestamp.getTime()) < contextWindowMs
    );
    if (nearbyPoints.length === 0) continue;

    const avgNearby = nearbyPoints.reduce((s, p) => s + p.value, 0) / nearbyPoints.length;
    const allStats = computeRollingStats(points.map(p => p.value));

    if (Math.abs(avgNearby - allStats.mean) > allStats.stddev) {
      (context.correlatedMetrics as Array<{ metricId: string; valueAtAnomaly: number; direction: string }>).push({
        metricId,
        valueAtAnomaly: avgNearby,
        direction: avgNearby > allStats.mean ? "elevated" : "depressed",
      });
    }
  }

  return context;
}

// ---------------------------------------------------------------------------
// Convert candidates to AnomalyRecord
// ---------------------------------------------------------------------------

export function candidateToRecord(
  candidate: AnomalyCandidate,
  metricId: string,
  domain: string,
  context?: Record<string, unknown>
): Omit<AnomalyRecord, "isResolved"> {
  return {
    anomalyId: `anm_${metricId}_${candidate.timestamp.getTime()}`,
    metricId,
    domain,
    anomalyType: candidate.anomalyType,
    severity: candidate.severity,
    detectedAt: new Date(),
    periodStart: candidate.timestamp,
    observedValue: candidate.observedValue,
    expectedValue: candidate.expectedValue,
    deviationPercent: candidate.deviationPercent,
    zScore: candidate.zScore,
    context: context ?? {},
    potentialCauses: inferPotentialCauses(candidate),
  };
}

function inferPotentialCauses(candidate: AnomalyCandidate): string[] {
  const causes: string[] = [];

  switch (candidate.anomalyType) {
    case "spike":
      causes.push("Sudden increase in traffic or load", "External event driving unusual activity", "Data collection error or duplicate events");
      break;
    case "drop":
      causes.push("Service degradation or outage", "Data pipeline interruption", "Seasonal low period", "Deployment rollback");
      break;
    case "trend_change":
      causes.push("Product or feature change", "Market shift", "New user acquisition or churn event");
      break;
    case "seasonal_deviation":
      causes.push("Holiday or seasonal pattern shift", "Marketing campaign impact", "External market event");
      break;
    case "missing":
      causes.push("Data pipeline failure", "Service outage", "Configuration change affecting event emission");
      break;
  }

  return causes;
}
