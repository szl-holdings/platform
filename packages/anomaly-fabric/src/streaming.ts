import type {
  AnomalyDetectionResult,
  AnomalyEvent,
  StreamingDetectionInput,
} from './types.js';
import { AnomalyDetectionResultSchema, AnomalyEventSchema } from './types.js';

interface RollingWindow {
  values: number[];
  timestamps: string[];
}

const windows = new Map<string, RollingWindow>();

function getWindow(key: string, maxSizeMs: number, nowMs: number): RollingWindow {
  const win = windows.get(key) ?? { values: [], timestamps: [] };
  const cutoff = new Date(nowMs - maxSizeMs).toISOString();
  const filtered: RollingWindow = { values: [], timestamps: [] };
  for (let i = 0; i < win.timestamps.length; i++) {
    const ts = win.timestamps[i];
    const val = win.values[i];
    if (ts !== undefined && val !== undefined && ts >= cutoff) {
      filtered.timestamps.push(ts);
      filtered.values.push(val);
    }
  }
  windows.set(key, filtered);
  return filtered;
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

function generateId(): string {
  return `anom-stream-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function detectStreaming(
  input: StreamingDetectionInput,
): Promise<AnomalyDetectionResult> {
  const start = Date.now();
  const { point, windowSizeMs, sensitivitySigma, lane } = input;
  const key = `${lane ?? 'global'}::${point.metricName}`;
  const nowMs = new Date(point.timestamp).getTime();
  const win = getWindow(key, windowSizeMs, nowMs);

  const mu = mean(win.values);
  const sigma = stddev(win.values, mu);
  const zScore = sigma > 0 ? (point.value - mu) / sigma : 0;

  win.values.push(point.value);
  win.timestamps.push(point.timestamp);
  windows.set(key, win);

  const anomalies: AnomalyEvent[] = [];

  if (win.values.length >= 5 && Math.abs(zScore) >= sensitivitySigma) {
    const kind = zScore > 0 ? 'spike' : 'drop';
    const severity =
      Math.abs(zScore) >= sensitivitySigma * 1.5
        ? 'critical'
        : Math.abs(zScore) >= sensitivitySigma * 1.2
          ? 'high'
          : Math.abs(zScore) >= sensitivitySigma
            ? 'medium'
            : 'low';

    const event = AnomalyEventSchema.parse({
      id: generateId(),
      mode: 'streaming',
      kind,
      severity,
      metricName: point.metricName,
      lane: point.lane ?? lane,
      entityId: point.entityId,
      observedValue: point.value,
      expectedRange: {
        lower: mu - sensitivitySigma * sigma,
        upper: mu + sensitivitySigma * sigma,
        baseline: mu,
      },
      zScore,
      confidence: Math.min(0.99, Math.abs(zScore) / (sensitivitySigma * 2)),
      detectedAt: new Date().toISOString(),
      tags: point.tags,
      suppressed: false,
      correlatedHeads: [],
    });
    anomalies.push(event);
  }

  return AnomalyDetectionResultSchema.parse({
    anomalies,
    processedCount: 1,
    anomalyRate: anomalies.length,
    processingMs: Date.now() - start,
    mode: 'streaming',
  });
}
