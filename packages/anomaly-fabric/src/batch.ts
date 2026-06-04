import {
  type AnomalyDetectionResult,
  type AnomalyEvent,
  type BatchDetectionInput,
  AnomalyDetectionResultSchema,
  AnomalyEventSchema,
} from './types.js';
function generateId(): string {
  return `anom-batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function stddev(xs: number[], m: number): number {
  if (xs.length < 2) return 0;
  const variance = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

function klDivergence(p: number[], q: number[]): number {
  const n = Math.min(p.length, q.length);
  let kl = 0;
  for (let i = 0; i < n; i++) {
    const pi = (p[i] ?? 0) + 1e-10;
    const qi = (q[i] ?? 0) + 1e-10;
    kl += pi * Math.log(pi / qi);
  }
  return kl / n;
}

function buildHistogram(values: number[], buckets = 10): number[] {
  if (values.length === 0) return new Array(buckets).fill(0) as number[];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const hist = new Array(buckets).fill(0) as number[];
  for (const v of values) {
    const idx = Math.min(Math.floor(((v - min) / range) * buckets), buckets - 1);
    (hist[idx] as number)++;
  }
  return hist.map((c) => c / values.length);
}

export async function detectBatch(input: BatchDetectionInput): Promise<AnomalyDetectionResult> {
  const start = Date.now();
  const { points, lane, jobId, sensitivitySigma, distributionShiftThreshold } = input;

  const byMetric = new Map<string, typeof points>();
  for (const p of points) {
    const bucket = byMetric.get(p.metricName) ?? [];
    bucket.push(p);
    byMetric.set(p.metricName, bucket);
  }

  const anomalies: AnomalyEvent[] = [];

  for (const [metricName, metricPoints] of byMetric.entries()) {
    const values = metricPoints.map((p) => p.value);
    const mu = mean(values);
    const sigma = stddev(values, mu);

    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    if (firstHalf.length >= 5 && secondHalf.length >= 5) {
      const h1 = buildHistogram(firstHalf);
      const h2 = buildHistogram(secondHalf);
      const kl = klDivergence(h1, h2);
      if (kl > distributionShiftThreshold) {
        const event = AnomalyEventSchema.parse({
          id: generateId(),
          mode: 'batch',
          kind: 'distribution-shift',
          severity: kl > distributionShiftThreshold * 2 ? 'high' : 'medium',
          metricName,
          lane: lane ?? metricPoints[0]?.lane,
          entityId: metricPoints[0]?.entityId,
          observedValue: kl,
          expectedRange: {
            lower: 0,
            upper: distributionShiftThreshold,
            baseline: distributionShiftThreshold / 2,
          },
          confidence: Math.min(0.99, kl / (distributionShiftThreshold * 3)),
          detectedAt: new Date().toISOString(),
          windowStart: metricPoints[0]?.timestamp,
          windowEnd: metricPoints[metricPoints.length - 1]?.timestamp,
          tags: {},
          suppressed: false,
          correlatedHeads: [],
        });
        anomalies.push(event);
      }
    }

    for (const p of metricPoints) {
      const zScore = sigma > 0 ? (p.value - mu) / sigma : 0;
      if (Math.abs(zScore) >= sensitivitySigma) {
        const kind = zScore > 0 ? 'spike' : 'drop';
        const abz = Math.abs(zScore);
        const severity =
          abz >= sensitivitySigma * 1.5
            ? 'critical'
            : abz >= sensitivitySigma * 1.2
              ? 'high'
              : 'medium';

        const event = AnomalyEventSchema.parse({
          id: generateId(),
          mode: 'batch',
          kind,
          severity,
          metricName,
          lane: p.lane ?? lane,
          entityId: p.entityId,
          observedValue: p.value,
          expectedRange: {
            lower: mu - sensitivitySigma * sigma,
            upper: mu + sensitivitySigma * sigma,
            baseline: mu,
          },
          zScore,
          confidence: Math.min(0.99, abz / (sensitivitySigma * 2)),
          detectedAt: new Date().toISOString(),
          windowStart: metricPoints[0]?.timestamp,
          windowEnd: metricPoints[metricPoints.length - 1]?.timestamp,
          tags: p.tags,
          suppressed: false,
          correlatedHeads: [],
        });
        anomalies.push(event);
      }
    }
  }

  const uniqueAnomalyPoints = new Set(
    anomalies.map((a) => a.metricName + '|' + (a.detectedAt ?? '')),
  );
  return AnomalyDetectionResultSchema.parse({
    anomalies,
    processedCount: points.length,
    anomalyRate: points.length > 0 ? Math.min(1, uniqueAnomalyPoints.size / points.length) : 0,
    processingMs: Date.now() - start,
    mode: 'batch',
    jobId,
  });
}
