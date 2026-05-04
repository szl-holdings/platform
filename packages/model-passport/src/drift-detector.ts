/**
 * Drift Detector — Live SLO Self-Policing
 *
 * Subscribes to GenAI telemetry, maintains rolling windows of cost/latency/
 * accuracy per active passport, and emits a DriftSignal when sustained
 * deviation crosses configurable thresholds.
 *
 * On drift signal: callers (api-server) create a proposed successor passport
 * in the registry with deltas pre-filled and route it into the Approval Queue.
 * The detector NEVER auto-approves — it only proposes.
 */

export interface DriftThresholds {
  costMultiplier: number;
  latencyMultiplier: number;
  evalPassRateDrop: number;
  windowMs: number;
  minSamples: number;
}

export const DEFAULT_DRIFT_THRESHOLDS: DriftThresholds = {
  costMultiplier: 1.5,
  latencyMultiplier: 1.5,
  evalPassRateDrop: 0.1,
  windowMs: 5 * 60 * 1000,
  minSamples: 10,
};

export interface DriftSample {
  passportId: string;
  costEstimateUsd: number;
  latencyMs: number;
  accuracy?: number;
  recordedAt: number;
}

export interface DriftMetrics {
  passportId: string;
  sampleCount: number;
  avgCostUsd: number;
  avgLatencyMs: number;
  avgAccuracy: number | null;
  p95LatencyMs: number;
}

export type DriftDimension = 'cost' | 'latency' | 'accuracy';

export interface DriftSignal {
  passportId: string;
  detectedAt: string;
  dimensions: DriftDimension[];
  measured: DriftMetrics;
  declared: {
    costPer1kTokensUsd: number;
    p95LatencyMs: number;
    evalPassRate: number;
  };
  deltas: {
    costDeltaPct: number | null;
    latencyDeltaPct: number | null;
    accuracyDrop: number | null;
  };
  thresholds: DriftThresholds;
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]!;
}

class PassportWindow {
  private samples: DriftSample[] = [];

  constructor(private readonly windowMs: number) {}

  push(sample: DriftSample): void {
    this.samples.push(sample);
    const cutoff = Date.now() - this.windowMs;
    this.samples = this.samples.filter((s) => s.recordedAt >= cutoff);
  }

  metrics(passportId: string): DriftMetrics {
    const costs = this.samples.map((s) => s.costEstimateUsd);
    const latencies = this.samples.map((s) => s.latencyMs);
    const accuracies = this.samples.flatMap((s) =>
      s.accuracy != null ? [s.accuracy] : [],
    );

    return {
      passportId,
      sampleCount: this.samples.length,
      avgCostUsd:
        costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
      avgLatencyMs:
        latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : 0,
      p95LatencyMs: p95(latencies),
      avgAccuracy:
        accuracies.length > 0
          ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
          : null,
    };
  }

  get count(): number {
    return this.samples.length;
  }
}

export type DriftSignalHandler = (signal: DriftSignal) => void | Promise<void>;

class DriftDetector {
  private windows = new Map<string, PassportWindow>();
  private handlers: DriftSignalHandler[] = [];
  private thresholds: DriftThresholds = { ...DEFAULT_DRIFT_THRESHOLDS };
  private passportProfiles = new Map<
    string,
    { costPer1kTokensUsd: number; p95LatencyMs: number; evalPassRate: number }
  >();
  private lastSignalAt = new Map<string, number>();
  /**
   * Persistent drift-active state — set when a drift signal first fires and
   * stays true until the operator explicitly acknowledges via clearDriftActive().
   * Unlike lastSignalAt (which is only a re-notification throttle), this flag
   * survives process restarts when persisted by the caller and provides a
   * definitive "is this passport currently in a drift state?" answer.
   */
  private driftActive = new Set<string>();
  private readonly SIGNAL_COOLDOWN_MS = 60_000;

  configure(thresholds: Partial<DriftThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  registerPassportProfile(
    passportId: string,
    profile: { costPer1kTokensUsd: number; p95LatencyMs: number; evalPassRate: number },
  ): void {
    this.passportProfiles.set(passportId, profile);
  }

  onDrift(handler: DriftSignalHandler): void {
    this.handlers.push(handler);
  }

  record(sample: DriftSample): void {
    if (!this.windows.has(sample.passportId)) {
      this.windows.set(
        sample.passportId,
        new PassportWindow(this.thresholds.windowMs),
      );
    }
    this.windows.get(sample.passportId)!.push(sample);
    this.evaluate(sample.passportId);
  }

  private evaluate(passportId: string): void {
    const window = this.windows.get(passportId);
    if (!window || window.count < this.thresholds.minSamples) return;

    const profile = this.passportProfiles.get(passportId);
    if (!profile) return;

    const now = Date.now();
    const lastSignal = this.lastSignalAt.get(passportId) ?? 0;
    if (now - lastSignal < this.SIGNAL_COOLDOWN_MS) return;

    const measured = window.metrics(passportId);
    const dimensions: DriftDimension[] = [];

    const costDeclaredPer2kTokens = profile.costPer1kTokensUsd * 2;
    const costDeltaPct =
      costDeclaredPer2kTokens > 0
        ? ((measured.avgCostUsd - costDeclaredPer2kTokens) / costDeclaredPer2kTokens) * 100
        : null;

    if (
      costDeltaPct != null &&
      measured.avgCostUsd > costDeclaredPer2kTokens * this.thresholds.costMultiplier
    ) {
      dimensions.push('cost');
    }

    const latencyDeltaPct =
      profile.p95LatencyMs > 0
        ? ((measured.p95LatencyMs - profile.p95LatencyMs) / profile.p95LatencyMs) * 100
        : null;

    if (
      latencyDeltaPct != null &&
      measured.p95LatencyMs > profile.p95LatencyMs * this.thresholds.latencyMultiplier
    ) {
      dimensions.push('latency');
    }

    const accuracyDrop =
      measured.avgAccuracy != null
        ? profile.evalPassRate - measured.avgAccuracy
        : null;

    if (accuracyDrop != null && accuracyDrop > this.thresholds.evalPassRateDrop) {
      dimensions.push('accuracy');
    }

    if (dimensions.length === 0) return;

    this.lastSignalAt.set(passportId, now);
    this.driftActive.add(passportId);

    const signal: DriftSignal = {
      passportId,
      detectedAt: new Date().toISOString(),
      dimensions,
      measured,
      declared: {
        costPer1kTokensUsd: profile.costPer1kTokensUsd,
        p95LatencyMs: profile.p95LatencyMs,
        evalPassRate: profile.evalPassRate,
      },
      deltas: { costDeltaPct, latencyDeltaPct, accuracyDrop },
      thresholds: this.thresholds,
    };

    for (const handler of this.handlers) {
      try {
        void handler(signal);
      } catch {
        /* non-fatal */
      }
    }
  }

  getMetrics(passportId: string): DriftMetrics | null {
    const window = this.windows.get(passportId);
    return window ? window.metrics(passportId) : null;
  }

  /**
   * Returns true if this passport has an active unacknowledged drift state.
   *
   * The drift state is set on the first signal that crosses thresholds and
   * persists until explicitly cleared by clearDriftActive(). This is intentionally
   * NOT the 60s cooldown window — that's only a re-notification throttle to avoid
   * flooding the approval queue with duplicate requests while drift is ongoing.
   */
  isDrifting(passportId: string): boolean {
    return this.driftActive.has(passportId);
  }

  /**
   * Acknowledge and clear the drift-active state for a passport.
   * Call this when an operator reviews and dismisses a drift signal, or when
   * a successor passport is promoted to active.
   */
  clearDriftActive(passportId: string): void {
    this.driftActive.delete(passportId);
    this.lastSignalAt.delete(passportId);
  }

  getAllDriftingPassports(): string[] {
    return [...this.driftActive];
  }

  clearWindow(passportId: string): void {
    this.windows.delete(passportId);
    this.lastSignalAt.delete(passportId);
    this.driftActive.delete(passportId);
  }
}

export const driftDetector = new DriftDetector();
